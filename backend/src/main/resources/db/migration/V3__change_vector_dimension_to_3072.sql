-- Drop the index first since pgvector depends on the dimension
DROP INDEX IF EXISTS compliance_rules_embedding_idx;

-- Set all existing embeddings to NULL so we don't have dimension mismatch during ALTER
UPDATE compliance_rules SET embedding = NULL;

-- Alter the column to 3072 dimensions
ALTER TABLE compliance_rules ALTER COLUMN embedding TYPE vector(3072);

-- Update the seeded zero vectors to be of length 3072
UPDATE compliance_rules SET embedding = array_fill(0.0, ARRAY[3072])::vector;

-- No index created here: pgvector ivfflat limit is 2000 dimensions, and 3072 exceeds it.
-- For a small dataset (resume project scale), sequential scan (no index) works perfectly and is fast enough.
