describe('Environment Validator Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('throws in production mode if missing secrets', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    
    expect(() => {
      const { validateEnvironment } = require('../utils/envValidator');
      validateEnvironment();
    }).toThrow();
  });

  it('applies defaults in dev mode if missing secrets', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_SECRET;
    
    const { validateEnvironment } = require('../utils/envValidator');
    validateEnvironment();
    expect(process.env.JWT_SECRET).toBeDefined();
  });
});

