import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { POST as registerWorker } from '@/app/api/v1/workers/register/route';
import { GET as getWorker, PATCH as updateWorker } from '@/app/api/v1/workers/me/route';
import { POST as signUpload } from '@/app/api/v1/uploads/sign/route';
import { User } from '@/lib/models/User';
import { WorkerProfile } from '@/lib/models/WorkerProfile';
import { generateAccessToken } from '@/lib/auth';

let mongoServer: MongoMemoryServer;
let testUserId: string;
let testToken: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = 'test-secret';
  await mongoose.connect(uri);
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

function createRequest(method: string, body?: unknown, token?: string) {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  };
  return new Request('http://localhost', options);
}

describe('Worker API Routes', () => {
  
  async function setupUser() {
    const user = await User.create({ mobile_number: '+919999999998', role: 'customer' });
    testUserId = user._id.toString();
    testToken = generateAccessToken({ userId: testUserId, role: 'customer' });
  }

  describe('Upload Sign', () => {
    it('should reject unauthenticated request', async () => {
      const res = await signUpload(createRequest('POST', {}));
      expect(res.status).toBe(401);
    });

    it('should return signature for authenticated user', async () => {
      await setupUser();
      const res = await signUpload(createRequest('POST', {}, testToken));
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.signature).toBeDefined();
    });
  });

  describe('Worker Registration', () => {
    it('should reject unauthenticated request', async () => {
      const res = await registerWorker(createRequest('POST', {}));
      expect(res.status).toBe(401);
    });

    it('should register a worker and set default statuses', async () => {
      await setupUser();
      const payload = {
        name: 'Ramesh',
        address: 'Pune',
        skills: ['Pruning'],
        service_area: 'Pune District',
        rate: 500,
      };

      const res = await registerWorker(createRequest('POST', payload, testToken));
      const json = await res.json();
      
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      
      // Verify User was updated
      const user = await User.findById(testUserId);
      expect(user?.role).toBe('worker');
      expect(user?.name).toBe('Ramesh');

      // Verify WorkerProfile defaults
      const profile = await WorkerProfile.findOne({ user_id: testUserId });
      expect(profile?.registration_status).toBe('pending_review');
      expect(profile?.is_verified).toBe(false);
      expect(profile?.service_area).toBe('Pune District');
    });
  });

  describe('Worker Me (GET/PATCH)', () => {
    it('should fetch own profile', async () => {
      await setupUser();
      await WorkerProfile.create({
        user_id: testUserId,
        service_area: 'Pune',
        rate: 600,
        registration_status: 'pending_review',
        is_verified: false
      });

      const res = await getWorker(createRequest('GET', undefined, testToken));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.service_area).toBe('Pune');
    });

    it('should update own profile', async () => {
      await setupUser();
      await WorkerProfile.create({
        user_id: testUserId,
        service_area: 'Pune',
        rate: 600,
        registration_status: 'pending_review',
        is_verified: false
      });

      const res = await updateWorker(createRequest('PATCH', { rate: 700 }, testToken));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      
      const profile = await WorkerProfile.findOne({ user_id: testUserId });
      expect(profile?.rate).toBe(700);
    });
  });
});
