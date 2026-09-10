const request = require('supertest');
const app = require('../app');

describe('Health and API Routes', () => {
  it('GET /health should return ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('ok');
  });

  it('GET /api/ping should return pong', async () => {
    const res = await request(app).get('/api/ping');
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('pong');
  });
});
