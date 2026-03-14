
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
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Loader2, LogIn, KeyRound, Headphones, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPageClient() {
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

    const isServicesUnavailable = !auth || !firestore;

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
        if (isServicesUnavailable) {
            toast({ 
                variant: 'destructive', 
                title: 'Infrastructure Error', 
                description: 'Authentication protocol is offline. Please verify institutional environment variables.' 
            });
            setIsLoading(false);
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth!, values.email, values.password);
            const user = userCredential.user;
            
            // Check user status in Firestore immediately
            const userDoc = await getDoc(doc(firestore!, 'users', user.uid));
            const userData = userDoc.data();
            
            if (userData?.status === 'banned') {
                await signOut(auth!);
                toast({ 
                    variant: 'destructive', 
                    title: 'Access Revoked', 
                    description: 'This identity has been permanently banned from the terminal.' 
                });
                setIsLoading(false);
                return;
            }

            toast({ title: 'Terminal Access Granted', description: 'Institutional session initialized successfully.' });
            router.push(redirectTo);
        } catch (error: any) {
            console.error("Login Protocol Failure:", error);
            let errorMessage = 'Invalid protocol credentials.';
            
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                errorMessage = 'Security Error: Invalid password or email combination.';
            } else if (error.code === 'auth/user-not-found') {
                errorMessage = 'Identity Error: No account matches these credentials.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Connectivity Error: Unable to reach the central ledger.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Security Lock: Too many failed attempts. Access temporarily restricted.';
            }

            toast({ 
                variant: 'destructive', 
                title: 'Login Protocol Error', 
                description: errorMessage 
            });
        } finally { 
            setIsLoading(false); 
        }
    }

    async function handleForgotCheckEmail() {
        const email = forgotForm.getValues('email');
        if (!email || !email.includes('@')) {
            toast({ variant: 'destructive', title: 'Invalid Email', description: 'Please enter a valid institutional email.' });
            return;
        }

        if (!firestore) {
            toast({ variant: 'destructive', title: 'Ledger Error', description: 'Central database is currently unreachable.' });
            return;
        }

        setIsForgotLoading(true);
        try {
            const q = query(collection(firestore, 'users'), where('email', '==', email));
            const snap = await getDocs(q);
            
            if (snap.empty) {
                toast({ 
                    variant: 'destructive', 
                    title: 'Identity Missing', 
                    description: 'No provisioned account found with that email address.' 
                });
            } else {
                const userData = snap.docs[0].data();
                setUserForReset({ ...userData, id: snap.docs[0].id });
                setForgotStep('question');
            }
        } catch (e) { 
            toast({ variant: 'destructive', title: 'Verification Error', description: 'Failed to authenticate email identity.' });
        } finally { 
            setIsForgotLoading(false); 
        }
    }

    async function handleVerifyAnswer() {
        const answer = forgotForm.getValues('securityAnswer');
        if (!answer) {
            toast({ variant: 'destructive', title: 'Protocol Required', description: 'Identity verification secret is mandatory.' });
            return;
        }

        if (answer.toLowerCase().trim() === userForReset?.securityAnswer) {
            setForgotStep('reset');
        } else {
            toast({ 
                variant: 'destructive', 
                title: 'Verification Failed', 
                description: 'The secret answer provided does not match terminal records.' 
            });
        }
    }

    async function handlePasswordReset(values: ForgotPasswordValues) {
        setIsForgotLoading(true);
        try {
            // Simulated reset for prototyping logic
            await new Promise(resolve => setTimeout(resolve, 1500));
            setForgotStep('success');
            toast({ title: 'Protocol Updated', description: 'Institutional password has been successfully reset.' });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: 'Security protocol update was rejected.' });
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
            {isServicesUnavailable && (
                <Alert variant="destructive" className="mb-6 border-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="font-black uppercase text-xs">Configuration Incomplete</AlertTitle>
                    <AlertDescription className="text-xs font-medium">
                        The terminal is unable to connect to Firebase. Please verify your .env file credentials.
                    </AlertDescription>
                </Alert>
            )}
            
            <Card className="shadow-2xl border-2">
                <CardHeader className="text-center">
                    <div className='flex justify-center mb-4'>
                        <div className='p-3 bg-primary/10 rounded-full border-4 border-primary/20'>
                            <LogIn className='h-8 w-8 text-primary' />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-black uppercase tracking-tight">Institutional Login</CardTitle>
                    <CardDescription className="text-xs font-medium">Initialize session via centralized identity protocol.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onLogin)} className="space-y-6">
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-black uppercase">Institutional Email</FormLabel><FormControl><Input placeholder="identity@domain.com" {...field} disabled={isServicesUnavailable} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="password" render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel className="text-[10px] font-black uppercase">Security Key</FormLabel>
                                        <Dialog onOpenChange={(open) => !open && resetForgotState()}>
                                            <DialogTrigger asChild><Button variant="link" className="px-0 h-auto text-[10px] font-bold" disabled={isServicesUnavailable}>Recovery Protocol?</Button></DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase"><KeyRound className="h-5 w-5" /> Account Recovery</DialogTitle>
                                                    <DialogDescription className="text-xs">Recover terminal access using your security protocol.</DialogDescription>
                                                </DialogHeader>
                                                
                                                {forgotStep === 'email' && (
                                                    <div className="space-y-4 py-4">
                                                        <Form {...forgotForm}>
                                                            <FormField control={forgotForm.control} name="email" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-[10px] font-black uppercase">Registered Email</FormLabel>
                                                                    <FormControl><Input placeholder="Enter your identity email" {...field} /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}/>
                                                        </Form>
                                                        <Button className="w-full h-12 font-black uppercase tracking-widest text-xs" onClick={handleForgotCheckEmail} disabled={isForgotLoading}>
                                                            {isForgotLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                            Verify Identity
                                                        </Button>
                                                    </div>
                                                )}

                                                {forgotStep === 'question' && userForReset && (
                                                    <div className="space-y-4 py-4">
                                                        <div className="p-4 bg-primary/5 rounded-xl border-2 border-dashed border-primary/20">
                                                            <p className="text-[10px] font-black text-primary uppercase mb-2">Protocol Secret Question:</p>
                                                            <p className="text-sm italic font-medium">"{userForReset.securityQuestion}"</p>
                                                        </div>
                                                        <Form {...forgotForm}>
                                                            <FormField control={forgotForm.control} name="securityAnswer" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-[10px] font-black uppercase">Protocol Answer</FormLabel>
                                                                    <FormControl><Input placeholder="Enter secret answer" {...field} /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}/>
                                                        </Form>
                                                        <Button className="w-full h-12 font-black uppercase tracking-widest text-xs" onClick={handleVerifyAnswer}>
                                                            Confirm Identity Secret
                                                        </Button>
                                                    </div>
                                                )}

                                                {forgotStep === 'reset' && (
                                                    <Form {...forgotForm}>
                                                        <form onSubmit={forgotForm.handleSubmit(handlePasswordReset)} className="space-y-4 py-4">
                                                            <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-600 rounded-lg text-[10px] font-bold uppercase mb-2">
                                                                <KeyRound className="h-4 w-4" /> Identity Verified. Deploy new credentials.
                                                            </div>
                                                            <FormField control={forgotForm.control} name="newPassword" render={({ field }) => (
                                                                <FormItem><FormLabel className="text-[10px] font-black uppercase">New Terminal Key</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                                                            )}/>
                                                            <FormField control={forgotForm.control} name="confirmNewPassword" render={({ field }) => (
                                                                <FormItem><FormLabel className="text-[10px] font-black uppercase">Confirm Key</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                                                            )}/>
                                                            <Button type="submit" className="w-full h-12 font-black uppercase tracking-widest text-xs" disabled={isForgotLoading}>
                                                                {isForgotLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                Update Security Key
                                                            </Button>
                                                        </form>
                                                    </Form>
                                                )}

                                                {forgotStep === 'success' && (
                                                    <div className="text-center py-8 space-y-4">
                                                        <div className="flex justify-center">
                                                            <div className="p-3 bg-green-100 rounded-full border-4 border-green-200">
                                                                <KeyRound className="h-8 w-8 text-green-600" />
                                                            </div>
                                                        </div>
                                                        <h3 className="text-lg font-black uppercase tracking-tight">Security Updated</h3>
                                                        <p className="text-xs text-muted-foreground font-medium">Your access credentials have been synchronized. You can now initialize a new session.</p>
                                                        <Button className="w-full h-12 font-black uppercase tracking-widest text-xs" variant="outline" onClick={() => resetForgotState()}>
                                                            Return to Terminal
                                                        </Button>
                                                    </div>
                                                )}
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                    <FormControl><Input type="password" placeholder="••••••••" {...field} disabled={isServicesUnavailable} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="captcha" render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border-2 rounded-xl bg-muted/30">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isServicesUnavailable} /></FormControl>
                                    <div className="space-y-1 leading-none"><FormLabel className="cursor-pointer text-[10px] font-black uppercase">Protocol Integrity Verification</FormLabel></div>
                                </FormItem>
                            )}/>
                            <Button type="submit" className="w-full h-14 font-black uppercase tracking-widest text-lg shadow-xl shadow-primary/20" disabled={isLoading || isServicesUnavailable}>
                                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />} 
                                Sign In Terminal
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 text-center border-t pt-6">
                    <div className="bg-muted/50 p-4 rounded-xl space-y-2 border border-dashed border-primary/20">
                        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">New to TetherSwap Hub?</p>
                        <Button variant="outline" className="w-full h-10 text-[10px] font-black uppercase tracking-widest gap-2" onClick={() => router.push('/contact')}>
                            <Headphones className="h-3 w-3" /> Contact Settlement Desk
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
