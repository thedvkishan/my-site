
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { FileUp, Loader2, Download, Upload, DollarSign, ShieldCheck, UserPlus } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { settingsSchema, type SettingsFormValues } from '@/lib/schemas';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminDataView } from '@/components/admin/AdminDataView';
import { TetherIcon } from '@/components/icons/TetherIcon';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { MOCK_SETTINGS, PAYMENT_METHODS_BUY, PAYMENT_METHODS_SELL } from '@/lib/constants';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Switch } from '@/components/ui/switch';

export type Settings = SettingsFormValues;

const getInitialSettings = (): Settings => MOCK_SETTINGS;

export default function AdminDashboardPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const firestore = useFirestore();

    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'settings', 'appSettings');
    }, [firestore]);

    const { data: storedSettings, isLoading: settingsLoading } = useDoc<Settings>(settingsRef);
    const { isUserLoading } = useUser();

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
        defaultValues: getInitialSettings(),
    });

    useEffect(() => {
        try {
            const authStatus = localStorage.getItem('isAdminAuthenticated');
            if (authStatus !== 'true') {
                router.replace('/adminpower/login');
            } else {
                setIsAuthenticated(true);
            }
        } catch (error) {
            router.replace('/adminpower/login');
        }
    }, [router]);
    
    useEffect(() => {
        if (isInitialized && storedSettings) {
            form.reset(storedSettings);
        }
    }, [isInitialized, storedSettings, form]);

    const handleLogout = () => {
        localStorage.removeItem('isAdminAuthenticated');
        toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
        router.push('/adminpower/login');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof SettingsFormValues | `depositDetails.${'BEP20'|'TRC20'|'ERC20'}.qrCodeUrl`) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const dataUrl = loadEvent.target?.result as string;
                form.setValue(fieldName as any, dataUrl, { shouldDirty: true });
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
                    minDepositAmount: Number(values.minDepositAmount)
                };
                description = 'Exchange rates updated.';
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
                description = 'Deposit details updated.';
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
        <div className="container mx-auto max-w-7xl py-12">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Manage site settings and users.</p>
                </div>
                <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </div>
            
            <Tabs defaultValue="settings">
                <TabsList className='mb-4'>
                    <TabsTrigger value="settings">Site Settings</TabsTrigger>
                    <TabsTrigger value="data">User Data</TabsTrigger>
                </TabsList>
                
                <TabsContent value="settings">
                    <Form {...form}>
                        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
                            <div className="lg:col-span-2 space-y-8">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Core Settings</CardTitle>
                                        <CardDescription>Logo and exchange rates.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Accordion type="single" collapsible defaultValue='logo'>
                                            <AccordionItem value="logo">
                                                <AccordionTrigger className="text-lg">App Logo</AccordionTrigger>
                                                <AccordionContent className="pt-4 space-y-6">
                                                    <div className="flex items-start gap-6">
                                                        <div className="relative h-24 w-24 rounded-md overflow-hidden border bg-muted flex items-center justify-center">
                                                            {watchedValues.appLogoUrl ? (
                                                                <Image src={watchedValues.appLogoUrl} alt="App Logo" fill style={{objectFit: 'cover'}} />
                                                            ) : (
                                                                <TetherIcon className="h-12 w-12 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        <div className="space-y-4 flex-grow">
                                                            <Input id="logo-upload" type="file" className='hidden' accept="image/png, image/jpeg" onChange={(e) => handleFileChange(e, 'appLogoUrl')} />
                                                            <Label htmlFor='logo-upload'>
                                                                <Button asChild variant="outline" className="w-full"><div><FileUp className='mr-2' /> Upload Image</div></Button>
                                                            </Label>
                                                            <Button className="w-full" onClick={() => handleSave('logo')}>Save Logo</Button>
                                                        </div>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                            <AccordionItem value="rates">
                                                <AccordionTrigger className="text-lg">Exchange Rates</AccordionTrigger>
                                                <AccordionContent className="pt-4 space-y-6">
                                                    <div className="grid md:grid-cols-2 gap-6">
                                                         <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
                                                            <h4 className="font-bold flex items-center gap-2">Buy Rates (INR)</h4>
                                                            {PAYMENT_METHODS_BUY.map(method => (
                                                                <FormField key={`buy-${method}`} control={form.control} name={`buyRates.${method}`} render={({ field }) => (<FormItem><FormLabel>{method}</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>)}/>
                                                            ))}
                                                         </div>
                                                         <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
                                                            <h4 className="font-bold flex items-center gap-2">Sell Rates (INR)</h4>
                                                            {PAYMENT_METHODS_SELL.map(method => (
                                                                <FormField key={`sell-${method}`} control={form.control} name={`sellRates.${method}`} render={({ field }) => (<FormItem><FormLabel>{method}</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>)}/>
                                                            ))}
                                                         </div>
                                                    </div>
                                                    <Button className="w-full" onClick={() => handleSave('rates')}>Save Rates</Button>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    </CardContent>
                                </Card>

                                <Card className="border-2 border-primary/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Security & Registration</CardTitle>
                                        <CardDescription>Control institutional entry protocols.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="allowPublicSignup"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-muted/5">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base font-black uppercase tracking-tight">Public Registration</FormLabel>
                                                        <CardDescription>If enabled, guest users can create their own accounts. If disabled, only admins can provision accounts.</CardDescription>
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
                                <Card>
                                    <CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader>
                                    <CardContent>
                                        <Accordion type="multiple" className="w-full space-y-4">
                                            <AccordionItem value="bank">
                                                <AccordionTrigger>Bank Details</AccordionTrigger>
                                                <AccordionContent className="space-y-4">
                                                    <FormField control={form.control} name="bankDetails.holderName" render={({ field }) => (<FormItem><FormLabel>Holder Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)}/>
                                                    <FormField control={form.control} name="bankDetails.bankName" render={({ field }) => (<FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)}/>
                                                    <FormField control={form.control} name="bankDetails.accountNumber" render={({ field }) => (<FormItem><FormLabel>Account Number</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)}/>
                                                    <FormField control={form.control} name="bankDetails.ifsc" render={({ field }) => (<FormItem><FormLabel>IFSC</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)}/>
                                                    <Button className="w-full" onClick={() => handleSave('bank')}>Save Bank</Button>
                                                </AccordionContent>
                                            </AccordionItem>
                                            <AccordionItem value="upi">
                                                <AccordionTrigger>UPI & QR</AccordionTrigger>
                                                <AccordionContent className="space-y-4">
                                                    <FormField control={form.control} name="upiId" render={({ field }) => (<FormItem><FormLabel>UPI ID</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)}/>
                                                    <div className="flex justify-center p-2 border rounded-md">
                                                        {watchedValues.qrCodeUrl && <Image src={watchedValues.qrCodeUrl} alt="UPI QR" width={128} height={128} />}
                                                    </div>
                                                    <Input id="upi-qr-upload" type="file" className='hidden' accept="image/png, image/jpeg" onChange={(e) => handleFileChange(e, 'qrCodeUrl')} />
                                                    <Label htmlFor='upi-qr-upload'><Button asChild variant="outline" className="w-full"><div>Upload QR</div></Button></Label>
                                                    <Button className="w-full" onClick={() => handleSave('upi')}>Save UPI</Button>
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
