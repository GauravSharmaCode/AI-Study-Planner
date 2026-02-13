-- AI Schedule Service Database Initialization
-- This script sets up the basic database structure for the AI Schedule Service

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user for the service (optional, for additional security)
-- CREATE USER schedule_service_app WITH ENCRYPTED PASSWORD 'schedule_service_pass';
-- GRANT CONNECT ON DATABASE ai_schedule_db TO schedule_service_app;
-- GRANT USAGE ON SCHEMA public TO schedule_service_app;
-- GRANT CREATE ON SCHEMA public TO schedule_service_app;

-- Set timezone
SET timezone = 'UTC';

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'AI Schedule Service Database initialized at %', NOW();
END $$;
