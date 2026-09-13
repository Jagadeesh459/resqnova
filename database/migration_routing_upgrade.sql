-- ==============================================================================
-- ResQNova: Safe Routing Schema Migration (Non-Destructive In-Place Upgrade)
-- Preserves all existing tables and data while upgrading for OSM & A*/D* Lite Routing
-- Target: Supabase PostgreSQL (Vijayawada / NTR District)
-- ==============================================================================

-- 1. Ensure Intersections Table Exists (Graph Vertices V)
CREATE TABLE IF NOT EXISTS public.intersections (
    node_id TEXT PRIMARY KEY,
    name TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    elevation_m DOUBLE PRECISION DEFAULT 20.0,
    district TEXT DEFAULT 'NTR',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ensure Roads Table Exists (if not already created)
CREATE TABLE IF NOT EXISTS public.roads (
    id TEXT PRIMARY KEY,
    road_name TEXT,
    district TEXT DEFAULT 'NTR',
    status TEXT DEFAULT 'open',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. In-Place Non-Destructive Column Upgrades for public.roads
-- Adds all required routing columns safely without modifying or dropping existing columns
ALTER TABLE public.roads ADD COLUMN IF NOT EXISTS road_id TEXT;
ALTER TABLE public.roads ADD COLUMN IF NOT EXISTS road_name TEXT;
ALTER TABLE public.roads ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'NTR';
ALTER TABLE public.roads ADD COLUMN IF NOT EXISTS source_node TEXT;
ALTER TABLE public.roads ADD COLUMN IF NOT EXISTS target_node TEXT;
ALTER TABLE public.roads ADD COLUMN IF NOT EXISTS start_lat DOUBLE PRECISION;
ALTER TABLE public.roads ADD COLUMN IF NOT EXISTS start_lng DOUBLE PRECISION;
ALTER TABLE public.roads ADD COLUMN IF NOT EXISTS end_lat DOUBLE PRECISION;
ALTER TABLE public.roads ADD COLUMN IF NOT EXISTS end_lng DOUBLE PRECISION;
ALTER TABLE public.roads ADD COLUMN IF NOT EXISTS distance_m DOUBLE PRECISION DEFAULT 2500.0;
ALTER TABLE public.roads ADD COLUMN IF NOT EXISTS travel_time_sec DOUBLE PRECISION DEFAULT 600.0;
ALTER TABLE public.roads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';
ALTER TABLE public.roads ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
ALTER TABLE public.roads ADD COLUMN IF NOT EXISTS coordinates JSONB;
ALTER TABLE public.roads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Backfill road_id from id for any existing records where road_id is NULL
UPDATE public.roads 
SET road_id = COALESCE(road_id, id::text)
WHERE road_id IS NULL AND id IS NOT NULL;

-- 5. Safe Unique Index for road_id (Preserving whatever Primary Key already exists on roads)
CREATE UNIQUE INDEX IF NOT EXISTS idx_roads_road_id_unique ON public.roads (road_id);

-- 6. Safe Routing Graph Traversal Indexes (Only created after columns are verified)
CREATE INDEX IF NOT EXISTS idx_roads_source ON public.roads (source_node);
CREATE INDEX IF NOT EXISTS idx_roads_target ON public.roads (target_node);
CREATE INDEX IF NOT EXISTS idx_roads_status ON public.roads (status);
CREATE INDEX IF NOT EXISTS idx_roads_road_id ON public.roads (road_id);
CREATE INDEX IF NOT EXISTS idx_intersections_coords ON public.intersections (latitude, longitude);

-- 7. Safe Supabase Realtime Publication Inclusion (Handles already-included tables gracefully)
DO $$
BEGIN
    -- Enable Realtime for intersections
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.intersections;
        EXCEPTION WHEN duplicate_object THEN
            -- Table is already in the publication, ignore
            NULL;
        END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.roads;
        EXCEPTION WHEN duplicate_object THEN
            -- Table is already in the publication, ignore
            NULL;
        END;
    END IF;
END $$;

