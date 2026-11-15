import type { GraphLink, GraphMode, GraphNode, ThemeMode } from '../types/schema';
import { getAvatarColor } from './graphBuilder';
import { getNodeRadius } from './hitTest';

export interface NodeRenderState {
  mode: GraphMode;
  theme: ThemeMode;
  selectedNodeId: string | null;
  hoverNodeId: string | null;
  activeNodeId: string | null;
  connectedNodeIds: Set<string>;
  imageCache: Map<string, HTMLImageElement>;
}

export interface LinkRenderState {
  theme: ThemeMode;
  selectedLinkId: string | null;
  hoverLinkId: string | null;
  activeNodeId: string | null;
}

/**
 * 人物名（フルネーム）を円内描画向けに最大2行へ分割する。
 */
export function splitPodcasterNameLines(label: string): string[] {
  const trimmed = label.trim();
  if (!trimmed) return ['?'];

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 2) {
    return parts;
  }
  if (parts.length > 2) {
    const mid = Math.ceil(parts.length / 2);
    return [parts.slice(0, mid).join(' '), parts.slice(mid).join(' ')];
  }

  // スペースを含まない短い名前は1行、5文字以上は2行へ折り返す
  if (trimmed.length <= 4) {
    return [trimmed];
  }
  const mid = Math.ceil(trimmed.length / 2);
  return [trimmed.slice(0, mid), trimmed.slice(mid)];
}

export function paintGraphNodePointerArea(
  node: GraphNode,
  color: string,
  ctx: CanvasRenderingContext2D,
  _globalScale: number,
  _mode: GraphMode = 'podcaster'
): void {
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const r = getNodeRadius(node);

  // force-graph executes an extra ctx.restore() on shadow canvas for replace mode
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  if (node.type === 'podcast' && typeof ctx.roundRect === 'function') {
    ctx.roundRect(x - r - 3, y - r - 3, (r + 3) * 2, (r + 3) * 2, 8);
  } else {
    ctx.arc(x, y, r + 6, 0, 2 * Math.PI);
  }
  ctx.fill();
}

export function drawGraphNode(
  node: GraphNode,
  ctx: CanvasRenderingContext2D,
  _globalScale: number,
  state: NodeRenderState
): void {
  const { mode, theme, selectedNodeId, hoverNodeId, activeNodeId, connectedNodeIds, imageCache } = state;
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const r = getNodeRadius(node);

  const isSelected = node.id === selectedNodeId;
  const isHovered = node.id === hoverNodeId;
  const isDimmed = activeNodeId !== null && !connectedNodeIds.has(node.id);

  // force-graph's paintNodes executes an extra ctx.restore() when nodeCanvasObjectMode is 'replace'.
  // Start with an outer ctx.save() so the canvas matrix stack stays balanced across all nodes.
  ctx.save();
  ctx.save();
  ctx.globalAlpha = isDimmed ? 0.25 : 1;

  // 選択・ホバー時の発光リング
  if (isSelected || isHovered) {
    ctx.beginPath();
    ctx.arc(x, y, r + 5, 0, 2 * Math.PI);
    ctx.fillStyle = node.isFormerHostOnly
      ? 'rgba(148, 163, 184, 0.45)'
      : mode === 'podcaster'
        ? 'rgba(16, 185, 129, 0.45)'
        : 'rgba(99, 102, 241, 0.45)';
    ctx.fill();
  }

  // ノード外枠・クリップパス（人物モードは円形、番組モードは角丸四角形）
  ctx.beginPath();
  if (node.type === 'podcast' && typeof ctx.roundRect === 'function') {
    ctx.roundRect(x - r, y - r, r * 2, r * 2, 6);
  } else {
    ctx.arc(x, y, r, 0, 2 * Math.PI);
  }
  ctx.fillStyle =
    theme === 'light'
      ? node.type === 'podcaster'
        ? '#ffffff'
        : '#eef2ff'
      : node.type === 'podcaster'
        ? '#0f172a'
        : '#1e1b4b';
  ctx.fill();

  ctx.lineWidth = isSelected ? 3.5 : 2;
  const avatarColors = getAvatarColor(node.label, node.isFormerHostOnly);
  ctx.strokeStyle = isSelected
    ? node.isFormerHostOnly
      ? '#94a3b8'
      : '#10b981'
    : node.type === 'podcaster'
      ? avatarColors.ring
      : theme === 'light'
        ? '#6366f1'
        : '#818cf8';
  ctx.stroke();

  // アイコン画像または円内ラベル描画
  ctx.save();
  ctx.clip();
  const cachedImg = node.imageUrl ? imageCache.get(node.imageUrl) : undefined;
  if (cachedImg) {
    ctx.drawImage(cachedImg, x - r, y - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = avatarColors.bg;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.fillStyle = avatarColors.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (node.type === 'podcaster') {
      const lines = splitPodcasterNameLines(node.label);
      const refSize = 10;
      ctx.font = `700 ${refSize}px sans-serif`;
      const maxRefWidth = Math.max(...lines.map((line) => ctx.measureText(line).width), 1);
      // 2行時は上下オフセットを考慮し、円弦に収まる最大幅・高さからフォントサイズを算出
      const availableWidth = lines.length === 1 ? r * 1.62 : r * 1.54;
      const maxByHeight = lines.length === 1 ? r * 0.54 : r * 0.42;
      const fitSize = (availableWidth / maxRefWidth) * refSize;
      const fontSize = Math.max(5.5, Math.min(maxByHeight, fitSize));
      ctx.font = `700 ${fontSize}px sans-serif`;

      if (lines.length === 1) {
        ctx.fillText(lines[0], x, y);
      } else {
        const lineHeight = fontSize * 1.18;
        ctx.fillText(lines[0], x, y - lineHeight / 2);
        ctx.fillText(lines[1], x, y + lineHeight / 2);
      }
    } else {
      ctx.font = `bold ${Math.max(10, r * 0.72)}px sans-serif`;
      ctx.fillText(node.fallbackText, x, y);
    }
  }
  ctx.restore();

  ctx.restore();
}

export type ResolvedGraphLink = Omit<GraphLink, 'source' | 'target'> & {
  source: GraphNode;
  target: GraphNode;
};

export function drawGraphLink(
  link: ResolvedGraphLink,
  ctx: CanvasRenderingContext2D,
  state: LinkRenderState
): void {
  const { theme, selectedLinkId, hoverLinkId, activeNodeId } = state;
  const sx = link.source.x ?? 0;
  const sy = link.source.y ?? 0;
  const tx = link.target.x ?? 0;
  const ty = link.target.y ?? 0;

  const isSelected = link.id === selectedLinkId;
  const isHovered = link.id === hoverLinkId;
  const isHighlighted = isSelected || isHovered;
  const isConnectedToActive =
    activeNodeId !== null &&
    (link.source.id === activeNodeId || link.target.id === activeNodeId);
  const isDimmed = activeNodeId !== null && !isConnectedToActive && !isHighlighted;

  ctx.save();
  ctx.globalAlpha = isDimmed ? 0.15 : 0.9;

  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(tx, ty);

  if (link.relationType === 'regular') {
    ctx.setLineDash([]);
    ctx.lineWidth = isHighlighted ? 5 : 3.6;
    const isFormerLink = Boolean(link.source.isFormerHostOnly || link.target.isFormerHostOnly);
    ctx.strokeStyle = isFormerLink
      ? isHighlighted
        ? '#94a3b8'
        : theme === 'light'
          ? '#94a3b8'
          : '#64748b'
      : isHighlighted
        ? theme === 'light'
          ? '#059669'
          : '#34d399'
        : '#10b981';
  } else {
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = isHighlighted ? 3.2 : 1.8;
    ctx.strokeStyle = isHighlighted
      ? theme === 'light'
        ? '#4f46e5'
        : '#a5b4fc'
      : isConnectedToActive
        ? theme === 'light'
          ? '#6366f1'
          : '#818cf8'
        : theme === 'light'
          ? '#94a3b8'
          : '#64748b';
  }

  ctx.stroke();
  ctx.restore();
}
