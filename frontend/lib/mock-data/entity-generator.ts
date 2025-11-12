import {
  EntityQueriesData,
  EntityData,
  EntityQuery,
  EntityCombination,
  EntityType,
  EntityQueryRelationship,
  KeywordIntent,
} from '@/types/seo';

const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const sample = <T>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];

const entityNames: Record<EntityType, string[]> = {
  brand: ['Ahrefs', 'Semrush', 'Moz', 'Google', 'Apple'],
  person: ['Neil Patel', 'Brian Dean', 'Tim Soulo', 'Elon Musk'],
  place: ['Silicon Valley', 'New York', 'London'],
  product: ['SEO Tool', 'Keyword Tracker', 'Rank Checker'],
  concept: ['Link Building', 'Content Marketing', 'Domain Authority'],
  organization: ['Y Combinator', 'Techstars', 'a16z'],
};

export function generateEntityQueries(entity: string, count: number): EntityQuery[] {
  const queries: EntityQuery[] = [];
  const relationshipTypes: EntityQueryRelationship[] = ['about_entity', 'entity_attribute', 'entity_comparison', 'contains_entity'];
  const intents: KeywordIntent[] = ['informational', 'commercial', 'transactional', 'navigational'];

  for (let i = 0; i < count; i++) {
    const relationship = sample(relationshipTypes);
    let query = '';
    switch(relationship) {
        case 'entity_comparison':
            query = `${entity} vs ${sample(entityNames.brand)}`;
            break;
        case 'entity_attribute':
            query = `${entity} pricing`;
            break;
        case 'about_entity':
            query = `what is ${entity}`;
            break;
        case 'contains_entity':
            query = `best tools from ${entity}`;
            break;
    }
    queries.push({
      query,
      searchVolume: randomInt(100, 15000),
      difficulty: randomInt(20, 80),
      intent: sample(intents),
      relationshipType: relationship,
    });
  }
  return queries;
}

export function generateEntities(keyword: string): EntityQueriesData {
  const entities: EntityData[] = [];
  const entityDistribution = { brand: 0, person: 0, place: 0, product: 0, concept: 0, organization: 0 };
  const entityTypes: EntityType[] = ['brand', 'person', 'place', 'product', 'concept', 'organization'];

  const numEntities = randomInt(5, 10);
  for (let i = 0; i < numEntities; i++) {
    const entityType = sample(entityTypes);
    const entityName = sample(entityNames[entityType]);
    
    if (entities.some(e => e.entity === entityName)) continue; // Avoid duplicates

    entityDistribution[entityType]++;
    entities.push({
      entity: entityName,
      entityType,
      relevanceScore: randomInt(50, 100),
      queries: generateEntityQueries(entityName, randomInt(5, 15)),
      description: `A short description about the entity ${entityName}.`,
      knowledgeGraphPresence: Math.random() > 0.3,
      brandValue: entityType === 'brand' ? randomInt(100000, 10000000) : undefined,
    });
  }

  // Normalize distribution
  Object.keys(entityDistribution).forEach(key => {
    entityDistribution[key as EntityType] = (entityDistribution[key as EntityType] / numEntities) * 100;
  });

  const entityCombinations: EntityCombination[] = [
      { entities: ['Ahrefs', 'Semrush'], query: 'Ahrefs vs Semrush', searchVolume: 25000 },
      { entities: ['Link Building', 'Content Marketing'], query: 'link building for content marketing', searchVolume: 8000 },
  ];

  return {
    keyword,
    entities,
    entityDistribution,
    entityCombinations,
  };
}
