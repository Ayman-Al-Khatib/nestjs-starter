import { HttpStatus, Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { BaseErrorHandler } from '../base/base-error.handler';
import { ErrorResponse } from '../interfaces/error-response.interface';

interface DbErrorMapping {
  statusCode: number;
  error: string;
  message: string;
}

/**
 * Handles TypeORM {@link QueryFailedError}s by mapping the driver-level error
 * code (Postgres SQLSTATE / MySQL errno) to a user-safe response. Unknown codes
 * fall back to a generic 500 with `DATABASE_ERROR`.
 */
@Injectable()
export class TypeOrmErrorHandler extends BaseErrorHandler {
  private static readonly ERROR_CODE_MAP: Record<string, DbErrorMapping> = {
    // ── Postgres (SQLSTATE) ────────────────────────────────────────────────
    '23502': {
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'REQUIRED_FIELD_MISSING',
      message: 'Required field cannot be empty',
    },
    '23503': {
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'INVALID_REFERENCE',
      message: 'Invalid reference provided',
    },
    '23505': {
      statusCode: HttpStatus.CONFLICT,
      error: 'DUPLICATE_RECORD',
      message: 'This record already exists',
    },
    '23514': {
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'INVALID_VALUE',
      message: 'Invalid value provided',
    },
    '23001': {
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'RESTRICT_VIOLATION',
      message:
        'Restrict violation: this record is linked to an existing relation and cannot be modified or removed.',
    },
    '42703': {
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'INVALID_DATA',
      message: 'Invalid data provided',
    },
    '42P01': {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'SERVICE_ERROR',
      message: 'Service temporarily unavailable',
    },
    '42804': {
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'INVALID_FORMAT',
      message: 'Invalid data format',
    },
    '22001': {
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'TEXT_TOO_LONG',
      message: 'Text value is too long',
    },
    '22003': {
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'NUMBER_OUT_OF_RANGE',
      message: 'Number value is out of range',
    },
    '08001': {
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      error: 'SERVICE_UNAVAILABLE',
      message: 'Service temporarily unavailable',
    },
    '08006': {
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      error: 'CONNECTION_LOST',
      message: 'Service connection lost',
    },

    // ── MySQL (errno) ──────────────────────────────────────────────────────
    '1062': {
      statusCode: HttpStatus.CONFLICT,
      error: 'DUPLICATE_RECORD',
      message: 'This record already exists',
    },
    '1452': {
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'INVALID_REFERENCE',
      message: 'Invalid reference provided',
    },
    '1451': {
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'RECORD_IN_USE',
      message: 'Cannot delete record as it is being used',
    },
    '1406': {
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'DATA_TOO_LONG',
      message: 'Data value is too long',
    },
    '1048': {
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'REQUIRED_FIELD_MISSING',
      message: 'Required field cannot be empty',
    },
    '1264': {
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'VALUE_OUT_OF_RANGE',
      message: 'Value is out of acceptable range',
    },
  };

  private static readonly DEFAULT_MAPPING: DbErrorMapping = {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    error: 'DATABASE_ERROR',
    message: 'An error occurred while processing your request',
  };

  canHandle(error: unknown): boolean {
    return error instanceof QueryFailedError;
  }

  handle(error: QueryFailedError): ErrorResponse {
    const driverError = error.driverError as { code?: string; errno?: number } | undefined;
    const code = driverError?.code ?? driverError?.errno?.toString();

    const mapping = (code && TypeOrmErrorHandler.ERROR_CODE_MAP[code]) || TypeOrmErrorHandler.DEFAULT_MAPPING;

    // driverError carries Postgres internals (table/column names, SQL fragments,
    // constraint metadata, sometimes row values). The GlobalExceptionFilter only
    // strips `context` outside developer mode, so a single misconfiguration
    // would otherwise leak DB schema. Keep the raw payload off the response
    // entirely — the full QueryFailedError (with its driverError) still reaches
    // the filter's logger via the original exception object.
    return this.buildResponse({
      statusCode: mapping.statusCode,
      // For 5xx responses we never leak a specific db error code to clients.
      error: mapping.statusCode >= 500 ? 'DATABASE_ERROR' : mapping.error,
      message: mapping.message,
      details: { code },
    });
  }
}
