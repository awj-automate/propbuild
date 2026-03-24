import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
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
      include: {
        template: {
          select: { name: true },
        },
      },
    })

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(proposal)
  } catch (error) {
    console.error("GET proposal error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Verify ownership
    const existing = await prisma.proposal.findFirst({
      where: { id: params.id, userId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      )
    }

    const body = await req.json()

    // Only allow updating specific fields
    const allowedFields: Record<string, any> = {}
    if (body.generatedHtml !== undefined)
      allowedFields.generatedHtml = body.generatedHtml
    if (body.generatedJson !== undefined)
      allowedFields.generatedJson =
        typeof body.generatedJson === "string"
          ? body.generatedJson
          : JSON.stringify(body.generatedJson)
    if (body.status !== undefined) allowedFields.status = body.status
    if (body.customerName !== undefined)
      allowedFields.customerName = body.customerName
    if (body.contactFirst !== undefined)
      allowedFields.contactFirst = body.contactFirst
    if (body.contactLast !== undefined)
      allowedFields.contactLast = body.contactLast
    if (body.scope !== undefined) allowedFields.scope = body.scope
    if (body.pricing !== undefined) allowedFields.pricing = body.pricing
    if (body.customization !== undefined)
      allowedFields.customization = body.customization
    if (body.logoUrl !== undefined) allowedFields.logoUrl = body.logoUrl

    const proposal = await prisma.proposal.update({
      where: { id: params.id },
      data: allowedFields,
    })

    return NextResponse.json(proposal)
  } catch (error) {
    console.error("PUT proposal error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Verify ownership
    const existing = await prisma.proposal.findFirst({
      where: { id: params.id, userId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      )
    }

    await prisma.proposal.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE proposal error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
