// Global mocks for browser APIs and third-party modules that run side effects on import

// Minimal process.env defaults for modules that read them at load time
process.env.FF_BACKEND_URL = 'http://localhost:9080';
process.env.FF_URL = 'http://localhost:3000';
process.env.AMPLITUDE_API_KEY = 'test-key';
process.env.FB_APP_ID = 'test-fb-app-id';
process.env.NODE_ENV = 'test';
