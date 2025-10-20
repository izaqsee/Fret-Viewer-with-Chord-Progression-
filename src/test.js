"use strict";

/**
 * 重複を除去しつつ元の順序を保持して配列を返します。
 * パフォーマンス最適化: `Set` を用いた O(n) 実装。
 * - プリミティブ値とオブジェクト参照の両方を扱えます（参照同一性ベース）。
 * - 入力配列は変更しません。
 *
 * @template T
 * @param {ReadonlyArray<T>} arr 対象配列
 * @returns {T[]} 重複除去後の新しい配列
 */
export function stableUnique(arr) {
  const n = arr.length;
  if (n <= 1) return arr.slice();

  const seen = new Set();
  const out = [];
  for (let i = 0; i < n; i++) {
    const v = arr[i];
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}
