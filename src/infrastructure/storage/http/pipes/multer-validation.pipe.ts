import {
  Inject,
  Injectable,
  mixin,
  PipeTransform,
  Type,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ResolvedStorageConfig } from '../../config/storage-config';
import { STORAGE_CONFIG } from '../../config/storage-tokens';
import { FileValidationError } from '../../core/errors/storage.error';
import { FileValidationService } from '../../validation/file-validation.service';
import { ValidationPolicy } from '../../validation/validation-policy';
import { MulterAdapter, MulterFile } from '../multer.adapter';

type IncomingFiles = MulterFile | MulterFile[] | Record<string, MulterFile[]> | undefined;

@Injectable()
export class MulterValidationPipe implements PipeTransform {
  protected overrides: Partial<ValidationPolicy> | false | undefined = undefined;

  constructor(
    private readonly validation: FileValidationService,
    @Inject(STORAGE_CONFIG) private readonly config: ResolvedStorageConfig,
  ) {}

  async transform(value: IncomingFiles): Promise<IncomingFiles> {
    if (this.overrides === false) return value;

    const policy: ValidationPolicy = {
      ...this.config.defaultValidation,
      ...(this.overrides ?? {}),
    };

    try {
      if (!value) {
        if (policy.required) {
          throw new FileValidationError('File is required', 'FILE_REQUIRED');
        }
        return value;
      }

      if (Array.isArray(value)) {
        await this.validation.validateMany(MulterAdapter.toUploadInputs(value), policy);
      } else if (isMulterFile(value)) {
        await this.validation.validate(MulterAdapter.toUploadInput(value), policy);
      } else {
        for (const files of Object.values(value)) {
          if (Array.isArray(files)) {
            await this.validation.validateMany(MulterAdapter.toUploadInputs(files), policy);
          }
        }
      }
    } catch (e) {
      if (e instanceof FileValidationError) {
        throw new UnprocessableEntityException({
          code: e.code,
          message: e.message,
          details: e.details,
        });
      }
      throw e;
    }

    return value;
  }
}

export const MulterValidationPipeWith = (
  override: Partial<ValidationPolicy> | false,
): Type<PipeTransform> => {
  @Injectable()
  class ConfiguredValidationPipe extends MulterValidationPipe {
    constructor(
      validation: FileValidationService,
      @Inject(STORAGE_CONFIG) config: ResolvedStorageConfig,
    ) {
      super(validation, config);
      this.overrides = override;
    }
  }
  return mixin(ConfiguredValidationPipe);
};

function isMulterFile(value: unknown): value is MulterFile {
  return (
    typeof value === 'object' &&
    value !== null &&
    'buffer' in value &&
    'originalname' in value &&
    'mimetype' in value
  );
}
