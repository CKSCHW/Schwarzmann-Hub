
import { NextResponse } from 'next/server';
import { allNewsArticles } from '@/lib/mockData';

export async function GET() {
  return NextResponse.json(allNewsArticles);
}
