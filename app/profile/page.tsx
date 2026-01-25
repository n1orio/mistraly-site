// app/profile/page.tsx
"use client"

import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"
import Image from "next/image"

export default function ProfilePage() {
  const {  : session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080B0E] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#0099ff]" />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080B0E] text-white">
        Не авторизован
      </div>
    )
  }

  const { user } = session

  // ... остальной JSX
}