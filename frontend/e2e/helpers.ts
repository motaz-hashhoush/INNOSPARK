import { Page, Route } from '@playwright/test';
import type { User } from '../src/app/models/interfaces';

/** Fixture users for the roles exercised by the validation requirements. */
export const USERS: Record<string, User> = {
  admin: { id: 1, email: 'admin@najah.edu', full_name: 'Admin User', role: 'admin', language_pref: 'en' },
  student: { id: 2, email: 'student@stu.najah.edu', full_name: 'Sara Student', role: 'student', language_pref: 'en' },
  supervisor: { id: 3, email: 'supervisor@najah.edu', full_name: 'Dr. Sami Supervisor', role: 'supervisor', language_pref: 'en' },
  company: { id: 4, email: 'hr@acme.com', full_name: 'Acme Rep', role: 'company', language_pref: 'en' },
};

type MockRoute = { method: string; path: string | RegExp; body: any; status?: number };

/** Puts a fake JWT in localStorage before the app loads, so AuthService treats the session as logged in. */
export async function loginAs(page: Page): Promise<void> {
  await page.addInitScript(() => window.localStorage.setItem('access_token', 'e2e-fake-token'));
}

/** GET /api/auth/me mock — required on every page for a logged-in test. */
export function meRoute(user: User): MockRoute {
  return { method: 'GET', path: '/api/auth/me', body: user };
}

/** GET /api/notifications mock (the app shell bell polls this on every navigation). */
export function notificationsRoute(overrides: Partial<{ notifications: any[]; total: number; unread_count: number }> = {}): MockRoute {
  return {
    method: 'GET',
    path: '/api/notifications',
    body: { notifications: [], total: 0, unread_count: 0, ...overrides },
  };
}

/**
 * Intercepts every /api/** call for the page so no live backend is needed.
 * Unmocked calls get a harmless empty 200 so the page never hangs; if an
 * assertion depends on one of those, add an explicit route for it.
 */
export async function mockApi(page: Page, routes: MockRoute[]): Promise<void> {
  await page.route('**/api/**', async (route: Route) => {
    const req = route.request();
    const url = new URL(req.url());
    const match = routes.find(
      (r) =>
        r.method === req.method() &&
        (typeof r.path === 'string' ? url.pathname === r.path : r.path.test(url.pathname)),
    );
    if (match) {
      await route.fulfill({
        status: match.status ?? 200,
        contentType: 'application/json',
        body: JSON.stringify(match.body),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}
