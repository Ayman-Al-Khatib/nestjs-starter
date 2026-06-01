import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { OtpEntity } from '../entities/otp.entity';
import { OtpPurpose } from '../enums/otp-purpose.enum';

/**
 * Internal data-access for OTPs. Stays scoped to OtpsModule;
 * other modules call OtpService instead of importing this class.
 */
@Injectable()
export class OtpRepository {
  constructor(
    @InjectRepository(OtpEntity)
    private readonly repo: Repository<OtpEntity>,
  ) {}

  create(data: Partial<OtpEntity>): OtpEntity {
    return this.repo.create(data);
  }

  save(otp: OtpEntity): Promise<OtpEntity> {
    return this.repo.save(otp);
  }

  findActiveByPhoneAndPurpose(phone: string, purpose: OtpPurpose): Promise<OtpEntity | null> {
    return this.repo.findOne({
      where: {
        phone,
        purpose,
        consumedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      order: { id: 'DESC' },
    });
  }

  findLatestByPhoneAndPurpose(phone: string, purpose: OtpPurpose): Promise<OtpEntity | null> {
    return this.repo.findOne({
      where: { phone, purpose },
      order: { id: 'DESC' },
    });
  }

  async incrementAttempts(id: string): Promise<void> {
    await this.repo.increment({ id }, 'attempts', 1);
  }

  async markConsumed(id: string, at: Date): Promise<void> {
    await this.repo.update({ id }, { consumedAt: at });
  }

  async invalidateActive(phone: string, purpose: OtpPurpose): Promise<void> {
    await this.repo.update({ phone, purpose, consumedAt: IsNull() }, { consumedAt: new Date() });
  }

  async countRequestsSince(phone: string, purpose: OtpPurpose, since: Date): Promise<number> {
    return this.repo.count({
      where: { phone, purpose, createdAt: MoreThan(since) },
    });
  }

  /**
   * Hard-deletes rows created before `cutoff`. The cutoff must sit beyond every
   * rolling window OtpService counts over (issue-rate and phone-lock), so
   * pruning never resets an in-flight rate limit.
   */
  async deleteCreatedBefore(cutoff: Date): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoff', { cutoff })
      .execute();
    return result.affected ?? 0;
  }

  /**
   * Sum of `attempts` across all OTP rows for the phone+purpose whose
   * `createdAt` is at or after `since`. Used by OtpService to enforce a
   * rolling per-phone failure cap independent of per-code caps.
   */
  async sumFailedAttemptsSince(
    phone: string,
    purpose: OtpPurpose,
    since: Date,
  ): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('otp')
      .select('COALESCE(SUM(otp.attempts), 0)', 'sum')
      .where('otp.phone = :phone', { phone })
      .andWhere('otp.purpose = :purpose', { purpose })
      .andWhere('otp.created_at >= :since', { since })
      .getRawOne<{ sum: string | number | null }>();
    return Number(result?.sum ?? 0);
  }
}
