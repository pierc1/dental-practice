insert into services (name, duration_minutes)
values
  ('Cleaning', 60),
  ('Consultation', 30),
  ('Whitening', 60),
  ('Emergency Exam', 30)
on conflict (name) do update
set duration_minutes = excluded.duration_minutes;

-- Mon-Fri 9:00-17:00, 30-min slots
insert into availability (day_of_week, start_time, end_time, slot_length_minutes)
values
  (1, '09:00', '17:00', 30),
  (2, '09:00', '17:00', 30),
  (3, '09:00', '17:00', 30),
  (4, '09:00', '17:00', 30),
  (5, '09:00', '17:00', 30)
on conflict (day_of_week, start_time, end_time, slot_length_minutes) do nothing;
