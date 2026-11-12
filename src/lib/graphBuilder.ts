import type {
  GraphData,
  GraphLink,
  GraphMode,
  GraphNode,
  GuestEpisode,
  Podcast,
  Podcaster,
} from '../types/schema';

export function makePairKey(idA: string, idB: string): [string, string, string] {
  const [first, second] = idA < idB ? [idA, idB] : [idB, idA];
  return [`${first}__${second}`, first, second];
}

export function resolvePodcasterAvatar(
  _podcaster: Podcaster,
  _podcasts: Podcast[]
): string | undefined {
  // 名前から自動生成されるイニシャルアバターで統一するため、常に未定義（Canvas側でイニシャルアバター描画）を返す
  return undefined;
}

// 名前から一意で安定した綺麗な背景グラデーション/カラーを生成する（元MCのみの場合はグレー系）
export function getAvatarColor(
  name: string,
  isFormer?: boolean
): { bg: string; text: string; ring: string } {
  if (isFormer) {
    return { bg: '#334155', text: '#cbd5e1', ring: '#64748b' };
  }
  const colorPalette = [
    { bg: '#065f46', text: '#6ee7b7', ring: '#10b981' }, // emerald
    { bg: '#1e3a8a', text: '#93c5fd', ring: '#3b82f6' }, // blue
    { bg: '#581c87', text: '#d8b4fe', ring: '#a855f7' }, // purple
    { bg: '#831843', text: '#f472b6', ring: '#ec4899' }, // pink
    { bg: '#7c2d12', text: '#fdba74', ring: '#f97316' }, // orange
    { bg: '#134e4a', text: '#5eead4', ring: '#14b8a6' }, // teal
    { bg: '#312e81', text: '#c7d2fe', ring: '#6366f1' }, // indigo
    { bg: '#713f12', text: '#fde047', ring: '#eab308' }, // yellow
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % colorPalette.length;
  return colorPalette[index];
}

export function getFallbackText(name: string): string {
  const cleaned = name.replace(/\s+/g, '');
  // アルファベット表記（例: TaiTan）は先頭2文字、日本語は2文字
  return cleaned.slice(0, 2).toUpperCase() || '?';
}

export function getHostedPodcasters(
  podcasters: Podcaster[],
  podcasts: Podcast[]
): Podcaster[] {
  const hostIdSet = new Set(
    podcasts.flatMap((p) => [...p.hostIds, ...(p.formerHostIds ?? [])])
  );
  return podcasters.filter((p) => hostIdSet.has(p.id));
}

export function buildPodcasterGraph(
  podcasters: Podcaster[],
  podcasts: Podcast[],
  episodes: GuestEpisode[]
): GraphData {
  const hostedPodcasters = getHostedPodcasters(podcasters, podcasts);
  const visiblePodcasterIds = new Set(hostedPodcasters.map((p) => p.id));
  const activeHostIdSet = new Set(podcasts.flatMap((p) => p.hostIds));
  const podcastMap = new Map(podcasts.map((p) => [p.id, p]));
  const linkMap = new Map<string, GraphLink>();

  const ensureLink = (idA: string, idB: string): GraphLink | null => {
    if (idA === idB) return null;
    if (!visiblePodcasterIds.has(idA) || !visiblePodcasterIds.has(idB)) return null;
    const [key, source, target] = makePairKey(idA, idB);
    let link = linkMap.get(key);
    if (!link) {
      link = {
        id: key,
        source,
        target,
        relationType: 'guest',
        weight: 0,
        regularPodcastIds: [],
        sharedHostIds: [],
        guestEpisodeIds: [],
      };
      linkMap.set(key, link);
    }
    return link;
  };

  // 1. 同じ番組のメインMC同士（レギュラー共演、元MCも含む）
  for (const podcast of podcasts) {
    const hosts = Array.from(new Set([...podcast.hostIds, ...(podcast.formerHostIds ?? [])]));
    for (let i = 0; i < hosts.length; i++) {
      for (let j = i + 1; j < hosts.length; j++) {
        const link = ensureLink(hosts[i], hosts[j]);
        if (link && !link.regularPodcastIds.includes(podcast.id)) {
          link.regularPodcastIds.push(podcast.id);
          link.relationType = 'regular';
        }
      }
    }
  }

  // 2. ゲスト出演による共演（原則メインMC全員とゲスト、hostIdsOverride対応）
  for (const episode of episodes) {
    const podcast = podcastMap.get(episode.podcastId);
    if (!podcast) continue;

    const activeHosts = episode.hostIdsOverride ?? podcast.hostIds;
    const participants = Array.from(new Set([...activeHosts, ...episode.guestIds]));

    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        const pA = participants[i];
        const pB = participants[j];
        // 両方ともその番組のMCでありゲストではない場合はレギュラー関係なのでゲスト回としてはカウントしない
        const isBothActiveHostOnly =
          activeHosts.includes(pA) &&
          activeHosts.includes(pB) &&
          !episode.guestIds.includes(pA) &&
          !episode.guestIds.includes(pB);

        if (isBothActiveHostOnly) continue;

        const link = ensureLink(pA, pB);
        if (link && !link.guestEpisodeIds.includes(episode.id)) {
          link.guestEpisodeIds.push(episode.id);
        }
      }
    }
  }

  const links = Array.from(linkMap.values()).map((link) => ({
    ...link,
    relationType: link.regularPodcastIds.length > 0 ? ('regular' as const) : ('guest' as const),
    weight: link.regularPodcastIds.length * 2 + link.guestEpisodeIds.length,
  }));

  // ノードごとの接続数（degree）を計算
  const degreeMap = new Map<string, number>();
  for (const link of links) {
    degreeMap.set(link.source, (degreeMap.get(link.source) ?? 0) + 1);
    degreeMap.set(link.target, (degreeMap.get(link.target) ?? 0) + 1);
  }

  const nodes: GraphNode[] = hostedPodcasters.map((podcaster) => {
    const mainPodcasts = podcasts.filter((p) => p.hostIds.includes(podcaster.id));
    const formerPodcasts = podcasts.filter((p) => p.formerHostIds?.includes(podcaster.id));
    const isFormerHostOnly = !activeHostIdSet.has(podcaster.id);
    const subtitle =
      mainPodcasts.length > 0
        ? mainPodcasts.map((p) => p.title).join(' / ')
        : formerPodcasts.map((p) => `${p.title} (元MC)`).join(' / ');
    return {
      id: podcaster.id,
      type: 'podcaster',
      label: podcaster.name,
      subtitle,
      imageUrl: resolvePodcasterAvatar(podcaster, podcasts),
      fallbackText: getFallbackText(podcaster.name),
      degree: degreeMap.get(podcaster.id) ?? 0,
      isFormerHostOnly,
    };
  });

  return { nodes, links };
}

export function buildPodcastGraph(
  podcasters: Podcaster[],
  podcasts: Podcast[],
  episodes: GuestEpisode[]
): GraphData {
  const linkMap = new Map<string, GraphLink>();

  const ensureLink = (idA: string, idB: string): GraphLink | null => {
    if (idA === idB) return null;
    const [key, source, target] = makePairKey(idA, idB);
    let link = linkMap.get(key);
    if (!link) {
      link = {
        id: key,
        source,
        target,
        relationType: 'guest',
        weight: 0,
        regularPodcastIds: [],
        sharedHostIds: [],
        guestEpisodeIds: [],
      };
      linkMap.set(key, link);
    }
    return link;
  };

  // 1. 同じ人物が複数番組のメインMCを兼任している場合
  for (let i = 0; i < podcasts.length; i++) {
    for (let j = i + 1; j < podcasts.length; j++) {
      const showA = podcasts[i];
      const showB = podcasts[j];
      const sharedHosts = showA.hostIds.filter((hostId) => showB.hostIds.includes(hostId));
      if (sharedHosts.length > 0) {
        const link = ensureLink(showA.id, showB.id);
        if (link) {
          for (const hId of sharedHosts) {
            if (!link.sharedHostIds.includes(hId)) {
              link.sharedHostIds.push(hId);
            }
          }
          link.relationType = 'regular';
        }
      }
    }
  }

  // 2. 番組AのメインMCが番組Bにゲスト出演した場合
  for (const episode of episodes) {
    const targetPodcastId = episode.podcastId;
    for (const guestId of episode.guestIds) {
      const guestMainShows = podcasts.filter(
        (p) => p.id !== targetPodcastId && p.hostIds.includes(guestId)
      );
      for (const guestShow of guestMainShows) {
        const link = ensureLink(targetPodcastId, guestShow.id);
        if (link && !link.guestEpisodeIds.includes(episode.id)) {
          link.guestEpisodeIds.push(episode.id);
        }
      }
    }
  }

  const links = Array.from(linkMap.values()).map((link) => ({
    ...link,
    relationType: link.sharedHostIds.length > 0 ? ('regular' as const) : ('guest' as const),
    weight: link.sharedHostIds.length * 2 + link.guestEpisodeIds.length,
  }));

  const degreeMap = new Map<string, number>();
  for (const link of links) {
    degreeMap.set(link.source, (degreeMap.get(link.source) ?? 0) + 1);
    degreeMap.set(link.target, (degreeMap.get(link.target) ?? 0) + 1);
  }

  const podcasterMap = new Map(podcasters.map((p) => [p.id, p]));

  const nodes: GraphNode[] = podcasts.map((podcast) => {
    const hostNames = podcast.hostIds
      .map((id) => podcasterMap.get(id)?.name)
      .filter(Boolean)
      .join('・');
    return {
      id: podcast.id,
      type: 'podcast',
      label: podcast.title,
      subtitle: hostNames,
      imageUrl: podcast.imageUrl,
      fallbackText: getFallbackText(podcast.title),
      degree: degreeMap.get(podcast.id) ?? 0,
    };
  });

  return { nodes, links };
}

export function buildGraph(
  mode: GraphMode,
  podcasters: Podcaster[],
  podcasts: Podcast[],
  episodes: GuestEpisode[]
): GraphData {
  return mode === 'podcaster'
    ? buildPodcasterGraph(podcasters, podcasts, episodes)
    : buildPodcastGraph(podcasters, podcasts, episodes);
}
