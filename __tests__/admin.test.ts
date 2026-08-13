import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { GET as getPendingWorkers } from '@/app/api/v1/admin/workers/pending/route';
import { POST as approveWorker } from '@/app/api/v1/admin/workers/[id]/approve/route';
import { POST as rejectWorker } from '@/app/api/v1/admin/workers/[id]/reject/route';
import { User } from '@/lib/models/User';
import { WorkerProfile } from '@/lib/models/WorkerProfile';
import { generateAccessToken } from '@/lib/auth';

let mongoServer: MongoMemoryServer;

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

function createRequest(method: string, token?: string) {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  };
  return new Request('http://localhost', options);
}

describe('Admin API Routes', () => {
  let customerToken: string;
  let adminToken: string;
  let workerProfileId: string;

  beforeEach(async () => {
    // Setup Customer
    const customer = await User.create({ mobile_number: '+919999999997', role: 'customer' });
    customerToken = generateAccessToken({ userId: customer._id.toString(), role: 'customer' });

    // Setup Admin
    const admin = await User.create({ mobile_number: '+919999999996', role: 'admin' });
    adminToken = generateAccessToken({ userId: admin._id.toString(), role: 'admin' });

    // Setup a Pending Worker Profile
    const workerUser = await User.create({ mobile_number: '+919999999995', role: 'worker' });
    const profile = await WorkerProfile.create({
      user_id: workerUser._id,
      service_area: 'Test Area',
      rate: 100,
      registration_status: 'pending_review',
    });
    workerProfileId = profile._id.toString();
  });

  describe('RBAC Control', () => {
    it('should reject non-admin (customer) from fetching pending workers', async () => {
      const res = await getPendingWorkers(createRequest('GET', customerToken));
      expect(res.status).toBe(403);
    });

    it('should reject non-admin (customer) from approving worker', async () => {
      const res = await approveWorker(createRequest('POST', customerToken), { params: Promise.resolve({ id: workerProfileId }) } as unknown as { params: Promise<{ id: string }> });
      expect(res.status).toBe(403);
    });
  });

  describe('Pending Workers List', () => {
    it('should list pending workers for admin', async () => {
      const res = await getPendingWorkers(createRequest('GET', adminToken));
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.length).toBe(1);
      expect(json.data[0]._id).toBe(workerProfileId);
    });
  });

  describe('Approve/Reject Worker', () => {
    it('should approve a worker', async () => {
      const res = await approveWorker(createRequest('POST', adminToken), { params: Promise.resolve({ id: workerProfileId }) } as unknown as { params: Promise<{ id: string }> });
      expect(res.status).toBe(200);
      
      const profile = await WorkerProfile.findById(workerProfileId);
      expect(profile?.registration_status).toBe('approved');
      expect(profile?.is_verified).toBe(true);
    });

    it('should reject a worker', async () => {
      const res = await rejectWorker(createRequest('POST', adminToken), { params: Promise.resolve({ id: workerProfileId }) } as unknown as { params: Promise<{ id: string }> });
      expect(res.status).toBe(200);
      
      const profile = await WorkerProfile.findById(workerProfileId);
      expect(profile?.registration_status).toBe('rejected');
      expect(profile?.is_verified).toBe(false);
    });
  });
});
