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

  const user = await prisma.user.findUnique({
    where: { username: username },
    select: { name: true, image: true },
  });

  const displayName = user?.name || username;
  const title = `Send an anonymous message to ${displayName}`;
  const description =
    "Start an anonymous conversation. They won't know it's you unless you tell them!";

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: user?.image ? [user.image] : [],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: user?.image ? [user.image] : [],
    },
  };
}

export default async function Page({ params }: Props) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username: username },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      isPremium: true,
    },
  });

  if (!user) {
    return notFound();
  }

  return <ClientPage initialUserInfo={user} username={username} />;
}
