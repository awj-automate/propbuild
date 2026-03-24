import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id

    const proposals = await prisma.proposal.findMany({
      where: { userId },
      include: {
        template: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const result = proposals.map((p) => ({
      id: p.id,
      customerName: p.customerName,
      contactFirst: p.contactFirst,
      contactLast: p.contactLast,
      scope: p.scope,
      status: p.status,
      templateName: p.template?.name || null,
      templateId: p.templateId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("GET proposals error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
