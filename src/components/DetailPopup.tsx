import React from 'react';
import {
  X,
  ExternalLink,
  Mic,
  Headphones,
  Calendar,
  Users,
  Radio,
  Sparkles,
  Link2,
} from 'lucide-react';
import type {
  GraphLink,
  GuestEpisode,
  Podcast,
  Podcaster,
  PopupSelection,
} from '../types/schema';
import { getAvatarColor, getFallbackText } from '../lib/graphBuilder';

interface DetailPopupProps {
  selection: PopupSelection | null;
  podcasters: Podcaster[];
  podcasts: Podcast[];
  episodes: GuestEpisode[];
  links: GraphLink[];
  onClose: () => void;
  onSelectPodcaster: (id: string) => void;
  onSelectPodcast: (id: string) => void;
}

export const DetailPopup: React.FC<DetailPopupProps> = ({
  selection,
  podcasters,
  podcasts,
  episodes,
  links,
  onClose,
  onSelectPodcaster,
  onSelectPodcast,
}) => {
  if (!selection) return null;

  const podcasterMap = new Map(podcasters.map((p) => [p.id, p]));
  const podcastMap = new Map(podcasts.map((p) => [p.id, p]));
  const episodeMap = new Map(episodes.map((e) => [e.id, e]));

  const renderAvatar = (person?: Podcaster, sizeClass = 'h-12 w-12 text-sm') => {
    if (!person) {
      return (
        <div className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-400 font-bold`}>
          ?
        </div>
      );
    }
    const colors = getAvatarColor(person.name);
    return (
      <div
        className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full font-bold shadow-md`}
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          border: `2px solid ${colors.ring}`,
        }}
      >
        {getFallbackText(person.name)}
      </div>
    );
  };

  const renderEpisodeCard = (ep: GuestEpisode, currentPodcasterId?: string) => {
    const show = podcastMap.get(ep.podcastId);
    const activeHostIds = ep.hostIdsOverride ?? show?.hostIds ?? [];
    const hosts = activeHostIds
      .map((id) => podcasterMap.get(id))
      .filter((p): p is Podcaster => Boolean(p));
    const guests = ep.guestIds
      .map((id) => podcasterMap.get(id))
      .filter((p): p is Podcaster => Boolean(p));

    return (
      <div
        key={ep.id}
        className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 transition hover:border-slate-700"
      >
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          {show && (
            <button
              type="button"
              onClick={() => onSelectPodcast(show.id)}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-500/15 px-2 py-0.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/25 cursor-pointer"
            >
              <Radio className="h-3 w-3" />
              <span>{show.title}</span>
            </button>
          )}
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
            <Calendar className="h-3 w-3" />
            {ep.publishedAt}
          </span>
        </div>

        <h4 className="mb-2.5 text-sm font-semibold leading-snug text-slate-100">
          {ep.title}
        </h4>

        {/* 共演者チップ（クリックでその人物のポップアップ＆グラフフォーカスへ切替） */}
        <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs">
          {hosts.map((h) => (
            <button
              key={`host-${h.id}`}
              type="button"
              onClick={() => onSelectPodcaster(h.id)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition cursor-pointer ${
                h.id === currentPodcasterId
                  ? 'bg-emerald-500/25 text-emerald-200 ring-1 ring-emerald-500/50'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span className="text-[10px] text-emerald-400">MC</span>
              <span>{h.name}</span>
            </button>
          ))}
          {guests.map((g) => (
            <button
              key={`guest-${g.id}`}
              type="button"
              onClick={() => onSelectPodcaster(g.id)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition cursor-pointer ${
                g.id === currentPodcasterId
                  ? 'bg-amber-500/25 text-amber-200 ring-1 ring-amber-500/50'
                  : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
              }`}
            >
              <span className="text-[10px] text-amber-400">Guest</span>
              <span>{g.name}</span>
            </button>
          ))}
        </div>

        {/* 再生リンクボタン（Spotify / Pocket Casts） */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={ep.links.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1DB954]/20 px-3 py-1.5 text-xs font-semibold text-[#1ed760] ring-1 ring-[#1DB954]/40 transition hover:bg-[#1DB954]/30"
          >
            <Headphones className="h-3.5 w-3.5" />
            <span>Spotifyで聴く</span>
            <ExternalLink className="h-3 w-3 opacity-75" />
          </a>

          {ep.links.pocketCasts && (
            <a
              href={ep.links.pocketCasts}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-300 ring-1 ring-rose-500/35 transition hover:bg-rose-500/25"
            >
              <Headphones className="h-3.5 w-3.5" />
              <span>Pocket Casts</span>
              <ExternalLink className="h-3 w-3 opacity-75" />
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <aside
      aria-label="詳細情報ポップアップ"
      className="fixed right-0 bottom-0 z-30 flex max-h-[82vh] w-full flex-col rounded-t-3xl border-t border-slate-800 bg-slate-950/95 shadow-2xl backdrop-blur-xl sm:top-20 sm:right-4 sm:bottom-4 sm:max-h-none sm:w-[430px] sm:rounded-2xl sm:border"
    >
      {/* ヘッダーバー */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-3.5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {selection.kind === 'podcaster' && (
            <>
              <Users className="h-4 w-4 text-emerald-400" />
              <span>ポッドキャスター詳細</span>
            </>
          )}
          {selection.kind === 'podcast' && (
            <>
              <Radio className="h-4 w-4 text-indigo-400" />
              <span>ポッドキャスト番組詳細</span>
            </>
          )}
          {selection.kind === 'link' && (
            <>
              <Link2 className="h-4 w-4 text-amber-400" />
              <span>共演・関係性の詳細</span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          aria-label="ポップアップを閉じる"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* コンテンツ本体 */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* 1. ポッドキャスター詳細 */}
        {selection.kind === 'podcaster' &&
          (() => {
            const person = podcasterMap.get(selection.id);
            if (!person) return null;

            const mainPodcasts = podcasts.filter((p) => p.hostIds.includes(person.id));
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
                {/* プロフィール概要 */}
                <div className="flex items-start gap-4">
                  {renderAvatar(person, 'h-16 w-16 text-lg')}
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold text-white">{person.name}</h2>
                    {person.bio && (
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                        {person.bio}
                      </p>
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

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <a
                                href={show.links.spotify}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1DB954]/20 px-2.5 py-1 text-xs font-semibold text-[#1ed760] ring-1 ring-[#1DB954]/40 hover:bg-[#1DB954]/30"
                              >
                                <span>Spotify</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              {show.links.pocketCasts && (
                                <a
                                  href={show.links.pocketCasts}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-300 ring-1 ring-rose-500/35 hover:bg-rose-500/25"
                                >
                                  <span>Pocket Casts</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* ゲストとして出演したポッドキャストのエピソード一覧 */}
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                    <Sparkles className="h-4 w-4" />
                    <span>ゲストとして出演したエピソード一覧 ({guestEpisodes.length})</span>
                  </h3>
                  {guestEpisodes.length === 0 ? (
                    <p className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 text-xs text-slate-400">
                      他番組へのゲスト出演エピソードはまだ登録されていません
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {guestEpisodes.map((ep) => renderEpisodeCard(ep, person.id))}
                    </div>
                  )}
                </section>

                {/* ホストとしてゲストを迎えたエピソード一覧（補足表示） */}
                {hostedGuestEpisodes.length > 0 && (
                  <section>
                    <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                      <Headphones className="h-4 w-4" />
                      <span>メイン番組にゲストを迎えた回 ({hostedGuestEpisodes.length})</span>
                    </h3>
                    <div className="space-y-3">
                      {hostedGuestEpisodes.map((ep) => renderEpisodeCard(ep, person.id))}
                    </div>
                  </section>
                )}
              </>
            );
          })()}

        {/* 2. ポッドキャスト（番組）詳細 */}
        {selection.kind === 'podcast' &&
          (() => {
            const show = podcastMap.get(selection.id);
            if (!show) return null;

            const hosts = show.hostIds
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
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                        {show.description}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <a
                        href={show.links.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#1DB954]/20 px-3 py-1.5 text-xs font-semibold text-[#1ed760] ring-1 ring-[#1DB954]/40 hover:bg-[#1DB954]/30"
                      >
                        <span>Spotifyで番組を開く</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      {show.links.pocketCasts && (
                        <a
                          href={show.links.pocketCasts}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-300 ring-1 ring-rose-500/35 hover:bg-rose-500/25"
                        >
                          <span>Pocket Casts</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
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
                        {renderAvatar(h, 'h-10 w-10 text-xs')}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-white">{h.name}</div>
                          {h.bio && (
                            <div className="truncate text-xs text-slate-400">{h.bio}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

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
                      {showGuestEpisodes.map((ep) => renderEpisodeCard(ep))}
                    </div>
                  )}
                </section>
              </>
            );
          })()}

        {/* 3. エッジ（線）クリック時の共演詳細 */}
        {selection.kind === 'link' &&
          (() => {
            const link = links.find((l) => l.id === selection.linkId);
            if (!link) return null;

            const sourceId =
              typeof link.source === 'object' ? (link.source as any).id : link.source;
            const targetId =
              typeof link.target === 'object' ? (link.target as any).id : link.target;

            const coEpisodes = link.guestEpisodeIds
              .map((id) => episodeMap.get(id))
              .filter((e): e is GuestEpisode => Boolean(e))
              .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

            if (selection.mode === 'podcaster') {
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
                        {renderAvatar(personA, 'h-12 w-12 text-sm')}
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
                        {renderAvatar(personB, 'h-12 w-12 text-sm')}
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
                        {coEpisodes.map((ep) => renderEpisodeCard(ep))}
                      </div>
                    )}
                  </section>
                </>
              );
            } else {
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
                        <span className="text-center text-xs font-bold text-white">
                          {showA.title}
                        </span>
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
                        <span className="text-center text-xs font-bold text-white">
                          {showB.title}
                        </span>
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
                            {renderAvatar(h, 'h-9 w-9 text-xs')}
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
                        {coEpisodes.map((ep) => renderEpisodeCard(ep))}
                      </div>
                    )}
                  </section>
                </>
              );
            }
          })()}
      </div>
    </aside>
  );
};
