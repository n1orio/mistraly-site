// types/next-auth.d.ts

import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      image?: string | null
      discordId?: string | null
      discordName?: string | null
      minecraftNick?: string | undefined
      hasPass?: boolean
      banner?: string | null
      roles?: string[]
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    banner?: string | null
    discordId?: string | null
    discordName?: string | null
    minecraftNick?: string | undefined
    hasPass?: boolean
    roles?: string[]
    picture?: string | null
  }
}