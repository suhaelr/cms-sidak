-- Demo users for local development and testing.
-- Password for all accounts: demo123
-- Login at /admin/login — see /demo-credentials in dev for the full list.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_user record;
  v_encrypted_pw text;
BEGIN
  FOR v_user IN
    SELECT *
    FROM (VALUES
      ('11111111-1111-1111-1111-111111111111'::uuid, 'superadmin@bgn.go.id', 'Super Admin', 'super_admin'::public.app_role),
      ('22222222-2222-2222-2222-222222222222'::uuid, 'adminpusat@bgn.go.id', 'Admin Pusat', 'admin_pusat'::public.app_role),
      ('33333333-3333-3333-3333-333333333333'::uuid, 'adminwilayah@bgn.go.id', 'Admin Wilayah', 'admin_wilayah'::public.app_role),
      ('44444444-4444-4444-4444-444444444444'::uuid, 'inspektor@bgn.go.id', 'Inspektor', 'inspektor'::public.app_role),
      ('55555555-5555-5555-5555-555555555555'::uuid, 'verifikator@bgn.go.id', 'Verifikator', 'verifikator'::public.app_role)
    ) AS t(id, email, full_name, role)
  LOOP
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_user.email) THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (v_user.id, v_user.role)
      ON CONFLICT (user_id, role) DO NOTHING;
      CONTINUE;
    END IF;

    v_encrypted_pw := crypt('demo123', gen_salt('bf'));

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user.id,
      'authenticated',
      'authenticated',
      v_user.email,
      v_encrypted_pw,
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', v_user.full_name),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    INSERT INTO auth.identities (
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user.id,
      v_user.id,
      jsonb_build_object('sub', v_user.id::text, 'email', v_user.email),
      'email',
      now(),
      now(),
      now()
    );

    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user.id, v_user.role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END LOOP;
END $$;
