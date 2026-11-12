import { describe, expect, it } from 'vitest';
import {
  buildPodcastGraph,
  buildPodcasterGraph,
  getHostedPodcasters,
  resolvePodcasterAvatar,
} from '../graphBuilder';
import type { GuestEpisode, Podcast, Podcaster } from '../../types/schema';

const samplePodcasters: Podcaster[] = [
  { id: 'alice', name: 'Alice', avatarUrl: 'https://example.com/alice.png' },
  { id: 'bob', name: 'Bob' }, // avatar未設定 -> メイン番組の画像にフォールバック
  { id: 'carol', name: 'Carol', avatarUrl: 'https://example.com/carol.png' },
];

const samplePodcasts: Podcast[] = [
  {
    id: 'show-ab',
    title: 'Show AB',
    imageUrl: 'https://example.com/show-ab.png',
    hostIds: ['alice', 'bob'],
    links: { spotify: 'https://open.spotify.com/show/ab' },
  },
  {
    id: 'show-bc',
    title: 'Show BC',
    imageUrl: 'https://example.com/show-bc.png',
    hostIds: ['bob', 'carol'],
    links: { spotify: 'https://open.spotify.com/show/bc' },
  },
];

const sampleEpisodes: GuestEpisode[] = [
  {
    id: 'ep-1',
    podcastId: 'show-ab',
    title: '#1 Guest Carol',
    publishedAt: '2026-05-01',
    guestIds: ['carol'],
    links: { spotify: 'https://open.spotify.com/episode/ep1' },
  },
  {
    id: 'ep-2',
    podcastId: 'show-ab',
    title: '#2 Guest Carol Again (Bob absent)',
    publishedAt: '2026-06-01',
    guestIds: ['carol'],
    hostIdsOverride: ['alice'],
    links: { spotify: 'https://open.spotify.com/episode/ep2' },
  },
];

describe('graphBuilder', () => {
  it('returns undefined for podcaster avatar to consistently use generated initial avatars', () => {
    expect(resolvePodcasterAvatar(samplePodcasters[0], samplePodcasts)).toBeUndefined();
    expect(resolvePodcasterAvatar(samplePodcasters[1], samplePodcasts)).toBeUndefined();
  });

  it('builds podcaster graph with regular and guest edges, respecting hostIdsOverride', () => {
    const graph = buildPodcasterGraph(samplePodcasters, samplePodcasts, sampleEpisodes);
    expect(graph.nodes).toHaveLength(3);

    // Alice & Bob are regular co-hosts on show-ab
    const abLink = graph.links.find((l) => l.id === 'alice__bob');
    expect(abLink).toBeDefined();
    expect(abLink?.relationType).toBe('regular');
    expect(abLink?.regularPodcastIds).toEqual(['show-ab']);

    // Alice & Carol co-starred in ep-1 and ep-2 (2 guest episodes)
    const acLink = graph.links.find((l) => l.id === 'alice__carol');
    expect(acLink).toBeDefined();
    expect(acLink?.relationType).toBe('guest');
    expect(acLink?.guestEpisodeIds).toEqual(['ep-1', 'ep-2']);
    expect(acLink?.weight).toBe(2);

    // Bob & Carol are regular co-hosts on show-bc, AND co-starred in ep-1 (but Bob was absent in ep-2)
    const bcLink = graph.links.find((l) => l.id === 'bob__carol');
    expect(bcLink).toBeDefined();
    expect(bcLink?.relationType).toBe('regular');
    expect(bcLink?.regularPodcastIds).toEqual(['show-bc']);
    expect(bcLink?.guestEpisodeIds).toEqual(['ep-1']);
  });

  it('builds podcast graph connecting shows with shared hosts and guest appearances', () => {
    const graph = buildPodcastGraph(samplePodcasters, samplePodcasts, sampleEpisodes);
    expect(graph.nodes).toHaveLength(2);
    expect(graph.links).toHaveLength(1);

    const showLink = graph.links[0];
    expect(showLink.sharedHostIds).toEqual(['bob']);
    expect(showLink.guestEpisodeIds).toEqual(['ep-1', 'ep-2']);
    expect(showLink.relationType).toBe('regular');
  });

  it('excludes guest-only podcasters who do not host any main podcast from display graph', () => {
    const podcastersWithGuestOnly: Podcaster[] = [
      ...samplePodcasters,
      { id: 'guest-only', name: 'Guest Only' },
    ];
    const episodesWithGuestOnly: GuestEpisode[] = [
      ...sampleEpisodes,
      {
        id: 'ep-3',
        podcastId: 'show-ab',
        title: '#3 Guest Only Episode',
        publishedAt: '2026-07-01',
        guestIds: ['guest-only'],
        links: { spotify: 'https://open.spotify.com/episode/ep3' },
      },
    ];

    const hosted = getHostedPodcasters(podcastersWithGuestOnly, samplePodcasts);
    expect(hosted.map((p) => p.id)).toEqual(['alice', 'bob', 'carol']);

    const graph = buildPodcasterGraph(
      podcastersWithGuestOnly,
      samplePodcasts,
      episodesWithGuestOnly
    );
    expect(graph.nodes.map((n) => n.id)).toEqual(['alice', 'bob', 'carol']);
    expect(
      graph.links.some(
        (l) => l.source === 'guest-only' || l.target === 'guest-only'
      )
    ).toBe(false);
  });
});
