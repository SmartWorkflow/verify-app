import { auth } from './firebase';

/**
 * Make an authenticated API request with Firebase ID token
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const user = auth.currentUser;
  
  if (user) {
    const token = await user.getIdToken();
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };
  }
  
  return fetch(url, options);
}
