
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { signupSchema, type SignupFormValues, SECURITY_QUESTIONS } from '@/lib/schemas';
import { useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2, UserPlus, ShieldAlert, Headphones, ArrowLeft, KeyRound } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SignupPageClient() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const auth = useAuth();
    const firestore = useFirestore();

    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'settings', 'appSettings');
    }, [firestore]);

    const { data: settings, isLoading: settingsLoading } = useDoc<any>(settingsRef);

    const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            securityQuestion: '',
            securityAnswer: '',
            captcha: false,
        },
    });

    async function onSignup(values: SignupFormValues) {
        setIsLoading(true);
        if (!auth || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Authentication service unavailable.' });
            setIsLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const user = userCredential.user;

            await setDoc(doc(firestore, 'users', user.uid), {
                userId: user.uid,
                name: values.name,
                email: values.email,
                phone: values.phone || '',
                balance: 0,
                status: 'active',
                securityQuestion: values.securityQuestion,
                securityAnswer: values.securityAnswer.toLowerCase().trim(),
                createdAt: new Date().toISOString(),
            });

            toast({ title: 'Welcome!', description: 'Account created successfully. Redirecting...' });
            router.push('/');
        } catch (error: any) {
            let errorMessage = 'Could not create account.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak.';
            }
            toast({ variant: 'destructive', title: 'Registration Failed', description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    }

    if (settingsLoading) {
        return (
            <div className="container mx-auto flex min-h-[50vh] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    const allowPublicSignup = settings?.allowPublicSignup;

    if (!allowPublicSignup) {
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

    return (
        <div className="container mx-auto max-w-2xl py-12 px-4">
            <Card className="shadow-xl">
                <CardHeader className="text-center">
                    <div className='flex justify-center mb-4'>
                        <div className='p-3 bg-primary/10 rounded-full border-4 border-primary/20'>
                            <UserPlus className='h-8 w-8 text-primary' />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold uppercase tracking-tight">Create Institutional Account</CardTitle>
                    <CardDescription>Join our professional USDT exchange network.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSignup)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="email" render={({ field }) => (
                                    <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input placeholder="you@domain.com" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="password" render={({ field }) => (
                                    <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                                    <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </div>

                            <div className="p-4 bg-muted/30 rounded-xl border border-dashed border-primary/20 space-y-4">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary">
                                    <KeyRound className="h-3 w-3" /> Security Configuration
                                </div>
                                <FormField control={form.control} name="securityQuestion" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Security Question (For Recovery)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select a question" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {SECURITY_QUESTIONS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="securityAnswer" render={({ field }) => (
                                    <FormItem><FormLabel>Secret Answer</FormLabel><FormControl><Input placeholder="Your answer" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </div>

                            <FormField control={form.control} name="captcha" render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border rounded-md bg-muted/50">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    <div className="space-y-1 leading-none"><FormLabel className="cursor-pointer">I am not a robot</FormLabel></div>
                                </FormItem>
                            )}/>

                            <Button type="submit" className="w-full h-12 font-black uppercase tracking-widest shadow-xl shadow-primary/20" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Register Now
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="justify-center border-t pt-6">
                    <p className="text-sm text-muted-foreground">
                        Already have an account? <Link href="/login" className="text-primary font-bold hover:underline">Sign In</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
