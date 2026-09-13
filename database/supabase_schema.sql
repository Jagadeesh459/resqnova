-- ==============================================================================
-- ResQNova: Master Supabase Schema & Realtime Bus Configuration
-- Target Region: Vijayawada / NTR District Urban Flood Mesh
-- PostgreSQL / Supabase SQL Standard DDL
-- ==============================================================================

-- 1. Intersections Table (Graph Vertices V for A* and D* Lite)
CREATE TABLE IF NOT EXISTS public.intersections (
    node_id TEXT PRIMARY KEY,
    name TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    elevation_m DOUBLE PRECISION DEFAULT 20.0,
    district TEXT DEFAULT 'NTR',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Roads Table (Directed Topological Edges E for A* and D* Lite)
CREATE TABLE IF NOT EXISTS public.roads (
    id TEXT PRIMARY KEY,
    road_id TEXT,
    road_name TEXT,
    district TEXT DEFAULT 'NTR',
    source_node TEXT,
    target_node TEXT,
    start_lat DOUBLE PRECISION,
    start_lng DOUBLE PRECISION,
    end_lat DOUBLE PRECISION,
    end_lng DOUBLE PRECISION,
    distance_m DOUBLE PRECISION DEFAULT 2500.0,
    travel_time_sec DOUBLE PRECISION DEFAULT 600.0,
    status TEXT DEFAULT 'open',
    blocked_reason TEXT,
    coordinates JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safe Column Upgrades (Guarantees missing columns are added to pre-existing tables)
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

-- Backfill road_id from id if road_id is NULL
UPDATE public.roads SET road_id = COALESCE(road_id, id::text) WHERE road_id IS NULL AND id IS NOT NULL;

-- Safe Indexes for sub-millisecond A* and D* Lite expansion
CREATE UNIQUE INDEX IF NOT EXISTS idx_roads_road_id_unique ON public.roads(road_id);
CREATE INDEX IF NOT EXISTS idx_roads_source ON public.roads(source_node);
CREATE INDEX IF NOT EXISTS idx_roads_target ON public.roads(target_node);
CREATE INDEX IF NOT EXISTS idx_roads_status ON public.roads(status);
CREATE INDEX IF NOT EXISTS idx_roads_road_id ON public.roads(road_id);

-- 2. Citizen Requests Table
CREATE TABLE IF NOT EXISTS public.citizen_requests (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    citizen_name TEXT,
    citizen_phone TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address_hint TEXT,
    people_count INTEGER DEFAULT 1,
    children_count INTEGER DEFAULT 0,
    elderly_count INTEGER DEFAULT 0,
    emergency_type TEXT DEFAULT 'Flood Trapped',
    medical_urgency TEXT DEFAULT 'none',
    risk_level TEXT DEFAULT 'Moderate',
    risk_score INTEGER DEFAULT 50,
    priority_score INTEGER DEFAULT 50,
    status TEXT DEFAULT 'pending',
    assigned_team_id TEXT,
    assigned_ambulance_id TEXT,
    assigned_shelter_id TEXT,
    assigned_hospital_id TEXT,
    ai_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Rescue Teams Table
CREATE TABLE IF NOT EXISTS public.rescue_teams (
    id TEXT PRIMARY KEY,
    team_name TEXT NOT NULL,
    leader TEXT NOT NULL,
    phone TEXT,
    personnel INTEGER DEFAULT 6,
    equipment TEXT,
    status TEXT DEFAULT 'available',
    deployment_zone TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Ambulances Table
CREATE TABLE IF NOT EXISTS public.ambulances (
    id TEXT PRIMARY KEY,
    vehicle_code TEXT NOT NULL,
    driver_name TEXT,
    phone TEXT,
    status TEXT DEFAULT 'available',
    fuel INTEGER DEFAULT 100,
    crew_size INTEGER DEFAULT 3,
    deployment_zone TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Shelters Table
CREATE TABLE IF NOT EXISTS public.shelters (
    id TEXT PRIMARY KEY,
    shelter_name TEXT NOT NULL,
    address TEXT,
    capacity INTEGER NOT NULL,
    occupancy INTEGER DEFAULT 0,
    available_capacity INTEGER NOT NULL,
    food_stock TEXT DEFAULT 'Good',
    water_stock TEXT DEFAULT 'Good',
    power_backup BOOLEAN DEFAULT TRUE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Hospitals Table
CREATE TABLE IF NOT EXISTS public.hospitals (
    id TEXT PRIMARY KEY,
    hospital_name TEXT NOT NULL,
    address TEXT,
    available_beds INTEGER DEFAULT 100,
    emergency_capacity INTEGER DEFAULT 30,
    icu_beds INTEGER DEFAULT 10,
    ambulances_available INTEGER DEFAULT 4,
    contact_number TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Risk Zones Table
CREATE TABLE IF NOT EXISTS public.risk_zones (
    id TEXT PRIMARY KEY,
    zone_name TEXT NOT NULL,
    district TEXT DEFAULT 'NTR',
    risk_level TEXT DEFAULT 'Moderate',
    risk_score INTEGER DEFAULT 50,
    water_level_m DOUBLE PRECISION DEFAULT 0.5,
    polygon JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Rescue Missions Table
CREATE TABLE IF NOT EXISTS public.rescue_missions (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    rescue_team_id TEXT,
    ambulance_id TEXT,
    status TEXT DEFAULT 'assigned',
    route_coordinates JSONB,
    eta_minutes INTEGER,
    replan_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Enable Realtime Replication in Supabase
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.intersections;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.roads;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.citizen_requests;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.rescue_teams;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ambulances;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.shelters;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.hospitals;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
END $$;
