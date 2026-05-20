export interface AccessUrl {
  url: string;
  expiresAt?: Date;
}

export interface AccessOptions {
  ttlSeconds?: number;
}
