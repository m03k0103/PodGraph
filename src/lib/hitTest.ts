import type { GraphLink, GraphNode } from '../types/schema';

export type HitResult =
  | { kind: 'node'; node: GraphNode }
  | { kind: 'link'; link: GraphLink };

export function getNodeRadius(node: GraphNode): number {
  if (node.type === 'podcaster') {
    return 20 + Math.min(node.degree, 8) * 2.0;
  }
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
  _measureTextWidth: (text: string, font: string) => number,
  _mode: 'podcaster' | 'podcast' = 'podcaster'
): HitResult | null {
  const scale = globalScale || 1;

  // 1. ノード判定（後から描画される最前面ノードを優先）
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const x = node.x;
    const y = node.y;
    if (typeof x !== 'number' || typeof y !== 'number') continue;

    const r = getNodeRadius(node);

    // アイコン円または角丸矩形の当たり判定（人物名も円内に描画されるため円のみで判定）
    if (node.type === 'podcast') {
      if (Math.abs(gx - x) <= r + 4 && Math.abs(gy - y) <= r + 4) {
        return { kind: 'node', node };
      }
    } else if (Math.hypot(gx - x, gy - y) <= r + 6) {
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
