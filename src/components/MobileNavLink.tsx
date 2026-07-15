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
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        setOpen(false);
        e.currentTarget.blur();
      }}
    >
      {children}
    </Link>
  );
}
