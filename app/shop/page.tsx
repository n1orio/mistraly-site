// app/shop/page.tsx
export default function ShopPage() {
  return (
    <div className="min-h-screen bg-[#080B0E] text-white py-12 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-6">Купить проходку</h1>
        <p className="text-zinc-400 mb-8">
          Проходка даёт полный доступ к серверу Breeze.monster без привилегий и доната.
        </p>
        
        {/* Здесь будет форма оплаты */}
        <div className="bg-[#12181F]/50 p-6 rounded-xl border border-white/10">
          <p className="text-lg mb-4">Стоимость: <span className="text-[#0099ff] font-bold">299 ₽</span></p>
          <button 
            onClick={() => alert("Интеграция с платёжной системой")}
            className="w-full py-3 bg-[#0099ff] hover:bg-white hover:text-black text-white font-bold rounded-xl transition"
          >
            Оплатить
          </button>
        </div>
      </div>
    </div>
  )
}