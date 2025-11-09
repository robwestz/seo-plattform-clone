import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';

/**
 * Content Analysis Type
 */
@ObjectType()
export class ContentAnalysisType {
  @Field(() => ID)
  id: string;

  @Field()
  url: string;

  @Field(() => Float)
  overallScore: number;

  @Field(() => Float)
  readabilityScore: number;

  @Field(() => Float)
  seoScore: number;

  @Field(() => Float)
  structureScore: number;

  @Field(() => Float)
  uniquenessScore: number;

  @Field(() => Float)
  semanticRelevanceScore: number;

  @Field(() => ReadabilityMetricsType)
  readabilityMetrics: ReadabilityMetricsType;

  @Field(() => [String])
  recommendations: string[];

  @Field()
  createdAt: Date;
}

/**
 * Readability Metrics Type
 */
@ObjectType()
export class ReadabilityMetricsType {
  @Field(() => Float)
  fleschReadingEase: number;

  @Field(() => Float)
  fleschKincaidGrade: number;

  @Field(() => Float)
  smogIndex: number;

  @Field(() => Float)
  colemanLiauIndex: number;

  @Field(() => Float)
  automatedReadabilityIndex: number;

  @Field(() => Float)
  gunningFogIndex: number;

  @Field()
  readingLevel: string;
}

/**
 * Content Gap Type
 */
@ObjectType()
export class ContentGapType {
  @Field(() => ID)
  id: string;

  @Field()
  topic: string;

  @Field()
  gapType: string;

  @Field()
  priority: string;

  @Field(() => [String])
  missingKeywords: string[];

  @Field(() => Int)
  estimatedSearchVolume: number;

  @Field(() => Float)
  opportunityScore: number;

  @Field(() => Int, { nullable: true })
  recommendedWordCount: number;

  @Field(() => [CompetitorUrlType])
  competitorUrls: CompetitorUrlType[];

  @Field()
  description: string;

  @Field(() => Boolean)
  addressed: boolean;
}

/**
 * Competitor URL Type
 */
@ObjectType()
export class CompetitorUrlType {
  @Field()
  url: string;

  @Field()
  domain: string;

  @Field(() => Int)
  wordCount: number;

  @Field(() => Int)
  rank: number;
}

/**
 * Content Strategy Type
 */
@ObjectType()
export class ContentStrategyType {
  @Field()
  strategy: string;

  @Field()
  rationale: string;

  @Field()
  priority: string;

  @Field(() => ContentImpactType)
  estimatedImpact: ContentImpactType;

  @Field(() => [ActionItemType])
  actionItems: ActionItemType[];

  @Field(() => [String])
  contentTypes: string[];

  @Field(() => [String])
  targetKeywords: string[];
}

/**
 * Content Impact Type
 */
@ObjectType()
export class ContentImpactType {
  @Field(() => Int)
  traffic: number;

  @Field(() => Int)
  rankings: number;

  @Field(() => Int)
  conversions: number;
}

/**
 * Action Item Type
 */
@ObjectType()
export class ActionItemType {
  @Field()
  task: string;

  @Field()
  effort: string;

  @Field()
  timeline: string;
}
