import {
  Injectable,
  Logger,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { EnvironmentConfig } from 'infrastructure/config';
import { WhatsappService } from './whatsapp.service';

interface WhatsappQueueJob {
  id: string;
  phone: string;
  text: string;
  enqueuedAt: Date;
}

export interface WhatsappEnqueueResult {
  queueId: string;
  position: number;
  enqueuedAt: Date;
}

/**
 * Paces outbound WhatsApp traffic to avoid number bans triggered by
 * burst sending. Messages are appended to an in-memory FIFO; a single
 * worker drains the queue, leaving a randomized 3–8s gap between sends
 * (jittered per-message — fixed cadences look bot-like and get flagged).
 *
 * Design notes:
 * - The first message in an idle queue is sent immediately; the random
 *   delay only applies *between* sends. `lastSentAt` is honored across
 *   worker idle/wake cycles so two messages 100ms apart can never
 *   skip the spacing rule.
 * - Pre-check at enqueue: if the socket is not connected we reject so
 *   callers (e.g. OtpService) can surface a soft "contact support"
 *   warning instead of silently queueing into the void.
 * - Send failures are logged and skipped — no retries, per product
 *   decision. The OTP code is still valid in the DB; the user just
 *   never receives the WhatsApp message.
 * - In-memory state: messages are lost on restart. Acceptable for OTP
 *   (codes expire fast anyway). For at-least-once delivery, swap the
 *   backing store for Redis/BullMQ — the public API is intentionally
 *   small so that migration stays localized.
 */
@Injectable()
export class WhatsappQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(WhatsappQueueService.name);

  private readonly minDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly maxQueueSize: number;

  private readonly queue: WhatsappQueueJob[] = [];
  private isProcessing = false;
  private shuttingDown = false;
  private lastSentAt: number | null = null;

  constructor(
    private readonly whatsapp: WhatsappService,
    private readonly config: ConfigService<EnvironmentConfig>,
  ) {
    this.minDelayMs = this.config.get<number>('WHATSAPP_QUEUE_MIN_DELAY_MS') ?? 3000;
    this.maxDelayMs = this.config.get<number>('WHATSAPP_QUEUE_MAX_DELAY_MS') ?? 8000;
    this.maxQueueSize = this.config.get<number>('WHATSAPP_QUEUE_MAX_SIZE') ?? 1000;
  }

  /**
   * Append a text message to the outbound queue and (if idle) kick the
   * worker. Throws when the socket is disconnected or the queue is full
   * — both conditions the caller needs to know about synchronously.
   */
  enqueueText(phone: string, text: string): WhatsappEnqueueResult {
    if (!this.whatsapp.isConnected()) {
      throw new ServiceUnavailableException('WhatsApp is not connected.');
    }

    if (this.queue.length >= this.maxQueueSize) {
      throw new ServiceUnavailableException('WhatsApp queue is full. Try again later.');
    }

    const job: WhatsappQueueJob = {
      id: `wa-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      phone,
      text,
      enqueuedAt: new Date(),
    };

    this.queue.push(job);
    this.startWorker();

    return { queueId: job.id, position: this.queue.length, enqueuedAt: job.enqueuedAt };
  }

  /** Current queue depth (for admin/diagnostic endpoints). */
  size(): number {
    return this.queue.length;
  }

  onModuleDestroy(): void {
    this.shuttingDown = true;
  }

  // ───────────────────────────────────────────────────────────
  //  Worker
  // ───────────────────────────────────────────────────────────

  private startWorker(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;
    void this.processLoop();
  }

  private async processLoop(): Promise<void> {
    try {
      while (!this.shuttingDown) {
        const job = this.queue.shift();
        if (!job) return;

        // Enforce min spacing since the last send even across worker
        // idle gaps: prevents two messages arriving 50ms apart from
        // bypassing the throttle.
        if (this.lastSentAt !== null) {
          const delay = this.randomDelay();
          const elapsed = Date.now() - this.lastSentAt;
          const remaining = delay - elapsed;
          if (remaining > 0) {
            await this.sleep(remaining);
            if (this.shuttingDown) return;
          }
        }

        try {
          const messageId = await this.whatsapp.sendText(job.phone, job.text);
          this.logger.log(
            `Dispatched ${job.id} → ${job.phone} (msgId=${messageId}, waited=${this.waitedFor(job)}ms)`,
          );
        } catch (err) {
          this.logger.error(
            `Failed to dispatch ${job.id} → ${job.phone}: ${(err as Error).message}`,
          );
        }
        this.lastSentAt = Date.now();
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /** Uniform random in `[minDelayMs, maxDelayMs]`, jittered per call. */
  private randomDelay(): number {
    const span = this.maxDelayMs - this.minDelayMs;
    return this.minDelayMs + crypto.randomInt(0, span + 1);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private waitedFor(job: WhatsappQueueJob): number {
    return Date.now() - job.enqueuedAt.getTime();
  }
}
