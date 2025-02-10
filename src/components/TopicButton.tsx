// import React from 'react';

interface TopicButtonProps {
  label: string;
  count: number;
}

export function TopicButton({ label, count }: TopicButtonProps) {
  return (
    <button className="w-full bg-zinc-800/50 rounded-lg px-4 py-3 flex items-center justify-between hover:bg-zinc-800">
      <span>{label}</span>
      <span className="text-zinc-400">{count}</span>
    </button>
  );
}