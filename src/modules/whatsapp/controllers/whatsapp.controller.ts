import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { Protected } from 'core/decorators/protected.decorator';
import { Role } from 'domain/enums/role.enum';
import { SendWhatsappMessageResponseDto } from '../dto/send-whatsapp-message-response.dto';
import { SendWhatsappMessageDto } from '../dto/send-whatsapp-message.dto';
import { WhatsappQrResponseDto } from '../dto/whatsapp-qr-response.dto';
import { WhatsappStatusResponseDto } from '../dto/whatsapp-status-response.dto';
import { WhatsappProviderGuard } from '../guards/whatsapp-provider.guard';
import { WhatsappQueueService } from '../services/whatsapp-queue.service';
import { WhatsappService } from '../services/whatsapp.service';

/**
 * Admin-only WhatsApp session management:
 *
 *   GET  /v1/admin/whatsapp/qr      — pair this server with a WhatsApp account
 *   GET  /v1/admin/whatsapp/status  — is the socket open? is a session persisted?
 *   POST /v1/admin/whatsapp/send    — enqueue a plain-text message for paced delivery
 *   POST /v1/admin/whatsapp/logout  — unpair + wipe local creds (frees `/qr` for
 *                                      a different phone number)
 *
 * All endpoints are blocked when WHATSAPP_DRIVER=stub — the guard returns
 * 503 immediately so no misleading stub state leaks through.
 */
@UseGuards(WhatsappProviderGuard)
@Controller({ path: 'admin/whatsapp', version: '1' })
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly queue: WhatsappQueueService,
  ) {}

  @Protected(Role.ADMIN)
  @Get('qr')
  async getQr(): Promise<WhatsappQrResponseDto> {
    const qr = await this.whatsappService.getQrBase64();
    return { qr };
  }

  @Protected(Role.ADMIN)
  @Get('status')
  async getStatus(): Promise<WhatsappStatusResponseDto> {
    return {
      connected: this.whatsappService.isConnected(),
      paired: await this.whatsappService.isPaired(),
    };
  }

  /**
   * Routes admin-initiated messages through the same queue OTPs use so
   * rapid manual triggers can't bypass the anti-ban throttle.
   */
  @Protected(Role.ADMIN)
  @Post('send')
  @HttpCode(HttpStatus.ACCEPTED)
  send(@Body() body: SendWhatsappMessageDto): SendWhatsappMessageResponseDto {
    const result = this.queue.enqueueText(body.phone, body.text);
    return {
      queueId: result.queueId,
      queuePosition: result.position,
      enqueuedAt: result.enqueuedAt.toISOString(),
    };
  }

  @Protected(Role.ADMIN)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(): Promise<void> {
    await this.whatsappService.logout();
  }
}
