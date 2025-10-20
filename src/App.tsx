/**
 * このファイルはフレットボードとコード進行の画面全体をまとめる最上位コンポーネントである。
 * 初めて参加する人にも分かるように役割を順番に説明する。
 * React の状態管理を使って利用者の操作に応じた画面の変化を制御する。
 * 状態変数は表示するフレットの範囲、演奏の向き、音名や度数を表示するかどうかといった設定を保持する。
 * テーマ切り替えやテンポ指定、メトロノーム音量などの再生関連機能もここで扱う。
 * 選んだスケールとコード進行からフレットボード上の強調表示を計算し、子コンポーネントへ渡す。
 * 子コンポーネントは FretboardSVG、LegendPanel、ProgressionView であり、ここから矛盾のない情報を受け取る。
 * 調弦情報や音階の計算は core ディレクトリの music モジュール、色の定義は theme ディレクトリに置いて責務を分担している。
 */
import React, { useMemo, useState, useRef, useEffect } from 'react'

import { FretboardSVG } from './features/FretboardSVG'
import { LegendPanel } from './features/LegendPanel'
import { standardTuning, buildNotes } from './core/music'
import type { PC } from './core/music'
import { THEMES, type ThemeId } from './theme/colors'
import { ProgressionView } from './features/ProgressionView'

// 表示用キー名（C=0, C#=1, ...）
const PC_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'] as const

// スケール定義（半音数：R=0 起点）
const SCALES = {
  // Diatonic (Church Modes)
  major:        { label: 'Major (Ionian)',    intervals: [0,2,4,5,7,9,11] },
  dorian:       { label: 'Dorian',            intervals: [0,2,3,5,7,9,10] },
  phrygian:     { label: 'Phrygian',          intervals: [0,1,3,5,7,8,10] },
  lydian:       { label: 'Lydian',            intervals: [0,2,4,6,7,9,11] },
  mixolydian:   { label: 'Mixolydian',        intervals: [0,2,4,5,7,9,10] },
  naturalMinor: { label: 'Natural Minor (Aeolian)', intervals: [0,2,3,5,7,8,10] },
  locrian:      { label: 'Locrian',           intervals: [0,1,3,5,6,8,10] },

  // Pentatonic & Blues
  majorPent:    { label: 'Major Pentatonic',  intervals: [0,2,4,7,9] },
  minorPent:    { label: 'Minor Pentatonic',  intervals: [0,3,5,7,10] },
  bluesHex:     { label: 'Blues (Hexatonic)', intervals: [0,3,5,6,7,10] }, // R, b3, 4, b5, 5, b7

  // Other / Color
  harmonicMinor:{ label: 'Harmonic Minor',    intervals: [0,2,3,5,7,8,11] },
  melodicMinor: { label: 'Melodic Minor (Jazz/Asc.)', intervals: [0,2,3,5,7,9,11] },
  wholeTone:    { label: 'Whole Tone',        intervals: [0,2,4,6,8,10] },
  dimHalfWhole: { label: 'Diminished (Half–Whole)', intervals: [0,1,3,4,6,7,9,10] },
  dimWholeHalf: { label: 'Diminished (Whole–Half)', intervals: [0,2,3,5,6,8,9,11] },
} as const
type ScaleId = keyof typeof SCALES

// セレクト用グループ
const SCALES_GROUPS: { group: string; ids: ScaleId[] }[] = [
  { group: 'Diatonic', ids: ['major','dorian','phrygian','lydian','mixolydian','naturalMinor','locrian'] },
  { group: 'Pentatonic & Blues', ids: ['majorPent','minorPent','bluesHex'] },
  { group: 'Other', ids: ['harmonicMinor','melodicMinor','wholeTone','dimHalfWhole','dimWholeHalf'] },
]

// コードトーン表示モード
type ChordToneMode = 'off' | 'triad' | 'seventh' | 'extended'

type AccentMode = 'downbeat' | 'backbeat' | 'even'
type Anticipation = 'immediate' | 'e' | 'and' | 'a'  // 4拍目のどこで切替えるか

// コード進行プリセット
const PROGRESSIONS: Record<string, string[]> = {
  '12-bar Blues (A)': ['A','D','A','A','D','D','A','A','E','D','E','A'],
  '12-bar Blues (E)': ['E','A','E','E','A','A','E','E','B','A','B','E'],
  'Jazz Blues (Bb)':  ['Bb7','Eb7','Bb7','Bb7','Eb7','Edim','Bb7','G7','C7','F7','Bb7','F7'],
}
type ProgressionId = keyof typeof PROGRESSIONS


// スケールの intervals(0=R) からモード別に相対度数を返す
function buildChordDegrees(
  intervals: ReadonlyArray<number>,
  mode: ChordToneMode
): number[] {
  if (mode === 'off') return []
  const has = (n: number) => intervals.includes(n)
  const deg = new Set<number>()

  // Triad
  deg.add(0)                     // R
  if (has(4)) deg.add(4)         // M3
  else if (has(3)) deg.add(3)    // m3
  if (has(7)) deg.add(7)         // P5
  else if (has(6)) deg.add(6)    // #4/b5（5が無いスケールの代替）

  if (mode === 'triad') return Array.from(deg)

  // Seventh
  if (has(10)) deg.add(10)       // b7
  else if (has(11)) deg.add(11)  // 7

  if (mode === 'seventh') return Array.from(deg)

  // Extended（9,11,13 を含んでいれば追加）
  if (has(2)) deg.add(2)         // 9 実音=2
  if (has(5)) deg.add(5)         // 11 実音=4
  if (has(9)) deg.add(9)         // 13 実音=6

  return Array.from(deg)
}

// ルート名→PC（C=0 ... B=11）。A, A#, Ab などを許容
function pcFromNameUnsafe(name: string): number {
  const m = name.trim().match(/^([A-Ga-g])([#b]?)/)
  if (!m) return 0
  const base = {C:0,D:2,E:4,F:5,G:7,A:9,B:11}[m[1].toUpperCase() as 'A']
  const acc = m[2] === '#' ? 1 : (m[2] === 'b' ? -1 : 0)
  return (base + acc + 12) % 12
}

// コード品質
type ChordQuality = 'triad' | 'dom7'

// 品質→相対度数（0=R）
// triad = R,3,5（常にメジャー想定） / dom7 = R,3,5,b7
function chordDegreesFor(quality: ChordQuality): number[] {
  return quality === 'triad' ? [0,4,7] : [0,4,7,10]
}

// 置換: time 指定で正確に鳴らす
function playClickAtTime(ctx: AudioContext, time: number, accent: boolean, volume: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'square'
  osc.frequency.setValueAtTime(accent ? 1200 : 900, time)

  const dur = accent ? 0.10 : 0.08
  const peak = Math.max(0.0001, Math.min(accent ? volume : volume * 0.8, 1))

  // エンベロープ（ポップノイズ抑制）
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.linearRampToValueAtTime(peak, time + 0.002)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + dur)

  osc.connect(gain).connect(ctx.destination)
  osc.start(time)
  osc.stop(time + dur + 0.02)
}

function isAccentBeat(beat: number, beatsPerBar: number, mode: AccentMode) {
  if (mode === 'even') return false
  if (mode === 'downbeat') return beat === 1
  // backbeat: 2拍目と4拍目（拍子が3や6でも “2と4優先” は実用的）
  return beat === 2 || (beatsPerBar >= 4 && beat === 4)
}

export default function App() {
  // 共有UI
  const [startFret, setStartFret] = useState(0)
  const [endFret, setEndFret] = useState(12)
  const [lefty, setLefty] = useState(false)
  const [showNote, setShowNote] = useState(true)
  const [showDeg, setShowDeg] = useState(true)

  // テーマ
  const [themeId, setThemeId] = useState<ThemeId>('jazz')
  const theme = THEMES[themeId]

  // ====== 自動再生（テンポ）関連 ======
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(90)              // 60–240 くらい推奨
  const [beatsPerBar, setBeatsPerBar] = useState(4) // 4/4想定、必要なら 3, 6 なども
  const [beatIdx, setBeatIdx] = useState(1)       // 1..beatsPerBar（UI表示用）

  const [clickVol, setClickVol] = useState(0.5)   // 0..1
  const audioCtxRef = useRef<AudioContext | null>(null)
  const beatRef = useRef(1)                       // 進行用の内部カウンタ
  
  // スケールA（メイン）
  const [keyA, setKeyA] = useState(0)                // C=0
  const [scaleA, setScaleA] = useState<ScaleId>('major')
  const [chordToneMode, setChordToneMode] = useState<ChordToneMode>('seventh')

  // スケールB（オーバーレイ）
  const [overlayOn, setOverlayOn] = useState(false)
  const [keyB, setKeyB] = useState(0)
  const [scaleB, setScaleB] = useState<ScaleId>('minorPent')
  const [showOverlayLabels, setShowOverlayLabels] = useState(false)

  // ブルーノート（b3, b5）
  const [blueOn, setBlueOn] = useState(false)

  // ---- 計算 ----
  const tonicA = (keyA % 12) as PC
  const tonicB = (keyB % 12) as PC
  const keyNameA = PC_NAMES[keyA]

  // コード進行機能
  const [progressionOn, setProgressionOn] = useState(true)



  // --- コード進行プリセット ---
  const PROGRESSIONS = {
    '12-bar Blues (A)': ['A','D','A','A','D','D','A','A','E','D','E','A'],
    '12-bar Blues (E)': ['E','A','E','E','A','A','E','E','B','A','B','E'],
    'Jazz Blues (Bb)':  ['Bb7','Eb7','Bb7','Bb7','Eb7','Edim','Bb7','G7','C7','F7','Bb7','F7'],
  } as const
  type ProgressionId = keyof typeof PROGRESSIONS
  


  const [currentBar, setCurrentBar] = useState(1)            // 1..12
  const [progQuality, setProgQuality] = useState<ChordQuality>('dom7') // triad or dom7

  const [displayBar, setDisplayBar] = useState(1)   // 画面に表示する“バー”
  const barRef = useRef(1)                          // 現在の実バー（スケジューラ用） 
  useEffect(() => { barRef.current = currentBar }, [currentBar])

  const [accentMode, setAccentMode] = useState<AccentMode>('downbeat')// クリックのアクセント
  const [anticipation, setAnticipation] = useState<Anticipation>('a') // ← デフォは「裏の裏」= 4のa

  //コード編集
  const [progressionId, setProgressionId] = useState<ProgressionId>('12-bar Blues (A)')
  const progression = PROGRESSIONS[progressionId]

  // 再生していない時や手動変更時は表示を実バーに合わせる
  useEffect(() => {
    if (!isPlaying) setDisplayBar(currentBar)
  }, [isPlaying, currentBar])

  // 今の小節のコード名・PC（★displayBar基準に変更）
  const currentChordName = useMemo(
    () => progression[(displayBar - 1 + 12) % 12],
    [progression, displayBar]
  )
  const currentChordRoot = useMemo(
    () => (pcFromNameUnsafe(currentChordName) % 12) as PC,
    [currentChordName]
  )

  // 小節コードのトーン集合（絶対PC）
  const chordSetBar = useMemo<Set<PC>>(() => {
    const rel = chordDegreesFor(progQuality)
    return new Set<PC>(rel.map(d => ((d + currentChordRoot) % 12) as PC))
  }, [progQuality, currentChordRoot])

  const scaleSetA = useMemo(() => {
    const ints = SCALES[scaleA].intervals
    return new Set<number>(ints.map(i => (i + tonicA) % 12))
  }, [scaleA, tonicA])

  // ★ モード対応のコードトーン集合（絶対PC）
  const chordSetA = useMemo<Set<PC>>(() => {
    const rel = buildChordDegrees(SCALES[scaleA].intervals, chordToneMode)
    return new Set<PC>(rel.map(d => ((d + tonicA) % 12) as PC))
  }, [scaleA, chordToneMode, tonicA])  // ← chordToneMode を依存に追加

  const scaleSetB = useMemo(() => {
    if (!overlayOn) return new Set<number>()
    const ints = SCALES[scaleB].intervals
    return new Set<number>(ints.map(i => (i + tonicB) % 12))
  }, [overlayOn, scaleB, tonicB])

  // ブルーノート（Aキー基準 b3, b5）
  const blueSet = useMemo(() => {
    if (!blueOn) return new Set<number>()
    return new Set<number>([(tonicA + 3) % 12, (tonicA + 6) % 12])
  }, [blueOn, tonicA])

  // A ∪ B … 既に表示中の音
  const visibleSet = useMemo(() => {
    const u = new Set<number>(scaleSetA)
    if (overlayOn) scaleSetB.forEach(pc => u.add(pc))
    return u
  }, [scaleSetA, overlayOn, scaleSetB])

  // 指板ノート
  const baseNotes = useMemo(() => buildNotes({
    tuning: standardTuning,
    startFret, endFret, lefty,
    filter: (pc) => scaleSetA.has(pc),
    chordTones: progressionOn ? chordSetBar : chordSetA,
  }), [startFret, endFret, lefty, scaleSetA, chordSetA, progressionOn, chordSetBar ])

  const overlayNotes = useMemo(() => buildNotes({
    tuning: standardTuning,
    startFret, endFret, lefty,
    filter: (pc) => overlayOn && scaleSetB.has(pc) && !scaleSetA.has(pc),
    chordTones: new Set<PC>(),
  }), [startFret, endFret, lefty, overlayOn, scaleSetA, scaleSetB])

  const blueNotes = useMemo(() => buildNotes({
    tuning: standardTuning,
    startFret, endFret, lefty,
    filter: (pc) => blueSet.has(pc) && !visibleSet.has(pc),
    chordTones: new Set<PC>(),
  }), [startFret, endFret, lefty, blueSet, visibleSet])

// ====== 先読みスケジューラ（AudioContext基準） ======
  const schedulerTimerIdRef = useRef<number | null>(null)
  const nextBeatTimeRef = useRef<number>(0) // AudioContext の次イベント時刻

  useEffect(() => {
    if (!isPlaying) {
      // 停止時クリーンアップ
      if (schedulerTimerIdRef.current != null) {
        clearInterval(schedulerTimerIdRef.current)
        schedulerTimerIdRef.current = null
      }
      return
    }

    // AudioContext 準備
    let ctx = audioCtxRef.current
    if (!ctx) {
      const AC = (window.AudioContext || (window as any).webkitAudioContext)
      ctx = new AC()
      audioCtxRef.current = ctx
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(()=>{})
    }

    // 先読み / ルックアヘッド設定
    const lookaheadMs = 25            // 25msごとにチェック
    const scheduleAheadSec = 0.10     // 100ms 先まで予約

    // 再生開始時の初期化（ダウンビートから）
    beatRef.current = beatIdx || 1
    setBeatIdx(beatRef.current)
    nextBeatTimeRef.current = ctx.currentTime + 0.05 // 50ms 後に最初のクリック

    const schedule = () => {
      if (!ctx) return
      const secPerBeat = 60 / Math.max(1, bpm)

      while (nextBeatTimeRef.current < ctx.currentTime + scheduleAheadSec) {
        const t = nextBeatTimeRef.current
        const curBeat = beatRef.current
        const accent = isAccentBeat(curBeat, beatsPerBar, accentMode)

        // ---- クリック音を予約 ----
        playClickAtTime(ctx, t, accent, clickVol)

        // クリック予約の直後:
        if (curBeat === beatsPerBar) {
          // 切替オフセット（1拍の中の位置）
          // immediate=0, e=0.25, and=0.5, a=0.75
          const offsetFactor =
            anticipation === 'immediate' ? 0 :
            anticipation === 'e'         ? 0.25 :
            anticipation === 'and'       ? 0.5 :
                                          0.75; // 'a'

          const switchAt = t + secPerBeat * offsetFactor  // ← この時刻に表示だけ次バーへ
          const nextBar = (barRef.current >= 12) ? 1 : (barRef.current + 1)
          const delayMs = Math.max(0, (switchAt - ctx.currentTime) * 1000)

          window.setTimeout(() => setDisplayBar(nextBar), delayMs)
        } else {
          // 他の拍は実バーをそのまま表示（クリック直後に合わせる）
          const curBar = barRef.current
          const delayMs = Math.max(0, (t - ctx.currentTime) * 1000 + 10)
          window.setTimeout(() => setDisplayBar(curBar), delayMs)
        }

        // ---- UI更新＆次拍準備 ----
        setBeatIdx(curBeat)
        const nextBeat = (curBeat >= beatsPerBar) ? 1 : (curBeat + 1)
        beatRef.current = nextBeat
        nextBeatTimeRef.current += secPerBeat

        // 小節頭になったら本体の currentBar を進める（1拍目で）
        if (nextBeat === 1) {
          setCurrentBar(b => (b >= 12 ? 1 : b + 1))
        }
      }
    }

  schedulerTimerIdRef.current = window.setInterval(schedule, lookaheadMs) as any

  return () => {
    if (schedulerTimerIdRef.current != null) {
      clearInterval(schedulerTimerIdRef.current)
      schedulerTimerIdRef.current = null
    }
  }
}, [isPlaying, bpm, beatsPerBar, clickVol, accentMode, anticipation, setCurrentBar])
  

  return (
    <div style={{padding:'16px', display:'grid', gap:'12px', maxWidth:1280, margin:'0 auto'}}>
      <h1 style={{margin:0, fontSize:'20px'}}>Fretboard Viewer by izaq</h1>

      {/* コントロール */}
      <div style={{display:'flex', gap:'12px', flexWrap:'wrap', alignItems:'center'}}>
        <label>Theme:{' '}
          <select value={themeId} onChange={e=>setThemeId(e.target.value as ThemeId)}>
            <option value="jazz">Jazz (Colorblind-safe)</option>
            <option value="fusion">Fusion (Vivid)</option>
            <option value="mono">Mono (Black)</option>
          </select>
        </label>

        <label>Key :{' '}
          <select value={keyA} onChange={e=>setKeyA(Number(e.target.value))}>
            {PC_NAMES.map((n, i)=> <option key={n} value={i}>{n}</option>)}
          </select>
        </label>

        <label>Scale:{' '}
          <select value={scaleA} onChange={e=>setScaleA(e.target.value as ScaleId)}>
            {SCALES_GROUPS.map(({group, ids}) => (
              <optgroup key={group} label={group}>
                {ids.map(id => <option key={id} value={id}>{SCALES[id].label}</option>)}
              </optgroup>
            ))}
          </select>
        </label>

        <label>
          Chord Tones:{' '}
          <select value={chordToneMode} onChange={e => setChordToneMode(e.target.value as ChordToneMode)}>
            <option value="off">Off</option>
            <option value="triad">Triad (R,3,5)</option>
            <option value="seventh">7th (R,3,5,7)</option>
            <option value="extended">Extended (R,3,5,7,9,11,13)</option>
          </select>
        </label>

        <span style={{width:16}} />

        <label><input type="checkbox" checked={blueOn} onChange={e=>setBlueOn(e.target.checked)}/> BlueNotes b3,b5</label>

        <span style={{width:16}} />

        <label><input type="checkbox" checked={overlayOn} onChange={e=>setOverlayOn(e.target.checked)}/> Overlay another Scale</label>
        {overlayOn && (
          <>
            <label>Key :{' '}
              <select value={keyB} onChange={e=>setKeyB(Number(e.target.value))}>
                {PC_NAMES.map((n, i)=> <option key={n} value={i}>{n}</option>)}
              </select>
            </label>
            <label>Scale :{' '}
              <select value={scaleB} onChange={e=>setScaleB(e.target.value as ScaleId)}>
                {Object.entries(SCALES).map(([id, s]) => <option key={id} value={id}>{s.label}</option>)}
              </select>
            </label>
            <label><input type="checkbox" checked={showOverlayLabels} onChange={e=>setShowOverlayLabels(e.target.checked)}/> Bの度数ラベル</label>
          </>
        )}

        <span style={{width:16}} />

        <label>Start:{' '}
          <input type="number" value={startFret} min={0} max={22}
                 onChange={e=>setStartFret(Math.min(+e.target.value, endFret-1))} style={{width:60}}/>
        </label>
        <label>End:{' '}
          <input type="number" value={endFret} min={1} max={24}
                 onChange={e=>setEndFret(Math.max(+e.target.value, startFret+1))} style={{width:60}}/>
        </label>

        <label><input type="checkbox" checked={lefty} onChange={e=>setLefty(e.target.checked)}/> Left-handed</label>
        <label><input type="checkbox" checked={showNote} onChange={e=>setShowNote(e.target.checked)}/> Note</label>
        <label><input type="checkbox" checked={showDeg} onChange={e=>setShowDeg(e.target.checked)}/> Degree</label>
      </div>
      <div>
        {/* --- コード進行 --- */}
        <label>
          <input
            type="checkbox"
            checked={progressionOn}
            onChange={e => setProgressionOn(e.target.checked)}
          /> Progression (12-bar A)
        </label>

        {progressionOn && (
          <>
            <label>
              Bar:{' '}
              <input
                type="number"
                min={1} max={12}
                value={currentBar}
                onChange={e => setCurrentBar(Math.min(12, Math.max(1, +e.target.value || 1)))}
                style={{width:60}}
              />
            </label>
            <button onClick={()=>setCurrentBar(b => (b<=1 ? 12 : b-1))}>◀ Prev</button>
            <button onClick={()=>setCurrentBar(b => (b>=12 ? 1 : b+1))}>Next ▶</button>

            <span style={{marginLeft:8, fontWeight:600}}>
              Chord: {currentChordName}{progQuality==='dom7' ? '7' : ''}
            </span>

            <label style={{marginLeft:12}}>
              Quality:{' '}
              <select value={progQuality} onChange={e=>setProgQuality(e.target.value as ChordQuality)}>
                <option value="triad">Triad (R,3,5)</option>
                <option value="dom7">Dominant 7th (R,3,5,b7)</option>
              </select>
            </label>
          </>
        )}
      </div>
      {/* --- Transport（再生系） --- */}
      <div style={{display:'flex', gap:12, flexWrap:'wrap', alignItems:'center'}}>
        <button
          onClick={() => {
            // 初回クリックで AudioContext を起こす
            if (!audioCtxRef.current) {
              const AC = (window.AudioContext || (window as any).webkitAudioContext)
              audioCtxRef.current = new AC()
            } else if (audioCtxRef.current.state === 'suspended') {
              audioCtxRef.current.resume().catch(()=>{})
            }
            // 再生開始時に拍をリセットしたい場合は次の2行を有効化
            // beatRef.current = 1
            // setBeatIdx(1)
            setIsPlaying(true)
          }}
          disabled={isPlaying}
        >▶ Play</button>

        <button onClick={() => setIsPlaying(false)} disabled={!isPlaying}>⏹ Stop</button>

        <label>BPM:{' '}
          <input
            type="number" min={30} max={240}
            value={bpm}
            onChange={e => setBpm(Math.min(240, Math.max(30, +e.target.value || 30)))}
            style={{width:70}}
          />
        </label>

        <label>Beats/Bar:{' '}
          <select value={beatsPerBar} onChange={e => {
            const v = Number(e.target.value)
            beatRef.current = 1
            setBeatIdx(1)
            setBeatsPerBar(v)
          }}>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={6}>6</option>
          </select>
        </label>
        <label>Accent:{' '}
          <select value={accentMode} onChange={e=>setAccentMode(e.target.value as AccentMode)}>
            <option value="downbeat">Downbeat (1 only)</option>
            <option value="backbeat">Backbeat (2 &amp; 4)</option>
            <option value="even">Even (no accent)</option>
          </select>
        </label>

        <label>Click Vol:{' '}
          <input
            type="range" min={0} max={1} step={0.01}
            value={clickVol}
            onChange={e => setClickVol(parseFloat(e.target.value))}
            style={{verticalAlign:'middle'}}
          />
          <span>{Math.round(clickVol*100)}%</span>
        </label>
        <label>Switch timing:{' '}
          <select value={anticipation} onChange={e=>setAnticipation(e.target.value as Anticipation)}>
            <option value="immediate">4 の直後</option>
            <option value="e">4 の e（16分1つ後）</option>
            <option value="and">4 の &amp;（8分後）</option>
            <option value="a">4 の a（16分3つ後）</option>
          </select>
        </label>

        <span style={{marginLeft:8}}>Beat: {beatIdx}/{beatsPerBar}</span>
        <span> | Bar: {currentBar}/12</span>
        <label>
          Progression Preset:{' '}
          <select value={progressionId} onChange={e => setProgressionId(e.target.value as ProgressionId)}>
            {Object.keys(PROGRESSIONS).map(id => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </label>
      </div>
      
      {/* コード進行の表示 */}
      {progressionOn && (
        <ProgressionView
          progression={progression}
          currentBar={currentBar}
          onSelectBar={(bar)=>setCurrentBar(bar)}
        />
      )}

      {/* 指板本体 */}
      <div style={{border:'1px solid #ddd', borderRadius:8, padding:8}}>
        <FretboardSVG
          width={1200}
          height={420}
          // A（メイン）
          notes={baseNotes}
          startFret={startFret}
          endFret={endFret}
          showNote={showNote}
          showDeg={showDeg}
          tonic={tonicA}
          keyName={keyNameA}
          tuning={standardTuning}
          showFretNumbers={true}
          // B（オーバーレイ）
          overlayNotes={overlayOn ? overlayNotes : []}
          overlayTonic={overlayOn ? tonicB : undefined}
          overlayShowLabels={overlayOn && showOverlayLabels}
          // Blue（b3,b5）
          blueNotes={blueOn ? blueNotes : []}
          // コードトーン描画ON/OFF（塗り）／拡張表記
          showChordTones={chordToneMode !== 'off'}
          preferExtensions={chordToneMode === 'extended'}
          // テーマ
          theme={theme}
        />
      </div>

      <LegendPanel />
    </div>
  )
}
