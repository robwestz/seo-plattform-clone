import { NextRequest, NextResponse } from 'next/server';
import { generateBacklinks } from '@/lib/mock-data/generators';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export async function GET(
    request: NextRequest,
    { params }: { params: { projectId: string } }
) {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '250', 10);

    await delay(randomInt(100, 400));

    const data = generateBacklinks(count);

    return NextResponse.json(data);
}
