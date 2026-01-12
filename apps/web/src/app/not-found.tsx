"use client";

import Link from "next/link";
import { Ghost, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0e1621] flex flex-col items-center justify-center p-4 text-white overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] -z-10 animate-pulse delay-700" />

      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="relative">
          <div className="h-40 w-40 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10 shadow-2xl backdrop-blur-sm">
            <Ghost className="w-20 h-20 text-primary animate-bounce-slow" />
          </div>
          <div className="absolute -top-4 -right-4 h-12 w-12 bg-primary rounded-full flex items-center justify-center font-black rotate-12 shadow-lg">
            404
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter">
            Lost in the shadows?
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The page you're looking for has vanished into thin air. It might
            have been deleted, or the link is just broken.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-2xl font-bold shadow-xl hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <Home className="w-4 h-4" /> Back to Safety
          </Link>
          <button
            onClick={() => window.history.back()}
            className="cursor-pointer flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white/70 py-4 rounded-2xl font-bold hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em]">
          IP~Cosy • Secure & Anonymous
        </p>
      </div>
    </div>
  );
}
