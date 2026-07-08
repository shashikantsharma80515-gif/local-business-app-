export const TOKEN_KEY = 'medimarket_token';
export const USER_KEY = 'medimarket_user';

export const getToken = () => typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

export const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  const u = localStorage.getItem(USER_KEY);
  try {
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};

export const saveAuth = (token: string, user: unknown) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuth = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getDashboardRoute = (role: string) => {
  const routes: Record<string, string> = {
    customer: '/dashboard/customer',
    store_owner: '/dashboard/store-owner',
    delivery_partner: '/dashboard/delivery',
    admin: '/dashboard/admin',
  };
  return routes[role] || '/login';
};