import fs from 'node:fs/promises';
import path from 'node:path';
import type { CandidateEpisode, GuestEpisode } from '../src/types/schema';

const DATA_DIR = path.resolve(process.cwd(), 'src/data');
const CANDIDATES_PATH = path.join(DATA_DIR, 'candidates.json');
const EPISODES_PATH = path.join(DATA_DIR, 'episodes.json');

async function main() {
  const candidates = JSON.parse(
    await fs.readFile(CANDIDATES_PATH, 'utf-8')
  ) as CandidateEpisode[];
  const episodes = JSON.parse(await fs.readFile(EPISODES_PATH, 'utf-8')) as GuestEpisode[];

  const existingIds = new Set(episodes.map((e) => e.id));
  const approvedCandidates = candidates.filter(
    (c) => c.approved && c.guestIds.length > 0 && !existingIds.has(c.id)
  );

  if (approvedCandidates.length === 0) {
    console.log('ℹ️ 新規に追加すべき承認済み候補（approved: true かつ guestIds 指定済み）はありません。');
    return;
  }

  for (const cand of approvedCandidates) {
    episodes.push({
      id: cand.id,
      podcastId: cand.podcastId,
      title: cand.title,
      publishedAt: cand.publishedAt,
      guestIds: cand.guestIds,
      ...(cand.hostIdsOverride ? { hostIdsOverride: cand.hostIdsOverride } : {}),
      links: cand.links,
    });
  }

  await fs.writeFile(EPISODES_PATH, JSON.stringify(episodes, null, 2) + '\n', 'utf-8');

  const remaining = candidates.filter((c) => !c.approved || c.guestIds.length === 0);
  await fs.writeFile(CANDIDATES_PATH, JSON.stringify(remaining, null, 2) + '\n', 'utf-8');

  console.log(`✅ ${approvedCandidates.length} 件のゲスト出演エピソードを episodes.json に反映しました。`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
