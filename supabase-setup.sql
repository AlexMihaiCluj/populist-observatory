-- ============================================================
-- POPULIST DISCOURSE OBSERVATORY — Supabase Database Setup
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. Create the analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title         TEXT NOT NULL,
  claim_text    TEXT NOT NULL,
  source        TEXT,
  country       TEXT NOT NULL,
  category      TEXT NOT NULL,
  party         TEXT,
  verdict       TEXT NOT NULL,
  summary       TEXT NOT NULL,
  full_analysis TEXT,
  author_name   TEXT NOT NULL,
  author_email  TEXT NOT NULL,
  points        INTEGER DEFAULT 0,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- 3. Policy: anyone can read approved analyses
CREATE POLICY "Public can read approved analyses"
  ON analyses FOR SELECT
  USING (status = 'approved');

-- 4. Policy: anyone can insert (submit) new analyses
CREATE POLICY "Anyone can submit analyses"
  ON analyses FOR INSERT
  WITH CHECK (true);

-- 5. Policy: only authenticated service role can update/delete
--    (you manage moderation via Supabase Dashboard or API with service key)

-- 6. Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_analyses_country ON analyses(country);
CREATE INDEX IF NOT EXISTS idx_analyses_category ON analyses(category);
CREATE INDEX IF NOT EXISTS idx_analyses_created ON analyses(created_at DESC);

-- 7. Optional: insert sample data so the platform doesn't look empty
INSERT INTO analyses (title, claim_text, source, country, category, party, verdict, summary, full_analysis, author_name, author_email, points, status) VALUES
(
  'Claim: ''Brussels bureaucrats decide everything for Romania''',
  'Brussels bureaucrats decide everything for Romania',
  'Facebook post, 12 Feb 2026',
  'Romania',
  'EU Governance',
  'AUR',
  'Mostly False',
  'While some policy areas involve shared competence between Romania and the EU, the characterisation of EU institutions as deciding everything is a significant distortion of the multi-level governance framework. Romania retains sovereignty over taxation, education, healthcare, and most social policy.',
  'This analysis examines the claim that EU institutions override national sovereignty in Romania. Under the Treaty on the Functioning of the European Union, competences are divided into exclusive, shared, and supporting categories. Romania maintains full control over taxation, education, healthcare, culture, and public order. In shared competence areas like agriculture or environment, Romania participates in decision-making through the Council of the EU. The European Parliament, which includes Romanian MEPs elected by Romanian citizens, co-legislates most EU law. The claim conflates supranational coordination with unilateral imposition, ignoring that Romania has veto power in the Council on sensitive matters like foreign policy and taxation.',
  'Maria Popescu',
  'maria.popescu@stud.ubbcluj.ro',
  45,
  'approved'
),
(
  'Claim: ''The EU imposes migration quotas against the will of the people''',
  'The EU imposes migration quotas against the will of the people',
  'Campaign rally transcript, 25 Jan 2026',
  'Hungary',
  'Migration',
  'Fidesz',
  'Misleading',
  'While relocation mechanisms were proposed, the claim omits that the New Pact on Migration and Asylum includes a solidarity contribution option. Member states can choose financial contributions over physical relocations.',
  'The 2015 Council Decision on relocation quotas was indeed controversial and faced opposition from Hungary, Poland, and others. However, the claim presents an outdated picture. The New Pact on Migration and Asylum (2024) replaced mandatory quotas with a flexible solidarity mechanism. Member states can choose between relocating asylum seekers, making financial contributions, or providing operational support. Hungary participated in the Council negotiations and had opportunities to shape the outcome. The framing of imposition ignores the legislative process in which all member states participate through qualified majority voting in the Council.',
  'Andrei Tudor',
  'andrei.tudor@stud.ubbcluj.ro',
  52,
  'approved'
),
(
  'Claim: ''EU Green Deal will destroy European industry and jobs''',
  'EU Green Deal will destroy European industry and jobs',
  'X/Twitter thread, 27 Feb 2026',
  'France',
  'Climate Policy',
  'Rassemblement National',
  'Exaggerated',
  'The Green Deal involves industrial transformation rather than destruction. While certain sectors face disruption, the Just Transition Fund and industrial policy frameworks aim to mitigate employment effects. Job creation in green sectors is projected to offset losses.',
  'The European Green Deal is a comprehensive package aiming for climate neutrality by 2050. While it does involve phasing out certain carbon-intensive activities, it simultaneously creates new economic opportunities. The European Commission estimates that the clean energy transition could create up to 1 million additional jobs by 2030. The Just Transition Fund (€17.5 billion for 2021-2027) specifically targets regions dependent on fossil fuels. The claim ignores these compensatory mechanisms and presents a one-sided narrative of economic destruction without acknowledging the economic costs of inaction on climate change.',
  'Elena Munteanu',
  'elena.munteanu@stud.ubbcluj.ro',
  61,
  'approved'
),
(
  'Claim: ''Unelected EU officials control our national budget''',
  'Unelected EU officials control our national budget',
  'Television interview, 18 Feb 2026',
  'Italy',
  'EU Governance',
  'Lega',
  'Mostly False',
  'The European Semester involves recommendations, not binding budget control. National parliaments retain sovereignty over fiscal policy, though the Stability and Growth Pact sets deficit and debt parameters for eurozone members.',
  NULL,
  'Luca Draghici',
  'luca.draghici@stud.ubbcluj.ro',
  38,
  'approved'
),
(
  'Claim: ''Poland receives nothing from the EU while paying billions''',
  'Poland receives nothing from the EU while paying billions',
  'Campaign leaflet, Jan 2026',
  'Poland',
  'EU Budget',
  'Konfederacja',
  'False',
  'Poland has been the largest net recipient of EU cohesion funds since accession. Between 2014-2020, Poland received approximately EUR 86 billion while contributing roughly EUR 42 billion, resulting in a significant net positive transfer.',
  NULL,
  'Sofia Kowalska',
  'sofia.kowalska@stud.ubbcluj.ro',
  55,
  'approved'
),
(
  'Claim: ''The EU vaccine procurement was a complete failure''',
  'The EU vaccine procurement was a complete failure',
  'YouTube video, 8 Mar 2026',
  'Romania',
  'Public Health',
  'S.O.S. România',
  'Misleading',
  'Initial delays in procurement occurred, but the EU ultimately secured sufficient doses and achieved comparable vaccination rates to other developed regions. Centralised procurement ensured equitable distribution across member states including smaller countries that would have struggled to negotiate independently.',
  NULL,
  'Radu Constantinescu',
  'radu.const@stud.ubbcluj.ro',
  42,
  'approved'
);
