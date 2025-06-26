
import { NextResponse } from 'next/server';
import { getSchedules } from '@/actions/scheduleActions';

export async function GET() {
  try {
    const schedules = await getSchedules();
    return NextResponse.json(schedules);
  } catch (error) {
    console.error("API Error fetching schedules:", error);
    return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
  }
}
