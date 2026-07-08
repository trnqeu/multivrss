// Revalidates a user's cached feed/sidebar data from code that runs outside
// the current request's scope (a detached background task, or a separate
// worker process) — revalidateTag()/updateTag() only work inside an active
// request, so out-of-band callers hit this internal route instead.
export async function triggerRevalidate(userId: string): Promise<void> {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/internal/revalidate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': process.env.INTERNAL_SECRET ?? '',
    },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    console.error(`Revalidation failed for userId ${userId}: ${res.status}`);
  }
}
