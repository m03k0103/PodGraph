import React, { useEffect, useRef, useState, useCallback } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { GraphData, GraphLink, GraphMode, GraphNode } from '../types/schema';
import { getAvatarColor } from '../lib/graphBuilder';
import { getNodeRadius, hitTestGraph } from '../lib/hitTest';

interface GraphCanvasProps {
  mode: GraphMode;
  graphData: GraphData;
  selectedNodeId: string | null;
  selectedLinkId: string | null;
  focusTrigger: number;
  onNodeClick: (node: GraphNode) => void;
  onLinkClick: (link: GraphLink) => void;
  onBackgroundClick: () => void;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  mode,
  graphData,
  selectedNodeId,
  selectedLinkId,
  focusTrigger,
  onNodeClick,
  onLinkClick,
  onBackgroundClick,
}) => {
  const fgRef = useRef<ForceGraphMethods<any, any> | undefined>(undefined);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const measureCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [, setImageTick] = useState(0);
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const [hoverLinkId, setHoverLinkId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<'default' | 'pointer' | 'grabbing'>('default');
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  // ウィンドウリサイズ追従
  useEffect(() => {
    const onResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ノード画像のプリロード＆キャッシュ
  useEffect(() => {
    for (const node of graphData.nodes) {
      if (!node.imageUrl || imageCacheRef.current.has(node.imageUrl)) continue;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = node.imageUrl;
      img.onload = () => {
        imageCacheRef.current.set(node.imageUrl!, img);
        setImageTick((t) => t + 1);
      };
    }
  }, [graphData.nodes]);

  // 力学パラメータ調整（ノード間の距離を広げて見やすくする）
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const charge = fg.d3Force('charge') as any;
    if (charge && typeof charge.strength === 'function') {
      charge.strength(-420);
    }
    const linkForce = fg.d3Force('link') as any;
    if (linkForce && typeof linkForce.distance === 'function') {
      linkForce.distance((link: GraphLink) => (link.relationType === 'regular' ? 95 : 135));
    }
    fg.d3ReheatSimulation();
  }, [graphData, mode]);

  // 選択されたノードへのスムーズなカメラフォーカス移動
  useEffect(() => {
    if (!selectedNodeId || !fgRef.current) return;
    const targetNode = graphData.nodes.find((n) => n.id === selectedNodeId);
    if (targetNode && typeof targetNode.x === 'number' && typeof targetNode.y === 'number') {
      fgRef.current.centerAt(targetNode.x, targetNode.y, 650);
      fgRef.current.zoom(2.1, 650);
    }
  }, [selectedNodeId, focusTrigger, graphData.nodes]);

  // ハイライト対象の隣接ノード判定
  const activeNodeId = hoverNodeId ?? selectedNodeId;
  const connectedNodeIds = React.useMemo(() => {
    const set = new Set<string>();
    if (!activeNodeId) return set;
    set.add(activeNodeId);
    for (const link of graphData.links) {
      const sId = typeof link.source === 'object' ? (link.source as any).id : link.source;
      const tId = typeof link.target === 'object' ? (link.target as any).id : link.target;
      if (sId === activeNodeId) set.add(tId);
      if (tId === activeNodeId) set.add(sId);
    }
    return set;
  }, [activeNodeId, graphData.links]);

  const measureTextWidth = useCallback((text: string, font: string) => {
    if (!measureCtxRef.current && typeof document !== 'undefined') {
      measureCtxRef.current = document.createElement('canvas').getContext('2d');
    }
    const ctx = measureCtxRef.current;
    if (!ctx) return text.length * 12;
    ctx.font = font;
    return ctx.measureText(text).width;
  }, []);

  const resolveHitAtClientPos = useCallback(
    (clientX: number, clientY: number) => {
      const fg = fgRef.current;
      const canvas = canvasContainerRef.current?.querySelector('canvas');
      if (!fg || !canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      if (px < 0 || py < 0 || px > rect.width || py > rect.height) return null;

      const graphCoords = fg.screen2GraphCoords(px, py);
      const scale = fg.zoom() || 1;
      return hitTestGraph(
        graphCoords.x,
        graphCoords.y,
        scale,
        graphData.nodes,
        graphData.links,
        measureTextWidth
      );
    },
    [graphData.links, graphData.nodes, measureTextWidth]
  );

  const paintNodePointerArea = useCallback(
    (nodeObj: any, color: string, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const node = nodeObj as GraphNode;
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
    },
    []
  );

  const drawNode = useCallback(
    (nodeObj: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const node = nodeObj as GraphNode;
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const r = getNodeRadius(node);

      const isSelected = node.id === selectedNodeId;
      const isHovered = node.id === hoverNodeId;
      const isDimmed = activeNodeId !== null && !connectedNodeIds.has(node.id);

      // force-graph's paintNodes executes an extra ctx.restore() when nodeCanvasObjectMode is 'replace'
      // We start with an outer ctx.save() so the canvas matrix stack stays balanced across all nodes.
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
      const cachedImg = node.imageUrl ? imageCacheRef.current.get(node.imageUrl) : undefined;
      if (cachedImg) {
        ctx.drawImage(cachedImg, x - r, y - r, r * 2, r * 2);
      } else {
        // 人物用イニシャルアバター
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
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(
          x - textWidth / 2 - paddingX,
          labelY - fontSize / 2 - paddingY,
          textWidth + paddingX * 2,
          fontSize + paddingY * 2,
          4
        );
        ctx.fill();
      } else {
        ctx.fillRect(
          x - textWidth / 2 - paddingX,
          labelY - fontSize / 2 - paddingY,
          textWidth + paddingX * 2,
          fontSize + paddingY * 2
        );
      }

      ctx.fillStyle = isSelected ? '#6ee7b7' : '#f1f5f9';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, x, labelY);

      ctx.restore();
      // Notice: force-graph will execute the second ctx.restore() when nodeCanvasObjectMode is 'replace'
    },
    [activeNodeId, connectedNodeIds, hoverNodeId, mode, selectedNodeId]
  );

  const drawLink = useCallback(
    (linkObj: any, ctx: CanvasRenderingContext2D) => {
      const link = linkObj as GraphLink & { source: GraphNode; target: GraphNode };
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
        // 太い実線（同じ番組のレギュラー同士 / MC兼任）
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
        // ゲスト共演（共演回数に応じて太さを変化させる）
        const guestCount = link.guestEpisodeIds.length;
        ctx.setLineDash(guestCount === 1 ? [5, 4] : []);
        ctx.lineWidth = isHighlighted
          ? 4.5
          : Math.min(1.5 + (guestCount - 1) * 1.1, 4.2);
        ctx.strokeStyle = isHighlighted
          ? '#a5b4fc'
          : isConnectedToActive
            ? '#818cf8'
            : '#64748b';
      }

      ctx.stroke();
      ctx.restore();
    },
    [activeNodeId, hoverLinkId, selectedLinkId]
  );

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950">
      <div
        ref={canvasContainerRef}
        className="h-full w-full"
        style={{ cursor }}
        onPointerDownCapture={(e) => {
          if (e.button === 0 && e.target instanceof HTMLCanvasElement) {
            pointerDownRef.current = { x: e.clientX, y: e.clientY };
          }
        }}
        onPointerMoveCapture={(e) => {
          if (pointerDownRef.current && (e.buttons & 1) === 1) {
            const dist = Math.hypot(
              e.clientX - pointerDownRef.current.x,
              e.clientY - pointerDownRef.current.y
            );
            if (dist >= 5) {
              setCursor((prev) => (prev === 'grabbing' ? prev : 'grabbing'));
              return;
            }
          }

          if (!(e.target instanceof HTMLCanvasElement)) {
            setHoverNodeId(null);
            setHoverLinkId(null);
            setCursor('default');
            return;
          }

          const hit = resolveHitAtClientPos(e.clientX, e.clientY);
          const nextNodeId = hit?.kind === 'node' ? hit.node.id : null;
          const nextLinkId = hit?.kind === 'link' ? hit.link.id : null;
          const nextCursor = hit ? 'pointer' : 'default';

          setHoverNodeId((prev) => (prev === nextNodeId ? prev : nextNodeId));
          setHoverLinkId((prev) => (prev === nextLinkId ? prev : nextLinkId));
          setCursor((prev) => (prev === nextCursor ? prev : nextCursor));
        }}
        onPointerUpCapture={(e) => {
          const down = pointerDownRef.current;
          pointerDownRef.current = null;
          if (!down || e.button !== 0 || !(e.target instanceof HTMLCanvasElement)) {
            return;
          }

          const dist = Math.hypot(e.clientX - down.x, e.clientY - down.y);
          const hit = resolveHitAtClientPos(e.clientX, e.clientY);
          setCursor(hit ? 'pointer' : 'default');

          // ドラッグ操作（パン・ノード移動）だった場合はクリック扱いしない
          if (dist >= 6) return;

          if (hit?.kind === 'node') {
            onNodeClick(hit.node);
          } else if (hit?.kind === 'link') {
            onLinkClick(hit.link);
          } else {
            onBackgroundClick();
          }
        }}
        onPointerLeave={() => {
          pointerDownRef.current = null;
          setHoverNodeId(null);
          setHoverLinkId(null);
          setCursor('default');
        }}
      >
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          backgroundColor="#020617"
          nodeRelSize={16}
          nodeCanvasObject={drawNode}
          nodePointerAreaPaint={paintNodePointerArea}
          linkCanvasObject={drawLink}
          enableNodeDrag={true}
          onNodeDragEnd={(node: any) => {
            node.fx = node.x;
            node.fy = node.y;
          }}
          showPointerCursor={false}
          cooldownTicks={120}
        />
      </div>

      {/* 左下：凡例（レジェンド）パネル */}
      <div className="pointer-events-auto fixed bottom-4 left-4 z-10 rounded-2xl border border-slate-800/90 bg-slate-900/85 p-3 text-xs text-slate-300 shadow-xl backdrop-blur-md">
        <div className="mb-1.5 font-semibold text-slate-100">
          {mode === 'podcaster' ? '👤 人物モードの凡例' : '🎙️ 番組モードの凡例'}
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="inline-block h-1 w-6 rounded bg-emerald-500" />
            <span>
              {mode === 'podcaster'
                ? '太い実線：同じ番組のメインMC同士'
                : '太い実線：メインMCを兼任している番組同士'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-0.5 w-6 border-b-2 border-dashed border-indigo-400" />
            <span>
              {mode === 'podcaster'
                ? '点線 / 実線：ゲスト共演（回数に応じて太く表示）'
                : '点線 / 実線：MCが他番組へゲスト出演'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 pt-0.5">
            💡 クリックで詳細表示・ドラッグでノードを移動できます
          </div>
        </div>
      </div>

      {/* 右下（ポップアップ非表示時でも操作しやすい位置）：ズーム操作ボタン */}
      <div className="pointer-events-auto fixed bottom-4 right-4 z-10 flex flex-col gap-1.5 rounded-xl border border-slate-800 bg-slate-900/85 p-1.5 shadow-xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => {
            const currentZoom = fgRef.current?.zoom() ?? 1;
            fgRef.current?.zoom(currentZoom * 1.35, 300);
          }}
          className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
          title="拡大"
          aria-label="拡大"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            const currentZoom = fgRef.current?.zoom() ?? 1;
            fgRef.current?.zoom(currentZoom / 1.35, 300);
          }}
          className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
          title="縮小"
          aria-label="縮小"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => fgRef.current?.zoomToFit(450, 70)}
          className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
          title="全体を表示"
          aria-label="全体を表示"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
