// types/next-auth.d.ts
import "@/types/auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface User {
    id: string
    name: string
    email: string
    minecraftNick?: string
    hasPass?: boolean
  }

  interface Session {
    user: {
      id: string
      name: string
      email: string
      minecraftNick?: string
      hasPass?: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    name: string
    email: string
    minecraftNick?: string
    hasPass?: boolean
  }
}