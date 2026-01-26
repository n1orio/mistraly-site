// components/SessionWrapper.tsx
"use client"

import { useSession, signIn } from "next-auth/react"
import { SessionProvider } from "next-auth/react"

export default function SessionWrapper({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}