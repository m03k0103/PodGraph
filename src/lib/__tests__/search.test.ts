import { describe, expect, it } from 'vitest';
import { searchEntities } from '../search';
import type { Podcast, Podcaster } from '../../types/schema';

const samplePodcasters: Podcaster[] = [
  {
    id: 'ryu-fukada',
    name: '深井 龍之介',
    aliases: ['深井さん', 'Fukai'],
    bio: '株式会社COTEN代表取締役',
  },
  {
    id: 'kensuu',
    name: 'けんすう',
    aliases: ['古川健介'],
    bio: 'アル株式会社 代表取締役',
  },
];

const samplePodcasts: Podcast[] = [
  {
    id: 'coten-radio',
    title: '歴史を面白く学ぶコテンラジオ （COTEN RADIO）',
    description: '世界史を面白く学ぶ番組',
    imageUrl: 'https://example.com/coten.png',
    hostIds: ['ryu-fukada'],
    links: { spotify: 'https://open.spotify.com/show/example' },
  },
];

describe('searchEntities', () => {
  it('空白のみのクエリでは空配列を返す', () => {
    expect(searchEntities('   ', samplePodcasters, samplePodcasts)).toEqual({
      matchedPodcasters: [],
      matchedPodcasts: [],
    });
  });

  it('名前・別名（大文字小文字無視）・番組タイトルで部分一致検索できる', () => {
    const res1 = searchEntities('fukai', samplePodcasters, samplePodcasts);
    expect(res1.matchedPodcasters.map((p) => p.id)).toEqual(['ryu-fukada']);
    expect(res1.matchedPodcasts).toHaveLength(0);

    const res2 = searchEntities('coten', samplePodcasters, samplePodcasts);
    expect(res2.matchedPodcasters.map((p) => p.id)).toEqual(['ryu-fukada']);
    expect(res2.matchedPodcasts.map((s) => s.id)).toEqual(['coten-radio']);
  });
});
