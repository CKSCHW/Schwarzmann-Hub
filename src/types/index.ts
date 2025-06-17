
export interface NewsArticle {
  id: string;
  title: string;
  snippet: string;
  content?: string; // Optional full content
  imageUrl: string;
  date: string;
  author?: string;
  category?: string;
  link?: string; // Optional link to original article
}

export interface ScheduleFile {
  id:string;
  name: string;
  dateAdded: string;
  url: string; // URL to the PDF file
  size?: string; // Optional file size
}
