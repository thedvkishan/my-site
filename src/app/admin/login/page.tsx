
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
        router.prefetch('/admin/dashboard');
    }, [router]);

    const form = useForm<AdminLoginFormValues>({
        resolver: zodResolver(adminLoginFormSchema),
        defaultValues: { userId: '', password: '' },
    });

    function onSubmit(values: AdminLoginFormValues) {
        setIsLoading(true);
        setTimeout(() => {
            if (values.userId === ADMIN_CREDENTIALS.userId && values.password === ADMIN_CREDENTIALS.password) {
                try {
                    localStorage.setItem('isAdminAuthenticated', 'true');
                    toast({ title: 'Access Granted', description: 'Terminal session initialized.' });
                    router.push('/admin/dashboard');
                } catch (error) {
                    toast({ variant: 'destructive', title: 'Storage Error', description: 'Please enable persistence to access terminal.' });
                    setIsLoading(false);
                }
            } else {
                toast({ variant: 'destructive', title: 'Verification Failed', description: 'Invalid protocol credentials.' });
                setIsLoading(false);
            }
        }, 800);
    }

    return (
        <div className="container mx-auto max-w-md py-24 px-4">
            <Card className="border-2 shadow-2xl">
                <CardHeader className="text-center">
                    <div className='flex justify-center mb-4'>
                        <div className='p-4 bg-primary/10 rounded-full border-4 border-primary/20'>
                            <ShieldCheck className='h-10 w-10 text-primary' />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-black uppercase tracking-tight">Institutional Login</CardTitle>
                    <CardDescription>Enter administrative credentials to access oversight.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField control={form.control} name="userId" render={({ field }) => (
                                <FormItem><FormLabel>Protocol ID</FormLabel><FormControl><Input placeholder="Internal identifier" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="password" render={({ field }) => (
                                <FormItem><FormLabel>Security Key</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <Button type="submit" className="w-full h-12 font-black uppercase tracking-widest" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Initialize Terminal
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
