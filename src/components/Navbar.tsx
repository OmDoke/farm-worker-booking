"use client";

import { Sprout } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "./ui/Button";

export function Navbar() {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  return (
    <nav className="border-b bg-white dark:bg-gray-950 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Sprout className="h-6 w-6 text-primary-600" />
            <span className="font-bold text-xl tracking-tight text-primary-900 dark:text-primary-50">KrishiSeva</span>
          </Link>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setLanguage(language === 'en' ? 'mr' : 'en')}
              className="text-sm font-medium px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {language === 'en' ? 'मराठी' : 'EN'}
            </button>
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-300">
                  {t('nav_dashboard')}
                </Link>
                <Button variant="ghost" size="sm" onClick={logout}>{t('nav_logout')}</Button>
              </>
            ) : (
              <Link href="/login">
                <Button size="sm">{t('nav_login')}</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
