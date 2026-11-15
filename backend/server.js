import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import textToSpeech from '@google-cloud/text-to-speech';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const KEY_FILE = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '..', 'service-account.json');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const ttsClient = new textToSpeech.TextToSpeechClient({ keyFilename: KEY_FILE });

const PORT = 3001;
const CHUNK_LIMIT = 4500;

function chunkText(text) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + CHUNK_LIMIT, text.length);
    if (end < text.length) {
      const period = text.lastIndexOf('.', end);
      if (period > start) end = period + 1;
    }
    chunks.push(text.slice(start, end).trim());
    start = end;
  }
  return chunks.filter(c => c.length > 0);
}

function getVoiceConfig(lang) {
  const code = (lang || 'en').toLowerCase().trim();
  switch (code) {
    case 'es': return { languageCode: 'es-ES', name: 'es-ES-Neural2-A', ssmlGender: 'FEMALE' };
    case 'fr': return { languageCode: 'fr-FR', name: 'fr-FR-Neural2-A', ssmlGender: 'FEMALE' };
    case 'de': return { languageCode: 'de-DE', name: 'de-DE-Neural2-A', ssmlGender: 'FEMALE' };
    case 'hi': return { languageCode: 'hi-IN', name: 'hi-IN-Neural2-A', ssmlGender: 'FEMALE' };
    case 'ar': return { languageCode: 'ar-XA', name: 'ar-XA-Wavenet-A', ssmlGender: 'FEMALE' };
    case 'zh': return { languageCode: 'cmn-CN', name: 'cmn-CN-Wavenet-A', ssmlGender: 'FEMALE' };
    case 'ja': return { languageCode: 'ja-JP', name: 'ja-JP-Neural2-B', ssmlGender: 'FEMALE' };
    default: return { languageCode: 'en-US', name: 'en-US-Neural2-F', ssmlGender: 'FEMALE' };
  }
}

async function handleGeneratePodcast(req, res) {
  const { podcastId } = req.body || {};
  if (!podcastId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing podcastId' }));
    return;
  }

  console.log(`[Audio Generator] Processing podcastId: ${podcastId}`);

  // 1. Fetch script + language from Supabase
  const { data, error } = await supabase
    .from('podcasts')
    .select('id, title, script, language')
    .eq('id', podcastId)
    .single();

  if (error || !data) {
    console.error('Failed to fetch podcast from Supabase:', error);
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error?.message || 'Podcast not found' }));
    return;
  }

  if (!data.script) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'No script text found for this podcast' }));
    return;
  }

  const voice = getVoiceConfig(data.language);
  const chunks = chunkText(data.script);
  console.log(`[Audio Generator] Synthesizing ${chunks.length} chunk(s) using voice ${voice.name}...`);

  const audioBuffers = [];
  for (const chunk of chunks) {
    const [ttsResponse] = await ttsClient.synthesizeSpeech({
      input: { text: chunk },
      voice: {
        languageCode: voice.languageCode,
        name: voice.name,
        ssmlGender: voice.ssmlGender,
      },
      audioConfig: { audioEncoding: 'MP3' },
    });
    audioBuffers.push(Buffer.from(ttsResponse.audioContent));
  }

  const finalAudioBuffer = Buffer.concat(audioBuffers);
  const filename = `podcast_${podcastId}.mp3`;

  console.log(`[Audio Generator] Uploading ${finalAudioBuffer.length} bytes to Supabase storage 'podcasts/${filename}'...`);
  const { error: uploadError } = await supabase.storage
    .from('podcasts')
    .upload(filename, finalAudioBuffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    });

  if (uploadError) {
    console.error('Upload to Supabase storage failed:', uploadError);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: uploadError.message }));
    return;
  }

  const { data: urlData } = supabase.storage.from('podcasts').getPublicUrl(filename);
  const publicUrl = urlData.publicUrl;

  console.log(`[Audio Generator] Updating podcast row with audio_url: ${publicUrl}`);
  await supabase
    .from('podcasts')
    .update({ audio_url: publicUrl })
    .eq('id', podcastId);

  console.log(`[Audio Generator] Complete! Returning success.`);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    audioUrl: publicUrl,
    voiceUsed: voice.name,
  }));
}

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/generatePodcast' && req.method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', async () => {
      try {
        req.body = bodyStr ? JSON.parse(bodyStr) : {};
        await handleGeneratePodcast(req, res);
      } catch (err) {
        console.error('Server error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'resona-audio-backend' }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Resona Audio Backend running on http://0.0.0.0:${PORT}`);
});

