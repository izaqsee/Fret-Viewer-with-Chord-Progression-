// 音楽理論に関するドメインロジックを集約したモジュール。
// 指板描画側に具体的な数値処理を持ち込まないよう、音名・度数計算をここで完結させる。
export type PC = 0|1|2|3|4|5|6|7|8|9|10|11

// 標準チューニング（低音弦→高音弦）
export const standardTuning = ['E','A','D','G','B','E']

// シャープ系・フラット系の12音を固定配列で持ち、キーに応じて参照する。
const SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'] as const
const FLAT  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'] as const

// フラット表記を優先するキー（調号に♭が含まれるもの）。
const FLAT_KEYS = new Set(['F','Bb','Eb','Ab','Db','Gb','Cb','Dm','Gm','Cm','Fm','Bbm','Ebm','Abm'])

// 任意のコードネームを受け取り、内部表現である Pitch Class (0-11) に変換する。
// m や #/b を含む多くの表記ゆれを手作業のマッピングで吸収している。
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
  // スケールの文脈（キー）によってはフラット表記を優先したいので、
  // よく使われるフラット系キーをセットで管理して判定する。
  const preferFlat = FLAT_KEYS.has(keyHint)
  return (preferFlat ? FLAT : SHARP)[pc]
}

// 指定したトニック（基準音）に対する度数表記を返す。
// スケール外で現れる #4 / b6 なども想定して固定テーブルを用意する。
export function degreeLabel(tonic: PC, note: PC, preferSharps=false): string {
  const s = (note - tonic + 12) % 12
  return ['R', preferSharps?'#1':'b2', '2','b3','3','4', preferSharps?'#4':'b5','5',
          preferSharps?'#5':'b6','6','b7','7'][s]
}

// 指板上に並ぶ全ノートのメタデータを生成する。
// フィルタ関数とコードトーン集合を受け取り、描画時に必要な情報を備えた構造体に整形する。
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

      // 画面上では 1弦を上に表示したいため、インデックスを反転する。
      const visualRow = (strings - 1 - s);
      const y = visualRow + 0.5;

      // フレットごとの左右座標は 0.5 オフセットしてマス目の中心に配置。
      const x = (f - opts.startFret) + 0.5;

      notes.push({ x, y, pc, isScale, isChordTone });
    }
  }

  // 左利きモードでは X 座標を鏡写しにするだけで、弦順はそのまま残す。
  if (opts.lefty) {
    const maxX = (opts.endFret - opts.startFret) + 1;
    notes.forEach(n => n.x = (maxX - n.x));
  }
  return notes;
}
