import { ObjectType, Field, ID, Int, Float, registerEnumType } from '@nestjs/graphql';
import { IntentType } from '../../search-intent/entities/intent-classification.entity';

// Register enum for GraphQL
registerEnumType(IntentType, {
  name: 'IntentType',
  description: 'Search intent classification',
});

/**
 * Keyword GraphQL Type
 */
@ObjectType()
export class KeywordType {
  @Field(() => ID)
  id: string;

  @Field()
  keyword: string;

  @Field(() => Int)
  searchVolume: number;

  @Field(() => Float)
  difficulty: number;

  @Field(() => Float, { nullable: true })
  cpc: number;

  @Field(() => IntentType, { nullable: true })
  intent: IntentType;

  @Field(() => Int, { nullable: true })
  currentRank: number;

  @Field(() => Float, { nullable: true })
  rankChange: number;

  @Field(() => [String], { nullable: true })
  relatedKeywords: string[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

/**
 * Keyword Cluster Type
 */
@ObjectType()
export class KeywordClusterType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => [KeywordType])
  keywords: KeywordType[];

  @Field(() => Int)
  keywordCount: number;

  @Field(() => Float)
  averageDifficulty: number;

  @Field(() => Int)
  totalSearchVolume: number;

  @Field(() => Float)
  coherenceScore: number;
}

/**
 * Keyword Metrics Type
 */
@ObjectType()
export class KeywordMetricsType {
  @Field(() => Int)
  totalKeywords: number;

  @Field(() => Int)
  totalSearchVolume: number;

  @Field(() => Float)
  averageDifficulty: number;

  @Field(() => Int)
  rankingKeywords: number;

  @Field(() => Int)
  top10Keywords: number;

  @Field(() => Int)
  top3Keywords: number;
}

/**
 * Keyword Suggestion Type
 */
@ObjectType()
export class KeywordSuggestionType {
  @Field()
  keyword: string;

  @Field(() => Int)
  searchVolume: number;

  @Field(() => Float)
  difficulty: number;

  @Field(() => Float)
  opportunityScore: number;

  @Field(() => Float, { nullable: true })
  cpc: number;

  @Field(() => IntentType, { nullable: true })
  intent: IntentType;
}
