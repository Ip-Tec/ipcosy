import { prisma } from "@ipcosy/db";
import { InviteCard } from "@/components/chat/invite-card";
import { Metadata } from "next";

interface InvitePageProps {
  params: Promise<{
    code: string;
  }>;
}

export async function generateMetadata({
  params,
}: InvitePageProps): Promise<Metadata> {
  const { code } = await params;
  const chat = await prisma.chat.findUnique({
    where: { joinCode: code },
    select: { name: true, description: true },
  });

  return {
    title: chat ? `Join ${chat.name} on IPCosy` : "Join Group",
    description:
      chat?.description ||
      "You've been invited to join a group chat on IPCosy.",
  };
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { code } = await params;
  const chat = await prisma.chat.findUnique({
    where: { joinCode: code },
    include: {
      participants: {
        take: 5,
        select: {
          user: {
            select: {
              name: true,
              username: true,
              image: true,
            },
          },
        },
      },
      _count: {
        select: { participants: true },
      },
    },
  });

  if (!chat) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <h1 className="text-xl font-bold">Group Not Found</h1>
      </div>
    );
  }

  const isExpired = chat.joinCodeExpiresAt
    ? new Date() > new Date(chat.joinCodeExpiresAt)
    : false;

  const groupInfo = {
    id: chat.id,
    name: chat.name || "Unknown Group",
    description: (chat as any).description,
    membersCount: chat._count.participants,
    previewMembers: chat.participants.map((p) => p.user),
    isExpired,
  };

  return <InviteCard code={code} groupInfo={groupInfo} />;
}
