import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function ReferralPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  if (code) {
    (await cookies()).set("ipcosy-referral", code, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
  }

  redirect("/");
}
