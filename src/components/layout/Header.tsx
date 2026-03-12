'use client';

import Link from 'next/link';
import { AppLogo } from './AppLogo';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon, Wallet } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';

export function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile } = useDoc<{ balance?: number }>(profileRef);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2 mr-2 md:mr-8">
            <AppLogo />
            <span className="font-bold hidden xs:inline-block text-sm md:text-lg">TetherSwap</span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 md:gap-4">
          {!isUserLoading && (
            <>
              {user ? (
                <div className="flex items-center gap-1.5 md:gap-4">
                  <div className="flex items-center bg-primary/10 px-2 py-1 md:px-3 md:py-1.5 rounded-full border border-primary/20">
                    <Wallet className="h-3.5 w-3.5 mr-1 md:h-4 md:w-4 md:mr-2 text-primary" />
                    <span className="text-xs md:text-sm font-bold text-primary whitespace-nowrap">
                      {(profile?.balance || 0).toLocaleString()} USDT
                    </span>
                  </div>
                  <div className="hidden lg:flex items-center text-sm font-medium text-muted-foreground truncate max-w-[150px]">
                    <UserIcon className="h-4 w-4 mr-1.5" />
                    {user.email}
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="h-8 px-2 md:h-10 md:px-3">
                    <LogOut className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Logout</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1 md:gap-2">
                  <Button variant="ghost" size="sm" asChild className="h-8 px-2 md:h-10 md:px-4">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button size="sm" asChild className="h-8 px-2 md:h-10 md:px-4">
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
