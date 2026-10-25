"use client";

import { ArrowDown, ArrowRight, ArrowUpRight, HeartHandshake, LockKeyhole, MessageCircle, MessageCircleMore, Moon, Sun, UsersRound } from "lucide-react";
import { useTheme } from "next-themes";

type LandingPageProps = { onContinue: () => void };

const steps = [
  { number: "01", title: "Make your link", description: "Choose your IPCosy name and get a personal link to share.", icon: UsersRound },
  { number: "02", title: "Hear what they think", description: "Friends can leave you a message without putting their name on it.", icon: MessageCircleMore },
  { number: "03", title: "Keep it going", description: "Read replies in your inbox and continue the conversation in chat.", icon: HeartHandshake },
];

export function LandingPage({ onContinue }: LandingPageProps) {
  const { setTheme } = useTheme();

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <a href="/" aria-label="IP Cosy home" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-sidebar shadow-sm ring-1 ring-border"><img src="/logo.png" alt="" className="h-8 w-8 object-contain" /></span>
          <span className="text-lg font-black tracking-tight">IP<span className="text-[#7566f4]">~</span>Cosy</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm font-semibold text-muted-foreground md:flex">
          <a href="#how-it-works" className="transition hover:text-foreground">How it works</a>
          <a href="#your-space" className="transition hover:text-foreground">Inbox</a>
          <a href="#privacy" className="transition hover:text-foreground">Privacy</a>
        </nav>
        <div className="flex items-center gap-2">
          <div aria-label="Theme" className="flex items-center rounded-xl border border-border bg-sidebar p-1">
            <button type="button" aria-label="Use light theme" title="Light theme" onClick={() => setTheme("light")} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground"><Sun className="h-4 w-4" /></button>
            <button type="button" aria-label="Use dark theme" title="Dark theme" onClick={() => setTheme("dark")} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground"><Moon className="h-4 w-4" /></button>
          </div>
          <button onClick={onContinue} className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 sm:px-5">Sign in <ArrowUpRight className="h-4 w-4" /></button>
        </div>
      </header>

      <section className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 sm:pb-24 sm:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-12 lg:pb-28 lg:pt-14">
        <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-8 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute right-0 top-20 h-72 w-72 rounded-full bg-bubble-out/50 blur-3xl" />
        <div className="relative z-[1] max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-sidebar/80 px-3.5 py-2 text-sm font-semibold text-primary shadow-sm"><MessageCircleMore className="h-4 w-4" /> Anonymous messages, in one place</div>
          <h1 className="max-w-2xl text-[3.3rem] font-black leading-[0.98] tracking-[-0.065em] text-foreground sm:text-6xl lg:text-[4.65rem]">Let your friends say <span className="relative inline-block text-[#7162ec]">what they really think<svg aria-hidden="true" className="absolute -bottom-2 left-0 w-full" viewBox="0 0 260 12" fill="none"><path d="M3 8C75 2 174 2 257 7" stroke="#B7AEFF" strokeWidth="5" strokeLinecap="round" /></svg></span>.</h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">Give your friends a place to say what’s on their mind. Start with an anonymous message, then keep the conversation going in your own inbox.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button onClick={onContinue} className="inline-flex cursor-pointer items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-4 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(51,144,236,0.20)] transition hover:-translate-y-0.5 hover:opacity-90">Get your free link <ArrowRight className="h-4 w-4" /></button>
            <a href="#how-it-works" className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-bold text-muted-foreground transition hover:bg-sidebar">See how it works <ArrowDown className="h-4 w-4" /></a>
          </div>
        </div>

        <div className="relative z-[1] mx-auto w-full max-w-[510px] lg:ml-auto">
          <div aria-hidden="true" className="absolute -right-6 -top-8 h-28 w-28 rounded-full border border-primary/20 sm:-right-9 sm:-top-10 sm:h-36 sm:w-36" /><div aria-hidden="true" className="absolute -bottom-7 -left-5 h-24 w-24 rounded-full bg-bubble-out/60 sm:-bottom-9 sm:-left-7 sm:h-32 sm:w-32" />
          <div className="relative rounded-[2rem] border border-border bg-sidebar p-4 shadow-[0_30px_90px_rgba(35,34,71,0.13)] sm:rounded-[2.4rem] sm:p-6">
            <div className="flex items-center justify-between border-b border-border px-1 pb-4">
              <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><MessageCircle className="h-5 w-5" /></div><div><p className="text-sm font-extrabold">Your inbox</p><p className="mt-0.5 text-xs text-muted-foreground">A sample of your IPCosy inbox</p></div></div>
              <span className="rounded-full bg-bubble-out px-3 py-1.5 text-xs font-semibold text-bubble-out-text">Inbox</span>
            </div>
            <div className="py-5"><p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.17em] text-muted-foreground">Example message</p><div className="rounded-2xl rounded-tl-md bg-bubble-in p-4 sm:p-5"><div className="mb-4 flex items-center gap-2 text-xs font-bold text-muted-foreground"><span className="h-2 w-2 rounded-full bg-primary" /> Someone sent you a note</div><p className="text-[15px] font-semibold leading-6 text-bubble-in-text sm:text-base sm:leading-7">“You make people feel welcome. I hope you know that.”</p><p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sent anonymously</p></div></div>
            <div className="rounded-2xl border border-border p-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><LockKeyhole className="h-4 w-4" /></div><div className="flex-1"><p className="text-xs font-extrabold">Choose what to answer</p><p className="mt-1 text-[11px] text-muted-foreground">Read it, reply, or leave it for later.</p></div><ArrowUpRight className="h-4 w-4 text-muted-foreground" /></div></div>
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-xs font-bold text-white"><span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/10 text-[#c2baff]"><MessageCircle className="h-3.5 w-3.5" /></span>When you’re ready, take it to chat<ArrowRight className="ml-auto h-4 w-4 text-[#c2baff]" /></div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-8 border-y border-border bg-sidebar px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-7xl"><div className="mx-auto max-w-2xl text-center"><p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary">How IPCosy works</p><h2 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-4xl">Three steps, then your link is ready.</h2><p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">Choose a name, share your profile link, and receive messages from friends.</p></div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">{steps.map(({ number, title, description, icon: Icon }) => <article key={number} className="rounded-[1.7rem] border border-border bg-background p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#272346]/5 sm:p-7"><div className="flex items-center justify-between"><span className="text-xs font-black tracking-widest text-muted-foreground">{number}</span><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span></div><h3 className="mt-7 text-lg font-extrabold tracking-tight">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></article>)}</div>
        </div>
      </section>

      <section id="your-space" className="px-5 py-16 sm:px-8 sm:py-20 lg:px-12"><div className="mx-auto grid max-w-7xl items-center gap-10 rounded-[2rem] bg-primary p-7 text-white sm:p-10 lg:grid-cols-[1fr_auto] lg:gap-16 lg:p-14"><div><p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/75">Stay in control</p><h2 className="mt-3 max-w-xl text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl">Inbox first. Chat when you’re ready.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">Read a message in your inbox. Reply when you’re ready, then keep the conversation going in chat.</p></div><button onClick={onContinue} className="inline-flex cursor-pointer items-center justify-center gap-3 rounded-2xl bg-sidebar px-6 py-4 text-sm font-bold text-foreground transition hover:-translate-y-0.5 hover:bg-background">Get started <ArrowRight className="h-4 w-4" /></button></div></section>

      <section id="privacy" className="scroll-mt-8 px-5 pb-16 sm:px-8 sm:pb-20 lg:px-12"><div className="mx-auto max-w-4xl rounded-[1.7rem] border border-border bg-sidebar p-6 sm:p-8"><div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><LockKeyhole className="h-5 w-5" /></span><div><p className="text-base font-extrabold">A clear note about anonymity</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Your name isn’t shown to the person receiving an anonymous message. IPCosy may collect account and device information, and some sender details can be available through paid features. Share your link with people you trust.</p></div></div></div></section>

      <footer className="border-t border-border bg-sidebar px-5 py-7 sm:px-8 lg:px-12"><div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><a href="/" className="flex items-center gap-2 font-extrabold text-foreground"><img src="/logo.png" alt="" className="h-7 w-7 object-contain" />IP~Cosy</a><p>Anonymous messages and chat, in one place.</p><p>Messages are anonymous to recipients. IPCosy may collect account and device details.</p></div></footer>
    </main>
  );
}
