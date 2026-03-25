import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx"

function htmlToDocxParagraphs(html: string): Paragraph[] {
  const paragraphs: Paragraph[] = []

  // Strip HTML tags and convert to paragraphs
  // Split by common block-level tags
  const blocks = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(div|p|section)[^>]*>/gi, "\n")
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "%%H1%%$1%%END%%")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "%%H2%%$1%%END%%")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "%%H3%%$1%%END%%")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "%%LI%%$1%%END%%")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "%%BOLD%%$1%%ENDBOLD%%")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "%%ITALIC%%$1%%ENDITALIC%%")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')

  const lines = blocks.split("\n").filter((line) => line.trim())

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed.startsWith("%%H1%%")) {
      const text = trimmed.replace("%%H1%%", "").replace("%%END%%", "").trim()
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text, bold: true, size: 32 })],
        })
      )
    } else if (trimmed.startsWith("%%H2%%")) {
      const text = trimmed.replace("%%H2%%", "").replace("%%END%%", "").trim()
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text, bold: true, size: 28 })],
        })
      )
    } else if (trimmed.startsWith("%%H3%%")) {
      const text = trimmed.replace("%%H3%%", "").replace("%%END%%", "").trim()
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun({ text, bold: true, size: 24 })],
        })
      )
    } else if (trimmed.startsWith("%%LI%%")) {
      const text = trimmed.replace("%%LI%%", "").replace("%%END%%", "").trim()
      const cleanText = text
        .replace(/%%BOLD%%/g, "")
        .replace(/%%ENDBOLD%%/g, "")
        .replace(/%%ITALIC%%/g, "")
        .replace(/%%ENDITALIC%%/g, "")
      paragraphs.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: cleanText })],
        })
      )
    } else {
      // Regular paragraph - handle bold/italic markers
      const children: TextRun[] = []
      const parts = trimmed.split(/(%%BOLD%%|%%ENDBOLD%%|%%ITALIC%%|%%ENDITALIC%%)/)
      let isBold = false
      let isItalic = false

      for (const part of parts) {
        if (part === "%%BOLD%%") {
          isBold = true
          continue
        }
        if (part === "%%ENDBOLD%%") {
          isBold = false
          continue
        }
        if (part === "%%ITALIC%%") {
          isItalic = true
          continue
        }
        if (part === "%%ENDITALIC%%") {
          isItalic = false
          continue
        }
        if (part.trim()) {
          children.push(new TextRun({ text: part, bold: isBold, italics: isItalic }))
        }
      }

      if (children.length > 0) {
        paragraphs.push(new Paragraph({ children }))
      }
    }
  }

  return paragraphs
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id

    const proposal = await prisma.proposal.findFirst({
      where: { id: params.id, userId },
    })

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      )
    }

    const { format } = await req.json()

    if (!format || !["pdf", "docx"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Use 'pdf' or 'docx'." },
        { status: 400 }
      )
    }

    if (format === "docx") {
      // Build Word document from generatedJson sections
      let sections: Paragraph[] = []

      if (proposal.generatedJson) {
        try {
          const data = JSON.parse(proposal.generatedJson)

          // Title
          sections.push(
            new Paragraph({
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
              children: [
                new TextRun({ text: data.title || "Proposal", bold: true, size: 40 }),
              ],
            })
          )

          // Add each section
          if (data.sections && Array.isArray(data.sections)) {
            for (const section of data.sections) {
              // Section heading
              sections.push(
                new Paragraph({
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 400, after: 200 },
                  children: [
                    new TextRun({
                      text: section.heading,
                      bold: true,
                      size: 28,
                    }),
                  ],
                })
              )

              // Section content
              if (section.content) {
                const contentParagraphs = htmlToDocxParagraphs(section.content)
                sections.push(...contentParagraphs)
              }
            }
          }
        } catch {
          // Fallback: use generatedHtml if JSON parsing fails
          if (proposal.generatedHtml) {
            sections = htmlToDocxParagraphs(proposal.generatedHtml)
          }
        }
      } else if (proposal.generatedHtml) {
        sections = htmlToDocxParagraphs(proposal.generatedHtml)
      }

      if (sections.length === 0) {
        return NextResponse.json(
          { error: "No proposal content to export" },
          { status: 400 }
        )
      }

      const doc = new Document({
        sections: [
          {
            children: sections,
          },
        ],
      })

      const buffer = await Packer.toBuffer(doc)

      const filename = `${proposal.customerName.replace(/[^a-zA-Z0-9]/g, "_")}_Proposal.docx`

      return new NextResponse(buffer as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      })
    }

    if (format === "pdf") {
      // Return HTML for client-side rendering and print
      return NextResponse.json({
        html: proposal.generatedHtml || "",
        json: proposal.generatedJson
          ? JSON.parse(proposal.generatedJson)
          : null,
        customerName: proposal.customerName,
      })
    }

    return NextResponse.json({ error: "Unknown format" }, { status: 400 })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
