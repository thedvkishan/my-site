'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { contactFormSchema, ContactFormValues } from '@/lib/schemas';
import { submitContactForm } from '@/lib/actions';
import { Loader2, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';


export default function ContactPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactFormSchema),
        defaultValues: {
            name: '',
            email: '',
            description: '',
        },
    });

    async function onSubmit(values: ContactFormValues) {
        setIsLoading(true);
        const result = await submitContactForm(values);
        setIsLoading(false);

        if (result.success) {
            toast({
                title: 'Message Sent!',
                description: result.message,
            });
            form.reset();
            router.push('/');
        } else {
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: 'Something went wrong. Please try again.',
            });
        }
    }


    return (
        <div className="container mx-auto max-w-2xl py-12">
            <Card>
                <CardHeader className='text-center'>
                    <div className='flex justify-center mb-4'>
                        <div className='p-3 bg-accent/10 rounded-full border-4 border-accent/20'>
                            <Mail className='h-8 w-8 text-accent' />
                        </div>
                    </div>
                    <CardTitle>Contact Us</CardTitle>
                    <CardDescription>Have a question or a problem? Let us know.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Your Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Your Email</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="you@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Problem Description</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Please describe your issue in detail..." {...field} rows={6} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Message
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
