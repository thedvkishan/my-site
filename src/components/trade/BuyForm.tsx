'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useMemo } from 'react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { COUNTRIES, NETWORKS, PAYMENT_METHODS_BUY } from '@/lib/constants';
import { Loader2 } from 'lucide-react';
import { useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc } from 'firebase/firestore';

type Settings = {
  buyRate?: number;
  sellRate?: number;
  minBuyAmount?: number;
  minSellAmount?: number;
}

export function BuyForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const conversionInputSource = useRef<'usdt' | 'inr' | null>(null);

  const auth = useAuth();
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'appSettings');
  }, [firestore]);

  const { data: settings, isLoading: settingsLoading } = useDoc<Settings>(settingsRef);

  const buyFormSchema = useMemo(() => z.object({
    network: z.enum(NETWORKS as [string, ...string[]], { required_error: 'Please select a network.' }),
    usdtAmount: z.coerce.number().min(settings?.minBuyAmount ?? 1, `Minimum buy amount is ${settings?.minBuyAmount ?? 1} USDT.`),
    inrAmount: z.coerce.number().min(1, 'Amount must be at least 1.'),
    usdtAddress: z.string().min(10, 'Please enter a valid USDT address.'),
    paymentMode: z.enum(PAYMENT_METHODS_BUY as [string, ...string[]], { required_error: 'Please select a payment mode.' }),
    email: z.string().email('Please enter a valid email address.'),
    phone: z.string().optional(),
    country: z.enum(COUNTRIES as [string, ...string[]], { required_error: 'Please select your country.' }),
  }), [settings]);

  type BuyFormValues = z.infer<typeof buyFormSchema>;

  const form = useForm<BuyFormValues>({
    resolver: zodResolver(buyFormSchema),
    defaultValues: {
      network: 'BEP20',
      usdtAmount: 0,
      inrAmount: 0,
      usdtAddress: '',
      paymentMode: 'UPI',
      email: '',
      phone: '',
      country: 'India',
    },
  });

  const { setValue, watch } = form;
  const usdtAmount = watch('usdtAmount');
  const inrAmount = watch('inrAmount');

  useEffect(() => {
    if (settings?.buyRate && settings?.minBuyAmount && form.getValues('usdtAmount') === 0) {
        setValue('usdtAmount', settings.minBuyAmount);
        setValue('inrAmount', parseFloat((settings.minBuyAmount * settings.buyRate).toFixed(2)));
    }
  }, [settings, setValue, form]);

  useEffect(() => {
    if (conversionInputSource.current === 'usdt' && settings?.buyRate) {
      const newInrAmount = usdtAmount * settings.buyRate;
      if (inrAmount !== newInrAmount) {
        setValue('inrAmount', parseFloat(newInrAmount.toFixed(2)));
      }
    }
  }, [usdtAmount, settings, setValue, inrAmount]);

  useEffect(() => {
    if (conversionInputSource.current === 'inr' && settings?.buyRate) {
      const newUsdtAmount = inrAmount / settings.buyRate;
       if (usdtAmount !== newUsdtAmount) {
        setValue('usdtAmount', parseFloat(newUsdtAmount.toFixed(4)));
      }
    }
  }, [inrAmount, settings, setValue, usdtAmount]);

  async function onSubmit(values: BuyFormValues) {
    setIsLoading(true);

    if (!auth.currentUser || !firestore) {
        toast({ title: 'Error', description: 'User not authenticated or database not available.', variant: 'destructive'});
        setIsLoading(false);
        return;
    }

    try {
        const orderData = {
            ...values,
            userId: auth.currentUser.uid,
            type: 'buy',
            status: 'pending_payment',
            createdAt: new Date().toISOString(),
            expiresAt: Date.now() + 3 * 60 * 60 * 1000,
        };
        
        const docRef = await addDoc(collection(firestore, 'buyOrders'), orderData);
        
        toast({
            title: 'Order Created',
            description: 'Redirecting to payment page...',
        });

        router.push(`/buy/payment/${docRef.id}`);

    } catch (error) {
        console.error("Error creating buy order: ", error);
        toast({ title: 'Order Creation Failed', description: 'Could not save your order. Please try again.', variant: 'destructive' });
        setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="network"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Network</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select a network" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {NETWORKS.map(network => (
                    <SelectItem key={network} value={network}>{network}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <FormField
            control={form.control}
            name="usdtAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>USDT Amount</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter USDT amount" 
                    {...field} 
                    onChange={(e) => {
                      conversionInputSource.current = 'usdt';
                      field.onChange(e);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="inrAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>INR Amount</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter INR amount" 
                    {...field} 
                    onChange={(e) => {
                      conversionInputSource.current = 'inr';
                      field.onChange(e);
                    }}
                  />
                </FormControl>
                 <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {settingsLoading && 'Fetching rates...'}
          {settings?.buyRate && `Current Buy Rate: 1 USDT ≈ ${Number(settings.buyRate).toFixed(2)} INR`}
        </div>

        <FormField
          control={form.control}
          name="usdtAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your USDT Address</FormLabel>
              <FormControl><Input placeholder="Enter your receiving USDT address" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentMode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Mode</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select a payment mode" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PAYMENT_METHODS_BUY.map(method => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Contact Email</FormLabel>
              <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Contact Number (Optional)</FormLabel>
              <FormControl><Input type="tel" placeholder="+91 12345 67890" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select your country" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {COUNTRIES.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="text-sm text-center text-muted-foreground p-4 bg-secondary rounded-md">
            USDT will be deposited to your address within 15 minutes to 3 hours after payment confirmation.
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || settingsLoading || !settings || !auth.currentUser}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Pay Now
        </Button>
      </form>
    </Form>
  );
}
