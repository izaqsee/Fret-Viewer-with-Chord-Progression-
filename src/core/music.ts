
export type PC = 0|1|2|3|4|5|6|7|8|9|10|11

// 標準チューニング（低音弦→高音弦）
export const standardTuning = ['E','A','D','G','B','E']

const SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'] as const
const FLAT  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'] as const

const FLAT_KEYS = new Set(['F','Bb','Eb','Ab','Db','Gb','Cb','Dm','Gm','Cm','Fm','Bbm','Ebm','Abm'])

export function pcOf(name: string): PC {
  const n = name.trim().replace(/m$/,'').toUpperCase()
  const map: Record<string, number> = {
    'C':0,'C#':1,'DB':1,'D':2,'D#':3,'EB':3,'E':4,'FB':4,
    'E#':5,'F':5,'F#':6,'GB':6,'G':7,'G#':8,'AB':8,'A':9,'A#':10,'BB':10,'B':11,'CB':11,'B#':0
  }
  const v = map[n]
  if (v===undefined) throw new Error('Unknown note: '+name)
  return (v % 12) as PC
}

export function pcName(pc: PC, keyHint='C'): string {
  const preferFlat = FLAT_KEYS.has(keyHint)
  return (preferFlat ? FLAT : SHARP)[pc]
}

export function degreeLabel(tonic: PC, note: PC, preferSharps=false): string {
  const s = (note - tonic + 12) % 12
  return ['R', preferSharps?'#1':'b2', '2','b3','3','4', preferSharps?'#4':'b5','5',
          preferSharps?'#5':'b6','6','b7','7'][s]
}

export function buildNotes(opts: {
  tuning: string[]
  startFret: number
  endFret: number
  lefty: boolean
  filter: (pc: PC)=>boolean
  chordTones: Set<PC>
}) {
  const openPCs = opts.tuning.map(pcOf) as PC[];
  const strings = opts.tuning.length;
  const notes: {x:number;y:number;pc:PC;isScale:boolean;isChordTone:boolean}[] = [];

  for (let s = 0; s < strings; s++) {
    for (let f = opts.startFret; f <= opts.endFret; f++) {
      const pc = ((openPCs[s] + f) % 12) as PC;
      const isScale = opts.filter(pc);
      const isChordTone = opts.chordTones.has(pc);

      // ★ 縦方向を反転：上=1弦、下=6弦
      //   s=0 は 6弦（低音）なので、一番下（strings-1行目）に配置する
      const visualRow = (strings - 1 - s);
      const y = visualRow + 0.5;

      // 横方向（フレット）は従来通り。lefty は左右反転のみ別処理
      const x = (f - opts.startFret) + 0.5;

      notes.push({ x, y, pc, isScale, isChordTone });
    }
  }

  // 左利きは左右のみ反転（上下は反転しない）
  if (opts.lefty) {
    const maxX = (opts.endFret - opts.startFret) + 1;
    notes.forEach(n => n.x = (maxX - n.x));
  }
  return notes;
}