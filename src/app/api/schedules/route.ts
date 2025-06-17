
import { NextResponse } from 'next/server';
import { mockSchedules } from '@/lib/mockData';

export async function GET() {
  return NextResponse.json(mockSchedules);
}
