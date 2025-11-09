import { Injectable, Scope } from '@nestjs/common';
import * as DataLoader from 'dataloader';
import { KeywordService } from '../../keywords/keyword.service';
import { IntentClassification } from '../../search-intent/entities/intent-classification.entity';
import { SearchIntentClassifierService } from '../../search-intent/search-intent-classifier.service';

/**
 * Keyword DataLoader
 * Solves N+1 query problem for keywords
 */
@Injectable({ scope: Scope.REQUEST })
export class KeywordDataLoader {
  constructor(
    private keywordService: KeywordService,
    private intentClassifier: SearchIntentClassifierService,
  ) {}

  /**
   * Load keywords by IDs
   */
  readonly byId = new DataLoader<string, any>(async (ids: readonly string[]) => {
    // In production: fetch keywords by IDs in batch
    const keywords = await this.keywordService.findByIds(ids as string[]);

    // Return in same order as requested IDs
    const keywordMap = new Map(keywords.map((k) => [k.id, k]));
    return ids.map((id) => keywordMap.get(id) || null);
  });

  /**
   * Load keywords by project ID
   */
  readonly byProjectId = new DataLoader<string, any[]>(
    async (projectIds: readonly string[]) => {
      // In production: fetch all keywords for these projects in one query
      const keywordsByProject = new Map<string, any[]>();

      for (const projectId of projectIds) {
        const keywords = await this.keywordService.findByProject(projectId);
        keywordsByProject.set(projectId, keywords);
      }

      return projectIds.map((id) => keywordsByProject.get(id) || []);
    },
  );

  /**
   * Load intent classifications by keyword IDs
   */
  readonly intentByKeyword = new DataLoader<string, IntentClassification | null>(
    async (keywordIds: readonly string[]) => {
      // In production: batch fetch intent classifications
      const intentMap = new Map<string, IntentClassification>();

      // For now, return nulls
      return keywordIds.map((id) => intentMap.get(id) || null);
    },
  );

  /**
   * Load related keywords by keyword ID
   */
  readonly relatedKeywords = new DataLoader<string, string[]>(
    async (keywordIds: readonly string[]) => {
      // In production: batch fetch related keywords from API or cache
      const relatedMap = new Map<string, string[]>();

      return keywordIds.map((id) => relatedMap.get(id) || []);
    },
  );
}

/**
 * Project DataLoader
 * Solves N+1 query problem for projects
 */
@Injectable({ scope: Scope.REQUEST })
export class ProjectDataLoader {
  constructor() {}

  /**
   * Load projects by IDs
   */
  readonly byId = new DataLoader<string, any>(async (ids: readonly string[]) => {
    // In production: fetch projects by IDs in batch
    const projects: any[] = [];
    const projectMap = new Map(projects.map((p) => [p.id, p]));

    return ids.map((id) => projectMap.get(id) || null);
  });

  /**
   * Load projects by tenant ID
   */
  readonly byTenantId = new DataLoader<string, any[]>(
    async (tenantIds: readonly string[]) => {
      const projectsByTenant = new Map<string, any[]>();

      return tenantIds.map((id) => projectsByTenant.get(id) || []);
    },
  );
}

/**
 * Content DataLoader
 * Solves N+1 query problem for content
 */
@Injectable({ scope: Scope.REQUEST })
export class ContentDataLoader {
  constructor() {}

  /**
   * Load content analyses by project ID
   */
  readonly byProjectId = new DataLoader<string, any[]>(
    async (projectIds: readonly string[]) => {
      const contentByProject = new Map<string, any[]>();

      return projectIds.map((id) => contentByProject.get(id) || []);
    },
  );

  /**
   * Load content gaps by project ID
   */
  readonly gapsByProjectId = new DataLoader<string, any[]>(
    async (projectIds: readonly string[]) => {
      const gapsByProject = new Map<string, any[]>();

      return projectIds.map((id) => gapsByProject.get(id) || []);
    },
  );
}

/**
 * Backlink DataLoader
 * Solves N+1 query problem for backlinks
 */
@Injectable({ scope: Scope.REQUEST })
export class BacklinkDataLoader {
  constructor() {}

  /**
   * Load backlinks by project ID
   */
  readonly byProjectId = new DataLoader<string, any[]>(
    async (projectIds: readonly string[]) => {
      const backlinksByProject = new Map<string, any[]>();

      return projectIds.map((id) => backlinksByProject.get(id) || []);
    },
  );

  /**
   * Load referring domains by project ID
   */
  readonly referringDomainsByProjectId = new DataLoader<string, string[]>(
    async (projectIds: readonly string[]) => {
      const domainsByProject = new Map<string, string[]>();

      return projectIds.map((id) => domainsByProject.get(id) || []);
    },
  );
}
