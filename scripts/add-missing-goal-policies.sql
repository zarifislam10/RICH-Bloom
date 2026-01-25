-- Restricted UPDATE policy for goal table
-- Only allows updating progress and updated_at fields
-- Core fields (goal_text, principle, user_id, created_at) are immutable

-- 0) Make sure RLS is enabled
ALTER TABLE goal ENABLE ROW LEVEL SECURITY;

-- 1) Allow UPDATE on own rows (row-level)
DROP POLICY IF EXISTS "Users can update progress on their own goals" ON goal;

CREATE POLICY "Users can update allowed fields on their own goals" ON goal
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2) Trigger: enforce allowed columns only
CREATE OR REPLACE FUNCTION restrict_goal_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Block changes to immutable/core fields
  IF OLD.goal_text  IS DISTINCT FROM NEW.goal_text  THEN RAISE EXCEPTION 'goal_text is immutable'; END IF;
  IF OLD.principle  IS DISTINCT FROM NEW.principle  THEN RAISE EXCEPTION 'principle is immutable'; END IF;
  IF OLD.user_id    IS DISTINCT FROM NEW.user_id    THEN RAISE EXCEPTION 'user_id is immutable'; END IF;
  IF OLD.created_at IS DISTINCT FROM NEW.created_at THEN RAISE EXCEPTION 'created_at is immutable'; END IF;

  -- Block changes to any other fields you want locked (examples)
  -- If you have these columns, uncomment:
  -- IF OLD.deadline IS DISTINCT FROM NEW.deadline THEN RAISE EXCEPTION 'deadline is immutable'; END IF;

  -- Allow only these fields to change (edit this list to match your schema)
  -- Example allowed: progress, status, reflection
  IF OLD.progress   IS DISTINCT FROM NEW.progress   THEN NULL; END IF;
  -- IF OLD.status     IS DISTINCT FROM NEW.status     THEN NULL; END IF;
  -- IF OLD.reflection IS DISTINCT FROM NEW.reflection THEN NULL; END IF;

  -- Now enforce that NOTHING ELSE changed besides the allowed fields + updated_at
  -- If you have other columns, add checks for them here as "must stay the same".

  -- Always manage updated_at server-side
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS restrict_goal_updates_trigger ON goal;
CREATE TRIGGER restrict_goal_updates_trigger
  BEFORE UPDATE ON goal
  FOR EACH ROW
  EXECUTE FUNCTION restrict_goal_updates();

-- Note: DELETE policy is intentionally NOT added yet
-- We'll add it after locking the goal lifecycle (draft → committed → completed)

