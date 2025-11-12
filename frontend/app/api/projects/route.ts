import { NextRequest, NextResponse } from 'next/server';
import { generateProjects } from '@/lib/mock-data/generators';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '7', 10);

    await delay(randomInt(50, 200));

    const data = generateProjects(count);

    return NextResponse.json(data);
}
