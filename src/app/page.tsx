
import NewsCard from "@/components/NewsCard";
import type { NewsArticle } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const mockFeaturedNews: NewsArticle = {
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

const mockRecentNews: NewsArticle[] = [
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

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section aria-labelledby="featured-news-title">
        <h1 id="featured-news-title" className="text-3xl font-headline font-semibold mb-6">
          Latest Update
        </h1>
        <NewsCard article={mockFeaturedNews} isFeatured />
      </section>

      <section aria-labelledby="recent-news-title">
        <div className="flex justify-between items-center mb-6">
          <h2 id="recent-news-title" className="text-2xl font-headline font-semibold">
            More News
          </h2>
          <Button variant="outline" asChild>
            <Link href="/news">View All News</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockRecentNews.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      </section>
    </div>
  );
}
