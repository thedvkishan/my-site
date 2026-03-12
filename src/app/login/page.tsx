
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
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Loader2, LogIn, KeyRound, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isForgotLoading, setIsForgotLoading] = useState(false);
    const [forgotStep, setForgotStep] = useState<'email' | 'question' | 'reset' | 'success'>('email');
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

    async function handleForgotCheckEmail() {
        const email = forgotForm.getValues('email');
        if (!email || !email.includes('@')) {
            toast({ variant: 'destructive', title: 'Invalid Email', description: 'Please enter a valid email address.' });
            return;
        }

        setIsForgotLoading(true);
        try {
            const q = query(collection(firestore, 'users'), where('email', '==', email));
            const snap = await getDocs(q);
            
            if (snap.empty) {
                toast({ 
                    variant: 'destructive', 
                    title: 'No User Found', 
                    description: 'We could not find an account with that email address.' 
                });
            } else {
                const userData = snap.docs[0].data();
                setUserForReset({ ...userData, id: snap.docs[0].id });
                setForgotStep('question');
            }
        } catch (e) { 
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to verify email. Please try again.' });
        } finally { 
            setIsForgotLoading(false); 
        }
    }

    async function handleVerifyAnswer() {
        const answer = forgotForm.getValues('securityAnswer');
        if (!answer) {
            toast({ variant: 'destructive', title: 'Answer Required', description: 'Please provide the answer to your security question.' });
            return;
        }

        if (answer.toLowerCase().trim() === userForReset.securityAnswer) {
            setForgotStep('reset');
        } else {
            toast({ 
                variant: 'destructive', 
                title: 'Incorrect Answer', 
                description: 'The answer provided does not match our records.' 
            });
        }
    }

    async function handlePasswordReset(values: ForgotPasswordValues) {
        setIsForgotLoading(true);
        try {
            // In Firebase, standard password reset for forgotten passwords is done via reset emails.
            // For this UI flow prototype, we simulate the update successfully.
            // In production, this would call a backend function to update the password securely.
            await new Promise(resolve => setTimeout(resolve, 1500));
            setForgotStep('success');
            toast({ title: 'Password Updated', description: 'Your password has been reset successfully.' });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally { 
            setIsForgotLoading(false); 
        }
    }

    const resetForgotState = () => {
        setForgotStep('email');
        setUserForReset(null);
        forgotForm.reset();
    };

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
                                        <Dialog onOpenChange={(open) => !open && resetForgotState()}>
                                            <DialogTrigger asChild><Button variant="link" className="px-0 h-auto text-xs">Forgot Password?</Button></DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Password Recovery</DialogTitle>
                                                    <DialogDescription>Recover your account using your security question.</DialogDescription>
                                                </DialogHeader>
                                                
                                                {forgotStep === 'email' && (
                                                    <div className="space-y-4 py-4">
                                                        <Form {...forgotForm}>
                                                            <FormField control={forgotForm.control} name="email" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Registered Email</FormLabel>
                                                                    <FormControl><Input placeholder="Enter your email" {...field} /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}/>
                                                        </Form>
                                                        <Button className="w-full" onClick={handleForgotCheckEmail} disabled={isForgotLoading}>
                                                            {isForgotLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                            Continue
                                                        </Button>
                                                    </div>
                                                )}

                                                {forgotStep === 'question' && userForReset && (
                                                    <div className="space-y-4 py-4">
                                                        <div className="p-4 bg-muted rounded-xl border border-dashed border-primary/30">
                                                            <p className="text-xs font-bold text-primary uppercase mb-2">Security Question:</p>
                                                            <p className="text-sm italic">"{userForReset.securityQuestion}"</p>
                                                        </div>
                                                        <Form {...forgotForm}>
                                                            <FormField control={forgotForm.control} name="securityAnswer" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Your Answer</FormLabel>
                                                                    <FormControl><Input placeholder="Enter secret answer" {...field} /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}/>
                                                        </Form>
                                                        <Button className="w-full" onClick={handleVerifyAnswer}>
                                                            Verify Identity
                                                        </Button>
                                                    </div>
                                                )}

                                                {forgotStep === 'reset' && (
                                                    <Form {...forgotForm}>
                                                        <form onSubmit={forgotForm.handleSubmit(handlePasswordReset)} className="space-y-4 py-4">
                                                            <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-600 rounded-lg text-xs font-medium mb-2">
                                                                <KeyRound className="h-4 w-4" /> Identity Verified. Set your new password.
                                                            </div>
                                                            <FormField control={forgotForm.control} name="newPassword" render={({ field }) => (
                                                                <FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                                                            )}/>
                                                            <FormField control={forgotForm.control} name="confirmNewPassword" render={({ field }) => (
                                                                <FormItem><FormLabel>Confirm New Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
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
                                                        <div className="flex justify-center">
                                                            <div className="p-3 bg-green-100 rounded-full">
                                                                <KeyRound className="h-8 w-8 text-green-600" />
                                                            </div>
                                                        </div>
                                                        <h3 className="text-lg font-bold">Password Reset!</h3>
                                                        <p className="text-sm text-muted-foreground">Your password has been updated. You can now log in with your new credentials.</p>
                                                        <Button className="w-full" variant="outline" onClick={() => resetForgotState()}>
                                                            Return to Login
                                                        </Button>
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
