CREATE TABLE IF NOT EXISTS meals (
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch')),
  PRIMARY KEY (member_id, date, meal_type)
);
