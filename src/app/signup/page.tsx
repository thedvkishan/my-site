
import { Suspense } from 'react';
import SignupPageClient from './SignupClient';
import { Loader2 } from 'lucide-react';

/**
 * Institutional Signup Page (Server Component)
 * Dynamically switches between restricted access and active enrollment
 * based on administrative protocols.
 */
export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto flex min-h-[50vh] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        }>
            <SignupPageClient />
        </Suspense>
    );
}
