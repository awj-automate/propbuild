import { NextRequest, NextResponse } from "next/server"
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

    const templates = await prisma.template.findMany({
      where: { userId },
      include: {
        uploads: {
          select: {
            id: true,
            filename: true,
            fileSize: true,
            mimeType: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { uploads: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const result = templates.map((t) => ({
      id: t.id,
      name: t.name,
      systemPrompt: t.systemPrompt,
      boilerplate: t.boilerplate,
      structure: t.structure,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      uploads: t.uploads,
      _count: t._count,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("GET templates error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { name } = await req.json()

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 }
      )
    }

    const template = await prisma.template.create({
      data: {
        userId,
        name: name.trim(),
        systemPrompt: "",
        boilerplate: "",
        structure: "[]",
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error("POST templates error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
