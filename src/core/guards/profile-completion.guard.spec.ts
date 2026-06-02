import { ForbiddenException } from '@nestjs/common';
import { Role } from 'domain/enums/role.enum';
import { createExecutionContext, createTranslatorMock } from 'test-utils/test-helpers';
import { ProfileCompletionGuard } from './profile-completion.guard';

describe('ProfileCompletionGuard', () => {
  const translator = createTranslatorMock();
  const guard = new ProfileCompletionGuard(translator);

  function ctxFor(user: unknown) {
    return createExecutionContext({ request: { user } });
  }

  it('allows non-USER roles regardless of profile state', () => {
    expect(guard.canActivate(ctxFor({ role: Role.ADMIN }))).toBe(true);
  });

  it('allows a USER whose profile is completed', () => {
    expect(guard.canActivate(ctxFor({ role: Role.USER, isProfileCompleted: true }))).toBe(true);
  });

  it('forbids a USER whose profile is not completed', () => {
    expect(() =>
      guard.canActivate(ctxFor({ role: Role.USER, isProfileCompleted: false })),
    ).toThrow(ForbiddenException);
    expect(translator.tr).toHaveBeenCalledWith('user.errors.profile_not_completed');
  });

  it('forbids a USER whose profile-completion flag is missing', () => {
    expect(() => guard.canActivate(ctxFor({ role: Role.USER }))).toThrow(ForbiddenException);
  });

  it('passes through when there is no authenticated user (role check short-circuits)', () => {
    expect(guard.canActivate(ctxFor(undefined))).toBe(true);
  });
});
