"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Info, Sparkles, FlaskConical, ChevronLeft, ChevronRight, ArrowRight, Calendar } from "lucide-react"

const seasonsData = [
  {
    id: 9,
    num: "3",
    date: "22 февраля 2025 г. — 25 марта 2025 г.",
    shortDesc: "Сезон под названием «Кошаник». Полный отказ от старого кастомного контента и глобальная переработка систем с нуля.",
    fullDesc: "Этот сезон получил кодовое имя «Кошаник». Администрация приняла радикальное решение отказаться от всего старого кастомного контента. Все игровые механики и плагины были переписаны с чистого листа для улучшения качества игры. После сезона планировалось множество нового контента, но четверный сезон так и небыл запущен...",
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
]

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 500 : -500, opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 500 : -500, opacity: 0 })
}

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState("about")
  const [selectedSeason, setSelectedSeason] = useState<typeof seasonsData[0] | null>(null)
  const [[page, direction], setPage] = useState([0, 0])

  const paginate = (newDirection: number) => {
    if (!selectedSeason) return
    const newPage = (page + newDirection + selectedSeason.images.length) % selectedSeason.images.length
    setPage([newPage, newDirection])
  }

  useEffect(() => {
    if (selectedSeason) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setPage([0, 0])
    }
  }, [selectedSeason])

  return (
    <div className="min-h-screen w-full bg-[#090D10] text-white overflow-clip selection:bg-[#0099ff]/30">
      
      <main className="max-w-6xl mx-auto pt-6 pb-10 px-6 flex flex-col items-center relative">

        {/* ТАБЛЕТКА (Sticky) */}
        <div className="sticky top-24 z-50 mb-10 border border-white/5 bg-[#12181F]/50 backdrop-blur-md p-1.5 rounded-xl inline-flex items-center shadow-2xl transition-all duration-300">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                 setActiveTab(tab.id)
                 setSelectedSeason(null)
                 window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className={`relative flex items-center gap-2.5 px-6 py-3 rounded-xl text-[14px] font-bold tracking-wide transition-all duration-300 z-10 ${activeTab === tab.id ? "text-[#0099ff]" : "text-white hover:text-[#0099ff]"}`}
            >
              <span className={`${activeTab === tab.id ? "text-[#0099ff]" : ""}`}>{tab.icon}</span>
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="active-tab-bg" className="absolute inset-0 bg-[#0099ff]/10 border-b-2 border-[#0099ff] rounded-xl z-[-1]" />
              )}
            </button>
          ))}
        </div>

        <div className="w-full">
          <AnimatePresence mode="wait">
            
            {/* 1. СПИСОК СЕЗОНОВ */}
            {activeTab === "seasons" && !selectedSeason && (
              <motion.div 
                key="seasons-grid" 
                // Убраны смещения по Y
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="w-full"
              >
                {/* --- ЗАГОЛОВОК СЕЗОНОВ --- */}
                <div className="text-center mb-12">
                  <h2 className="font-sf text-4xl font-bold mb-3 tracking-tight text-white">
                    Список всех сезонов
                  </h2>
                  <p className="text-zinc-500 text-base font-medium">
                    Здесь далеко не вся информация, но она останется в наших сердцах
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {seasonsData.map((season) => (
                    <motion.div 
                      key={season.id} 
                      className="group relative flex flex-col bg-[#12181F] border border-white/5 rounded-3xl p-4 cursor-pointer overflow-hidden transition-all shadow-xl hover:shadow-2xl hover:border-[#0099ff]/20 gap-4"
                      onClick={() => setSelectedSeason(season)}
                    >
                      <div className="relative z-0 aspect-video rounded-2xl overflow-hidden bg-zinc-900 shadow-lg">
                        <img 
                          src={season.images[0]} 
                          alt="" 
                          className="w-full h-full object-cover transition-transform duration-500" 
                        />
                      </div>

                      <div className="relative flex-1 flex flex-col">
                        <div className="relative z-10 transition-all duration-300">
                            <h4 className="text-3xl font-bold font-sf tracking-tight mb-3 transition-colors">Breeze {season.num}</h4>
                            <p className="text-zinc-300 text-[15px] leading-relaxed mb-3">{season.date}</p>
                            <p className="text-zinc-300 text-[15px] leading-relaxed break-words line-clamp-4">
                              {season.shortDesc}
                            </p>
                        </div>

                        <div className="absolute inset-0 -m-2 rounded-xl bg-gradient-to-t from-[#12181F]/90 via-[#12181F]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 pointer-events-none" />

                        <div className="absolute inset-0 z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                            <div className="flex items-center gap-2 transform translate-y-15 group-hover:scale-100 scale-110 transition-transform duration-200">
                                 <span className="text-white font-heavy text-[16px]">
                                   Подробнее
                                 </span>
                                 <ArrowRight className="w-5 h-5 text-white" />
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
                // Убраны смещения по Y
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="w-full max-w-4xl mx-auto"
              >
                <button 
                  onClick={() => setSelectedSeason(null)}
                  className="mb-8 flex items-center gap-2 text-zinc-300 hover:text-white transition-colors text-sm font-bold uppercase tracking-wide group"
                >
                  <div className="p-2 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </div>
                  Назад к списку
                </button>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                    <div>
                        <div className="text-[#0099ff] font-bold text-xs uppercase tracking-widest mb-1.5 pl-1">Архив сезона</div>
                        <h2 className="text-4xl md:text-5xl font-black font-sf tracking-tight text-white leading-none">
                            Breeze {selectedSeason.num}
                        </h2>
                    </div>
                    
                    <div className="flex items-center gap-2 text-zinc-300 text-sm font-medium bg-[#12181F] px-4 py-2 rounded-xl border border-white/5">
                        <Calendar className="w-4 h-4" />
                        <span>{selectedSeason.date}</span>
                    </div>
                </div>

                <div className="flex gap-6 mb-8 text-sm font-bold tracking-wide border-b border-white/10 pb-0">
                </div>

                <div className="relative w-full aspect-video bg-[#12181F] rounded-xl overflow-hidden shadow-2xl border border-white/5 mb-8 group/slider">
                     <AnimatePresence initial={false} custom={direction} mode="popLayout">
                        <motion.img 
                            key={page} 
                            src={selectedSeason.images[page]} 
                            custom={direction} 
                            variants={slideVariants} 
                            initial="enter" 
                            animate="center" 
                            exit="exit" 
                            transition={{ x: { type: "spring", stiffness: 300, damping: 35 }, opacity: { duration: 0.2 } }} 
                            className="absolute w-full h-full object-cover" 
                        />
                     </AnimatePresence>

                     {selectedSeason.images.length > 1 && (
                        <>
                            <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none z-20">
                                <button onClick={(e) => { e.stopPropagation(); paginate(-1); }} className="pointer-events-auto p-4 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all active:scale-90 backdrop-blur-sm border border-white/5">
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); paginate(1); }} className="pointer-events-auto p-4 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all active:scale-90 backdrop-blur-sm border border-white/5">
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                                {selectedSeason.images.map((_, idx) => (
                                    <div key={idx} className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === page ? "bg-white w-4" : "bg-white/30"}`} />
                                ))}
                            </div>
                        </>
                     )}
                </div>

                <div className="w-full text-left">
                    <p className="text-zinc-300 text-lg leading-relaxed font-medium">
                        {selectedSeason.fullDesc}
                    </p>
                </div>
              </motion.div>
            )}

            {/* --- ВКЛАДКА ABOUT --- */}
            {activeTab === "about" && (
              <motion.div 
                key="about" 
                // Убраны смещения по Y
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="w-full"
              >
                {/* ЗАГОЛОВОК */}
                <div className="text-center mb-12">
                  <h2 className="font-sf text-4xl font-bold mb-3 tracking-tight text-white">
                    О проекте Breeze
                  </h2>
                  <p className="text-zinc-500 text-base font-medium">
                    Узнайте больше о нашей истории и философии
                  </p>
                </div>

                {/* КАРТОЧКА */}
                <div className="bg-[#12181F] border border-white/5 rounded-xl p-8 shadow-2xl text-left">
                  <h3 className="text-3xl font-bold font-sf mb-3">Информация</h3>
                  <p className="text-zinc-300 text-base leading-relaxed font-medium">
                    Breeze — это площадка для реализации ваших идей в ванильном мире./
                  </p>
                </div>
              </motion.div>
            )}

            {/* --- ВКЛАДКА DEVELOPERS --- */}
            {activeTab === "developers" && (
              <motion.div 
                key="devs" 
                // Убраны смещения по Y
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="w-full"
              >
                {/* ЗАГОЛОВОК */}
                <div className="text-center mb-12">
                  <h2 className="font-sf text-4xl font-bold mb-3 tracking-tight text-white">
                    Команда разработки
                  </h2>
                  <p className="text-zinc-500 text-base font-medium">
                    Люди, которые делают Breeze лучше с каждым днем
                  </p>
                </div>

                {/* КАРТОЧКА */}
                <div className="bg-[#12181F] border border-white/5 rounded-xl p-8 shadow-2xl text-left">
                  <h3 className="text-3xl font-bold font-sf">Разработчики</h3>
                  <p className="text-zinc-300 mt-2 text-base">Команда энтузиастов Breeze.</p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}