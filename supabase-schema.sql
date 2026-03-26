-- ============================================================================
-- POPULIST DISCOURSE OBSERVATORY — Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- 1. Analyses table: stores all fact-checking reports
CREATE TABLE analyses (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title         TEXT NOT NULL,
  claim_text    TEXT NOT NULL,
  author_name   TEXT NOT NULL,
  author_email  TEXT,
  country       TEXT NOT NULL,
  category      TEXT NOT NULL,
  party         TEXT DEFAULT '',
  source_info   TEXT NOT NULL,
  verdict       TEXT NOT NULL CHECK (verdict IN (
                  'False','Mostly False','Misleading','Exaggerated','Mixed','Mostly True','True'
                )),
  summary       TEXT NOT NULL,
  points        INT DEFAULT 0,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. Leaderboard view: automatically computed from approved analyses
CREATE OR REPLACE VIEW leaderboard AS
  SELECT
    author_name,
    COUNT(*)::INT           AS analyses_count,
    COALESCE(SUM(points),0)::INT AS total_points
  FROM analyses
  WHERE status = 'approved'
  GROUP BY author_name
  ORDER BY total_points DESC;

-- 3. Badges table: tracks earned badges per student
CREATE TABLE badges (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  author_name  TEXT NOT NULL,
  badge_name   TEXT NOT NULL,
  awarded_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(author_name, badge_name)
);

-- 4. Row Level Security: allow public reads, authenticated inserts
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges   ENABLE ROW LEVEL SECURITY;

-- Public can read approved analyses
CREATE POLICY "Public can view approved analyses"
  ON analyses FOR SELECT
  USING (status = 'approved');

-- Anyone can submit (insert) a new analysis (goes to pending)
CREATE POLICY "Anyone can submit analyses"
  ON analyses FOR INSERT
  WITH CHECK (true);

-- Public can view badges
CREATE POLICY "Public can view badges"
  ON badges FOR SELECT
  USING (true);

-- 5. Insert sample data so the platform looks populated from day one
INSERT INTO analyses (title, claim_text, author_name, country, category, party, source_info, verdict, summary, points, status) VALUES
(
  'Claim: ''Brussels bureaucrats decide everything for Romania''',
  'Brussels bureaucrats decide everything for Romania',
  'Maria P.', 'Romania', 'EU Governance', 'AUR',
  'Facebook post, 12 Feb 2026',
  'Mostly False',
  'Analysis of the claim that EU institutions override national sovereignty in Romania. While some policy areas involve shared competence, the characterisation of ''deciding everything'' is a significant distortion of the EU''s multi-level governance framework.',
  45, 'approved'
),
(
  'Claim: ''The EU imposes migration quotas against the will of the people''',
  'The EU imposes migration quotas against the will of the people',
  'Andrei T.', 'Hungary', 'Migration', 'Fidesz',
  'Campaign rally transcript, 25 Jan 2026',
  'Misleading',
  'While relocation mechanisms were proposed, the claim omits that the New Pact on Migration and Asylum includes a solidarity contribution option. Member states can choose financial contributions over physical relocations.',
  52, 'approved'
),
(
  'Claim: ''EU Green Deal will destroy European industry and jobs''',
  'EU Green Deal will destroy European industry and jobs',
  'Elena M.', 'France', 'Climate Policy', 'Rassemblement National',
  'X/Twitter thread, 27 Feb 2026',
  'Exaggerated',
  'The Green Deal involves industrial transformation rather than destruction. While certain sectors face disruption, the Just Transition Fund and industrial policy frameworks aim to mitigate employment effects. Job creation in green sectors is projected to offset losses.',
  61, 'approved'
),
(
  'Claim: ''Unelected EU officials control our national budget''',
  'Unelected EU officials control our national budget',
  'Luca D.', 'Italy', 'EU Governance', 'Lega',
  'Television interview, 18 Feb 2026',
  'Mostly False',
  'The European Semester involves recommendations, not binding budget control. National parliaments retain sovereignty over fiscal policy, though the Stability and Growth Pact framework does set deficit and debt parameters for eurozone members.',
  38, 'approved'
),
(
  'Claim: ''Poland receives nothing from the EU while paying billions''',
  'Poland receives nothing from the EU while paying billions',
  'Sofia K.', 'Poland', 'EU Budget', 'Konfederacja',
  'Campaign leaflet, Jan 2026',
  'False',
  'Poland has been the largest net recipient of EU cohesion funds since accession. Between 2014-2020, Poland received approximately 86 billion EUR in EU funding while contributing roughly 42 billion EUR to the EU budget, resulting in a significant net positive transfer.',
  55, 'approved'
),
(
  'Claim: ''The EU vaccine procurement was a complete failure''',
  'The EU vaccine procurement was a complete failure',
  'Radu C.', 'Romania', 'Public Health', 'S.O.S. Romania',
  'YouTube video, 8 Mar 2026',
  'Misleading',
  'Initial delays in vaccine procurement occurred, but the EU ultimately secured sufficient doses for its population and achieved comparable vaccination rates to other developed regions. The centralised procurement also ensured equitable distribution across member states.',
  42, 'approved'
);

-- Sample badges
INSERT INTO badges (author_name, badge_name) VALUES
  ('Elena M.', 'Fact-Checker Pro'),
  ('Elena M.', 'EU Expert'),
  ('Elena M.', 'Top Contributor'),
  ('Andrei T.', 'Fact-Checker Pro'),
  ('Andrei T.', 'Migration Specialist'),
  ('Sofia K.', 'Budget Analyst'),
  ('Sofia K.', 'Top Contributor'),
  ('Maria P.', 'Governance Expert'),
  ('Luca D.', 'Rising Star'),
  ('Radu C.', 'Newcomer');
