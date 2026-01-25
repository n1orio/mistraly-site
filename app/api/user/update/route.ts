// app/api/user/update/route.ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { NextRequest } from "next/server"

const prisma = new PrismaClient()

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { minecraftNick } = body

  // Валидация ника (опционально)
  if (minecraftNick && !/^[a-zA-Z0-9_]{3,16}$/.test(minecraftNick)) {
    return Response.json({ error: "Invalid Minecraft nickname" }, { status: 400 })
  }

  try {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { minecraftNick },
    })

    return Response.json({ success: true, minecraftNick: updated.minecraftNick })
  } catch (e) {
    return Response.json({ error: "Failed to update" }, { status: 500 })
  }
}