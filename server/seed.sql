-- Bootstrap local admin accounts.
-- Rotate these credentials in deployed environments.
insert into admin_users (username, password_hash, role, is_active)
values
  ('admin1', '$2b$12$zRE8/e4SibmJ7aBKeSS26.5Vi7J../iKt.RP0fSyZpEq38MIGlh.G', 'admin', true),
  ('admin2', '$2b$12$Dj8eF8KQ/6Fp/BziZBxCxOgGpqxmPh1dNnHrDrfTCxi7XPtQClp8.', 'admin', true)
on conflict (username) do nothing;

insert into appointment_types (name, duration_minutes, display_order, is_active)
values
  ('Cleaning', 60, 1, true),
  ('Consultation', 30, 2, true),
  ('Whitening', 60, 3, true),
  ('Emergency Exam', 30, 4, true)
on conflict (name) do update
set
  duration_minutes = excluded.duration_minutes,
  display_order = excluded.display_order,
  is_active = true;

with appointment_type_map as (
  select id, name
  from appointment_types
)
insert into service_catalog (
  name,
  description,
  category,
  duration_minutes,
  price_range,
  image_url,
  appointment_type_id,
  display_order,
  is_featured
)
values
  (
    'Dental Cleaning',
    'Professional cleaning to maintain oral health',
    'General Dentistry',
    60,
    '$120-$180',
    'https://img.freepik.com/free-photo/checkup-dentist-tool-instrument-young_1301-3124.jpg?t=st=1764351049~exp=1764354649~hmac=df57cfbde5c281d94a0c5db7242eaecd983af6fa2c365c77a7e7023500abdd06&w=2000',
    (select id from appointment_type_map where name = 'Cleaning'),
    10,
    true
  ),
  (
    'Teeth Whitening',
    'Advanced whitening treatment for a brighter smile',
    'Cosmetic Dentistry',
    90,
    '$250-$400',
    'https://img.freepik.com/free-photo/close-up-perfect-smile_1149-1021.jpg?t=st=1764351453~exp=1764355053~hmac=fe3d5b1698be22f3292e7cfb5b6dacc3052261ae40334b7ddda61ad8d65e3123&w=1060',
    (select id from appointment_type_map where name = 'Whitening'),
    20,
    true
  ),
  (
    'Invisalign',
    'Clear aligner therapy for teeth straightening',
    'Orthodontics',
    30,
    '$3500-$6000',
    'https://img.freepik.com/free-photo/portrait-beautiful-patient-holding-orthodontic-retainers-dental-clinic_662251-2605.jpg?t=st=1764350984~exp=1764354584~hmac=6d870bae0f29fb8a12d7176d9d60310daa62a0298c64fde6124849fa6b764f98&w=2000',
    (select id from appointment_type_map where name = 'Consultation'),
    30,
    true
  ),
  (
    'Comprehensive Exam & Digital X-Rays',
    'Complete exam with high-definition imaging to baseline your oral health',
    'General Dentistry',
    75,
    '$180-$240',
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80',
    (select id from appointment_type_map where name = 'Consultation'),
    40,
    false
  ),
  (
    'Periodontal Therapy',
    'Deep cleaning and gum therapy to control periodontal disease',
    'General Dentistry',
    75,
    '$280-$450',
    'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800&q=80',
    (select id from appointment_type_map where name = 'Consultation'),
    50,
    false
  ),
  (
    'Same-Day Emergency Visit',
    'Rapid assessment and treatment for toothaches, chips, or swelling',
    'General Dentistry',
    45,
    '$150-$250',
    'https://images.unsplash.com/photo-1509083810045-5c6f41ef0905?w=800&q=80',
    (select id from appointment_type_map where name = 'Emergency Exam'),
    60,
    false
  ),
  (
    'Porcelain Veneers',
    'Custom veneers to correct shape, shade, and symmetry for a camera-ready smile',
    'Cosmetic Dentistry',
    120,
    '$1200-$1800 per tooth',
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80',
    (select id from appointment_type_map where name = 'Consultation'),
    70,
    false
  ),
  (
    'Smile Makeover Consultation',
    'Digital smile design review with a cosmetic dentist to map your ideal results',
    'Cosmetic Dentistry',
    45,
    '$150-$250',
    'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800&q=80',
    (select id from appointment_type_map where name = 'Consultation'),
    80,
    false
  ),
  (
    'Clear Retainers & Retention Plan',
    'Custom retainers and check-ins to keep your alignment stable after treatment',
    'Orthodontics',
    30,
    '$350-$600',
    'https://images.unsplash.com/photo-1585716821083-5cbdd0e95b06?w=800&q=80',
    (select id from appointment_type_map where name = 'Consultation'),
    90,
    false
  ),
  (
    'Bite Alignment Review',
    'Detailed occlusion assessment to fine-tune comfort and jaw balance',
    'Orthodontics',
    35,
    '$180-$300',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
    (select id from appointment_type_map where name = 'Consultation'),
    100,
    false
  ),
  (
    'Dental Implants',
    'Surgically placed implants to restore missing teeth with lasting stability',
    'Oral Surgery',
    90,
    '$2800-$4500',
    'https://images.unsplash.com/photo-1582719478148-9fffeee832b8?w=800&q=80',
    (select id from appointment_type_map where name = 'Consultation'),
    110,
    false
  ),
  (
    'Wisdom Teeth Removal',
    'Gentle extraction with sedation options to protect your comfort',
    'Oral Surgery',
    60,
    '$950-$1600',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&q=80',
    (select id from appointment_type_map where name = 'Consultation'),
    120,
    false
  ),
  (
    'Pediatric Sealants',
    'Protective sealants for cavity-prone molars to keep little smiles healthy',
    'Pediatric Dentistry',
    40,
    '$140-$220',
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80',
    (select id from appointment_type_map where name = 'Consultation'),
    130,
    false
  ),
  (
    'Fluoride Treatment',
    'Quick fluoride varnish to strengthen enamel and prevent decay',
    'Pediatric Dentistry',
    20,
    '$60-$90',
    'https://images.unsplash.com/photo-1588774069160-3e4c61c55185?w=800&q=80',
    (select id from appointment_type_map where name = 'Cleaning'),
    140,
    false
  )
on conflict (name) do update
set
  description = excluded.description,
  category = excluded.category,
  duration_minutes = excluded.duration_minutes,
  price_range = excluded.price_range,
  image_url = excluded.image_url,
  appointment_type_id = excluded.appointment_type_id,
  display_order = excluded.display_order,
  is_featured = excluded.is_featured,
  is_active = true;

-- Mon-Fri 9:00-17:00, 30-min slots
insert into availability (day_of_week, start_time, end_time, slot_length_minutes)
values
  (1, '09:00', '17:00', 30),
  (2, '09:00', '17:00', 30),
  (3, '09:00', '17:00', 30),
  (4, '09:00', '17:00', 30),
  (5, '09:00', '17:00', 30)
on conflict (day_of_week, start_time, end_time, slot_length_minutes) do nothing;
