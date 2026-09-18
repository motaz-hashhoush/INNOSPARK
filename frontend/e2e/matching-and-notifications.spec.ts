import { test, expect } from '@playwright/test';
import { USERS, loginAs, mockApi, meRoute, notificationsRoute } from './helpers';
import { CHALLENGE, MATCH } from './fixtures';

/**
 * Validation notes → Companies (b): AI matching with real results / empty state.
 *                  → Companies (d): contact the park manager via innopark@najah.edu.
 *                  → General / Admin (c): notification system for stakeholders.
 */

const NO_RESULTS = { matches: [], total: 0 };

test.describe('Company AI matching', () => {
  test('runs matching, shows the reason-backed result and contacts the park manager', async ({ page }) => {
    const calls: string[] = [];
    await loginAs(page);
    await mockApi(page, [
      meRoute(USERS.company),
      notificationsRoute(),
      { method: 'GET', path: '/api/challenges', body: { challenges: [CHALLENGE], total: 1 } },
      { method: 'GET', path: `/api/matching/results/${CHALLENGE.id}`, body: NO_RESULTS },
      { method: 'POST', path: `/api/matching/run/${CHALLENGE.id}`, body: { matches: [MATCH], total: 1 } },
      { method: 'PUT', path: `/api/matching/${MATCH.id}/status`, body: { ...MATCH, status: 'accepted' } },
      {
        method: 'POST',
        path: `/api/matching/${MATCH.id}/contact`,
        body: { message: 'Your request was sent to the InnoPark manager.', contact_email: 'innopark@najah.edu' },
      },
    ]);
    page.on('request', (req) => {
      if (req.url().includes('/api/matching/')) calls.push(`${req.method()} ${new URL(req.url()).pathname}`);
    });

    await page.goto('/challenges');
    await page.getByRole('button', { name: 'AI Match' }).click();

    const result = page.locator('.match-mini-item');
    await expect(result).toHaveCount(1);
    await expect(result).toContainText(MATCH.project_title!);
    await expect(result.locator('.score')).toHaveText('87%');

    await page.getByRole('button', { name: 'Select & contact InnoPark' }).click();
    await expect(page.locator('.contact-note')).toContainText('innopark@najah.edu');
    await expect(page.getByRole('button', { name: 'Requested' })).toBeDisabled();

    // Selecting a project must record the acceptance AND raise the contact request
    expect(calls).toContain(`PUT /api/matching/${MATCH.id}/status`);
    expect(calls).toContain(`POST /api/matching/${MATCH.id}/contact`);
  });

  test('shows an empty state instead of irrelevant projects', async ({ page }) => {
    await loginAs(page);
    await mockApi(page, [
      meRoute(USERS.company),
      notificationsRoute(),
      { method: 'GET', path: '/api/challenges', body: { challenges: [CHALLENGE], total: 1 } },
      { method: 'GET', path: `/api/matching/results/${CHALLENGE.id}`, body: NO_RESULTS },
      { method: 'POST', path: `/api/matching/run/${CHALLENGE.id}`, body: NO_RESULTS },
    ]);
    await page.goto('/challenges');
    await page.getByRole('button', { name: 'AI Match' }).click();
    await expect(page.locator('.match-empty')).toContainText('No matching projects found');
    await expect(page.locator('.match-mini-item')).toHaveCount(0);
  });

  test('students cannot run matching or contact companies', async ({ page }) => {
    await loginAs(page);
    await mockApi(page, [
      meRoute(USERS.student),
      notificationsRoute(),
      { method: 'GET', path: '/api/challenges', body: { challenges: [CHALLENGE], total: 1 } },
      { method: 'GET', path: `/api/matching/results/${CHALLENGE.id}`, body: { matches: [MATCH], total: 1 } },
    ]);
    await page.goto('/challenges');
    await expect(page.locator('.match-mini-item')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'AI Match' })).toHaveCount(0);
    await expect(page.locator('.contact-btn')).toHaveCount(0);
  });
});

test.describe('Notifications', () => {
  const inbox = {
    notifications: [
      { id: 1, message: "Acme Rep selected the project 'Smart Irrigation Controller'.", type: 'project_selected', is_read: false, created_at: '2026-02-03T10:00:00Z' },
      { id: 2, message: "Dr. Sami Supervisor updated the project 'Solar Water Pump'.", type: 'project_edited', is_read: true, created_at: '2026-02-02T10:00:00Z' },
    ],
    total: 2,
    unread_count: 1,
  };

  test('bell badge shows the unread count and the inbox lists stakeholder alerts', async ({ page }) => {
    await loginAs(page);
    await mockApi(page, [
      meRoute(USERS.admin),
      notificationsRoute(inbox),
      { method: 'PUT', path: '/api/notifications/read-all', body: { message: 'ok' } },
    ]);

    await page.goto('/notifications');
    await expect(page.locator('.notif-badge')).toHaveText('1');

    const rows = page.locator('.notif-page .row');
    await expect(rows).toHaveCount(2);
    await expect(rows.first()).toHaveClass(/unread/);
    await expect(rows.first()).toContainText('selected the project');

    await page.getByRole('button', { name: /Mark all read/ }).click();
    await expect(page.locator('.notif-page .row.unread')).toHaveCount(0);
  });

  test('guests have no bell', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('.notif-btn')).toHaveCount(0);
  });
});
