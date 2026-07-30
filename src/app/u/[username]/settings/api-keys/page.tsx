import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from 'next/navigation';
import { prisma } from "@/lib/prisma";
import { getCategories } from "@/app/actions/categories";
import { getTags } from "@/app/actions/tags";
import { listApiKeys } from "@/app/actions/api-keys";
import PageHeader from "@/components/PageHeader";
import ApiKeysClient from "./ApiKeysClient";

interface ApiKeysPageProps {
  params: Promise<{ username: string }>;
}

export default async function ApiKeysPage({ params }: ApiKeysPageProps) {
  const { username } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return notFound();
  if (session.user.username !== username) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPremium: true },
  });

  const [categories, tags] = await Promise.all([
    getCategories(),
    getTags(),
  ]);

  if (!user?.isPremium) {
    return (
      <>
        <PageHeader categories={categories} tags={tags} username={session.user.username} email={session.user.email} />
        <main className="flex-1 min-h-0 overflow-y-auto relative scroll-smooth bg-background flex items-center justify-center p-8">
          <div className="max-w-md flex flex-col gap-4 text-center">
            <h1 className="tracking-[0.2em] text-terracotta font-bold">
              PREMIUM FEATURE
            </h1>
            <p className="text-foreground text-[11px] font-bold leading-relaxed uppercase tracking-widest">
              API keys are available on the Premium plan. Upgrade your account to connect external tools like an MCP server.
            </p>
          </div>
        </main>
      </>
    );
  }

  const apiKeys = await listApiKeys();

  return (
    <>
      <PageHeader categories={categories} tags={tags} username={session.user.username} email={session.user.email} />
      <ApiKeysClient username={session.user.username} initialKeys={apiKeys} />
    </>
  );
}
