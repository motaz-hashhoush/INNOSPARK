import { test, expect } from '@playwright/test';
import { USERS, loginAs, mockApi, meRoute, notificationsRoute } from './helpers';

/**
 * Validation notes → "Main users" section:
 *  - Students / supervisors must not see "submit a project" or "post a challenge".
 *  - Only companies (and admin) post challenges.
 *  - Only the admin ingests repository projects.
 *  - Supervisors get a way to review the projects they supervise.
 */

test.describe('Guest visitor', () => {
  test('landing page offers the challenge flow, not a project submit form', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/challenges/submit"]').first()).toBeVisible();
    await expect(page.locator('a[href="/projects/submit"]')).toHaveCount(0);
  });
});

test.describe('Registration', () => {
  test('the university email hint only shows for the student role', async ({ page }) => {
    await page.goto('/auth/register');
    const hint = page.locator('.form-hint');

    // Student is the default role
    await expect(hint).toContainText('najah.edu');

    await page.selectOption('select[name="role"]', 'company');
    await expect(hint).toHaveCount(0);

    await page.selectOption('select[name="role"]', 'student');
    await expect(hint).toContainText('najah.edu');
  });
});

test.describe('Student', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await mockApi(page, [
      meRoute(USERS.student),
      notificationsRoute(),
      { method: 'GET', path: '/api/projects', body: { projects: [], total: 0 } },
      { method: 'GET', path: '/api/challenges', body: { challenges: [], total: 0 } },
    ]);
  });

  test('cannot submit a project or post a challenge', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('a[href="/projects/submit"]')).toHaveCount(0);
    await expect(page.locator('a[href="/review"]')).toHaveCount(0);

    await page.goto('/challenges');
    await expect(page.locator('a[href="/challenges/submit"]')).toHaveCount(0);

    await page.goto('/');
    await expect(page.locator('a[href="/challenges/submit"]')).toHaveCount(0);
  });
});

test.describe('Supervisor', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await mockApi(page, [
      meRoute(USERS.supervisor),
      notificationsRoute(),
      { method: 'GET', path: '/api/projects', body: { projects: [], total: 0 } },
    ]);
  });

  test('gets a review link instead of submit options', async ({ page }) => {
    await page.goto('/projects');
    // Both the nav bar and the booth header link to the review page
    await expect(page.locator('nav a[href="/review"]')).toBeVisible();
    await expect(page.locator('main a[href="/review"]')).toBeVisible();
    await expect(page.locator('a[href="/projects/submit"]')).toHaveCount(0);
  });
});

test.describe('Company', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await mockApi(page, [
      meRoute(USERS.company),
      notificationsRoute(),
      { method: 'GET', path: '/api/challenges', body: { challenges: [], total: 0 } },
    ]);
  });

  test('is the only self-registered role that can post a challenge', async ({ page }) => {
    await page.goto('/challenges');
    await expect(page.locator('a[href="/challenges/submit"]')).toBeVisible();

    await page.goto('/');
    await expect(page.locator('a[href="/challenges/submit"]').first()).toBeVisible();
  });

  test('has no repository project submit option', async ({ page }) => {
    await mockApi(page, [
      meRoute(USERS.company),
      notificationsRoute(),
      { method: 'GET', path: '/api/projects', body: { projects: [], total: 0 } },
    ]);
    await page.goto('/projects');
    await expect(page.locator('a[href="/projects/submit"]')).toHaveCount(0);
  });
});

test.describe('Admin', () => {
  test('is the only role that can ingest repository projects', async ({ page }) => {
    await loginAs(page);
    await mockApi(page, [
      meRoute(USERS.admin),
      notificationsRoute(),
      { method: 'GET', path: '/api/projects', body: { projects: [], total: 0 } },
    ]);
    await page.goto('/projects');
    await expect(page.locator('a[href="/projects/submit"]')).toBeVisible();
  });
});
