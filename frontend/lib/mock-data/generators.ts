// frontend/lib/mock-data/generators.ts
import { 
  RankingKeyword, 
  Trend, 
  KeywordSuggestion, 
  KeywordIntent,
  Competitor,
  CompetitorKeywordOverlap,
  KeywordGapType,
  ContentAnalysisResult,
  ContentIssue,
  IssueSeverity,
  Project,
  Backlink
} from '@/types/seo';

// =================================================================================
// HELPER FUNCTIONS
// =================================================================================
// ... (code is unchanged)
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number, decimals: number): number => {
  const str = (Math.random() * (max - min) + min).toFixed(decimals);
  return parseFloat(str);
};
const generateRealisticKeyword = (index: number): string => {
  const prefixes = ['how to', 'what is', 'best', 'top', 'cheap', 'local', 'buy', 'review of', 'compare', 'diy'];
  const topics = ['saas product', 'e-commerce store', 'digital marketing', 'content strategy', 'local bakery', 'handmade jewelry', 'b2b software', 'travel blog', 'fitness app', 'seo audit'];
  const suffixes = ['for beginners', 'in 2025', 'guide', 'checklist', 'pricing', 'alternatives', 'near me', 'online'];
  if (index % 10 === 0) return `long-tail keyword for ${topics[index % topics.length]}`;
  if (index % 4 === 0) return `${prefixes[index % prefixes.length]} ${topics[index % topics.length]}`;
  return `${topics[index % topics.length]} ${suffixes[index % suffixes.length]}`;
};
const sample = <T>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];


// =================================================================================
// RANKINGS DATA GENERATOR
// =================================================================================
// ... (code is unchanged)
const createKeywordRanking = (id: number, minPos: number, maxPos: number): RankingKeyword => {
  const currentPosition = randomInt(minPos, maxPos);
  const change = randomInt(0, 15);
  let previousPosition: number;
  let trend: Trend;
  const trendRoll = Math.random();
  if (trendRoll < 0.4) { trend = 'up'; previousPosition = currentPosition + change; } 
  else if (trendRoll < 0.7) { trend = 'down'; previousPosition = Math.max(1, currentPosition - change); }
  else { trend = 'stable'; previousPosition = currentPosition; }
  const searchVolume = randomInt(100, 50000);
  const difficulty = randomInt(1, 100);
  const impressions = Math.round(searchVolume * randomFloat(0.5, 1.5) * (1 / Math.log(currentPosition + 1)));
  const ctr = randomFloat(0.5, 30) / currentPosition;
  const clicks = Math.round(impressions * (ctr / 100));
  const lastUpdated = new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000).toISOString();
  return { id: `kw-${id}`, keyword: generateRealisticKeyword(id), currentPosition, previousPosition, searchVolume, difficulty, clicks, impressions, ctr: parseFloat(ctr.toFixed(2)), url: `/blog/${generateRealisticKeyword(id).replace(/\s+/g, '-')}`, trend, change: Math.abs(currentPosition - previousPosition), lastUpdated };
};
export const generateRankingData = (count: number = 150): RankingKeyword[] => {
  const keywords: RankingKeyword[] = [];
  let id = 1;
  const distribution = { '1-10': 50, '11-20': 40, '21-50': 30, '51-100': 30 };
  for (let i = 0; i < distribution['1-10']; i++) keywords.push(createKeywordRanking(id++, 1, 10));
  for (let i = 0; i < distribution['11-20']; i++) keywords.push(createKeywordRanking(id++, 11, 20));
  for (let i = 0; i < distribution['21-50']; i++) keywords.push(createKeywordRanking(id++, 21, 50));
  for (let i = 0; i < distribution['51-100']; i++) keywords.push(createKeywordRanking(id++, 51, 100));
  while (keywords.length < count) { keywords.push(createKeywordRanking(id++, 1, 100)); }
  return keywords.slice(0, count);
};


// =================================================================================
// KEYWORD SUGGESTIONS GENERATOR
// =================================================================================
// ... (code is unchanged)
const randomIntent = (): KeywordIntent => {
  const intents: KeywordIntent[] = ['informational', 'navigational', 'commercial', 'transactional'];
  return intents[randomInt(0, 3)];
};
const generateTrendData = (): number[] => Array.from({ length: 12 }, () => randomInt(100, 5000));
const allSerpFeatures = ['Featured Snippet', 'People Also Ask', 'Local Pack', 'Knowledge Panel', 'Image Pack', 'Video Carousel', 'Top Stories', 'Shopping Results'];
const randomSerpFeatures = (): string[] => {
  const features = new Set<string>();
  const count = randomInt(0, 4);
  for (let i = 0; i < count; i++) { features.add(allSerpFeatures[randomInt(0, allSerpFeatures.length - 1)]); }
  return Array.from(features);
};
export const generateKeywordSuggestions = (seed: string, mode: string, count: number = 200): KeywordSuggestion[] => {
  const suggestions: KeywordSuggestion[] = [];
  const questionPrefixes = ['what is', 'how to', 'why is', 'where can i find', 'best way to'];
  for (let i = 0; i < count; i++) {
    let keyword = '';
    switch (mode) {
      case 'questions': keyword = `${questionPrefixes[i % questionPrefixes.length]} ${seed} ${i}`; break;
      case 'related': keyword = `related term for ${seed} #${i}`; break;
      case 'competitors': keyword = `competitor keyword for ${seed} ${i}`; break;
      default: keyword = `${seed} variation ${i}`; break;
    }
    suggestions.push({ keyword, searchVolume: randomInt(50, 100000), difficulty: randomInt(1, 100), cpc: randomFloat(0.1, 50, 2), competition: randomFloat(0, 1, 2), intent: randomIntent(), trend: generateTrendData(), serpFeatures: randomSerpFeatures(), opportunityScore: randomFloat(0, 10, 1), isTracked: Math.random() > 0.8 });
  }
  return suggestions;
};

// =================================================================================
// COMPETITOR ANALYSIS GENERATOR
// =================================================================================
// ... (code is unchanged)
const companyNames = ['Innovatech', 'QuantumLeap', 'Synergy AI', 'NextGen Solutions', 'Apex Digital', 'Zenith Web', 'Stellar SEO', 'Momentum Marketing', 'Peak Performance', 'DataDriven Co'];
const domains = ['innovatech.com', 'quantumleap.ai', 'synergy.io', 'nextgen.com', 'apexdigital.org', 'zenithweb.co', 'stellarseo.agency', 'momentummktg.com', 'peakperf.io', 'datadriven.co'];
export const generateCompetitorProfiles = (count: number = 10): Competitor[] => {
  const competitors: Competitor[] = [];
  for (let i = 0; i < count; i++) {
    const domainRating = randomInt(20, 95);
    competitors.push({ id: `comp-${i + 1}`, name: companyNames[i % companyNames.length], domain: domains[i % domains.length], domainRating, estimatedTraffic: randomInt(5000, 500000), organicKeywords: randomInt(500, 50000), paidKeywords: randomInt(0, 5000), backlinks: domainRating * randomInt(1000, 10000), referringDomains: domainRating * randomInt(100, 500), trafficTrend: randomFloat(-25, 50, 1), commonKeywords: randomInt(50, 5000), keywordGap: randomInt(100, 10000), contentGap: randomInt(50, 1000), isTracked: Math.random() > 0.5 });
  }
  return competitors;
};
export const generateCompetitorKeywordOverlap = (count: number = 200): CompetitorKeywordOverlap[] => {
  const keywords: CompetitorKeywordOverlap[] = [];
  for (let i = 0; i < count; i++) {
    const yourPos = Math.random() > 0.3 ? randomInt(1, 100) : null;
    const compPos = randomInt(1, 100);
    let gapType: KeywordGapType;
    if (yourPos === null) { gapType = 'missing'; } 
    else if (yourPos < compPos) { gapType = 'winning'; } 
    else { gapType = 'losing'; }
    keywords.push({ keyword: generateRealisticKeyword(i + 100), yourPosition: yourPos, competitorPosition: compPos, searchVolume: randomInt(100, 80000), difficulty: randomInt(10, 90), gapType });
  }
  return keywords;
};

// =================================================================================
// CONTENT ANALYSIS GENERATOR
// =================================================================================
// ... (code is unchanged)
const issueMessages = { SEO: [ { msg: 'Title is too long', rec: 'Keep titles under 60 characters.' }, { msg: 'Meta description is missing', rec: 'Add a meta description of 150-160 characters.' }, { msg: 'No H1 tag found', rec: 'Add a unique H1 tag to the page.' }, { msg: 'Low keyword density for "X"', rec: 'Include the target keyword more naturally.' }, ], Readability: [ { msg: 'High percentage of long sentences', rec: 'Break down long sentences for clarity.' }, { msg: 'Passive voice used excessively', rec: 'Use active voice where possible.' }, ], Technical: [ { msg: 'Image missing alt text', rec: 'Add descriptive alt text to all images.' }, { msg: 'Broken internal link found', rec: 'Fix the broken link to point to a valid page.' }, ], Engagement: [ { msg: 'No clear call-to-action (CTA)', rec: 'Add a compelling CTA to guide users.' }, { msg: 'Large blocks of text', rec: 'Use shorter paragraphs and bullet points.' }, ], };
const generateContentIssues = (count: number): ContentIssue[] => {
  const issues: ContentIssue[] = [];
  const categories = Object.keys(issueMessages) as (keyof typeof issueMessages)[];
  for (let i = 0; i < count; i++) {
    const category = sample(categories);
    const issueTemplate = sample(issueMessages[category]);
    const severities: IssueSeverity[] = ['info', 'warning', 'critical'];
    issues.push({ id: `issue-${i}`, category, severity: sample(severities), message: issueTemplate.msg, recommendation: issueTemplate.rec });
  }
  return issues;
};
export const generateContentAnalysis = (url: string): ContentAnalysisResult => {
  const wordCount = randomInt(500, 3000);
  const sentenceCount = randomInt(25, 150);
  const images = randomInt(2, 20);
  const imagesWithAlt = Math.floor(images * randomFloat(0.5, 0.9, 2));
  return { analyzedUrl: url, analyzedTimestamp: new Date().toISOString(), overallScore: randomInt(40, 95), scores: { seo: randomInt(50, 98), readability: randomInt(40, 90), engagement: randomInt(60, 95), technical: randomInt(70, 100), }, readabilityMetrics: { fleschReadingEase: randomFloat(30, 80, 1), gradeLevel: `${randomInt(6, 12)}th Grade`, wordCount, sentenceCount, avgSentenceLength: parseFloat((wordCount / sentenceCount).toFixed(1)), }, keywordDensity: Array.from({ length: randomInt(20, 35) }, (_, i) => ({ keyword: generateRealisticKeyword(i * 5), count: randomInt(2, 25), density: randomFloat(0.5, 3.5, 2), })), headingStructure: [ { tag: 'h1', text: 'Main Title of the Page' }, ...Array.from({ length: randomInt(3, 6) }, () => ({ tag: 'h2', text: 'A Section Heading' })), ...Array.from({ length: randomInt(5, 10) }, () => ({ tag: 'h3', text: 'A Sub-section Heading' })), ], linkAnalysis: { internal: randomInt(5, 50), external: randomInt(2, 20), nofollow: randomInt(0, 5), broken: randomInt(0, 3), }, metaData: { title: 'Example Page Title That Is Reasonably Long', titleLength: 45, description: 'This is an example meta description for the analyzed page, designed to be a realistic length.', descriptionLength: 155, images, imagesWithAlt, imagesMissingAlt: images - imagesWithAlt, }, issues: generateContentIssues(randomInt(30, 50)), };
};

// =================================================================================
// PROJECTS GENERATOR
// =================================================================================
// ... (code is unchanged)
const projectNames = ['Peak Performance SEO', 'Innovatech Growth', 'Ecowear Market', 'QuantumLeap Insights', 'Synergy Web Presence', 'Local Eats Visibility'];
export const generateProjects = (count: number = 6): Project[] => {
  const projects: Project[] = [];
  for (let i = 0; i < count; i++) {
    projects.push({ id: `proj-${i + 1}`, name: projectNames[i % projectNames.length], domain: domains[i % domains.length], createdAt: new Date(Date.now() - randomInt(30, 365) * 24 * 60 * 60 * 1000).toISOString(), keywordCount: randomInt(150, 1500), averagePosition: randomFloat(15, 55, 1), trafficEstimate: randomInt(10000, 500000), status: Math.random() > 0.2 ? 'active' : 'paused', lastCrawlDate: new Date(Date.now() - randomInt(1, 7) * 24 * 60 * 60 * 1000).toISOString() });
  }
  return projects;
};

// =================================================================================
// BACKLINKS GENERATOR
// =================================================================================

const sourceDomains = ['techcrunch.com', 'forbes.com', 'nytimes.com', 'producthunt.com', 'randomblog.net', 'nicheforum.org', 'university.edu', 'localnews.com'];
const anchorTexts = ['click here', 'read more', 'our website', 'best SEO tool', 'innovative SaaS', 'e-commerce solution'];

export const generateBacklinks = (count: number = 200): Backlink[] => {
  const backlinks: Backlink[] = [];
  for (let i = 0; i < count; i++) {
    const linkType = sample<'dofollow' | 'nofollow' | 'sponsored' | 'ugc'>(['dofollow', 'dofollow', 'dofollow', 'nofollow', 'sponsored', 'ugc']);
    backlinks.push({
      id: `bl-${i + 1}`,
      sourceDomain: sample(sourceDomains),
      sourceUrl: `https://${sample(sourceDomains)}/article/${randomInt(100, 999)}`,
      targetUrl: '/features/analytics',
      anchorText: sample(anchorTexts),
      linkType,
      domainRating: randomInt(10, 95),
      firstSeen: new Date(Date.now() - randomInt(10, 500) * 24 * 60 * 60 * 1000).toISOString(),
      lastChecked: new Date(Date.now() - randomInt(0, 9) * 24 * 60 * 60 * 1000).toISOString(),
      status: Math.random() > 0.1 ? 'active' : 'lost',
      linkContext: `...some text surrounding the link to give context. The article discusses ${generateRealisticKeyword(i)} and recommends our service as a top solution. The link is placed here: <a href="/features/analytics">${sample(anchorTexts)}</a>. More text follows...`
    });
  }
  return backlinks;
};