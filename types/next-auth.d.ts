// types/next-auth.d.ts
import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      discordId?: string | null
      banner?: string | null
      roles?: string[]
      minecraftNick?: string | null
      hasPass?: boolean
      discordName?: string | null
    }
  }

  interface User {
    image?: string
    banner?: string
    roles?: string[]
    discordId?: string
    minecraftNick?: string
    hasPass?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    discordId?: string
    banner?: string
    roles?: string[]
    minecraftNick?: string
    hasPass?: boolean
    picture?: string
    discordName?: string
  }
}