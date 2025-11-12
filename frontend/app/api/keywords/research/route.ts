// frontend/app/api/keywords/research/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateKeywordSuggestions } from '@/lib/mock-data/generators';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { seed, mode = 'suggestions' } = body;

    if (!seed) {
      return NextResponse.json({ error: 'Seed keyword is required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '200', 10);

    // Simulate network latency and processing time
    await delay(randomInt(100, 400));

    const data = generateKeywordSuggestions(seed, mode, count);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
