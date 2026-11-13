import React from 'react';
import { Calendar, Radio } from 'lucide-react';
import type { GuestEpisode, Podcast, Podcaster } from '../../types/schema';
import { ShowLinks } from './ShowLinks';

interface EpisodeCardProps {
  episode: GuestEpisode;
  podcastMap: Map<string, Podcast>;
  podcasterMap: Map<string, Podcaster>;
  currentPodcasterId?: string;
  onSelectPodcaster: (id: string) => void;
  onSelectPodcast: (id: string) => void;
}

export const EpisodeCard: React.FC<EpisodeCardProps> = ({
  episode,
  podcastMap,
  podcasterMap,
  currentPodcasterId,
  onSelectPodcaster,
  onSelectPodcast,
}) => {
  const show = podcastMap.get(episode.podcastId);
  const activeHostIds = episode.hostIdsOverride ?? show?.hostIds ?? [];
  const hosts = activeHostIds
    .map((id) => podcasterMap.get(id))
    .filter((p): p is Podcaster => Boolean(p));
  const guests = episode.guestIds
    .map((id) => podcasterMap.get(id))
    .filter((p): p is Podcaster => Boolean(p));

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 transition hover:border-slate-700">
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
          {episode.publishedAt}
        </span>
      </div>

      <h4 className="mb-2.5 text-sm font-semibold leading-snug text-slate-100">
        {episode.title}
      </h4>

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

      <ShowLinks
        spotifyUrl={episode.links.spotify}
        pocketCastsUrl={episode.links.pocketCasts}
        spotifyLabel="Spotifyで聴く"
        showHeadphonesIcon
      />
    </div>
  );
};
