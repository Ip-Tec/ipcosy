"use client";

import { ArrowRight, LockKeyhole, MessageCircle, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

type LandingPageProps = { onContinue: () => void };

const steps = [
  {
    number: "01",
    title: "Share your link",
    description: "Choose your IPCosy name and send your profile link to friends.",
  },
  {
    number: "02",
    title: "Get a message",
    description: "They can leave a note without showing their name to you.",
  },
  {
    number: "03",
    title: "Reply your way",
    description: "Answer from your inbox, or continue the conversation in chat.",
  },
];

export function LandingPage({ onContinue }: LandingPageProps) {
  const { setTheme } = useTheme();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a href="/" aria-label="IP Cosy home" className="flex shrink-0 items-center gap-2.5">
            <img src="/logo.png" alt="" className="h-9 w-9 rounded-xl object-contain" />
            <span className="text-lg font-bold tracking-tight">IP~Cosy</span>
          </a>

          <nav aria-label="Main navigation" className="hidden items-center gap-7 text-sm text-muted-foreground sm:flex">
            <a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#privacy" className="transition-colors hover:text-foreground">Privacy</a>
          </nav>

          <div className="flex items-center gap-2">
            <div aria-label="Theme" className="flex items-center rounded-xl border border-border bg-sidebar p-1">
              <button
                type="button"
                aria-label="Use light theme"
                title="Light theme"
                onClick={() => setTheme("light")}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              >
                <Sun className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Use dark theme"
                title="Dark theme"
                onClick={() => setTheme("dark")}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              >
                <Moon className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Sign in <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div>
          <p className="mb-5 text-sm font-semibold text-primary">Anonymous messages, in one place</p>
          <h1 className="max-w-xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.6rem]">
            Give your friends a way to say what they really think.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Share your IPCosy link. Friends can send you a message without showing their name, and you can reply from your inbox or continue in chat.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Create your free account <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-sidebar px-5 py-3.5 text-sm font-semibold transition-colors hover:bg-background"
            >
              How it works
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Sign in with Google to set up your profile.</p>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="overflow-hidden rounded-2xl border border-border bg-sidebar shadow-lg shadow-black/5">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Your messages</p>
                <p className="mt-0.5 text-xs text-muted-foreground">A sample of your IPCosy inbox</p>
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <p className="mb-3 text-xs font-medium text-muted-foreground">Example message · Anonymous</p>
              <div className="max-w-sm rounded-2xl rounded-tl-sm bg-bubble-in px-4 py-3.5 text-sm leading-6 text-bubble-in-text">
                You always make people feel welcome. I hope you know that.
              </div>
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-border p-4">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-xs leading-5 text-muted-foreground">
                  You choose whether to reply. Anonymous to the recipient doesn’t mean IPCosy collects no information.
                </p>
              </div>
            </div>
            <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
              Replies and chats stay together in your inbox.
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-6 border-y border-border bg-sidebar px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">How IPCosy works</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Start with a link. The messages and replies are waiting when you come back.
          </p>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <article key={step.number} className="rounded-2xl border border-border bg-background p-5 sm:p-6">
                <p className="text-xs font-semibold text-primary">{step.number}</p>
                <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="privacy" className="scroll-mt-6 px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto flex max-w-6xl items-start gap-4 rounded-2xl border border-border bg-sidebar p-5 sm:p-6">
          <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h2 className="text-base font-semibold">A clear note about anonymity</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
              Your name isn’t shown to the person receiving an anonymous message. IPCosy may collect account and device information, and some sender details can be available through paid features. Share your link with people you trust.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-sidebar px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 text-xs leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <a href="/" className="font-semibold text-foreground">IP~Cosy</a>
          <p>Anonymous messages and chat, in one place.</p>
          <p>Messages are anonymous to recipients; IPCosy may collect account and device details.</p>
        </div>
      </footer>
    </main>
  );
}
