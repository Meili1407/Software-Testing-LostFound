-- Add a human-readable, sequential claim number (used to render codes like CLM-00001).
-- SERIAL backfills existing rows with sequential values automatically.
ALTER TABLE "Claim" ADD COLUMN "claimNumber" SERIAL;
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_claimNumber_key" UNIQUE ("claimNumber");
