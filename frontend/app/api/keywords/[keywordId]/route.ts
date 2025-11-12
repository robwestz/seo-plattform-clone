import { NextRequest, NextResponse } from 'next/server';
import { generateKeywordDetail } from '@/lib/mock-data/keyword-detail-generator';

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
    await delay(randomInt(100, 300));

    const data = generateKeywordDetail(keywordId);

    return NextResponse.json(data);
}
