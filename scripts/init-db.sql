-- Database initialization script for PostgreSQL
-- Runs automatically on first container startup

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create schema
CREATE SCHEMA IF NOT EXISTS public;

-- Set default search path
SET search_path TO public;

-- Log initialization completion
SELECT 'Database initialized successfully' as status;
