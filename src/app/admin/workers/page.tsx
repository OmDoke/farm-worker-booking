"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface User {
  _id: string;
  name?: string;
  mobile_number: string;
}

interface WorkerProfile {
  _id: string;
  user_id: User;
  service_area: string;
  rate: number;
  skills: string[];
  registration_status: string;
  createdAt: string;
}

export default function AdminWorkersPage() {
  const { user } = useAuth();
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkers = async () => {
    try {
      const res = await fetch("/api/v1/admin/workers", {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (data.success) {
        setWorkers(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchWorkers();
  }, [user]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/v1/admin/workers/${id}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      if (res.ok) {
        fetchWorkers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading workers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Workers</h1>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-500 dark:text-gray-400">
                <th className="p-4">Name</th>
                <th className="p-4">Mobile</th>
                <th className="p-4">Area</th>
                <th className="p-4">Rate (₹)</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((worker) => (
                <tr key={worker._id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="p-4 font-medium">{worker.user_id?.name || 'No Name'}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">{worker.user_id?.mobile_number}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">{worker.service_area}</td>
                  <td className="p-4 font-semibold text-gray-900 dark:text-white">₹{worker.rate}</td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      worker.registration_status === 'approved' ? 'bg-green-100 text-green-800' :
                      worker.registration_status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {worker.registration_status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {worker.registration_status === 'pending_review' && (
                      <>
                        <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleAction(worker._id, 'approve')}>Approve</Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleAction(worker._id, 'reject')}>Reject</Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {workers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No workers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
