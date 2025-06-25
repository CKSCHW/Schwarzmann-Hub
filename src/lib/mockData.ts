
import type { NewsArticle, ScheduleFile } from "@/types";

export const mockFeaturedNews: NewsArticle = {
  id: "1",
  title: "Wichtige Ankündigung: Sommerfest 2024",
  snippet: "Wir freuen uns, das diesjährige Sommerfest anzukündigen! Merken Sie sich den Termin vor für einen Tag voller Spaß, gutem Essen und toller Gesellschaft.",
  content: "Das jährliche Sommerfest von Elektro Schwarzmann findet am 15. August 2024 statt. Alle Mitarbeiter und ihre Familien sind herzlich eingeladen. Es wird Live-Musik, ein Grillbuffet und Aktivitäten für Kinder geben. Weitere Details folgen in Kürze.",
  imageUrl: "https://placehold.co/1200x600.png",
  date: "2024-07-28",
  author: "Geschäftsführung",
  category: "Events",
};

export const mockRecentNews: NewsArticle[] = [
  {
    id: "2",
    title: "Neues Schulungsprogramm für Arbeitssicherheit",
    snippet: "Einführung eines umfassenden Schulungsprogramms zur weiteren Erhöhung der Sicherheit am Arbeitsplatz.",
    imageUrl: "https://placehold.co/600x400.png",
    date: "2024-07-27",
    author: "Personalabteilung",
    category: "Unternehmen",
  },
  {
    id: "3",
    title: "Abschluss des Projekts 'Stadtwerke Neu'",
    snippet: "Wir feiern den erfolgreichen Abschluss des Großprojekts 'Stadtwerke Neu'. Ein großer Dank an alle Beteiligten.",
    imageUrl: "https://placehold.co/600x400.png",
    date: "2024-07-26",
    author: "Projektleitung",
    category: "Projekte",
  },
  {
    id: "4",
    title: "Team-Neuzugang: Willkommen im Team!",
    snippet: "Wir heißen unsere neuen Lehrlinge und Monteure herzlich willkommen bei Elektro Schwarzmann.",
    imageUrl: "https://placehold.co/600x400.png",
    date: "2024-07-25",
    author: "Personalabteilung",
    category: "Team",
  },
];

export const allNewsArticles: NewsArticle[] = [mockFeaturedNews, ...mockRecentNews];
