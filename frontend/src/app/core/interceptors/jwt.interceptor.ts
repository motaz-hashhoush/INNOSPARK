import { HttpInterceptorFn } from '@angular/common/http';
import { TOKEN_KEY } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  // Read storage directly: AuthService's constructor fires /auth/me, so injecting
  // it here would be a circular dependency that errors and logs the user out on refresh.
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req);
};
