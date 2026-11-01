/**
 * Client-Side Audio Recorder with Genuine WAV (PCM) Encoding
 * Kannada Kaliri — Milestone 11.5 Voice Experience
 *
 * Ensures audio recorded in any modern browser (Chrome, Edge, Firefox, Safari)
 * produces a genuine 16-bit Linear PCM WAV file (16kHz mono), perfectly
 * compatible with Gnani Prisma STT and other enterprise speech recognizers.
 *
 * Avoids WebM-to-STT rejection (HTTP 400: UNSUPPORTED_AUDIO_FORMAT).
 */

export interface RecordedAudioResult {
  blob: Blob;
  mimeType: 'audio/wav' | string;
  durationSeconds: number;
}

export interface AudioRecorderController {
  stop: () => Promise<RecordedAudioResult>;
  cancel: () => void;
  getDuration: () => number;
}

/**
 * Encodes Float32 mono PCM samples into standard 16-bit PCM RIFF/WAVE Blob.
 */
export function encodeWAV(samples: Float32Array, sampleRate: number = 16000): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');

  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true); // NumChannels (1 for Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)

  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Write 16-bit signed PCM audio samples (clamped between -1.0 and 1.0)
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Linear interpolation downsampler to convert any native hardware sample rate (e.g. 44100Hz, 48000Hz)
 * to standard 16000Hz PCM required by Gnani Prisma STT and telecom speech engines.
 */
export function downsampleTo16000(samples: Float32Array, inputSampleRate: number): Float32Array {
  if (!inputSampleRate || inputSampleRate === 16000 || samples.length === 0) {
    return samples;
  }
  const ratio = inputSampleRate / 16000;
  const newLength = Math.round(samples.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const origIndex = i * ratio;
    const index1 = Math.floor(origIndex);
    const index2 = Math.min(index1 + 1, samples.length - 1);
    const weight = origIndex - index1;
    result[i] = samples[index1] * (1 - weight) + samples[index2] * weight;
  }

  return result;
}

export function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Starts recording authentic 16kHz mono WAV audio from the user's microphone.
 */
export async function startAudioRecording(
  maxSeconds: number = 15,
  onProgress?: (seconds: number) => void
): Promise<AudioRecorderController> {
  if (typeof window === 'undefined') {
    throw new Error('Recording is only supported in browser environments.');
  }

  if (!navigator?.mediaDevices?.getUserMedia) {
    throw new Error('Audio recording is not supported on this browser or platform.');
  }

  // Request user microphone with optimal speech parameters
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 16000,
      channelCount: 1,
    },
  });

  const AudioContextClass =
    window.AudioContext ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error('Web Audio API is not supported in this browser.');
  }

  const audioContext = new AudioContextClass({ sampleRate: 16000 });
  const actualSampleRate = audioContext.sampleRate || 16000;
  const source = audioContext.createMediaStreamSource(stream);

  // Buffer size 4096 gives ~0.25s chunks at 16kHz
  const processor = audioContext.createScriptProcessor(4096, 1, 1);
  const sampleChunks: Float32Array[] = [];
  let totalSamples = 0;
  const startTime = Date.now();
  let isRecording = true;

  processor.onaudioprocess = (e) => {
    if (!isRecording) return;
    const input = e.inputBuffer.getChannelData(0);
    const chunk = new Float32Array(input.length);
    chunk.set(input);
    sampleChunks.push(chunk);
    totalSamples += chunk.length;
  };

  source.connect(processor);
  processor.connect(audioContext.destination);

  // Duration timer
  const timer = setInterval(() => {
    if (!isRecording) return;
    const elapsed = Math.min(maxSeconds, Math.floor((Date.now() - startTime) / 1000));
    onProgress?.(elapsed);
  }, 1000);

  const cleanup = () => {
    isRecording = false;
    clearInterval(timer);
    try {
      processor.disconnect();
      source.disconnect();
    } catch {
      // Ignore disconnect errors
    }
    try {
      audioContext.close();
    } catch {
      // Ignore audioContext close errors
    }
    // Stop all audio hardware tracks to turn off recording indicator
    stream.getTracks().forEach((track) => track.stop());
  };

  return {
    getDuration: () => Math.floor((Date.now() - startTime) / 1000),
    cancel: () => {
      cleanup();
    },
    stop: async (): Promise<RecordedAudioResult> => {
      const durationSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      cleanup();

      if (totalSamples === 0) {
        throw new Error('Empty recording detected. Please speak clearly into your microphone.');
      }

      // Flatten PCM chunks
      const flattened = new Float32Array(totalSamples);
      let offset = 0;
      for (const chunk of sampleChunks) {
        flattened.set(chunk, offset);
        offset += chunk.length;
      }

      // Downsample to exactly 16000 Hz if hardware ran at 44100 Hz or 48000 Hz
      const resampled = downsampleTo16000(flattened, actualSampleRate);

      // Encode directly to genuine RIFF/WAVE at 16000 Hz
      const wavBlob = encodeWAV(resampled, 16000);

      return {
        blob: wavBlob,
        mimeType: 'audio/wav',
        durationSeconds,
      };
    },
  };
}
