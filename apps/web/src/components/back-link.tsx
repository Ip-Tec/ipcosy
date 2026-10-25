"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
export function BackLink({ children, className }: { children: ReactNode; className?: string }) {
  const router = useRouter();
  return <Link href="/" className={className} onClick={(event) => { event.preventDefault(); history.length > 1 ? router.back() : router.replace("/"); }}>{children}</Link>;
}
