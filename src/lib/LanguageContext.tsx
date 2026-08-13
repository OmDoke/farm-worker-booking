"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from '../locales/en.json';
import mr from '../locales/mr.json';

type Language = 'en' | 'mr';
type Dictionary = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Dictionary) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const dictionaries = {
  en,
  mr
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedLang = localStorage.getItem('language') as Language;
    if (storedLang && (storedLang === 'en' || storedLang === 'mr')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLang(storedLang);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    localStorage.setItem('language', lang);
    setLang(lang);
  };

  const t = (key: keyof Dictionary): string => {
    return dictionaries[language][key] || dictionaries['en'][key] || key;
  };

  if (!mounted) return null; // Avoid hydration mismatch

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
