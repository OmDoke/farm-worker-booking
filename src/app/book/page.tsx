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
    <div className="flex-1 flex items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-400/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <Card className="w-full max-w-2xl relative z-10 glass-panel border-white/40 dark:border-gray-800/60 p-2">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-bold font-display text-gradient mb-2">{t('book_title')}</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('book_subtitle')}</p>
        </CardHeader>
        <CardContent>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-6">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('book_size_label')}</label>
              <Input type="number" min="0.1" step="0.1" value={size} onChange={(e) => setSize(e.target.value)} required className="h-14 text-lg" />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('book_tasks_label')}</label>
              <div className="grid grid-cols-2 gap-3">
                {services.map(srv => {
                  const taskKey = `task_${srv.name.toLowerCase()}` as Parameters<typeof t>[0];
                  return (
                    <label key={srv.id} className={`flex items-center space-x-3 border-2 p-4 rounded-2xl cursor-pointer transition-all duration-300 ${tasks.includes(srv.id) ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-800 hover:border-primary-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                      <input type="checkbox" checked={tasks.includes(srv.id)} onChange={() => toggleTask(srv.id)} className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500 border-gray-300" />
                      <span className="font-medium text-gray-800 dark:text-gray-200">{t(taskKey)}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('book_date_label')}</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required min={new Date().toISOString().split('T')[0]} className="h-14 text-lg" />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? t('book_btn_submitting') : t('book_btn_submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
