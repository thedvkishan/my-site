'use client';

import { useEffect, useState } from 'react';
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
import { FileUp, Loader2, Download, Upload } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { useSettingsStore, type Settings } from '@/hooks/use-settings-store';
import { settingsSchema, type SettingsFormValues } from '@/lib/schemas';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminDataView } from '@/components/admin/AdminDataView';
import { TetherIcon } from '@/components/icons/TetherIcon';

export default function AdminDashboardPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const { settings: storedSettings, setSettings: saveSettings, isInitialized } = useSettingsStore();

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: storedSettings,
    });

    useEffect(() => {
        try {
            const authStatus = localStorage.getItem('isAdminAuthenticated');
            if (authStatus !== 'true') {
                router.replace('/admin/login');
            } else {
                setIsAuthenticated(true);
            }
        } catch (error) {
            router.replace('/admin/login');
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
        router.push('/admin/login');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof SettingsFormValues | `depositDetails.${'BEP20'|'TRC20'|'ERC20'}.qrCodeUrl`) => {
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

    const handleSave = async (type: 'bank' | 'upi' | 'banners' | 'deposit' | 'logo') => {
        setIsSaving(true);
        
        const values = form.getValues();
        let newSettings: Partial<Settings> = {};
        let description = '';

        switch(type) {
            case 'logo':
                newSettings = { appLogoUrl: values.appLogoUrl };
                description = 'App logo has been updated.';
                break;
            case 'bank':
                newSettings = { bankDetails: values.bankDetails };
                description = 'Bank details have been updated.';
                break;
            case 'upi':
                newSettings = { upiId: values.upiId, qrCodeUrl: values.qrCodeUrl };
                description = 'UPI and QR code have been updated.';
                break;
            case 'banners':
                newSettings = { buyBannerUrl: values.buyBannerUrl, sellBannerUrl: values.sellBannerUrl };
                description = 'Homepage banners have been updated.';
                break;
            case 'deposit':
                newSettings = { depositDetails: values.depositDetails };
                description = 'USDT deposit details have been updated.';
                break;
        }

        try {
            await saveSettings(newSettings);
            toast({
                title: 'Settings Saved',
                description: description,
            });
        } catch (error) {
            console.error("Failed to save settings:", error);
            toast({
                variant: "destructive",
                title: 'Save Failed',
                description: 'Could not save settings. Please try again.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownload = () => {
        if (!storedSettings) {
            toast({
                variant: "destructive",
                title: 'Error',
                description: 'Settings not loaded yet.',
            });
            return;
        }
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(storedSettings, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = "tetherswap-settings.json";
        link.click();
        toast({ title: 'Settings Exported', description: 'Your settings have been downloaded.' });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = event.target?.result as string;
                const newSettings = JSON.parse(json);
                
                const validationResult = settingsSchema.safeParse(newSettings);
                if (!validationResult.success) {
                    console.error("Invalid settings file:", validationResult.error);
                    toast({
                        variant: "destructive",
                        title: 'Upload Failed',
                        description: 'The uploaded file has an invalid format.',
                    });
                    return;
                }

                setIsSaving(true);
                await saveSettings(validationResult.data);
                form.reset(validationResult.data);
                toast({
                    title: 'Settings Imported',
                    description: 'Your settings have been successfully uploaded and saved.',
                });
            } catch (error) {
                console.error("Failed to parse or save settings:", error);
                toast({
                    variant: "destructive",
                    title: 'Upload Failed',
                    description: 'Could not read or save the settings file.',
                });
            } finally {
                setIsSaving(false);
                if (e.target) {
                    e.target.value = '';
                }
            }
        };
        reader.readAsText(file);
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
                    <p className="text-muted-foreground">Manage settings and view user data for TetherSwap Zone.</p>
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
                                        <CardTitle>Content Management</CardTitle>
                                        <CardDescription>Update images and other content shown on the site.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Accordion type="single" collapsible defaultValue='logo'>
                                            <AccordionItem value="logo">
                                                <AccordionTrigger className="text-lg">App Logo</AccordionTrigger>
                                                <AccordionContent className="pt-4 space-y-6">
                                                    <div className="flex items-start gap-6">
                                                        <div className="relative h-24 w-24 rounded-md overflow-hidden border bg-muted flex items-center justify-center">
                                                            {watchedValues.appLogoUrl ? (
                                                                <Image src={watchedValues.appLogoUrl} alt="App Logo Preview" fill style={{objectFit: 'cover'}} />
                                                            ) : (
                                                                <TetherIcon className="h-12 w-12 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        <div className="space-y-4 flex-grow">
                                                            <FormItem>
                                                                <FormLabel>Upload Logo</FormLabel>
                                                                <FormControl>
                                                                    <div className='flex items-center gap-2'>
                                                                        <Input id="logo-upload" type="file" className='hidden' accept="image/png, image/jpeg" onChange={(e) => handleFileChange(e, 'appLogoUrl')} />
                                                                        <Label htmlFor='logo-upload' className='flex-grow'>
                                                                            <Button asChild variant="outline"><div><FileUp className='mr-2' /> Upload Image</div></Button>
                                                                        </Label>
                                                                    </div>
                                                                </FormControl>
                                                                <p className="text-xs text-muted-foreground">Recommended: Square image (e.g., 64x64px).</p>
                                                            </FormItem>
                                                            <Button className="w-full" onClick={() => handleSave('logo')} disabled={isSaving}>
                                                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                Save Logo
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                            <AccordionItem value="banners">
                                                <AccordionTrigger className="text-lg">Homepage Banners</AccordionTrigger>
                                                <AccordionContent className="pt-4 space-y-6">
                                                    <div className="grid md:grid-cols-2 gap-6">
                                                        <div className="space-y-4">
                                                            <h4 className="font-semibold">Buy Banner</h4>
                                                            <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                                                                {watchedValues.buyBannerUrl && <Image src={watchedValues.buyBannerUrl} alt="Buy Banner Preview" fill style={{objectFit: 'cover'}} data-ai-hint="crypto buy"/>}
                                                            </div>
                                                            <FormItem>
                                                                <FormLabel>Upload Banner</FormLabel>
                                                                <FormControl>
                                                                    <div className='flex items-center gap-2'>
                                                                        <Input id="buy-banner-upload" type="file" className='hidden' accept="image/png, image/jpeg" onChange={(e) => handleFileChange(e, 'buyBannerUrl')} />
                                                                        <Label htmlFor='buy-banner-upload' className='flex-grow'>
                                                                            <Button asChild variant="outline"><div><FileUp className='mr-2' /> Upload Image</div></Button>
                                                                        </Label>
                                                                    </div>
                                                                </FormControl>
                                                            </FormItem>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <h4 className="font-semibold">Sell Banner</h4>
                                                            <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                                                                {watchedValues.sellBannerUrl && <Image src={watchedValues.sellBannerUrl} alt="Sell Banner Preview" fill style={{objectFit: 'cover'}} data-ai-hint="crypto sell"/>}
                                                            </div>
                                                            <FormItem>
                                                                <FormLabel>Upload Banner</FormLabel>
                                                                <FormControl>
                                                                    <div className='flex items-center gap-2'>
                                                                        <Input id="sell-banner-upload" type="file" className='hidden' accept="image/png, image/jpeg" onChange={(e) => handleFileChange(e, 'sellBannerUrl')} />
                                                                        <Label htmlFor='sell-banner-upload' className='flex-grow'>
                                                                            <Button asChild variant="outline"><div><FileUp className='mr-2' /> Upload Image</div></Button>
                                                                        </Label>
                                                                    </div>
                                                                </FormControl>
                                                            </FormItem>
                                                        </div>
                                                    </div>
                                                    <Button className="w-full" onClick={() => handleSave('banners')} disabled={isSaving}>
                                                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        Save Banners
                                                    </Button>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-8">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Payment Methods</CardTitle>
                                        <CardDescription>Update details for receiving payments from users.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Accordion type="multiple" className="w-full space-y-4">
                                            <Card>
                                                <AccordionItem value="bank">
                                                    <AccordionTrigger className='p-6'>Bank (IMPS/NEFT/RTGS)</AccordionTrigger>
                                                    <AccordionContent className="p-6 pt-0 space-y-4">
                                                        <FormField control={form.control} name="bankDetails.holderName" render={({ field }) => (<FormItem><FormLabel>Account Holder Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                                        <FormField control={form.control} name="bankDetails.bankName" render={({ field }) => (<FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                                        <FormField control={form.control} name="bankDetails.accountNumber" render={({ field }) => (<FormItem><FormLabel>Account Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                                        <FormField control={form.control} name="bankDetails.ifsc" render={({ field }) => (<FormItem><FormLabel>IFSC Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                                        <Button className="w-full" onClick={() => handleSave('bank')} disabled={isSaving}>
                                                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                            Save Bank Details
                                                        </Button>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Card>

                                            <Card>
                                                <AccordionItem value="upi">
                                                    <AccordionTrigger className='p-6'>UPI & QR Code</AccordionTrigger>
                                                    <AccordionContent className="p-6 pt-0 space-y-4">
                                                        <FormField control={form.control} name="upiId" render={({ field }) => (<FormItem><FormLabel>UPI ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                                        <Separator className="my-4" />
                                                        <div className="space-y-4">
                                                            <Label>Current QR Code Preview</Label>
                                                            <div className="flex justify-center p-2 border rounded-md bg-muted">
                                                                {watchedValues.qrCodeUrl && <Image src={watchedValues.qrCodeUrl} alt="UPI QR Code" width={128} height={128} data-ai-hint="qr code" />}
                                                            </div>
                                                            <FormItem>
                                                                <FormLabel>Upload QR Code</FormLabel>
                                                                <FormControl>
                                                                    <div className='flex items-center gap-2'>
                                                                        <Input id="upi-qr-upload" type="file" className='hidden' accept="image/png, image/jpeg" onChange={(e) => handleFileChange(e, 'qrCodeUrl')} />
                                                                        <Label htmlFor='upi-qr-upload' className='flex-grow'>
                                                                            <Button asChild variant="outline"><div><FileUp className='mr-2' /> Upload Image</div></Button>
                                                                        </Label>
                                                                    </div>
                                                                </FormControl>
                                                            </FormItem>
                                                        </div>
                                                        <Button className="w-full" onClick={() => handleSave('upi')} disabled={isSaving}>
                                                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                            Save UPI Settings
                                                        </Button>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Card>
                                        </Accordion>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>USDT Deposit Settings</CardTitle>
                                        <CardDescription>Manage deposit addresses and QR codes for each network.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <Accordion type="single" collapsible defaultValue="BEP20" className="w-full">
                                            {(['BEP20', 'TRC20', 'ERC20'] as const).map((network) => (
                                                <AccordionItem value={network} key={network}>
                                                    <AccordionTrigger>{network}</AccordionTrigger>
                                                    <AccordionContent className="space-y-4 pt-4">
                                                        <div className="grid md:grid-cols-1 gap-6">
                                                            <FormField
                                                                control={form.control}
                                                                name={`depositDetails.${network}.address`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Deposit Address</FormLabel>
                                                                        <FormControl><Textarea {...field} rows={3} /></FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <div className="space-y-4">
                                                                <Label>QR Code Preview</Label>
                                                                <div className="flex justify-center p-2 border rounded-md bg-muted">
                                                                {watchedValues.depositDetails?.[network]?.qrCodeUrl && <Image src={watchedValues.depositDetails[network].qrCodeUrl} alt={`${network} QR Code`} width={128} height={128} data-ai-hint="qr code" />}
                                                                </div>
                                                                <FormItem>
                                                                    <FormLabel>Upload QR Code</FormLabel>
                                                                    <FormControl>
                                                                        <div className='flex items-center gap-2'>
                                                                            <Input id={`${network}-qr-upload`} type="file" className='hidden' accept="image/png, image/jpeg" onChange={(e) => handleFileChange(e, `depositDetails.${network}.qrCodeUrl`)} />
                                                                            <Label htmlFor={`${network}-qr-upload`} className='flex-grow'>
                                                                                <Button asChild variant="outline"><div><FileUp className='mr-2' /> Upload Image</div></Button>
                                                                            </Label>
                                                                        </div>
                                                                    </FormControl>
                                                                </FormItem>
                                                            </div>
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                        <Button className="w-full !mt-6" onClick={() => handleSave('deposit')} disabled={isSaving}>
                                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save Deposit Details
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Import/Export Settings</CardTitle>
                                        <CardDescription>Download or upload your site settings as a JSON file.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <Button className="w-full" variant="outline" onClick={handleDownload} disabled={!isInitialized}>
                                            <Download className="mr-2" />
                                            Download Settings
                                        </Button>
                                        <div>
                                            <Input id="settings-upload" type="file" className='hidden' accept="application/json" onChange={handleFileUpload} disabled={isSaving} />
                                            <Label htmlFor='settings-upload' className='w-full'>
                                                <Button asChild variant="outline" className='w-full' disabled={isSaving}>
                                                    <div>
                                                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className='mr-2' />}
                                                        Upload & Save Settings
                                                    </div>
                                                </Button>
                                            </Label>
                                        </div>
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
