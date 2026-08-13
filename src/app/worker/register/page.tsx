"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/lib/AuthContext";

export default function WorkerRegisterPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  
  const [serviceArea, setServiceArea] = useState("");
  const [rate, setRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login?redirect=/worker/register");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/workers/register", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          service_area: serviceArea,
          rate: Number(rate),
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Registration successful. Update client tokens since role changed to worker.
        login(data.data.accessToken, user.userId, 'worker');
        router.push("/dashboard");
      } else {
        setError(data.error?.message || "Failed to register profile");
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
        <p className="mb-4">Please login to register as a worker.</p>
        <Button onClick={() => router.push("/login?redirect=/worker/register")}>Login Now</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Worker Registration</CardTitle>
          <p className="text-sm text-gray-500">
            Complete your profile to start accepting jobs on KrishiSeva.
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Service Area / District</label>
              <Input
                type="text"
                placeholder="e.g. Nashik, Maharashtra"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Daily Rate (₹)</label>
              <Input
                type="number"
                placeholder="500"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                min="100"
                required
              />
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting..." : "Submit Profile"}
              </Button>
              <p className="text-xs text-center text-gray-500 mt-4">
                By submitting, your profile will be sent to admins for background verification.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
