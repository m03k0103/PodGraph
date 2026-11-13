import React from 'react';
import { ExternalLink, Mic, Sparkles } from 'lucide-react';
import type { GuestEpisode, Podcast, Podcaster } from '../../types/schema';
import { PodcasterAvatar } from './PodcasterAvatar';
import { EpisodeCard } from './EpisodeCard';
import { ShowLinks } from './ShowLinks';

interface PodcasterDetailProps {
  person: Podcaster;
  podcasts: Podcast[];
  episodes: GuestEpisode[];
  podcasterMap: Map<string, Podcaster>;
  podcastMap: Map<string, Podcast>;
  onSelectPodcaster: (id: string) => void;
  onSelectPodcast: (id: string) => void;
}

export const PodcasterDetail: React.FC<PodcasterDetailProps> = ({
  person,
  podcasts,
  episodes,
  podcasterMap,
  podcastMap,
  onSelectPodcaster,
  onSelectPodcast,
}) => {
  const mainPodcasts = podcasts.filter((p) => p.hostIds.includes(person.id));
  const formerPodcasts = podcasts.filter((p) => p.formerHostIds?.includes(person.id));
  const isFormerHostOnly = mainPodcasts.length === 0 && formerPodcasts.length > 0;

  const guestEpisodes = episodes
    .filter((e) => e.guestIds.includes(person.id))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const hostedGuestEpisodes = episodes
    .filter((e) => {
      const show = podcastMap.get(e.podcastId);
      const activeHosts = e.hostIdsOverride ?? show?.hostIds ?? [];
      return activeHosts.includes(person.id) && !e.guestIds.includes(person.id);
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <>
      <div className="flex items-start gap-4">
        <PodcasterAvatar
          person={person}
          sizeClass="h-16 w-16 text-lg"
          isFormer={isFormerHostOnly}
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-white">{person.name}</h2>
          {person.bio && (
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{person.bio}</p>
          )}
          {person.links?.x && (
            <div className="mt-2.5">
              <a
                href={person.links.x}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-800"
              >
                <span>𝕏 (Twitter)</span>
                <ExternalLink className="h-3 w-3 text-slate-400" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* メインで出演しているポッドキャスト一覧 */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
          <Mic className="h-4 w-4" />
          <span>メインで出演しているポッドキャスト ({mainPodcasts.length})</span>
        </h3>
        {mainPodcasts.length === 0 ? (
          <p className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 text-xs text-slate-400">
            登録されているメイン番組はありません
          </p>
        ) : (
          <div className="space-y-2.5">
            {mainPodcasts.map((show) => {
              const coHosts = show.hostIds
                .filter((id) => id !== person.id)
                .map((id) => podcasterMap.get(id))
                .filter((p): p is Podcaster => Boolean(p));

              return (
                <div
                  key={show.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 transition hover:border-slate-700"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={show.imageUrl}
                      alt={show.title}
                      className="h-12 w-12 shrink-0 rounded-lg border border-slate-700 bg-slate-800 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onSelectPodcast(show.id)}
                        className="text-left text-sm font-bold text-white hover:text-emerald-300 cursor-pointer"
                      >
                        {show.title}
                      </button>
                      {show.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                          {show.description}
                        </p>
                      )}
                      {coHosts.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-slate-400">共同MC:</span>
                          {coHosts.map((ch) => (
                            <button
                              key={ch.id}
                              type="button"
                              onClick={() => onSelectPodcaster(ch.id)}
                              className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/25 cursor-pointer"
                            >
                              {ch.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <ShowLinks
                      spotifyUrl={show.links.spotify}
                      pocketCastsUrl={show.links.pocketCasts}
                      compact
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 元メインMCとして出演していたポッドキャスト一覧 */}
      {formerPodcasts.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Mic className="h-4 w-4" />
            <span>元メインMC番組 ({formerPodcasts.length})</span>
          </h3>
          <div className="space-y-2.5">
            {formerPodcasts.map((show) => {
              const coHosts = show.hostIds
                .filter((id) => id !== person.id)
                .map((id) => podcasterMap.get(id))
                .filter((p): p is Podcaster => Boolean(p));

              return (
                <div
                  key={show.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 transition hover:border-slate-700"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={show.imageUrl}
                      alt={show.title}
                      className="h-12 w-12 shrink-0 rounded-lg border border-slate-700 bg-slate-800 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectPodcast(show.id)}
                          className="text-left text-sm font-bold text-slate-200 hover:text-white cursor-pointer"
                        >
                          {show.title}
                        </button>
                        <span className="rounded-full bg-slate-700/70 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                          元MC
                        </span>
                      </div>
                      {show.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                          {show.description}
                        </p>
                      )}
                      {coHosts.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-slate-400">MC:</span>
                          {coHosts.map((ch) => (
                            <button
                              key={ch.id}
                              type="button"
                              onClick={() => onSelectPodcaster(ch.id)}
                              className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300 hover:bg-slate-700 cursor-pointer"
                            >
                              {ch.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ゲストとして出演したポッドキャストのエピソード一覧 */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
          <Sparkles className="h-4 w-4" />
          <span>ゲスト出演したエピソード ({guestEpisodes.length})</span>
        </h3>
        {guestEpisodes.length === 0 ? (
          <p className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 text-xs text-slate-400">
            登録されているゲスト出演回はありません
          </p>
        ) : (
          <div className="space-y-3">
            {guestEpisodes.map((ep) => (
              <EpisodeCard
                key={ep.id}
                episode={ep}
                podcastMap={podcastMap}
                podcasterMap={podcasterMap}
                currentPodcasterId={person.id}
                onSelectPodcaster={onSelectPodcaster}
                onSelectPodcast={onSelectPodcast}
              />
            ))}
          </div>
        )}
      </section>

      {/* MC側としてゲストを迎えた回 */}
      {hostedGuestEpisodes.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
            <Sparkles className="h-4 w-4" />
            <span>ゲストを迎えたエピソード ({hostedGuestEpisodes.length})</span>
          </h3>
          <div className="space-y-3">
            {hostedGuestEpisodes.map((ep) => (
              <EpisodeCard
                key={ep.id}
                episode={ep}
                podcastMap={podcastMap}
                podcasterMap={podcasterMap}
                currentPodcasterId={person.id}
                onSelectPodcaster={onSelectPodcaster}
                onSelectPodcast={onSelectPodcast}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
};
