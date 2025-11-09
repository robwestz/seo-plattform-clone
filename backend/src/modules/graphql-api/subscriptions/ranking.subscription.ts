import { Resolver, Subscription, Args, ID } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { Inject } from '@nestjs/common';
import { KeywordType } from '../schemas/keyword.schema';

const pubSub = new PubSub();

/**
 * Ranking Subscription Events
 */
export enum RankingEvent {
  RANK_UPDATED = 'rankUpdated',
  RANK_CHANGE_ALERT = 'rankChangeAlert',
  KEYWORD_ADDED = 'keywordAdded',
  KEYWORD_REMOVED = 'keywordRemoved',
}

/**
 * Ranking Subscription Resolver
 * Real-time updates for ranking changes
 */
@Resolver()
export class RankingSubscriptionResolver {
  /**
   * Subscribe to ranking updates for project
   */
  @Subscription(() => KeywordType, {
    name: 'rankingUpdated',
    filter: (payload, variables) => {
      return payload.rankingUpdated.projectId === variables.projectId;
    },
  })
  rankingUpdated(@Args('projectId', { type: () => ID }) projectId: string) {
    return pubSub.asyncIterator(RankingEvent.RANK_UPDATED);
  }

  /**
   * Subscribe to significant ranking changes
   */
  @Subscription(() => KeywordType, {
    name: 'rankingAlert',
    filter: (payload, variables) => {
      return (
        payload.rankingAlert.projectId === variables.projectId &&
        Math.abs(payload.rankingAlert.rankChange) >= variables.minChange
      );
    },
  })
  rankingAlert(
    @Args('projectId', { type: () => ID }) projectId: string,
    @Args('minChange', { type: () => Number, defaultValue: 5 }) minChange: number,
  ) {
    return pubSub.asyncIterator(RankingEvent.RANK_CHANGE_ALERT);
  }

  /**
   * Subscribe to keyword additions
   */
  @Subscription(() => KeywordType, {
    name: 'keywordAdded',
  })
  keywordAdded(@Args('projectId', { type: () => ID }) projectId: string) {
    return pubSub.asyncIterator(RankingEvent.KEYWORD_ADDED);
  }

  /**
   * Publish ranking update (called by rank tracker)
   */
  static async publishRankingUpdate(keyword: KeywordType): Promise<void> {
    await pubSub.publish(RankingEvent.RANK_UPDATED, {
      rankingUpdated: keyword,
    });

    // Also publish alert if significant change
    if (keyword.rankChange && Math.abs(keyword.rankChange) >= 5) {
      await pubSub.publish(RankingEvent.RANK_CHANGE_ALERT, {
        rankingAlert: keyword,
      });
    }
  }

  /**
   * Publish keyword addition
   */
  static async publishKeywordAdded(keyword: KeywordType): Promise<void> {
    await pubSub.publish(RankingEvent.KEYWORD_ADDED, {
      keywordAdded: keyword,
    });
  }
}
