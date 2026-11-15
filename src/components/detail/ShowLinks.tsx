import React from 'react';

interface ShowLinksProps {
  spotifyUrl?: string;
  pocketCastsUrl?: string;
  spotifyLabel?: string;
  showHeadphonesIcon?: boolean;
  compact?: boolean;
}

const SpotifyIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm4.58 14.42a.62.62 0 0 1-.86.21c-2.35-1.44-5.31-1.76-8.8-.96a.62.62 0 0 1-.28-1.21c3.82-.87 7.1-.5 9.73 1.1.3.18.39.57.21.86zm1.22-2.72a.78.78 0 0 1-1.07.26c-2.69-1.65-6.79-2.13-9.97-1.17a.78.78 0 1 1-.45-1.49c3.63-1.1 8.15-.57 11.23 1.33.37.22.49.7.26 1.07zm.1-2.83c-3.23-1.92-8.56-2.1-11.65-1.16a.93.93 0 1 1-.54-1.79c3.54-1.07 9.43-.86 13.15 1.34a.93.93 0 0 1-.96 1.61z" />
  </svg>
);

const PocketCastsIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10v-2.8c-3.98 0-7.2-3.22-7.2-7.2S8.02 4.8 12 4.8s7.2 3.22 7.2 7.2H22c0-5.52-4.48-10-10-10z" />
    <path d="M12 7.2a4.8 4.8 0 1 0 4.8 4.8H14a2 2 0 1 1-2-2V7.2z" />
  </svg>
);

export const ShowLinks: React.FC<ShowLinksProps> = ({
  spotifyUrl,
  pocketCastsUrl,
  spotifyLabel = 'Spotify',
}) => {
  const iconClass = 'h-5 w-5';

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {spotifyUrl && (
        <a
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={spotifyLabel}
          title={spotifyLabel}
          className="inline-flex items-center justify-center text-[#1DB954] transition hover:opacity-80"
        >
          <SpotifyIcon className={iconClass} />
        </a>
      )}
      {pocketCastsUrl && (
        <a
          href={pocketCastsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Pocket Casts"
          title="Pocket Casts"
          className="inline-flex items-center justify-center text-rose-500 transition hover:opacity-80"
        >
          <PocketCastsIcon className={iconClass} />
        </a>
      )}
    </div>
  );
};
