// Step 1 - Create embeddings table schema to store vector embeddings alongside text chunks
import { nanoid } from '@/lib/utils';
import { index, pgTable, text, varchar, vector } from 'drizzle-orm/pg-core';
import { resources } from './resources';

export const embeddings = pgTable(
  'embeddings',
  {
    id: varchar('id', { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    // Step 1a - Foreign key linking each embedding back to its original resource
    resourceId: varchar('resource_id', { length: 191 }).references(
      () => resources.id,
      { onDelete: 'cascade' },
    ),
    // Step 1b - The plain text chunk that was embedded
    content: text('content').notNull(),
    // Step 1c - The vector representation (384 dimensions for HuggingFace all-MiniLM-L6-v2 model)
    embedding: vector('embedding', { dimensions: 384 }).notNull(),
  },
  table => ({
    // Step 1d - HNSW index for fast cosine similarity searches on the embedding column
    embeddingIndex: index('embeddingIndex').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops'),
    ),
  }),
);
