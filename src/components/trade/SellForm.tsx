
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
import { NETWORKS, PAYMENT_METHODS_SELL, CASH_DEPOSIT_BANKS } from '@/lib/constants';
import { Loader2 } from 'lucide-react';
import { useAuth, useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, doc } from 'firebase/firestore';

type Settings = {
  buyRate?: number;
  sellRate?: number;
  minBuyAmount?: number;
  minSellAmount?: number;
}

export function SellForm() {
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
  
  const sellFormSchema = useMemo(() => z.object({
    network: z.enum(NETWORKS as [string, ...string[]], { required_error: 'Please select a network.' }),
    usdtAmount: z.coerce.number().min(settings?.minSellAmount ?? 100, `Minimum sell amount is ${settings?.minSellAmount ?? 100} USDT.`),
    inrAmount: z.coerce.number().min(1, 'Amount must be at least 1.'),
    paymentMode: z.enum(PAYMENT_METHODS_SELL as [string, ...string[]], { required_error: 'Please select a payment mode.' }),
  }).and(z.discriminatedUnion('paymentMode', [
    z.object({
        paymentMode: z.literal('UPI'),
        upiHolderName: z.string().min(2, 'Please enter holder name.'),
        upiId: z.string().min(3, 'Please enter a valid UPI ID.'),
    }),
    z.object({
        paymentMode: z.literal('IMPS'),
        bankHolderName: z.string().min(2, 'Please enter account holder name.'),
        bankName: z.string().min(2, 'Please enter bank name.'),
        accountNumber: z.string().min(8, 'Please enter a valid account number.'),
        ifsc: z.string().min(8, 'Please enter a valid IFSC code.'),
    }),
    z.object({
        paymentMode: z.literal('RTGS'),
        bankHolderName: z.string().min(2, 'Please enter account holder name.'),
        bankName: z.string().min(2, 'Please enter bank name.'),
        accountNumber: z.string().min(8, 'Please enter a valid account number.'),
        ifsc: z.string().min(8, 'Please enter a valid IFSC code.'),
    }),
    z.object({
        paymentMode: z.literal('NEFT'),
        bankHolderName: z.string().min(2, 'Please enter account holder name.'),
        bankName: z.string().min(2, 'Please enter bank name.'),
        accountNumber: z.string().min(8, 'Please enter a valid account number.'),
        ifsc: z.string().min(8, 'Please enter a valid IFSC code.'),
    }),
    z.object({
        paymentMode: z.literal('Cash Deposit'),
        bankHolderName: z.string().min(2, 'Please enter account holder name.'),
        bankName: z.string().min(2, 'Please enter bank name.'),
        accountNumber: z.string().min(8, 'Please enter a valid account number.'),
        ifsc: z.string().min(8, 'Please enter a valid IFSC code.'),
    }),
  ])), [settings]);
  
  type SellFormValues = z.infer<typeof sellFormSchema>;

  const form = useForm<SellFormValues>({
    resolver: zodResolver(sellFormSchema),
    defaultValues: {
      network: 'BEP20',
      usdtAmount: 0,
      paymentMode: 'UPI',
      inrAmount: 0,
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
    if (settings?.sellRate && settings?.minSellAmount && form.getValues('usdtAmount') === 0) {
        setValue('usdtAmount', settings.minSellAmount);
        setValue('inrAmount', parseFloat((settings.minSellAmount * Number(settings.sellRate)).toFixed(2)));
    }
  }, [settings, setValue, form]);

  useEffect(() => {
    if (conversionInputSource.current === 'usdt' && settings?.sellRate) {
      const newInrAmount = usdtAmount * Number(settings.sellRate);
      if (inrAmount !== newInrAmount) {
        setValue('inrAmount', parseFloat(newInrAmount.toFixed(2)));
      }
    }
  }, [usdtAmount, settings, setValue, inrAmount]);

  useEffect(() => {
    if (conversionInputSource.current === 'inr' && settings?.sellRate) {
      const newUsdtAmount = inrAmount / Number(settings.sellRate);
      if (usdtAmount !== newUsdtAmount) {
        setValue('usdtAmount', parseFloat(newUsdtAmount.toFixed(4)));
      }
    }
  }, [inrAmount, settings, setValue, usdtAmount]);
  
  async function onSubmit(values: SellFormValues) {
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
          contactNumber: '', // Redundant if they already have one in profile
          country: 'India',
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
          {settingsLoading && 'Fetching rates...'}
          {settings?.sellRate && `Current Sell Rate: 1 USDT ≈ ${Number(settings.sellRate).toFixed(2)} INR`}
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

        {(paymentMode === 'IMPS' || paymentMode === 'RTGS' || paymentMode === 'NEFT' || paymentMode === 'Cash Deposit') && (
          <div className="space-y-4 p-4 border rounded-md bg-secondary">
            <FormField control={control} name="bankHolderName" render={({ field }) => (
              <FormItem><FormLabel>Account Holder Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            
            {paymentMode === 'Cash Deposit' ? (
                <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a bank" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {CASH_DEPOSIT_BANKS.map((bank) => (
                            <SelectItem key={bank} value={bank}>
                                {bank}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            ) : (
                <FormField control={control} name="bankName" render={({ field }) => (
                    <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="Your Bank" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            )}

            <FormField control={control} name="accountNumber" render={({ field }) => (
              <FormItem><FormLabel>Account Number</TableLabel><FormControl><Input placeholder="1234567890" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={control} name="ifsc" render={({ field }) => (
              <FormItem><FormLabel>IFSC Code</FormLabel><FormControl><Input placeholder="BANK0001234" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
          </div>
        )}

        <div className="text-sm text-center text-muted-foreground p-4 bg-secondary rounded-md">
            Please deposit your USDT within 3 hours after creating this order.
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || settingsLoading || !settings || !user}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Deposit and Receive
        </Button>
      </form>
    </Form>
  );
}
