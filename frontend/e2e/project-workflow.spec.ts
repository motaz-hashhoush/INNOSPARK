import { test, expect } from '@playwright/test';
import { USERS, loginAs, mockApi, meRoute, notificationsRoute } from './helpers';
import { PROJECT, PENDING_PROJECT } from './fixtures';

/**
 * Validation notes → Supervisors (b): follow + edit supervised projects.
 *                  → Admin (b): Virtual Booth video/demo, admin-only upload.
 *                  → General: Arabic display of titles and summaries.
 */

test.describe('Supervisor editing', () => {
  test('can edit a project they supervise and see the saved title', async ({ page }) => {
    let savedBody: any = null;
    await loginAs(page);
    await mockApi(page, [
      meRoute(USERS.supervisor),
      notificationsRoute(),
      { method: 'GET', path: `/api/projects/${PROJECT.id}`, body: PROJECT },
      // The API clears the LLM copy when the source title changes, so the booth shows the raw title
      { method: 'PUT', path: `/api/projects/${PROJECT.id}`, body: { ...PROJECT, title: 'Smart Irrigation Controller v2', title_en: null, title_ar: null } },
    ]);
    page.on('request', (req) => {
      if (req.method() === 'PUT' && req.url().endsWith(`/api/projects/${PROJECT.id}`)) savedBody = req.postDataJSON();
    });

    await page.goto(`/projects/${PROJECT.id}`);
    await page.getByRole('button', { name: 'Edit project' }).click();

    const title = page.locator('.edit-form input[name="title"]');
    await expect(title).toHaveValue(PROJECT.title);
    await title.fill('Smart Irrigation Controller v2');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.locator('h1')).toContainText('Smart Irrigation Controller v2');
    await expect(page.locator('.edit-form')).toHaveCount(0);
    expect(savedBody.title).toBe('Smart Irrigation Controller v2');
  });

  test('cannot edit a project supervised by someone else', async ({ page }) => {
    await loginAs(page);
    await mockApi(page, [
      meRoute(USERS.supervisor),
      notificationsRoute(),
      { method: 'GET', path: `/api/projects/${PROJECT.id}`, body: { ...PROJECT, supervisor_id: 99 } },
    ]);
    await page.goto(`/projects/${PROJECT.id}`);
    await expect(page.locator('h1')).toContainText(PROJECT.title);
    await expect(page.getByRole('button', { name: 'Edit project' })).toHaveCount(0);
  });
});

test.describe('Supervisor review', () => {
  test('approves a pending project from the review page', async ({ page }) => {
    await loginAs(page);
    await mockApi(page, [
      meRoute(USERS.supervisor),
      notificationsRoute(),
      { method: 'GET', path: '/api/projects', body: { projects: [PENDING_PROJECT], total: 1 } },
      { method: 'PUT', path: `/api/projects/${PENDING_PROJECT.id}/review`, body: { ...PENDING_PROJECT, approval_status: 'approved' } },
    ]);
    await page.goto('/review');
    await expect(page.locator('.row h3')).toContainText(PENDING_PROJECT.title);

    await page.getByRole('button', { name: 'Approve & publish' }).click();
    await expect(page.locator('.row')).toHaveCount(0);
    await expect(page.locator('.empty-state')).toContainText('No projects are waiting');
  });

  test('is blocked for students', async ({ page }) => {
    await loginAs(page);
    await mockApi(page, [meRoute(USERS.student), notificationsRoute(), { method: 'GET', path: '/api/projects', body: { projects: [], total: 0 } }]);
    await page.goto('/review');
    await expect(page).toHaveURL(/\/projects$/);
  });
});

test.describe('Virtual Booth media', () => {
  test('admin gets the video upload controls', async ({ page }) => {
    await loginAs(page);
    await mockApi(page, [
      meRoute(USERS.admin),
      notificationsRoute(),
      { method: 'GET', path: `/api/projects/${PROJECT.id}`, body: PROJECT },
    ]);
    await page.goto(`/projects/${PROJECT.id}`);
    await page.getByRole('button', { name: 'Edit media' }).click();
    await expect(page.locator('.media-form input[type="file"]')).toBeVisible();
    await expect(page.locator('.media-form input[name="videoUrl"]')).toBeVisible();
  });

  test('non-admins only see the published video', async ({ page }) => {
    await loginAs(page);
    await mockApi(page, [
      meRoute(USERS.company),
      notificationsRoute(),
      { method: 'GET', path: `/api/projects/${PROJECT.id}`, body: { ...PROJECT, video_url: '/uploads/10/demo.mp4' } },
    ]);
    await page.goto(`/projects/${PROJECT.id}`);
    await expect(page.locator('video.booth-video')).toHaveAttribute('src', '/uploads/10/demo.mp4');
    await expect(page.getByRole('button', { name: 'Edit media' })).toHaveCount(0);
    await expect(page.locator('.media-form')).toHaveCount(0);
  });
});

test.describe('Arabic display', () => {
  test('switches title and description to Arabic with RTL direction', async ({ page }) => {
    await mockApi(page, [{ method: 'GET', path: `/api/projects/${PROJECT.id}`, body: PROJECT }]);
    await page.goto(`/projects/${PROJECT.id}`);

    await expect(page.locator('h1')).toContainText(PROJECT.title_en!);
    await page.locator('.lang-toggle button', { hasText: 'عربي' }).click();

    await expect(page.locator('h1')).toContainText(PROJECT.title_ar!);
    await expect(page.locator('h1')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('.main-content p.lead')).toContainText(PROJECT.description_ar!);
  });
});
