
// アプリのエントリポイント。React 18 の createRoot API を使って
// ルート要素へ描画し、全体を StrictMode + ErrorBoundary で包む。
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './ErrorBoundary'

// ここで root 要素を取得し、レンダリングツリーを構築。
// ErrorBoundary により描画時の例外もキャッチしてユーザへ通知できる。

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
