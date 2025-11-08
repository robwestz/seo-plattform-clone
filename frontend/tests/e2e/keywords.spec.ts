import { test, expect, Page } from '@playwright/test';

/**
 * Keyword Research E2E Tests
 * Tests keyword research and ranking features
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Helper function to login
async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*dashboard/);
}

// Helper function to create a test user and login
async function setupTestUser(page: Page) {
  const timestamp = Date.now();
  const testUser = {
    email: `keywordtest${timestamp}@example.com`,
    password: 'Password123!',
    firstName: 'Keyword',
    lastName: 'Test',
    tenantName: `Keyword Test ${timestamp}`,
  };

  await page.goto(BASE_URL);
  await page.click('text=Sign Up');
  await page.fill('input[name="firstName"]', testUser.firstName);
  await page.fill('input[name="lastName"]', testUser.lastName);
  await page.fill('input[name="email"]', testUser.email);
  await page.fill('input[name="password"]', testUser.password);
  await page.fill('input[name="confirmPassword"]', testUser.password);
  await page.fill('input[name="tenantName"]', testUser.tenantName);
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*dashboard/);

  return testUser;
}

test.describe('Keyword Research', () => {
  let testUser: any;

  test.beforeEach(async ({ page }) => {
    testUser = await setupTestUser(page);
  });

  test.describe('Keyword Discovery', () => {
    test('should navigate to keyword research page', async ({ page }) => {
      await page.click('text=Keywords');
      await expect(page).toHaveURL(/.*keywords/);
      await expect(page.locator('h1:has-text("Keyword Research")')).toBeVisible();
    });

    test('should search for keyword suggestions', async ({ page }) => {
      await page.goto(`${BASE_URL}/keywords`);

      // Enter seed keyword
      await page.fill('input[placeholder*="Enter seed keyword"]', 'seo tools');
      await page.click('button:has-text("Search")');

      // Should show loading state
      await expect(page.locator('text=Searching')).toBeVisible();

      // Should show results
      await expect(page.locator('.keyword-result').first()).toBeVisible({ timeout: 10000 });

      // Results should include metrics
      await expect(page.locator('text=Search Volume')).toBeVisible();
      await expect(page.locator('text=Difficulty')).toBeVisible();
      await expect(page.locator('text=CPC')).toBeVisible();
    });

    test('should filter keyword results', async ({ page }) => {
      await page.goto(`${BASE_URL}/keywords`);

      // Search for keywords
      await page.fill('input[placeholder*="Enter seed keyword"]', 'seo');
      await page.click('button:has-text("Search")');
      await page.waitForSelector('.keyword-result', { timeout: 10000 });

      // Apply difficulty filter
      await page.click('text=Filters');
      await page.selectOption('select[name="difficulty"]', 'easy');
      await page.click('button:has-text("Apply Filters")');

      // Results should be filtered
      await page.waitForTimeout(1000);
      const results = await page.locator('.keyword-result').count();
      expect(results).toBeGreaterThan(0);
    });

    test('should add keywords to tracking list', async ({ page }) => {
      await page.goto(`${BASE_URL}/keywords`);

      // Search for keywords
      await page.fill('input[placeholder*="Enter seed keyword"]', 'marketing');
      await page.click('button:has-text("Search")');
      await page.waitForSelector('.keyword-result', { timeout: 10000 });

      // Add first keyword to tracking
      await page.click('.keyword-result >> nth=0 >> button:has-text("Track")');

      // Should show success message
      await expect(page.locator('text=Keyword added to tracking')).toBeVisible();

      // Navigate to tracked keywords
      await page.click('text=Tracked Keywords');
      await expect(page.locator('.tracked-keyword').first()).toBeVisible();
    });
  });

  test.describe('Keyword Analytics', () => {
    test('should display keyword metrics', async ({ page }) => {
      await page.goto(`${BASE_URL}/keywords`);

      // Search for keywords
      await page.fill('input[placeholder*="Enter seed keyword"]', 'digital marketing');
      await page.click('button:has-text("Search")');
      await page.waitForSelector('.keyword-result', { timeout: 10000 });

      // Click on a keyword to view details
      await page.click('.keyword-result >> nth=0');

      // Should show detailed metrics
      await expect(page.locator('text=Search Volume Trend')).toBeVisible();
      await expect(page.locator('text=Competition Analysis')).toBeVisible();
      await expect(page.locator('text=Related Keywords')).toBeVisible();
    });

    test('should show keyword difficulty breakdown', async ({ page }) => {
      await page.goto(`${BASE_URL}/keywords`);

      await page.fill('input[placeholder*="Enter seed keyword"]', 'content marketing');
      await page.click('button:has-text("Search")');
      await page.waitForSelector('.keyword-result', { timeout: 10000 });

      // View keyword details
      await page.click('.keyword-result >> nth=0');

      // Should show difficulty factors
      await expect(page.locator('text=Domain Authority')).toBeVisible();
      await expect(page.locator('text=Page Authority')).toBeVisible();
      await expect(page.locator('text=Backlinks')).toBeVisible();
    });
  });

  test.describe('Rank Tracking', () => {
    test('should navigate to rank tracking page', async ({ page }) => {
      await page.click('text=Rankings');
      await expect(page).toHaveURL(/.*rankings/);
      await expect(page.locator('h1:has-text("Rank Tracking")')).toBeVisible();
    });

    test('should display tracked keyword rankings', async ({ page }) => {
      // First, add a project and keywords
      await page.goto(`${BASE_URL}/projects`);
      await page.click('button:has-text("New Project")');
      await page.fill('input[name="name"]', 'Test Website');
      await page.fill('input[name="domain"]', 'testwebsite.com');
      await page.click('button:has-text("Create")');
      await page.waitForTimeout(1000);

      // Add keywords to track
      await page.click('text=Add Keywords');
      await page.fill('textarea[name="keywords"]', 'seo tools\nkeyword research\nrank tracking');
      await page.click('button:has-text("Add Keywords")');
      await page.waitForTimeout(1000);

      // Navigate to rankings
      await page.goto(`${BASE_URL}/rankings`);

      // Should show ranking data
      await expect(page.locator('.ranking-row').first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Position')).toBeVisible();
      await expect(page.locator('text=Change')).toBeVisible();
    });

    test('should filter rankings by date range', async ({ page }) => {
      await page.goto(`${BASE_URL}/rankings`);

      // Open date filter
      await page.click('text=Date Range');

      // Select last 7 days
      await page.click('text=Last 7 Days');

      // Wait for data to load
      await page.waitForTimeout(1000);

      // Should show filtered results
      await expect(page.locator('text=Last 7 Days')).toBeVisible();
    });

    test('should show ranking trend chart', async ({ page }) => {
      await page.goto(`${BASE_URL}/rankings`);

      // Click on a keyword to view trend
      await page.click('.ranking-row >> nth=0');

      // Should show chart
      await expect(page.locator('canvas')).toBeVisible();
      await expect(page.locator('text=Ranking History')).toBeVisible();
    });
  });

  test.describe('Competitor Analysis', () => {
    test('should add competitor domains', async ({ page }) => {
      await page.goto(`${BASE_URL}/projects`);

      // Create or select a project
      await page.click('button:has-text("New Project")');
      await page.fill('input[name="name"]', 'Competitor Test');
      await page.fill('input[name="domain"]', 'mysite.com');
      await page.click('button:has-text("Create")');
      await page.waitForTimeout(1000);

      // Add competitors
      await page.click('text=Competitors');
      await page.click('button:has-text("Add Competitor")');
      await page.fill('input[name="domain"]', 'competitor1.com');
      await page.click('button:has-text("Add")');

      // Should show competitor in list
      await expect(page.locator('text=competitor1.com')).toBeVisible();
    });

    test('should compare keyword rankings with competitors', async ({ page }) => {
      await page.goto(`${BASE_URL}/keywords/compare`);

      // Enter keywords to compare
      await page.fill('input[name="keywords"]', 'seo tools, keyword research');
      await page.click('button:has-text("Compare")');

      // Should show comparison table
      await expect(page.locator('text=Your Site')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Competitors')).toBeVisible();
      await expect(page.locator('.comparison-table')).toBeVisible();
    });
  });

  test.describe('Export and Reporting', () => {
    test('should export keyword data to CSV', async ({ page }) => {
      await page.goto(`${BASE_URL}/keywords`);

      // Search for keywords
      await page.fill('input[placeholder*="Enter seed keyword"]', 'analytics');
      await page.click('button:has-text("Search")');
      await page.waitForSelector('.keyword-result', { timeout: 10000 });

      // Click export button
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Export")');
      await page.click('text=CSV');

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.csv');
    });

    test('should generate keyword report', async ({ page }) => {
      await page.goto(`${BASE_URL}/keywords`);

      // Open report generator
      await page.click('button:has-text("Generate Report")');

      // Select report options
      await page.check('input[name="includeMetrics"]');
      await page.check('input[name="includeTrends"]');
      await page.click('button:has-text("Generate")');

      // Should show report preview
      await expect(page.locator('text=Report Preview')).toBeVisible({ timeout: 10000 });
    });
  });
});
