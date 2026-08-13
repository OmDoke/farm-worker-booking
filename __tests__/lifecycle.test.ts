import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { POST as assignBooking } from '@/app/api/v1/bookings/[id]/assign/route';
import { POST as acceptBooking } from '@/app/api/v1/bookings/[id]/accept/route';
import { POST as declineBooking } from '@/app/api/v1/bookings/[id]/decline/route';
import { POST as completeBooking } from '@/app/api/v1/bookings/[id]/complete/route';
import { User } from '@/lib/models/User';
import { Booking } from '@/lib/models/Booking';
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

describe('Booking Lifecycle API Routes', () => {
  let adminToken: string;
  let workerToken: string;
  let customerToken: string;
  let workerId: string;
  let bookingId: string;

  beforeEach(async () => {
    const admin = await User.create({ mobile_number: '+919999999991', role: 'admin' });
    adminToken = generateAccessToken({ userId: admin._id.toString(), role: 'admin' });

    const worker = await User.create({ mobile_number: '+919999999992', role: 'worker' });
    workerId = worker._id.toString();
    workerToken = generateAccessToken({ userId: workerId, role: 'worker' });

    const customer = await User.create({ mobile_number: '+919999999993', role: 'customer' });
    customerToken = generateAccessToken({ userId: customer._id.toString(), role: 'customer' });

    const booking = await Booking.create({
      customer_id: customer._id,
      farm_size_acres: 5,
      processes: ['srv_1'],
      scheduled_date: new Date(Date.now() + 86400000),
      status: 'pending_assignment',
    });
    bookingId = booking._id.toString();
  });

  describe('Assign Worker', () => {
    it('should allow admin to assign a worker', async () => {
      const res = await assignBooking(
        createRequest('POST', { worker_ids: [workerId] }, adminToken),
        { params: Promise.resolve({ id: bookingId }) } as unknown as { params: Promise<{ id: string }> }
      );
      expect(res.status).toBe(200);

      const booking = await Booking.findById(bookingId);
      expect(booking?.worker_ids).toHaveLength(1);
      expect(booking?.worker_ids[0].toString()).toBe(workerId);
      expect(booking?.status).toBe('pending_assignment');
    });

    it('should reject non-admin from assigning', async () => {
      const res = await assignBooking(
        createRequest('POST', { worker_ids: [workerId] }, customerToken),
        { params: Promise.resolve({ id: bookingId }) } as unknown as { params: Promise<{ id: string }> }
      );
      expect(res.status).toBe(403);
    });
  });

  describe('Worker Accept/Decline', () => {
    beforeEach(async () => {
      // Pre-assign the worker
      await Booking.findByIdAndUpdate(bookingId, { worker_ids: [workerId] });
    });

    it('should allow assigned worker to accept', async () => {
      const res = await acceptBooking(
        createRequest('POST', undefined, workerToken),
        { params: Promise.resolve({ id: bookingId }) } as unknown as { params: Promise<{ id: string }> }
      );
      expect(res.status).toBe(200);

      const booking = await Booking.findById(bookingId);
      expect(booking?.status).toBe('confirmed');
    });

    it('should allow assigned worker to decline', async () => {
      const res = await declineBooking(
        createRequest('POST', undefined, workerToken),
        { params: Promise.resolve({ id: bookingId }) } as unknown as { params: Promise<{ id: string }> }
      );
      expect(res.status).toBe(200);

      const booking = await Booking.findById(bookingId);
      expect(booking?.worker_ids).toHaveLength(0);
      expect(booking?.status).toBe('pending_assignment');
    });
  });

  describe('Worker Complete', () => {
    beforeEach(async () => {
      // Pre-assign and confirm
      await Booking.findByIdAndUpdate(bookingId, { 
        worker_ids: [workerId],
        status: 'confirmed' 
      });
    });

    it('should allow worker to complete a confirmed booking', async () => {
      const res = await completeBooking(
        createRequest('POST', undefined, workerToken),
        { params: Promise.resolve({ id: bookingId }) } as unknown as { params: Promise<{ id: string }> }
      );
      expect(res.status).toBe(200);

      const booking = await Booking.findById(bookingId);
      expect(booking?.status).toBe('completed');
    });

    it('should not allow complete if pending_assignment', async () => {
      await Booking.findByIdAndUpdate(bookingId, { status: 'pending_assignment' });

      const res = await completeBooking(
        createRequest('POST', undefined, workerToken),
        { params: Promise.resolve({ id: bookingId }) } as unknown as { params: Promise<{ id: string }> }
      );
      expect(res.status).toBe(400);
      
      const json = await res.json();
      expect(json.error.code).toBe('INVALID_STATE');
    });
  });
});
