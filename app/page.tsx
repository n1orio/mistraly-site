import SleekHero from "@/components/main"
import JoinSection from "@/components/JoinSection"
import FAQSection from "@/components/FAQSection"

export default function Home() {
  return (
    <main className="bg-[#121212]">
      <SleekHero />
      <JoinSection />
      <FAQSection />
    </main>
  )
}