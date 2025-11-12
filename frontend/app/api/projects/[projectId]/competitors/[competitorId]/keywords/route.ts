import { NextRequest, NextResponse } from 'next/server';
import { generateCompetitorKeywordOverlap } from '@/lib/mock-data/generators';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export async function GET(
    request: NextRequest,
    { params }: { params: { projectId: string, competitorId: string } }
) {
    // projectId and competitorId can be used to seed the data for consistency
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '200', 10);

    await delay(randomInt(150, 500));

    const data = generateCompetitorKeywordOverlap(count);

    return NextResponse.json(data);
}
