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
import { Loader2, Wallet } from 'lucide-react';
import { useAuth, useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type Settings = {
  sellRates?: Record<string, number>;
  minSellAmount?: number;
}

type UserProfile = {
  balance?: number;
  status?: string;
}

export function SellForm({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const conversionInputSource = useRef<'usdt' | 'inr' | null>(null);

  const firestore = useFirestore();
  const { user } = useUser();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'appSettings');
  }, [firestore]);

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: settings, isLoading: settingsLoading } = useDoc<Settings>(settingsRef);
  const { data: profile } = useDoc<UserProfile>(profileRef);
  
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
        paymentMode: z.literal('Bank Transfer'),
        bankHolderName: z.string().min(2, 'Please enter account holder name.'),
        bankName: z.string().min(2, 'Please enter bank name.'),
        accountNumber: z.string().min(8, 'Please enter a valid account number.'),
        ifsc: z.string().min(8, 'Please enter a valid IFSC code.'),
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
      paymentMode: 'Bank Transfer',
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

  const currentRate = useMemo(() => {
    if (!settings || !settings.sellRates) return 0;
    const rawRate = settings.sellRates[paymentMode];
    return Number(rawRate) || 0;
  }, [settings, paymentMode]);

  useEffect(() => {
    if (currentRate && settings?.minSellAmount && form.getValues('usdtAmount') === 0) {
        setValue('usdtAmount', settings.minSellAmount);
        setValue('inrAmount', parseFloat((settings.minSellAmount * currentRate).toFixed(2)));
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

  async function onSubmit(values: SellFormValues) {
    if (!user || !firestore) return;
    setIsLoading(true);

    const currentBalance = profile?.balance || 0;
    if (values.usdtAmount > currentBalance) {
        toast({ title: 'Insufficient Balance', description: `You only have ${currentBalance} USDT available.`, variant: 'destructive' });
        setIsLoading(false);
        return;
    }
    
    const orderRef = doc(collection(firestore, 'sellOrders'));
    const orderData = {
      ...values,
      userId: user.uid,
      email: user.email || '',
      status: 'payment_processing',
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + 3 * 60 * 60 * 1000,
    };
    
    setDoc(orderRef, orderData).catch(async (err) => {
        const permissionError = new FirestorePermissionError({
            path: 'sellOrders',
            operation: 'create',
            requestResourceData: orderData
        });
        errorEmitter.emit('permission-error', permissionError);
    });

    if (profileRef) {
        updateDoc(profileRef, { balance: increment(-values.usdtAmount) });
    }

    router.push(`/sell/confirmation/${orderRef.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                  <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Internal Balance</p>
                  <p className="text-xl font-black text-primary">{(profile?.balance || 0).toLocaleString()} <span className="text-xs font-bold opacity-60">USDT</span></p>
              </div>
          </div>
          <Button variant="ghost" size="sm" className="text-[10px] font-bold h-8" onClick={() => setValue('usdtAmount', profile?.balance || 0)}>USE MAX</Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={control}
            name="network"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Network</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={disabled}>
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
                    <Input 
                      type="number" 
                      placeholder="Enter USDT amount" 
                      {...field} 
                      disabled={disabled}
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
                    <Input 
                      type="number" 
                      placeholder="Enter INR amount" 
                      {...field} 
                      disabled={disabled}
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
          <div className="text-sm font-medium text-destructive bg-destructive/5 p-3 rounded-md border border-destructive/20">
            {settingsLoading && 'Fetching rates...'}
            {!settingsLoading && (
              <div className="flex justify-between items-center">
                  <span>Selected Rate ({paymentMode}):</span>
                  <span className="font-bold">1 USDT ≈ ₹{Number(currentRate || 0).toFixed(2)}</span>
              </div>
            )}
          </div>
          
          <FormField
            control={control}
            name="paymentMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Receiving Mode</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={disabled}>
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
                <FormItem><FormLabel>UPI Holder Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} disabled={disabled} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={control} name="upiId" render={({ field }) => (
                <FormItem><FormLabel>UPI ID</FormLabel><FormControl><Input placeholder="yourname@upi" {...field} disabled={disabled} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>
          )}

          {(paymentMode === 'IMPS' || paymentMode === 'RTGS' || paymentMode === 'NEFT' || paymentMode === 'Cash Deposit' || paymentMode === 'Bank Transfer') && (
            <div className="space-y-4 p-4 border rounded-md bg-secondary">
              <FormField control={control} name="bankHolderName" render={({ field }) => (
                <FormItem><FormLabel>Account Holder Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} disabled={disabled} /></FormControl><FormMessage /></FormItem>
              )}/>
              
              {paymentMode === 'Cash Deposit' ? (
                  <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={disabled}>
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
                      <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="Your Bank" {...field} disabled={disabled} /></FormControl><FormMessage /></FormItem>
                  )}/>
              )}

              <FormField control={control} name="accountNumber" render={({ field }) => (
                <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input placeholder="1234567890" {...field} disabled={disabled} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={control} name="ifsc" render={({ field }) => (
                <FormItem><FormLabel>IFSC Code</FormLabel><FormControl><Input placeholder="BANK0001234" {...field} disabled={disabled} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>
          )}

          <Button type="submit" className="w-full h-12 font-black uppercase tracking-widest shadow-xl shadow-destructive/20" variant="destructive" disabled={isLoading || settingsLoading || !settings || !user || disabled}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sell Now
          </Button>
        </form>
      </Form>
    </div>
  );
}
