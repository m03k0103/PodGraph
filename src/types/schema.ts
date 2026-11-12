export type GraphMode = 'podcaster' | 'podcast';

export interface Podcaster {
  id: string;
  name: string;
  aliases?: string[];
  avatarUrl?: string;
  bio?: string;
  links?: {
    x?: string;
  };
}

export interface Podcast {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  hostIds: string[];
  formerHostIds?: string[];
  links: {
    spotify: string;
    pocketCasts?: string;
  };
  spotifyShowId?: string;
}

export interface GuestEpisode {
  id: string;
  podcastId: string;
  title: string;
  publishedAt: string;
  guestIds: string[];
  hostIdsOverride?: string[];
  links: {
    spotify: string;
    pocketCasts?: string;
  };
}

export interface CandidateEpisode extends GuestEpisode {
  descriptionSnippet?: string;
  matchedKeywords: string[];
  approved: boolean;
}

export interface GraphNode {
  id: string;
  type: GraphMode;
  label: string;
  subtitle?: string;
  imageUrl?: string;
  fallbackText: string;
  degree: number;
  isFormerHostOnly?: boolean;
  x?: number;
  y?: number;
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  relationType: 'regular' | 'guest';
  weight: number;
  regularPodcastIds: string[];
  sharedHostIds: string[];
  guestEpisodeIds: string[];
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export type PopupSelection =
  | { kind: 'podcaster'; id: string }
  | { kind: 'podcast'; id: string }
  | { kind: 'link'; linkId: string; mode: GraphMode };
