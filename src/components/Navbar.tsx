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
    <nav className="sticky top-0 z-50 w-full glass-panel border-b-0 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-bold font-display text-gradient tracking-tight">
              KrishiSeva
            </Link>
          </div>
          
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setLanguage(language === 'en' ? 'mr' : 'en')}
              className="text-sm font-semibold px-3 py-1.5 glass-pill hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 active:scale-95"
            >
              {language === 'en' ? 'मराठी' : 'EN'}
            </button>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-200 dark:hover:text-primary-400 transition-colors">
                  {t('nav_dashboard')}
                </Link>
                <Button variant="outline" size="sm" onClick={logout} className="rounded-full">
                  {t('nav_logout')}
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button className="rounded-full shadow-md shadow-primary-500/20">{t('nav_login')}</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
