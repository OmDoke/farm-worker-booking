"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/lib/AuthContext";

interface Service {
  id: string;
  name: string;
  category: string;
}

export default function BookingPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [services, setServices] = useState<Service[]>([]);
  const [farmSize, setFarmSize] = useState("");
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch static services list (P1-5)
    fetch("/api/v1/services")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setServices(data.data);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handleProcessToggle = (id: string) => {
    setSelectedProcesses(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login?redirect=/book");
      return;
    }

    if (selectedProcesses.length === 0) {
      setError("Please select at least one process.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/bookings", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          farm_size_acres: Number(farmSize),
          processes: selectedProcesses,
          scheduled_date: scheduledDate,
          farm_location_lat: 19.9975, // Defaulting for MVP
          farm_location_lng: 73.7898,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/dashboard");
      } else {
        setError(data.error?.message || "Failed to create booking");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <p className="mb-4">Please login as a customer to create a booking.</p>
        <Button onClick={() => router.push("/login?redirect=/book")}>Login Now</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Book Farm Workers</CardTitle>
          <p className="text-sm text-gray-500">
            Tell us about your requirements and schedule the work.
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Farm Size (Acres)</label>
              <Input
                type="number"
                placeholder="e.g. 5"
                value={farmSize}
                onChange={(e) => setFarmSize(e.target.value)}
                min="0.1"
                step="0.1"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Processes / Services Required</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {services.map(srv => (
                  <label key={srv.id} className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                    <input 
                      type="checkbox"
                      checked={selectedProcesses.includes(srv.id)}
                      onChange={() => handleProcessToggle(srv.id)}
                      className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                    />
                    <span className="text-sm font-medium">{srv.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Scheduled Date</label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
