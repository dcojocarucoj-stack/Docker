import { useEffect, useRef, useState } from 'react'

const CELL = 20, COLS = 22, ROWS = 20, W = COLS * CELL, H = ROWS * CELL

type Dir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type Pt = { x: number; y: number }

function randFood(snake: Pt[]): Pt {
  let f: Pt
  do { f = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) } }
  while (snake.some(s => s.x === f.x && s.y === f.y))
  return f
}

export default function Snake() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameKey, setGameKey] = useState(0)

  useEffect(() => {
    if (gameKey === 0) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let raf: number, last = 0

    const state = {
      snake: [{ x: 11, y: 10 }] as Pt[],
      dir: 'RIGHT' as Dir,
      next: 'RIGHT' as Dir,
      food: { x: 16, y: 10 } as Pt,
      score: 0,
      dead: false,
    }

    setScore(0); setGameOver(false)

    const SPEED = () => Math.max(80, 160 - state.score * 3)

    function draw() {
      const s = state
      ctx.fillStyle = '#080810'
      ctx.fillRect(0, 0, W, H)
      ctx.strokeStyle = '#ffffff05'
      ctx.lineWidth = 1
      for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x*CELL,0); ctx.lineTo(x*CELL,H); ctx.stroke() }
      for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0,y*CELL); ctx.lineTo(W,y*CELL); ctx.stroke() }
      // food glow
      ctx.fillStyle = '#ff0088'; ctx.shadowColor = '#ff0088'; ctx.shadowBlur = 18
      ctx.fillRect(s.food.x*CELL+2, s.food.y*CELL+2, CELL-4, CELL-4)
      ctx.shadowBlur = 0
      // snake
      s.snake.forEach((seg, i) => {
        const t = 1 - i / s.snake.length
        ctx.fillStyle = i === 0 ? '#00ff88' : `hsl(140,100%,${Math.max(20,50*t)}%)`
        ctx.shadowColor = '#00ff88'; ctx.shadowBlur = i === 0 ? 14 : 3
        ctx.fillRect(seg.x*CELL+1, seg.y*CELL+1, CELL-2, CELL-2)
      })
      ctx.shadowBlur = 0
    }

    function step(ts: number) {
      if (ts - last < SPEED()) { raf = requestAnimationFrame(step); return }
      last = ts
      const s = state
      s.dir = s.next
      const h = { ...s.snake[0] }
      if (s.dir === 'UP') h.y--
      if (s.dir === 'DOWN') h.y++
      if (s.dir === 'LEFT') h.x--
      if (s.dir === 'RIGHT') h.x++
      if (h.x < 0 || h.x >= COLS || h.y < 0 || h.y >= ROWS || s.snake.some(p => p.x===h.x && p.y===h.y)) {
        s.dead = true; setGameOver(true); draw(); return
      }
      s.snake.unshift(h)
      if (h.x === s.food.x && h.y === s.food.y) {
        s.score++; setScore(s.score); s.food = randFood(s.snake)
      } else s.snake.pop()
      draw()
      raf = requestAnimationFrame(step)
    }

    const OPP: Record<Dir,Dir> = { UP:'DOWN', DOWN:'UP', LEFT:'RIGHT', RIGHT:'LEFT' }
    const MAP: Record<string,Dir> = { ArrowUp:'UP', ArrowDown:'DOWN', ArrowLeft:'LEFT', ArrowRight:'RIGHT' }
    const onKey = (e: KeyboardEvent) => {
      const d = MAP[e.key]; if (!d) return; e.preventDefault()
      if (d !== OPP[state.dir]) state.next = d
    }
    window.addEventListener('keydown', onKey)
    raf = requestAnimationFrame(step)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey) }
  }, [gameKey])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-6 text-sm">
        <span className="text-gray-400">Score: <span className="text-[#00ff88] font-bold text-lg">{score}</span></span>
        <span className="text-gray-400">Length: <span className="text-[#00ccff] font-bold">{score + 1}</span></span>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="border border-[#00ff8830] rounded-lg" />
        {(gameKey === 0 || gameOver) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 rounded-lg backdrop-blur-sm">
            {gameOver && <div className="text-[#ff0088] text-2xl font-black mb-1">GAME OVER</div>}
            {gameOver && <div className="text-gray-300 mb-4">Score: {score}</div>}
            <button onClick={() => setGameKey(k => k+1)}
              className="px-8 py-3 bg-[#00ff88] text-black font-black rounded-lg hover:bg-[#00cc66] transition-all hover:scale-105 active:scale-95">
              {gameOver ? 'PLAY AGAIN' : 'START GAME'}
            </button>
            <div className="text-gray-500 text-xs mt-4 text-center leading-6">Arrow keys to move</div>
          </div>
        )}
      </div>
      {/* Mobile controls */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        {[['','▲',''],['◀','','▶'],['','▼','']].map((row, ri) => row.map((btn, ci) => (
          btn ? <button key={`${ri}-${ci}`}
            onPointerDown={() => { const dirs = {0:{1:'UP'},1:{0:'LEFT',2:'RIGHT'},2:{1:'DOWN'}} as any; const d = dirs[ri]?.[ci]; if(d){ const OPP:any={UP:'DOWN',DOWN:'UP',LEFT:'RIGHT',RIGHT:'LEFT'}; /* handled by ref */ }}}
            className="w-10 h-10 bg-[#ffffff10] border border-[#ffffff20] rounded-lg text-sm hover:bg-[#ffffff20] active:scale-95 transition-all">{btn}</button>
          : <div key={`${ri}-${ci}`} />
        )))}
      </div>
    </div>
  )
}
