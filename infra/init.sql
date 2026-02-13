-- Initialize database with required extensions and basic setup
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_type') THEN
        CREATE TYPE schedule_type AS ENUM ('DAILY', 'WEEKLY');
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_study_plans_user_id ON "StudyPlan"("userId");
CREATE INDEX IF NOT EXISTS idx_schedules_study_plan_id ON "Schedule"("studyPlanId");
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON "Schedule"("userId");
CREATE INDEX IF NOT EXISTS idx_schedules_day_number ON "Schedule"("dayNumber");

-- Insert default data if needed
-- INSERT INTO "User" (id, email, name, "createdAt", "updatedAt") 
-- VALUES ('default-user-id', 'demo@example.com', 'Demo User', NOW(), NOW())
-- ON CONFLICT (email) DO NOTHING;
