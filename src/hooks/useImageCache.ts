import { useEffect, useRef, useState } from 'react';
import type { GraphNode } from '../types/schema';

/**
 * グラフノードのアイコン画像をプリロードし、キャッシュ Map を返す。
 * 読み込み完了ごとに再描画をトリガーする。
 */
export function useImageCache(nodes: GraphNode[]): Map<string, HTMLImageElement> {
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [, setImageTick] = useState(0);

  useEffect(() => {
    for (const node of nodes) {
      if (!node.imageUrl || imageCacheRef.current.has(node.imageUrl)) continue;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = node.imageUrl;
      img.onload = () => {
        imageCacheRef.current.set(node.imageUrl!, img);
        setImageTick((t) => t + 1);
      };
    }
  }, [nodes]);

  return imageCacheRef.current;
}
