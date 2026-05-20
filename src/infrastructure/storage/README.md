# Storage Module

Pluggable file storage with validation, image compression, and unified public/private URL access. One API, many providers.

## Layers

```
┌─────────────────────────────────────────────────────────┐
│  HTTP layer (NestJS)                                    │
│  decorators · pipes · multer adapter                    │
└─────────────┬───────────────────────────────────────────┘
              │ UploadInput
┌─────────────▼───────────────────────────────────────────┐
│  StorageService (facade)                                │
│  upload · delete · exists · read · getAccessUrl         │
└──┬──────────┬──────────────┬────────────────────────────┘
   │          │              │
┌──▼───┐  ┌───▼────┐    ┌────▼─────────────┐
│ valid│  │process │    │ IStorageProvider │
│ation │  │  Sharp │    │  Local | Supabase│
└──────┘  └────────┘    └──────────────────┘
```

- **core/** — pure domain (no NestJS): types, enums, errors.
- **validation/** — pluggable validators. Add a rule = implement `IFileValidator`.
- **processing/** — `IImageProcessor` (Sharp impl).
- **providers/** — `IStorageProvider`. Add a backend = implement the interface.
- **service/** — `StorageService` facade (the only entry-point feature code uses).
- **http/** — Multer adapter, validation/compression pipes, upload decorators.

## Configuration

### Environment variables

| Var | Required when | Notes |
|---|---|---|
| `STORAGE_DRIVER` | always | `local` or `supabase` (default: `local`) |
| `STORAGE_SIGNING_SECRET` | always | ≥32 chars, used by Local provider for signed URLs |
| `APP_URL` | `STORAGE_DRIVER=local` | Absolute base URL for Local file links, e.g. `http://localhost:3000` |
| `STORAGE_LOCAL_PATH` | `STORAGE_DRIVER=local` | Directory where files live, e.g. `./uploads` |
| `STORAGE_SUPABASE_URL` | `STORAGE_DRIVER=supabase` | |
| `STORAGE_SUPABASE_SECRET_KEY` | `STORAGE_DRIVER=supabase` | |
| `STORAGE_SUPABASE_BUCKET_PUBLIC` | `STORAGE_DRIVER=supabase` | |
| `STORAGE_SUPABASE_BUCKET_PRIVATE` | `STORAGE_DRIVER=supabase` | |

### Module registration

```ts
StorageModule.forRoot({
  global: true,
  signedUrlTtlSeconds: 3600,
  defaultValidation: { maxSize: '5MB', allowedExtensions: ['png', 'jpg', 'jpeg'] },
  defaultCompression: { enabled: true, quality: 80, maxOutputSize: '150KB' },
});
```

All fields are optional. Defaults live in `config/defaults.ts`.

## Quick start

```ts
import { StorageService, Visibility, MulterAdapter } from 'shared/services/storage';

@Controller('photos')
export class PhotosController {
  constructor(private readonly storage: StorageService) {}

  @Post()
  @UploadSingle('photo')
  async uploadPhoto(@ProcessedFile() file: Express.Multer.File) {
    const stored = await this.storage.upload(MulterAdapter.toUploadInput(file), {
      visibility: Visibility.PUBLIC,
      folder: 'photos',
    });
    return { key: stored.key };
  }
}
```

## Public vs Private

Visibility is **per upload**, not per module:

```ts
// Public — accessible via stable URL
const cover = await storage.upload(input, {
  visibility: Visibility.PUBLIC,
  folder: 'covers',
});

// Private — accessible only via signed URL
const xray = await storage.upload(input, {
  visibility: Visibility.PRIVATE,
  folder: 'patients/42/xrays',
});
```

Visibility is encoded in the key prefix (`public/...` or `private/...`), so the service can route URL lookups without external state.

### Retrieving a URL

```ts
const { url, expiresAt } = await storage.getAccessUrl(stored.key);
// public  → stable URL
// private → signed URL with default TTL (overridable: { ttlSeconds: 600 })
```

`getAccessUrls(keys)` returns the same shape for an array.

### Existence check

Existence is a domain concern — feature services call it where needed:

```ts
if (!(await storage.exists(dto.imageKey))) {
  throw new BadRequestException('storage_file.not_found');
}
```

## Per-upload overrides

Both validation and compression accept partial overrides or `false` to disable:

```ts
await storage.upload(input, {
  visibility: Visibility.PUBLIC,
  validation: { maxSize: '20MB', allowedExtensions: ['pdf'] },
  compression: false,
});
```

Per-route HTTP-level overrides:

```ts
@Post()
@UploadSingle('doc')
async uploadDoc(
  @ProcessedFile({
    validation: { allowedExtensions: ['pdf'], maxSize: '10MB' },
    compression: false,
  })
  file: Express.Multer.File,
) {
  /* ... */
}
```

## HTTP decorators

```ts
@UploadSingle('file')                     // single file
@UploadMany('files', 5)                   // up to N files
@UploadFields([{ name: 'avatar' }, { name: 'banner' }])

@ProcessedFile()                          // single + validate + compress
@ProcessedFiles()                         // many + validate + compress
```

Use `@UploadedFile()` / `@UploadedFiles()` directly when you want the raw Multer object.

## Adding a new provider (S3, R2, Azure, …)

1. Implement `IStorageProvider` (`save`, `delete`, `exists`, `read`, `publicUrl`, `signedUrl`).
2. Add a value to `StorageDriver` enum.
3. Register in `storage.module.ts`'s `buildStorageProvider()` factory.

The provider is the only piece that touches the backend SDK — validation, compression, and the service layer stay untouched.

```ts
@Injectable()
export class S3StorageProvider extends BaseStorageProvider implements IStorageProvider {
  async save(input: UploadInput, target: SaveTarget): Promise<StoredFile> { /* ... */ }
  async delete(key: string): Promise<void> { /* ... */ }
  async exists(key: string): Promise<boolean> { /* ... */ }
  async read(key: string): Promise<Buffer> { /* ... */ }
  publicUrl(key: string): string { /* ... */ }
  async signedUrl(key: string, ttlSeconds: number): Promise<AccessUrl> { /* ... */ }
}
```

## Local provider — how URLs work

- **Public files** are served at `GET /storage/public/<key>` (no auth).
- **Private files** are served at `GET /storage/private/<key>?token=<HMAC>&exp=<unix>`, guarded by `LocalStreamGuard` which verifies the HMAC-SHA256 token (key + expiry, signed with `STORAGE_SIGNING_SECRET`) and rejects expired requests.
- Behavior matches Supabase: `getAccessUrl()` returns the public URL for public keys and a time-bound signed URL for private keys.
- Files are stored under `${STORAGE_LOCAL_PATH}/public/...` and `${STORAGE_LOCAL_PATH}/private/...`.

## Errors

Domain errors live in `core/errors`:

- `StorageError` — base
- `FileValidationError` — validation failure with `code` + `details`
- `FileNotFoundError` — `key` not present in storage
- `StorageProviderError` — wraps backend failures (Supabase, fs, etc.)

The HTTP validation pipe converts `FileValidationError` → `UnprocessableEntityException` with the same `code` for client mapping.

## Testing

The layered design makes mocking trivial — inject any of:

- `STORAGE_PROVIDER` to swap the backend in tests
- `STORAGE_IMAGE_PROCESSOR` to skip Sharp work
- `STORAGE_VALIDATORS` to control the validation pipeline
