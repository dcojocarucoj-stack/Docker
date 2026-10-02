import { useEffect, useRef, useState } from 'react'

const W=600, H=380, PAD_W=12, PAD_H=75, BALL_R=7, WIN=7

export default function Pong() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState({p:0, ai:0})
  const [winner, setWinner] = useState<string|null>(null)
  const [gameKey, setGameKey] = useState(0)

  useEffect(() => {
    if (gameKey===0) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let raf: number

    const st = {
      ball: {x:W/2, y:H/2, vx:4*(Math.random()>.5?1:-1), vy:3*(Math.random()>.5?1:-1)},
      player: {y: H/2-PAD_H/2},
      ai: {y: H/2-PAD_H/2},
      score: {p:0, ai:0},
      dead: false,
    }
    setScore({p:0,ai:0}); setWinner(null)

    const keys = new Set<string>()

    function resetBall(dir: number) {
      st.ball = {x:W/2, y:H/2, vx:4*dir, vy:3*(Math.random()>.5?1:-1)}
    }

    function loop() {
      if (st.dead) return
      // Player
      if (keys.has('ArrowUp')||keys.has('w')) st.player.y = Math.max(0, st.player.y-6)
      if (keys.has('ArrowDown')||keys.has('s')) st.player.y = Math.min(H-PAD_H, st.player.y+6)
      // AI (imperfect)
      const aiCenter = st.ai.y + PAD_H/2
      const aiSpeed = 4.2
      if (aiCenter < st.ball.y-5) st.ai.y = Math.min(H-PAD_H, st.ai.y+aiSpeed)
      else if (aiCenter > st.ball.y+5) st.ai.y = Math.max(0, st.ai.y-aiSpeed)
      // Ball
      st.ball.x += st.ball.vx; st.ball.y += st.ball.vy
      if (st.ball.y-BALL_R<0) { st.ball.y=BALL_R; st.ball.vy=Math.abs(st.ball.vy) }
      if (st.ball.y+BALL_R>H) { st.ball.y=H-BALL_R; st.ball.vy=-Math.abs(st.ball.vy) }
      // Player paddle
      const px = 20+PAD_W
      if (st.ball.x-BALL_R<px && st.ball.y>st.player.y && st.ball.y<st.player.y+PAD_H && st.ball.vx<0) {
        st.ball.x=px+BALL_R
        const hit = (st.ball.y-(st.player.y+PAD_H/2))/(PAD_H/2)
        const speed = Math.min(12, Math.hypot(st.ball.vx,st.ball.vy)*1.05)
        const angle = hit*1.1
        st.ball.vx = Math.abs(speed*Math.cos(angle))
        st.ball.vy = speed*Math.sin(angle)
      }
      // AI paddle
      const ax = W-20-PAD_W
      if (st.ball.x+BALL_R>ax && st.ball.y>st.ai.y && st.ball.y<st.ai.y+PAD_H && st.ball.vx>0) {
        st.ball.x=ax-BALL_R
        const hit = (st.ball.y-(st.ai.y+PAD_H/2))/(PAD_H/2)
        const speed = Math.min(12, Math.hypot(st.ball.vx,st.ball.vy)*1.05)
        const angle = hit*1.1
        st.ball.vx = -Math.abs(speed*Math.cos(angle))
        st.ball.vy = speed*Math.sin(angle)
      }
      // Score
      if (st.ball.x < 0) {
        st.score.ai++
        setScore({...st.score})
        if (st.score.ai>=WIN) { st.dead=true; setWinner('AI'); draw(); return }
        resetBall(1)
      }
      if (st.ball.x > W) {
        st.score.p++
        setScore({...st.score})
        if (st.score.p>=WIN) { st.dead=true; setWinner('YOU'); draw(); return }
        resetBall(-1)
      }
      draw()
      raf = requestAnimationFrame(loop)
    }

    function draw() {
      ctx.fillStyle='#080810'; ctx.fillRect(0,0,W,H)
      // Center line
      ctx.setLineDash([8,8]); ctx.strokeStyle='#ffffff18'; ctx.lineWidth=2
      ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke()
      ctx.setLineDash([])
      // Paddles
      ctx.fillStyle='#00ff88'; ctx.shadowColor='#00ff88'; ctx.shadowBlur=18
      ctx.beginPath(); (ctx as any).roundRect(20,st.player.y,PAD_W,PAD_H,4); ctx.fill()
      ctx.fillStyle='#ff0088'; ctx.shadowColor='#ff0088'
      ctx.beginPath(); (ctx as any).roundRect(W-20-PAD_W,st.ai.y,PAD_W,PAD_H,4); ctx.fill()
      // Ball
      ctx.fillStyle='#ffffff'; ctx.shadowColor='#ffffff'; ctx.shadowBlur=20
      ctx.beginPath(); ctx.arc(st.ball.x,st.ball.y,BALL_R,0,Math.PI*2); ctx.fill()
      ctx.shadowBlur=0
    }

    const onKey = (e:KeyboardEvent) => { if(['ArrowUp','ArrowDown','w','s'].includes(e.key)) e.preventDefault(); keys.add(e.key) }
    const offKey = (e:KeyboardEvent) => keys.delete(e.key)
    window.addEventListener('keydown',onKey)
    window.addEventListener('keyup',offKey)
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown',onKey); window.removeEventListener('keyup',offKey) }
  }, [gameKey])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-8">
        <div className="text-center">
          <div className="text-[#00ff88] text-xs mb-1">YOU</div>
          <div className="text-[#00ff88] text-4xl font-black">{score.p}</div>
        </div>
        <div className="text-gray-600 text-2xl font-bold">:</div>
        <div className="text-center">
          <div className="text-[#ff0088] text-xs mb-1">AI</div>
          <div className="text-[#ff0088] text-4xl font-black">{score.ai}</div>
        </div>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="border border-[#ffffff15] rounded-lg" />
        {(gameKey===0||winner) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg backdrop-blur-sm">
            {winner && <div className={`text-2xl font-black mb-2 ${winner==='YOU'?'text-[#00ff88]':'text-[#ff0088]'}`}>
              {winner==='YOU'?'YOU WIN! 🏆':'AI WINS!'}
            </div>}
            <button onClick={()=>setGameKey(k=>k+1)}
              className="px-8 py-3 bg-[#00ccff] text-black font-black rounded-lg hover:bg-[#0099cc] transition-all hover:scale-105 active:scale-95">
              {winner?'PLAY AGAIN':'START GAME'}
            </button>
            <div className="text-gray-500 text-xs mt-4">W/S or ↑↓ to move &nbsp;·&nbsp; First to {WIN}</div>
          </div>
        )}
      </div>
    </div>
  )
}
