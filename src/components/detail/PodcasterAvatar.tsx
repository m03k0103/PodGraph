import React from 'react';
import type { Podcaster } from '../../types/schema';
import { getAvatarColor } from '../../lib/graphBuilder';
import { splitPodcasterNameLines } from '../../lib/graphRenderer';

interface PodcasterAvatarProps {
  person?: Podcaster;
  sizeClass?: string;
  isFormer?: boolean;
}

function estimateUnits(line: string): number {
  let units = 0;
  for (const ch of line) {
    units += ch.charCodeAt(0) <= 0x7f ? 0.62 : 1;
  }
  return Math.max(units, 1);
}

export const PodcasterAvatar: React.FC<PodcasterAvatarProps> = ({
  person,
  sizeClass = 'h-12 w-12 text-sm',
  isFormer = false,
}) => {
  if (!person) {
    return (
      <div
        className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-slate-400`}
      >
        ?
      </div>
    );
  }

  const colors = getAvatarColor(person.name, isFormer);
  const lines = splitPodcasterNameLines(person.name);
  const maxUnits = Math.max(...lines.map(estimateUnits));
  const availableWidth = lines.length === 1 ? 78 : 74;
  const maxByHeight = lines.length === 1 ? 26 : 21;
  const fontSize = Math.max(9.5, Math.min(maxByHeight, availableWidth / maxUnits));
  const lineHeight = fontSize * 1.2;

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden rounded-full shadow-md`}
      style={{
        backgroundColor: colors.bg,
        border: `2px solid ${colors.ring}`,
      }}
      aria-label={person.name}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
        {lines.length === 1 ? (
          <text
            x="50"
            y="50"
            fill={colors.text}
            fontSize={fontSize}
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {lines[0]}
          </text>
        ) : (
          <>
            <text
              x="50"
              y={50 - lineHeight / 2}
              fill={colors.text}
              fontSize={fontSize}
              fontWeight="700"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {lines[0]}
            </text>
            <text
              x="50"
              y={50 + lineHeight / 2}
              fill={colors.text}
              fontSize={fontSize}
              fontWeight="700"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {lines[1]}
            </text>
          </>
        )}
      </svg>
    </div>
  );
};
