"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MapPin, CalendarDays, ClipboardList } from "lucide-react";

interface Booking {
  _id: string;
  farm_size_acres: number;
  scheduled_date: string;
  status: string;
  processes: string[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
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

  if (!user || loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="flex-1 p-4 sm:p-8 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-400/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <h1 className="text-4xl font-bold mb-10 font-display capitalize text-gradient">{t('dash_title')} - {user.role}</h1>
        
        <div className="grid grid-cols-1 gap-8">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <ClipboardList className="text-primary-500" />
            {t('dash_bookings')}
          </h2>
          {bookings.length === 0 ? (
            <Card className="glass-panel border-white/40 dark:border-gray-800/60 p-2">
              <CardContent className="p-12 text-center text-gray-500">
                <p className="text-lg mb-6">{t('dash_no_bookings')}</p>
                {user.role === 'customer' && (
                  <Button size="lg" onClick={() => router.push('/book')} className="shadow-primary-500/30">
                    {t('dash_btn_create')}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookings.map((booking) => (
                <Card key={booking._id} className="glass-panel border-white/40 dark:border-gray-800/60 p-1 flex flex-col h-full">
                  <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-800/50">
                    <CardTitle className="flex justify-between items-start text-lg">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <CalendarDays className="w-4 h-4" /> {t('dash_date')}
                        </span>
                        <span className="font-bold text-gray-900 dark:text-gray-100">
                          {new Date(booking.scheduled_date).toLocaleDateString(language === 'mr' ? 'mr-IN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm ${
                        booking.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' :
                        booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {booking.status === 'pending_assignment' ? t('status_pending_assignment') : 
                         booking.status === 'confirmed' ? t('status_confirmed') : 
                         t('status_completed')}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4 flex-1 flex flex-col">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{t('dash_size')}</p>
                          <p className="font-semibold">{booking.farm_size_acres} Acres</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-2 bg-accent-50 dark:bg-accent-900/20 rounded-lg text-accent-600">
                          <ClipboardList className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{t('dash_tasks')}</p>
                          <p className="font-semibold">{booking.processes.map(p => {
                            const taskKey = `task_${p.toLowerCase()}` as Parameters<typeof t>[0];
                            return t(taskKey);
                          }).join(', ')}</p>
                        </div>
                      </div>
                    </div>
                    
                    {user.role === 'worker' && booking.status === 'pending_assignment' && (
                      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/50">
                        <Button size="lg" className="w-full" onClick={() => handleWorkerAction(booking._id, 'accept')}>{t('dash_btn_accept')}</Button>
                      </div>
                    )}
                    
                    {user.role === 'worker' && booking.status === 'confirmed' && (
                      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/50">
                        <Button size="lg" className="w-full" onClick={() => handleWorkerAction(booking._id, 'complete')}>{t('dash_btn_complete')}</Button>
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
