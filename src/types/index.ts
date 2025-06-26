
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
  "Projektleiter",
  "Schulungsleiter",
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
  filePath: string; // path in local filesystem
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

export interface ScheduleDownloadReceipt {
  id: string; // e.g., userId_scheduleId_timestamp
  userId: string;
  scheduleId: string;
  scheduleName: string; // For easy display
  downloadedAt: string; // ISO string
}

export interface ScheduleDownloadReceiptWithUser extends ScheduleDownloadReceipt {
    user?: SimpleUser;
}


// --- Push Notification & System Types ---

export interface PushNotificationPayload {
    title: string;
    body: string;
    icon?: string;
    url?: string;
    notificationId?: string;
}

// This represents the plain object version of a PushSubscription, suitable for JSON serialization
export interface StoredPushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId: string;
}

export interface Notification {
  id: string;
  title:string;
  body: string;
  url: string;
  icon?: string;
  createdAt: string; // ISO string
}

export interface NotificationReceipt {
  id: string; // compound key userId_notificationId
  userId: string;
  notificationId: string;
  readAt?: string; // ISO string
  clickedAt?: string; // ISO string
  isDeleted?: boolean;
}

export interface NotificationWithStatus extends Notification {
  isRead: boolean;
  isClicked: boolean;
}

// --- Survey Types ---

export const questionTypes = ["rating", "text"] as const;
export type QuestionType = (typeof questionTypes)[number];

export interface SurveyQuestion {
  id: string;
  text: string;
  type: QuestionType;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  createdBy: string;
  creatorEmail: string;
  createdAt: string; // ISO
  assignedUserIds: string[];
  completionCount: number;
}

export interface SurveyCompletion {
    id: string; // `${userId}_${surveyId}`
    userId: string;
    surveyId: string;
    completedAt: string; // ISO
}

export interface SurveyResponse {
    id: string;
    surveyId: string;
    submittedAt: string; // ISO
    answers: {
        questionId: string;
        value: string | number;
    }[];
}

export interface SurveyResult {
    survey: Survey;
    responses: SurveyResponse[];
}

export interface SurveyWithCompletion extends Survey {
    completed: boolean;
}
