import { useState } from 'react'

const ROWS=9, COLS=9, MINES=10

type Cell = { mine:boolean; revealed:boolean; flagged:boolean; count:number }
type Board = Cell[][]

function emptyBoard(): Board {
  return Array.from({length:ROWS},()=>Array.from({length:COLS},()=>({mine:false,revealed:false,flagged:false,count:0})))
}
function neighbors(r:number,c:number):[number,number][] {
  return [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
    .map(([dr,dc])=>[r+dr,c+dc] as [number,number])
    .filter(([nr,nc])=>nr>=0&&nr<ROWS&&nc>=0&&nc<COLS)
}
function placeMines(board:Board, skipR:number, skipC:number): Board {
  const b = board.map(r=>r.map(c=>({...c})))
  let placed=0
  while(placed<MINES){
    const r=Math.floor(Math.random()*ROWS),c=Math.floor(Math.random()*COLS)
    if(!b[r][c].mine&&!(r===skipR&&c===skipC)){b[r][c].mine=true;placed++}
  }
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++)
    if(!b[r][c].mine) b[r][c].count=neighbors(r,c).filter(([nr,nc])=>b[nr][nc].mine).length
  return b
}
function floodReveal(board:Board, r:number, c:number): Board {
  const b=board.map(row=>row.map(cell=>({...cell})))
  const q=[[r,c]]
  while(q.length){
    const [cr,cc]=q.pop()!
    if(b[cr][cc].revealed||b[cr][cc].flagged) continue
    b[cr][cc].revealed=true
    if(b[cr][cc].count===0&&!b[cr][cc].mine)
      neighbors(cr,cc).forEach(([nr,nc])=>{if(!b[nr][nc].revealed)q.push([nr,nc])})
  }
  return b
}

const NUM_COLORS=['','#4488ff','#00cc66','#ff4444','#9933ff','#ff6600','#00cccc','#ffffff','#888888']

export default function Minesweeper() {
  const [board, setBoard] = useState<Board>(emptyBoard)
  const [firstClick, setFirstClick] = useState(true)
  const [dead, setDead] = useState(false)
  const [won, setWon] = useState(false)
  const [flags, setFlags] = useState(0)

  function click(r:number,c:number) {
    if(dead||won) return
    let b = board
    if(firstClick){ b=placeMines(board,r,c); setFirstClick(false) }
    if(b[r][c].flagged||b[r][c].revealed) return
    if(b[r][c].mine){
      const nb=b.map(row=>row.map(cell=>cell.mine?{...cell,revealed:true}:cell))
      setBoard(nb); setDead(true); return
    }
    const nb=floodReveal(b,r,c)
    setBoard(nb)
    const safe=ROWS*COLS-MINES
    if(nb.flat().filter(c=>c.revealed).length===safe) setWon(true)
  }

  function rightClick(e:React.MouseEvent,r:number,c:number){
    e.preventDefault()
    if(dead||won||board[r][c].revealed) return
    const nb=board.map(row=>row.map(cell=>({...cell})))
    nb[r][c].flagged=!nb[r][c].flagged
    setFlags(f=>f+(nb[r][c].flagged?1:-1))
    setBoard(nb)
  }

  function reset(){setBoard(emptyBoard());setFirstClick(true);setDead(false);setWon(false);setFlags(0)}

  const face = dead?'😵':won?'😎':'🙂'

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">💣</span>
          <span className="text-[#ff4444] font-black text-lg w-6">{MINES-flags}</span>
        </div>
        <button onClick={reset}
          className="px-4 py-2 bg-[#ffffff10] border border-[#ffffff20] rounded-lg hover:bg-[#ffffff18] transition-all hover:scale-105 active:scale-95 text-lg">
          {face} Reset
        </button>
        {dead && <span className="text-[#ff0088] font-bold">BOOM! 💥</span>}
        {won && <span className="text-[#00ff88] font-bold">CLEAR! 🎉</span>}
      </div>
      <div className="border border-[#ffffff20] rounded-lg overflow-hidden bg-[#0d0d1a]">
        {board.map((row,r)=>(
          <div key={r} className="flex">
            {row.map((cell,c)=>(
              <button key={c} onClick={()=>click(r,c)} onContextMenu={e=>rightClick(e,r,c)}
                className={`w-9 h-9 text-sm font-black border border-[#ffffff08] flex items-center justify-center transition-colors select-none
                  ${cell.revealed
                    ? cell.mine?'bg-[#ff004428] text-red-400':'bg-[#ffffff06] text-current'
                    : 'bg-[#ffffff10] hover:bg-[#ffffff1a] cursor-pointer active:bg-[#ffffff08]'
                  }`}
                style={{color: cell.revealed&&!cell.mine&&cell.count ? NUM_COLORS[cell.count] : undefined}}>
                {cell.revealed
                  ? (cell.mine ? '💣' : cell.count||'')
                  : cell.flagged ? '🚩' : ''}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="text-gray-600 text-xs">Left click reveal &nbsp;·&nbsp; Right click flag</div>
    </div>
  )
}
