import { Button } from "@/components/ui/button"
import { HelpCircle, Book, Send, MessageSquare, ExternalLink } from "lucide-react"

const infoCards = [
  {
    title: "Часто задаваемые вопросы",
    description: "Возможно ответ на ваш вопрос находится здесь",
    icon: <HelpCircle className="w-5 h-5 text-white" />,
    iconBg: "bg-[#2da44e]", // Зеленый как на скрине
    buttonText: "Перейти к FAQ",
    link: "#",
  },
  {
    title: "Вики сервера",
    description: "В вики находится актуальная информация по множеству вещей, происходящих на сервере",
    icon: <Book className="w-5 h-5 text-white" />,
    iconBg: "bg-[#0a8080]", // Тиловый/Бирюзовый
    buttonText: "Перейти в вики",
    link: "#",
  },
  {
    title: "Telegram канал",
    description: "В канале публикуются новости сервера, а также анонсы скидок и изменений цены",
    icon: <Send className="w-5 h-5 text-white" />,
    iconBg: "bg-[#24a1de]", // Синий Телеграм
    buttonText: "Перейти в канал",
    link: "#",
  },
  {
    title: "Discord сервер",
    description: "На сервере публикуются новости сервера, анонсы ивентов и оповещения",
    icon: <MessageSquare className="w-5 h-5 text-white" />,
    iconBg: "bg-[#5865f2]", // Индиго Дискорд
    buttonText: "Перейти на сервер",
    link: "#",
  },
]

export default function FAQSection() {
  return (
    <section className="w-full bg-[#090D10] py-20 px-6 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Заголовок */}
        <div className="text-center mb-12">
          <h2 className="font-sf text-4xl font-bold mb-3 tracking-tight text-white">
            Остались вопросы?
          </h2>
          <p className="text-zinc-500 text-base font-medium">
            Полезные страницы сайта и соцсети
          </p>
        </div>

        {/* Сетка */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {infoCards.map((card, index) => (
            <div 
              key={index}
              className="bg-[#12181F] p-4 rounded-xl flex flex-col items-start border border-white/[0.02]"
            >
              {/* Квадратная иконка */}
              <div className={`${card.iconBg} w-10 h-10 rounded-lg flex items-center justify-center mb-5`}>
                {card.icon}
              </div>

              {/* Текстовый блок */}
              <h3 className="text-[19px] font-bold text-white mb-2 tracking-tight">
                {card.title}
              </h3>
              <p className="text-zinc-400 text-[14.5px] leading-snug mb-8 antialiased">
                {card.description}
              </p>

              {/* Кнопка во всю ширину */}
              <Button 
                variant="secondary" 
                className="w-full bg-[#2B3A4A] hover:bg-[#3d4e61] text-white border-none h-12 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
                asChild
              >
                <a href={card.link}>
                  {card.buttonText}
                  <ExternalLink className="w-4 h-4 text-zinc-400" />
                </a>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}