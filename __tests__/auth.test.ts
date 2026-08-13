import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { POST as requestOtp } from '@/app/api/v1/auth/otp/request/route';
import { POST as verifyOtp } from '@/app/api/v1/auth/otp/verify/route';
import { POST as refreshAuth } from '@/app/api/v1/auth/refresh/route';
import { Otp } from '@/lib/models/Otp';
import { User } from '@/lib/models/User';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;
  // Ensure JWT secrets are set
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

function createRequest(body: unknown) {
  return new Request('http://localhost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Auth API Routes', () => {
  const testNumber = '+919999999999';

  describe('OTP Request', () => {
    it('should generate an OTP successfully', async () => {
      const res = await requestOtp(createRequest({ mobile_number: testNumber }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);

      const otpRecord = await Otp.findOne({ mobile_number: testNumber });
      expect(otpRecord).toBeDefined();
      expect(otpRecord?.otp).toBeDefined();
    });

    it('should enforce rate limiting (max 5)', async () => {
      // 1 to 5 should succeed
      for (let i = 0; i < 5; i++) {
        const res = await requestOtp(createRequest({ mobile_number: testNumber }));
        expect(res.status).toBe(200);
      }
      
      // 6th should fail
      const failedRes = await requestOtp(createRequest({ mobile_number: testNumber }));
      expect(failedRes.status).toBe(429);
      const failedJson = await failedRes.json();
      expect(failedJson.success).toBe(false);
      expect(failedJson.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('OTP Verify & Refresh', () => {
    it('should verify OTP and create user, then refresh token', async () => {
      // 1. Request OTP
      await requestOtp(createRequest({ mobile_number: testNumber }));
      const otpRecord = await Otp.findOne({ mobile_number: testNumber });
      
      // 2. Verify OTP
      const verifyRes = await verifyOtp(createRequest({ mobile_number: testNumber, otp: otpRecord?.otp }));
      const verifyJson = await verifyRes.json();
      
      expect(verifyRes.status).toBe(200);
      expect(verifyJson.success).toBe(true);
      expect(verifyJson.data.accessToken).toBeDefined();
      expect(verifyJson.data.refreshToken).toBeDefined();
      expect(verifyJson.data.isNewUser).toBe(true);
      
      // Ensure user was created
      const user = await User.findOne({ mobile_number: testNumber });
      expect(user).toBeDefined();

      // Ensure OTP was deleted
      const deletedOtp = await Otp.findOne({ mobile_number: testNumber });
      expect(deletedOtp).toBeNull();

      // 3. Refresh token
      const refreshRes = await refreshAuth(createRequest({ refreshToken: verifyJson.data.refreshToken }));
      const refreshJson = await refreshRes.json();

      expect(refreshRes.status).toBe(200);
      expect(refreshJson.success).toBe(true);
      expect(refreshJson.data.accessToken).toBeDefined();
    });

    it('should fail verification with wrong OTP', async () => {
      const verifyRes = await verifyOtp(createRequest({ mobile_number: testNumber, otp: '000000' }));
      const verifyJson = await verifyRes.json();
      expect(verifyRes.status).toBe(400);
      expect(verifyJson.success).toBe(false);
    });
  });
});
