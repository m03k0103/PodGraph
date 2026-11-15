import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import podcastersData from '../../data/podcasters.json';
import podcastsData from '../../data/podcasts.json';
import episodesData from '../../data/episodes.json';

const ROOT = resolve(process.cwd());

describe('Design.md compliance & quality gate', () => {
  it('defines Light (:root / [data-theme="light"]) and Dark ([data-theme="dark"]) CSS tokens in src/index.css', () => {
    const css = readFileSync(resolve(ROOT, 'src/index.css'), 'utf-8');
    expect(css).toContain(':root,');
    expect(css).toContain('[data-theme="light"]');
    expect(css).toContain('--bg-primary: #f8fafc');
    expect(css).toContain('[data-theme="dark"]');
    expect(css).toContain('--bg-primary: #0f172a');
    expect(css).toContain('.tabular-nums');
    expect(css).toContain('font-variant-numeric: tabular-nums');
  });

  it('formats all episode publishedAt dates as YYYY-MM-DD and supports descending sort', () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const ep of episodesData) {
      expect(ep.publishedAt).toMatch(dateRegex);
      const parsed = Date.parse(`${ep.publishedAt}T00:00:00Z`);
      expect(Number.isNaN(parsed)).toBe(false);
    }

    const sorted = [...episodesData].sort((a, b) =>
      b.publishedAt.localeCompare(a.publishedAt)
    );
    for (let i = 1; i < sorted.length; i += 1) {
      expect(sorted[i - 1].publishedAt >= sorted[i].publishedAt).toBe(true);
    }
  });

  it('contains no dummy URLs, NBSP (\\u00a0), or double-escaped HTML entities in data JSONs', () => {
    const allTexts: string[] = [];
    const collectStrings = (val: unknown) => {
      if (typeof val === 'string') {
        allTexts.push(val);
      } else if (Array.isArray(val)) {
        val.forEach(collectStrings);
      } else if (val && typeof val === 'object') {
        Object.values(val).forEach(collectStrings);
      }
    };

    collectStrings(podcastersData);
    collectStrings(podcastsData);
    collectStrings(episodesData);

    for (const text of allTexts) {
      expect(text).not.toMatch(/example\.com|placeholder|TODO/i);
      expect(text).not.toContain('\u00a0');
      expect(text).not.toMatch(/&amp;(?:amp|lt|gt|quot);/);
    }
  });

  it('fixes ShowLinks external playback link order to Spotify -> Pocket Casts', () => {
    const showLinksSource = readFileSync(
      resolve(ROOT, 'src/components/detail/ShowLinks.tsx'),
      'utf-8'
    );
    const spotifyIndex = showLinksSource.indexOf('href={spotifyUrl}');
    const pocketCastsIndex = showLinksSource.indexOf('href={pocketCastsUrl}');
    expect(spotifyIndex).toBeGreaterThan(-1);
    expect(pocketCastsIndex).toBeGreaterThan(spotifyIndex);
  });

  it('keeps information text selectable and does not put select-none on root <main>', () => {
    const appSource = readFileSync(resolve(ROOT, 'src/App.tsx'), 'utf-8');
    const popupSource = readFileSync(
      resolve(ROOT, 'src/components/DetailPopup.tsx'),
      'utf-8'
    );
    expect(appSource).not.toMatch(/<main[^>]*select-none/);
    expect(popupSource).toContain('select-text');
    expect(popupSource).not.toContain('select-none');
  });
});
