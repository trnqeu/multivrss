'use client';

import { useMobileSidebar } from './MobileSidebarContext';
import Link from 'next/link';

export default function MobileNavLink({ href, children, className }: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { setOpen } = useMobileSidebar();
  return (
    <Link href={href} className={className} onClick={() => setOpen(false)}>
      {children}
    </Link>
  );
}
