import Link from 'next/link';

export function Footer() {
  return (
    <footer className="py-6 md:px-8 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
          © {new Date().getFullYear()} TetherSwap Zone. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
            Contact
          </Link>
          <Link href="/admin/login" className="text-sm text-muted-foreground hover:text-foreground">
            For Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
