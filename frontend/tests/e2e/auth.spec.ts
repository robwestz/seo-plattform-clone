import { test, expect, Page } from '@playwright/test';

/**
 * Authentication E2E Tests
 * Tests user registration, login, and authentication flows
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test.describe('User Registration', () => {
    test('should register a new user successfully', async ({ page }) => {
      // Navigate to register page
      await page.click('text=Sign Up');
      await expect(page).toHaveURL(/.*register/);

      // Fill in registration form
      const timestamp = Date.now();
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'User');
      await page.fill('input[name="email"]', `test${timestamp}@example.com`);
      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="confirmPassword"]', 'Password123!');
      await page.fill('input[name="tenantName"]', `Test Company ${timestamp}`);

      // Submit form
      await page.click('button[type="submit"]');

      // Should redirect to dashboard after successful registration
      await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

      // Should see welcome message
      await expect(page.locator('text=Welcome')).toBeVisible();
    });

    test('should show validation errors for invalid email', async ({ page }) => {
      await page.click('text=Sign Up');

      await page.fill('input[name="email"]', 'invalid-email');
      await page.fill('input[name="password"]', 'Password123!');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=valid email')).toBeVisible();
    });

    test('should show validation errors for weak password', async ({ page }) => {
      await page.click('text=Sign Up');

      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', '123');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=password must be')).toBeVisible();
    });

    test('should show error for mismatched passwords', async ({ page }) => {
      await page.click('text=Sign Up');

      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Passwords must match')).toBeVisible();
    });

    test('should show error for existing email', async ({ page }) => {
      const email = 'existing@example.com';

      // First registration
      await page.click('text=Sign Up');
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'User');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="confirmPassword"]', 'Password123!');
      await page.fill('input[name="tenantName"]', 'Test Company');
      await page.click('button[type="submit"]');

      // Wait for registration to complete
      await page.waitForTimeout(1000);

      // Logout
      await page.click('text=Logout');

      // Try to register again with same email
      await page.click('text=Sign Up');
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'User');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="confirmPassword"]', 'Password123!');
      await page.fill('input[name="tenantName"]', 'Another Company');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=already exists')).toBeVisible();
    });
  });

  test.describe('User Login', () => {
    const testUser = {
      email: 'logintest@example.com',
      password: 'Password123!',
      firstName: 'Login',
      lastName: 'Test',
      tenantName: 'Login Test Company',
    };

    test.beforeEach(async ({ page }) => {
      // Register a user for login tests
      await page.click('text=Sign Up');
      const timestamp = Date.now();
      await page.fill('input[name="firstName"]', testUser.firstName);
      await page.fill('input[name="lastName"]', testUser.lastName);
      await page.fill('input[name="email"]', `${timestamp}-${testUser.email}`);
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="confirmPassword"]', testUser.password);
      await page.fill('input[name="tenantName"]', `${timestamp}-${testUser.tenantName}`);
      await page.click('button[type="submit"]');

      // Wait and logout
      await page.waitForURL(/.*dashboard/);
      await page.click('text=Logout');
      await page.waitForURL(/.*login/);

      testUser.email = `${timestamp}-${testUser.email}`;
    });

    test('should login successfully with valid credentials', async ({ page }) => {
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should show error for invalid email', async ({ page }) => {
      await page.fill('input[name="email"]', 'nonexistent@example.com');
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Invalid credentials')).toBeVisible();
    });

    test('should show error for invalid password', async ({ page }) => {
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', 'WrongPassword123!');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Invalid credentials')).toBeVisible();
    });

    test('should persist session after page refresh', async ({ page }) => {
      // Login
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard/);

      // Refresh page
      await page.reload();

      // Should still be logged in
      await expect(page).toHaveURL(/.*dashboard/);
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      // Register and login
      const timestamp = Date.now();
      await page.click('text=Sign Up');
      await page.fill('input[name="firstName"]', 'Logout');
      await page.fill('input[name="lastName"]', 'Test');
      await page.fill('input[name="email"]', `logout${timestamp}@example.com`);
      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="confirmPassword"]', 'Password123!');
      await page.fill('input[name="tenantName"]', `Logout Test ${timestamp}`);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard/);

      // Logout
      await page.click('text=Logout');

      // Should redirect to login page
      await expect(page).toHaveURL(/.*login/);

      // Should not be able to access protected routes
      await page.goto(`${BASE_URL}/dashboard`);
      await expect(page).toHaveURL(/.*login/);
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing protected route without auth', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await expect(page).toHaveURL(/.*login/);
    });

    test('should redirect to login when accessing projects without auth', async ({ page }) => {
      await page.goto(`${BASE_URL}/projects`);
      await expect(page).toHaveURL(/.*login/);
    });

    test('should allow access to protected routes when authenticated', async ({ page }) => {
      // Register and login
      const timestamp = Date.now();
      await page.click('text=Sign Up');
      await page.fill('input[name="firstName"]', 'Protected');
      await page.fill('input[name="lastName"]', 'Test');
      await page.fill('input[name="email"]', `protected${timestamp}@example.com`);
      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="confirmPassword"]', 'Password123!');
      await page.fill('input[name="tenantName"]', `Protected Test ${timestamp}`);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard/);

      // Should be able to access dashboard
      await page.goto(`${BASE_URL}/dashboard`);
      await expect(page).toHaveURL(/.*dashboard/);

      // Should be able to access projects
      await page.goto(`${BASE_URL}/projects`);
      await expect(page).toHaveURL(/.*projects/);
    });
  });
});
