/**
 * React のレンダリングで例外が発生した際に、画面全体を守るためのフェイルセーフ。
 *
 * - 例外を検知すると簡潔な警告メッセージを利用者へ表示し、アプリが真っ白にならないようにする。
 * - console.error にスタック情報を残すことで、開発者はブラウザコンソールから原因調査ができる。
 * - App.tsx を StrictMode で囲む際の最上位ラッパーとして、main.tsx から一度だけ生成される。
 */
import React from 'react'

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message?: string }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('❌ Rendering Error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, color: 'red', fontFamily: 'monospace' }}>
          ⚠️ <b>Rendering Error</b><br />
          {this.state.message}
        </div>
      )
    }
    return this.props.children
  }
}
