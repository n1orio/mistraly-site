// types/next-auth.d.ts (или в папке где лежат ваши типы)
import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string | null
      discordId?: string
      banner?: string
      roles?: string[]
      image?: string
      discordName?: string
      minecraftNick?: string
      hasPass?: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    discordId?: string
    banner?: string
    roles?: string[]
    picture?: string
    discordName?: string
    minecraftNick?: string
    hasPass?: boolean
  }
}