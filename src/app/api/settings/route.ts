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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        anthropicKey: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Mask the API key - show only last 4 characters
    let maskedKey: string | null = null
    if (user.anthropicKey) {
      const lastFour = user.anthropicKey.slice(-4)
      maskedKey = `${"*".repeat(user.anthropicKey.length - 4)}${lastFour}`
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      anthropicKey: maskedKey,
      hasApiKey: !!user.anthropicKey,
      createdAt: user.createdAt,
    })
  } catch (error) {
    console.error("GET settings error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await req.json()

    const updateData: Record<string, any> = {}

    if (body.anthropicKey !== undefined) {
      // Allow setting to empty string to clear the key
      updateData.anthropicKey = body.anthropicKey || null
    }

    if (body.name !== undefined) {
      updateData.name = body.name || null
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        anthropicKey: true,
        createdAt: true,
      },
    })

    // Mask the API key in response
    let maskedKey: string | null = null
    if (user.anthropicKey) {
      const lastFour = user.anthropicKey.slice(-4)
      maskedKey = `${"*".repeat(user.anthropicKey.length - 4)}${lastFour}`
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      anthropicKey: maskedKey,
      hasApiKey: !!user.anthropicKey,
      createdAt: user.createdAt,
    })
  } catch (error) {
    console.error("PUT settings error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
