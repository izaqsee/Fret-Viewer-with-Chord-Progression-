import React from 'react'

// 指板上の記号に馴染みのないユーザ向けに、図形と意味を並べた凡例を提供する。

export function LegendPanel({ scale = 1, cols = 2 }: { scale?: number; cols?: number }) {
  // 1 行分のアイコン＋説明文を共通レイアウトで表示するためのヘルパー。
  const s = Math.max(0.7, Math.min(1.6, scale))
  const row = (icon: React.ReactNode, text: string, key: React.Key) => (
    <div key={key} style={{display:'flex', alignItems:'center', gap:8, minHeight:22}}>
      <div style={{width:20, height:20, display:'grid', placeItems:'center'}}>{icon}</div>
      <div style={{fontSize: Math.max(11, Math.round(13 * s)), lineHeight: `${Math.max(16, Math.round(18 * s))}px`}}>{text}</div>
    </div>
  )

  return (
    <div style={{
      border:'1px solid #ddd',
      borderRadius:8,
      padding: `${Math.max(8, Math.round(10 * s))}px ${Math.max(10, Math.round(12 * s))}px`,
      background:'#fafafa',
      maxWidth:560,
      width:'100%'
    }}>
      {/* 凡例のタイトル。日本語と英語を併記して目的を明確にする */}
      <div style={{textAlign:'center', fontSize: Math.max(10, Math.round(12 * s)), marginBottom: Math.max(4, Math.round(6 * s)), opacity:.8}}>凡例 / Legend</div>
      {/* 2カラム構成で凡例を詰め込み、ビジュアルと説明の対応を保つ */}
      <div style={{display:'grid', gridTemplateColumns:`repeat(${cols}, 1fr)`, gap: Math.max(6, Math.round(8 * s))}}>
        {row(
          <svg width="18" height="18"><circle cx="9" cy="9" r="8" fill="none" stroke="#000" strokeWidth="2"/><circle cx="9" cy="9" r="5.6" fill="none" stroke="#000" strokeWidth="2"/></svg>,
          'R（ルート）＝二重丸', 'r'
        )}
        {row(
          <svg width="18" height="18"><rect x="3" y="3" width="12" height="12" fill="none" stroke="#000" strokeWidth="2"/></svg>,
          '5度＝四角', 'fifth'
        )}
        {row(
          <svg width="18" height="18"><circle cx="9" cy="9" r="7" fill="#000"/></svg>,
          'コードトーン＝塗りつぶし', 'ct'
        )}
        {row(
          <svg width="18" height="18"><circle cx="9" cy="9" r="7" fill="none" stroke="#000" strokeWidth="2"/></svg>,
          'その他のスケール音＝輪郭のみ', 'scale'
        )}
        {row(
          <svg width="18" height="18"><line x1="2" y1="9" x2="16" y2="9" stroke="#000" strokeWidth="4"/></svg>,
          '太線＝0フレット（ナット）', 'nut'
        )}
        {row(
          <svg width="18" height="18"><text x="9" y="12" fontSize="10" textAnchor="middle">0</text></svg>,
          '数字＝フレット番号／左の文字＝弦名（チューニング）', 'nums'
        )}
        {row(
          <svg width="18" height="18"><text x="9" y="7" fontSize="9" textAnchor="middle">度</text><text x="9" y="15" fontSize="9" textAnchor="middle">音</text></svg>,
          'ラベル：上段=度数／下段=音名', 'labels'
        )}
      </div>
    </div>
  )
}
