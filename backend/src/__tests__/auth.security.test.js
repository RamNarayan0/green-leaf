const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const googleAuthService = require('../services/googleAuth.service');

jest.mock('../services/googleAuth.service');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  jest.clearAllMocks();
});

describe('Auth Security Tests', () => {
  const validUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    phone: '1234567890'
  };

  describe('Registration', () => {
    it('creates a customer account', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('customer');

      const userInDb = await User.findOne({ email: validUser.email });
      expect(userInDb).toBeTruthy();
      expect(userInDb.role).toBe('customer');
    });

    it('rejects duplicate email', async () => {
      await request(app).post('/api/auth/register').send(validUser);
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('never accepts a caller-supplied role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, role: 'admin' });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.data.user.role).toBe('customer');

      const userInDb = await User.findOne({ email: validUser.email });
      expect(userInDb.role).toBe('customer');
    });
  });

  describe('Login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validUser);
    });

    it('returns tokens with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('returns 401 with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: 'wrongpassword' });
      
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Google Login', () => {
    it('rejects fake/invalid token', async () => {
      googleAuthService.verifyGoogleToken.mockRejectedValue(new Error('Invalid token'));

      const res = await request(app)
        .post('/api/auth/google')
        .send({ token: 'fake-token' });
      
      expect(res.statusCode).toBe(500); // Because error is passed to next()
    });

    it('returns 400 without a token', async () => {
      const res = await request(app)
        .post('/api/auth/google')
        .send({});
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/required/i);
    });
  });

  describe('Token Refresh', () => {
    let refreshToken;
    
    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send(validUser);
      refreshToken = res.body.data.refreshToken;
    });

    it('works with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('rejects invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });
      
      expect(res.statusCode).toBe(401); // Based on how auth controller catches verify errors
    });
  });
});
