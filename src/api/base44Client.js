import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, appBaseUrl } = appParams;

export const base44 = createClient({
  appId,
  serverUrl: appBaseUrl || 'https://base44.app',
  appBaseUrl,
});
