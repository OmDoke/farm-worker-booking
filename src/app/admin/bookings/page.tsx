"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Booking {
  _id: string;
  customer_id: { name?: string; mobile_number: string };
  farm_size_acres: number;
  scheduled_date: string;
  status: string;
  processes: string[];
  worker_ids: { _id: string; name?: string }[];
}

interface WorkerProfile {
  _id: string;
  user_id: { _id: string; name?: string; mobile_number: string };
  service_area: string;
}

export default function AdminBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");

  const fetchData = async () => {
    try {
      const [bkRes, wkRes] = await Promise.all([
        fetch("/api/v1/admin/bookings", { headers: { Authorization: `Bearer ${user?.token}` } }),
        fetch("/api/v1/admin/workers?status=approved", { headers: { Authorization: `Bearer ${user?.token}` } })
      ]);
      const bkData = await bkRes.json();
      const wkData = await wkRes.json();
      if (bkData.success) setBookings(bkData.data);
      if (wkData.success) setWorkers(wkData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleAssign = async () => {
    if (!selectedBookingId || !selectedWorkerId) return;
    try {
      const res = await fetch(`/api/v1/admin/bookings/${selectedBookingId}/assign`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}` 
        },
        body: JSON.stringify({ worker_id: selectedWorkerId })
      });
      if (res.ok) {
        setSelectedBookingId(null);
        setSelectedWorkerId("");
        fetchData(); // refresh list
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading bookings...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bookings Dispatcher</h1>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-500 dark:text-gray-400">
                <th className="p-4">Customer</th>
                <th className="p-4">Date</th>
                <th className="p-4">Size (Acres)</th>
                <th className="p-4">Status</th>
                <th className="p-4">Assigned To</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking._id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="p-4">
                    <div className="font-medium">{booking.customer_id?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{booking.customer_id?.mobile_number}</div>
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">
                    {(() => {
                      try {
                        const date = new Date(booking.scheduled_date);
                        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
                      } catch (e) {
                        return 'Invalid Date';
                      }
                    })()}
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">{booking.farm_size_acres}</td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">
                    {booking.worker_ids?.map(w => w?.name || 'Worker').join(', ') || <span className="text-gray-400 italic">Unassigned</span>}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {booking.status === 'pending_assignment' && (
                      <Button size="sm" onClick={() => setSelectedBookingId(booking._id)}>
                        Assign Worker
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No bookings found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Worker Modal */}
      {selectedBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-gray-900 border-none">
            <CardHeader>
              <CardTitle>Assign Worker to Booking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select an approved worker:</label>
                <select 
                  className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-transparent"
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                >
                  <option value="">-- Choose Worker --</option>
                  {workers.map(w => (
                    <option key={w.user_id._id} value={w.user_id._id}>
                      {w.user_id.name || w.user_id.mobile_number} ({w.service_area})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setSelectedBookingId(null)}>Cancel</Button>
                <Button onClick={handleAssign} disabled={!selectedWorkerId}>Confirm Assignment</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
