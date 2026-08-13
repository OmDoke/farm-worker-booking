"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface Service {
  id: string;
  name: string;
  category: string;
}

export default function BookPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  
  const [services, setServices] = useState<Service[]>([]);
  const [size, setSize] = useState("");
  const [date, setDate] = useState("");
  const [tasks, setTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && user.role === 'worker') {
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    fetch("/api/v1/services")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setServices(data.data);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const toggleTask = (task: string) => {
    setTasks(prev => prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login?redirect=/book");
      return;
    }

    if (tasks.length === 0) {
      setError(t('book_error_tasks'));
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
          farm_size_acres: Number(size),
          processes: tasks,
          scheduled_date: date,
          farm_location_lat: 19.9975, // Defaulting for MVP
          farm_location_lng: 73.7898,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/dashboard");
      } else {
        setError(data.error?.message || t('book_error_failed'));
      }
    } catch {
      setError(t('book_error_unexpected'));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <p className="mb-4">{t('book_req_login')}</p>
        <Button onClick={() => router.push("/login?redirect=/book")}>{t('book_btn_login')}</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{t('book_title')}</CardTitle>
          <p className="text-sm text-gray-500 mt-2">{t('book_subtitle')}</p>
        </CardHeader>
        <CardContent>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('book_size_label')}</label>
              <Input type="number" min="0.1" step="0.1" value={size} onChange={(e) => setSize(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('book_tasks_label')}</label>
              <div className="grid grid-cols-2 gap-2">
                {services.map(srv => {
                  const taskKey = `task_${srv.name.toLowerCase()}` as Parameters<typeof t>[0];
                  return (
                    <label key={srv.id} className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <input type="checkbox" checked={tasks.includes(srv.id)} onChange={() => toggleTask(srv.id)} className="rounded text-primary-600 focus:ring-primary-500" />
                      <span className="text-sm">{t(taskKey)}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('book_date_label')}</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required min={new Date().toISOString().split('T')[0]} />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('book_btn_submitting') : t('book_btn_submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
