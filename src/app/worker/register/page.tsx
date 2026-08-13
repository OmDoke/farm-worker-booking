"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";

export default function WorkerRegisterPage() {
  const { user, login } = useAuth();
  const { t } = useLanguage();
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
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <p className="mb-4">{t('reg_req_login')}</p>
        <Button onClick={() => router.push("/login?redirect=/worker/register")}>{t('nav_login')}</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 py-12">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{t('reg_title')}</CardTitle>
          <p className="text-sm text-gray-500 mt-2">
            {t('reg_subtitle')}
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
              <label className="text-sm font-medium">{t('reg_area_label')}</label>
              <Input
                type="text"
                placeholder="e.g. Niphad, Nashik"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('reg_rate_label')}</label>
              <Input
                type="number"
                placeholder="e.g. 500"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                min="100"
                required
              />
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('reg_btn_submitting') : t('reg_btn_submit')}
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
