import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from 'next/navigation';
import { getCategories } from "@/app/actions/categories";
import { getTags } from "@/app/actions/tags";
import { getAccountSecurityInfo } from "@/app/actions/account";
import PageHeader from "@/components/PageHeader";
import AccountDangerZoneClient from "./AccountDangerZoneClient";

interface AccountSettingsPageProps {
  params: Promise<{ username: string }>;
}

export default async function AccountSettingsPage({ params }: AccountSettingsPageProps) {
  const { username } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return notFound();
  if (session.user.username !== username) {
    notFound();
  }

  const [categories, tags, securityInfo] = await Promise.all([
    getCategories(),
    getTags(),
    getAccountSecurityInfo(),
  ]);

  return (
    <>
      <PageHeader categories={categories} tags={tags} username={session.user.username} email={session.user.email} />
      <AccountDangerZoneClient username={session.user.username} hasPassword={securityInfo?.hasPassword ?? false} />
    </>
  );
}
