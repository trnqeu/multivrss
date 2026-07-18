'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-white px-6 text-center text-black">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wide">
              Something went wrong
            </h1>
            <p className="mt-2">
              We&apos;ve been notified and are looking into it.
            </p>
          </div>
        </main>
      </body>
    </html>
  )
}
