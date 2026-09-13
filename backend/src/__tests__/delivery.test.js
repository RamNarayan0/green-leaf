const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const DeliveryPartner = require('../models/DeliveryPartner');
const { generateAccessToken } = require('../services/token.service');

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
  await DeliveryPartner.deleteMany({});
  jest.clearAllMocks();
});

describe('Delivery Tests', () => {
  let customerToken;
  let driverToken;
  let customerUser;
  let driverUser;

  beforeEach(async () => {
    customerUser = await User.create({
      name: 'Customer',
      email: 'customer@test.com',
      password: 'password123',
      role: 'customer'
    });
    customerToken = generateAccessToken(customerUser);

    driverUser = await User.create({
      name: 'Driver',
      email: 'driver@test.com',
      password: 'password123',
      role: 'delivery_partner'
    });
    driverToken = generateAccessToken(driverUser);
  });

  describe('Authentication and Authorization', () => {
    it('denies unauthenticated access to delivery profile', async () => {
      const res = await request(app).get('/api/delivery/profile');
      expect(res.statusCode).toBe(401);
    });

    it('denies access to customer trying to access delivery partner routes', async () => {
      const res = await request(app)
        .get('/api/delivery/profile')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.statusCode).toBe(403);
    });
  });

  describe('Delivery Profile', () => {
    it('returns setupRequired if profile not found for authorized driver', async () => {
      const res = await request(app)
        .get('/api/delivery/profile')
        .set('Authorization', `Bearer ${driverToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.setupRequired).toBe(true);
    });

    it('returns profile if it exists', async () => {
      await DeliveryPartner.create({
        userId: driverUser._id,
        vehicleType: 'electric_scooter',
        vehicleNumber: 'TS-09-EA-1234'
      });

      const res = await request(app)
        .get('/api/delivery/profile')
        .set('Authorization', `Bearer ${driverToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.vehicleType).toBe('electric_scooter');
    });
  });
});
