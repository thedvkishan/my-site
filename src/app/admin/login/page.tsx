'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { adminLoginFormSchema, AdminLoginFormValues } from '@/lib/schemas';
import { ADMIN_CREDENTIALS } from '@/lib/constants';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Prefetch the dashboard page
        router.prefetch('/admin/dashboard');
    }, [router]);

    const form = useForm<AdminLoginFormValues>({
        resolver: zodResolver(adminLoginFormSchema),
        defaultValues: {
            userId: '',
            password: '',
        },
    });

    function onSubmit(values: AdminLoginFormValues) {
        setIsLoading(true);
        
        setTimeout(() => {
            if (values.userId === ADMIN_CREDENTIALS.userId && values.password === ADMIN_CREDENTIALS.password) {
                try {
                    localStorage.setItem('isAdminAuthenticated', 'true');
                    toast({
                        title: 'Login Successful',
                        description: 'Redirecting to dashboard...',
                    });
                    router.push('/admin/dashboard');
                } catch (error) {
                    toast({
                        variant: 'destructive',
                        title: 'Login Failed',
                        description: 'Could not access storage. Please enable cookies/storage and try again.',
                    });
                }
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Login Failed',
                    description: 'Invalid user ID or password.',
                });
                setIsLoading(false);
            }
        }, 1000);
    }

    return (
        <div className="container mx-auto max-w-md py-12">
            <Card>
                <CardHeader className="text-center">
                    <div className='flex justify-center mb-4'>
                        <div className='p-3 bg-primary/10 rounded-full border-4 border-primary/20'>
                            <ShieldCheck className='h-8 w-8 text-primary' />
                        </div>
                    </div>
                    <CardTitle>Admin Access</CardTitle>
                    <CardDescription>Please enter your credentials to continue.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="userId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>User ID</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your user ID" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Login
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
