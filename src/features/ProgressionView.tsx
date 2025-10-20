/**
 * コード進行（12小節など）を横並びに表示し、現在位置をハイライトするコンポーネント。
 *
 * - progression 配列をそのまま描画し、onSelectBar で App.tsx へクリック通知を返す。
 * - currentBar が示す小節は色と太字で目立たせ、演奏位置やループの把握を助ける。
 * - 視認性のため等幅フォントを使い、Vite/React の最小構成でも視覚的なリズム表を提供できる。
 */
import React from 'react'

export function ProgressionView({
  progression,
  currentBar,
  onSelectBar,
}: {
  progression: readonly string[]
  currentBar: number
  onSelectBar?: (barIndex: number) => void
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: 4,
        marginTop: 8,
        fontFamily: 'monospace',
        fontSize: 16,
      }}
    >
      {progression.map((chord, i) => {
        const bar = i + 1
        const isCurrent = bar === currentBar
        return (
          <div
            key={i}
            onClick={() => onSelectBar?.(bar)}  // ← クリック時のハンドラ追加
            style={{
              textAlign: 'center',
              padding: '6px 4px',
              border: '1px solid #ccc',
              borderRadius: 6,
              background: isCurrent ? '#ffe600' : '#f9f9f9',
              color: isCurrent ? '#000' : '#333',
              fontWeight: isCurrent ? 700 : 400,
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'background 0.2s',
            }}
            title={`Bar ${bar}: ${chord}`}
          >
            {chord}
          </div>
        )
      })}
    </div>
  )
}
