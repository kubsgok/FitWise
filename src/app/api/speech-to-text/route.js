// app/api/speech-to-text/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { writeFileSync, unlinkSync, readFileSync, statSync } from 'fs';
import { tmpdir } from 'os';
import { join, extname } from 'path';

// Wire FFmpeg binary
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
console.log('[STT] Using FFmpeg at:', ffmpegInstaller.path);

export async function POST(request) {
  let inputPath, outputPath;

  try {
    const formData = await request.formData();
    // Accept either 'audio' (our client) or 'file' (some tools/curl)
    const audioFile = formData.get('audio') || formData.get('file');

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error('[STT] ELEVENLABS_API_KEY missing');
      return NextResponse.json({ error: 'API configuration error' }, { status: 500 });
    }

    const modelId = process.env.ELEVENLABS_STT_MODEL || 'scribe_v1'; // <- set in .env.local if different

    // ---- Save upload to a temp file ----------------------------------------------------
    const tempDir = tmpdir();
    const ts = Date.now();

    const originalName = (audioFile.name || 'input');
    const originalExt = extname(originalName).toLowerCase();

    // Guess an extension from MIME if needed
    const guessedExt =
      (audioFile.type?.includes('wav') && '.wav') ||
      (audioFile.type?.includes('mp4') && '.m4a') ||
      (audioFile.type?.includes('ogg') && '.ogg') ||
      (audioFile.type?.includes('webm') && '.webm') ||
      originalExt ||
      '.webm';

    inputPath = join(tempDir, `in-${ts}${guessedExt}`);

    const arrayBuffer = await audioFile.arrayBuffer();
    const inputBuf = Buffer.from(arrayBuffer);
    writeFileSync(inputPath, inputBuf);

    const inSize = statSync(inputPath).size;
    console.log('[STT] Saved upload', {
      name: originalName,
      mime: audioFile.type,
      bytes: inSize,
      inputPath
    });

    if (inSize === 0) {
      return NextResponse.json({ error: 'Uploaded audio is empty (0 bytes)' }, { status: 400 });
    }

    // ---- If already WAV, skip FFmpeg ---------------------------------------------------
    const isAlreadyWav = audioFile.type?.includes('wav') || inputPath.endsWith('.wav');
    if (isAlreadyWav) {
      console.log('[STT] Input is already WAV – skipping FFmpeg');
      outputPath = inputPath;
    } else {
      // ---- Convert to 16kHz mono WAV via FFmpeg ---------------------------------------
      outputPath = join(tempDir, `out-${ts}.wav`);
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .inputOption('-hide_banner')
          .on('start', cmd => console.log('[STT] FFmpeg cmd:', cmd))
          .on('stderr', line => console.log('[STT] FFmpeg stderr:', line))
          .toFormat('wav')
          .audioCodec('pcm_s16le')
          .audioFrequency(16000)
          .audioChannels(1)
          .on('end', () => {
            console.log('[STT] FFmpeg conversion completed');
            resolve();
          })
          .on('error', (err) => {
            console.error('[STT] FFmpeg conversion error:', err);
            reject(new Error(`Audio conversion failed: ${err.message}`));
          })
          .save(outputPath);
      });
    }

    // ---- Read the WAV buffer -----------------------------------------------------------
    const wavBuffer = readFileSync(outputPath);
    console.log('[STT] WAV ready (bytes):', wavBuffer.length);
    if (!wavBuffer.length) {
      return NextResponse.json({ error: 'Converted WAV file is empty' }, { status: 500 });
    }

    // ---- Build ElevenLabs request ------------------------------------------------------
    const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
    const elevenLabsFormData = new FormData();
    elevenLabsFormData.append('file', wavBlob, 'audio.wav');

    // ✅ REQUIRED by ElevenLabs: model_id
    elevenLabsFormData.append('model_id', modelId);

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: elevenLabsFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[STT] ElevenLabs error:', response.status, errorText);
      // Surface enough info to debug quickly
      return NextResponse.json(
        {
          error: 'Transcription failed',
          providerStatus: response.status,
          providerText: errorText?.slice(0, 600),
        },
        { status: response.status }
      );
    }

    const result = await response.json().catch(e => {
      console.error('[STT] Failed to parse provider JSON:', e);
      return null;
    });

    if (!result || !result.text) {
      console.error('[STT] No text in provider result:', result);
      return NextResponse.json({ error: 'No speech detected in audio' }, { status: 400 });
    }

    return NextResponse.json({ text: result.text, success: true });

  } catch (err) {
    console.error('[STT] Route fatal error:', err);
    return NextResponse.json({ error: 'Failed to convert audio format' }, { status: 500 });
  } finally {
    // Cleanup temp files (avoid deleting when output == input)
    try {
      if (inputPath && outputPath && inputPath !== outputPath) {
        unlinkSync(inputPath);
        console.log('[STT] Cleaned input file');
      }
      if (outputPath && inputPath !== outputPath) {
        unlinkSync(outputPath);
        console.log('[STT] Cleaned output file');
      }
    } catch (e) {
      console.warn('[STT] Cleanup warning:', e?.message || e);
    }
  }
}