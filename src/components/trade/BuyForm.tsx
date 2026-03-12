
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
import { NETWORKS, PAYMENT_METHODS_BUY } from '@/lib/constants';
import { Loader2 } from 'lucide-react';
import { useAuth, useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, doc } from 'firebase/firestore';

type Settings = {
  buyRates?: Record<string, number>;
  minBuyAmount?: number;
}

export function BuyForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const conversionInputSource = useRef<'usdt' | 'inr' | null>(null);

  const auth = useAuth();
  const firestore = useFirestore();
  const { user } = useUser();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'appSettings');
  }, [firestore]);

  const { data: settings, isLoading: settingsLoading } = useDoc<Settings>(settingsRef);

  const buyFormSchema = useMemo(() => z.object({
    network: z.enum(NETWORKS as [string, ...string[]], { required_error: 'Please select a network.' }),
    usdtAmount: z.coerce.number().min(settings?.minBuyAmount ?? 100, `Minimum buy amount is ${settings?.minBuyAmount ?? 100} USDT.`),
    inrAmount: z.coerce.number().min(1, 'Amount must be at least 1.'),
    paymentMode: z.enum(PAYMENT_METHODS_BUY as [string, ...string[]], { required_error: 'Please select a payment mode.' }),
  }), [settings]);

  type BuyFormValues = z.infer<typeof buyFormSchema>;

  const form = useForm<BuyFormValues>({
    resolver: zodResolver(buyFormSchema),
    defaultValues: {
      network: 'BEP20',
      usdtAmount: 0,
      inrAmount: 0,
      paymentMode: 'UPI',
    },
  });

  const { setValue, watch } = form;
  const usdtAmount = watch('usdtAmount');
  const inrAmount = watch('inrAmount');
  const paymentMode = watch('paymentMode');

  const currentRate = useMemo(() => {
    if (!settings || !settings.buyRates) return null;
    return settings.buyRates[paymentMode] || 0;
  }, [settings, paymentMode]);

  useEffect(() => {
    if (currentRate && settings?.minBuyAmount && form.getValues('usdtAmount') === 0) {
        setValue('usdtAmount', settings.minBuyAmount);
        setValue('inrAmount', parseFloat((settings.minBuyAmount * currentRate).toFixed(2)));
    }
  }, [settings, currentRate, setValue, form]);

  useEffect(() => {
    if (conversionInputSource.current === 'usdt' && currentRate) {
      const newInrAmount = usdtAmount * currentRate;
      if (inrAmount !== newInrAmount) {
        setValue('inrAmount', parseFloat(newInrAmount.toFixed(2)));
      }
    }
  }, [usdtAmount, currentRate, setValue, inrAmount]);

  useEffect(() => {
    if (conversionInputSource.current === 'inr' && currentRate) {
      const newUsdtAmount = inrAmount / currentRate;
       if (usdtAmount !== newUsdtAmount) {
        setValue('usdtAmount', parseFloat(newUsdtAmount.toFixed(4)));
      }
    }
  }, [inrAmount, currentRate, setValue, usdtAmount]);

  useEffect(() => {
    if (currentRate && conversionInputSource.current === 'usdt') {
        setValue('inrAmount', parseFloat((usdtAmount * currentRate).toFixed(2)));
    } else if (currentRate && conversionInputSource.current === 'inr') {
        setValue('usdtAmount', parseFloat((inrAmount / currentRate).toFixed(4)));
    }
  }, [currentRate, setValue]);

  async function onSubmit(values: BuyFormValues) {
    setIsLoading(true);

    if (!user || !firestore) {
        toast({ title: 'Error', description: 'User not authenticated or database not available.', variant: 'destructive'});
        setIsLoading(false);
        return;
    }

    try {
        const orderData = {
            ...values,
            userId: user.uid,
            email: user.email || '',
            usdtAddress: 'Internal Wallet', 
            country: 'India',
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
        <div className="text-sm font-medium text-primary bg-primary/5 p-3 rounded-md border border-primary/20">
          {settingsLoading && 'Fetching rates...'}
          {currentRate && (
            <div className="flex justify-between items-center">
                <span>Selected Rate ({paymentMode}):</span>
                <span className="font-bold">1 USDT ≈ ₹{currentRate.toFixed(2)}</span>
            </div>
          )}
        </div>

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
        
        <div className="text-sm text-center text-muted-foreground p-4 bg-secondary rounded-md">
            USDT will be added to your internal balance within 30 minutes to 3 hours after payment confirmation.
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || settingsLoading || !settings || !user}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Pay Now
        </Button>
      </form>
    </Form>
  );
}
