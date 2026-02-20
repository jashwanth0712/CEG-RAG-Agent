// Step 2 - Embedding logic: chunking text, generating embeddings, and finding relevant content
import { embed, embedMany } from 'ai';
import { db } from '../db';
import { cosineDistance, desc, gt, sql } from 'drizzle-orm';
import { embeddings } from '../db/schema/embeddings';

// Step 2a - Define the embedding model (OpenAI ada-002 via Vercel AI Gateway)
const embeddingModel = 'openai/text-embedding-ada-002';

// Step 2b - Split source material into smaller chunks by splitting on periods
const generateChunks = (input: string): string[] => {
  return input
    .trim()
    .split('.')
    .filter(i => i !== '');
};

// Step 2c - Generate embeddings for all chunks of a given text (used when saving resources)
export const generateEmbeddings = async (
  value: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const chunks = generateChunks(value);
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });
  return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};

// Step 2d - Generate a single embedding for a query string (used when searching)
export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll('\\n', ' ');
  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });
  return embedding;
};

// Step 2e - Find relevant content by embedding the user's query and searching for similar chunks
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
