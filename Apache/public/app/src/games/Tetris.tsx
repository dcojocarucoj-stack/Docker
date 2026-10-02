import { useEffect, useRef, useState } from 'react'

const COLS = 10, ROWS = 20, CELL = 28, W = COLS*CELL, H = ROWS*CELL

const PIECES = [
  { shape: [[1,1,1,1]], color: '#00ccff' },
  { shape: [[1,1],[1,1]], color: '#ffcc00' },
  { shape: [[0,1,0],[1,1,1]], color: '#cc44ff' },
  { shape: [[0,1,1],[1,1,0]], color: '#00ff88' },
  { shape: [[1,1,0],[0,1,1]], color: '#ff0088' },
  { shape: [[1,0,0],[1,1,1]], color: '#4466ff' },
  { shape: [[0,0,1],[1,1,1]], color: '#ff6600' },
]

type Board = (string|0)[][]
type Piece = { shape: number[][], color: string, x: number, y: number }

function rotate(s: number[][]): number[][] {
  return s[0].map((_, c) => s.map(r => r[c]).reverse())
}
function emptyBoard(): Board { return Array.from({length:ROWS}, () => Array(COLS).fill(0)) }
function randPiece(): Piece {
  const p = PIECES[Math.floor(Math.random()*PIECES.length)]
  return { shape: p.shape.map(r=>[...r]), color: p.color, x: Math.floor(COLS/2)-1, y: -1 }
}
function fits(board: Board, piece: Piece, dx=0, dy=0, shape=piece.shape): boolean {
  for (let r=0; r<shape.length; r++)
    for (let c=0; c<shape[r].length; c++) {
      if (!shape[r][c]) continue
      const nx=piece.x+c+dx, ny=piece.y+r+dy
      if (nx<0||nx>=COLS||ny>=ROWS) return false
      if (ny>=0 && board[ny][nx]) return false
    }
  return true
}
function placePiece(board: Board, piece: Piece): Board {
  const nb = board.map(r=>[...r]) as Board
  piece.shape.forEach((row,r) => row.forEach((v,c) => {
    if (v && piece.y+r>=0) nb[piece.y+r][piece.x+c] = piece.color
  }))
  return nb
}
function clearLines(board: Board): { board: Board, lines: number } {
  const kept = board.filter(row => row.some(c=>!c))
  const lines = ROWS - kept.length
  return { board: [...Array.from({length:lines},()=>Array(COLS).fill(0)), ...kept] as Board, lines }
}

function drawCell(ctx: CanvasRenderingContext2D, c: number, r: number, color: string, alpha=1) {
  ctx.globalAlpha = alpha
  ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 10
  ctx.fillRect(c*CELL+1, r*CELL+1, CELL-2, CELL-2)
  ctx.shadowBlur = 0
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.fillRect(c*CELL+1, r*CELL+1, CELL-2, 5)
  ctx.globalAlpha = 1
}

export default function Tetris() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nextRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [gameKey, setGameKey] = useState(0)

  useEffect(() => {
    if (gameKey === 0) return
    const canvas = canvasRef.current!, ncanvas = nextRef.current!
    const ctx = canvas.getContext('2d')!, nctx = ncanvas.getContext('2d')!
    let raf: number, last = 0

    const state = {
      board: emptyBoard(), piece: randPiece(), next: randPiece(),
      score: 0, lines: 0, level: 1, dead: false,
    }
    setScore(0); setLines(0); setLevel(1); setGameOver(false)

    const speed = () => Math.max(80, 700 - (state.level-1)*60)

    function drawBoard() {
      const s = state
      ctx.fillStyle = '#080810'; ctx.fillRect(0,0,W,H)
      ctx.strokeStyle = '#ffffff06'; ctx.lineWidth = 1
      for (let c=0;c<=COLS;c++){ctx.beginPath();ctx.moveTo(c*CELL,0);ctx.lineTo(c*CELL,H);ctx.stroke()}
      for (let r=0;r<=ROWS;r++){ctx.beginPath();ctx.moveTo(0,r*CELL);ctx.lineTo(W,r*CELL);ctx.stroke()}
      s.board.forEach((row,r) => row.forEach((v,c) => { if(v) drawCell(ctx,c,r,v as string) }))
      // ghost
      let dy = 0
      while (fits(s.board, s.piece, 0, dy+1)) dy++
      if (dy > 0) {
        s.piece.shape.forEach((row,r) => row.forEach((v,c) => {
          if (v) drawCell(ctx, s.piece.x+c, s.piece.y+dy+r, s.piece.color, 0.18)
        }))
      }
      // current piece
      s.piece.shape.forEach((row,r) => row.forEach((v,c) => {
        if (v && s.piece.y+r >= 0) drawCell(ctx, s.piece.x+c, s.piece.y+r, s.piece.color)
      }))
    }

    function drawNext() {
      const p = state.next
      nctx.fillStyle = '#080810'; nctx.fillRect(0,0,120,120)
      const pw=p.shape[0].length, ph=p.shape.length
      const ox=Math.floor((4-pw)/2), oy=Math.floor((4-ph)/2)
      p.shape.forEach((row,r) => row.forEach((v,c) => {
        if (!v) return
        nctx.fillStyle=p.color; nctx.shadowColor=p.color; nctx.shadowBlur=8
        nctx.fillRect((ox+c)*28+7,(oy+r)*28+7,26,26)
        nctx.shadowBlur=0
      }))
    }

    function drop() {
      const s = state
      if (fits(s.board, s.piece, 0, 1)) { s.piece.y++; return }
      s.board = placePiece(s.board, s.piece)
      const { board, lines } = clearLines(s.board)
      s.board = board; s.lines += lines
      const pts = [0,100,300,500,800][lines]||0
      s.score += pts * s.level; s.level = Math.floor(s.lines/10)+1
      setScore(s.score); setLines(s.lines); setLevel(s.level)
      s.piece = { ...s.next, x: Math.floor(COLS/2)-1, y: -1 }
      s.next = randPiece()
      if (!fits(s.board, s.piece)) { s.dead=true; setGameOver(true) }
    }

    function loop(ts: number) {
      if (ts - last >= speed()) { last=ts; drop() }
      drawBoard(); drawNext()
      if (!state.dead) raf = requestAnimationFrame(loop)
    }

    const onKey = (e: KeyboardEvent) => {
      const s = state; if (s.dead) return
      if (e.key==='ArrowLeft') { if(fits(s.board,s.piece,-1)) s.piece.x--; e.preventDefault() }
      if (e.key==='ArrowRight') { if(fits(s.board,s.piece,1)) s.piece.x++; e.preventDefault() }
      if (e.key==='ArrowDown') { drop(); e.preventDefault() }
      if (e.key==='ArrowUp'||e.key==='x') {
        e.preventDefault()
        const rot = rotate(s.piece.shape)
        const kicks = [0,-1,1,-2,2]
        for (const dx of kicks) {
          if (fits(s.board, {...s.piece, shape:rot}, dx)) { s.piece.shape=rot; s.piece.x+=dx; break }
        }
      }
      if (e.key===' ') {
        e.preventDefault()
        while (fits(s.board,s.piece,0,1)) s.piece.y++
        drop()
      }
    }
    window.addEventListener('keydown', onKey)
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey) }
  }, [gameKey])

  return (
    <div className="flex gap-5 items-start justify-center">
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="border border-[#ffffff15] rounded-lg" />
        {(gameKey===0||gameOver) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg backdrop-blur-sm">
            {gameOver && <div className="text-[#cc44ff] text-2xl font-black mb-1">GAME OVER</div>}
            {gameOver && <div className="text-gray-300 mb-4">Score: {score}</div>}
            <button onClick={()=>setGameKey(k=>k+1)}
              className="px-8 py-3 bg-[#cc44ff] text-white font-black rounded-lg hover:bg-[#aa22dd] transition-all hover:scale-105 active:scale-95">
              {gameOver?'PLAY AGAIN':'START GAME'}
            </button>
            <div className="text-gray-500 text-xs mt-4 text-center leading-7">
              ← → Move &nbsp;·&nbsp; ↑ Rotate<br/>↓ Soft drop &nbsp;·&nbsp; Space Hard drop
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 min-w-[130px]">
        {[{label:'SCORE',val:score,color:'#cc44ff'},{label:'LINES',val:lines,color:'#00ccff'},{label:'LEVEL',val:level,color:'#ffcc00'}].map(({label,val,color}) => (
          <div key={label} className="bg-[#ffffff08] border border-[#ffffff12] rounded-lg p-3">
            <div className="text-gray-500 text-xs mb-1">{label}</div>
            <div className="text-xl font-black" style={{color}}>{val}</div>
          </div>
        ))}
        <div className="bg-[#ffffff08] border border-[#ffffff12] rounded-lg p-3">
          <div className="text-gray-500 text-xs mb-2">NEXT</div>
          <canvas ref={nextRef} width={120} height={120} />
        </div>
      </div>
    </div>
  )
}
