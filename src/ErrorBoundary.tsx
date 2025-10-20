import React from 'react'

// React 18 でも従来通り class コンポーネントで構築する ErrorBoundary。
// 描画中に例外が発生した際に UI 全体が真っ白になるのを防ぎ、
// ユーザ向けにメッセージを表示する役割を担う。
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message?: string }
> {
  constructor(props: any) {
    super(props)
    // 初期状態ではエラーは発生していない。
    this.state = { hasError: false }
  }

  // 子コンポーネントでエラーが発生したタイミングで
  // React から呼び出され、フォールバック表示へ切り替える。
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message }
  }

  // 実際のエラー情報はコンソールにも残しておき、開発者が追跡できるようにする。
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('❌ Rendering Error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      // ユーザへ簡潔なエラー表示を提供。ここでは Red テキストで通知するだけに留める。
      return (
        <div style={{ padding: 24, color: 'red', fontFamily: 'monospace' }}>
          ⚠️ <b>Rendering Error</b><br />
          {this.state.message}
        </div>
      )
    }
    // ハンドリングされていないエラーが無い場合は通常の子要素をそのまま描画。
    return this.props.children
  }
}
