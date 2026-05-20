// AUTO-GENERATED — DO NOT EDIT MANUALLY.
// Run `npm run i18n:sync` to regenerate after modifying translation JSON files.


interface CommonValidationArrayInvalidParams {
  property: string | number;
}

interface CommonValidationArrayToolargeParams {
  property: string | number;
  max: string | number;
}

interface CommonValidationBooleanInvalidParams {
  property: string | number;
}

interface CommonValidationBooleanRequiredParams {
  property: string | number;
}

interface CommonValidationDateInvalidParams {
  property: string | number;
}

interface CommonValidationDateMustbepastParams {
  property: string | number;
}

interface CommonValidationDateMustbeutciso8601Params {
  property: string | number;
}

interface CommonValidationEnumInvalidParams {
  property: string | number;
}

interface CommonValidationGreaterthanInvalidParams {
  property: string | number;
  related: string | number;
}

interface CommonValidationGreaterthanorequalInvalidParams {
  property: string | number;
  related: string | number;
}

interface CommonValidationIdArrayParams {
  property: string | number;
}

interface CommonValidationIdEmptyParams {
  property: string | number;
}

interface CommonValidationIdIntegerParams {
  property: string | number;
}

interface CommonValidationIdPositiveParams {
  property: string | number;
}

interface CommonValidationNameInvalidParams {
  property: string | number;
}

interface CommonValidationNumberInvalidParams {
  property: string | number;
}

interface CommonValidationNumberToolargeParams {
  property: string | number;
  max: string | number;
}

interface CommonValidationNumberToosmallParams {
  property: string | number;
  min: string | number;
}

interface CommonValidationPhoneInvalidsyriaParams {
  property: string | number;
}

interface CommonValidationStringEmptyParams {
  property: string | number;
}

interface CommonValidationStringInvalidParams {
  property: string | number;
}

interface CommonValidationStringToolongParams {
  property: string | number;
}

interface CommonValidationStringTooshortParams {
  property: string | number;
}

interface CommonValidationTimeInvalidformatParams {
  property: string | number;
}

interface CommonValidationTimeInvalidrangeParams {
  property: string | number;
  related: string | number;
}

interface CommonValidationTimezoneInvalidParams {
  property: string | number;
}

interface OtpErrorsIssuerateexceededParams {
  minutes: string | number;
}

interface OtpErrorsPhonelockedParams {
  minutes: string | number;
}

interface OtpErrorsResendcooldownParams {
  seconds: string | number;
}
const TranslationKeys = {
  'admin.errors.current_password_incorrect': 'admin.errors.current_password_incorrect',
  'admin.errors.current_password_required': 'admin.errors.current_password_required',
  'admin.errors.invalid_credentials': 'admin.errors.invalid_credentials',
  'admin.errors.username_taken': 'admin.errors.username_taken',
  'area.errors.area_not_in_city': 'area.errors.area_not_in_city',
  'area.errors.cannot_delete_in_use': 'area.errors.cannot_delete_in_use',
  'area.errors.name_ar_taken': 'area.errors.name_ar_taken',
  'area.errors.name_en_taken': 'area.errors.name_en_taken',
  'area.errors.not_found': 'area.errors.not_found',
  'auth.errors.account_not_found': 'auth.errors.account_not_found',
  'auth.errors.auth_resolver_not_configured': 'auth.errors.auth_resolver_not_configured',
  'auth.errors.forbidden_role': 'auth.errors.forbidden_role',
  'auth.errors.invalid_token': 'auth.errors.invalid_token',
  'auth.errors.missing_token': 'auth.errors.missing_token',
  'auth.messages.logout_success': 'auth.messages.logout_success',
  'city.errors.cannot_delete_in_use': 'city.errors.cannot_delete_in_use',
  'city.errors.name_ar_taken': 'city.errors.name_ar_taken',
  'city.errors.name_en_taken': 'city.errors.name_en_taken',
  'city.errors.not_found': 'city.errors.not_found',
  'common.errors.too_many_requests': 'common.errors.too_many_requests',
  'common.validation.array.invalid': 'common.validation.array.invalid',
  'common.validation.array.too_large': 'common.validation.array.too_large',
  'common.validation.boolean.invalid': 'common.validation.boolean.invalid',
  'common.validation.boolean.required': 'common.validation.boolean.required',
  'common.validation.date.invalid': 'common.validation.date.invalid',
  'common.validation.date.must_be_past': 'common.validation.date.must_be_past',
  'common.validation.date.must_be_utc_iso8601': 'common.validation.date.must_be_utc_iso8601',
  'common.validation.enum.invalid': 'common.validation.enum.invalid',
  'common.validation.greater_than.invalid': 'common.validation.greater_than.invalid',
  'common.validation.greater_than_or_equal.invalid': 'common.validation.greater_than_or_equal.invalid',
  'common.validation.id.array': 'common.validation.id.array',
  'common.validation.id.empty': 'common.validation.id.empty',
  'common.validation.id.integer': 'common.validation.id.integer',
  'common.validation.id.positive': 'common.validation.id.positive',
  'common.validation.name.invalid': 'common.validation.name.invalid',
  'common.validation.number.invalid': 'common.validation.number.invalid',
  'common.validation.number.too_large': 'common.validation.number.too_large',
  'common.validation.number.too_small': 'common.validation.number.too_small',
  'common.validation.phone.invalid_syria': 'common.validation.phone.invalid_syria',
  'common.validation.storage_file.not_found': 'common.validation.storage_file.not_found',
  'common.validation.storage_file.not_found_multiple': 'common.validation.storage_file.not_found_multiple',
  'common.validation.string.empty': 'common.validation.string.empty',
  'common.validation.string.invalid': 'common.validation.string.invalid',
  'common.validation.string.too_long': 'common.validation.string.too_long',
  'common.validation.string.too_short': 'common.validation.string.too_short',
  'common.validation.time.invalid_format': 'common.validation.time.invalid_format',
  'common.validation.time.invalid_range': 'common.validation.time.invalid_range',
  'common.validation.timezone.invalid': 'common.validation.timezone.invalid',
  'notification.errors.body_required': 'notification.errors.body_required',
  'notification.errors.title_required': 'notification.errors.title_required',
  'notification.errors.token_required': 'notification.errors.token_required',
  'notification.errors.tokens_required': 'notification.errors.tokens_required',
  'notification.errors.topic_required': 'notification.errors.topic_required',
  'otp.errors.code_expired': 'otp.errors.code_expired',
  'otp.errors.invalid_code': 'otp.errors.invalid_code',
  'otp.errors.issue_rate_exceeded': 'otp.errors.issue_rate_exceeded',
  'otp.errors.no_active_code': 'otp.errors.no_active_code',
  'otp.errors.phone_locked': 'otp.errors.phone_locked',
  'otp.errors.resend_cooldown': 'otp.errors.resend_cooldown',
  'otp.errors.too_many_attempts': 'otp.errors.too_many_attempts',
  'otp.messages.code_sent': 'otp.messages.code_sent',
  'otp.warnings.dispatch_failed': 'otp.warnings.dispatch_failed',
  'user.errors.not_found': 'user.errors.not_found',
  'user.errors.phone_taken': 'user.errors.phone_taken',
  'user.errors.profile_already_completed': 'user.errors.profile_already_completed',
  'user.errors.profile_not_completed': 'user.errors.profile_not_completed',
  'whatsapp.errors.stub_mode': 'whatsapp.errors.stub_mode',
} as const;

export type TranslationKey = keyof typeof TranslationKeys;

// Type definitions for interpolation parameters
type NoParams = undefined;

// Placeholder type for type-safe interpolation
export interface TranslationInterpolations {
  'admin.errors.current_password_incorrect': NoParams;
  'admin.errors.current_password_required': NoParams;
  'admin.errors.invalid_credentials': NoParams;
  'admin.errors.username_taken': NoParams;
  'area.errors.area_not_in_city': NoParams;
  'area.errors.cannot_delete_in_use': NoParams;
  'area.errors.name_ar_taken': NoParams;
  'area.errors.name_en_taken': NoParams;
  'area.errors.not_found': NoParams;
  'auth.errors.account_not_found': NoParams;
  'auth.errors.auth_resolver_not_configured': NoParams;
  'auth.errors.forbidden_role': NoParams;
  'auth.errors.invalid_token': NoParams;
  'auth.errors.missing_token': NoParams;
  'auth.messages.logout_success': NoParams;
  'city.errors.cannot_delete_in_use': NoParams;
  'city.errors.name_ar_taken': NoParams;
  'city.errors.name_en_taken': NoParams;
  'city.errors.not_found': NoParams;
  'common.errors.too_many_requests': NoParams;
  'common.validation.array.invalid': CommonValidationArrayInvalidParams;
  'common.validation.array.too_large': CommonValidationArrayToolargeParams;
  'common.validation.boolean.invalid': CommonValidationBooleanInvalidParams;
  'common.validation.boolean.required': CommonValidationBooleanRequiredParams;
  'common.validation.date.invalid': CommonValidationDateInvalidParams;
  'common.validation.date.must_be_past': CommonValidationDateMustbepastParams;
  'common.validation.date.must_be_utc_iso8601': CommonValidationDateMustbeutciso8601Params;
  'common.validation.enum.invalid': CommonValidationEnumInvalidParams;
  'common.validation.greater_than.invalid': CommonValidationGreaterthanInvalidParams;
  'common.validation.greater_than_or_equal.invalid': CommonValidationGreaterthanorequalInvalidParams;
  'common.validation.id.array': CommonValidationIdArrayParams;
  'common.validation.id.empty': CommonValidationIdEmptyParams;
  'common.validation.id.integer': CommonValidationIdIntegerParams;
  'common.validation.id.positive': CommonValidationIdPositiveParams;
  'common.validation.name.invalid': CommonValidationNameInvalidParams;
  'common.validation.number.invalid': CommonValidationNumberInvalidParams;
  'common.validation.number.too_large': CommonValidationNumberToolargeParams;
  'common.validation.number.too_small': CommonValidationNumberToosmallParams;
  'common.validation.phone.invalid_syria': CommonValidationPhoneInvalidsyriaParams;
  'common.validation.storage_file.not_found': NoParams;
  'common.validation.storage_file.not_found_multiple': NoParams;
  'common.validation.string.empty': CommonValidationStringEmptyParams;
  'common.validation.string.invalid': CommonValidationStringInvalidParams;
  'common.validation.string.too_long': CommonValidationStringToolongParams;
  'common.validation.string.too_short': CommonValidationStringTooshortParams;
  'common.validation.time.invalid_format': CommonValidationTimeInvalidformatParams;
  'common.validation.time.invalid_range': CommonValidationTimeInvalidrangeParams;
  'common.validation.timezone.invalid': CommonValidationTimezoneInvalidParams;
  'notification.errors.body_required': NoParams;
  'notification.errors.title_required': NoParams;
  'notification.errors.token_required': NoParams;
  'notification.errors.tokens_required': NoParams;
  'notification.errors.topic_required': NoParams;
  'otp.errors.code_expired': NoParams;
  'otp.errors.invalid_code': NoParams;
  'otp.errors.issue_rate_exceeded': OtpErrorsIssuerateexceededParams;
  'otp.errors.no_active_code': NoParams;
  'otp.errors.phone_locked': OtpErrorsPhonelockedParams;
  'otp.errors.resend_cooldown': OtpErrorsResendcooldownParams;
  'otp.errors.too_many_attempts': NoParams;
  'otp.messages.code_sent': NoParams;
  'otp.warnings.dispatch_failed': NoParams;
  'user.errors.not_found': NoParams;
  'user.errors.phone_taken': NoParams;
  'user.errors.profile_already_completed': NoParams;
  'user.errors.profile_not_completed': NoParams;
  'whatsapp.errors.stub_mode': NoParams;
}
