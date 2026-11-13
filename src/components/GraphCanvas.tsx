import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import ForceGraph2D, {
  type ForceGraphMethods,
  type LinkObject,
  type NodeObject,
} from 'react-force-graph-2d';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { GraphData, GraphLink, GraphMode, GraphNode } from '../types/schema';
import { hitTestGraph } from '../lib/hitTest';
import {
  drawGraphLink,
  drawGraphNode,
  paintGraphNodePointerArea,
  type ResolvedGraphLink,
} from '../lib/graphRenderer';
import { useImageCache } from '../hooks/useImageCache';

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

type FGNode = NodeObject<GraphNode>;
type FGLink = LinkObject<GraphNode, GraphLink>;

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
  const fgRef = useRef<ForceGraphMethods<FGNode, FGLink> | undefined>(undefined);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const measureCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);
  const imageCache = useImageCache(graphData.nodes);

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

  // 力学パラメータ調整（ノード間の距離を広げて見やすくする）
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const charge = fg.d3Force('charge') as { strength?: (val: number) => void } | undefined;
    charge?.strength?.(-420);

    const linkForce = fg.d3Force('link') as
      | { distance?: (fn: (link: GraphLink) => number) => void }
      | undefined;
    linkForce?.distance?.((link: GraphLink) => (link.relationType === 'regular' ? 95 : 135));

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
  const connectedNodeIds = useMemo(() => {
    const set = new Set<string>();
    if (!activeNodeId) return set;
    set.add(activeNodeId);
    for (const link of graphData.links) {
      const sId =
        typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
      const tId =
        typeof link.target === 'object' ? (link.target as GraphNode).id : link.target;
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
    (nodeObj: FGNode, color: string, ctx: CanvasRenderingContext2D, globalScale: number) => {
      paintGraphNodePointerArea(nodeObj as GraphNode, color, ctx, globalScale);
    },
    []
  );

  const drawNode = useCallback(
    (nodeObj: FGNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      drawGraphNode(nodeObj as GraphNode, ctx, globalScale, {
        mode,
        selectedNodeId,
        hoverNodeId,
        activeNodeId,
        connectedNodeIds,
        imageCache,
      });
    },
    [activeNodeId, connectedNodeIds, hoverNodeId, imageCache, mode, selectedNodeId]
  );

  const drawLink = useCallback(
    (linkObj: FGLink, ctx: CanvasRenderingContext2D) => {
      drawGraphLink(linkObj as ResolvedGraphLink, ctx, {
        selectedLinkId,
        hoverLinkId,
        activeNodeId,
      });
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
        <ForceGraph2D<FGNode, FGLink>
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData as { nodes: FGNode[]; links: FGLink[] }}
          backgroundColor="#020617"
          nodeRelSize={16}
          nodeCanvasObject={drawNode}
          nodePointerAreaPaint={paintNodePointerArea}
          linkCanvasObject={drawLink}
          enableNodeDrag={true}
          onNodeDragEnd={(node) => {
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
          <div className="pt-0.5 text-[10px] text-slate-400">
            💡 クリックで詳細表示・ドラッグでノードを移動できます
          </div>
        </div>
      </div>

      {/* 右下：ズーム操作ボタン */}
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
