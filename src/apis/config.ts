import axios from 'axios';
import AuthService, { EKeyAsyncStorage } from '../services/AuthService';
const rootUrl = 'http://[IP_ADDRESS]/api';
export const client = axios.create({
  baseURL: rootUrl,
  timeout: 300000, // 5 minutes for image uploads
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Content-Type': 'application/json',
    Connection: 'keep-alive',
  },
});

client.interceptors.request.use(
  async config => {
    const accessToken = await AuthService.shared.getCredentials(
      EKeyAsyncStorage.ACCESS_TOKEN,
    );
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

client.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register')
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const refreshToken = await AuthService.shared.getCredentials(
          EKeyAsyncStorage.REFRESH_TOKEN,
        );
        const accessToken = await AuthService.shared.getCredentials(
          EKeyAsyncStorage.ACCESS_TOKEN,
        );

        // Call refresh endpoint with both tokens
        const response = await axios.post(
          `${rootUrl}/auth/refresh`,
          { refreshToken },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        const { accessToken: newAccessToken } = response.data.data;
        await AuthService.shared.setCredentials(
          EKeyAsyncStorage.ACCESS_TOKEN,
          newAccessToken,
        );
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        await AuthService.shared.removeCredentials(
          EKeyAsyncStorage.ACCESS_TOKEN,
        );
        await AuthService.shared.removeCredentials(
          EKeyAsyncStorage.REFRESH_TOKEN,
        );
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
