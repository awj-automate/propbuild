import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAnthropicClient, ANALYZE_PROMPT } from "@/lib/anthropic"
import mammoth from "mammoth"

async function extractTextFromFile(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const ext = filename.toLowerCase().split(".").pop()

  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  if (ext === "pdf") {
    // Simple PDF text extraction: find text between stream markers
    // and extract readable ASCII content
    const text = buffer.toString("latin1")
    const extracted: string[] = []

    // Try to extract text from PDF streams
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g
    let match
    while ((match = streamRegex.exec(text)) !== null) {
      const streamContent = match[1]
      // Extract text shown with Tj or TJ operators
      const tjRegex = /\(([^)]*)\)\s*Tj/g
      let tjMatch
      while ((tjMatch = tjRegex.exec(streamContent)) !== null) {
        extracted.push(tjMatch[1])
      }
      // Extract text from TJ arrays
      const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g
      let tjArrayMatch
      while ((tjArrayMatch = tjArrayRegex.exec(streamContent)) !== null) {
        const items = tjArrayMatch[1]
        const textParts = items.match(/\(([^)]*)\)/g)
        if (textParts) {
          extracted.push(textParts.map((p) => p.slice(1, -1)).join(""))
        }
      }
    }

    // If stream extraction found text, use it
    if (extracted.length > 0) {
      return extracted.join("\n")
    }

    // Fallback: extract any readable text content
    const readableText = buffer
      .toString("utf8")
      .replace(/[^\x20-\x7E\n\r\t]/g, " ")
      .replace(/\s{3,}/g, "\n")
      .trim()

    return readableText || "Could not extract text from PDF. Please upload as .docx or .txt."
  }

  if (ext === "txt" || mimeType.startsWith("text/")) {
    return buffer.toString("utf8")
  }

  throw new Error(`Unsupported file type: .${ext}`)
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const templateId = formData.get("templateId") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!templateId) {
      return NextResponse.json(
        { error: "templateId is required" },
        { status: 400 }
      )
    }

    // Verify template belongs to user
    const template = await prisma.template.findFirst({
      where: { id: templateId, userId },
    })

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    // Extract text from file
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const contentText = await extractTextFromFile(
      buffer,
      file.name,
      file.type
    )

    // Save upload record
    const upload = await prisma.upload.create({
      data: {
        userId,
        templateId,
        filename: file.name,
        contentText,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
      },
    })

    // Get user's Anthropic API key
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { anthropicKey: true },
    })

    if (!user?.anthropicKey) {
      return NextResponse.json(
        {
          upload,
          warning:
            "Upload saved, but template analysis skipped. Please set your Anthropic API key in Settings to enable analysis.",
        },
        { status: 200 }
      )
    }

    // Get all uploads for this template
    const allUploads = await prisma.upload.findMany({
      where: { templateId },
      select: { filename: true, contentText: true },
    })

    const uploadsContext = allUploads
      .map(
        (u, i) =>
          `--- PROPOSAL EXAMPLE ${i + 1}: ${u.filename} ---\n${u.contentText}`
      )
      .join("\n\n")

    // Call Anthropic to analyze
    const anthropic = createAnthropicClient(user.anthropicKey)
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: `${ANALYZE_PROMPT}\n\nHere are the example proposals to analyze:\n\n${uploadsContext}`,
        },
      ],
    })

    // Parse the response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : ""

    // Extract JSON from the response (it may be wrapped in markdown code blocks)
    let analysisJson: any
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysisJson = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found in response")
      }
    } catch (parseError) {
      console.error("Failed to parse analysis response:", parseError)
      return NextResponse.json(
        {
          upload,
          warning: "Upload saved, but template analysis failed to parse.",
        },
        { status: 200 }
      )
    }

    // Update the template with analysis results
    await prisma.template.update({
      where: { id: templateId },
      data: {
        systemPrompt: analysisJson.systemPrompt || "",
        boilerplate: analysisJson.boilerplate || "",
        structure:
          typeof analysisJson.structure === "string"
            ? analysisJson.structure
            : JSON.stringify(analysisJson.structure || []),
      },
    })

    return NextResponse.json({ upload }, { status: 201 })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
