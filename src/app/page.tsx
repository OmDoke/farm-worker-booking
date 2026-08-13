"use client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Sprout, Users, Calendar, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="bg-primary-900 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            {t('hero_title_1')} <span className="text-accent-500">{t('hero_title_2')}</span>
          </h1>
          <p className="text-lg sm:text-xl text-primary-100 max-w-2xl mx-auto mb-10">
            {t('hero_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/book">
              <Button size="lg" className="w-full sm:w-auto bg-accent-500 hover:bg-accent-600 text-gray-900 font-semibold border-none">
                {t('hero_btn_book')}
              </Button>
            </Link>
            <Link href="/worker/register">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white hover:bg-white/10 hover:text-white">
                {t('hero_btn_register')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-gray-50">{t('features_title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
                <Users className="text-primary-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('feature_1_title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t('feature_1_desc')}</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
                <Calendar className="text-primary-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('feature_2_title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t('feature_2_desc')}</p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="text-primary-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('feature_3_title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t('feature_3_desc')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
