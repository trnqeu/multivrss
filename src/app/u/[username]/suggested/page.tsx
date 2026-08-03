import PageHeader from "@/components/PageHeader";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCategories } from "@/app/actions/categories";
import { getTags } from "@/app/actions/tags";
import { notFound } from "next/navigation";
import { getSuggestedByCategory } from "@/lib/suggested-feeds";
import SuggestedPageClient from "./SuggestedPageClient";

interface SuggestedPageProps {
  params: Promise<{ username: string }>;
}

export default async function SuggestedPage({ params }: SuggestedPageProps) {
  const { username } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return notFound();
  if (session.user.username !== username) notFound();

  const categories = await getCategories();
  const tags = await getTags();
  const suggested = getSuggestedByCategory();

  return (
    <>
      <PageHeader categories={categories} tags={tags} username={session.user.username} email={session.user.email} />
      <SuggestedPageClient suggested={suggested} />
    </>
  );
}
