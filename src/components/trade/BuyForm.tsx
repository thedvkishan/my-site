'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getConversionRates } from '@/lib/actions';
import { buyFormSchema, type BuyFormValues } from '@/lib/schemas';
import { COUNTRIES, NETWORKS, PAYMENT_METHODS_BUY } from '@/lib/constants';
import { Loader2 } from 'lucide-react';
import { useTransactionStore } from '@/hooks/use-transaction-store';

export function BuyForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { setTransaction } = useTransactionStore();
  const [rates, setRates] = useState<{ buyRate: number; sellRate: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const conversionInputSource = useRef<'usdt' | 'inr' | null>(null);

  const form = useForm<BuyFormValues>({
    resolver: zodResolver(buyFormSchema),
    defaultValues: {
      network: 'BEP20',
      usdtAmount: 100,
      inrAmount: undefined,
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
    async function fetchRates() {
      const result = await getConversionRates();
      if (result.success && result.data) {
        setRates(result.data);
        setValue('inrAmount', parseFloat((100 * result.data.buyRate).toFixed(2)));
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      }
    }
    fetchRates();
  }, [setValue, toast]);

  useEffect(() => {
    if (conversionInputSource.current === 'usdt' && rates) {
      const newInrAmount = usdtAmount * rates.buyRate;
      if (inrAmount !== newInrAmount) {
        setValue('inrAmount', parseFloat(newInrAmount.toFixed(2)));
      }
    }
  }, [usdtAmount, rates, setValue, inrAmount]);

  useEffect(() => {
    if (conversionInputSource.current === 'inr' && rates) {
      const newUsdtAmount = inrAmount / rates.buyRate;
       if (usdtAmount !== newUsdtAmount) {
        setValue('usdtAmount', parseFloat(newUsdtAmount.toFixed(4)));
      }
    }
  }, [inrAmount, rates, setValue, usdtAmount]);

  async function onSubmit(values: BuyFormValues) {
    setIsLoading(true);
    const transactionId = `BUY-${Date.now()}`;
    const transactionData = {
      ...values,
      id: transactionId,
      type: 'buy',
      status: 'pending_payment',
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + 3 * 60 * 60 * 1000,
    };
    
    setTransaction(transactionId, transactionData);

    toast({
      title: 'Order Created',
      description: 'Redirecting to payment page...',
    });

    router.push(`/buy/payment/${transactionId}`);
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
          {rates ? `Current Buy Rate: 1 USDT ≈ ${rates.buyRate.toFixed(2)} INR` : 'Fetching rates...'}
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

        <Button type="submit" className="w-full" disabled={isLoading || !rates}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Pay Now
        </Button>
      </form>
    </Form>
  );
}
