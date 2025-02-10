export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL,
  AUTH_TOKEN: import.meta.env.VITE_AUTH_TOKEN,
  ENDPOINTS: {
    TOPICS_DISCOVER: '/topics/discover',
    GENERATE_AUDIO_BYTE: '/audio-bytes/generate',
    GET_AUDIO_BYTE: '/audio-bytes/',
    STREAM_AUDIO: '/audio-bytes/',
  },
} as const;
