import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OtpPurpose } from '../enums/otp-purpose.enum';

@Entity({ name: 'otps' })
@Index(['phone', 'purpose', 'expiresAt'])
@Index('IDX_otps_created_at', ['createdAt'])
export class OtpEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 32 })
  phone: string;

  @Column({ type: 'varchar', length: 128, name: 'code_hash' })
  codeHash: string;

  @Column({
    type: 'enum',
    enum: OtpPurpose,
    enumName: 'otp_purpose_enum',
  })
  purpose: OtpPurpose;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'consumed_at' })
  consumedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
