import { useState, useEffect } from 'react'

const SYMBOLS = ['🎮','🕹️','👾','🚀','⭐','💎','🔥','🌙','⚡','🎯','🏆','🎲']

function shuffle<T>(arr: T[]): T[] {
  const a=[...arr]
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  return a
}

type Card = { id: number; sym: string; flipped: boolean; matched: boolean }

function makeCards(): Card[] {
  return shuffle([...SYMBOLS,...SYMBOLS].map((sym,id)=>({id,sym,flipped:false,matched:false})))
}

export default function Memory() {
  const [cards, setCards] = useState<Card[]>(makeCards)
  const [flipped, setFlipped] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [locked, setLocked] = useState(false)
  const [won, setWon] = useState(false)
  const [time, setTime] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const t = setInterval(()=>setTime(s=>s+1), 1000)
    return ()=>clearInterval(t)
  }, [running])

  function flip(id: number) {
    if (locked) return
    const card = cards[id]
    if (card.flipped||card.matched) return
    if (!running) setRunning(true)
    const newCards = cards.map(c=>c.id===id?{...c,flipped:true}:c)
    const newFlipped = [...flipped, id]
    if (newFlipped.length===2) {
      setMoves(m=>m+1)
      setLocked(true)
      setCards(newCards)
      const [a,b] = newFlipped
      const ca = newCards[a], cb = newCards[b]
      if (ca.sym===cb.sym) {
        setTimeout(()=>{
          setCards(cs=>{
            const next = cs.map(c=>(c.id===a||c.id===b)?{...c,matched:true}:c)
            if (next.every(c=>c.matched)) { setWon(true); setRunning(false) }
            return next
          })
          setFlipped([]); setLocked(false)
        }, 350)
      } else {
        setTimeout(()=>{
          setCards(cs=>cs.map(c=>(c.id===a||c.id===b)?{...c,flipped:false}:c))
          setFlipped([]); setLocked(false)
        }, 850)
      }
    } else {
      setCards(newCards); setFlipped(newFlipped)
    }
  }

  function reset() {
    setCards(makeCards()); setFlipped([]); setMoves(0); setLocked(false)
    setWon(false); setTime(0); setRunning(false)
  }

  const matched = cards.filter(c=>c.matched).length/2
  const fmt = (s:number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex gap-6 text-sm">
        <span className="text-gray-400">Moves: <span className="text-[#ffcc00] font-bold">{moves}</span></span>
        <span className="text-gray-400">Pairs: <span className="text-[#00ff88] font-bold">{matched}/{SYMBOLS.length}</span></span>
        <span className="text-gray-400">Time: <span className="text-[#00ccff] font-bold">{fmt(time)}</span></span>
      </div>
      {won && (
        <div className="text-center py-2">
          <div className="text-[#00ff88] text-xl font-black">PERFECT MEMORY! 🎉</div>
          <div className="text-gray-400 text-sm mt-1">Solved in {moves} moves · {fmt(time)}</div>
        </div>
      )}
      <div className="grid grid-cols-6 gap-2">
        {cards.map(card => (
          <button key={card.id} onClick={()=>flip(card.id)}
            className={`w-[60px] h-[60px] rounded-xl text-2xl font-bold border-2 transition-all duration-200 select-none
              ${card.matched
                ? 'bg-[#00ff8818] border-[#00ff8866] scale-95 cursor-default'
                : card.flipped
                  ? 'bg-[#ffffff18] border-[#ffffff50] scale-105'
                  : 'bg-[#ffffff08] border-[#ffffff18] hover:bg-[#ffffff12] hover:border-[#ffffff30] hover:scale-105 cursor-pointer'
              }`}>
            <span className={card.flipped||card.matched ? 'opacity-100' : 'opacity-0'}>
              {card.sym}
            </span>
            {!card.flipped && !card.matched && (
              <span className="text-[#ffffff30] text-xl absolute inset-0 flex items-center justify-center">?</span>
            )}
          </button>
        ))}
      </div>
      <button onClick={reset}
        className="px-5 py-2 bg-[#ffffff10] border border-[#ffffff20] rounded-lg text-sm hover:bg-[#ffffff18] transition-all hover:scale-105 active:scale-95">
        New Game
      </button>
    </div>
  )
}
