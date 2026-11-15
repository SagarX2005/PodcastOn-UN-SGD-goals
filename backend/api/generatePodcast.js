// api/generatePodcast.js
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { createClient } from "@supabase/supabase-js";

const CHUNK_LIMIT = 2800;

function chunkText(text) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + CHUNK_LIMIT, text.length);
    if (end < text.length) {
      const period = text.lastIndexOf(".", end);
      if (period > start) end = period + 1;
    }
    chunks.push(text.slice(start, end).trim());
    start = end;
  }
  return chunks;
}

async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (c) => chunks.push(c));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { podcastId } = req.body;
  if (!podcastId) return res.status(400).json({ error: "Missing podcastId" });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );

  const polly = new PollyClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  try {
    // Fetch script + language
    const { data, error } = await supabase
      .from("podcasts")
      .select("id, title, script, language")
      .eq("id", podcastId)
      .single();

    if (error) throw error;
    if (!data.script) throw new Error("No script found");

    let voiceId = "Joanna";
    let engine = "neural";
    const lang = data.language?.toLowerCase();

    console.log("Language from DB:", lang);

    switch (lang) {
      case "en":
        voiceId = "Matthew"; engine = "neural"; break; // Male
      case "es":
        voiceId = "Enrique"; engine = "standard"; break; // Male
      case "fr":
        voiceId = "Mathieu"; engine = "standard"; break; // Male
      case "de":
        voiceId = "Daniel"; engine = "neural"; break; // Male

      case "hi":
        voiceId = "Aditi"; engine = "standard"; break;
      case "ar":
        voiceId = "Zeina"; engine = "standard"; break;
      case "zh":
        voiceId = "Zhiyu"; engine = "standard"; break;
      case "ja":
        voiceId = "Takumi"; engine = "standard"; break; // Male Japanese

      default:
        voiceId = "Joanna"; engine = "neural"; break;
    }

    console.log("Selected Voice:", voiceId, "| Engine:", engine);

    // Generate audio in chunks
    const chunks = chunkText(data.script);
    const buffers = [];

    for (let i = 0; i < chunks.length; i++) {
      const command = new SynthesizeSpeechCommand({
        Text: chunks[i],
        OutputFormat: "mp3",
        VoiceId: voiceId,
        Engine: engine,
      });

      const response = await polly.send(command);
      const audioBuffer = await streamToBuffer(response.AudioStream);
      buffers.push(audioBuffer);
    }

    const finalBuffer = Buffer.concat(buffers);
    const filename = `podcast_${podcastId}.mp3`;

    const { error: uploadError } = await supabase.storage
      .from("podcasts")
      .upload(filename, finalBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from("podcasts")
      .getPublicUrl(filename);

    const publicUrl = publicUrlData.publicUrl;

    await supabase
      .from("podcasts")
      .update({ audio_url: publicUrl })
      .eq("id", podcastId);

    return res.status(200).json({
      success: true,
      audioUrl: publicUrl,
      voiceUsed: voiceId,
      engineUsed: engine,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
