import { useState, useEffect } from 'react'

type Grid = (number|0)[][]

function empty(): Grid { return Array.from({length:4},()=>Array(4).fill(0)) }

function addTile(grid: Grid): Grid {
  const free: [number,number][] = []
  for(let r=0;r<4;r++) for(let c=0;c<4;c++) if(!grid[r][c]) free.push([r,c])
  if(!free.length) return grid
  const [r,c]=free[Math.floor(Math.random()*free.length)]
  const ng=grid.map(row=>[...row]) as Grid
  ng[r][c]=Math.random()<0.9?2:4
  return ng
}

function slideRow(row: number[]): {row:number[],score:number} {
  const f=row.filter(Boolean); let score=0
  const merged: number[]=[]
  for(let i=0;i<f.length;i++) {
    if(i+1<f.length&&f[i]===f[i+1]){merged.push(f[i]*2);score+=f[i]*2;i++}else merged.push(f[i])
  }
  while(merged.length<4) merged.push(0)
  return {row:merged,score}
}

function transpose(g: Grid): Grid { return g[0].map((_,c)=>g.map(r=>r[c])) }

function moveGrid(grid: Grid, dir: string): {grid:Grid,score:number,changed:boolean} {
  let g=grid.map(r=>[...r]) as Grid, score=0, changed=false
  const processRow=(row:number[])=>{
    const s=slideRow(row); score+=s.score
    if(s.row.join()!==row.join()) changed=true
    return s.row as number[]
  }
  const processRowRight=(row:number[])=>{
    const rev=[...row].reverse()
    const s=slideRow(rev); score+=s.score
    const res=s.row.reverse()
    if(res.join()!==row.join()) changed=true
    return res as number[]
  }
  if(dir==='ArrowLeft') g=g.map(processRow) as Grid
  else if(dir==='ArrowRight') g=g.map(processRowRight) as Grid
  else if(dir==='ArrowUp') { g=transpose(g); g=g.map(processRow) as Grid; g=transpose(g) }
  else if(dir==='ArrowDown') { g=transpose(g); g=g.map(processRowRight) as Grid; g=transpose(g) }
  return {grid:g,score,changed}
}

function hasLost(grid: Grid): boolean {
  for(let r=0;r<4;r++) for(let c=0;c<4;c++){
    if(!grid[r][c]) return false
    if(c+1<4&&grid[r][c]===grid[r][c+1]) return false
    if(r+1<4&&grid[r][c]===grid[r+1][c]) return false
  }
  return true
}

const COLORS: Record<number,{bg:string,text:string}> = {
  2:{bg:'#eee4da',text:'#776e65'}, 4:{bg:'#ede0c8',text:'#776e65'},
  8:{bg:'#f2b179',text:'#f9f6f2'}, 16:{bg:'#f59563',text:'#f9f6f2'},
  32:{bg:'#f67c5f',text:'#f9f6f2'}, 64:{bg:'#f65e3b',text:'#f9f6f2'},
  128:{bg:'#edcf72',text:'#f9f6f2'}, 256:{bg:'#edcc61',text:'#f9f6f2'},
  512:{bg:'#edc850',text:'#f9f6f2'}, 1024:{bg:'#edc53f',text:'#f9f6f2'},
  2048:{bg:'#edc22e',text:'#f9f6f2'},
}

export default function Game2048() {
  const [grid, setGrid] = useState<Grid>(()=>addTile(addTile(empty())))
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [lost, setLost] = useState(false)
  const [won, setWon] = useState(false)
  const [continued, setContinued] = useState(false)

  function reset() {
    setGrid(addTile(addTile(empty())))
    setScore(0); setLost(false); setWon(false); setContinued(false)
  }

  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return
      e.preventDefault()
      if(lost) return
      setGrid(prev=>{
        const {grid:ng,score:s,changed}=moveGrid(prev,e.key)
        if(!changed) return prev
        setScore(sc=>{const ns=sc+s;setBest(b=>Math.max(b,ns));return ns})
        const next=addTile(ng)
        if(!won&&!continued&&next.flat().includes(2048)) setWon(true)
        if(hasLost(next)) setLost(true)
        return next
      })
    }
    window.addEventListener('keydown',onKey)
    return ()=>window.removeEventListener('keydown',onKey)
  },[lost,won,continued])

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex gap-3 items-center">
        <div className="bg-[#ffffff10] border border-[#ffffff15] rounded-lg px-5 py-2 text-center">
          <div className="text-gray-500 text-xs">SCORE</div>
          <div className="text-[#cc44ff] font-black text-xl">{score}</div>
        </div>
        <div className="bg-[#ffffff10] border border-[#ffffff15] rounded-lg px-5 py-2 text-center">
          <div className="text-gray-500 text-xs">BEST</div>
          <div className="text-[#ffcc00] font-black text-xl">{best}</div>
        </div>
        <button onClick={reset}
          className="px-4 py-2 bg-[#cc44ff22] border border-[#cc44ff44] rounded-lg text-sm hover:bg-[#cc44ff33] transition-all hover:scale-105 active:scale-95">
          New Game
        </button>
      </div>
      {won && !continued && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-[#ffcc00] text-xl font-black">2048! YOU WIN! 🏆</div>
          <button onClick={()=>setContinued(true)} className="px-4 py-1.5 bg-[#ffcc0022] border border-[#ffcc0044] rounded text-sm hover:bg-[#ffcc0033] transition-all">
            Keep playing
          </button>
        </div>
      )}
      {lost && <div className="text-[#ff0088] text-xl font-black">GAME OVER!</div>}
      <div className="bg-[#1a1a2e] p-3 rounded-2xl border border-[#ffffff12]">
        <div className="grid grid-cols-4 gap-3">
          {grid.map((row,r)=>row.map((val,c)=>{
            const col=val?COLORS[val]||{bg:'#3c3a32',text:'#f9f6f2'}:null
            return (
              <div key={`${r}-${c}`}
                className="w-[72px] h-[72px] rounded-xl flex items-center justify-center font-black transition-all duration-75"
                style={{
                  backgroundColor: col?col.bg:'#0d0d1a',
                  color: col?col.text:'transparent',
                  fontSize: val>=1000?'15px':val>=100?'20px':'24px',
                  boxShadow: val?`0 0 14px ${col!.bg}55`:'none',
                }}>
                {val||''}
              </div>
            )
          }))}
        </div>
      </div>
      <div className="text-gray-600 text-xs">Arrow keys to merge tiles</div>
    </div>
  )
}
