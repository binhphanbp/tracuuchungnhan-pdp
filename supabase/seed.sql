-- =============================================================================
-- PDP Certificates — optional seed data
-- =============================================================================
-- Run this AFTER 0001/0002/0003. Creates one demo campaign + a few demo
-- certificates so the public lookup form has something to test against.
--
-- Replace `<YOUR_AUTH_USER_UUID>` below with your own auth.users.id once
-- you've signed up your first admin via the login page (or skip the
-- `created_by` column entirely — it's nullable).
-- =============================================================================

insert into public.campaigns
  (id, title, slug, description, issue_date, signer_name, signer_title, status)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'Chứng nhận PolyPass — Khóa 05/2026',
    'polypass-2026-05',
    'Khóa chương trình phát triển kỹ năng PolyPass dành cho sinh viên FPT Polytechnic TP.HCM.',
    '2026-05-06',
    'Nguyễn Văn Minh',
    'Trưởng phòng PDP',
    'published'
  )
on conflict (id) do nothing;

insert into public.certificates (
  id, campaign_id, student_code, full_name, full_name_normalized,
  class_name, certificate_title, issue_date, file_name,
  verification_code, qr_payload, status
) values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    '11111111-1111-1111-1111-111111111111',
    'PS43995',
    'Nguyễn Văn An',
    'NGUYEN VAN AN',
    'GR1701',
    'Chứng nhận PolyPass — Khóa 05/2026',
    '2026-05-06',
    'PS43995_NGUYEN_VAN_AN_POLYPASS_20260506.png',
    'demo-pp-001',
    'https://tracuuchungnhan-pdp.edu.vn/verify/demo-pp-001',
    'published'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    '11111111-1111-1111-1111-111111111111',
    'PS43996',
    'Trần Thị Bích Phương',
    'TRAN THI BICH PHUONG',
    'GR1702',
    'Chứng nhận PolyPass — Khóa 05/2026',
    '2026-05-06',
    'PS43996_TRAN_THI_BICH_PHUONG_POLYPASS_20260506.png',
    'demo-pp-002',
    'https://tracuuchungnhan-pdp.edu.vn/verify/demo-pp-002',
    'published'
  )
on conflict (id) do nothing;
