import { NextRequest, NextResponse } from 'next/server';
import { generateContentAnalysis } from '@/lib/mock-data/generators';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export async function GET(
    request: NextRequest,
    { params }: { params: { projectId: string } }
) {
    const { searchParams } = new URL(request.url);
    const urlToAnalyze = searchParams.get('url');

    if (!urlToAnalyze) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Simulate a longer processing time for analysis
    await delay(randomInt(500, 1500));

    const data = generateContentAnalysis(urlToAnalyze);

    return NextResponse.json(data);
}
