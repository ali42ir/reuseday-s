import React, { useState } from 'react';
import type { KindWallPost } from '../types.ts';
import KindWallReplyModal from './KindWallReplyModal.tsx';

interface KindwallGridProps {
    posts: KindWallPost[];
    onPostClick: (post: KindWallPost) => void;
}

const KindwallGrid: React.FC<KindwallGridProps> = ({ posts, onPostClick }) => {
    const placeholder = (
        <div className="w-full aspect-square object-cover rounded-md bg-gray-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
            </svg>
        </div>
    );

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {posts.map(it => (
                <article key={it.id} className="rounded-lg border p-1 cursor-pointer hover:shadow-md transition-shadow" onClick={() => onPostClick(it)}>
                    {it.imageUrl ? (
                        <img src={it.imageUrl} alt={it.title}
                            className="w-full aspect-square object-cover rounded-md" />
                    ) : placeholder}
                    <div className="mt-1 text-xs text-center line-clamp-1">{it.title}</div>
                </article>
            ))}
        </div>
    );
}

export default KindwallGrid;
