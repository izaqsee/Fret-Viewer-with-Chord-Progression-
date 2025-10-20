/**
 * アプリのエントリーポイント。HTML 側の #root に React ツリーを差し込み、
 * ErrorBoundary → App の順でラップして全画面の初期化を行う。
 * Vite が生成する main.tsx に相当し、ブラウザで読み込まれる最初の TypeScript ファイル。
 */
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
