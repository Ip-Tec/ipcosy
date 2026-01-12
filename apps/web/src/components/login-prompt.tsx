"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { Shield, Lock, Zap } from "lucide-react";

export function LoginPrompt() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] md:min-h-screen bg-background p-6">
      <div className="w-full max-w-sm bg-background border border-border rounded-[2.5rem] p-10 shadow-2xl space-y-10 text-center animate-in fade-in zoom-in duration-500">
        <div className="space-y-6">
          <div className="w-28 h-28 bg-primary/10 rounded-full flex items-center justify-center mx-auto transition-transform hover:scale-105 duration-300">
            <Image
              src="/logo.png"
              alt="Logo"
              width={70}
              height={70}
              className="object-contain"
            />
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-extrabold tracking-tight italic">
              IP~Cosy
            </h2>
            <p className="text-muted-foreground text-sm px-2 leading-relaxed font-medium">
              Unlock the full power of anonymous networking.
              <br />
              <span className="text-primary opacity-80">
                Join our premium community.
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 py-2">
          <div className="flex flex-col items-center gap-1">
            <div className="p-2 bg-primary/5 rounded-xl border border-primary/10">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">
              Secure
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="p-2 bg-primary/5 rounded-xl border border-primary/10">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">
              Private
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="p-2 bg-primary/5 rounded-xl border border-primary/10">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">
              Fast
            </span>
          </div>
        </div>

        <button
          onClick={() => signIn("google")}
          className="cursor-pointer w-full flex items-center justify-center gap-4 bg-foreground text-background font-black py-5 rounded-[1.5rem] hover:opacity-90 active:scale-[0.98] transition-all shadow-xl group"
        >
          <div className="bg-white p-1 rounded-full">
            <img
              src="https://www.google.com/favicon.ico"
              className="w-5 h-5"
              alt="Google"
            />
          </div>
          Continue with Google
        </button>

        <div className="space-y-4">
          <div className="flex items-center gap-2 justify-center opacity-40">
            <span className="h-px w-8 bg-current" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold">
              Join IPCosy Today
            </span>
            <span className="h-px w-8 bg-current" />
          </div>
        </div>
      </div>
    </div>
  );
}
