-- Create reflections table
CREATE TABLE IF NOT EXISTS reflections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goal(id) ON DELETE CASCADE,
  principle TEXT NOT NULL,
  reflection_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only see their own reflections
CREATE POLICY "Users can view their own reflections" ON reflections
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy for users to insert their own reflections
CREATE POLICY "Users can insert their own reflections" ON reflections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own reflections
CREATE POLICY "Users can update their own reflections" ON reflections
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy for users to delete their own reflections
CREATE POLICY "Users can delete their own reflections" ON reflections
  FOR DELETE USING (auth.uid() = user_id);
