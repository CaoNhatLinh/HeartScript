export interface Project {
    id: string;
    title: string;
    description: string;
    type: 'html' | 'react';
    code?: string;
    isVisibleToHer?: boolean;
    previewUrl?: string;
    createdAt: number | null;
    userId: string;
}

export interface JournalEntry {
    id: string;
    text: string;
    media?: { url: string; type: 'image' | 'video' }[];
    createdAt: number | null;
    authorEmail: string;
    authorId: string;
}

export interface Memory {
    id: string;
    url: string;
    name: string;
    type: string;
    createdAt: number | null;
    userId: string;
}

export interface CalendarEvent {
    id: string;
    title: string;
    date: number | null;
    type: 'date' | 'anniversary';
}
