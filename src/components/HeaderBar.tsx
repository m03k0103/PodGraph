import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Search, Users, Radio, MessageSquarePlus, X, Sun, Moon } from 'lucide-react';
import type { GraphMode, Podcast, Podcaster, ThemeMode } from '../types/schema';
import { searchEntities } from '../lib/search';

interface HeaderBarProps {
  mode: GraphMode;
  onModeChange: (mode: GraphMode) => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  nodeCount: number;
  linkCount: number;
  podcasters: Podcaster[];
  podcasts: Podcast[];
  onSelectPodcaster: (id: string) => void;
  onSelectPodcast: (id: string) => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  mode,
  onModeChange,
  theme,
  onThemeChange,
  nodeCount,
  linkCount,
  podcasters,
  podcasts,
  onSelectPodcaster,
  onSelectPodcast,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const githubRepoUrl =
    import.meta.env.VITE_GITHUB_REPO_URL || 'https://github.com/m03k0103/PodGraph';
  const issueUrl = `${githubRepoUrl.replace(/\/$/, '')}/issues/new?template=co-star-tip.yml&title=${encodeURIComponent('[共演情報] 番組名 / ゲスト名')}`;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const searchResults = useMemo(
    () => searchEntities(query, podcasters, podcasts),
    [query, podcasters, podcasts]
  );

  const hasResults =
    searchResults.matchedPodcasters.length > 0 ||
    searchResults.matchedPodcasts.length > 0;

  return (
    <header className="pointer-events-none fixed top-0 right-0 left-0 z-20 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      {/* 左側：ロゴ ＆ 人物/番組モード切替トグル */}
      <div className="theme-surface-glass pointer-events-auto flex flex-wrap items-center gap-3 rounded-2xl border px-3.5 py-2 backdrop-blur-md">
        <div className="flex items-center gap-2 pr-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/40 [data-theme='dark']_&:text-emerald-400">
            <Radio className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="theme-text-primary text-sm font-bold tracking-tight sm:text-base">
                PodGraph
              </h1>
              <span className="tabular-nums hidden rounded-md bg-[var(--bg-badge)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-muted)] md:inline-block">
                {nodeCount}
                {mode === 'podcaster' ? '人' : '番組'} / {linkCount}のつながり
              </span>
            </div>
            <p className="theme-text-muted hidden text-[11px] sm:block">
              ポッドキャスター＆番組 共演相関図
            </p>
          </div>
        </div>

        {/* モード切替トグルスイッチ */}
        <div
          role="group"
          aria-label="グラフ表示モード切替"
          className="flex items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1"
        >
          <button
            type="button"
            onClick={() => onModeChange('podcaster')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              mode === 'podcaster'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'theme-text-muted hover:text-[var(--text-primary)]'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>人物モード</span>
          </button>
          <button
            type="button"
            onClick={() => onModeChange('podcast')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              mode === 'podcast'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'theme-text-muted hover:text-[var(--text-primary)]'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>番組モード</span>
          </button>
        </div>
      </div>

      {/* 右側：検索ボックス・テーマ切替・タレコミ（GitHub Issue）ボタン */}
      <div className="pointer-events-auto flex items-center gap-2">
        <div ref={containerRef} className="relative flex-1 sm:w-72 sm:flex-none">
          <div className="relative flex items-center">
            <Search className="theme-text-muted pointer-events-none absolute left-3 h-4 w-4" />
            <input
              type="text"
              value={query}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              placeholder="ポッドキャスター名・番組名で検索..."
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-glass)] py-2 pr-8 pl-9 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] shadow-sm backdrop-blur-md focus:border-emerald-500 focus:outline-none sm:text-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="theme-text-muted absolute right-2.5 hover:text-[var(--text-primary)] cursor-pointer"
                aria-label="検索クリア"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* 検索候補ドロップダウン */}
          {isOpen && query.trim() !== '' && (
            <div className="theme-surface-glass absolute right-0 left-0 mt-1.5 max-h-80 overflow-y-auto rounded-xl border p-2 backdrop-blur-md">
              {!hasResults ? (
                <p className="theme-text-muted py-4 text-center text-xs">
                  該当するポッドキャスター・番組が見つかりません
                </p>
              ) : (
                <div className="space-y-3">
                  {searchResults.matchedPodcasters.length > 0 && (
                    <div>
                      <div className="px-2 pb-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        👤 ポッドキャスター
                      </div>
                      <div className="space-y-1">
                        {searchResults.matchedPodcasters.map((person) => (
                          <button
                            key={person.id}
                            type="button"
                            onClick={() => {
                              onSelectPodcaster(person.id);
                              setIsOpen(false);
                            }}
                            className="theme-text-primary flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-[var(--bg-glass-hover)] cursor-pointer"
                          >
                            <span className="font-medium">{person.name}</span>
                            <span className="theme-text-muted text-[11px]">人物を表示</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.matchedPodcasts.length > 0 && (
                    <div>
                      <div className="px-2 pb-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                        🎙️ ポッドキャスト番組
                      </div>
                      <div className="space-y-1">
                        {searchResults.matchedPodcasts.map((show) => (
                          <button
                            key={show.id}
                            type="button"
                            onClick={() => {
                              onSelectPodcast(show.id);
                              setIsOpen(false);
                            }}
                            className="theme-text-primary flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-[var(--bg-glass-hover)] cursor-pointer"
                          >
                            <span className="font-medium">{show.title}</span>
                            <span className="theme-text-muted text-[11px]">番組を表示</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Light / Dark テーマ切替トグル */}
        <button
          type="button"
          onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
          title={theme === 'light' ? 'ダークテーマへ切替' : 'ライトテーマへ切替'}
          aria-label={theme === 'light' ? 'ダークテーマへ切替' : 'ライトテーマへ切替'}
          className="theme-surface-glass flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border backdrop-blur-md transition hover:bg-[var(--bg-glass-hover)] cursor-pointer"
        >
          {theme === 'light' ? (
            <Moon className="theme-text-secondary h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4 text-amber-400" />
          )}
        </button>

        <a
          href={issueUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub Issueで共演情報のタレコミを送る"
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur-md transition hover:bg-emerald-500/25 [data-theme='dark']_&:text-emerald-300"
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span className="hidden sm:inline">共演情報のタレコミ</span>
          <span className="sm:hidden">タレコミ</span>
        </a>
      </div>
    </header>
  );
};
