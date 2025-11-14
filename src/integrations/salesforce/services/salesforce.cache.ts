export class SalesforceTokenCache {
  private accessToken: string | undefined;
  private savedAt: Date | undefined;

  private readonly tokenLifetimeMilliseconds: number = 12 * 60 * 60 * 1000;
  private readonly refreshBeforeExpirationMilliseconds: number = 10 * 60 * 1000;

  public setToken(accessToken: string): void {
    this.accessToken = accessToken;
    this.savedAt = new Date();
  }

  public getToken(): string | undefined {
    if (!this.accessToken || !this.savedAt) {
      return undefined;
    }

    if (this.isTokenExpired()) {
      this.clearToken();
      return undefined;
    }

    return this.accessToken;
  }

  private isTokenExpired(): boolean {
    if (!this.savedAt) {
      return true;
    }

    const now = Date.now();
    const savedAtTimestamp = this.savedAt.getTime();
    const elapsed = now - savedAtTimestamp;

    const effectiveLifetime =
      this.tokenLifetimeMilliseconds - this.refreshBeforeExpirationMilliseconds;

    return elapsed > effectiveLifetime;
  }

  private clearToken(): void {
    this.accessToken = undefined;
    this.savedAt = undefined;
  }
}
