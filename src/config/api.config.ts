export const API_CONFIG = {
  USE_MOCK_API: process.env.USE_MOCK_API !== 'false',
  REAL_API_URL: process.env.REAL_API_URL || 'https://your-real-api.com',
  MOCK_DELAY: parseInt(process.env.MOCK_DELAY || '500'),
  PORT: parseInt(process.env.PORT || '3001'),
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
};

export const switchToRealAPI = () => {
  process.env.USE_MOCK_API = 'false';
  console.log('Switched to real API mode');
};

export const switchToMockAPI = () => {
  process.env.USE_MOCK_API = 'true';
  console.log('Switched to mock API mode');
};