export interface NotificationFailure {
  index: number;
  error: Error;
}

export interface BatchResponse {
  successCount: number;
  failureCount: number;
  failures: NotificationFailure[];
}
