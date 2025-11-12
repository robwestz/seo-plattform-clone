import {
  generateRankingData,
  generateCompetitorProfiles,
  generateContentAnalysis,
} from './generators';
import { RankingKeyword, Competitor, ContentAnalysisResult } from '@/types/seo';

export interface DemoScenario {
  name: string;
  description: string;
  getRankings: (count?: number) => RankingKeyword[];
  getCompetitors: (count?: number) => Competitor[];
  getContentAnalysis: (url: string) => ContentAnalysisResult;
}

export const scenarios: { [key: string]: DemoScenario } = {
  growingEcommerce: {
    name: 'Growing E-commerce Site',
    description: 'A new online store showing strong initial growth and high potential.',
    getRankings: (count = 200) => {
      // 60% improvement trend
      const data = generateRankingData(count);
      return data.map(kw => {
        const roll = Math.random();
        if (roll < 0.6) { // Force upward trend
          kw.trend = 'up';
          kw.previousPosition = kw.currentPosition + Math.abs(kw.change);
        }
        return kw;
      });
    },
    getCompetitors: (count = 5) => generateCompetitorProfiles(count),
    getContentAnalysis: (url: string) => {
        const analysis = generateContentAnalysis(url);
        analysis.overallScore = 75; // Higher score for a growing site
        return analysis;
    }
  },
  strugglingSaaS: {
    name: 'Struggling SaaS Startup',
    description: 'A startup facing strong competition and declining visibility.',
    getRankings: (count = 100) => {
      // 40% worsening trend
      const data = generateRankingData(count);
      return data.map(kw => {
        const roll = Math.random();
        if (roll < 0.5) { // Force downward trend
          kw.trend = 'down';
          kw.previousPosition = kw.currentPosition - Math.abs(kw.change);
          if (kw.previousPosition < 1) kw.previousPosition = 1;
        }
        return kw;
      });
    },
    getCompetitors: (count = 8) => {
        const competitors = generateCompetitorProfiles(count);
        return competitors.map(c => {
            c.domainRating = c.domainRating + 15 > 95 ? 95 : c.domainRating + 15; // Stronger competitors
            return c;
        });
    },
    getContentAnalysis: (url: string) => {
        const analysis = generateContentAnalysis(url);
        analysis.overallScore = 55; // Lower score
        analysis.issues = analysis.issues.slice(0, 50); // More issues
        return analysis;
    }
  },
  establishedTech: {
    name: 'Established Tech Company',
    description: 'A stable, market-leading company focusing on maintaining its position.',
    getRankings: (count = 400) => {
      // Mostly stable
      const data = generateRankingData(count);
      return data.map(kw => {
        const roll = Math.random();
        if (roll < 0.7) { // Force stable trend
          kw.trend = 'stable';
          kw.previousPosition = kw.currentPosition;
        }
        return kw;
      });
    },
    getCompetitors: (count = 3) => generateCompetitorProfiles(count),
    getContentAnalysis: (url: string) => {
        const analysis = generateContentAnalysis(url);
        analysis.overallScore = 88; // High score
        analysis.issues = analysis.issues.slice(0, 15); // Fewer issues
        return analysis;
    }
  },
};

export const getScenario = (scenarioName: string): DemoScenario | null => {
    return scenarios[scenarioName] || null;
}
