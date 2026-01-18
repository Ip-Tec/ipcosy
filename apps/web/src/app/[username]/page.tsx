import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@ipcosy/db";
import ClientPage from "./client-page";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { username } = await params;

  // Priority: username first, then name (case-insensitive)
  let user = await prisma.user.findFirst({
    where: {
      username: username,
    },
    select: { name: true, image: true },
  });

  // Fallback to name search only if username not found
  if (!user) {
    user = await prisma.user.findFirst({
      where: {
        name: username,
      },
      select: { name: true, image: true },
    });
  }

  const displayName = username || user?.name;
  const title = `Send an anonymous message to ${displayName}`;
  const description =
    "Start an anonymous conversation. They won't know it's you unless you tell them!";

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: ["./logo.png", ...(user?.image ? [user.image] : [])],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: ["./logo.png", ...(user?.image ? [user.image] : [])],
    },
  };
}

export default async function Page({ params }: Props) {
  const { username } = await params;

  // Priority: username first, then name (case-insensitive)
  let user = await prisma.user.findFirst({
    where: {
      username: username,
    },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      isPremium: true,
    },
  });

  // Fallback to name search only if username not found
  if (!user) {
    user = await prisma.user.findFirst({
      where: {
        name: username,
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        isPremium: true,
      },
    });
  }

  if (!user) {
    return notFound();
  }

  return <ClientPage initialUserInfo={user} username={username} />;
}
