-- Create goal table if it doesn't exist
CREATE TABLE IF NOT EXISTS goal (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_text TEXT NOT NULL,
  principle TEXT NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for goal table
ALTER TABLE goal ENABLE ROW LEVEL SECURITY;

-- Create policies for goal table
CREATE POLICY "Users can view their own goals" ON goal
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" ON goal
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON goal
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" ON goal
  FOR DELETE USING (auth.uid() = user_id);

-- Create reflections table
CREATE TABLE IF NOT EXISTS reflections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goal(id) ON DELETE CASCADE,
  principle TEXT NOT NULL,
  reflection_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for reflections table
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- Create policies for reflections table
CREATE POLICY "Users can view their own reflections" ON reflections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reflections" ON reflections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reflections" ON reflections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reflections" ON reflections
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_goal_user_id ON goal(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_created_at ON goal(created_at);
CREATE INDEX IF NOT EXISTS idx_reflections_user_id ON reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_reflections_goal_id ON reflections(goal_id);
CREATE INDEX IF NOT EXISTS idx_reflections_created_at ON reflections(created_at); 