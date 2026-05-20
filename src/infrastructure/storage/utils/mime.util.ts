const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  heif: 'image/heif',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  txt: 'text/plain',
  json: 'application/json',
  mp4: 'video/mp4',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export function mimeFromExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot < 0) return 'application/octet-stream';
  const ext = filename.substring(dot + 1).toLowerCase();
  return EXT_TO_MIME[ext] ?? 'application/octet-stream';
}
