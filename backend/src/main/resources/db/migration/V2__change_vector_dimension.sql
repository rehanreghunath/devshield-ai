-- Drop the index first since pgvector depends on the dimension
DROP INDEX IF EXISTS compliance_rules_embedding_idx;

-- Set all existing embeddings to NULL so we don't have dimension mismatch during ALTER
UPDATE compliance_rules SET embedding = NULL;

-- Alter the column to 768 dimensions
ALTER TABLE compliance_rules ALTER COLUMN embedding TYPE vector(768);

-- Update the seeded zero vectors to be of length 768
UPDATE compliance_rules SET embedding = array_fill(0.0, ARRAY[768])::vector;

-- Recreate the index with 768 dimensions
CREATE INDEX IF NOT EXISTS compliance_rules_embedding_idx
    ON compliance_rules USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
