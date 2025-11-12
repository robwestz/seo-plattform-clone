import { NextRequest, NextResponse } from 'next/server';
import { generateSerpIntentData } from '@/lib/mock-data/serp-intent-generator';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export async function GET(
    request: NextRequest,
    { params }: { params: { keywordId: string } }
) {
    const { keywordId } = params;

    if (!keywordId) {
        return NextResponse.json({ error: 'Keyword ID is required' }, { status: 400 });
    }

    // Simulate network latency
    await delay(randomInt(200, 500));

    // The keywordId would in reality be used to fetch the keyword string
    const keyword = keywordId.replace(/-/g, ' ');
    const data = generateSerpIntentData(keyword);

    return NextResponse.json(data);
}
