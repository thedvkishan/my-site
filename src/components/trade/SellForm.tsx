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
import { sellFormSchema, type SellFormValues } from '@/lib/schemas';
import { COUNTRIES, NETWORKS, PAYMENT_METHODS_SELL } from '@/lib/constants';
import { Loader2 } from 'lucide-react';
import { useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc } from 'firebase/firestore';

type Settings = {
  buyRate?: number;
  sellRate?: number;
}

export function SellForm() {
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

  const { data: rates, isLoading: ratesLoading } = useDoc<Settings>(settingsRef);

  const form = useForm<SellFormValues>({
    resolver: zodResolver(sellFormSchema),
    defaultValues: {
      network: 'BEP20',
      usdtAmount: 100,
      paymentMode: 'UPI',
      country: 'India',
      inrAmount: 0,
      email: '',
      phone: '',
      upiHolderName: '',
      upiId: '',
      bankHolderName: '',
      bankName: '',
      accountNumber: '',
      ifsc: '',
    },
  });

  const { setValue, watch, control } = form;
  const usdtAmount = watch('usdtAmount');
  const inrAmount = watch('inrAmount');
  const paymentMode = watch('paymentMode');

  useEffect(() => {
    if (rates?.sellRate) {
        setValue('inrAmount', parseFloat((100 * rates.sellRate).toFixed(2)));
    }
  }, [rates, setValue]);

  useEffect(() => {
    if (conversionInputSource.current === 'usdt' && rates?.sellRate) {
      const newInrAmount = usdtAmount * rates.sellRate;
      if (inrAmount !== newInrAmount) {
        setValue('inrAmount', parseFloat(newInrAmount.toFixed(2)));
      }
    }
  }, [usdtAmount, rates, setValue, inrAmount]);

  useEffect(() => {
    if (conversionInputSource.current === 'inr' && rates?.sellRate) {
      const newUsdtAmount = inrAmount / rates.sellRate;
      if (usdtAmount !== newUsdtAmount) {
        setValue('usdtAmount', parseFloat(newUsdtAmount.toFixed(4)));
      }
    }
  }, [inrAmount, rates, setValue, usdtAmount]);
  
  async function onSubmit(values: SellFormValues) {
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
          type: 'sell',
          status: 'pending_deposit',
          createdAt: new Date().toISOString(),
          expiresAt: Date.now() + 3 * 60 * 60 * 1000,
        };
        
        const docRef = await addDoc(collection(firestore, 'sellOrders'), orderData);
        
        toast({
            title: 'Order Created',
            description: 'Redirecting to deposit page...',
        });
    
        router.push(`/sell/deposit/${docRef.id}`);

    } catch (error) {
        console.error("Error creating sell order: ", error);
        toast({ title: 'Order Creation Failed', description: 'Could not save your order. Please try again.', variant: 'destructive' });
        setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={control}
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
            control={control}
            name="usdtAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>USDT Amount</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter USDT amount" {...field} 
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
            control={control}
            name="inrAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>INR Amount You Receive</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter INR amount" {...field} 
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
          {ratesLoading && 'Fetching rates...'}
          {rates?.sellRate && `Current Sell Rate: 1 USDT ≈ ${Number(rates.sellRate).toFixed(2)} INR`}
        </div>
        
        <FormField
          control={control}
          name="paymentMode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Receiving Mode</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select a payment mode" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PAYMENT_METHODS_SELL.map(method => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {paymentMode === 'UPI' && (
          <div className="space-y-4 p-4 border rounded-md bg-secondary">
            <FormField control={control} name="upiHolderName" render={({ field }) => (
              <FormItem><FormLabel>UPI Holder Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={control} name="upiId" render={({ field }) => (
              <FormItem><FormLabel>UPI ID</FormLabel><FormControl><Input placeholder="yourname@upi" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
          </div>
        )}

        {(paymentMode === 'IMPS' || paymentMode === 'RTGS' || paymentMode === 'NEFT') && (
          <div className="space-y-4 p-4 border rounded-md bg-secondary">
            <FormField control={control} name="bankHolderName" render={({ field }) => (
              <FormItem><FormLabel>Account Holder Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={control} name="bankName" render={({ field }) => (
              <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="Your Bank" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={control} name="accountNumber" render={({ field }) => (
              <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input placeholder="1234567890" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={control} name="ifsc" render={({ field }) => (
              <FormItem><FormLabel>IFSC Code</FormLabel><FormControl><Input placeholder="BANK0001234" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
          </div>
        )}

        <FormField
          control={control}
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
          control={control}
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
          control={control}
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

        <Button type="submit" className="w-full" disabled={isLoading || ratesLoading || !rates || !auth.currentUser}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Deposit and Receive
        </Button>
      </form>
    </Form>
  );
}
