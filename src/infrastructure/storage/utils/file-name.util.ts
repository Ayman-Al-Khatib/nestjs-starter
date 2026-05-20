export function extractExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  if (idx <= 0) return '';
  return name.substring(idx + 1).toLowerCase();
}

export function extractBaseName(name: string): string {
  const idx = name.lastIndexOf('.');
  if (idx <= 0) return name;
  return name.substring(0, idx);
}

export function uniqueFileName(originalName: string, overrideExtension?: string): string {
  const safe = (originalName ?? '').replace(/[\/\\]/g, '-').replace(/\0/g, '');
  const originalExt = extractExtension(safe);
  const baseName = extractBaseName(safe)
    .replace(/\s+/g, '-')
    .replace(/^\.+/, '')
    .replace(/-+/g, '-') || 'file';
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  const ext = overrideExtension || originalExt;
  return ext ? `${baseName}-${timestamp}-${random}.${ext}` : `${baseName}-${timestamp}-${random}`;
}
