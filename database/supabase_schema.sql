-- ==============================================================================
-- ResQNova: Master Supabase Schema & Realtime Bus Configuration
-- Target Region: Vijayawada / NTR District Urban Flood Mesh
-- ==============================================================================

-- 1. Roads Table (Directed urban topological edges for A* and D* Lite)
CREATE TABLE IF NOT EXISTS public.roads (
    id TEXT PRIMARY KEY,
    road_name TEXT NOT NULL,
    name TEXT,                                  -- Alias
    district TEXT DEFAULT 'NTR',
    source_node TEXT,                           -- e.g. "NODE_KRISHNA_LANKA_ENTRY"
    target_node TEXT,                           -- e.g. "NODE_BANDAR_ROAD_JCT"
    source_lat DOUBLE PRECISION,
    source_lng DOUBLE PRECISION,
    target_lat DOUBLE PRECISION,
    target_lng DOUBLE PRECISION,
    start_lat DOUBLE PRECISION NOT NULL,
    start_lng DOUBLE PRECISION NOT NULL,
    end_lat DOUBLE PRECISION NOT NULL,
    end_lng DOUBLE PRECISION NOT NULL,
    distance_km DOUBLE PRECISION DEFAULT 2.5,
    travel_time_min DOUBLE PRECISION DEFAULT 10.0,
    travel_time DOUBLE PRECISION DEFAULT 10.0,
    flood_risk DOUBLE PRECISION DEFAULT 0.0,    -- 0.0 (Dry) to 1.0 (Submerged)
    risk_score DOUBLE PRECISION DEFAULT 10.0,   -- 0 to 100
    congestion DOUBLE PRECISION DEFAULT 1.0,    -- 1.0 (Free flow) to 5.0 (Gridlock)
    status TEXT DEFAULT 'open',                 -- 'open' | 'flooded' | 'blocked' | 'restricted'
    blocked_reason TEXT,
    road_type TEXT DEFAULT 'highway',
    coordinates JSONB,                          -- Array of [lat, lng] polyline points
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
    status TEXT DEFAULT 'available',           -- 'available' | 'deployed' | 'docked'
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
    status TEXT DEFAULT 'available',           -- 'available' | 'deployed' | 'maintenance'
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

-- 9. Enable Realtime Replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.roads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.citizen_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rescue_teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ambulances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shelters;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hospitals;
