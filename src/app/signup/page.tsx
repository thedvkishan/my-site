
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Headphones, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
    const router = useRouter();

    return (
        <div className="container mx-auto max-w-xl py-24 px-4">
            <Card className="shadow-2xl border-2 border-destructive/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-destructive animate-pulse" />
                <CardHeader className="text-center space-y-4">
                    <div className='flex justify-center'>
                        <div className='p-4 bg-destructive/10 rounded-full border-4 border-destructive/20'>
                            <ShieldAlert className='h-12 w-12 text-destructive' />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-3xl font-black uppercase tracking-tight">Registration Restricted</CardTitle>
                        <CardDescription className="text-base font-medium">Self-service account creation is currently disabled for institutional security.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="text-center space-y-6 py-8">
                    <p className="text-muted-foreground leading-relaxed">
                        TetherSwap Zone is currently operating as an invitation-only platform. 
                        New accounts must be provisioned by our internal settlement desk.
                    </p>
                    
                    <div className="grid gap-4">
                        <Button className="h-14 font-black uppercase tracking-widest text-lg shadow-xl shadow-primary/20" asChild>
                            <Link href="/contact">
                                <Headphones className="mr-2 h-5 w-5" /> Contact Settlement Desk
                            </Link>
                        </Button>
                        <Button variant="ghost" className="font-bold text-muted-foreground" onClick={() => router.push('/')}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t p-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    Institutional Protocol Restriction v4.2
                </CardFooter>
            </Card>
        </div>
    );
}
