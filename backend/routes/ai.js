import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import { supabase } from '../supabaseClient.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post('/analyze', upload.single('image'), async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ error: 'OpenAI API key not configured' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const base64Image = req.file.buffer.toString('base64');
    const mediaType = req.file.mimetype;

    const response = await openai.vision.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mediaType};base64,${base64Image}`
              }
            },
            {
              type: 'text',
              text: 'Analyze this family photo. Describe the people, their apparent relationships, the setting, and any notable details about the photograph. Keep the analysis concise and factual.'
            }
          ]
        }
      ],
      max_tokens: 1024
    });

    const analysis = response.choices[0].message.content;

    res.json({ analysis });
  } catch (error) {
    if (error.status === 401) {
      return next(new Error('Invalid OpenAI API key'));
    }
    next(error);
  }
});

router.post('/generate-portrait', async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ error: 'OpenAI API key not configured' });
    }

    const { memberId, description } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const prompt = `Create a portrait of a family member. ${description}. Make it realistic and formal, suitable for a family tree display.`;

    const response = await openai.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard'
    });

    const imageUrl = response.data[0].url;

    if (memberId) {
      const { error: updateError } = await supabase
        .from('family_members')
        .update({ profile_picture: imageUrl })
        .eq('id', memberId);

      if (updateError) {
        console.warn('Warning: Failed to update member profile picture:', updateError);
      }
    }

    res.json({ imageUrl });
  } catch (error) {
    if (error.status === 401) {
      return next(new Error('Invalid OpenAI API key'));
    }
    next(error);
  }
});

router.post('/transcribe', upload.single('audio'), async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ error: 'OpenAI API key not configured' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: new File([req.file.buffer], 'audio.mp3', { type: req.file.mimetype }),
      model: process.env.OPENAI_AUDIO_MODEL || 'whisper-1',
      language: 'en'
    });

    res.json({ text: transcription.text });
  } catch (error) {
    if (error.status === 401) {
      return next(new Error('Invalid OpenAI API key'));
    }
    next(error);
  }
});

export default router;
