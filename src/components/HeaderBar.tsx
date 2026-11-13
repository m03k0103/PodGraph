import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Search, Users, Radio, MessageSquarePlus, X } from 'lucide-react';
import type { GraphMode, Podcast, Podcaster } from '../types/schema';
import { searchEntities } from '../lib/search';

interface HeaderBarProps {
  mode: GraphMode;
  onModeChange: (mode: GraphMode) => void;
  podcasters: Podcaster[];
  podcasts: Podcast[];
  onSelectPodcaster: (id: string) => void;
  onSelectPodcast: (id: string) => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  mode,
  onModeChange,
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      <div className="pointer-events-auto flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800/90 bg-slate-900/85 px-3.5 py-2 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 pr-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40">
            <Radio className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white sm:text-base">
              PodGraph
            </h1>
            <p className="hidden text-[11px] text-slate-400 sm:block">
              ポッドキャスター＆番組 共演相関図
            </p>
          </div>
        </div>

        {/* モード切替トグルスイッチ */}
        <div
          role="group"
          aria-label="グラフ表示モード切替"
          className="flex items-center rounded-xl bg-slate-950/90 p-1 ring-1 ring-slate-800"
        >
          <button
            type="button"
            onClick={() => onModeChange('podcaster')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              mode === 'podcaster'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
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
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>番組モード</span>
          </button>
        </div>
      </div>

      {/* 右側：検索ボックス ＆ タレコミ（GitHub Issue）ボタン */}
      <div className="pointer-events-auto flex items-center gap-2.5">
        <div ref={containerRef} className="relative flex-1 sm:w-72 sm:flex-none">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              placeholder="ポッドキャスター名・番組名で検索..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2 pr-8 pl-9 text-xs text-slate-100 placeholder-slate-400 shadow-lg backdrop-blur-md focus:border-emerald-500 focus:outline-none sm:text-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                aria-label="検索クリア"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* 検索候補ドロップダウン */}
          {isOpen && query.trim() !== '' && (
            <div className="absolute right-0 left-0 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-md">
              {!hasResults ? (
                <p className="py-4 text-center text-xs text-slate-400">
                  該当するポッドキャスター・番組が見つかりません
                </p>
              ) : (
                <div className="space-y-3">
                  {searchResults.matchedPodcasters.length > 0 && (
                    <div>
                      <div className="px-2 pb-1 text-[11px] font-semibold text-emerald-400">
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
                            className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-200 hover:bg-slate-800 cursor-pointer"
                          >
                            <span className="font-medium">{person.name}</span>
                            <span className="text-[11px] text-slate-400">人物を表示</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.matchedPodcasts.length > 0 && (
                    <div>
                      <div className="px-2 pb-1 text-[11px] font-semibold text-indigo-400">
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
                            className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-200 hover:bg-slate-800 cursor-pointer"
                          >
                            <span className="font-medium">{show.title}</span>
                            <span className="text-[11px] text-slate-400">番組を表示</span>
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

        <a
          href={issueUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub Issueで共演情報のタレコミを送る"
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-300 shadow-lg backdrop-blur-md transition hover:bg-emerald-500/25 hover:text-emerald-200"
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span className="hidden sm:inline">共演情報のタレコミ</span>
          <span className="sm:hidden">タレコミ</span>
        </a>
      </div>
    </header>
  );
};
