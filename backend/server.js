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

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL) {
  console.error('Missing required environment variable: SUPABASE_URL');
  process.exit(1);
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const KEY_FILE = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '..', 'service-account.json');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const ttsClient = new textToSpeech.TextToSpeechClient({ keyFilename: KEY_FILE });

const PORT = 3001;
const CHUNK_LIMIT = 4500;
const MAX_BODY_SIZE = 10 * 1024; // 10 KB
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// In-memory rate limiting: 10 requests per rolling 60 seconds per user
const rateLimitMap = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 10;
  const timestamps = (rateLimitMap.get(userId) || []).filter(t => now - t < windowMs);
  if (timestamps.length >= maxRequests) {
    rateLimitMap.set(userId, timestamps);
    return false;
  }
  timestamps.push(now);
  rateLimitMap.set(userId, timestamps);
  return true;
}

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
  try {
    // 2. Authorization header check
    const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    const token = authHeader.slice(7).trim();

    // 3. Verify user with Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    // Rate limit check for authenticated user
    if (!checkRateLimit(user.id)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Too many requests' }));
      return;
    }

    // 4. Validate podcastId format
    const { podcastId } = req.body || {};
    if (!podcastId || typeof podcastId !== 'string' || !UUID_REGEX.test(podcastId)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid podcastId' }));
      return;
    }

    // 5. Fetch podcast row
    const { data: podcast, error: fetchError } = await supabase
      .from('podcasts')
      .select('id, user_id, script, language')
      .eq('id', podcastId)
      .single();

    if (fetchError || !podcast) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Podcast not found' }));
      return;
    }

    // 6. Check ownership
    if (podcast.user_id !== user.id) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Forbidden' }));
      return;
    }

    if (!podcast.script) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No script text found for this podcast' }));
      return;
    }

    // 7. Synthesize audio
    const voice = getVoiceConfig(podcast.language);
    const chunks = chunkText(podcast.script);
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
      console.error('Upload to Supabase storage failed:', uploadError?.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
      return;
    }

    const { data: urlData } = supabase.storage.from('podcasts').getPublicUrl(filename);
    const publicUrl = urlData.publicUrl;

    console.log(`[Audio Generator] Updating podcast row with audio_url`);
    const { error: updateError } = await supabase
      .from('podcasts')
      .update({ audio_url: publicUrl })
      .eq('id', podcastId);

    if (updateError) {
      console.error('Failed to update podcast audio_url:', updateError?.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
      return;
    }

    console.log(`[Audio Generator] Complete! Returning success.`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      audioUrl: publicUrl,
      voiceUsed: voice.name,
    }));
  } catch (err) {
    console.error('Audio generation error:', err?.message || 'Unknown error');
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }
}

function setCorsHeaders(res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Vary', 'Origin');
  }
}

const server = http.createServer((req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/api/generatePodcast' && req.method === 'POST') {
    let bodyStr = '';
    let bodyLength = 0;
    let isTooLarge = false;

    req.on('data', chunk => {
      if (isTooLarge) return;
      bodyLength += chunk.length;
      if (bodyLength > MAX_BODY_SIZE) {
        isTooLarge = true;
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload too large' }));
        req.destroy();
        return;
      }
      bodyStr += chunk;
    });

    req.on('end', async () => {
      if (isTooLarge) return;
      try {
        req.body = bodyStr ? JSON.parse(bodyStr) : {};
      } catch (parseErr) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        return;
      }
      try {
        await handleGeneratePodcast(req, res);
      } catch (err) {
        console.error('Server error:', err?.message || 'Unknown error');
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
        }
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
