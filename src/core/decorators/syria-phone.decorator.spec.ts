import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { SyriaPhone } from './syria-phone.decorator';

class LocalDto {
  @SyriaPhone({ formatToLocal: true })
  phone?: string;
}

class IntlDto {
  @SyriaPhone({ formatToInternational: true })
  phone?: string;
}

function transformLocal(plain: Record<string, unknown>): LocalDto {
  return plainToInstance(LocalDto, plain);
}

describe('SyriaPhone', () => {
  it('accepts a valid local number', () => {
    const dto = transformLocal({ phone: '0944123456' });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('normalizes an international number to local form before validating', () => {
    const dto = transformLocal({ phone: '+963944123456' });
    expect(dto.phone).toBe('0944123456');
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('normalizes the 00963 dialing prefix to local form', () => {
    const dto = transformLocal({ phone: '00963944123456' });
    expect(dto.phone).toBe('0944123456');
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('formats a local number to international when requested', () => {
    const dto = plainToInstance(IntlDto, { phone: '0944123456' });
    expect(dto.phone).toBe('+963944123456');
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects an unknown provider code', () => {
    const dto = transformLocal({ phone: '0974123456' });
    expect(validateSync(dto).length).toBeGreaterThan(0);
  });

  it('rejects a malformed number', () => {
    expect(validateSync(transformLocal({ phone: '12345' })).length).toBeGreaterThan(0);
  });

  it('treats an empty/absent value as optional (no error)', () => {
    expect(validateSync(transformLocal({ phone: '' }))).toHaveLength(0);
    expect(validateSync(transformLocal({}))).toHaveLength(0);
  });
});
