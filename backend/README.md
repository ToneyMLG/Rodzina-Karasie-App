# Family Tree Backend

Express.js REST API backend for the family tree application.

## Setup

1. Copy `.env.example` to `.env` and fill in your Supabase and OpenAI credentials:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`.

## Environment Variables

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Supabase service role key (optional)
- `OPENAI_API_KEY` - OpenAI API key (required for AI features)
- `OPENAI_MODEL` - GPT model (default: gpt-4o-mini)
- `OPENAI_IMAGE_MODEL` - Image generation model (default: dall-e-3)
- `OPENAI_AUDIO_MODEL` - Audio transcription model (default: whisper-1)
- `CLIENT_URL` - Frontend URL for CORS (default: http://localhost:5173)

## API Endpoints

### Family Members

- `GET /api/members` - Get all members
- `GET /api/members/:id` - Get single member
- `POST /api/members` - Create member
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member

### Photos

- `GET /api/photos` - Get all photos
- `POST /api/photos` - Upload photo (multipart/form-data)
- `PUT /api/photos/:id` - Update photo metadata
- `DELETE /api/photos/:id` - Delete photo

### AI Features

- `POST /api/ai/analyze` - Analyze image with vision API
- `POST /api/ai/generate-portrait` - Generate portrait using DALL-E
- `POST /api/ai/transcribe` - Transcribe audio using Whisper

## File Upload

Photo uploads use multer for multipart/form-data handling. Max file size is 10MB.

## Error Handling

All endpoints include comprehensive error handling. Errors are returned as JSON with status codes and error messages.
