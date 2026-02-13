-- User Service Database Initialization
-- This script sets up the basic database structure for the User Service

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user for the service (optional, for additional security)
-- CREATE USER user_service_app WITH ENCRYPTED PASSWORD 'user_service_pass';
-- GRANT CONNECT ON DATABASE user_service_db TO user_service_app;
-- GRANT USAGE ON SCHEMA public TO user_service_app;
-- GRANT CREATE ON SCHEMA public TO user_service_app;

-- Set timezone
SET timezone = 'UTC';

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'User Service Database initialized at %', NOW();
END $$;
