import type { CandidateEpisode, Podcast, Podcaster } from '../types/schema';

export interface RawSpotifyEpisode {
  id: string;
  name: string;
  description: string;
  release_date: string;
  external_urls?: {
    spotify?: string;
  };
}

export const GUEST_HINT_KEYWORDS = [
  'ゲスト',
  '迎えて',
  'お迎え',
  '客演',
  'コラボ',
  'guest',
  'feat.',
  'ft.',
];

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[\s　]+/g, '');
}

/**
 * エピソードのタイトル・概要欄から、登録済みポッドキャスター名（別名含む）およびゲストキーワードを検出する
 */
export function extractGuestCandidatesFromEpisodes(
  podcast: Podcast,
  rawEpisodes: RawSpotifyEpisode[],
  allPodcasters: Podcaster[]
): CandidateEpisode[] {
  const candidates: CandidateEpisode[] = [];
  const hostIdSet = new Set(podcast.hostIds);

  // その番組のメインMC以外のポッドキャスターを照合対象にする
  const potentialGuests = allPodcasters.filter((p) => !hostIdSet.has(p.id));

  for (const ep of rawEpisodes) {
    const combinedText = `${ep.name}\n${ep.description ?? ''}`;
    const normalizedCombined = normalizeText(combinedText);

    const matchedGuestIds: string[] = [];
    const matchedKeywords: string[] = [];

    for (const person of potentialGuests) {
      const searchTerms = [person.name, ...(person.aliases ?? [])].filter(
        (term) => term && term.trim().length >= 2
      );
      const hitTerm = searchTerms.find((term) =>
        normalizedCombined.includes(normalizeText(term))
      );
      if (hitTerm) {
        matchedGuestIds.push(person.id);
        matchedKeywords.push(`人物一致:${person.name}(${hitTerm})`);
      }
    }

    for (const kw of GUEST_HINT_KEYWORDS) {
      if (normalizedCombined.includes(normalizeText(kw))) {
        matchedKeywords.push(`キーワード:${kw}`);
      }
    }

    if (matchedGuestIds.length > 0 || matchedKeywords.length > 0) {
      candidates.push({
        id: ep.id,
        podcastId: podcast.id,
        title: ep.name,
        publishedAt: ep.release_date,
        guestIds: matchedGuestIds,
        links: {
          spotify: ep.external_urls?.spotify ?? `https://open.spotify.com/episode/${ep.id}`,
        },
        descriptionSnippet: (ep.description ?? '').slice(0, 140),
        matchedKeywords,
        // 登録済みポッドキャスター名が明確に一致した場合はデフォルトで承認候補 true にする
        approved: matchedGuestIds.length > 0,
      });
    }
  }

  return candidates;
}
