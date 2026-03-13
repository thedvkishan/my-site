
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Standard Institutional Entry Point for AdminPower.
 */
export default function AdminPowerRootRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/adminpower/dashboard');
    }, [router]);

    return (
        <div className="container mx-auto flex min-h-[50vh] items-center justify-center">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
}
