import type { Podcast, Podcaster } from '../types/schema';

export interface SearchResults {
  matchedPodcasters: Podcaster[];
  matchedPodcasts: Podcast[];
}

/**
 * 検索クエリ（大文字・小文字区別なし、部分一致）に一致するポッドキャスターと番組を返す。
 */
export function searchEntities(
  query: string,
  podcasters: Podcaster[],
  podcasts: Podcast[]
): SearchResults {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return { matchedPodcasters: [], matchedPodcasts: [] };
  }

  const matchedPodcasters = podcasters.filter((p) => {
    const target = [p.name, ...(p.aliases ?? []), p.bio ?? ''].join(' ').toLowerCase();
    return target.includes(trimmed);
  });

  const matchedPodcasts = podcasts.filter((p) => {
    const target = [p.title, p.description ?? ''].join(' ').toLowerCase();
    return target.includes(trimmed);
  });

  return { matchedPodcasters, matchedPodcasts };
}
