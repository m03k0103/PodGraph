import React from 'react';

interface ShowLinksProps {
  spotifyUrl?: string;
  pocketCastsUrl?: string;
  applePodcastsUrl?: string;
  xUrl?: string;
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

const ApplePodcastsIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M12 2a10 10 0 0 0-3.17 19.48c.26.08.53-.12.5-.39l-.2-1.7a.46.46 0 0 0-.29-.37A8.13 8.13 0 1 1 20.13 12a8.1 8.1 0 0 1-5.05 7.51.46.46 0 0 0-.29.37l-.2 1.7c-.03.27.24.47.5.39A10 10 0 0 0 12 2z" />
    <path d="M12 5.65A6.35 6.35 0 0 0 5.65 12c0 2.13 1.05 4.01 2.66 5.16.23.16.55.02.58-.26l.15-1.31a.45.45 0 0 0-.18-.41A4.53 4.53 0 0 1 7.47 12a4.53 4.53 0 0 1 9.06 0c0 1.3-.55 2.47-1.43 3.3a.45.45 0 0 0-.14.4l.15 1.31c.03.28.35.42.58.26A6.34 6.34 0 0 0 18.35 12 6.35 6.35 0 0 0 12 5.65z" />
    <circle cx="12" cy="10.7" r="2.05" />
    <path d="M12 13.75c-1.42 0-2.55 1.08-2.36 2.48l.63 4.63c.09.65.64 1.14 1.3 1.14h.86c.66 0 1.21-.49 1.3-1.14l.63-4.63c.19-1.4-.94-2.48-2.36-2.48z" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const ShowLinks: React.FC<ShowLinksProps> = ({
  spotifyUrl,
  pocketCastsUrl,
  applePodcastsUrl,
  xUrl,
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
      {applePodcastsUrl && (
        <a
          href={applePodcastsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Apple Podcasts"
          title="Apple Podcasts"
          className="inline-flex items-center justify-center text-[#9933CC] [data-theme='dark']_&:text-[#b150e2] transition hover:opacity-80"
        >
          <ApplePodcastsIcon className={iconClass} />
        </a>
      )}
      {xUrl && (
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="番組公式X (Twitter)"
          title="番組公式X (Twitter)"
          className="theme-text-secondary inline-flex items-center justify-center transition hover:opacity-80"
        >
          <XIcon className="h-4 w-4" />
        </a>
      )}
    </div>
  );
};
