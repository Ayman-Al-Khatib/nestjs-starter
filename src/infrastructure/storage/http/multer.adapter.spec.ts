import { MulterAdapter, MulterFile } from './multer.adapter';

function multerFile(over: Partial<MulterFile> = {}): MulterFile {
  return {
    fieldname: 'photo',
    originalname: 'avatar.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: 1024,
    buffer: Buffer.from('img'),
    ...over,
  } as MulterFile;
}

describe('MulterAdapter', () => {
  it('maps a Multer file to the storage UploadInput shape', () => {
    const input = MulterAdapter.toUploadInput(multerFile());
    expect(input).toEqual({
      buffer: Buffer.from('img'),
      originalName: 'avatar.png',
      mimeType: 'image/png',
      size: 1024,
    });
  });

  it('maps an array of files', () => {
    const inputs = MulterAdapter.toUploadInputs([
      multerFile({ originalname: 'a.png' }),
      multerFile({ originalname: 'b.png' }),
    ]);
    expect(inputs).toHaveLength(2);
    expect(inputs.map((i) => i.originalName)).toEqual(['a.png', 'b.png']);
  });

  it('rehydrates a Multer file from a (processed) UploadInput, preserving other fields', () => {
    const original = multerFile({ fieldname: 'avatar' });
    const processed = {
      buffer: Buffer.from('resized'),
      originalName: 'avatar.webp',
      mimeType: 'image/webp',
      size: 512,
    };
    const result = MulterAdapter.fromUploadInput(original, processed);
    expect(result.fieldname).toBe('avatar');
    expect(result.originalname).toBe('avatar.webp');
    expect(result.mimetype).toBe('image/webp');
    expect(result.size).toBe(512);
    expect(result.buffer).toEqual(Buffer.from('resized'));
  });
});
