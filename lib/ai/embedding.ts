// Step 2 - Embedding logic: chunking text, generating embeddings, and finding relevant content
// Uses Hugging Face Inference API for embeddings (free) and Groq for chat
import { db } from '../db';
import { cosineDistance, desc, gt, sql } from 'drizzle-orm';
import { embeddings } from '../db/schema/embeddings';

// Step 2a - Define the Hugging Face embedding model (all-MiniLM-L6-v2, 384 dimensions, free)
const HF_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}/pipeline/feature-extraction`;

// Step 2b - Helper to call Hugging Face Inference API for embeddings
const hfEmbed = async (texts: string[]): Promise<number[][]> => {
  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: texts }),
  });
  if (!response.ok) {
    throw new Error(`HuggingFace API error: ${response.statusText}`);
  }
  return response.json();
};

// Step 2c - Split source material into smaller chunks by splitting on periods
const generateChunks = (input: string): string[] => {
  return input
    .trim()
    .split('.')
    .filter(i => i !== '');
};

// Step 2d - Generate embeddings for all chunks of a given text (used when saving resources)
export const generateEmbeddings = async (
  value: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const chunks = generateChunks(value);
  const embeddingVectors = await hfEmbed(chunks);
  return embeddingVectors.map((e, i) => ({ content: chunks[i], embedding: e }));
};

// Step 2e - Generate a single embedding for a query string (used when searching)
export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll('\\n', ' ');
  const [embedding] = await hfEmbed([input]);
  return embedding;
};

// Step 2f - Find relevant content by embedding the user's query and searching for similar chunks
export const findRelevantContent = async (userQuery: string) => {
  const userQueryEmbedded = await generateEmbedding(userQuery);
  // Calculate cosine similarity between the query embedding and stored embeddings
  const similarity = sql<number>`1 - (${cosineDistance(
    embeddings.embedding,
    userQueryEmbedded,
  )})`;
  // Return top 4 chunks with similarity > 0.5
  const similarGuides = await db
    .select({ name: embeddings.content, similarity })
    .from(embeddings)
    .where(gt(similarity, 0.5))
    .orderBy(t => desc(t.similarity))
    .limit(4);
  return similarGuides;
};
