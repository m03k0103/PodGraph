import { describe, expect, it } from 'vitest';
import { extractGuestCandidatesFromEpisodes } from '../guestExtractor';
import type { Podcast, Podcaster } from '../../types/schema';

const podcasters: Podcaster[] = [
  { id: 'shibata', name: '柴田 聡', aliases: ['シバタ'] },
  { id: 'yanagi', name: '柳瀬 凛', aliases: ['Rin Yanase'] },
];

const podcast: Podcast = {
  id: 'chronicle-fm',
  title: 'クロニクルFM',
  imageUrl: 'https://example.com/img.png',
  hostIds: ['shibata'],
  links: { spotify: 'https://open.spotify.com/show/1' },
};

describe('guestExtractor', () => {
  it('detects registered non-host podcasters by name or alias and ignores the show host', () => {
    const rawEpisodes = [
      {
        id: 'ep-normal',
        name: '#1 通常回（柴田聡が語る歴史）',
        description: 'パーソナリティ：柴田 聡',
        release_date: '2026-01-01',
      },
      {
        id: 'ep-guest-known',
        name: '#2 テクノロジースペシャル（ゲスト：柳瀬 凛さん）',
        description: '今回はRin Yanaseさんをお迎えしました。',
        release_date: '2026-01-08',
      },
      {
        id: 'ep-guest-unknown',
        name: '#3 特別ゲスト回：未知のポッドキャスター登場',
        description: 'スペシャルゲストをお迎えしてトークします。',
        release_date: '2026-01-15',
      },
    ];

    const candidates = extractGuestCandidatesFromEpisodes(podcast, rawEpisodes, podcasters);

    // ep-normal should not be extracted because 柴田聡 is the host of this show
    expect(candidates.find((c) => c.id === 'ep-normal')).toBeUndefined();

    // ep-guest-known matches 'yanagi' and is auto-marked approved: true
    const known = candidates.find((c) => c.id === 'ep-guest-known');
    expect(known).toBeDefined();
    expect(known?.guestIds).toEqual(['yanagi']);
    expect(known?.approved).toBe(true);

    // ep-guest-unknown matches keyword 'ゲスト' with empty guestIds and approved: false
    const unknown = candidates.find((c) => c.id === 'ep-guest-unknown');
    expect(unknown).toBeDefined();
    expect(unknown?.guestIds).toEqual([]);
    expect(unknown?.approved).toBe(false);
  });
});
