"use client"

import { Button } from "@/components/ui/button"
import { HelpCircle, Book, Send, MessageSquare, ExternalLink } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useState } from "react"

const infoCards = [
  {
    id: 1,
    title: "Часто задаваемые вопросы",
    description: "Возможно ответ на ваш вопрос находится здесь",
    icon: <HelpCircle className="w-5 h-5 text-white" />,
    iconBg: "bg-[#2da44e]", // Зеленый как на скрине
    iconHover: "hover:bg-[#268a3f]",
    gradient: "from-[#2da44e]/10 to-transparent",
    buttonText: "Перейти к FAQ",
    link: "/faq",
  },
  {
    id: 2,
    title: "Вики сервера",
    description: "В вики находится актуальная информация по множеству вещей, происходящих на сервере",
    icon: <Book className="w-5 h-5 text-white" />,
    iconBg: "bg-[#0a8080]", // Тиловый/Бирюзовый
    iconHover: "hover:bg-[#086666]",
    gradient: "from-[#0a8080]/10 to-transparent",
    buttonText: "Перейти в вики",
    link: "/wiki",
  },
  {
    id: 3,
    title: "Telegram канал",
    description: "В канале публикуются новости сервера, а также анонсы скидок и изменений цены",
    icon: <Send className="w-5 h-5 text-white" />,
    iconBg: "bg-[#24a1de]", // Синий Телеграм
    iconHover: "hover:bg-[#1e86b8]",
    gradient: "from-[#24a1de]/10 to-transparent",
    buttonText: "Перейти в канал",
    link: "https://t.me/breeze_monster",
    external: true,
  },
  {
    id: 4,
    title: "Discord сервер",
    description: "На сервере публикуются новости сервера, анонсы ивентов и оповещения",
    icon: <MessageSquare className="w-5 h-5 text-white" />,
    iconBg: "bg-[#5865f2]", // Индиго Дискорд
    iconHover: "hover:bg-[#4a56d4]",
    gradient: "from-[#5865f2]/10 to-transparent",
    buttonText: "Перейти на сервер",
    link: "https://discord.gg/nPbWMhDeus",
    external: true,
  },
]

export default function FAQSection() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  return (
    <section className="w-full bg-[#090D10] py-20 px-6 font-sans relative overflow-hidden">
      {/* Фоновые декоративные элементы */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-[#2da44e]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-[#5865f2]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 right-1/3 w-36 h-36 bg-[#0a8080]/5 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        
        {/* Заголовок с анимацией */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-sf text-4xl sm:text-5xl font-bold mb-3 tracking-tight text-white">
            Остались вопросы?
          </h2>
          <p className="text-zinc-500 text-base font-medium">
            Полезные страницы сайта и соцсети
          </p>
        </motion.div>

        {/* Сетка с анимациями */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {infoCards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              onHoverStart={() => setHoveredCard(card.id)}
              onHoverEnd={() => setHoveredCard(null)}
              className="relative group overflow-hidden"
            >
              <div className={`bg-[#12181F] p-5 sm:p-6 rounded-xl flex flex-col items-start border ${hoveredCard === card.id ? `border-${card.iconBg.replace('bg-', '')}/30` : 'border-white/[0.02]'} transition-all duration-300 h-full`}>
                {/* Градиентный фон при наведении */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                {/* Квадратная иконка с анимацией */}
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className={`${card.iconBg} ${card.iconHover} w-10 h-10 rounded-lg flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(0,0,0,0.3)] relative z-10 transition-all duration-300`}
                >
                  {card.icon}
                </motion.div>

                {/* Текстовый блок */}
                <h3 className="text-[19px] font-bold text-white mb-2 tracking-tight relative z-10">
                  {card.title}
                </h3>
                <p className="text-zinc-400 text-[14.5px] leading-snug mb-6 antialiased relative z-10">
                  {card.description}
                </p>

                {/* Кнопка во всю ширину с анимацией */}
                <motion.div 
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full relative z-10"
                >
                  {card.external ? (
                    <a 
                      href={card.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button 
                        className="w-full bg-[#2B3A4A] hover:bg-[#3d4e61] text-white border-none h-12 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-colors shadow-[0_4px_15px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)]"
                      >
                        {card.buttonText}
                        <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                      </Button>
                    </a>
                  ) : (
                    <Link href={card.link} passHref>
                      <Button 
                        className="w-full bg-[#2B3A4A] hover:bg-[#3d4e61] text-white border-none h-12 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-colors shadow-[0_4px_15px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)]"
                      >
                        {card.buttonText}
                        <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                      </Button>
                    </Link>
                  )}
                </motion.div>
              </div>

              {/* Свечение при наведении */}
              <AnimatePresence>
                {hoveredCard === card.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.2)] pointer-events-none"
                  />
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}