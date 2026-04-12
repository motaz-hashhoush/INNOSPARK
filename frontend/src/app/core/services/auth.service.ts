import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, AuthToken } from '../../models/interfaces';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUser();
  }

  private loadUser(): void {
    const token = this.getToken();
    if (token) {
      this.getMe().subscribe({
        next: (user) => this.currentUserSubject.next(user),
        error: () => this.logout(),
      });
    }
  }

  register(data: { email: string; password: string; full_name: string; role: string }): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/auth/register`, data);
  }

  login(email: string, password: string): Observable<AuthToken> {
    return this.http.post<AuthToken>(`${this.baseUrl}/auth/login`, { email, password }).pipe(
      tap((token) => {
        localStorage.setItem('access_token', token.access_token);
        this.loadUser();
      })
    );
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/auth/me`).pipe(
      tap((user) => this.currentUserSubject.next(user))
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(...roles: string[]): boolean {
    const user = this.currentUser;
    return !!user && roles.includes(user.role);
  }
}
