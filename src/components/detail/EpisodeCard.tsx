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
  const hasGuests = guests.length > 0;

  return (
    <div className="theme-surface-card rounded-xl border p-3.5 transition hover:border-[var(--border-color)]">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        {show && (
          <button
            type="button"
            onClick={() => onSelectPodcast(show.id)}
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-500/15 px-2 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-500/25 [data-theme='dark']_&:text-indigo-300 cursor-pointer"
          >
            <Radio className="h-3 w-3" />
            <span>{show.title}</span>
          </button>
        )}
        <span className="tabular-nums theme-text-muted inline-flex items-center gap-1 text-[11px]">
          <Calendar className="h-3 w-3" />
          {episode.publishedAt}
        </span>
      </div>

      <h4 className="theme-text-primary mb-2.5 text-sm font-semibold leading-snug">
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
                ? "bg-emerald-500/20 text-emerald-800 ring-1 ring-emerald-500/50 [data-theme='dark']_&:text-emerald-200"
                : 'bg-[var(--bg-badge)] text-[var(--text-secondary)] hover:bg-[var(--bg-glass-hover)] hover:text-[var(--text-primary)]'
            }`}
          >
            {hasGuests && (
              <span className="text-[10px] font-semibold text-emerald-600 [data-theme='dark']_&:text-emerald-400">
                Host
              </span>
            )}
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
                ? "bg-amber-500/25 text-amber-900 ring-1 ring-amber-500/50 [data-theme='dark']_&:text-amber-200"
                : "bg-amber-500/15 text-amber-800 hover:bg-amber-500/25 [data-theme='dark']_&:text-amber-300"
            }`}
          >
            <span className="text-[10px] font-semibold text-amber-600 [data-theme='dark']_&:text-amber-400">Guest</span>
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
