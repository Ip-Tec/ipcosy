"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-foreground">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="h-24 w-24 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto border border-red-500/20">
          <AlertTriangle className="w-12 h-12 text-red-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">
            Something went wrong
          </h1>
          <p className="text-muted-foreground text-sm">
            We encountered an unexpected error. Our team has been notified
            (metaphorically).
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono bg-muted p-2 rounded-lg mt-4 opacity-50">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={() => reset()}
            className="cursor-pointer flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-2xl font-bold shadow-xl hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <RefreshCcw className="w-4 h-4" /> Try Again
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-muted text-foreground py-4 rounded-2xl font-bold hover:opacity-80 transition-all"
          >
            <Home className="w-4 h-4" /> Go Home
          </Link>
        </div>

        <div className="pt-8 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em]">
            System Status: Recovery Mode
          </p>
        </div>
      </div>
    </div>
  );
}
