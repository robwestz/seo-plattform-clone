// In-memory store for this example
import { Competitor, RankingKeyword } from "@/types/seo";
import { generateCompetitorProfiles, generateRankingData } from "@/lib/mock-data/generators";
import {NextRequest, NextResponse} from "next/server";

let competitors: Competitor[] = generateCompetitorProfiles(10);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export async function GET(
    request: NextRequest,
    { params }: { params: { projectId: string } }
) {
    await delay(randomInt(50, 150));
    return NextResponse.json(competitors);
}

export async function POST(
    request: NextRequest,
    { params }: { params: { projectId: string } }
) {
    await delay(randomInt(100, 300));
    try {
        const body = await request.json();
        const { domain } = body;

        if (!domain) {
            return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
        }

        // Check if competitor already exists
        if (competitors.some(c => c.domain === domain)) {
            return NextResponse.json({ error: 'Competitor already exists' }, { status: 409 });
        }

        // Create a new mock competitor
        const newCompetitor: Competitor = {
            id: `comp-${competitors.length + 1}`,
            domain,
            name: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
            estimatedTraffic: randomInt(5000, 500000),
            organicKeywords: randomInt(500, 50000),
            paidKeywords: randomInt(0, 5000),
            backlinks: randomInt(1000, 1000000),
            referringDomains: randomInt(100, 50000),
            domainRating: randomInt(20, 95),
            trafficTrend: randomFloat(-25, 50, 1),
            commonKeywords: randomInt(50, 5000),
            keywordGap: randomInt(100, 10000),
            contentGap: randomInt(50, 1000),
            isTracked: true,
        };

        competitors.push(newCompetitor);

        return NextResponse.json(newCompetitor, { status: 201 });

    } catch (e) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}

const randomFloat = (min: number, max: number, decimals: number): number => {
    const str = (Math.random() * (max - min) + min).toFixed(decimals);
    return parseFloat(str);
};
