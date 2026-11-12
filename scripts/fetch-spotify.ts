import fs from 'node:fs/promises';
import path from 'node:path';
import { extractGuestCandidatesFromEpisodes, type RawSpotifyEpisode } from '../src/lib/guestExtractor';
import type { CandidateEpisode, Podcast, Podcaster } from '../src/types/schema';

const DATA_DIR = path.resolve(process.cwd(), 'src/data');
const PODCASTERS_PATH = path.join(DATA_DIR, 'podcasters.json');
const PODCASTS_PATH = path.join(DATA_DIR, 'podcasts.json');
const CANDIDATES_PATH = path.join(DATA_DIR, 'candidates.json');

async function getSpotifyAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    throw new Error(`Spotify認証エラー: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function fetchShowEpisodes(
  showId: string,
  accessToken: string,
  market = 'JP'
): Promise<RawSpotifyEpisode[]> {
  const allEpisodes: RawSpotifyEpisode[] = [];
  let url: string | null =
    `https://api.spotify.com/v1/shows/${encodeURIComponent(showId)}/episodes?market=${market}&limit=50`;

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new Error(`Spotify Show Episodes取得エラー (${showId}): ${res.status}`);
    }
    const page = (await res.json()) as {
      items: RawSpotifyEpisode[];
      next: string | null;
    };
    allEpisodes.push(...page.items.filter(Boolean));
    url = page.next;
  }

  return allEpisodes;
}

async function main() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  const podcasters = JSON.parse(await fs.readFile(PODCASTERS_PATH, 'utf-8')) as Podcaster[];
  const podcasts = JSON.parse(await fs.readFile(PODCASTS_PATH, 'utf-8')) as Podcast[];

  if (!clientId || !clientSecret) {
    console.log('------------------------------------------------------------');
    console.log('ℹ️ SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET が未設定です。');
    console.log('Spotify APIから本番取得する場合は環境変数を設定して再実行してください。');
    console.log('現在は登録済みデータ構造の検証・デモ抽出を実行します。');
    console.log('------------------------------------------------------------');
    console.log(`登録ポッドキャスター数: ${podcasters.length}名 / 登録番組数: ${podcasts.length}番組`);
    return;
  }

  const token = await getSpotifyAccessToken(clientId, clientSecret);
  const allCandidates: CandidateEpisode[] = [];

  for (const podcast of podcasts) {
    if (!podcast.spotifyShowId || podcast.spotifyShowId.startsWith('0example')) {
      continue;
    }
    console.log(`📥 取得中: ${podcast.title} (${podcast.spotifyShowId})...`);
    const rawEpisodes = await fetchShowEpisodes(podcast.spotifyShowId, token);
    const extracted = extractGuestCandidatesFromEpisodes(podcast, rawEpisodes, podcasters);
    console.log(`  -> 全${rawEpisodes.length}回中、ゲスト候補 ${extracted.length}回を検出`);
    allCandidates.push(...extracted);
  }

  await fs.writeFile(CANDIDATES_PATH, JSON.stringify(allCandidates, null, 2) + '\n', 'utf-8');
  console.log(`✅ ゲスト候補一覧を ${CANDIDATES_PATH} に保存しました（計 ${allCandidates.length} 件）。`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
