-- Content Library table for tracking uploaded images/videos with customer notes
-- Uploads go directly to VPS, this table tracks metadata

CREATE TABLE IF NOT EXISTS content_library (
  id SERIAL PRIMARY KEY,
  brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- Original upload info
  original_filename VARCHAR(500) NOT NULL,
  customer_note TEXT,  -- Note from customer describing the content

  -- SEO-optimized info
  seo_filename VARCHAR(500) NOT NULL,  -- SEO-friendly filename
  alt_text VARCHAR(500),  -- SEO alt text derived from note

  -- File metadata
  file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('image', 'video')),
  mime_type VARCHAR(100),
  file_size INTEGER,  -- in bytes
  width INTEGER,
  height INTEGER,

  -- Storage path on VPS (relative to public/clients/{BRAND}/)
  storage_path VARCHAR(1000) NOT NULL,

  -- Category for organization
  category VARCHAR(50) DEFAULT 'uploads' CHECK (category IN ('uploads', 'company-images', 'logos', 'social-posts', 'screenshots', 'other')),

  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'used', 'archived')),

  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_content_library_brand ON content_library(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_library_category ON content_library(category);
CREATE INDEX IF NOT EXISTS idx_content_library_status ON content_library(status);
CREATE INDEX IF NOT EXISTS idx_content_library_created ON content_library(created_at DESC);

-- Full text search on customer notes and filenames
CREATE INDEX IF NOT EXISTS idx_content_library_search ON content_library USING GIN (
  to_tsvector('english', COALESCE(original_filename, '') || ' ' || COALESCE(customer_note, '') || ' ' || COALESCE(seo_filename, ''))
);

COMMENT ON TABLE content_library IS 'Tracks uploaded images/videos with customer-provided notes for SEO naming';
COMMENT ON COLUMN content_library.customer_note IS 'Customer description of what the image/video shows - used for SEO naming';
COMMENT ON COLUMN content_library.seo_filename IS 'SEO-optimized filename generated from customer note';
