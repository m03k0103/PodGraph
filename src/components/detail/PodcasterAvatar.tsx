import React from 'react';
import type { Podcaster } from '../../types/schema';
import { getAvatarColor, getFallbackText } from '../../lib/graphBuilder';

interface PodcasterAvatarProps {
  person?: Podcaster;
  sizeClass?: string;
  isFormer?: boolean;
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
  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full font-bold shadow-md`}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        border: `2px solid ${colors.ring}`,
      }}
    >
      {getFallbackText(person.name)}
    </div>
  );
};
