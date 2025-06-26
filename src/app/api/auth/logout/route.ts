
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const options = {
    name: '__session',
    value: '',
    maxAge: -1,
  };

  cookies().set(options);
  return NextResponse.json({ status: 'success' }, { status: 200 });
}
