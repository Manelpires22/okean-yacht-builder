-- Update approval_type enum to include commercial and technical
ALTER TYPE approval_type ADD VALUE IF NOT EXISTS 'commercial';
ALTER TYPE approval_type ADD VALUE IF NOT EXISTS 'technical';