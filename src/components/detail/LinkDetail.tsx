import React from 'react';
import { Link2 } from 'lucide-react';
import type { GraphLink, GraphMode, GuestEpisode, Podcast, Podcaster } from '../../types/schema';
import { PodcasterAvatar } from './PodcasterAvatar';
import { EpisodeCard } from './EpisodeCard';

interface LinkDetailProps {
  link: GraphLink;
  mode: GraphMode;
  podcasterMap: Map<string, Podcaster>;
  podcastMap: Map<string, Podcast>;
  episodeMap: Map<string, GuestEpisode>;
  onSelectPodcaster: (id: string) => void;
  onSelectPodcast: (id: string) => void;
}

function resolveEndpointId(endpoint: string | { id: string }): string {
  return typeof endpoint === 'object' ? endpoint.id : endpoint;
}

export const LinkDetail: React.FC<LinkDetailProps> = ({
  link,
  mode,
  podcasterMap,
  podcastMap,
  episodeMap,
  onSelectPodcaster,
  onSelectPodcast,
}) => {
  const sourceId = resolveEndpointId(link.source as string | { id: string });
  const targetId = resolveEndpointId(link.target as string | { id: string });

  const coEpisodes = link.guestEpisodeIds
    .map((id) => episodeMap.get(id))
    .filter((e): e is GuestEpisode => Boolean(e))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  if (mode === 'podcaster') {
    const personA = podcasterMap.get(sourceId);
    const personB = podcasterMap.get(targetId);
    const regularShows = link.regularPodcastIds
      .map((id) => podcastMap.get(id))
      .filter((s): s is Podcast => Boolean(s));

    return (
      <>
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5">
          {personA && (
            <button
              type="button"
              onClick={() => onSelectPodcaster(personA.id)}
              className="flex flex-1 flex-col items-center gap-1.5 rounded-xl p-2 hover:bg-slate-800 cursor-pointer"
            >
              <PodcasterAvatar person={personA} sizeClass="h-12 w-12 text-sm" />
              <span className="text-xs font-bold text-white">{personA.name}</span>
            </button>
          )}
          <div className="flex flex-col items-center text-slate-400">
            <Link2 className="h-5 w-5 text-emerald-400" />
            <span className="text-[10px]">共演関係</span>
          </div>
          {personB && (
            <button
              type="button"
              onClick={() => onSelectPodcaster(personB.id)}
              className="flex flex-1 flex-col items-center gap-1.5 rounded-xl p-2 hover:bg-slate-800 cursor-pointer"
            >
              <PodcasterAvatar person={personB} sizeClass="h-12 w-12 text-sm" />
              <span className="text-xs font-bold text-white">{personB.name}</span>
            </button>
          )}
        </div>

        {regularShows.length > 0 && (
          <section>
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
              🎙️ レギュラー共演している番組 ({regularShows.length})
            </h3>
            <div className="space-y-2">
              {regularShows.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelectPodcast(s.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3 text-left hover:border-emerald-500/40 cursor-pointer"
                >
                  <img
                    src={s.imageUrl}
                    alt={s.title}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                  <div>
                    <div className="text-sm font-bold text-white">{s.title}</div>
                    <div className="text-xs text-slate-400">共同メインMC</div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        <section>
          <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-amber-400">
            ✨ ゲスト共演エピソード ({coEpisodes.length})
          </h3>
          {coEpisodes.length === 0 ? (
            <p className="text-xs text-slate-400">
              ゲストとしての共演エピソードはありません（レギュラー番組の共同MC関係）
            </p>
          ) : (
            <div className="space-y-3">
              {coEpisodes.map((ep) => (
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
  }

  const showA = podcastMap.get(sourceId);
  const showB = podcastMap.get(targetId);
  const sharedHosts = link.sharedHostIds
    .map((id) => podcasterMap.get(id))
    .filter((p): p is Podcaster => Boolean(p));

  return (
    <>
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5">
        {showA && (
          <button
            type="button"
            onClick={() => onSelectPodcast(showA.id)}
            className="flex flex-1 flex-col items-center gap-1.5 rounded-xl p-2 hover:bg-slate-800 cursor-pointer"
          >
            <img
              src={showA.imageUrl}
              alt={showA.title}
              className="h-12 w-12 rounded-xl object-cover"
            />
            <span className="text-center text-xs font-bold text-white">{showA.title}</span>
          </button>
        )}
        <div className="flex flex-col items-center text-slate-400">
          <Link2 className="h-5 w-5 text-indigo-400" />
          <span className="text-[10px]">番組間連携</span>
        </div>
        {showB && (
          <button
            type="button"
            onClick={() => onSelectPodcast(showB.id)}
            className="flex flex-1 flex-col items-center gap-1.5 rounded-xl p-2 hover:bg-slate-800 cursor-pointer"
          >
            <img
              src={showB.imageUrl}
              alt={showB.title}
              className="h-12 w-12 rounded-xl object-cover"
            />
            <span className="text-center text-xs font-bold text-white">{showB.title}</span>
          </button>
        )}
      </div>

      {sharedHosts.length > 0 && (
        <section>
          <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
            👤 両番組を兼任しているメインMC ({sharedHosts.length})
          </h3>
          <div className="space-y-2">
            {sharedHosts.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => onSelectPodcaster(h.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-left hover:border-emerald-500/40 cursor-pointer"
              >
                <PodcasterAvatar person={h} sizeClass="h-9 w-9 text-xs" />
                <span className="text-sm font-semibold text-white">{h.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-amber-400">
          ✨ 番組間のゲスト往来エピソード ({coEpisodes.length})
        </h3>
        {coEpisodes.length === 0 ? (
          <p className="text-xs text-slate-400">
            ゲスト往来エピソードはありません（メインMC兼任による繋がり）
          </p>
        ) : (
          <div className="space-y-3">
            {coEpisodes.map((ep) => (
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
