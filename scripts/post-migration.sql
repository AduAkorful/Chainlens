-- Run this in Supabase SQL Editor AFTER running: npx prisma migrate deploy
-- These cannot be expressed in Prisma schema and must be applied manually.

-- Vector similarity index (IVFFlat — fast approximate search for 768-dim vectors)
CREATE INDEX IF NOT EXISTS doc_chunk_embedding_idx
  ON "DocChunk" USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Full-text search GIN index
CREATE INDEX IF NOT EXISTS doc_chunk_tsv_idx
  ON "DocChunk" USING GIN (tsv);

-- Auto-compute tsvector on insert and update
CREATE OR REPLACE FUNCTION update_chunk_tsv() RETURNS trigger AS $$
BEGIN
  NEW.tsv := to_tsvector('english',
    coalesce(NEW.content, '') || ' ' || coalesce(NEW.heading, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chunk_tsv_update
  BEFORE INSERT OR UPDATE ON "DocChunk"
  FOR EACH ROW EXECUTE FUNCTION update_chunk_tsv();
