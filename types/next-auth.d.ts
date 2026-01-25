// types/next-auth.d.ts
import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface User {
    id: string
    discordId: string
    minecraftNick?: string | null
    hasPass: boolean
  }

  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      discordId: string
      minecraftNick?: string | null
      hasPass: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    discordId?: string
  }
}