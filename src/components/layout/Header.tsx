import Link from 'next/link';
import { AppLogo } from './AppLogo';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <AppLogo />
            <span className="font-bold sm:inline-block">TetherSwap Zone</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
