export class OtpIssueResult {
  expiresAt: Date;
  cooldownSeconds: number;
  /** Set when WhatsApp dispatch failed after all retries — caller should surface this to the user. */
  dispatchWarning?: string;

  constructor(expiresAt: Date, cooldownSeconds: number, dispatchWarning?: string) {
    this.expiresAt = expiresAt;
    this.cooldownSeconds = cooldownSeconds;
    this.dispatchWarning = dispatchWarning;
  }
}
