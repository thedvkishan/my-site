'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { AppLogo } from './AppLogo';

export function Footer() {
  return (
    <footer className="border-t bg-muted/10">
      <div className="container flex flex-col items-center justify-between gap-6 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex items-center gap-2">
            <AppLogo />
            <span className="font-bold tracking-tight">TetherSwap Zone</span>
        </div>
        
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          © {new Date().getFullYear()} TetherSwap Zone. Professional Digital Asset Exchange.
        </p>
        
        <div className="flex items-center gap-6">
          <Link href="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Support
          </Link>
          <Link href="/admin/login" aria-label="Admin Login" className="text-muted-foreground hover:text-primary transition-colors">
            <Plus className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
