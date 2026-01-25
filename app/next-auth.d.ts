// next-auth.d.ts
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      hasPass: boolean
      minecraftNick: string
    } & DefaultSession["user"]
  }

  interface User {
    hasPass?: boolean
    minecraftNick?: string
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    hasPass: boolean
    minecraftNick: string
  }
}