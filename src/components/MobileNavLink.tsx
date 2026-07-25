'use client';

import { useMobileSidebar } from './MobileSidebarContext';
import Link from 'next/link';

export default function MobileNavLink({ href, children, className, ariaCurrent }: {
  href: string;
  children: React.ReactNode;
  className?: string;
  ariaCurrent?: 'page';
}) {
  const { setOpen } = useMobileSidebar();
  return (
    <Link
      href={href}
      className={className}
      aria-current={ariaCurrent}
      onClick={(e) => {
        setOpen(false);
        e.currentTarget.blur();
      }}
    >
      {children}
    </Link>
  );
}
