
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { signupSchema, type SignupFormValues, SECURITY_QUESTIONS } from '@/lib/schemas';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2, UserPlus, ShieldQuestion } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const auth = useAuth();
    const firestore = useFirestore();
    const redirectTo = searchParams.get('redirect') || '/';

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

    async function onSubmit(values: SignupFormValues) {
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const user = userCredential.user;

            await setDoc(doc(firestore, 'users', user.uid), {
                userId: user.uid,
                name: values.name,
                email: values.email,
                phone: values.phone,
                balance: 0,
                securityQuestion: values.securityQuestion,
                securityAnswer: values.securityAnswer.toLowerCase().trim(),
                createdAt: new Date().toISOString(),
            });

            toast({ title: 'Account Created!', description: 'Your account has been successfully registered.' });
            router.push(redirectTo);
        } catch (error: any) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Sign Up Failed',
                description: error.message || 'Something went wrong. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="container mx-auto max-w-xl py-12 px-4">
            <Card className="shadow-xl">
                <CardHeader className="text-center">
                    <div className='flex justify-center mb-4'>
                        <div className='p-3 bg-primary/10 rounded-full border-4 border-primary/20'>
                            <UserPlus className='h-8 w-8 text-primary' />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
                    <CardDescription>Join TetherSwap Zone to start trading.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="email" render={({ field }) => (
                                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </div>
                            
                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem><FormLabel>Phone Number (Optional)</FormLabel><FormControl><Input placeholder="+91 12345 67890" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="password" render={({ field }) => (
                                    <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                                    <FormItem><FormLabel>Confirm</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </div>

                            <div className="p-4 bg-muted/50 rounded-lg border border-dashed border-primary/30 space-y-4">
                                <div className="flex items-center gap-2 text-sm font-bold text-primary mb-2">
                                    <ShieldQuestion className="h-4 w-4" /> Security Question (For Password Recovery)
                                </div>
                                <FormField control={form.control} name="securityQuestion" render={({ field }) => (
                                    <FormItem>
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
                                    <FormItem><FormControl><Input placeholder="Your secret answer" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </div>
                            
                            <FormField control={form.control} name="captcha" render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border rounded-md bg-muted/50 mt-4">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    <div className="space-y-1 leading-none"><FormLabel className="cursor-pointer">I am not a robot</FormLabel></div>
                                </FormItem>
                            )}/>

                            <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sign Up
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 text-center text-sm">
                    <p className="text-muted-foreground">
                        Already have an account?{' '}
                        <Link href={`/login?redirect=${redirectTo}`} className="text-primary font-semibold hover:underline">Login</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
