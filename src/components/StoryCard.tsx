// import React from 'react';

interface StoryCardProps {
  title: string;
  subtitle: string;
  type: string;
  duration: string;
}

export function StoryCard({ title, subtitle, type, duration }: StoryCardProps) {
  return (
    <div className="bg-zinc-800/50 rounded-xl p-4 min-w-[200px]">
      <h4 className="font-semibold">{title}</h4>
      <p className="text-zinc-400 text-sm">{subtitle}</p>
      <div className="flex items-center gap-2 mt-4">
        <span className="bg-zinc-700 rounded-full px-2 py-0.5 text-xs">{type}</span>
        <span className="text-zinc-400 text-xs">{duration}</span>
      </div>
    </div>
  );
}