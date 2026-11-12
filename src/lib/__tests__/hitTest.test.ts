import { describe, it, expect } from 'vitest';
import { hitTestGraph, getNodeRadius } from '../hitTest';
import type { GraphLink, GraphNode } from '../../types/schema';

describe('hitTestGraph', () => {
  const mockMeasure = (text: string) => text.length * 10;

  const nodes: GraphNode[] = [
    {
      id: 'ryu-fukada',
      type: 'podcaster',
      label: '深井 龍之介',
      subtitle: 'COTEN RADIO',
      fallbackText: '深井',
      degree: 5,
      x: 70,
      y: 130,
    },
    {
      id: 'makiko-shinoda',
      type: 'podcaster',
      label: '篠田 真貴子',
      subtitle: '',
      fallbackText: '篠田',
      degree: 3,
      x: -380,
      y: 110,
    },
  ];

  const links: GraphLink[] = [
    {
      id: 'makiko-shinoda__ryu-fukada',
      source: 'makiko-shinoda',
      target: 'ryu-fukada',
      relationType: 'guest',
      weight: 2,
      regularPodcastIds: [],
      sharedHostIds: [],
      guestEpisodeIds: ['ep-1', 'ep-2'],
    },
  ];

  it('hits node circle for every node regardless of index', () => {
    const hit1 = hitTestGraph(70, 130, 1, nodes, links, mockMeasure);
    expect(hit1?.kind).toBe('node');
    if (hit1?.kind === 'node') expect(hit1.node.id).toBe('ryu-fukada');

    const hit2 = hitTestGraph(-380, 110, 1, nodes, links, mockMeasure);
    expect(hit2?.kind).toBe('node');
    if (hit2?.kind === 'node') expect(hit2.node.id).toBe('makiko-shinoda');
  });

  it('hits node text label area below the node circle', () => {
    const r = getNodeRadius(nodes[1]);
    const labelY = 110 + r + 12 * 0.85 + 2;
    const hitLabel = hitTestGraph(-380 - 20, labelY, 1, nodes, links, mockMeasure);
    expect(hitLabel?.kind).toBe('node');
    if (hitLabel?.kind === 'node') expect(hitLabel.node.id).toBe('makiko-shinoda');
  });

  it('hits co-starring link badge and segment, and returns null on empty background', () => {
    const mx = (70 + -380) / 2;
    const my = (130 + 110) / 2;
    const hitBadge = hitTestGraph(mx, my, 1, nodes, links, mockMeasure);
    expect(hitBadge?.kind).toBe('link');

    const hitBg = hitTestGraph(-1000, -1000, 1, nodes, links, mockMeasure);
    expect(hitBg).toBeNull();
  });
});
