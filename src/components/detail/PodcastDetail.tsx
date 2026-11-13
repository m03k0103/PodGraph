import React from 'react';
import { Sparkles, Users } from 'lucide-react';
import type { GuestEpisode, Podcast, Podcaster } from '../../types/schema';
import { PodcasterAvatar } from './PodcasterAvatar';
import { EpisodeCard } from './EpisodeCard';
import { ShowLinks } from './ShowLinks';

interface PodcastDetailProps {
  show: Podcast;
  episodes: GuestEpisode[];
  podcasterMap: Map<string, Podcaster>;
  podcastMap: Map<string, Podcast>;
  onSelectPodcaster: (id: string) => void;
  onSelectPodcast: (id: string) => void;
}

export const PodcastDetail: React.FC<PodcastDetailProps> = ({
  show,
  episodes,
  podcasterMap,
  podcastMap,
  onSelectPodcaster,
  onSelectPodcast,
}) => {
  const hosts = show.hostIds
    .map((id) => podcasterMap.get(id))
    .filter((p): p is Podcaster => Boolean(p));

  const formerHosts = (show.formerHostIds ?? [])
    .map((id) => podcasterMap.get(id))
    .filter((p): p is Podcaster => Boolean(p));

  const showGuestEpisodes = episodes
    .filter((e) => e.podcastId === show.id)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <>
      <div className="flex items-start gap-4">
        <img
          src={show.imageUrl}
          alt={show.title}
          className="h-16 w-16 shrink-0 rounded-2xl border border-indigo-500/40 bg-slate-800 object-cover"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-white">{show.title}</h2>
          {show.description && (
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{show.description}</p>
          )}
          <div className="mt-3">
            <ShowLinks
              spotifyUrl={show.links.spotify}
              pocketCastsUrl={show.links.pocketCasts}
              spotifyLabel="Spotifyで番組を開く"
            />
          </div>
        </div>
      </div>

      {/* メインMC一覧 */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
          <Users className="h-4 w-4" />
          <span>メインパーソナリティ ({hosts.length})</span>
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {hosts.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => onSelectPodcaster(h.id)}
              className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 text-left transition hover:border-emerald-500/50 hover:bg-slate-900 cursor-pointer"
            >
              <PodcasterAvatar person={h} sizeClass="h-10 w-10 text-xs" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white">{h.name}</div>
                {h.bio && <div className="truncate text-xs text-slate-400">{h.bio}</div>}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 元メインMC一覧 */}
      {formerHosts.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Users className="h-4 w-4" />
            <span>元メインMC ({formerHosts.length})</span>
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {formerHosts.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => onSelectPodcaster(h.id)}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-left transition hover:border-slate-600 hover:bg-slate-900 cursor-pointer"
              >
                <PodcasterAvatar person={h} sizeClass="h-10 w-10 text-xs" isFormer />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">{h.name}</span>
                    <span className="rounded-full bg-slate-700/70 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                      元MC
                    </span>
                  </div>
                  {h.bio && <div className="truncate text-xs text-slate-400">{h.bio}</div>}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* この番組のゲスト出演回一覧 */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
          <Sparkles className="h-4 w-4" />
          <span>ゲスト出演回（共演エピソード）一覧 ({showGuestEpisodes.length})</span>
        </h3>
        {showGuestEpisodes.length === 0 ? (
          <p className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 text-xs text-slate-400">
            登録されているゲスト出演回はありません
          </p>
        ) : (
          <div className="space-y-3">
            {showGuestEpisodes.map((ep) => (
              <EpisodeCard
                key={ep.id}
                episode={ep}
                podcastMap={podcastMap}
                podcasterMap={podcasterMap}
                onSelectPodcaster={onSelectPodcaster}
                onSelectPodcast={onSelectPodcast}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
};
