INSERT INTO
  organizations (id, name)
VALUES
  (1, 'PLATFORM_ADMIN'),
  (2, 'Acme Inc.');

INSERT INTO
  users (id, email, first_name, last_name, firebase_uid)
VALUES
  (
    1,
    'admin@email.com',
    'Admin',
    'User',
    'REPLACE_WITH_ACTUAL_UID'
  ),
  (
    2,
    'test@email.com',
    'Test',
    'User',
    'REPLACE_WITH_ACTUAL_UID'
  );

INSERT INTO
  user_organizations (user_id, organization_id, role)
VALUES
  (1, 1, 'super-admin'),
  (1, 2, 'owner'),
  (2, 2, 'user');
