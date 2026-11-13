import type { GraphLink, GraphMode, GraphNode } from '../types/schema';
import { getAvatarColor } from './graphBuilder';
import { getNodeRadius } from './hitTest';

export interface NodeRenderState {
  mode: GraphMode;
  selectedNodeId: string | null;
  hoverNodeId: string | null;
  activeNodeId: string | null;
  connectedNodeIds: Set<string>;
  imageCache: Map<string, HTMLImageElement>;
}

export interface LinkRenderState {
  selectedLinkId: string | null;
  hoverLinkId: string | null;
  activeNodeId: string | null;
}

function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
  } else {
    ctx.fillRect(x, y, width, height);
  }
}

export function paintGraphNodePointerArea(
  node: GraphNode,
  color: string,
  ctx: CanvasRenderingContext2D,
  globalScale: number
): void {
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const r = getNodeRadius(node);

  // force-graph executes an extra ctx.restore() on shadow canvas for replace mode
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r + 6, 0, 2 * Math.PI);
  ctx.fill();

  const fontSize = Math.max(10, 12 / Math.pow(globalScale || 1, 0.35));
  ctx.font = `600 ${fontSize}px sans-serif`;
  const textWidth = ctx.measureText(node.label).width;
  const paddingX = 8;
  const paddingY = 6;
  const labelY = y + r + fontSize * 0.85 + 2;

  ctx.beginPath();
  ctx.rect(
    x - textWidth / 2 - paddingX,
    labelY - fontSize / 2 - paddingY,
    textWidth + paddingX * 2,
    fontSize + paddingY * 2
  );
  ctx.fill();
}

export function drawGraphNode(
  node: GraphNode,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  state: NodeRenderState
): void {
  const { mode, selectedNodeId, hoverNodeId, activeNodeId, connectedNodeIds, imageCache } = state;
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
  ctx.fillStyle = node.type === 'podcaster' ? '#0f172a' : '#1e1b4b';
  ctx.fill();

  ctx.lineWidth = isSelected ? 3.5 : 2;
  const avatarColors = getAvatarColor(node.label, node.isFormerHostOnly);
  ctx.strokeStyle = isSelected
    ? node.isFormerHostOnly
      ? '#94a3b8'
      : '#10b981'
    : node.type === 'podcaster'
      ? avatarColors.ring
      : '#818cf8';
  ctx.stroke();

  // アイコン画像またはイニシャル描画
  ctx.save();
  ctx.clip();
  const cachedImg = node.imageUrl ? imageCache.get(node.imageUrl) : undefined;
  if (cachedImg) {
    ctx.drawImage(cachedImg, x - r, y - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = avatarColors.bg;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.fillStyle = avatarColors.text;
    ctx.font = `bold ${Math.max(10, r * 0.72)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.fallbackText, x, y);
  }
  ctx.restore();

  // ノード名ラベル描画
  const fontSize = Math.max(10, 12 / Math.pow(globalScale, 0.35));
  ctx.font = `600 ${fontSize}px sans-serif`;
  const textWidth = ctx.measureText(node.label).width;
  const paddingX = 6;
  const paddingY = 3;
  const labelY = y + r + fontSize * 0.85 + 2;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  fillRoundedRect(
    ctx,
    x - textWidth / 2 - paddingX,
    labelY - fontSize / 2 - paddingY,
    textWidth + paddingX * 2,
    fontSize + paddingY * 2,
    4
  );

  ctx.fillStyle = isSelected ? '#6ee7b7' : '#f1f5f9';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(node.label, x, labelY);

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
  const { selectedLinkId, hoverLinkId, activeNodeId } = state;
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
        : '#64748b'
      : isHighlighted
        ? '#34d399'
        : '#10b981';
  } else {
    const guestCount = link.guestEpisodeIds.length;
    ctx.setLineDash(guestCount === 1 ? [5, 4] : []);
    ctx.lineWidth = isHighlighted ? 4.5 : Math.min(1.5 + (guestCount - 1) * 1.1, 4.2);
    ctx.strokeStyle = isHighlighted
      ? '#a5b4fc'
      : isConnectedToActive
        ? '#818cf8'
        : '#64748b';
  }

  ctx.stroke();
  ctx.restore();
}
