import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAnthropicClient, ANALYZE_PROMPT } from "@/lib/anthropic"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id

    const body = await req.json()
    const { templateId, filename, contentText, fileSize, mimeType, docxStyles } = body

    if (!templateId || !filename || !contentText) {
      return NextResponse.json(
        { error: "templateId, filename, and contentText are required" },
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

    // Save upload record
    const upload = await prisma.upload.create({
      data: {
        userId,
        templateId,
        filename,
        contentText,
        fileSize: fileSize || 0,
        mimeType: mimeType || "application/octet-stream",
      },
    })

    // Save extracted DOCX styles to template if provided
    if (docxStyles && typeof docxStyles === "object") {
      console.log("[upload] Saving DOCX styles to template:", JSON.stringify(docxStyles))
      await prisma.template.update({
        where: { id: templateId },
        data: { styles: JSON.stringify(docxStyles) },
      })
    }

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
