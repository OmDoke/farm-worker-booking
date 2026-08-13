import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { POST as createBooking, GET as getBookings } from '@/app/api/v1/bookings/route';
import { GET as getBookingDetail } from '@/app/api/v1/bookings/[id]/route';
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

describe('Booking API Routes', () => {
  let customerToken: string;
  let adminToken: string;
  let workerToken: string;
  let customerId: string;
  let workerId: string;

  beforeEach(async () => {
    const customer = await User.create({ mobile_number: '+919999999991', role: 'customer' });
    customerId = customer._id.toString();
    customerToken = generateAccessToken({ userId: customerId, role: 'customer' });

    const admin = await User.create({ mobile_number: '+919999999992', role: 'admin' });
    adminToken = generateAccessToken({ userId: admin._id.toString(), role: 'admin' });

    const worker = await User.create({ mobile_number: '+919999999993', role: 'worker' });
    workerId = worker._id.toString();
    workerToken = generateAccessToken({ userId: workerId, role: 'worker' });
  });

  describe('Create Booking', () => {
    it('should reject non-customer', async () => {
      const res = await createBooking(createRequest('POST', {}, workerToken));
      expect(res.status).toBe(403);
    });

    it('should create a booking successfully', async () => {
      const payload = {
        farm_size_acres: 5,
        processes: ['srv_1', 'srv_2'],
        scheduled_date: new Date(Date.now() + 86400000).toISOString(), // tomorrow
      };
      const res = await createBooking(createRequest('POST', payload, customerToken));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      
      const booking = await Booking.findOne({ customer_id: customerId });
      expect(booking).toBeDefined();
      expect(booking?.status).toBe('pending_assignment');
      expect(booking?.farm_size_acres).toBe(5);
    });

    it('should fail with past date', async () => {
      const payload = {
        farm_size_acres: 5,
        processes: ['srv_1'],
        scheduled_date: new Date(Date.now() - 86400000).toISOString(), // yesterday
      };
      const res = await createBooking(createRequest('POST', payload, customerToken));
      expect(res.status).toBe(400);
    });
  });

  describe('Get Bookings (List & Detail)', () => {
    let bookingId: string;

    beforeEach(async () => {
      const b = await Booking.create({
        customer_id: customerId,
        worker_ids: [workerId], // Assigned to the worker
        farm_size_acres: 2,
        processes: ['srv_1'],
        scheduled_date: new Date(Date.now() + 86400000),
      });
      bookingId = b._id.toString();
    });

    it('should allow customer to view own bookings', async () => {
      const res = await getBookings(createRequest('GET', undefined, customerToken));
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.length).toBe(1);
    });

    it('should allow worker to view assigned bookings', async () => {
      const res = await getBookings(createRequest('GET', undefined, workerToken));
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.length).toBe(1);
    });

    it('should allow admin to view all bookings', async () => {
      const res = await getBookings(createRequest('GET', undefined, adminToken));
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.length).toBe(1);
    });

    it('should allow assigned worker to view detail', async () => {
      const res = await getBookingDetail(
        createRequest('GET', undefined, workerToken),
        { params: Promise.resolve({ id: bookingId }) } as unknown as { params: Promise<{ id: string }> }
      );
      expect(res.status).toBe(200);
    });

    it('should deny unassigned worker from viewing detail', async () => {
      const otherWorker = await User.create({ mobile_number: '+919999999994', role: 'worker' });
      const otherToken = generateAccessToken({ userId: otherWorker._id.toString(), role: 'worker' });

      const res = await getBookingDetail(
        createRequest('GET', undefined, otherToken),
        { params: Promise.resolve({ id: bookingId }) } as unknown as { params: Promise<{ id: string }> }
      );
      expect(res.status).toBe(403);
    });
  });
});
