"use client";

import { Sprout } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "./ui/Button";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b bg-white dark:bg-gray-950 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Sprout className="h-6 w-6 text-primary-600" />
            <span className="font-bold text-xl tracking-tight text-primary-900 dark:text-primary-50">KrishiSeva</span>
          </Link>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-300">
                  Dashboard
                </Link>
                <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
              </>
            ) : (
              <Link href="/login">
                <Button size="sm">Login</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
