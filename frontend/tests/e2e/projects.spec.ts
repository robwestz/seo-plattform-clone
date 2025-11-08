import { test, expect, Page } from '@playwright/test';

/**
 * Projects E2E Tests
 * Tests project management features
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Helper function to setup test user
async function setupTestUser(page: Page) {
  const timestamp = Date.now();
  const testUser = {
    email: `projecttest${timestamp}@example.com`,
    password: 'Password123!',
  };

  await page.goto(BASE_URL);
  await page.click('text=Sign Up');
  await page.fill('input[name="firstName"]', 'Project');
  await page.fill('input[name="lastName"]', 'Test');
  await page.fill('input[name="email"]', testUser.email);
  await page.fill('input[name="password"]', testUser.password);
  await page.fill('input[name="confirmPassword"]', testUser.password);
  await page.fill('input[name="tenantName"]', `Project Test ${timestamp}`);
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*dashboard/);

  return testUser;
}

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestUser(page);
  });

  test.describe('Project Creation', () => {
    test('should create a new project', async ({ page }) => {
      await page.click('text=Projects');
      await page.click('button:has-text("New Project")');

      // Fill in project form
      await page.fill('input[name="name"]', 'My Test Website');
      await page.fill('input[name="domain"]', 'mytestwebsite.com');
      await page.selectOption('select[name="protocol"]', 'https');

      // Add target countries
      await page.click('text=Add Country');
      await page.selectOption('select[name="country"]', 'US');

      // Add target keywords
      await page.fill('textarea[name="targetKeywords"]', 'seo tools\nkeyword research\nrank tracking');

      // Submit
      await page.click('button:has-text("Create Project")');

      // Should redirect to project page
      await expect(page).toHaveURL(/.*projects\/.*/, { timeout: 10000 });
      await expect(page.locator('h1:has-text("My Test Website")')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto(`${BASE_URL}/projects`);
      await page.click('button:has-text("New Project")');

      // Try to submit without filling fields
      await page.click('button:has-text("Create Project")');

      // Should show validation errors
      await expect(page.locator('text=Name is required')).toBeVisible();
      await expect(page.locator('text=Domain is required')).toBeVisible();
    });

    test('should validate domain format', async ({ page }) => {
      await page.goto(`${BASE_URL}/projects`);
      await page.click('button:has-text("New Project")');

      await page.fill('input[name="name"]', 'Test Project');
      await page.fill('input[name="domain"]', 'not a valid domain');
      await page.click('button:has-text("Create Project")');

      await expect(page.locator('text=valid domain')).toBeVisible();
    });
  });

  test.describe('Project List', () => {
    test('should display list of projects', async ({ page }) => {
      // Create a project first
      await page.goto(`${BASE_URL}/projects`);
      await page.click('button:has-text("New Project")');
      await page.fill('input[name="name"]', 'List Test Project');
      await page.fill('input[name="domain"]', 'listtest.com');
      await page.click('button:has-text("Create Project")');
      await page.waitForTimeout(1000);

      // Navigate back to projects list
      await page.goto(`${BASE_URL}/projects`);

      // Should see the project in the list
      await expect(page.locator('text=List Test Project')).toBeVisible();
      await expect(page.locator('text=listtest.com')).toBeVisible();
    });

    test('should search projects', async ({ page }) => {
      await page.goto(`${BASE_URL}/projects`);

      // Create multiple projects
      const projects = ['Alpha Project', 'Beta Project', 'Gamma Project'];
      for (const projectName of projects) {
        await page.click('button:has-text("New Project")');
        await page.fill('input[name="name"]', projectName);
        await page.fill('input[name="domain"]', `${projectName.toLowerCase().replace(' ', '')}.com`);
        await page.click('button:has-text("Create Project")');
        await page.waitForTimeout(500);
        await page.goto(`${BASE_URL}/projects`);
      }

      // Search for specific project
      await page.fill('input[placeholder*="Search projects"]', 'Beta');

      // Should show only matching project
      await expect(page.locator('text=Beta Project')).toBeVisible();
      await expect(page.locator('text=Alpha Project')).not.toBeVisible();
    });

    test('should filter projects by status', async ({ page }) => {
      await page.goto(`${BASE_URL}/projects`);

      // Create a project
      await page.click('button:has-text("New Project")');
      await page.fill('input[name="name"]', 'Filter Test Project');
      await page.fill('input[name="domain"]', 'filtertest.com');
      await page.click('button:has-text("Create Project")');
      await page.waitForTimeout(1000);

      await page.goto(`${BASE_URL}/projects`);

      // Filter by active status
      await page.selectOption('select[name="status"]', 'active');

      // Should show active projects
      await expect(page.locator('text=Filter Test Project')).toBeVisible();
    });
  });

  test.describe('Project Details', () => {
    let projectId: string;

    test.beforeEach(async ({ page }) => {
      // Create a project for detail tests
      await page.goto(`${BASE_URL}/projects`);
      await page.click('button:has-text("New Project")');
      await page.fill('input[name="name"]', 'Detail Test Project');
      await page.fill('input[name="domain"]', 'detailtest.com');
      await page.fill('textarea[name="targetKeywords"]', 'test keyword\nanother keyword');
      await page.click('button:has-text("Create Project")');
      await page.waitForURL(/.*projects\/.*/);

      // Extract project ID from URL
      const url = page.url();
      projectId = url.split('/').pop() || '';
    });

    test('should display project overview', async ({ page }) => {
      await expect(page.locator('h1:has-text("Detail Test Project")')).toBeVisible();
      await expect(page.locator('text=detailtest.com')).toBeVisible();
      await expect(page.locator('text=Active')).toBeVisible();
    });

    test('should show project statistics', async ({ page }) => {
      await expect(page.locator('text=Keywords Tracked')).toBeVisible();
      await expect(page.locator('text=Average Position')).toBeVisible();
      await expect(page.locator('text=Total Traffic')).toBeVisible();
    });

    test('should display keyword list', async ({ page }) => {
      await page.click('text=Keywords');

      await expect(page.locator('text=test keyword')).toBeVisible();
      await expect(page.locator('text=another keyword')).toBeVisible();
    });
  });

  test.describe('Project Settings', () => {
    test.beforeEach(async ({ page }) => {
      // Create a project
      await page.goto(`${BASE_URL}/projects`);
      await page.click('button:has-text("New Project")');
      await page.fill('input[name="name"]', 'Settings Test');
      await page.fill('input[name="domain"]', 'settingstest.com');
      await page.click('button:has-text("Create Project")');
      await page.waitForURL(/.*projects\/.*/);

      // Navigate to settings
      await page.click('text=Settings');
    });

    test('should update project name', async ({ page }) => {
      await page.fill('input[name="name"]', 'Updated Project Name');
      await page.click('button:has-text("Save Changes")');

      await expect(page.locator('text=Changes saved successfully')).toBeVisible();
      await expect(page.locator('h1:has-text("Updated Project Name")')).toBeVisible();
    });

    test('should add competitor domains', async ({ page }) => {
      await page.click('text=Competitors');
      await page.fill('input[name="competitorDomain"]', 'competitor1.com');
      await page.click('button:has-text("Add Competitor")');

      await expect(page.locator('text=competitor1.com')).toBeVisible();
    });

    test('should configure tracking settings', async ({ page }) => {
      await page.click('text=Tracking');

      // Update tracking frequency
      await page.selectOption('select[name="trackingFrequency"]', 'daily');

      // Enable mobile tracking
      await page.check('input[name="trackMobile"]');

      // Save changes
      await page.click('button:has-text("Save Settings")');

      await expect(page.locator('text=Settings saved successfully')).toBeVisible();
    });
  });

  test.describe('Project Actions', () => {
    test('should pause a project', async ({ page }) => {
      // Create project
      await page.goto(`${BASE_URL}/projects`);
      await page.click('button:has-text("New Project")');
      await page.fill('input[name="name"]', 'Pause Test');
      await page.fill('input[name="domain"]', 'pausetest.com');
      await page.click('button:has-text("Create Project")');
      await page.waitForURL(/.*projects\/.*/);

      // Pause project
      await page.click('button:has-text("Pause")');
      await page.click('button:has-text("Confirm")');

      await expect(page.locator('text=Paused')).toBeVisible();
    });

    test('should archive a project', async ({ page }) => {
      // Create project
      await page.goto(`${BASE_URL}/projects`);
      await page.click('button:has-text("New Project")');
      await page.fill('input[name="name"]', 'Archive Test');
      await page.fill('input[name="domain"]', 'archivetest.com');
      await page.click('button:has-text("Create Project")');
      await page.waitForURL(/.*projects\/.*/);

      // Archive project
      await page.click('button:has-text("Archive")');
      await page.click('button:has-text("Confirm")');

      await expect(page.locator('text=Archived')).toBeVisible();
    });

    test('should delete a project', async ({ page }) => {
      // Create project
      await page.goto(`${BASE_URL}/projects`);
      await page.click('button:has-text("New Project")');
      await page.fill('input[name="name"]', 'Delete Test');
      await page.fill('input[name="domain"]', 'deletetest.com');
      await page.click('button:has-text("Create Project")');
      await page.waitForURL(/.*projects\/.*/);

      // Delete project
      await page.click('text=Settings');
      await page.click('button:has-text("Delete Project")');
      await page.fill('input[name="confirmText"]', 'DELETE');
      await page.click('button:has-text("Confirm Delete")');

      // Should redirect to projects list
      await expect(page).toHaveURL(/.*projects$/);
      await expect(page.locator('text=Delete Test')).not.toBeVisible();
    });
  });
});
