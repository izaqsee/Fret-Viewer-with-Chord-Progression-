/**
 * フレットボード記号の凡例を表示するサイドパネル。
 *
 * - FretboardSVG 内で使われる記号や塗りの意味をテキストとアイコンで説明し、新規ユーザーが見方を迷わないようにする。
 * - レイアウトはシンプルな Flex/Grid 組み合わせで、CSS-in-JS スタイルをその場で完結させている。
 * - 表示内容は静的なのでステートレスな関数コンポーネントとして実装し、他コンポーネントからは単純に <LegendPanel /> で利用できる。
 */
import React from 'react'

export function LegendPanel() {
  const row = (icon: React.ReactNode, text: string, key: React.Key) => (
    <div key={key} style={{display:'flex', alignItems:'center', gap:8, minHeight:22}}>
      <div style={{width:20, height:20, display:'grid', placeItems:'center'}}>{icon}</div>
      <div style={{fontSize:13, lineHeight:'18px'}}>{text}</div>
    </div>
  )

  return (
    <div style={{
      border:'1px solid #ddd',
      borderRadius:8,
      padding:'10px 12px',
      background:'#fafafa',
      maxWidth:560,
      width:'100%'
    }}>
      <div style={{textAlign:'center', fontSize:12, marginBottom:6, opacity:.8}}>凡例 / Legend</div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
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
