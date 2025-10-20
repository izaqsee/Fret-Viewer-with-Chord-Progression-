/**
 * フレットボード描画で共有するカラーパレットを一元管理するモジュール。
 *
 * - THEMES で UI 全体の背景や文字色、スケールごとの記号色を定義し、FretboardSVG から参照する。
 * - ThemeId は App.tsx のステートで管理し、選択したテーマに応じた FretTheme を画面へ渡す。
 * - すべての色は配色意図（例: 色弱者への配慮）をコメントに残し、新規テーマ追加時の指針とする。
 */
// 色弱対応（Okabe–Ito）＋明快なモノトーンを用意
export type ThemeId = 'mono' | 'jazz' | 'fusion'

export type FretTheme = {
  // 背景/罫線/文字
  bg: string
  text: string
  stringStroke: string
  fretStroke: string
  nutStroke: string
  markerFill: string

  // メイン（A）スケール
  main: {
    rootStroke: string
    rootFill: string
    chordStroke: string
    chordFill: string
    fifthStroke: string
    fifthFill: string // 塗り: showChordTones有効時のみ適用
    scaleStroke: string
    textOnFilled: string
  }

  // オーバーレイ（B）
  overlay: {
    ringStroke: string
    label: string
  }

  // ブルーノート
  blue: {
    stroke: string
    label: string
  }
}

export const THEMES: Record<ThemeId, FretTheme> = {
  mono: {
    bg: '#ffffff',
    text: '#1f2937',
    stringStroke: '#000000',
    fretStroke: '#000000',
    nutStroke: '#000000',
    markerFill: '#000000',

    main: {
      rootStroke: '#111111',
      rootFill: '#111111',
      chordStroke: '#111111',
      chordFill: '#111111',
      fifthStroke: '#111111',
      fifthFill: '#111111',
      scaleStroke: '#111111',
      textOnFilled: '#ffffff',
    },

    overlay: {
      ringStroke: '#6b7280',   // gray-500
      label: '#374151',        // gray-700
    },

    blue: {
      stroke: '#111827',       // gray-900
      label: '#111827',
    }
  },

  // 色弱対応：Okabe–Itoパレット
  jazz: {
    bg: '#ffffff',
    text: '#111827',
    stringStroke: '#111827',
    fretStroke: '#6b7280',
    nutStroke: '#111827',
    markerFill: '#6b7280',

    main: {
      rootStroke: '#D55E00',   // orange
      rootFill:   '#D55E00',
      chordStroke:'#0072B2',   // blue
      chordFill:  '#0072B2',
      fifthStroke:'#009E73',   // green
      fifthFill:  '#009E73',
      scaleStroke:'#000000',   // black for outline
      textOnFilled: '#ffffff',
    },

    overlay: {
      ringStroke: '#CC79A7',   // magenta
      label: '#7C3AED',        // violet-ish for readability
    },

    blue: {
      stroke: '#56B4E9',       // sky blue
      label:  '#0C4A6E',
    }
  },

  // 少しビビッド（派手め）
  fusion: {
    bg: '#ffffff',
    text: '#0f172a',
    stringStroke: '#0f172a',
    fretStroke: '#94a3b8',
    nutStroke: '#0f172a',
    markerFill: '#64748b',

    main: {
      rootStroke:'#ef4444',    // red-500
      rootFill:  '#ef4444',
      chordStroke:'#3b82f6',   // blue-500
      chordFill:  '#3b82f6',
      fifthStroke:'#10b981',   // emerald-500
      fifthFill:  '#10b981',
      scaleStroke:'#111827',
      textOnFilled: '#ffffff',
    },

    overlay: {
      ringStroke:'#a855f7',    // purple-500
      label:'#6b21a8',
    },

    blue: {
      stroke:'#06b6d4',        // cyan-500
      label:'#155e75',
    }
  }
}
