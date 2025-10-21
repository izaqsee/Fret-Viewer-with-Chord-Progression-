import React from 'react'
import { PC, pcName, degreeLabel } from '../core/music'
import type { FretTheme } from '../theme/colors'

type Note = { x:number; y:number; pc:PC; isScale:boolean; isChordTone:boolean }

// 指板上の各要素（弦、フレット、マーカー、音符）を SVG で描画する純粋表示コンポーネント。
// App で生成したノート情報を受け取り、テーマ設定や表示フラグに応じてレイヤーごとに描画する。
export function FretboardSVG(props: {
  width: number
  height: number
  // A: メインスケール
  notes: Note[]
  startFret: number
  endFret: number
  showNote: boolean
  showDeg: boolean
  tonic: PC
  keyName: string
  // 共通
  tuning?: string[]
  showFretNumbers?: boolean
  // B: オーバーレイ
  overlayNotes?: Note[]
  overlayTonic?: PC
  overlayShowLabels?: boolean
  // Blue: ブルーノート
  blueNotes?: Note[]
  // オプション
  showChordTones?: boolean
  preferExtensions?: boolean // 2/4/6 を 9/11/13 で表示
  fontScale?: number
  theme?: FretTheme
}) {
  const strings = Math.max(...props.notes.map(n => n.y)) + 0.5
  const frets = props.endFret - props.startFret + 1

  // SVG の余白と格子一辺のサイズを先に計算しておく。
  const s = Math.max(0.6, Math.min(1.6, props.fontScale ?? 1))
  const padX = Math.round(48 * s)
  const padY = Math.round(24 * s)
  const innerW = props.width - padX * 2
  const innerH = props.height - padY * 2
  const cellW = innerW / frets
  const cellH = innerH / strings

  // グリッド座標から SVG 座標へ変換するためのヘルパー。
  const xOfCol = (col:number) => padX + col * cellW
  const xOfSpaceCenter = (col:number) => padX + (col + 0.5) * cellW
  const yOfRowCenter = (row:number) => padY + (row + 0.5) * cellH

  // よく使うポジションマーカー（3,5,...）やナット有無を先に算出。
  const markerFrets = [3, 5, 7, 9, 12, 15, 17, 19, 21]
  const hasNut = props.startFret === 0
  const theme = props.theme

  return (
    <svg width={props.width} height={props.height} viewBox={`0 0 ${props.width} ${props.height}`}>
      {/* 背景 */}
      <rect x={0} y={0} width={props.width} height={props.height} fill={theme?.bg ?? '#fff'}/>

      {/* 弦（横線）: 1弦と6弦は太さを変え、視覚的な上下を明確にする */}
      {Array.from({ length: strings }).map((_, i) => {
        const y = yOfRowCenter(i)
        const thick = i === 0 || i === strings - 1 ? 2 : 1
        return (
          <line
            key={'s' + i}
            x1={padX}
            y1={y}
            x2={padX + innerW}
            y2={y}
            stroke={theme?.stringStroke ?? '#000'}
            strokeWidth={thick}
          />
        )
      })}

      {/* フレット（縦線）: 0フレット（ナット）は太線、それ以外は細線 */}
      {Array.from({ length: frets + 1 }).map((_, i) => {
        const fretNumber = props.startFret + i
        let xf = xOfCol(i)
        let thick = 1
        if (hasNut && fretNumber === 0) {
          // 0と1の中間よりさらに半コマ右（=1寄り）
          xf = xOfCol(i) + cellW
          thick = 4
        } else if (i === 0) {
          thick = 2
        }
        return (
          <line
            key={'f' + i}
            x1={xf}
            y1={padY - Math.round(8 * s)}
            x2={xf}
            y2={padY + innerH + Math.round(8 * s)}
            stroke={fretNumber===0 ? (theme?.nutStroke ?? '#000') : (theme?.fretStroke ?? '#000')}
            strokeWidth={thick}
          />
        )
      })}

      {/* ポジションマーカー: 12フレットのみ二点、それ以外は単点表示 */}
      {markerFrets
        .filter(f => f >= props.startFret && f <= props.endFret)
        .map((m, idx) => {
          const col = m - props.startFret
          const x = xOfSpaceCenter(col)
          const y = padY + innerH / 2
          const text = m % 12 === 0 ? '••' : '•'
          const fsMarker = Math.max(10, Math.round(14 * s))
          return (
            <text
              key={'m' + idx}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={fsMarker}
              fill={theme?.markerFill ?? '#000'}
            >
              {text}
            </text>
          )
        })}

      {/* フレット番号（スペース中央）: 0フレット開始でも実際の列番号を表示 */}
      {props.showFretNumbers !== false &&
        Array.from({ length: frets }).map((_, i) => {
          const fretNum = props.startFret + i
          const x = xOfSpaceCenter(i)
          const fsFret = Math.max(10, Math.round(14 * s))
          return (
            <text
              key={'fn' + i}
              x={x}
              y={padY - Math.round(10 * s)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={fsFret}
              fill={theme?.text ?? '#333'}
            >
              {fretNum}
            </text>
          )
        })}

      {/* 弦ラベル（左：チューニング、上=1弦／下=6弦） */}
      {(props.tuning ?? []).length === strings &&
        (props.tuning ?? []).map((_, idx) => {
          const y = yOfRowCenter(idx)
          const label = (props.tuning ?? [])[strings - 1 - idx]
          const fsTuning = Math.max(14, Math.round(20 * s))
          return (
            <text
              key={'tl' + idx}
              x={padX - 12}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={fsTuning}
              fill={theme?.text ?? '#000'}
            >
              {label}
            </text>
          )
        })}

      {/* ====== Aレイヤー（メイン） ======
          凡例準拠:
          - Root: 二重丸（filledなら内側塗り）
          - 5度: ◇（filledなら塗りつぶし◇）
          - その他スケール音: 丸（filledなら塗り）
      */}
      {props.notes.filter(n => n.isScale).map((n, idx) => {
        const cx = padX + n.x * cellW
        const cy = yOfRowCenter(n.y - 0.5)
        const r = Math.min(cellW, cellH) * 0.34

        const deg = degreeLabel(props.tonic, n.pc, false)
        const isRoot = deg === 'R'
        const isFifth = deg === '5'
        const filled = (props.showChordTones ?? true) && n.isChordTone

        // 拡張表記（2/4/6 → 9/11/13）
        let degLabel = deg
        if (props.preferExtensions) {
          if (deg === '2') degLabel = '9'
          else if (deg === '4') degLabel = '11'
          else if (deg === '6') degLabel = '13'
        }

        const textFill = filled
          ? (theme?.main.textOnFilled ?? '#fff')
          : (theme?.text ?? '#000')


        return (
          <g key={'A' + idx}>
            {isRoot ? (
              <>
                {/* 外輪 */}
                <circle cx={cx} cy={cy} r={r} fill="none" stroke={theme?.main.rootStroke ?? '#000'} strokeWidth={2} />
                {/* 内輪 or 塗り */}
                {filled ? (
                  <circle cx={cx} cy={cy} r={r * 0.72} fill={theme?.main.rootFill ?? '#000'} />
                ) : (
                  <circle cx={cx} cy={cy} r={r * 0.72} fill="none" stroke={theme?.main.rootStroke ?? '#000'} strokeWidth={2} />
                )}
              </>
            ) : isFifth ? (
              <rect
                x={cx - r}
                y={cy - r}
                width={2 * r}
                height={2 * r}
                fill={filled ? (theme?.main.fifthFill ?? '#000') : 'none'}
                stroke={theme?.main.fifthStroke ?? '#000'}
                strokeWidth={2}
                transform={`rotate(45 ${cx} ${cy})`}
              />
            ) : filled ? (
              <circle cx={cx} cy={cy} r={r * 0.85} fill={theme?.main.chordFill ?? '#000'} />
            ) : (
              <circle cx={cx} cy={cy} r={r * 0.85} fill="none" stroke={theme?.main.scaleStroke ?? '#000'} strokeWidth={2} />
            )}

            {(props.showDeg || props.showNote) && (
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={Math.max(12, Math.round(18 * s))} fill={textFill}>
                {props.showDeg && <tspan x={cx} dy={-Math.round(6 * s)}>{degLabel}</tspan>}
                {props.showNote && <tspan x={cx} dy={props.showDeg ? Math.round(14 * s) : 0}>{pcName(n.pc, props.keyName)}</tspan>}
              </text>
            )}
          </g>
        )
      })}

      {/* ====== Bレイヤー（オーバーレイ）: 点線リング ====== */}
      {(props.overlayNotes ?? []).filter(n => n.isScale).map((n, idx) => {
        const cx = padX + n.x * cellW
        const cy = yOfRowCenter(n.y - 0.5)
        const r = Math.min(cellW, cellH) * 0.30
        const degB = degreeLabel((props.overlayTonic ?? 0) as PC, n.pc, false)
        return (
          <g key={'B' + idx}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={theme?.overlay.ringStroke ?? '#000'} strokeWidth={1.6} strokeDasharray="4 3" />
            {props.overlayShowLabels && (
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={Math.max(8, Math.round(9 * s))} fill={theme?.overlay.label ?? '#000'}>
                <tspan x={cx} dy={0}>{degB}</tspan>
              </text>
            )}
          </g>
        )
      })}

      {/* ====== Blueレイヤー（b3/b5）: ひし形 ====== */}
      {(props.blueNotes ?? []).filter(n => n.isScale).map((n, idx) => {
        const cx = padX + n.x * cellW
        const cy = yOfRowCenter(n.y - 0.5)
        const size = Math.min(cellW, cellH) * 0.5
        const d = degreeLabel(props.tonic, n.pc, false)
        return (
          <g key={'BL' + idx}>
            <rect
              x={cx - size / 2}
              y={cy - size / 2}
              width={size}
              height={size}
              fill="none"
              stroke={theme?.blue.stroke ?? '#000'}
              strokeWidth={1.8}
              transform={`rotate(0 ${cx} ${cy})`}
            />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={Math.max(12, Math.round(18 * s))} fill={theme?.blue.label ?? '#000'}>{d}</text>
          </g>
        )
      })}
    </svg>
  )
}
