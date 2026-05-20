import {
  Inject,
  Injectable,
  mixin,
  PipeTransform,
  Type,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ResolvedStorageConfig } from '../../config/storage-config';
import { STORAGE_CONFIG, STORAGE_IMAGE_PROCESSOR } from '../../config/storage-tokens';
import { StorageError } from '../../core/errors/storage.error';
import { CompressionPolicy } from '../../processing/compression-policy';
import { IImageProcessor } from '../../processing/image-processor.interface';
import { MulterAdapter, MulterFile } from '../multer.adapter';

type IncomingFiles = MulterFile | MulterFile[] | Record<string, MulterFile[]> | undefined;

@Injectable()
export class MulterImagePipe implements PipeTransform {
  protected overrides: Partial<CompressionPolicy> | false | undefined = undefined;

  constructor(
    @Inject(STORAGE_IMAGE_PROCESSOR) private readonly processor: IImageProcessor,
    @Inject(STORAGE_CONFIG) private readonly config: ResolvedStorageConfig,
  ) {}

  async transform(value: IncomingFiles): Promise<IncomingFiles> {
    if (this.overrides === false) return value;
    if (!value) return value;

    const policy: CompressionPolicy = {
      ...this.config.defaultCompression,
      ...(this.overrides ?? {}),
    };
    if (!policy.enabled) return value;

    if (Array.isArray(value)) {
      return Promise.all(value.map((f) => this.processFile(f, policy)));
    }
    if (isMulterFile(value)) {
      return this.processFile(value, policy);
    }

    const result: Record<string, MulterFile[]> = {};
    for (const [key, files] of Object.entries(value)) {
      result[key] = Array.isArray(files)
        ? await Promise.all(files.map((f) => this.processFile(f, policy)))
        : files;
    }
    return result;
  }

  private async processFile(file: MulterFile, policy: CompressionPolicy): Promise<MulterFile> {
    try {
      const input = MulterAdapter.toUploadInput(file);
      const processed = await this.processor.process(input, policy);
      return MulterAdapter.fromUploadInput(file, processed);
    } catch (e) {
      if (e instanceof StorageError) {
        throw new UnprocessableEntityException({
          code: 'IMAGE_PROCESSING_FAILED',
          message: e.message,
        });
      }
      throw e;
    }
  }
}

export const MulterImagePipeWith = (
  override: Partial<CompressionPolicy> | false,
): Type<PipeTransform> => {
  @Injectable()
  class ConfiguredImagePipe extends MulterImagePipe {
    constructor(
      @Inject(STORAGE_IMAGE_PROCESSOR) processor: IImageProcessor,
      @Inject(STORAGE_CONFIG) config: ResolvedStorageConfig,
    ) {
      super(processor, config);
      this.overrides = override;
    }
  }
  return mixin(ConfiguredImagePipe);
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
