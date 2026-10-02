import { useEffect, useRef, useState } from 'react'

const W=480, H=340, PAD_W=80, PAD_H=11, BALL_R=7
const BRICK_ROWS=5, BRICK_COLS=9, BW=48, BH=16, BP=3
const ROW_COLORS=['#ff0088','#ff6600','#ffcc00','#00ff88','#00ccff']

type Brick = {x:number;y:number;alive:boolean;color:string}

function makeBricks(): Brick[][] {
  return Array.from({length:BRICK_ROWS},(_,r)=>
    Array.from({length:BRICK_COLS},(_,c)=>({
      x: c*(BW+BP)+12, y: r*(BH+BP)+45,
      alive:true, color:ROW_COLORS[r]
    }))
  )
}

export default function Breakout() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [gameKey, setGameKey] = useState(0)
  const [dead, setDead] = useState(false)
  const [won, setWon] = useState(false)

  useEffect(()=>{
    if(gameKey===0) return
    const canvas=canvasRef.current!
    const ctx=canvas.getContext('2d')!
    let raf: number

    const st = {
      pad: W/2-PAD_W/2,
      ball: {x:W/2, y:H-60, vx:3.5, vy:-4.5},
      bricks: makeBricks(),
      score: 0, lives: 3, launched: false, dead: false, won: false,
    }
    setScore(0); setLives(3); setDead(false); setWon(false)

    let mouse = W/2
    const keys=new Set<string>()

    function resetBall(){
      st.ball={x:st.pad+PAD_W/2, y:H-60, vx:3.5*(Math.random()>.5?1:-1), vy:-4.5}
      st.launched=false
    }

    function loop(){
      if(st.dead||st.won) return
      // Paddle
      if(keys.has('ArrowLeft')) st.pad=Math.max(0,st.pad-7)
      if(keys.has('ArrowRight')) st.pad=Math.min(W-PAD_W,st.pad+7)
      st.pad=Math.max(0,Math.min(W-PAD_W,mouse-PAD_W/2))

      if(!st.launched) {st.ball.x=st.pad+PAD_W/2; st.ball.y=H-60}
      else {
        st.ball.x+=st.ball.vx; st.ball.y+=st.ball.vy
        // Wall
        if(st.ball.x-BALL_R<0){st.ball.x=BALL_R;st.ball.vx=Math.abs(st.ball.vx)}
        if(st.ball.x+BALL_R>W){st.ball.x=W-BALL_R;st.ball.vx=-Math.abs(st.ball.vx)}
        if(st.ball.y-BALL_R<0){st.ball.y=BALL_R;st.ball.vy=Math.abs(st.ball.vy)}
        // Paddle
        const py=H-PAD_H-18
        if(st.ball.y+BALL_R>=py&&st.ball.y+BALL_R<=py+PAD_H+6&&st.ball.x>=st.pad&&st.ball.x<=st.pad+PAD_W&&st.ball.vy>0){
          const hit=(st.ball.x-(st.pad+PAD_W/2))/(PAD_W/2)
          st.ball.vy=-Math.abs(st.ball.vy)
          st.ball.vx+=hit*2
          const spd=Math.hypot(st.ball.vx,st.ball.vy)
          if(spd>10){st.ball.vx=st.ball.vx/spd*10;st.ball.vy=st.ball.vy/spd*10}
          st.ball.y=py-BALL_R
        }
        // Bottom
        if(st.ball.y>H+20){
          st.lives--; setLives(st.lives)
          if(st.lives<=0){st.dead=true;setDead(true);draw();return}
          resetBall()
        }
        // Bricks
        outer: for(const row of st.bricks) for(const brick of row){
          if(!brick.alive) continue
          if(st.ball.x+BALL_R>brick.x&&st.ball.x-BALL_R<brick.x+BW&&
             st.ball.y+BALL_R>brick.y&&st.ball.y-BALL_R<brick.y+BH){
            brick.alive=false; st.score+=10; setScore(st.score)
            const fromTop=st.ball.y+BALL_R-brick.y, fromBottom=brick.y+BH-(st.ball.y-BALL_R)
            const fromLeft=st.ball.x+BALL_R-brick.x, fromRight=brick.x+BW-(st.ball.x-BALL_R)
            const minV=Math.min(fromTop,fromBottom,fromLeft,fromRight)
            if(minV===fromTop||minV===fromBottom) st.ball.vy*=-1
            else st.ball.vx*=-1
            break outer
          }
        }
        if(st.bricks.flat().every(b=>!b.alive)){st.won=true;setWon(true)}
      }
      draw()
      raf=requestAnimationFrame(loop)
    }

    function draw(){
      ctx.fillStyle='#080810'; ctx.fillRect(0,0,W,H)
      // Bricks
      for(const row of st.bricks) for(const brick of row){
        if(!brick.alive) continue
        ctx.fillStyle=brick.color; ctx.shadowColor=brick.color; ctx.shadowBlur=7
        ctx.beginPath(); (ctx as any).roundRect(brick.x,brick.y,BW,BH,3); ctx.fill()
        ctx.shadowBlur=0
        ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.fillRect(brick.x,brick.y,BW,4)
      }
      // Paddle
      ctx.fillStyle='#00ccff'; ctx.shadowColor='#00ccff'; ctx.shadowBlur=16
      ctx.beginPath(); (ctx as any).roundRect(st.pad,H-PAD_H-18,PAD_W,PAD_H,5); ctx.fill()
      ctx.shadowBlur=0
      // Ball
      ctx.fillStyle='#ffffff'; ctx.shadowColor='#ffffff'; ctx.shadowBlur=16
      ctx.beginPath(); ctx.arc(st.ball.x,st.ball.y,BALL_R,0,Math.PI*2); ctx.fill()
      ctx.shadowBlur=0
      // Launch hint
      if(!st.launched){
        ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font='11px Orbitron,monospace'
        ctx.textAlign='center'; ctx.fillText('CLICK OR SPACE',W/2,H-5); ctx.textAlign='left'
      }
    }

    const onKey=(e:KeyboardEvent)=>{
      keys.add(e.key)
      if(e.key===' '){st.launched=true;e.preventDefault()}
      if(['ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault()
    }
    const offKey=(e:KeyboardEvent)=>keys.delete(e.key)
    const onMouse=(e:MouseEvent)=>{const r=canvas.getBoundingClientRect();mouse=e.clientX-r.left}
    const onClick=()=>{st.launched=true}

    window.addEventListener('keydown',onKey)
    window.addEventListener('keyup',offKey)
    canvas.addEventListener('mousemove',onMouse)
    canvas.addEventListener('click',onClick)
    raf=requestAnimationFrame(loop)
    return ()=>{
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown',onKey)
      window.removeEventListener('keyup',offKey)
      canvas.removeEventListener('mousemove',onMouse)
      canvas.removeEventListener('click',onClick)
    }
  },[gameKey])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-6 items-center text-sm">
        <span className="text-gray-400">Score: <span className="text-[#ff4444] font-black text-lg">{score}</span></span>
        <span className="text-gray-400">Lives: <span className="text-[#ff0088]">{'❤️'.repeat(Math.max(0,lives))}</span></span>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="border border-[#ffffff15] rounded-lg cursor-crosshair" />
        {(gameKey===0||dead||won)&&(
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg backdrop-blur-sm">
            {dead&&<div className="text-[#ff0088] text-2xl font-black mb-2">GAME OVER</div>}
            {won&&<div className="text-[#00ff88] text-2xl font-black mb-2">YOU WIN! 🏆</div>}
            {(dead||won)&&<div className="text-gray-300 mb-4">Score: {score}</div>}
            <button onClick={()=>setGameKey(k=>k+1)}
              className="px-8 py-3 bg-[#ff4444] text-white font-black rounded-lg hover:bg-[#cc2222] transition-all hover:scale-105 active:scale-95">
              {dead||won?'PLAY AGAIN':'START GAME'}
            </button>
            <div className="text-gray-500 text-xs mt-4">Move mouse · Click or Space to launch</div>
          </div>
        )}
      </div>
    </div>
  )
}
