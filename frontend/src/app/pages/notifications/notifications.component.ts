import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { Notification } from '../../models/interfaces';
import { RevealDirective } from '../../shared/directives/reveal.directive';

/** Inbox for review requests, project selections and contact requests. */
@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, TranslateModule, RevealDirective],
  template: `
    <div class="notif-page">
      <div class="mesh" aria-hidden="true" style="opacity: 0.2;"><span></span></div>
      <div class="grain"></div>

      <div class="container narrow">
        <header class="page-header">
          <div appReveal><span class="kicker">Your Inbox</span></div>
          <div class="header-row" appReveal [delay]="80">
            <h1 class="h-section">Notifications</h1>
            <button class="btn btn-outline btn-sm" (click)="markAllRead()" *ngIf="unreadCount > 0">
              Mark all read ({{ unreadCount }})
            </button>
          </div>
        </header>

        <div class="error-alert" *ngIf="error">⚠️ {{ error }}</div>

        <div class="list" *ngIf="notifications.length">
          <article class="row glass" [class.unread]="!n.is_read"
                   *ngFor="let n of notifications; let i = index" appReveal [delay]="i * 40"
                   (click)="markRead(n)">
            <span class="icon">{{ iconFor(n.type) }}</span>
            <div class="body">
              <p class="msg">{{ n.message }}</p>
              <span class="time">{{ n.created_at | date:'medium' }}</span>
            </div>
            <span class="dot" *ngIf="!n.is_read"></span>
          </article>
        </div>

        <div class="empty-state" *ngIf="!notifications.length && !loading">
          <div class="empty-icon">🔔</div>
          <h3>No notifications yet</h3>
          <p>You'll be alerted here when a project needs review or a company selects one.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notif-page { position: relative; padding: 60px 0 100px; min-height: 100vh; overflow: hidden; }
    .container.narrow { max-width: 780px; }
    .page-header { margin-bottom: 32px; }
    .header-row { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; margin-top: 18px; }
    .glass { background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(20px); }
    .btn-sm { font-size: 12px; padding: 8px 16px; }

    .error-alert {
      margin-bottom: 20px; padding: 12px 16px; border-radius: 14px; font-size: 13px; font-weight: 600;
      background: rgba(239, 68, 68, 0.06); border: 1px solid rgba(239, 68, 68, 0.25); color: #b91c1c;
    }

    .list { display: flex; flex-direction: column; gap: 10px; }
    .row {
      display: flex; align-items: flex-start; gap: 16px; padding: 20px 24px;
      border-radius: 20px; border: 1px solid var(--c-line-soft); cursor: pointer; transition: all 200ms;
    }
    .row:hover { border-color: rgba(30, 107, 255, 0.25); }
    .row.unread { background: rgba(30, 107, 255, 0.05); }
    .row .icon { font-size: 20px; line-height: 1.2; }
    .row .body { flex: 1; }
    .row .msg { font-size: 14px; color: var(--c-ink); line-height: 1.6; margin: 0 0 4px; }
    .row .time { font-size: 11px; color: var(--c-text-faint); }
    .row .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--c-blue); margin-top: 6px; }

    .empty-state { text-align: center; padding: 80px 0; color: var(--c-text-faint); }
    .empty-icon { font-size: 48px; margin-bottom: 16px; }
  `],
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  unreadCount = 0;
  loading = false;
  error = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.api.getNotifications().subscribe({
      next: (res) => {
        this.notifications = res.notifications || [];
        this.unreadCount = res.unread_count || 0;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.detail || 'Could not load your notifications.';
        this.loading = false;
      },
    });
  }

  markRead(notification: Notification): void {
    if (notification.is_read) return;
    this.api.markNotificationRead(notification.id).subscribe({
      next: () => {
        notification.is_read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      },
      error: () => { /* non-blocking — the message is already visible */ },
    });
  }

  markAllRead(): void {
    this.api.markAllNotificationsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => (n.is_read = true));
        this.unreadCount = 0;
      },
      error: (err) => { this.error = err?.error?.detail || 'Could not mark notifications as read.'; },
    });
  }

  iconFor(type: string): string {
    const icons: Record<string, string> = {
      project_submitted: '📝',
      project_reviewed: '✅',
      project_edited: '✏️',
      project_selected: '🤝',
      contact_request: '✉️',
      match_found: '🤖',
      status_change: '📈',
      new_challenge: '💡',
      company_request: '🏢',
    };
    return icons[type] || '🔔';
  }
}
