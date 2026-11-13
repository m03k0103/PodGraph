import React, { useMemo } from 'react';
import { Link2, Radio, Users, X } from 'lucide-react';
import type {
  GraphLink,
  GuestEpisode,
  Podcast,
  Podcaster,
  PopupSelection,
} from '../types/schema';
import { PodcasterDetail } from './detail/PodcasterDetail';
import { PodcastDetail } from './detail/PodcastDetail';
import { LinkDetail } from './detail/LinkDetail';

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
  const podcasterMap = useMemo(
    () => new Map(podcasters.map((p) => [p.id, p])),
    [podcasters]
  );
  const podcastMap = useMemo(
    () => new Map(podcasts.map((p) => [p.id, p])),
    [podcasts]
  );
  const episodeMap = useMemo(
    () => new Map(episodes.map((e) => [e.id, e])),
    [episodes]
  );

  if (!selection) return null;

  const selectedPerson =
    selection.kind === 'podcaster' ? podcasterMap.get(selection.id) : undefined;
  const selectedShow =
    selection.kind === 'podcast' ? podcastMap.get(selection.id) : undefined;
  const selectedLink =
    selection.kind === 'link' ? links.find((l) => l.id === selection.linkId) : undefined;

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
        {selectedPerson && (
          <PodcasterDetail
            person={selectedPerson}
            podcasts={podcasts}
            episodes={episodes}
            podcasterMap={podcasterMap}
            podcastMap={podcastMap}
            onSelectPodcaster={onSelectPodcaster}
            onSelectPodcast={onSelectPodcast}
          />
        )}

        {selectedShow && (
          <PodcastDetail
            show={selectedShow}
            episodes={episodes}
            podcasterMap={podcasterMap}
            podcastMap={podcastMap}
            onSelectPodcaster={onSelectPodcaster}
            onSelectPodcast={onSelectPodcast}
          />
        )}

        {selection.kind === 'link' && selectedLink && (
          <LinkDetail
            link={selectedLink}
            mode={selection.mode}
            podcasterMap={podcasterMap}
            podcastMap={podcastMap}
            episodeMap={episodeMap}
            onSelectPodcaster={onSelectPodcaster}
            onSelectPodcast={onSelectPodcast}
          />
        )}
      </div>
    </aside>
  );
};
