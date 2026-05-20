/** Result of issuing or rotating a refresh token. */
export interface RefreshTokenIssueResult {
  /** The plaintext token — return to the client; it is NOT stored. */
  token: string;
  expiresAt: Date;
}
