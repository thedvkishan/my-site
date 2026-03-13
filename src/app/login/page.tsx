import { Suspense } from 'react';
import LoginPageClient from './LoginClient';
import { Loader2 } from 'lucide-react';

/**
 * Login Page (Server Component)
 * Wraps the Client Component in a Suspense boundary to support useSearchParams()
 * during static rendering and build time.
 */
export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto flex min-h-[50vh] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        }>
            <LoginPageClient />
        </Suspense>
    );
}
