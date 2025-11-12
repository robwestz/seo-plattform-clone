// frontend/app/api/rankings/[projectId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateRankingData } from '@/lib/mock-data/generators';

// Helper function to introduce a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  // You can use params.projectId to potentially seed the random data for consistency
  // For now, we'll just generate random data each time.
  
  const { searchParams } = new URL(request.url);
  const count = parseInt(searchParams.get('count') || '150', 10);

  // Simulate network latency
  await delay(randomInt(50, 200));

  const data = generateRankingData(count);

  return NextResponse.json(data);
}

// Helper function to generate a random integer within a range
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
