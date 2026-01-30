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
      minecraftNick?: string | null
      hasPass?: boolean | null
      discordName?: string | null
      roles?: string[] | null
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    discordId?: string | null
    minecraftNick?: string | null
    hasPass?: boolean | null
    discordName?: string | null
    roles?: string[] | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    discordId?: string | null
    minecraftNick?: string | null
    hasPass?: boolean | null
    discordName?: string | null
    roles?: string[] | null
  }
}