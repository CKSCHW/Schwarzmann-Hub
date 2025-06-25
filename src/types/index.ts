
export interface NewsArticle {
  id: string;
  title: string;
  snippet: string;
  content?: string; // Optional full content
  imageUrl: string;
  date: string; // Stored as ISO string
  author?: string;
  category?: string;
  source?: string; // e.g., 'wordpress' or 'internal'
  sourceId?: string; // original post ID from source
}

export const userGroups = [
  "Verwaltung",
  "Techniker",
  "Montage",
  "Lehrlinge",
  "Geschäftsleitung",
  "C Level",
] as const;

export type UserGroup = (typeof userGroups)[number];

export interface Appointment {
  id: string;
  title: string;
  date: string; // Stored as ISO string
  description?: string;
  groups: UserGroup[];
}


export interface ScheduleFile {
  id: string;
  name: string;
  dateAdded: string; // ISO string
  url: string; // Public download URL
  size: number; // in bytes
  filePath: string; // path in firebase storage
}

export interface ReadReceipt {
    id: string;
    userId: string;
    articleId: string;
    readAt: string; // Stored as ISO string
}

// A simplified, client-safe user object that doesn't import server-only packages.
export interface SimpleUser {
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
    isAdmin?: boolean;
    groups?: UserGroup[];
}

export interface ReadReceiptWithUser extends ReadReceipt {
    user?: SimpleUser;
}
