
import { NextResponse } from 'next/server';
import { allNewsArticles } from '@/lib/mockData';
import type { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const articleId = params.id;
  const article = allNewsArticles.find(art => art.id === articleId);

  if (article) {
    return NextResponse.json(article);
  } else {
    return NextResponse.json({ message: 'Article not found' }, { status: 404 });
  }
}
