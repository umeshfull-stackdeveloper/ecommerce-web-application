import { store } from '../store';
import { setTokens, logout } from '../store/slices/authSlice';

const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
};

export const apiRequest = async (endpoint: string, options: RequestOptions = {}): Promise<any> => {
  let { headers = {}, params, ...rest } = options;

  // Build URL with query params
  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // Inject Authorization token
  const state = store.getState();
  const token = state.auth.accessToken;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const mergedHeaders: any = { ...defaultHeaders, ...headers };

  try {
    let response = await fetch(url, {
      headers: mergedHeaders,
      ...rest,
    });

    // Handle token expiration / 401 Unauthorized
    if (response.status === 401 && state.auth.refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: state.auth.refreshToken }),
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            const { accessToken, refreshToken: newRefreshToken } = data;

            store.dispatch(setTokens({ accessToken, refreshToken: newRefreshToken }));
            isRefreshing = false;
            onRefreshed(accessToken);
          } else {
            // Refresh token failed -> Force Logout
            store.dispatch(logout());
            isRefreshing = false;
            throw new Error('Session expired');
          }
        } catch (error) {
          store.dispatch(logout());
          isRefreshing = false;
          throw error;
        }
      }

      // Wait for refresh to finish and retry
      const retryPromise = new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          mergedHeaders['Authorization'] = `Bearer ${newToken}`;
          resolve(
            fetch(url, {
              headers: mergedHeaders,
              ...rest,
            }).then((res) => res.json())
          );
        });
      });

      return retryPromise;
    }

    if (response.status === 204) {
      return null;
    }

    const data = await response.json();
    if (!response.ok) {
      throw data;
    }

    return data;
  } catch (error) {
    throw error;
  }
};
