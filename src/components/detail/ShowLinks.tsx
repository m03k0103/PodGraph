import React from 'react';
import { ExternalLink, Headphones } from 'lucide-react';

interface ShowLinksProps {
  spotifyUrl: string;
  pocketCastsUrl?: string;
  spotifyLabel?: string;
  showHeadphonesIcon?: boolean;
  compact?: boolean;
}

export const ShowLinks: React.FC<ShowLinksProps> = ({
  spotifyUrl,
  pocketCastsUrl,
  spotifyLabel = 'Spotify',
  showHeadphonesIcon = false,
  compact = false,
}) => {
  const paddingClass = compact ? 'px-2.5 py-1' : 'px-3 py-1.5';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={spotifyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 rounded-lg bg-[#1DB954]/20 ${paddingClass} text-xs font-semibold text-[#1ed760] ring-1 ring-[#1DB954]/40 transition hover:bg-[#1DB954]/30`}
      >
        {showHeadphonesIcon && <Headphones className="h-3.5 w-3.5" />}
        <span>{spotifyLabel}</span>
        <ExternalLink className="h-3 w-3 opacity-75" />
      </a>
      {pocketCastsUrl && (
        <a
          href={pocketCastsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 ${paddingClass} text-xs font-semibold text-rose-300 ring-1 ring-rose-500/35 transition hover:bg-rose-500/25`}
        >
          {showHeadphonesIcon && <Headphones className="h-3.5 w-3.5" />}
          <span>Pocket Casts</span>
          <ExternalLink className="h-3 w-3 opacity-75" />
        </a>
      )}
    </div>
  );
};
