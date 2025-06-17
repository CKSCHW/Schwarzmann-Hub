
import type { NewsArticle, ScheduleFile } from "@/types";

export const mockFeaturedNews: NewsArticle = {
  id: "1",
  title: "Company Announces Record Profits in Q4",
  snippet: "Our company has achieved outstanding financial results in the fourth quarter, marking a significant milestone...",
  content: "Detailed content about the record profits, including charts, executive quotes, and future outlook. This section would elaborate on the strategies that led to this success and what it means for employees and stakeholders. The company's commitment to innovation and customer satisfaction played a key role.",
  imageUrl: "https://placehold.co/1200x600.png",
  date: "2024-07-28",
  author: "CEO Jane Doe",
  category: "Financials",
  link: "#"
};

export const mockRecentNews: NewsArticle[] = [
  {
    id: "2",
    title: "New Employee Wellness Program Launched",
    snippet: "Introducing a comprehensive wellness program to support our employees' health and well-being.",
    imageUrl: "https://placehold.co/600x400.png",
    date: "2024-07-27",
    author: "HR Department",
    category: "Company News",
    link: "#"
  },
  {
    id: "3",
    title: "Innovation Challenge Winners Announced",
    snippet: "Celebrating the brilliant minds behind this year's successful Innovation Challenge.",
    imageUrl: "https://placehold.co/600x400.png",
    date: "2024-07-26",
    author: "Innovation Team",
    category: "Events",
    link: "#"
  },
  {
    id: "4",
    title: "Volunteer Day: Giving Back to the Community",
    snippet: "Recap of our recent company-wide volunteer day and its positive impact.",
    imageUrl: "https://placehold.co/600x400.png",
    date: "2024-07-25",
    author: "CSR Committee",
    category: "Community",
    link: "#"
  },
];

export const allNewsArticles: NewsArticle[] = [mockFeaturedNews, ...mockRecentNews];

export const mockSchedules: ScheduleFile[] = [
  {
    id: "sched1",
    name: "Wocheneinteilung KW 30.pdf",
    dateAdded: "2024-07-22",
    size: "1.2 MB",
    url: "/api/mock-pdf-download/kw30.pdf",
  },
  {
    id: "sched2",
    name: "Wocheneinteilung KW 29.pdf",
    dateAdded: "2024-07-15",
    size: "1.1 MB",
    url: "/api/mock-pdf-download/kw29.pdf",
  },
  {
    id: "sched3",
    name: "Wocheneinteilung KW 28.pdf",
    dateAdded: "2024-07-08",
    size: "1.3 MB",
    url: "/api/mock-pdf-download/kw28.pdf",
  },
];
