
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { loginSchema, type LoginFormValues, forgotPasswordSchema, type ForgotPasswordValues } from '@/lib/schemas';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Loader2, LogIn, KeyRound } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isForgotLoading, setIsForgotLoading] = useState(false);
    const [forgotStep, setForgotStep] = useState<'email' | 'question' | 'success'>('email');
    const [userForReset, setUserForReset] = useState<any>(null);
    const auth = useAuth();
    const firestore = useFirestore();
    const redirectTo = searchParams.get('redirect') || '/';

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '', captcha: false },
    });

    const forgotForm = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: '', securityAnswer: '', newPassword: '', confirmNewPassword: '' },
    });

    async function onLogin(values: LoginFormValues) {
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, values.email, values.password);
            toast({ title: 'Welcome Back!', description: 'You have successfully logged in.' });
            router.push(redirectTo);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Login Failed', description: error.message || 'Invalid email or password.' });
        } finally { setIsLoading(false); }
    }

    async function handleForgotCheck() {
        setIsForgotLoading(true);
        try {
            const q = query(collection(firestore, 'users'), where('email', '==', forgotForm.getValues('email')));
            const snap = await getDocs(q);
            if (snap.empty) {
                toast({ variant: 'destructive', title: 'User Not Found', description: 'No user found with this email.' });
            } else {
                setUserForReset({ ...snap.docs[0].data(), id: snap.docs[0].id });
                setForgotStep('question');
            }
        } catch (e) { console.error(e); } finally { setIsForgotLoading(false); }
    }

    async function handleForgotReset(values: ForgotPasswordValues) {
        if (!userForReset) return;
        setIsForgotLoading(true);
        if (values.securityAnswer.toLowerCase().trim() !== userForReset.securityAnswer) {
            toast({ variant: 'destructive', title: 'Incorrect Answer', description: 'The security answer is incorrect.' });
            setIsForgotLoading(false);
            return;
        }

        try {
            // Note: In a real app, updatePassword requires a recent login. 
            // For this simulation, we'll inform the user and reset their state.
            toast({ title: 'Password Reset Simulation', description: 'In production, this would securely update your password via a recovery token.' });
            setForgotStep('success');
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally { setIsForgotLoading(false); }
    }

    return (
        <div className="container mx-auto max-w-md py-12 px-4">
            <Card className="shadow-xl">
                <CardHeader className="text-center">
                    <div className='flex justify-center mb-4'>
                        <div className='p-3 bg-primary/10 rounded-full border-4 border-primary/20'>
                            <LogIn className='h-8 w-8 text-primary' />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Login</CardTitle>
                    <CardDescription>Enter your email and password to access your account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onLogin)} className="space-y-6">
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="password" render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Password</FormLabel>
                                        <Dialog>
                                            <DialogTrigger asChild><Button variant="link" className="px-0 h-auto text-xs">Forgot Password?</Button></DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Password Recovery</DialogTitle>
                                                    <DialogDescription>Recover your account using your security question.</DialogDescription>
                                                </DialogHeader>
                                                {forgotStep === 'email' && (
                                                    <div className="space-y-4 py-4">
                                                        <Input placeholder="Enter your email" value={forgotForm.watch('email')} onChange={(e) => forgotForm.setValue('email', e.target.value)} />
                                                        <Button className="w-full" onClick={handleForgotCheck} disabled={isForgotLoading}>
                                                            {isForgotLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                            Check Email
                                                        </Button>
                                                    </div>
                                                )}
                                                {forgotStep === 'question' && userForReset && (
                                                    <Form {...forgotForm}>
                                                        <form onSubmit={forgotForm.handleSubmit(handleForgotReset)} className="space-y-4 py-4">
                                                            <div className="p-3 bg-secondary rounded-lg text-sm italic">"{userForReset.securityQuestion}"</div>
                                                            <FormField control={forgotForm.control} name="securityAnswer" render={({ field }) => (
                                                                <FormItem><FormControl><Input placeholder="Your answer" {...field} /></FormControl><FormMessage /></FormItem>
                                                            )}/>
                                                            <FormField control={forgotForm.control} name="newPassword" render={({ field }) => (
                                                                <FormItem><FormControl><Input type="password" placeholder="New Password" {...field} /></FormControl><FormMessage /></FormItem>
                                                            )}/>
                                                            <FormField control={forgotForm.control} name="confirmNewPassword" render={({ field }) => (
                                                                <FormItem><FormControl><Input type="password" placeholder="Confirm New Password" {...field} /></FormControl><FormMessage /></FormItem>
                                                            )}/>
                                                            <Button type="submit" className="w-full" disabled={isForgotLoading}>
                                                                {isForgotLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                Reset Password
                                                            </Button>
                                                        </form>
                                                    </Form>
                                                )}
                                                {forgotStep === 'success' && (
                                                    <div className="text-center py-8 space-y-4">
                                                        <p className="text-sm font-medium">Your password has been reset successfully.</p>
                                                        <Button variant="outline" onClick={() => setForgotStep('email')}>Close</Button>
                                                    </div>
                                                )}
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                    <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="captcha" render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border rounded-md bg-muted/50">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    <div className="space-y-1 leading-none"><FormLabel className="cursor-pointer">I am not a robot</FormLabel></div>
                                </FormItem>
                            )}/>
                            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign In</Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 text-center text-sm">
                    <p className="text-muted-foreground">Don't have an account? <Link href={`/signup?redirect=${redirectTo}`} className="text-primary font-semibold hover:underline">Sign Up</Link></p>
                </CardFooter>
            </Card>
        </div>
    );
}
