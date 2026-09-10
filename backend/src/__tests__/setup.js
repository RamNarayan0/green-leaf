/**
 * Jest Setup File
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_greenleaf_32chars';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_key_greenleaf_32chars';

jest.setTimeout(30000);
