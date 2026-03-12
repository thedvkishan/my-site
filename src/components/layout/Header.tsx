
'use client';

import Link from 'next/link';
import { AppLogo } from './AppLogo';
import { useUser, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon } from 'lucide-react';
import { signOut } from 'firebase/auth';

export function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2 mr-8">
            <AppLogo />
            <span className="font-bold hidden sm:inline-block text-lg">TetherSwap Zone</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {!isUserLoading && (
            <>
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex items-center text-sm font-medium text-muted-foreground">
                    <UserIcon className="h-4 w-4 mr-1.5" />
                    {user.email}
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
