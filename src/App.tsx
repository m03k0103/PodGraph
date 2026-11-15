import React, { useMemo, useState, useCallback, useEffect } from 'react';
import podcastersData from './data/podcasters.json';
import podcastsData from './data/podcasts.json';
import episodesData from './data/episodes.json';
import { buildGraph, getHostedPodcasters } from './lib/graphBuilder';
import { HeaderBar } from './components/HeaderBar';
import { GraphCanvas } from './components/GraphCanvas';
import { DetailPopup } from './components/DetailPopup';
import type {
  GraphLink,
  GraphMode,
  GraphNode,
  GuestEpisode,
  Podcast,
  Podcaster,
  PopupSelection,
  ThemeMode,
} from './types/schema';

const THEME_STORAGE_KEY = 'podgraph_theme';

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // ignore storage errors
  }
  return 'light';
}

const podcasters = podcastersData as Podcaster[];
const podcasts = podcastsData as Podcast[];
const episodes = episodesData as GuestEpisode[];

export const App: React.FC = () => {
  const [mode, setMode] = useState<GraphMode>('podcast');
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [selection, setSelection] = useState<PopupSelection | null>(null);
  const [focusTrigger, setFocusTrigger] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const visiblePodcasters = useMemo(
    () => getHostedPodcasters(podcasters, podcasts),
    []
  );

  const graphData = useMemo(
    () => buildGraph(mode, visiblePodcasters, podcasts, episodes),
    [mode, visiblePodcasters]
  );

  // 現在のグラフモードにおけるフォーカス対象ノードIDを計算
  const selectedNodeId = useMemo(() => {
    if (!selection) return null;
    if (selection.kind === 'podcaster') {
      if (mode === 'podcaster') return selection.id;
      const mainShow = podcasts.find(
        (p) => p.hostIds.includes(selection.id) || p.formerHostIds?.includes(selection.id)
      );
      return mainShow?.id ?? null;
    }
    if (selection.kind === 'podcast') {
      if (mode === 'podcast') return selection.id;
      const show = podcasts.find((p) => p.id === selection.id);
      return show?.hostIds[0] ?? null;
    }
    return null;
  }, [selection, mode]);

  const selectedLinkId = selection?.kind === 'link' ? selection.linkId : null;

  const handleSelectPodcaster = useCallback((id: string) => {
    setSelection({ kind: 'podcaster', id });
    setFocusTrigger((t) => t + 1);
  }, []);

  const handleSelectPodcast = useCallback((id: string) => {
    setSelection({ kind: 'podcast', id });
    setFocusTrigger((t) => t + 1);
  }, []);

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (node.type === 'podcaster') {
      setSelection({ kind: 'podcaster', id: node.id });
    } else {
      setSelection({ kind: 'podcast', id: node.id });
    }
    setFocusTrigger((t) => t + 1);
  }, []);

  const handleLinkClick = useCallback(
    (link: GraphLink) => {
      setSelection({ kind: 'link', linkId: link.id, mode });
    },
    [mode]
  );

  const handleModeChange = useCallback((nextMode: GraphMode) => {
    setMode(nextMode);
    setSelection((prev) => (prev?.kind === 'link' ? null : prev));
    setFocusTrigger((t) => t + 1);
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[var(--bg-primary)]">
      <HeaderBar
        mode={mode}
        onModeChange={handleModeChange}
        theme={theme}
        onThemeChange={setTheme}
        nodeCount={graphData.nodes.length}
        linkCount={graphData.links.length}
        podcasters={visiblePodcasters}
        podcasts={podcasts}
        onSelectPodcaster={handleSelectPodcaster}
        onSelectPodcast={handleSelectPodcast}
      />

      <GraphCanvas
        mode={mode}
        theme={theme}
        graphData={graphData}
        selectedNodeId={selectedNodeId}
        selectedLinkId={selectedLinkId}
        focusTrigger={focusTrigger}
        onNodeClick={handleNodeClick}
        onLinkClick={handleLinkClick}
        onBackgroundClick={() => setSelection(null)}
      />

      <DetailPopup
        selection={selection}
        podcasters={visiblePodcasters}
        podcasts={podcasts}
        episodes={episodes}
        links={graphData.links}
        onClose={() => setSelection(null)}
        onSelectPodcaster={handleSelectPodcaster}
        onSelectPodcast={handleSelectPodcast}
      />
    </main>
  );
};

export default App;
