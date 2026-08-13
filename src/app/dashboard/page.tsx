"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Booking {
  _id: string;
  farm_size_acres: number;
  scheduled_date: string;
  status: string;
  processes: string[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const res = await fetch("/api/v1/bookings", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await res.json();
        if (data.success) {
          setBookings(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch bookings", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, router]);

  const handleWorkerAction = async (bookingId: string, action: 'accept' | 'decline' | 'complete') => {
    try {
      const res = await fetch(`/api/v1/bookings/${bookingId}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (res.ok) {
        // Refresh bookings
        const updated = await fetch("/api/v1/bookings", {
          headers: { Authorization: `Bearer ${user?.token}` },
        }).then(r => r.json());
        if (updated.success) setBookings(updated.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!user || loading) return <div className="p-8 text-center">Loading dashboard...</div>;

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 capitalize">{user.role} Dashboard</h1>
        
        <div className="grid grid-cols-1 gap-6">
          <h2 className="text-xl font-semibold">Your Bookings</h2>
          {bookings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No bookings found.
                {user.role === 'customer' && (
                  <div className="mt-4">
                    <Button onClick={() => router.push('/book')}>Create Booking</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookings.map((booking) => (
                <Card key={booking._id}>
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="flex justify-between items-center text-lg">
                      <span>Date: {new Date(booking.scheduled_date).toLocaleDateString()}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-2">
                    <p className="text-sm"><strong>Size:</strong> {booking.farm_size_acres} acres</p>
                    <p className="text-sm"><strong>Tasks:</strong> {booking.processes.join(', ')}</p>
                    
                    {user.role === 'worker' && booking.status === 'pending_assignment' && (
                      <div className="flex space-x-2 mt-4 pt-4 border-t">
                        <Button size="sm" onClick={() => handleWorkerAction(booking._id, 'accept')}>Accept</Button>
                        <Button size="sm" variant="outline" onClick={() => handleWorkerAction(booking._id, 'decline')}>Decline</Button>
                      </div>
                    )}
                    
                    {user.role === 'worker' && booking.status === 'confirmed' && (
                      <div className="mt-4 pt-4 border-t">
                        <Button size="sm" className="w-full" onClick={() => handleWorkerAction(booking._id, 'complete')}>Mark as Complete</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
