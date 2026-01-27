"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Info, Sparkles, FlaskConical, ChevronLeft, ChevronRight, ArrowRight, Calendar,
  Users, Shield, Gamepad2, Trophy, Star, Lightbulb 
} from "lucide-react"
import { CheckCircle, Loader2, Clock } from "lucide-react"

const developersData = [
  {
    id: 1,
    name: "Niorio",
    role: "Основатель & Главный разработчик",
    description: "Создатель проекта Breeze. Отвечает за ВСЕ",
    specialization: "Плагины, Бекенд, Дизайн",
    experience: "3+ года",
    avatar: "https://cdn.discordapp.com/attachments/1412469417215791231/1465763419222179850/IMG_2421.jpg?ex=697a4a0f&is=6978f88f&hm=897677cd82f3f2ab82d8a688e6f4045dce3ffd99e55ecac528112da19317c276&"
  },
  {
    id: 2,
    name: "-",
    role: "заглушка",
    description: "заглушка",
    specialization: "заглушка",
    experience: "заглушка",
    avatar: "https://cdn.discordapp.com/attachments/1205083728997515340/1285696051994431488/Screenshot_20240917-231647.png"
  },
  {
    id: 3,
    name: "-",
    role: "заглушка",
    description: "заглушка",
    specialization: "заглушка",
    experience: "заглушка",
    avatar: null
  },
  {
    name: "-",
    role: "заглушка",
    description: "заглушка",
    specialization: "заглушка",
    experience: "заглушка",
    avatar: null
  }
]

const seasonsData = [
  {
    id: 9,
    num: "3",
    date: "22 февраля 2025 г. — 25 марта 2025 г.",
    shortDesc: "Сезон под названием «Кошаник». Полный отказ от старого кастомного контента и глобальная переработка систем с нуля.",
    fullDesc: "Этот сезон получил кодовое имя «Кошаник». Администрация приняла радикальное решение отказаться от всего старого кастомного контента. Все игровые механики и плагины были переписаны с чистого листа для улучшения качества игры. После сезона планировалось множество нового контента, но четвертый сезон так и не был запущен...",
    images: [
      "https://cdn.discordapp.com/attachments/1286793275763589233/1290012709257220116/image.png?ex=69770535&is=6975b3b5&hm=e6435b468cda9ac53377f7c13cde703ecaf9354c858894c045c778d2a4b992c1&",
      "https://cdn.discordapp.com/attachments/1412469417215791231/1464600280736993321/image.png?ex=69760ecd&is=6974bd4d&hm=3442825d04af574d86730f8d7d56f675774b7b79d731878bef77af94d1edfbdf&0",
      "https://cdn.discordapp.com/attachments/1412469417215791231/1464600347040415764/image.png?ex=69760edd&is=6974bd5d&hm=a2c742de5f1745e66293b6d2b306f75956fe2d954be774bcefb3f4e3029c5fe2&",
      "https://media.discordapp.net/attachments/1205083728997515340/1275165931617648642/2024-08-19_21.49.01.png?ex=69770f91&is=6975be11&hm=67d9eece03dd820aa8bfe6f6a7207d883c6e357d6bca6beceb26b9691f45c660&=&format=webp&quality=lossless&width=1642&height=856",
      "https://cdn.discordapp.com/attachments/1412469417215791231/1464600203490230395/image.png?ex=69760ebb&is=6974bd3b&hm=9bb466ab523eac761c6c7698899b26893c20e31303a0a23ba0fb90039d509002&"
    ]
  },
  {
    id: 8,
    num: "2",
    date: "21 сентября 2024 г. — 4 ноября 2024 г.",
    shortDesc: "Короткий, но насыщенный контентом сезон. Было добавлено множество новых предметов и блоков, хотя сюжетное развитие замедлилось.",
    fullDesc: "Сезон запомнился большим количеством технического контента: в игру добавили множество новых предметов, уникальных блоков, нпс и новый спавн в отдельном измерении. Несмотря на то, что сюжет практически не продвигался, а сам сезон оказался коротким, он стал важным этапом в развитии механик сервера.",
    images: [
      "https://media.discordapp.net/attachments/1108478708748132475/1280581375728156826/2024-09-03_20.32.00.png?ex=6976fc98&is=6975ab18&hm=20f5bc7afc1a8b0a0ee63c6e4792c105baaf9e6d4ce50fd30fe099e8a93366e7&=&format=webp&quality=lossless&width=400&height=212",
      "https://cdn.discordapp.com/attachments/1205083728997515340/1284800955669544991/image.png?ex=6975dba2&is=69748a22&hm=c24fd0955e650c5bd61d78b2604c88008dbeabae6187a23e190fda0f6666313f&",
      "https://media.discordapp.net/attachments/1268702666763276420/1280891093596114944/Untitled.png?ex=6976cb8a&is=69757a0a&hm=65ade743888c87ebcb834a2a956b0dbf201ec6afa0b4193be9b9db22f6969cda&=&format=webp&quality=lossless&width=960&height=960",
      "https://media.discordapp.net/attachments/1268702666763276420/1279430370474983504/waystone.png?ex=6976c122&is=69756fa2&hm=3543387f642a55dd5bfe6db318188233f2fefc795781446b981757926ab4812d&=&format=webp&quality=lossless&width=960&height=960",
      "https://media.discordapp.net/attachments/1205083728997515340/1278737535199346883/IMG_20240829_182334.jpg?ex=6976dee2&is=69758d62&hm=849d1fde8da832c01791576750cedc3b9042d5985b611ab7812260c71bd5c02a&=&format=webp&width=712&height=960"
    ]
  },
  {
    id: 7,
    num: "1",
    date: "~ 21 июня 2024г. - 23 августа 2024г.",
    shortDesc: "Пилотный сезон под название «Briz». Время зарождения первых кланов и самой ламповой атмосферы.",
    fullDesc: "Пробный запуск проекта Breeze (тогда ещё Briz). Сезон привлек много новых игроков, став началом формирования первых городов и кланов. Упор был сделан на RP и атмосферу, а уникальный лор раскрывался через записки и события. Финал планировался масштабным, но из-за технической ошибки администратора Evor (опечатка в команде) ивент пошел не по плану, и ситуацию пришлось экстренно спасать.",
    images: [
      "https://cdn.discordapp.com/attachments/1205083728997515340/1285699751857225748/image-2.png?ex=69772673&is=6975d4f3&hm=39989b240e51b40a977181b0993f317fba03d47a743e32ebb75fa1b449a28fa9&",
      "https://cdn.discordapp.com/attachments/1205083728997515340/1285696051994431488/Screenshot_20240917-231647.png?ex=69772301&is=6975d181&hm=f42737203f75a87c6f65a0c8511ee626b670908781a50a2d7e5c6457a8325c3a&%D1%8A"
    ]
  }
]

const tabs = [
  { id: "about", label: "О Breeze", icon: <Info className="w-4 h-4" /> },
  { id: "seasons", label: "Сезоны", icon: <Sparkles className="w-4 h-4" /> },
  { id: "developers", label: "Разработчики", icon: <FlaskConical className="w-4 h-4" /> },
  { id: "plans", label: "Планы", icon: <Lightbulb className="w-4 h-4" /> }, // ✅ Lightbulb (без Icon)
]

const slideVariants = {
  enter: (direction: number) => ({ 
    x: direction > 0 ? 100 : -100,
    opacity: 0,
    scale: 0.95
  }),
  center: { 
    zIndex: 1, 
    x: 0, 
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 },
      scale: { duration: 0.3 }
    }
  },
  exit: (direction: number) => ({ 
    zIndex: 0, 
    x: direction < 0 ? 100 : -100,
    opacity: 0,
    scale: 0.95,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 }
    }
  })
}

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState("about")
  const [selectedSeason, setSelectedSeason] = useState<typeof seasonsData[0] | null>(null)
  const [page, setPage] = useState(0)
  const [direction, setDirection] = useState(0)
  const [activeDeveloper, setActiveDeveloper] = useState(1) // ✅ ВНУТРИ КОМПОНЕНТА

  // ✅ useEffect для сброса разработчика при входе в раздел
  useEffect(() => {
    if (activeTab === "developers") {
      setActiveDeveloper(1);
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedSeason) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setPage(0)
      setDirection(0)
    }
  }, [selectedSeason])

  const changeTab = (tabId: string) => {
    setActiveTab(tabId)
    setSelectedSeason(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen w-full bg-[#090D10] text-white overflow-clip rounded-xl">
      
      <main className="max-w-6xl mx-auto pt-6 pb-16 px-4 sm:px-6 flex flex-col items-center relative">

{/* ТАБЛЕТКА - ЦЕНТРИРОВАННАЯ С АДАПТИВНОЙ ШИРИНОЙ */}
<div className="sticky top-24 z-50 mb-10 w-full max-w-[600px] mx-auto">
  <div className="relative">
    {/* Градиентная подсветка сверху */}
    <div className="absolute -top-px left-0 w-full h-px bg-gradient-to-r from-transparent via-[#0099ff] to-transparent opacity-50" />
    
    {/* Основной контейнер таблетки */}
    <div className="relative bg-[#080B0E] backdrop-blur-xl rounded-xl overflow-hidden border border-white/10">
      <div className="flex w-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => changeTab(tab.id)}
            aria-selected={activeTab === tab.id}
            className={`relative flex-1 flex items-center justify-center gap-2 py-3 text-[13px] sm:text-[14px] font-bold transition-all duration-300 ${
              activeTab === tab.id 
                ? "text-[#0099ff]" 
                : "text-zinc-300 hover:text-white"
            }`}
          >
            <span className={activeTab === tab.id ? "text-[#0099ff]" : "text-zinc-400"}>
              {tab.icon}
            </span>
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label[0]}</span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="active-tab-bg" 
                className="absolute inset-0 bg-[#0099ff]/5 rounded-xl"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
    
    {/* Градиентная подсветка снизу */}
    <div className="absolute -bottom-px left-0 w-full h-px bg-gradient-to-r from-transparent via-[#0099ff] to-transparent opacity-50" />
  </div>
</div>

        <div className="w-full">
          <AnimatePresence mode="wait">
            
            {/* 1. СПИСОК СЕЗОНОВ */}
            {activeTab === "seasons" && !selectedSeason && (
              <motion.div 
                key="seasons-grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <div className="text-center mb-8 sm:mb-12">
                  <h2 className="font-sf text-3xl sm:text-4xl font-bold mb-3 tracking-tight text-white">
                    Список всех сезонов
                  </h2>
                  <p className="text-zinc-500 text-base font-medium max-w-2xl mx-auto px-2">
                    Здесь далеко не вся информация, но она останется в наших сердцах
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {seasonsData.map((season) => (
                    <motion.div 
                      key={season.id} 
                      layoutId={`season-${season.id}`}
                      whileHover={{ y: -5 }}
                      className="group relative flex flex-col bg-[#12181F] border border-white/5 rounded-xl sm:rounded-2xl p-4 cursor-pointer overflow-hidden transition-all shadow-lg hover:shadow-xl hover:border-[#0099ff]/30 gap-3 sm:gap-4"
                      onClick={() => setSelectedSeason(season)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedSeason(season)}
                      aria-label={`Сезон Breeze ${season.num}`}
                    >
                      <div className="relative z-0 aspect-video rounded-lg sm:rounded-xl overflow-hidden bg-zinc-900 shadow-md">
                        <div className="relative w-full h-full">
                          <img 
                            src={season.images[0]} 
                            alt={`Сезон Breeze ${season.num}`} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      </div>

                      <div className="relative flex-1 flex flex-col">
                        <div className="relative z-10 transition-all duration-300">
                            <h4 className="text-xl sm:text-2xl md:text-3xl font-bold font-sf tracking-tight mb-2 text-white transition-colors">
                              Breeze {season.num}
                            </h4>
                            <p className="text-zinc-400 text-[13px] sm:text-[14px] leading-relaxed mb-2">
                              {season.date}
                            </p>
                            <p className="text-zinc-300 text-[13px] sm:text-[14px] leading-relaxed break-words line-clamp-3 sm:line-clamp-4">
                              {season.shortDesc}
                            </p>
                        </div>

                        <div className="mt-auto pt-3 sm:pt-4">
                          <div className="flex items-center gap-2 text-[#0099ff] text-sm font-bold group-hover:gap-3 transition-all duration-300">
                            <span className="text-[12px] sm:text-[13px]">Подробнее</span>
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 2. ПОДРОБНАЯ СТРАНИЦА СЕЗОНА */}
            {activeTab === "seasons" && selectedSeason && (
              <motion.div 
                key="season-details"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-4xl mx-auto"
              >
                <button 
                  onClick={() => setSelectedSeason(null)}
                  aria-label="Вернуться к списку сезонов"
                  className="mb-6 sm:mb-8 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wide group focus:outline-none focus:ring-2 focus:ring-[#0099ff]"
                >
                  <div className="p-2 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </div>
                  Назад к списку
                </button>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div>
                        <div className="text-[#0099ff] font-bold text-xs uppercase tracking-widest mb-1.5">Архив сезона</div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black font-sf tracking-tight text-white leading-tight">
                            Breeze {selectedSeason.num}
                        </h2>
                    </div>
                    
                    <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium bg-[#12181F] px-3 sm:px-4 py-2 rounded-xl border border-white/10 min-w-[180px]">
                        <Calendar className="w-4 h-4 text-zinc-500" />
                        <span className="text-white text-[13px] sm:text-[14px]">{selectedSeason.date}</span>
                    </div>
                </div>

                <div className="relative w-full aspect-video bg-[#12181F] rounded-lg sm:rounded-xl overflow-hidden shadow-xl border border-white/10 mb-6 sm:mb-8">
                  <AnimatePresence initial={false} custom={direction}>
                    {selectedSeason.images.map((src, idx) => (
                      <motion.div
                        key={idx}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate={page === idx ? "center" : "exit"}
                        exit="exit"
                        className="absolute inset-0"
                      >
                        <div className="relative w-full h-full">
                          <img 
                            src={src} 
                            alt={`Скриншот сезона Breeze ${selectedSeason.num}, изображение ${idx + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {selectedSeason.images.length > 1 && (
                    <>
                      <div className="absolute inset-0 flex items-center justify-between px-3 sm:px-4 pointer-events-none z-20">
                        <button 
                          onClick={(e) => { e.stopPropagation(); paginate(-1); }} 
                          aria-label="Предыдущее изображение"
                          className="pointer-events-auto p-2 sm:p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all active:scale-95 backdrop-blur-sm border border-white/10"
                        >
                          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); paginate(1); }} 
                          aria-label="Следующее изображение"
                          className="pointer-events-auto p-2 sm:p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all active:scale-95 backdrop-blur-sm border border-white/10"
                        >
                          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                      </div>
                      
                      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {selectedSeason.images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setPage(idx)}
                            aria-label={`Изображение ${idx + 1} из ${selectedSeason.images.length}`}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              idx === page 
                                ? "bg-white w-4" 
                                : "bg-white/40 hover:bg-white/60"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="w-full text-left prose prose-invert max-w-none">
                  <p className="text-zinc-300 text-base sm:text-lg leading-relaxed font-medium">
                    {selectedSeason.fullDesc}
                  </p>
                </div>
              </motion.div>
            )}

            {/* --- ВКЛАДКА ABOUT --- */}
            {activeTab === "about" && (
              <motion.div 
                key="about"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <div className="text-center mb-8 sm:mb-12">
                  <h2 className="font-sf text-3xl sm:text-4xl font-bold mb-3 tracking-tight text-white">
                    О проекте Breeze (Заглушка)
                  </h2>
                  <p className="text-zinc-500 text-base font-medium max-w-2xl mx-auto">
                    Узнайте больше о нашей истории и философии
                  </p>
                </div>

                <div className="bg-[#12181F] border border-white/5 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-xl mb-6">
                  <h3 className="text-2xl sm:text-3xl font-bold font-sf mb-4 text-white">Наша история</h3>
                  <p className="text-zinc-300 text-base leading-relaxed font-medium mb-4">
                    -
                  </p>
                  <p className="text-zinc-300 text-base leading-relaxed font-medium">
                    -
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                  <div className="bg-[#12181F] border border-white/5 rounded-xl p-5 sm:p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#0099ff]/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-[#0099ff]" />
                      </div>
                      <h4 className="text-xl font-bold text-white">Сообщество</h4>
                    </div>
                    <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
                      -
                    </p>
                  </div>

                  <div className="bg-[#12181F] border border-white/5 rounded-xl p-5 sm:p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#0099ff]/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-[#0099ff]" />
                      </div>
                      <h4 className="text-xl font-bold text-white">Честность</h4>
                    </div>
                    <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
                      -
                    </p>
                  </div>

                  <div className="bg-[#12181F] border border-white/5 rounded-xl p-5 sm:p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#0099ff]/20 flex items-center justify-center">
                        <Gamepad2 className="w-5 h-5 text-[#0099ff]" />
                      </div>
                      <h4 className="text-xl font-bold text-white">Творчество</h4>
                    </div>
                    <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
                      -
                    </p>
                  </div>

                  <div className="bg-[#12181F] border border-white/5 rounded-xl p-5 sm:p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#0099ff]/20 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-[#0099ff]" />
                      </div>
                      <h4 className="text-xl font-bold text-white">Развитие</h4>
                    </div>
                    <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
                      -
                    </p>
                  </div>
                </div>


                <div className="bg-[#12181F] border border-white/5 rounded-xl p-6 sm:p-8 shadow-xl">
                  <h3 className="text-2xl font-bold font-sf mb-4 text-white">Наши ценности</h3>
                  <ul className="space-y-3 text-zinc-300 text-base leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="text-[#0099ff]">✓</span>
                      <span>-</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#0099ff]">✓</span>
                      <span>-</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#0099ff]">✓</span>
                      <span>-</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#0099ff]">✓</span>
                      <span>-</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}

{activeTab === "developers" && (
  <motion.div 
    key="devs"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
    className="w-full"
  >
    <div className="text-center mb-8 sm:mb-12">
      <h2 className="font-sf text-3xl sm:text-4xl font-bold mb-3 tracking-tight text-white">
        Команда разработки
      </h2>
      <p className="text-zinc-500 text-base font-medium max-w-2xl mx-auto">
        Люди, которые делают Breeze лучше с каждым днём
      </p>
    </div>

    <div className="sticky top-32 z-40 mb-10 w-full max-w-[400px] mx-auto">
      <div className="relative">
        {/* Градиентная подсветка сверху */}
        <div className="absolute -top-px left-0 w-full h-px bg-gradient-to-r from-transparent via-[#0099ff] to-transparent opacity-50" />
        
        {/* Контейнер таблетки */}
        <div className="relative bg-[#080B0E]/85 backdrop-blur-xl rounded-xl overflow-hidden border border-white/10">
          <div className="flex w-full">
            {developersData.map((dev) => (
              <button
                key={dev.id}
                onClick={() => setActiveDeveloper(dev.id)}
                aria-selected={activeDeveloper === dev.id}
                className={`relative flex-1 flex items-center justify-center gap-2 py-3.5 text-[13px] sm:text-[14px] font-bold transition-all duration-300 ${
                  activeDeveloper === dev.id 
                    ? "text-[#0099ff]" 
                    : "text-zinc-300 hover:text-white"
                }`}
              >
                <span className={activeDeveloper === dev.id ? "text-[#0099ff]" : "text-zinc-400"}>
                  {dev.name}
                </span>
                {activeDeveloper === dev.id && (
                  <motion.div 
                    layoutId="active-dev-bg" 
                    className="absolute inset-0 bg-[#0099ff]/5 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Градиентная подсветка снизу */}
        <div className="absolute -bottom-px left-0 w-full h-px bg-gradient-to-r from-transparent via-[#0099ff] to-transparent opacity-50" />
        
        {/* Свечение */}
        <div className="absolute inset-0 rounded-xl blur-[60px] opacity-20 bg-gradient-to-r from-[#0099ff]/20 to-[#39FF14]/10 pointer-events-none" />
      </div>
    </div>

    {/* КОНТЕНТ АКТИВНОГО РАЗРАБОТЧИКА */}
    <AnimatePresence mode="wait">
      {developersData.map((dev) => (
        activeDeveloper === dev.id && (
          <motion.div
            key={`developer-${dev.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-[#12181F] border border-white/5 rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
                {/* Аватар */}
                <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-[#090D10] border-2 border-[#0099ff]/30 flex-shrink-0">
                  {dev.avatar ? (
                    <img 
                      src={dev.avatar} 
                      alt={dev.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-[#0099ff]/20 to-[#39FF14]/10 animate-pulse" />
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-3xl md:text-4xl">
                        {dev.name[0]}
                      </div>
                    </>
                  )}
                </div>
                
                {/* Информация */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                    <h3 className="text-2xl md:text-3xl font-bold text-white">{dev.name}</h3>
                    <span className="px-3 py-1 bg-[#0099ff]/15 text-[#0099ff] rounded-full text-sm font-medium">
                      {dev.role}
                    </span>
                  </div>
                  
                  <p className="text-zinc-300 text-base md:text-lg leading-relaxed mb-4">
                    {dev.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
                    <div>
                      <p className="text-zinc-400 text-sm mb-1">Специализация</p>
                      <p className="text-white font-medium">{dev.specialization}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 text-sm mb-1">Опыт</p>
                      <p className="text-white font-medium">{dev.experience}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )
      ))}
    </AnimatePresence>
  </motion.div>
)}

{/* --- ВКЛАДКА ПЛАНЫ ПРОЕКТА (ROADMAP) --- */}
{activeTab === "plans" && (
  <motion.div 
    key="plans"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
    className="w-full"
  >
    <div className="text-center mb-8 sm:mb-12">
      <h2 className="font-sf text-3xl sm:text-4xl font-bold mb-3 tracking-tight text-white">
        Дорожная карта проекта
      </h2>
      <p className="text-zinc-500 text-base font-medium max-w-2xl mx-auto">
        Планы развития и ближайшие обновления сервера Breeze
      </p>
    </div>

    {/* ЭТАП 1: ЗАВЕРШЕНО */}
    <div className="bg-[#12181F] border border-[#39FF14]/20 rounded-xl p-6 sm:p-8 shadow-xl mb-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-[#39FF14]" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#39FF14]/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-[#39FF14]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Этап 1</h3>
            <p className="text-[#39FF14] text-sm font-medium">Завершено • Январь 2025</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-[#39FF14] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-white font-medium">Создание инфроструктуры</p>
              <p className="text-zinc-400 text-sm">Гитхаб репозитории, сервера и тд</p>
            </div>
          </div>

        </div>
      </div>
    </div>

    {/* ЭТАП 2: В ПРОЦЕССЕ */}
    <div className="bg-[#12181F] border border-[#0099ff]/20 rounded-xl p-6 sm:p-8 shadow-xl mb-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-[#0099ff]" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#0099ff]/20 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-[#0099ff] animate-spin" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Этап 2</h3>
            <p className="text-[#0099ff] text-sm font-medium">В процессе • Январь-Март 2025</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#0099ff]/30 flex items-center justify-center mt-0.5 flex-shrink-0">
              <span className="text-[#0099ff] text-xs font-bold">25%</span>
            </div>
            <div>
              <p className="text-white font-medium">Личный кабинет</p>
              <p className="text-zinc-400 text-sm">Создание личного кабинета и профиля на сайте</p>
              <div className="mt-2 h-1.5 bg-[#0099ff]/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#0099ff] w-1/4 rounded-full" />
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#0099ff]/30 flex items-center justify-center mt-0.5 flex-shrink-0">
              <span className="text-[#0099ff] text-xs font-bold">40%</span>
            </div>
            <div>
              <p className="text-white font-medium">Возможность покупки проходки</p>
              <p className="text-zinc-400 text-sm">Создание страницы покупки доступа к серверу и настройка кассы</p>
              <div className="mt-2 h-1.5 bg-[#0099ff]/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#0099ff] w-2/5 rounded-full" />
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#0099ff]/30 flex items-center justify-center mt-0.5 flex-shrink-0">
              <span className="text-[#0099ff] text-xs font-bold">15%</span>
            </div>
            <div>
              <p className="text-white font-medium">Оптимизация сервера</p>
              <p className="text-zinc-400 text-sm">А также другие важные механики</p>
              <div className="mt-2 h-1.5 bg-[#0099ff]/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#0099ff] w-15/100 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* ЭТАП 3: ПЛАНИРУЕТСЯ */}
    <div className="bg-[#12181F] border border-white/10 rounded-xl p-6 sm:p-8 shadow-xl mb-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-zinc-500" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-zinc-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Этап 3: Будущее</h3>
            <p className="text-zinc-400 text-sm font-medium">Планируется • Февраль-Апрель 2025</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-zinc-500/30 flex items-center justify-center mt-0.5 flex-shrink-0">
              <span className="text-zinc-400 text-xs font-bold">Q1</span>
            </div>
            <div>
              <p className="text-white font-medium">Банковская система</p>
              <p className="text-zinc-400 text-sm">Банк на сайте, переводы игрокам, банкоматы</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-zinc-500/30 flex items-center justify-center mt-0.5 flex-shrink-0">
              <span className="text-zinc-400 text-xs font-bold">Q2</span>
            </div>
            <div>
              <p className="text-white font-medium">Банжи система, меню ролей на сайте</p>
              <p className="text-zinc-400 text-sm">Возможность управления своими правами через меню сайта</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-zinc-500/30 flex items-center justify-center mt-0.5 flex-shrink-0">
              <span className="text-zinc-400 text-xs font-bold">Q3</span>
            </div>
            <div>
              <p className="text-white font-medium">Уведомленияо личных сообщениях</p>
              <p className="text-zinc-400 text-sm">Уведомления о разных событиях в дискорде</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* СТАТИСТИКА */}
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-[#12181F] border border-white/5 rounded-xl p-4 text-center">
        <div className="text-3xl font-bold text-[#39FF14] mb-1">26%</div>
        <div className="text-zinc-400 text-sm">Выполнено</div>
      </div>
      <div className="bg-[#12181F] border border-white/5 rounded-xl p-4 text-center">
        <div className="text-3xl font-bold text-[#0099ff] mb-1">3</div>
        <div className="text-zinc-400 text-sm">Активных задач</div>
      </div>
      <div className="bg-[#12181F] border border-white/5 rounded-xl p-4 text-center">
        <div className="text-3xl font-bold text-white mb-1">0</div>
        <div className="text-zinc-400 text-sm">Крупных обновлений</div>
      </div>
    </div>
  </motion.div>
)}

          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}