import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Project, Challenge, Match, Notification, PipelineStage } from '../../models/interfaces';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Projects ──
  getProjects(params?: any): Observable<{ projects: Project[]; total: number }> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(`${this.baseUrl}/projects`, { params: httpParams });
  }

  getProject(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.baseUrl}/projects/${id}`);
  }

  createProject(data: any): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/projects`, data);
  }

  updateProject(id: number, data: any): Observable<Project> {
    return this.http.put<Project>(`${this.baseUrl}/projects/${id}`, data);
  }

  uploadProjectFiles(projectId: number, files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.http.post(`${this.baseUrl}/projects/${projectId}/files`, formData);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/projects/${id}`);
  }

  // ── Challenges ──
  getChallenges(params?: any): Observable<{ challenges: Challenge[]; total: number }> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(`${this.baseUrl}/challenges`, { params: httpParams });
  }

  getChallenge(id: number): Observable<Challenge> {
    return this.http.get<Challenge>(`${this.baseUrl}/challenges/${id}`);
  }

  createChallenge(data: any): Observable<Challenge> {
    return this.http.post<Challenge>(`${this.baseUrl}/challenges`, data);
  }

  updateChallengeStatus(id: number, status: string): Observable<Challenge> {
    return this.http.put<Challenge>(`${this.baseUrl}/challenges/${id}`, { status });
  }

  // ── Matching ──
  runMatching(challengeId: number): Observable<{ matches: Match[]; total: number }> {
    return this.http.post<any>(`${this.baseUrl}/matching/run/${challengeId}`, {});
  }

  getMatchResults(challengeId: number): Observable<{ matches: Match[]; total: number }> {
    return this.http.get<any>(`${this.baseUrl}/matching/results/${challengeId}`);
  }

  updateMatchStatus(matchId: number, status: string): Observable<Match> {
    return this.http.put<Match>(`${this.baseUrl}/matching/${matchId}/status`, { status });
  }

  // ── Analytics ──
  getAnalyticsOverview(): Observable<any> {
    return this.http.get(`${this.baseUrl}/analytics/overview`);
  }

  getMatchAnalytics(): Observable<any> {
    return this.http.get(`${this.baseUrl}/analytics/matches`);
  }

  // ── Pipeline ──
  getPipelineStages(): Observable<{ stages: PipelineStage[] }> {
    return this.http.get<any>(`${this.baseUrl}/pipeline/stages`);
  }

  advanceProject(projectId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/pipeline/${projectId}/advance`, {});
  }

  // ── Notifications ──
  getNotifications(unreadOnly = false): Observable<any> {
    return this.http.get(`${this.baseUrl}/notifications`, {
      params: new HttpParams().set('unread_only', String(unreadOnly))
    });
  }

  markNotificationRead(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/notifications/${id}/read`, {});
  }

  markAllNotificationsRead(): Observable<any> {
    return this.http.put(`${this.baseUrl}/notifications/read-all`, {});
  }
}
