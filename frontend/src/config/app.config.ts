/**
 * Centralized Application Configuration System for AutoMacha Frontend.
 * Consolidates all environment-aware constants, API parameters, timings, and feature flags.
 */

export interface AppConfig {
  API_BASE_URL: string;
  APP_NAME: string;
  APP_VERSION: string;
  SUPPORTED_EMAIL_DOMAIN: string;
  DEFAULT_PAGE_SIZE: number;
  REQUEST_TIMEOUT_MS: number;
  MATCH_REFRESH_INTERVAL_MS: number;
  NOTIFICATION_POLL_INTERVAL_MS: number;
  FEATURE_FLAGS: {
    ENABLE_NOTIFICATIONS: boolean;
    ENABLE_BACKGROUND_TASKS: boolean;
    ENABLE_LOCATION_MATCHING: boolean;
    ENABLE_CUSTOM_DESTINATIONS: boolean;
  };
}

export const appConfig: AppConfig = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'AutoMacha',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  SUPPORTED_EMAIL_DOMAIN: import.meta.env.VITE_SUPPORTED_EMAIL_DOMAIN || '@iiitk.ac.in',
  DEFAULT_PAGE_SIZE: Number(import.meta.env.VITE_DEFAULT_PAGE_SIZE) || 10,
  REQUEST_TIMEOUT_MS: Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS) || 60000,
  MATCH_REFRESH_INTERVAL_MS: Number(import.meta.env.VITE_MATCH_REFRESH_INTERVAL_MS) || 30000,
  NOTIFICATION_POLL_INTERVAL_MS: Number(import.meta.env.VITE_NOTIFICATION_POLL_INTERVAL_MS) || 15000,
  FEATURE_FLAGS: {
    ENABLE_NOTIFICATIONS: import.meta.env.VITE_ENABLE_NOTIFICATIONS !== 'false',
    ENABLE_BACKGROUND_TASKS: import.meta.env.VITE_ENABLE_BACKGROUND_TASKS !== 'false',
    ENABLE_LOCATION_MATCHING: import.meta.env.VITE_ENABLE_LOCATION_MATCHING !== 'false',
    ENABLE_CUSTOM_DESTINATIONS: import.meta.env.VITE_ENABLE_CUSTOM_DESTINATIONS !== 'false',
  },
};

export default appConfig;
