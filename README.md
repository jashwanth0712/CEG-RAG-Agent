# RAG Agent - Step-by-Step Guide

A retrieval-augmented generation (RAG) agent that can store and retrieve information from its own knowledge base.

## Steps

### Step 1 - Create Embeddings Table Schema (`lib/db/schema/embeddings.ts`)
- Created a new `embeddings` table to store text chunks and their vector representations
- **Step 1a** - Foreign key (`resourceId`) linking each embedding back to its original resource
- **Step 1b** - `content` column for the plain text chunk
- **Step 1c** - `embedding` column as a 1536-dimension vector (matching OpenAI ada-002 output)
- **Step 1d** - HNSW index on the embedding column for fast cosine similarity searches

### Step 2 - Embedding Logic (`lib/ai/embedding.ts`)
- Created all the functions needed to chunk text, generate embeddings, and search for relevant content
- **Step 2a** - Defined the embedding model (`openai/text-embedding-ada-002` via Vercel AI Gateway)
- **Step 2b** - `generateChunks()` - splits source material into smaller chunks by splitting on periods
- **Step 2c** - `generateEmbeddings()` - generates embeddings for all chunks of a text (used when saving resources)
- **Step 2d** - `generateEmbedding()` - generates a single embedding for a query string (used when searching)
- **Step 2e** - `findRelevantContent()` - embeds the user's query and finds the top 4 similar chunks (similarity > 0.5)

### Step 3 - Update Server Action (`lib/actions/resources.ts`)
- Updated the `createResource` server action to also generate and store embeddings
- **Step 3a** - Imported `generateEmbeddings` and the `embeddings` table
- **Step 3b** - After saving a resource to the DB, chunk it, embed it, and store all embeddings

### Step 4 - Chat API Route (`app/api/chat/route.ts`)
- Created the `/api/chat` POST route that powers the AI agent
- **Step 4a** - Uses GPT-4o model via Vercel AI Gateway
- **Step 4b** - `stopWhen: stepCountIs(5)` allows multi-step calls so the model can call tools and then summarize
- **Step 4c** - System prompt restricts the model to only answer from its knowledge base
- **Step 4d** - `addResource` tool lets the model save new information to the knowledge base
- **Step 4e** - `getInformation` tool lets the model retrieve relevant content via semantic search

### Step 5 - Chat UI (`app/page.tsx`)
- Built the frontend chat interface using the AI SDK's `useChat` hook
- **Step 5a** - `useChat` hook manages chat state and sends messages to `/api/chat`
- **Step 5b** - Renders message parts: text responses and tool call indicators
- **Step 5c** - Shows tool call status (`calling`/`called`) with input details
- **Step 5d** - Input form sends messages on submit via `sendMessage`

## Setup

1. Add your database URL and AI Gateway key to `.env`:
   ```
   DATABASE_URL=your-neon-database-url
   GROQ_API_KEY=your-vercel-ai-gateway-key
   ```
2. Run `pnpm install`
3. Run `pnpm db:migrate` (initial migration)
4. Run `pnpm db:push` (push embeddings table)
5. Run `pnpm run dev`
6. Open http://localhost:3000
