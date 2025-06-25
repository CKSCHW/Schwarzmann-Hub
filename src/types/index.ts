
import type { UserRecord } from "firebase-admin/auth";

export interface NewsArticle {
  id: string;
  title: string;
  snippet: string;
  content?: string; // Optional full content
  imageUrl: string;
  date: string; // Stored as ISO string
  author?: string;
  category?: string;
}

export interface ScheduleFile {
  id:string;
  name: string;
  dateAdded: string;
  url: string; // URL to the PDF file
  size?: string; // Optional file size
}

export interface ReadReceipt {
    id: string;
    userId: string;
    articleId: string;
    readAt: string; // Stored as ISO string
}

export interface ReadReceiptWithUser extends ReadReceipt {
    user?: UserRecord;
}
