import { defineFunction } from '@aws-amplify/backend';

export const adminStats = defineFunction({
  name: 'admin-stats',
  entry: './handler.ts',
  timeoutSeconds: 20,
});
