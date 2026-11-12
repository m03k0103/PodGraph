import type { GraphLink, GraphNode } from '../types/schema';

export type HitResult =
  | { kind: 'node'; node: GraphNode }
  | { kind: 'link'; link: GraphLink };

export function getNodeRadius(node: GraphNode): number {
  return 14 + Math.min(node.degree, 8) * 2.2;
}

/**
 * グラフワールド座標 (gx, gy) に対して、最前面にあるノードまたはリンクを数学的に判定する。
 * shadowCanvas の getImageData に依存せず、ズーム・高DPI・冷却停止後でも確実にヒット判定を行う。
 */
export function hitTestGraph(
  gx: number,
  gy: number,
  globalScale: number,
  nodes: GraphNode[],
  links: GraphLink[],
  measureTextWidth: (text: string, font: string) => number
): HitResult | null {
  const scale = globalScale || 1;

  // 1. ノード判定（後から描画される最前面ノードを優先）
  const nodeLabelFontSize = Math.max(10, 12 / Math.pow(scale, 0.35));
  const nodeLabelFont = `600 ${nodeLabelFontSize}px sans-serif`;

  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const x = node.x;
    const y = node.y;
    if (typeof x !== 'number' || typeof y !== 'number') continue;

    const r = getNodeRadius(node);

    // アイコン円の当たり判定
    if (Math.hypot(gx - x, gy - y) <= r + 6) {
      return { kind: 'node', node };
    }

    // 名前ラベル矩形の当たり判定
    const tw = measureTextWidth(node.label, nodeLabelFont);
    const paddingX = 8;
    const paddingY = 6;
    const labelY = y + r + nodeLabelFontSize * 0.85 + 2;

    if (
      gx >= x - tw / 2 - paddingX &&
      gx <= x + tw / 2 + paddingX &&
      gy >= labelY - nodeLabelFontSize / 2 - paddingY &&
      gy <= labelY + nodeLabelFontSize / 2 + paddingY
    ) {
      return { kind: 'node', node };
    }
  }

  // 2. リンク（エッジ）判定
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const linkHitThreshold = Math.max(8, 10 / scale);

  for (let i = links.length - 1; i >= 0; i--) {
    const link = links[i];
    const sourceNode =
      typeof link.source === 'object' ? (link.source as unknown as GraphNode) : nodeMap.get(link.source);
    const targetNode =
      typeof link.target === 'object' ? (link.target as unknown as GraphNode) : nodeMap.get(link.target);

    if (
      !sourceNode ||
      !targetNode ||
      typeof sourceNode.x !== 'number' ||
      typeof sourceNode.y !== 'number' ||
      typeof targetNode.x !== 'number' ||
      typeof targetNode.y !== 'number'
    ) {
      continue;
    }

    const sx = sourceNode.x;
    const sy = sourceNode.y;
    const tx = targetNode.x;
    const ty = targetNode.y;

    // 線分との距離判定
    const dx = tx - sx;
    const dy = ty - sy;
    const lenSq = dx * dx + dy * dy;
    if (lenSq > 0) {
      const t = Math.max(0, Math.min(1, ((gx - sx) * dx + (gy - sy) * dy) / lenSq));
      const projX = sx + t * dx;
      const projY = sy + t * dy;
      if (Math.hypot(gx - projX, gy - projY) <= linkHitThreshold) {
        return { kind: 'link', link };
      }
    }
  }

  return null;
}
