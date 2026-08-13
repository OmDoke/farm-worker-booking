"use client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Users, Calendar, ShieldCheck, MapPin, CheckCircle, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary-950 text-white py-24 sm:py-32 lg:pb-40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-800/40 via-primary-950 to-primary-950"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary-500/20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/10 rounded-full px-3 py-1 mb-8 border border-white/10 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-accent-400 animate-pulse"></span>
            <span className="text-xs font-medium text-primary-100 uppercase tracking-wider">Now Available in Nashik</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8 font-display">
            {t('hero_title_1')} <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-primary-300">
              {t('hero_title_2')}
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-primary-100/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('hero_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/book">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-400 hover:to-accent-500 text-gray-950 font-bold border-none shadow-xl shadow-accent-500/20 group">
                {t('hero_btn_book')}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/worker/register">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white/20 hover:bg-white/10 hover:border-white/40 glass-pill">
                {t('hero_btn_register')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Overlap */}
      <section className="relative px-4 sm:px-6 lg:px-8 -mt-20 z-10 pb-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel bg-white/90 dark:bg-gray-900/90 rounded-3xl p-8 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <ShieldCheck className="text-primary-700 dark:text-primary-400 w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-display">{t('feature_1_title')}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{t('feature_1_desc')}</p>
            </div>
            
            <div className="glass-panel bg-white/90 dark:bg-gray-900/90 rounded-3xl p-8 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-accent-100 to-accent-200 dark:from-accent-900/50 dark:to-accent-800/50 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <Calendar className="text-accent-700 dark:text-accent-400 w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-display">{t('feature_2_title')}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{t('feature_2_desc')}</p>
            </div>

            <div className="glass-panel bg-white/90 dark:bg-gray-900/90 rounded-3xl p-8 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <CheckCircle className="text-blue-700 dark:text-blue-400 w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-display">{t('feature_3_title')}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{t('feature_3_desc')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
