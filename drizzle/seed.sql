-- BindBench demo seed data.
-- Run:  npm run db:seed
--    or: psql "$DATABASE_URL" -f drizzle/seed.sql
-- Safe to run multiple times (ON CONFLICT DO NOTHING).
-- The demo project below uses mock predictions; see BOLTZ_MOCK in .env.example.

-- Demo target: EGFR kinase domain
INSERT INTO targets (id, name, uniprot_id, sequence) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'EGFR kinase domain', 'P00533',
 'MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR')
ON CONFLICT (id) DO NOTHING;

-- Demo compounds: well-known small molecules (source: demo)
INSERT INTO compounds (id, name, smiles, source) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-000000000001', 'Erlotinib', 'COCCOC1=C(C=C2C(=C1)C(=NC=N2)NC3=CC=CC(=C3)C#C)OCCOC', 'demo'),
('bbbbbbbb-bbbb-bbbb-bbbb-000000000002', 'Gefitinib', 'COC1=C(C=C2C(=C1)C(=NC=N2)NC3=CC(=C(C=C3)F)Cl)OCCCN4CCOCC4', 'demo'),
('bbbbbbbb-bbbb-bbbb-bbbb-000000000003', 'Imatinib', 'CC1=C(C=C(C=C1)NC(=O)C2=CC=C(C=C2)CN3CCN(CC3)C)NC4=NC=CC(=N4)C5=CN=CC=C5', 'demo'),
('bbbbbbbb-bbbb-bbbb-bbbb-000000000004', 'Ibuprofen', 'CC(C)CC1=CC=C(C=C1)C(C)C(=O)O', 'demo'),
('bbbbbbbb-bbbb-bbbb-bbbb-000000000005', 'Paracetamol', 'CC(=O)NC1=CC=C(O)C=C1', 'demo'),
('bbbbbbbb-bbbb-bbbb-bbbb-000000000006', 'Aspirin', 'CC(=O)OC1=CC=CC=C1C(=O)O', 'demo'),
('bbbbbbbb-bbbb-bbbb-bbbb-000000000007', 'Caffeine', 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C', 'demo')
ON CONFLICT (id) DO NOTHING;

-- Demo project
INSERT INTO projects (id, name, description, target_id, status) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'EGFR pilot screen',
 'Demo project: approved drugs and common small molecules screened against the EGFR kinase domain (mock predictions).',
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'completed')
ON CONFLICT (id) DO NOTHING;

-- Demo screen (completed)
INSERT INTO screens (id, project_id, target_id, status, total_count, completed_count) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd',
 'cccccccc-cccc-cccc-cccc-cccccccccccc',
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
 'completed', 7, 7)
ON CONFLICT (id) DO NOTHING;

-- Demo predictions (mock affinity values, kcal/mol; lower is stronger)
INSERT INTO predictions (id, screen_id, compound_id, target_id, status,
  affinity_pred_value, affinity_probability_binary, confidence_score, completed_at) VALUES
('eeeeeeee-eeee-eeee-eeee-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'succeeded', -10.4, 0.97, 0.95, now()),
('eeeeeeee-eeee-eeee-eeee-000000000002', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'succeeded', -9.9, 0.95, 0.93, now()),
('eeeeeeee-eeee-eeee-eeee-000000000003', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'succeeded', -9.2, 0.91, 0.90, now()),
('eeeeeeee-eeee-eeee-eeee-000000000004', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'succeeded', -6.1, 0.62, 0.71, now()),
('eeeeeeee-eeee-eeee-eeee-000000000005', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'succeeded', -5.4, 0.55, 0.68, now()),
('eeeeeeee-eeee-eeee-eeee-000000000006', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'succeeded', -4.8, 0.48, 0.63, now()),
('eeeeeeee-eeee-eeee-eeee-000000000007', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'succeeded', -4.2, 0.41, 0.59, now())
ON CONFLICT (id) DO NOTHING;
