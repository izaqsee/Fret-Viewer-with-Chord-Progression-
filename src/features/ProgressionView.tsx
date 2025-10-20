import React from 'react'

// 12小節のコード進行をひと目で確認できる簡易グリッド。
// 現在の小節をハイライトし、クリックで別バーにジャンプできるようにする。

export function ProgressionView({
  progression,
  currentBar,
  onSelectBar,
}: {
  progression: readonly string[]
  currentBar: number
  onSelectBar?: (barIndex: number) => void
}) {
  // CSS Grid で 12 コマを横並びに配置し、等幅フォントで運指表のような見た目に寄せる。
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
              transition: 'background 0.2s', // マウス操作時も滑らかにハイライトが変化
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
