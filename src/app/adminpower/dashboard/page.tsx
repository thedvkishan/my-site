'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { FileUp, Loader2, Coins, TrendingUp, TrendingDown, Send, ArrowDownCircle, Network, Scale } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { settingsSchema, type SettingsFormValues } from '@/lib/schemas';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminDataView } from '@/components/admin/AdminDataView';
import { TetherIcon } from '@/components/icons/TetherIcon';
import { useFirestore, useDoc, useMemoFirebase, useUser, useAuth } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { MOCK_SETTINGS, PAYMENT_METHODS_BUY, PAYMENT_METHODS_SELL, NETWORKS } from '@/lib/constants';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { signInAnonymously } from 'firebase/auth';

export type Settings = SettingsFormValues;

export default function AdminDashboardPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    const firestore = useFirestore();
    const auth = useAuth();
    const { user, isUserLoading } = useUser();

    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'settings', 'appSettings');
    }, [firestore]);

    const { data: storedSettings, isLoading: settingsLoading } = useDoc<Settings>(settingsRef);

    const isInitialized = !settingsLoading && !isUserLoading;

    const saveSettings = useCallback((newSettings: Partial<Settings>) => {
        if (!settingsRef) return;
        
        setDoc(settingsRef, newSettings, { merge: true }).catch(async (serverError: any) => {
            const permissionError = new FirestorePermissionError({
                path: settingsRef.path,
                operation: 'update',
                requestResourceData: newSettings,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    }, [settingsRef]);

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: MOCK_SETTINGS,
    });

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const authStatus = localStorage.getItem('isAdminAuthenticated');
                if (authStatus !== 'true') {
                    router.replace('/adminpower/login');
                } else {
                    setIsAuthenticated(true);
                    
                    // Critical: Ensure Firebase Auth session is active for Firestore writes
                    // This handles session persistence after refresh
                    if (!isUserLoading && !user && auth) {
                        await signInAnonymously(auth);
                    }
                }
            } catch (error) {
                router.replace('/adminpower/login');
            }
        };
        checkAuth();
    }, [router, user, isUserLoading, auth]);
    
    useEffect(() => {
        if (isInitialized) {
            if (storedSettings) {
                form.reset(storedSettings);
            } else if (settingsRef && user) {
                // Initialize central database with mock defaults if empty
                setDoc(settingsRef, MOCK_SETTINGS, { merge: true });
            }
        }
    }, [isInitialized, storedSettings, form, settingsRef, user]);

    const handleLogout = () => {
        localStorage.removeItem('isAdminAuthenticated');
        toast({ title: 'Logged Out', description: 'Institutional session terminated.' });
        router.push('/adminpower/login');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: any) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const dataUrl = loadEvent.target?.result as string;
                form.setValue(fieldName, dataUrl, { shouldDirty: true });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = (type: 'bank' | 'upi' | 'banners' | 'deposit' | 'logo' | 'rates' | 'security') => {
        const values = form.getValues();
        let newSettings: Partial<Settings> = {};
        let description = '';

        switch(type) {
            case 'logo':
                newSettings = { appLogoUrl: values.appLogoUrl };
                description = 'App logo updated.';
                break;
            case 'rates':
                newSettings = { 
                    buyRates: values.buyRates, 
                    sellRates: values.sellRates,
                    minBuyAmount: Number(values.minBuyAmount), 
                    minSellAmount: Number(values.minSellAmount),
                    minDepositAmount: Number(values.minDepositAmount),
                    minWithdrawalAmount: Number(values.minWithdrawalAmount),
                    provisionFee: Number(values.provisionFee)
                };
                description = 'Exchange rates and fees updated.';
                break;
            case 'bank':
                newSettings = { bankDetails: values.bankDetails };
                description = 'Bank details updated.';
                break;
            case 'upi':
                newSettings = { upiId: values.upiId, qrCodeUrl: values.qrCodeUrl };
                description = 'UPI and QR code updated.';
                break;
            case 'banners':
                newSettings = { buyBannerUrl: values.buyBannerUrl, sellBannerUrl: values.sellBannerUrl };
                description = 'Banners updated.';
                break;
            case 'deposit':
                newSettings = { depositDetails: values.depositDetails };
                description = 'Deposit network details updated.';
                break;
            case 'security':
                newSettings = { allowPublicSignup: values.allowPublicSignup };
                description = `Public registration ${values.allowPublicSignup ? 'enabled' : 'disabled'}.`;
                break;
        }

        saveSettings(newSettings);
        toast({ title: 'Settings Saved', description: description });
    };

    const watchedValues = form.watch();

    if (!isAuthenticated || !isInitialized) {
        return (
            <div className="container mx-auto flex min-h-[50vh] items-center justify-center">
                 <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-7xl py-12 px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">Institutional Terminal</h1>
                    <p className="text-muted-foreground font-medium">Platform orchestration and clearance oversight.</p>
                </div>
                <Button variant="outline" className="font-bold h-12 px-8" onClick={handleLogout}>Terminate Session</Button>
            </div>
            
            <Tabs defaultValue="settings" className="space-y-8">
                <TabsList className='bg-muted/50 p-1 border rounded-xl h-auto'>
                    <TabsTrigger value="settings" className="font-black text-[10px] uppercase tracking-widest px-6 py-3">Site Configuration</TabsTrigger>
                    <TabsTrigger value="data" className="font-black text-[10px] uppercase tracking-widest px-6 py-3">Institutional Oversight</TabsTrigger>
                </TabsList>
                
                <TabsContent value="settings" className="animate-in fade-in slide-in-from-bottom-2">
                    <Form {...form}>
                        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
                            <div className="lg:col-span-2 space-y-8">
                                <Card className="border-2">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <TetherIcon className="h-5 w-5" /> Exchange Protocols
                                        </CardTitle>
                                        <CardDescription className="font-medium">Define clearing rates and institutional transaction fees.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Accordion type="single" collapsible defaultValue='rates'>
                                            <AccordionItem value="logo" className="border-b">
                                                <AccordionTrigger className="text-lg font-bold uppercase">Brand Identity</AccordionTrigger>
                                                <AccordionContent className="pt-4 space-y-6">
                                                    <div className="flex items-start gap-6">
                                                        <div className="relative h-24 w-24 rounded-2xl overflow-hidden border-2 bg-muted flex items-center justify-center">
                                                            {watchedValues.appLogoUrl ? (
                                                                <Image src={watchedValues.appLogoUrl} alt="App Logo" fill style={{objectFit: 'cover'}} />
                                                            ) : (
                                                                <TetherIcon className="h-12 w-12 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        <div className="space-y-4 flex-grow">
                                                            <Input id="logo-upload" type="file" className='hidden' accept="image/png, image/jpeg" onChange={(e) => handleFileChange(e, 'appLogoUrl')} />
                                                            <Label htmlFor='logo-upload'>
                                                                <Button asChild variant="outline" className="w-full h-12 cursor-pointer font-bold"><div><FileUp className='mr-2 h-4 w-4' /> Upload Brand Asset</div></Button>
                                                            </Label>
                                                            <Button className="w-full h-12 font-black uppercase tracking-widest" onClick={() => handleSave('logo')}>Save Assets</Button>
                                                        </div>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                            <AccordionItem value="rates">
                                                <AccordionTrigger className="text-lg font-bold uppercase">Clearing & Fees</AccordionTrigger>
                                                <AccordionContent className="pt-4 space-y-8">
                                                    <div className="p-6 border-2 border-dashed rounded-2xl bg-primary/5 space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-primary/10 rounded-lg"><Coins className="h-5 w-5 text-primary" /></div>
                                                            <h4 className="font-black text-xs uppercase tracking-wider">Internal Provisioning Fee</h4>
                                                        </div>
                                                        <FormField 
                                                            control={form.control} 
                                                            name="provisionFee" 
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl><Input type="number" step="1" className="font-black text-xl h-14" {...field} /></FormControl>
                                                                    <FormDescription className="text-[10px] font-bold uppercase">USDT Charged to institutional users for account creation.</FormDescription>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="p-6 border-2 border-dashed rounded-2xl bg-accent/5 space-y-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-accent/10 rounded-lg"><Scale className="h-5 w-5 text-accent" /></div>
                                                            <h4 className="font-black text-xs uppercase tracking-wider">Institutional Limits (USDT)</h4>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <FormField control={form.control} name="minBuyAmount" render={({ field }) => (
                                                                <FormItem><FormLabel className="text-[10px] font-bold uppercase">Min Buy</FormLabel><FormControl><Input type="number" className="font-bold" {...field} /></FormControl></FormItem>
                                                            )}/>
                                                            <FormField control={form.control} name="minSellAmount" render={({ field }) => (
                                                                <FormItem><FormLabel className="text-[10px] font-bold uppercase">Min Sell</FormLabel><FormControl><Input type="number" className="font-bold" {...field} /></FormControl></FormItem>
                                                            )}/>
                                                            <FormField control={form.control} name="minDepositAmount" render={({ field }) => (
                                                                <FormItem><FormLabel className="text-[10px] font-bold uppercase">Min Deposit</FormLabel><FormControl><Input type="number" className="font-bold" {...field} /></FormControl></FormItem>
                                                            )}/>
                                                            <FormField control={form.control} name="minWithdrawalAmount" render={({ field }) => (
                                                                <FormItem><FormLabel className="text-[10px] font-bold uppercase">Min Withdraw</FormLabel><FormControl><Input type="number" className="font-bold" {...field} /></FormControl></FormItem>
                                                            )}/>
                                                        </div>
                                                    </div>

                                                    <div className="grid md:grid-cols-2 gap-6">
                                                         <div className="space-y-4 border p-6 rounded-2xl bg-muted/20">
                                                            <h4 className="font-black text-[10px] uppercase tracking-widest text-primary mb-4 flex items-center gap-2"><TrendingUp className="h-3 w-3" /> Acquisition Rates</h4>
                                                            {PAYMENT_METHODS_BUY.map(method => (
                                                                <FormField key={`buy-${method}`} control={form.control} name={`buyRates.${method}`} render={({ field }) => (<FormItem><FormLabel className="text-[10px] font-bold uppercase text-muted-foreground">{method}</FormLabel><FormControl><Input type="number" step="0.01" className="font-bold" {...field} /></FormControl></FormItem>)}/>
                                                            ))}
                                                         </div>
                                                         <div className="space-y-4 border p-6 rounded-2xl bg-muted/20">
                                                            <h4 className="font-black text-[10px] uppercase tracking-widest text-destructive mb-4 flex items-center gap-2"><TrendingDown className="h-3 w-3" /> Liquidation Rates</h4>
                                                            {PAYMENT_METHODS_SELL.map(method => (
                                                                <FormField key={`sell-${method}`} control={form.control} name={`sellRates.${method}`} render={({ field }) => (<FormItem><FormLabel className="text-[10px] font-bold uppercase text-muted-foreground">{method}</FormLabel><FormControl><Input type="number" step="0.01" className="font-bold" {...field} /></FormControl></FormItem>)}/>
                                                            ))}
                                                         </div>
                                                    </div>
                                                    <Button className="w-full h-14 font-black uppercase tracking-widest text-lg shadow-xl shadow-primary/20" onClick={() => handleSave('rates')}>Deploy Protocols</Button>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    </CardContent>
                                </Card>

                                <Card className="border-2 border-primary/20 bg-muted/5">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 uppercase tracking-tight">Security Gateway</CardTitle>
                                        <CardDescription className="font-medium">Manage institutional accessibility protocols.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <FormField
                                            control={form.control}
                                            name="allowPublicSignup"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-2xl border-2 p-6 shadow-sm bg-background">
                                                    <div className="space-y-1">
                                                        <FormLabel className="text-lg font-black uppercase tracking-tight">Public Enrollment</FormLabel>
                                                        <p className="text-xs text-muted-foreground font-medium">Allow non-provisioned guests to register autonomously.</p>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={(checked) => {
                                                                field.onChange(checked);
                                                                handleSave('security');
                                                            }}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-8">
                                <Card className="border-2">
                                    <CardHeader><CardTitle className="text-xl font-black uppercase">Settlement Nodes</CardTitle></CardHeader>
                                    <CardContent>
                                        <Accordion type="multiple" className="w-full space-y-4">
                                            <AccordionItem value="bank" className="border-2 rounded-xl px-4 overflow-hidden bg-muted/5">
                                                <AccordionTrigger className="font-bold uppercase text-xs">Institutional Bank</AccordionTrigger>
                                                <AccordionContent className="space-y-4 pb-4">
                                                    <FormField control={form.control} name="bankDetails.holderName" render={({ field }) => (<FormItem><FormLabel className="text-[10px] font-bold">Account Holder</FormLabel><FormControl><Input className="h-10 text-xs" {...field} /></FormControl></FormItem>)}/>
                                                    <FormField control={form.control} name="bankDetails.bankName" render={({ field }) => (<FormItem><FormLabel className="text-[10px] font-bold">Bank Identity</FormLabel><FormControl><Input className="h-10 text-xs" {...field} /></FormControl></FormItem>)}/>
                                                    <FormField control={form.control} name="bankDetails.accountNumber" render={({ field }) => (<FormItem><FormLabel className="text-[10px] font-bold">Account Protocol</FormLabel><FormControl><Input className="h-10 text-xs" {...field} /></FormControl></FormItem>)}/>
                                                    <FormField control={form.control} name="bankDetails.ifsc" render={({ field }) => (<FormItem><FormLabel className="text-[10px] font-bold">IFSC Routing</FormLabel><FormControl><Input className="h-10 text-xs" {...field} /></FormControl></FormItem>)}/>
                                                    <Button className="w-full font-bold uppercase text-[10px] h-10" onClick={() => handleSave('bank')}>Update Node</Button>
                                                </AccordionContent>
                                            </AccordionItem>
                                            <AccordionItem value="upi" className="border-2 rounded-xl px-4 overflow-hidden bg-muted/5">
                                                <AccordionTrigger className="font-bold uppercase text-xs">UPI Clearing Hub</AccordionTrigger>
                                                <AccordionContent className="space-y-4 pb-4">
                                                    <FormField control={form.control} name="upiId" render={({ field }) => (<FormItem><FormLabel className="text-[10px] font-bold">Terminal VPA</FormLabel><FormControl><Input className="h-10 text-xs" {...field} /></FormControl></FormItem>)}/>
                                                    <div className="flex justify-center p-4 border-2 border-dashed rounded-xl bg-white">
                                                        {watchedValues.qrCodeUrl && <Image src={watchedValues.qrCodeUrl} alt="UPI QR" width={128} height={128} />}
                                                    </div>
                                                    <Input id="upi-qr-upload" type="file" className='hidden' accept="image/png, image/jpeg" onChange={(e) => handleFileChange(e, 'qrCodeUrl')} />
                                                    <Label htmlFor='upi-qr-upload'><Button asChild variant="outline" className="w-full h-10 cursor-pointer font-bold text-[10px]"><div>Update Terminal QR</div></Button></Label>
                                                    <Button className="w-full font-bold uppercase text-[10px] h-10" onClick={() => handleSave('upi')}>Update UPI</Button>
                                                </AccordionContent>
                                            </AccordionItem>
                                            <AccordionItem value="usdt" className="border-2 rounded-xl px-4 overflow-hidden bg-primary/5">
                                                <AccordionTrigger className="font-bold uppercase text-xs flex items-center gap-2">
                                                    <TetherIcon className="h-4 w-4" /> USDT Settlement Hub
                                                </AccordionTrigger>
                                                <AccordionContent className="space-y-8 pb-6">
                                                    {NETWORKS.map((net) => (
                                                        <div key={net} className="p-4 border rounded-xl bg-white space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <Badge className="font-black text-[10px] tracking-widest">{net} Protocol</Badge>
                                                                <Network className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <FormField 
                                                                control={form.control} 
                                                                name={`depositDetails.${net}.address` as any} 
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel className="text-[9px] font-bold uppercase text-muted-foreground">Settlement Address</FormLabel>
                                                                        <FormControl><Input className="font-mono text-[10px] h-10" {...field} /></FormControl>
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <div className="space-y-2">
                                                                <Label className="text-[9px] font-bold uppercase text-muted-foreground">Network QR Code</Label>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="relative h-20 w-20 border-2 border-dashed rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden">
                                                                        {(watchedValues.depositDetails as any)?.[net]?.qrCodeUrl ? (
                                                                            <Image src={(watchedValues.depositDetails as any)[net].qrCodeUrl} alt={`${net} QR`} fill style={{objectFit: 'contain'}} />
                                                                        ) : (
                                                                            <ArrowDownCircle className="h-6 w-6 text-muted-foreground opacity-20" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <Input id={`qr-${net}`} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, `depositDetails.${net}.qrCodeUrl` as any)} />
                                                                        <Label htmlFor={`qr-${net}`}>
                                                                            <Button asChild variant="outline" size="sm" className="w-full text-[10px] h-10 cursor-pointer font-bold">
                                                                                <div><FileUp className="h-3 w-3 mr-2" /> Upload QR</div>
                                                                            </Button>
                                                                        </Label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <Button className="w-full font-black uppercase tracking-widest h-12 shadow-lg shadow-primary/10" onClick={() => handleSave('deposit')}>
                                                        <Send className="h-4 w-4 mr-2" /> Deploy Settlement Nodes
                                                    </Button>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </Form>
                </TabsContent>
                
                <TabsContent value="data">
                    <AdminDataView />
                </TabsContent>
            </Tabs>
        </div>
    );
}