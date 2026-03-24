import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAnthropicClient, GENERATE_PROMPT } from "@/lib/anthropic"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id

    const {
      templateId,
      customerName,
      contactFirst,
      contactLast,
      scope,
      pricing,
      customization,
      logoUrl,
    } = await req.json()

    if (!templateId || !customerName || !scope) {
      return NextResponse.json(
        { error: "templateId, customerName, and scope are required" },
        { status: 400 }
      )
    }

    // Get the template
    const template = await prisma.template.findFirst({
      where: { id: templateId, userId },
    })

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    // Get user's Anthropic API key
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { anthropicKey: true },
    })

    if (!user?.anthropicKey) {
      return NextResponse.json(
        { error: "Please set your Anthropic API key in Settings before generating proposals." },
        { status: 400 }
      )
    }

    // Build the prompt context
    const clientDetails = [
      `Customer/Company Name: ${customerName}`,
      contactFirst ? `Contact First Name: ${contactFirst}` : null,
      contactLast ? `Contact Last Name: ${contactLast}` : null,
      `Scope of Work:\n${scope}`,
      pricing ? `Pricing Details:\n${pricing}` : null,
      customization ? `Additional Customization:\n${customization}` : null,
      logoUrl ? `Logo URL: ${logoUrl}` : null,
    ]
      .filter(Boolean)
      .join("\n\n")

    const templateContext = [
      template.systemPrompt
        ? `TEMPLATE STYLE INSTRUCTIONS:\n${template.systemPrompt}`
        : null,
      template.boilerplate
        ? `BOILERPLATE CONTENT (use as-is for reusable sections):\n${template.boilerplate}`
        : null,
      template.structure
        ? `PROPOSAL STRUCTURE:\n${template.structure}`
        : null,
    ]
      .filter(Boolean)
      .join("\n\n---\n\n")

    // Call Claude to generate the proposal
    const anthropic = createAnthropicClient(user.anthropicKey)
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: `${GENERATE_PROMPT}\n\n${templateContext}\n\n---\n\nCLIENT DETAILS:\n${clientDetails}`,
        },
      ],
    })

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : ""

    // Parse the JSON response
    let generatedData: any
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        generatedData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found in response")
      }
    } catch (parseError) {
      console.error("Failed to parse generated proposal:", parseError)
      return NextResponse.json(
        { error: "Failed to parse the generated proposal. Please try again." },
        { status: 500 }
      )
    }

    // Build HTML from sections
    const htmlSections = generatedData.sections
      .map(
        (section: any) =>
          `<div class="proposal-section" data-type="${section.type}">
  <h2>${section.heading}</h2>
  ${section.content}
</div>`
      )
      .join("\n\n")

    const generatedHtml = `<div class="proposal">
  <h1>${generatedData.title}</h1>
  ${htmlSections}
</div>`

    // Save the proposal
    const proposal = await prisma.proposal.create({
      data: {
        userId,
        templateId,
        customerName,
        contactFirst: contactFirst || null,
        contactLast: contactLast || null,
        scope,
        pricing: pricing || null,
        customization: customization || null,
        logoUrl: logoUrl || null,
        generatedHtml,
        generatedJson: JSON.stringify(generatedData),
        status: "draft",
      },
    })

    return NextResponse.json({ proposal, generatedData }, { status: 201 })
  } catch (error) {
    console.error("Generate error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
