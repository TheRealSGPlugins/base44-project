const STORAGE_KEY = 'base44_admin_access';

const getStorage = () => (typeof window !== 'undefined' ? window.localStorage : null);

export const hasAdminAccess = () => getStorage()?.getItem(STORAGE_KEY) === 'true';

export const grantAdminAccess = () => {
  getStorage()?.setItem(STORAGE_KEY, 'true');
};

export const clearAdminAccess = () => {
  getStorage()?.removeItem(STORAGE_KEY);
};

export const verifyAdminCode = async (code, fetchImpl = fetch) => {
  const response = await fetchImpl('/api/admin/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || response.statusText || 'Invalid admin code');
    error.status = response.status;
    error.code = payload.code;
    throw error;
  }

  return payload;
};
