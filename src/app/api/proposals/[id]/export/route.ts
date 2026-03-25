import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parse as parseHtml, HTMLElement, TextNode } from "node-html-parser"
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx"

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&lsquo;/g, "\u2018")
    .replace(/&rdquo;/g, "\u201D")
    .replace(/&ldquo;/g, "\u201C")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&hellip;/g, "\u2026")
}

interface InlineRun {
  text: string
  bold: boolean
  italic: boolean
}

function extractInlineRuns(
  node: HTMLElement | TextNode,
  bold = false,
  italic = false
): InlineRun[] {
  if (node instanceof TextNode) {
    const text = decodeEntities(node.rawText)
    if (!text.trim()) return []
    return [{ text, bold, italic }]
  }

  const el = node as HTMLElement
  const tag = el.tagName?.toLowerCase() || ""

  const nextBold = bold || tag === "strong" || tag === "b"
  const nextItalic = italic || tag === "em" || tag === "i"

  const runs: InlineRun[] = []
  for (const child of el.childNodes) {
    runs.push(...extractInlineRuns(child as HTMLElement | TextNode, nextBold, nextItalic))
  }
  return runs
}

function htmlToDocxParagraphs(html: string): Paragraph[] {
  const root = parseHtml(html, { blockTextElements: {} })
  const paragraphs: Paragraph[] = []

  function processNode(node: HTMLElement | TextNode) {
    if (node instanceof TextNode) {
      const text = decodeEntities(node.rawText).trim()
      if (text) {
        paragraphs.push(
          new Paragraph({
            spacing: { after: 120 },
            children: [new TextRun({ text, size: 22 })],
          })
        )
      }
      return
    }

    const el = node as HTMLElement
    const tag = el.tagName?.toLowerCase() || ""

    if (tag === "h1") {
      const text = decodeEntities(el.textContent).trim()
      if (text) {
        paragraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
            children: [new TextRun({ text, bold: true, size: 32 })],
          })
        )
      }
      return
    }

    if (tag === "h2") {
      const text = decodeEntities(el.textContent).trim()
      if (text) {
        paragraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            children: [new TextRun({ text, bold: true, size: 28 })],
          })
        )
      }
      return
    }

    if (tag === "h3") {
      const text = decodeEntities(el.textContent).trim()
      if (text) {
        paragraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 160, after: 80 },
            children: [new TextRun({ text, bold: true, size: 24 })],
          })
        )
      }
      return
    }

    if (tag === "p" || tag === "div") {
      const runs = extractInlineRuns(el)
      if (runs.length > 0) {
        paragraphs.push(
          new Paragraph({
            spacing: { after: 120 },
            children: runs.map(
              (r) =>
                new TextRun({
                  text: r.text,
                  bold: r.bold,
                  italics: r.italic,
                  size: 22,
                })
            ),
          })
        )
      }
      return
    }

    if (tag === "ul" || tag === "ol") {
      for (const child of el.childNodes) {
        if (child instanceof HTMLElement && child.tagName?.toLowerCase() === "li") {
          processLi(child)
        }
      }
      return
    }

    if (tag === "li") {
      processLi(el)
      return
    }

    if (tag === "table") {
      // Render tables as simple text rows
      const rows = el.querySelectorAll("tr")
      for (const row of rows) {
        const cells = row.querySelectorAll("td, th")
        const cellTexts = cells.map((c) => decodeEntities(c.textContent).trim())
        const isHeader = row.querySelector("th") !== null
        if (cellTexts.some((t) => t)) {
          paragraphs.push(
            new Paragraph({
              spacing: { after: 60 },
              children: [
                new TextRun({
                  text: cellTexts.join("    |    "),
                  bold: isHeader,
                  size: 22,
                }),
              ],
            })
          )
        }
      }
      return
    }

    if (tag === "br") {
      paragraphs.push(new Paragraph({ children: [] }))
      return
    }

    // For any other element, recurse into children
    for (const child of el.childNodes) {
      processNode(child as HTMLElement | TextNode)
    }
  }

  function processLi(li: HTMLElement) {
    // Check if the li contains block elements (nested lists, headings, etc.)
    const blockTags = ["ul", "ol", "h1", "h2", "h3", "h4", "p", "div", "table"]
    const hasBlocks = blockTags.some((t) => li.querySelector(t) !== null)

    if (hasBlocks) {
      // Process inline content first, then block children
      const inlineText: InlineRun[] = []
      for (const child of li.childNodes) {
        if (child instanceof TextNode) {
          const runs = extractInlineRuns(child)
          inlineText.push(...runs)
        } else if (child instanceof HTMLElement) {
          const childTag = child.tagName?.toLowerCase() || ""
          if (blockTags.includes(childTag)) {
            // Flush inline text as a bullet point first
            if (inlineText.length > 0 && inlineText.some((r) => r.text.trim())) {
              paragraphs.push(
                new Paragraph({
                  bullet: { level: 0 },
                  spacing: { after: 60 },
                  children: inlineText.map(
                    (r) =>
                      new TextRun({
                        text: r.text,
                        bold: r.bold,
                        italics: r.italic,
                        size: 22,
                      })
                  ),
                })
              )
              inlineText.length = 0
            }
            processNode(child)
          } else {
            inlineText.push(...extractInlineRuns(child))
          }
        }
      }
      // Flush remaining inline text
      if (inlineText.length > 0 && inlineText.some((r) => r.text.trim())) {
        paragraphs.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: inlineText.map(
              (r) =>
                new TextRun({
                  text: r.text,
                  bold: r.bold,
                  italics: r.italic,
                  size: 22,
                })
            ),
          })
        )
      }
    } else {
      // Simple li - extract all inline runs
      const runs = extractInlineRuns(li)
      if (runs.length > 0) {
        paragraphs.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: runs.map(
              (r) =>
                new TextRun({
                  text: r.text,
                  bold: r.bold,
                  italics: r.italic,
                  size: 22,
                })
            ),
          })
        )
      }
    }
  }

  for (const child of root.childNodes) {
    processNode(child as HTMLElement | TextNode)
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
      let docParagraphs: Paragraph[] = []

      if (proposal.generatedJson) {
        try {
          const data = JSON.parse(proposal.generatedJson)

          // Title
          docParagraphs.push(
            new Paragraph({
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
              children: [
                new TextRun({
                  text: data.title || "Proposal",
                  bold: true,
                  size: 40,
                }),
              ],
            })
          )

          // Subtitle with customer name
          if (proposal.customerName) {
            docParagraphs.push(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
                children: [
                  new TextRun({
                    text: `Prepared for ${proposal.customerName}`,
                    size: 24,
                    color: "666666",
                  }),
                ],
              })
            )
          }

          // Add each section
          if (data.sections && Array.isArray(data.sections)) {
            for (const section of data.sections) {
              if (section.heading) {
                docParagraphs.push(
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
              }

              if (section.content) {
                const contentParagraphs = htmlToDocxParagraphs(section.content)
                docParagraphs.push(...contentParagraphs)
              }
            }
          }
        } catch {
          if (proposal.generatedHtml) {
            docParagraphs = htmlToDocxParagraphs(proposal.generatedHtml)
          }
        }
      } else if (proposal.generatedHtml) {
        docParagraphs = htmlToDocxParagraphs(proposal.generatedHtml)
      }

      if (docParagraphs.length === 0) {
        return NextResponse.json(
          { error: "No proposal content to export" },
          { status: 400 }
        )
      }

      const doc = new Document({
        sections: [
          {
            children: docParagraphs,
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
