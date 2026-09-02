import { AdminSession, AdminRole, Theater } from '../types';
import { theaterStore } from './theaterStore';

const AUTH_SESSION_KEY = 'snackbox_admin_auth_session_v1';

export const MASTER_CREDENTIALS = {
  username: 'Sreegeethesh',
  password: 'Sree@9345662166',
  displayName: 'Sreegeethesh (Gateway Master)',
};

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

  public login(usernameInput: string, passwordInput: string): { success: boolean; error?: string; session?: AdminSession } {
    const trimmedUser = usernameInput.trim();
    const trimmedPass = passwordInput.trim();

    if (!trimmedUser || !trimmedPass) {
      return { success: false, error: 'Please enter both username and password' };
    }

    // 1. Check Master Login
    if (trimmedUser === MASTER_CREDENTIALS.username && trimmedPass === MASTER_CREDENTIALS.password) {
      const session: AdminSession = {
        role: 'MASTER_ADMIN',
        username: MASTER_CREDENTIALS.username,
        login_timestamp: new Date().toISOString(),
      };
      this.currentSession = session;
      this.saveSession();
      this.notify();
      return { success: true, session };
    }

    // 2. Check Theater Admin Logins
    const allTheaters = theaterStore.getAllTheaters();
    const matchedTheater = allTheaters.find(
      (t) =>
        t.admin_credentials &&
        t.admin_credentials.username.toLowerCase() === trimmedUser.toLowerCase() &&
        t.admin_credentials.password === trimmedPass
    );

    if (matchedTheater) {
      // Automatically activate this theater for operations
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

    // Check if user entered master username with wrong password
    if (trimmedUser.toLowerCase() === MASTER_CREDENTIALS.username.toLowerCase()) {
      return { success: false, error: 'Incorrect Master Gateway password' };
    }

    return {
      success: false,
      error: 'Invalid credentials. Please check your username and password.',
    };
  }

  public logout() {
    this.currentSession = null;
    this.saveSession();
    this.notify();
  }
}

export const authStore = new AuthStore();
