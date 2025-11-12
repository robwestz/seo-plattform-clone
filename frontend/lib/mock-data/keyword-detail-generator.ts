import { 
  KeywordDetail, 
  PositionHistoryData, 
  FeaturedSnippetData, 
  RankingPage,
  KeywordIntent,
  Trend
} from '@/types/seo';
import { generateRankingData } from './generators'; // Assuming this is where the base keyword generator is

// Re-using helpers from the main generator
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number, decimals: number): number => {
  const str = (Math.random() * (max - min) + min).toFixed(decimals);
  return parseFloat(str);
};
const sample = <T>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];

export function generatePositionHistory(days: number = 90): PositionHistoryData[] {
  const history: PositionHistoryData[] = [];
  let currentPos = randomInt(5, 50);
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Simulate position fluctuation
    currentPos += randomInt(-3, 3);
    if (currentPos < 1) currentPos = 1;
    if (currentPos > 100) currentPos = 100;
    
    const impressions = randomInt(500, 10000) / Math.log(currentPos + 1);
    const clicks = impressions * (randomFloat(0.5, 20) / currentPos / 100);

    history.push({
      date,
      position: currentPos,
      clicks: Math.round(clicks),
      impressions: Math.round(impressions),
    });
  }
  return history;
}

export function generateFeaturedSnippet(keyword: string): FeaturedSnippetData {
  const hasSnippet = Math.random() > 0.5;
  if (!hasSnippet) {
    return { hasSnippet: false, ownedByYou: false, snippetType: 'paragraph' };
  }
  return {
    hasSnippet: true,
    ownedByYou: Math.random() > 0.7,
    snippetType: sample(['paragraph', 'list', 'table', 'video']),
    content: `This is a sample featured snippet for the keyword "${keyword}". It provides a concise answer extracted from a top-ranking page.`
  };
}

export function generateKeywordDetail(keywordId: string): KeywordDetail {
  // Use a base keyword from the main generator for some consistency
  const baseKeyword = generateRankingData(1)[0];

  const intents: KeywordIntent[] = ['informational', 'navigational', 'commercial', 'transactional'];
  const trends: Trend[] = ['up', 'down', 'stable'];

  return {
    keyword: baseKeyword.keyword,
    searchVolume: baseKeyword.searchVolume,
    difficulty: baseKeyword.difficulty,
    cpc: randomFloat(0.5, 25, 2),
    competition: randomFloat(0.1, 1, 2),
    currentPosition: baseKeyword.currentPosition,
    previousPosition: baseKeyword.previousPosition,
    trend: sample(trends),
    clicks: baseKeyword.clicks,
    impressions: baseKeyword.impressions,
    ctr: baseKeyword.ctr,
    positionHistory: generatePositionHistory(),
    primaryIntent: sample(intents),
    intentConfidence: randomInt(60, 100),
    serpFeatures: ['Featured Snippet', 'People Also Ask', 'Video Carousel'],
    featuredSnippet: generateFeaturedSnippet(baseKeyword.keyword),
    rankingUrl: baseKeyword.url,
    rankingPage: {
      title: `The Ultimate Guide to ${baseKeyword.keyword}`,
      metaDescription: `Everything you need to know about ${baseKeyword.keyword}. Read our comprehensive guide.`,
      wordCount: randomInt(1500, 4000),
      lastUpdated: new Date(Date.now() - randomInt(10, 180) * 24 * 60 * 60 * 1000).toISOString(),
      internalLinks: randomInt(10, 100),
      externalLinks: randomInt(5, 50),
    },
  };
}
