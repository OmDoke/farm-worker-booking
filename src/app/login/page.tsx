"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";

function LoginForm() {
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { t } = useLanguage();
  
  const redirect = searchParams.get('redirect') || "/dashboard";

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile_number: mobileNumber }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setStep("verify");
      } else {
        setError(data.error?.message || "Failed to send OTP");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile_number: mobileNumber, otp }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        login(data.data.accessToken, data.data.user.id, data.data.user.role);
        router.push(redirect);
      } else {
        setError(data.error?.message || "Failed to verify OTP");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary-900 dark:text-primary-50">
          {t('login_title')}
        </CardTitle>
        <p className="text-sm text-gray-500 mt-2">
          {t('login_subtitle')}
        </p>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}
        
        {step === "request" ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('login_mobile_label')}</label>
              <Input
                type="tel"
                placeholder="+919999999999"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('login_btn_sending') : t('login_btn_send_otp')}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('login_otp_label')}</label>
              <Input
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
              />
              <p className="text-xs text-gray-500">
                {t('login_otp_sent_to')} {mobileNumber}. <button type="button" onClick={() => setStep("request")} className="text-primary-600">{t('login_btn_change')}</button>
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('login_btn_verifying') : t('login_btn_verify')}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

