import Link from "next/link";

export default function InviteExpiredPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
      <div className="space-y-6 max-w-md">
        <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto text-4xl">
          ⚠️
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Invite Expired
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          This invitation link is no longer valid or has expired. You need a
          valid referral link from an existing member to join IPCosy.
        </p>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-primary text-white font-bold py-4 px-8 rounded-2xl hover:opacity-90 transition-all shadow-lg"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
