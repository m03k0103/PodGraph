import { describe, expect, it } from 'vitest';
import podcastersData from '../podcasters.json';
import podcastsData from '../podcasts.json';
import episodesData from '../episodes.json';
import type { GuestEpisode, Podcast, Podcaster } from '../../types/schema';

const podcasters = podcastersData as Podcaster[];
const podcasts = podcastsData as Podcast[];
const episodes = episodesData as GuestEpisode[];

describe('data integrity', () => {
  it('すべての podcaster / podcast / episode の ID が一意である', () => {
    const podcasterIds = podcasters.map((p) => p.id);
    expect(new Set(podcasterIds).size).toBe(podcasterIds.length);

    const podcastIds = podcasts.map((p) => p.id);
    expect(new Set(podcastIds).size).toBe(podcastIds.length);

    const episodeIds = episodes.map((e) => e.id);
    expect(new Set(episodeIds).size).toBe(episodeIds.length);
  });

  it('podcasts.json の hostIds / formerHostIds がすべて podcasters.json に存在する', () => {
    const podcasterIdSet = new Set(podcasters.map((p) => p.id));

    for (const show of podcasts) {
      expect(show.hostIds.length).toBeGreaterThan(0);
      for (const id of show.hostIds) {
        expect(podcasterIdSet.has(id)).toBe(true);
      }
      for (const id of show.formerHostIds ?? []) {
        expect(podcasterIdSet.has(id)).toBe(true);
      }
    }
  });

  it('episodes.json の podcastId / guestIds / hostIdsOverride がすべて参照先に存在する', () => {
    const podcasterIdSet = new Set(podcasters.map((p) => p.id));
    const podcastIdSet = new Set(podcasts.map((p) => p.id));

    for (const ep of episodes) {
      expect(podcastIdSet.has(ep.podcastId)).toBe(true);
      for (const id of ep.guestIds) {
        expect(podcasterIdSet.has(id)).toBe(true);
      }
      for (const id of ep.hostIdsOverride ?? []) {
        expect(podcasterIdSet.has(id)).toBe(true);
      }
    }
  });

  it('すべてのリンクURLが有効な https:// URL である', () => {
    for (const person of podcasters) {
      if (person.links?.x) {
        expect(person.links.x).toMatch(/^https:\/\//);
      }
    }
    for (const show of podcasts) {
      expect(show.links.spotify).toMatch(/^https:\/\//);
      if (show.links.pocketCasts) {
        expect(show.links.pocketCasts).toMatch(/^https:\/\//);
      }
    }
    for (const ep of episodes) {
      expect(ep.links.spotify).toMatch(/^https:\/\//);
      if (ep.links.pocketCasts) {
        expect(ep.links.pocketCasts).toMatch(/^https:\/\//);
      }
    }
  });
});
