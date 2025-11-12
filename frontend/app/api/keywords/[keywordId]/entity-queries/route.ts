import { NextRequest, NextResponse } from 'next/server';
import { generateEntities } from '@/lib/mock-data/entity-generator';

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
    await delay(randomInt(300, 700));

    const keyword = keywordId.replace(/-/g, ' ');
    const data = generateEntities(keyword);

    return NextResponse.json(data);
}
