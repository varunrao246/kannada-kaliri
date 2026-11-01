/**
 * Server-Side Audio Format & Magic Byte Validator
 * Kannada Kaliri — Milestone 11.5 Audio Security
 *
 * Verifies genuine file signatures (magic bytes) to ensure only formats
 * supported by Gnani Prisma STT (wav, mp3, m4a, ogg, flac, aac) are forwarded.
 *
 * Provides clear, actionable error feedback if WebM or unsupported audio is received.
 */

export type GenuineAudioFormat = 'wav' | 'mp3' | 'ogg' | 'm4a' | 'flac' | 'aac' | 'webm' | 'unknown';

export interface AudioInspectionResult {
  isSupportedBySTT: boolean;
  detectedFormat: GenuineAudioFormat;
  mimeType: string;
  fileExtension: string;
  error?: string;
}

/**
 * Detects the real format of an audio buffer by inspecting standard magic numbers.
 */
export function detectAudioFormat(buffer: Buffer): GenuineAudioFormat {
  if (buffer.length < 4) return 'unknown';

  // 1. WAV / RIFF
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WAVE'
  ) {
    return 'wav';
  }

  // 2. Ogg Container
  if (buffer.toString('ascii', 0, 4) === 'OggS') {
    return 'ogg';
  }

  // 3. FLAC
  if (buffer.toString('ascii', 0, 4) === 'fLaC') {
    return 'flac';
  }

  // 4. MP3 (ID3 tag or MPEG-1/2 Audio Layer III sync header)
  if (buffer.length >= 3 && buffer.toString('ascii', 0, 3) === 'ID3') {
    return 'mp3';
  }
  if (
    buffer.length >= 2 &&
    buffer[0] === 0xff &&
    (buffer[1] & 0xe0) === 0xe0 &&
    ((buffer[1] >> 1) & 0x03) !== 0
  ) {
    return 'mp3';
  }

  // 5. M4A / MP4 / AAC (ftyp atom at byte 4)
  if (buffer.length >= 8 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    return 'm4a';
  }

  // ADTS AAC frame header (0xFFF1 or 0xFFF9)
  if (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xf6) === 0xf0) {
    return 'aac';
  }

  // 6. WebM / Matroska (EBML header: 0x1A 0x45 0xDF 0xA3)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return 'webm';
  }

  return 'unknown';
}

/**
 * Inspects audio buffer and checks compatibility against Gnani Prisma STT contract.
 */
export function inspectAudioForSTT(
  buffer: Buffer,
  declaredMimeType?: string
): AudioInspectionResult {
  const detected = detectAudioFormat(buffer);

  // Gnani Prisma strictly supports: flac, mp3, m4a, wav, ogg, aac
  const STT_SUPPORTED_FORMATS: GenuineAudioFormat[] = ['wav', 'mp3', 'ogg', 'm4a', 'flac', 'aac'];

  if (detected === 'webm') {
    return {
      isSupportedBySTT: false,
      detectedFormat: 'webm',
      mimeType: 'audio/webm',
      fileExtension: 'webm',
      error:
        'The uploaded audio format (WebM) is not supported by Gnani Prisma STT. Gnani supports: wav, mp3, m4a, ogg, flac, aac. Please record in WAV format using the updated voice practice recorder.',
    };
  }

  if (STT_SUPPORTED_FORMATS.includes(detected)) {
    const mimeMap: Record<string, string> = {
      wav: 'audio/wav',
      mp3: 'audio/mp3',
      ogg: 'audio/ogg',
      m4a: 'audio/m4a',
      flac: 'audio/flac',
      aac: 'audio/aac',
    };

    return {
      isSupportedBySTT: true,
      detectedFormat: detected,
      mimeType: mimeMap[detected] || declaredMimeType || 'audio/wav',
      fileExtension: detected,
    };
  }

  // Fallback: If magic bytes could not be recognized but declared MIME is an allowable format, check declared
  const cleanDeclared = (declaredMimeType || '').split(';')[0].toLowerCase().trim();
  if (cleanDeclared.includes('wav')) {
    return {
      isSupportedBySTT: true,
      detectedFormat: 'wav',
      mimeType: 'audio/wav',
      fileExtension: 'wav',
    };
  }

  if (cleanDeclared.includes('mp3') || cleanDeclared.includes('mpeg')) {
    return {
      isSupportedBySTT: true,
      detectedFormat: 'mp3',
      mimeType: 'audio/mp3',
      fileExtension: 'mp3',
    };
  }

  if (cleanDeclared.includes('ogg')) {
    return {
      isSupportedBySTT: true,
      detectedFormat: 'ogg',
      mimeType: 'audio/ogg',
      fileExtension: 'ogg',
    };
  }

  return {
    isSupportedBySTT: false,
    detectedFormat: detected,
    mimeType: declaredMimeType || 'application/octet-stream',
    fileExtension: 'bin',
    error: `Unsupported audio format detected. Gnani Prisma STT supports: wav, mp3, m4a, ogg, flac, aac.`,
  };
}

