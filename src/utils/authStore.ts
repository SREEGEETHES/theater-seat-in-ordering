import { AdminSession, AdminRole, Theater } from '../types';
import { theaterStore } from './theaterStore';

const AUTH_SESSION_KEY = 'snackbox_admin_auth_session_v1';

export const MASTER_CREDENTIALS = {
  username: 'Sreegeethesh',
  password: 'Sree@9345662166',
  displayName: 'Sreegeethesh (Gateway Master)',
  defaultMfaSecret: 'JBSWY3DPEHPK3PXP',
};

export interface LoginResult {
  success: boolean;
  mfaRequired?: boolean;
  error?: string;
  session?: AdminSession;
}

class AuthStore {
  private currentSession: AdminSession | null = null;
  private listeners: ((session: AdminSession | null) => void)[] = [];

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    try {
      const stored = localStorage.getItem(AUTH_SESSION_KEY);
      if (stored) {
        this.currentSession = JSON.parse(stored);
      }
    } catch (e) {
      this.currentSession = null;
    }
  }

  private saveSession() {
    try {
      if (this.currentSession) {
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(this.currentSession));
      } else {
        localStorage.removeItem(AUTH_SESSION_KEY);
      }
    } catch (e) {
      console.error('Failed to save session', e);
    }
  }

  private notify() {
    this.listeners.forEach((l) => l(this.currentSession));
  }

  public subscribe(listener: (session: AdminSession | null) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getSession(): AdminSession | null {
    return this.currentSession;
  }

  public isAuthenticated(): boolean {
    return this.currentSession !== null;
  }

  public isMasterAdmin(): boolean {
    return this.currentSession?.role === 'MASTER_ADMIN';
  }

  public isTheaterAdmin(): boolean {
    return this.currentSession?.role === 'THEATER_ADMIN';
  }

  public async login(
    usernameInput: string,
    passwordInput: string,
    mfaCode?: string
  ): Promise<LoginResult> {
    const trimmedUser = usernameInput.trim();
    const trimmedPass = passwordInput.trim();

    if (!trimmedUser || !trimmedPass) {
      return { success: false, error: 'Please enter both username and password' };
    }

    // 1. Attempt Primary Backend & Database Authentication via /api/auth/login
    try {
      const clientEpoch = Math.floor(Date.now() / 1000);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trimmedUser,
          password: trimmedPass,
          mfa_token: mfaCode?.trim(),
          client_epoch: clientEpoch,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.mfa_required) {
          return {
            success: false,
            mfaRequired: true,
            error: undefined,
          };
        }

        if (data.success && data.role) {
          if (data.theater_id) {
            theaterStore.setActiveTheaterId(data.theater_id);
          }
          const session: AdminSession = {
            role: data.role,
            username: data.username,
            theater_id: data.theater_id,
            theater_name: data.theater_name,
            mfa_verified: data.mfa_verified ?? true,
            login_timestamp: new Date().toISOString(),
          };
          this.currentSession = session;
          this.saveSession();
          this.notify();
          return { success: true, session };
        }
      } else {
        const data = await res.json().catch(() => ({}));
        if (data.mfa_required) {
          return {
            success: false,
            mfaRequired: true,
            error: data.message || 'Two-Factor Authentication required.',
          };
        }
        if (data.message && res.status !== 404 && res.status !== 502) {
          return { success: false, error: data.message };
        }
      }
    } catch (apiErr) {
      // Backend unreachable or static environment: fallback to local validated credentials
      console.warn('[Auth] Backend API unreachable, validating against configured merchant directory');
    }

    // 2. Fallback Validated Authentication (Local / Static Deployment)
    const isMasterUsername = trimmedUser.toLowerCase() === MASTER_CREDENTIALS.username.toLowerCase();
    const isMasterPassword = trimmedPass === MASTER_CREDENTIALS.password;

    if (isMasterUsername) {
      if (!isMasterPassword) {
        return { success: false, error: 'Incorrect Master Gateway password.' };
      }

      // MFA code is strictly mandatory for Master Gateway Admin
      if (!mfaCode) {
        return {
          success: false,
          mfaRequired: true,
          error: undefined,
        };
      }

      const cleanMfa = mfaCode.trim();
      let mfaValid = false;

      // Verify with backend TOTP endpoint if reachable
      try {
        const clientEpoch = Math.floor(Date.now() / 1000);
        const res = await fetch('/api/auth/mfa-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: cleanMfa,
            secret: MASTER_CREDENTIALS.defaultMfaSecret,
            client_epoch: clientEpoch,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.valid === true) {
            mfaValid = true;
          }
        }
      } catch {
        // network error
      }

      // Master Emergency Recovery PIN fallback if offline / clock drift
      if (cleanMfa === '934566') {
        mfaValid = true;
      }

      if (!mfaValid) {
        return {
          success: false,
          mfaRequired: true,
          error: 'Invalid 6-digit Authenticator code. Please check Google Authenticator or use your master recovery PIN.',
        };
      }

      const session: AdminSession = {
        role: 'MASTER_ADMIN',
        username: MASTER_CREDENTIALS.username,
        mfa_verified: true,
        login_timestamp: new Date().toISOString(),
      };
      this.currentSession = session;
      this.saveSession();
      this.notify();
      return { success: true, session };
    }

    // 3. Theater Staff / Merchant Logins
    const allTheaters = theaterStore.getAllTheaters();
    const matchedTheater = allTheaters.find((t) => {
      const theaterPrefix = t.theater_id.replace('th_', '').toLowerCase();
      const configuredUser = (t.admin_credentials?.username || `admin_${theaterPrefix}`).toLowerCase();
      const inputUser = trimmedUser.toLowerCase();

      const userMatches = inputUser === configuredUser || inputUser === theaterPrefix || inputUser === t.theater_id.toLowerCase();
      const configuredPass = t.admin_credentials?.password || 'grand@123';
      const passMatches = trimmedPass === configuredPass;

      return userMatches && passMatches;
    });

    if (matchedTheater) {
      theaterStore.setActiveTheaterId(matchedTheater.theater_id);

      const session: AdminSession = {
        role: 'THEATER_ADMIN',
        username: matchedTheater.admin_credentials?.username || trimmedUser,
        theater_id: matchedTheater.theater_id,
        theater_name: matchedTheater.name,
        login_timestamp: new Date().toISOString(),
      };
      this.currentSession = session;
      this.saveSession();
      this.notify();
      return { success: true, session };
    }

    return {
      success: false,
      error: 'Invalid username or password. Please verify your credentials with the master administrator.',
    };
  }

  public logout() {
    this.currentSession = null;
    this.saveSession();
    this.notify();
  }
}

export const authStore = new AuthStore();
