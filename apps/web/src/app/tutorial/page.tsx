"use client";

import { MessageSquare, Shield, Zap, Heart, Users, Trash2 } from "lucide-react";
import Link from "next/link";

export default function TutorialPage() {
  const steps = [
    {
      title: "Anonymous Messaging",
      description:
        "Send messages to anyone without revealing your identity. The recipient will see you as 'Anonymous'.",
      icon: <Shield className="w-10 h-10 text-purple-500" />,
      color: "bg-purple-500/10",
    },
    {
      title: "Group Chats",
      description:
        "Join or create group chats with unique invite links. Share the link with friends to start chatting.",
      icon: <Users className="w-10 h-10 text-blue-500" />,
      color: "bg-blue-500/10",
    },
    {
      title: "Privacy First",
      description:
        "All messages are automatically deleted after 72 hours. We don't store your personal data longer than necessary.",
      icon: <Trash2 className="w-10 h-10 text-red-500" />,
      color: "bg-red-500/10",
    },
    {
      title: "Premium Features",
      description:
        "Upgrade to Premium to get unlimited groups, see message delivery details, and more.",
      icon: <Zap className="w-10 h-10 text-yellow-500" />,
      color: "bg-yellow-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-black tracking-tight">
            How IP~Cosy Works
          </h1>
          <p className="text-muted-foreground text-lg">
            Your guide to secure and anonymous connections.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`p-8 rounded-[2.5rem] border border-border/50 shadow-xl ${step.color} space-y-4 hover:scale-[1.02] transition-transform`}
            >
              <div className="w-16 h-16 rounded-3xl bg-white dark:bg-sidebar flex items-center justify-center shadow-lg">
                {step.icon}
              </div>
              <h2 className="text-2xl font-black">{step.title}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-sidebar p-10 rounded-[3rem] border border-border shadow-2xl text-center space-y-6">
          <h2 className="text-3xl font-black italic">Ready to start?</h2>
          <p className="text-muted text-sm px-4">
            Connect with Google to unlock full dashboard access or start sending
            anonymous messages right away via profile links.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center pt-4">
            <Link
              href="/"
              className="bg-primary text-white font-black px-10 py-5 rounded-[1.5rem] shadow-xl hover:opacity-90 active:scale-95 transition-all"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>

        <div className="text-center pt-8">
          <p className="text-[10px] font-bold text-muted uppercase tracking-[0.3em]">
            IP~Tec Engineering &copy; 2026
          </p>
        </div>
      </div>
    </div>
  );
}
