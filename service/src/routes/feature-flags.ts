import { Elysia } from 'elysia';
import { featureFlags } from '../lib/feature-flags';
import { doc, ok } from '../openapi/helper';

export const featureFlagsRoutes = new Elysia({ prefix: '/feature-flags' })
  .get(
    '/',
    async () => {
      const flags = await featureFlags.refresh();
      return {
        enabled: featureFlags.isEnabled(),
        flags,
      };
    },
    doc(
      'Get menu feature flags',
      'Returns show/hide state for portal and admin menus. Backed by an Unleash-compatible provider (GitLab Feature Flags or standalone Unleash).',
      'Feature Flags',
      { responses: ok('Feature flag map', { enabled: true, flags: { menu_sidak_management: true } }) },
    ),
  );
