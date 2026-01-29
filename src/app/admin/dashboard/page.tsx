'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { useSettingsStore, type Settings } from '@/hooks/use-settings-store';

type DepositDetails = Settings['depositDetails'];

export default function AdminDashboardPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const { settings: storedSettings, setSettings: saveSettings, isInitialized, isLoading } = useSettingsStore();

    // Local form state, initialized from the settings store
    const [bankDetails, setBankDetails] = useState(storedSettings.bankDetails);
    const [upiId, setUpiId] = useState(storedSettings.upiId);
    const [qrCodeUrl, setQrCodeUrl] = useState(storedSettings.qrCodeUrl);
    const [buyBannerUrl, setBuyBannerUrl] = useState(storedSettings.buyBannerUrl);
    const [sellBannerUrl, setSellBannerUrl] = useState(storedSettings.sellBannerUrl);
    const [depositDetails, setDepositDetails] = useState<DepositDetails>(storedSettings.depositDetails);

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
    
    // Sync local form state with settings from the store once initialized
    useEffect(() => {
        if(isInitialized) {
            setBankDetails(storedSettings.bankDetails);
            setUpiId(storedSettings.upiId);
            setQrCodeUrl(storedSettings.qrCodeUrl);
            setBuyBannerUrl(storedSettings.buyBannerUrl);
            setSellBannerUrl(storedSettings.sellBannerUrl);
            setDepositDetails(storedSettings.depositDetails);
        }
    }, [isInitialized, storedSettings]);

    const handleLogout = () => {
        localStorage.removeItem('isAdminAuthenticated');
        toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
        router.push('/admin/login');
    };

    const handleDepositDetailsChange = (network: 'BEP20' | 'TRC20' | 'ERC20', field: 'address' | 'qrCodeUrl', value: string) => {
        setDepositDetails(prev => ({
            ...prev,
            [network]: {
                ...prev[network],
                [field]: value
            }
        }));
    };

    const handleSave = async (type: 'bank' | 'upi' | 'banners' | 'deposit') => {
        setIsSaving(true);
        
        let newSettings: Partial<Settings> = {};
        let description = '';

        switch(type) {
            case 'bank':
                newSettings = { bankDetails };
                description = 'Bank details have been updated.';
                break;
            case 'upi':
                newSettings = { upiId, qrCodeUrl };
                description = 'UPI and QR code have been updated.';
                break;
            case 'banners':
                newSettings = { buyBannerUrl, sellBannerUrl };
                description = 'Homepage banners have been updated.';
                break;
            case 'deposit':
                newSettings = { depositDetails };
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

    if (!isAuthenticated || isLoading) {
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
                    <p className="text-muted-foreground">Manage payment settings and content for TetherSwap Zone.</p>
                </div>
                <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </div>

            <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Content Management</CardTitle>
                            <CardDescription>Update images and other content shown on the site.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible defaultValue='banners'>
                                <AccordionItem value="banners">
                                    <AccordionTrigger className="text-lg">Homepage Banners</AccordionTrigger>
                                    <AccordionContent className="pt-4 space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <h4 className="font-semibold">Buy Banner</h4>
                                                <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                                                    <Image src={buyBannerUrl} alt="Buy Banner Preview" fill style={{objectFit: 'cover'}} data-ai-hint="crypto buy"/>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="buyBannerUrl">Image URL</Label>
                                                    <Input id="buyBannerUrl" value={buyBannerUrl} onChange={(e) => setBuyBannerUrl(e.target.value)} />
                                                </div>
                                            </div>
                                             <div className="space-y-4">
                                                <h4 className="font-semibold">Sell Banner</h4>
                                                <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                                                    <Image src={sellBannerUrl} alt="Sell Banner Preview" fill style={{objectFit: 'cover'}} data-ai-hint="crypto sell"/>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="sellBannerUrl">Image URL</Label>
                                                    <Input id="sellBannerUrl" value={sellBannerUrl} onChange={(e) => setSellBannerUrl(e.target.value)} />
                                                </div>
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
                                            <div className="space-y-2">
                                                <Label htmlFor="holderName">Account Holder Name</Label>
                                                <Input id="holderName" value={bankDetails.holderName} onChange={(e) => setBankDetails(prev => ({...prev, holderName: e.target.value}))}/>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="bankName">Bank Name</Label>
                                                <Input id="bankName" value={bankDetails.bankName} onChange={(e) => setBankDetails(prev => ({...prev, bankName: e.target.value}))}/>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="accountNumber">Account Number</Label>
                                                <Input id="accountNumber" value={bankDetails.accountNumber} onChange={(e) => setBankDetails(prev => ({...prev, accountNumber: e.target.value}))}/>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="ifsc">IFSC Code</Label>
                                                <Input id="ifsc" value={bankDetails.ifsc} onChange={(e) => setBankDetails(prev => ({...prev, ifsc: e.target.value}))}/>
                                            </div>
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
                                            <div className="space-y-2">
                                                <Label htmlFor="upiId">UPI ID</Label>
                                                <Input id="upiId" value={upiId} onChange={(e) => setUpiId(e.target.value)}/>
                                            </div>
                                            <Separator className="my-4" />
                                            <div className="space-y-4">
                                                <Label>Current QR Code Preview</Label>
                                                <div className="flex justify-center p-2 border rounded-md bg-muted">
                                                    <Image src={qrCodeUrl} alt="UPI QR Code" width={128} height={128} data-ai-hint="qr code" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="qrCodeUrlInput">QR Code Image URL</Label>
                                                    <Input id="qrCodeUrlInput" value={qrCodeUrl} onChange={(e) => setQrCodeUrl(e.target.value)} />
                                                </div>
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
                            <CardDescription>
                                Manage deposit addresses and QR codes for each network.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Accordion type="single" collapsible defaultValue="BEP20" className="w-full">
                                {(['BEP20', 'TRC20', 'ERC20'] as const).map((network) => (
                                    <AccordionItem value={network} key={network}>
                                        <AccordionTrigger>{network}</AccordionTrigger>
                                        <AccordionContent className="space-y-4 pt-4">
                                            <div className="grid md:grid-cols-1 gap-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor={`${network}Address`}>Deposit Address</Label>
                                                    <Textarea
                                                        id={`${network}Address`}
                                                        value={depositDetails[network].address}
                                                        onChange={(e) => handleDepositDetailsChange(network, 'address', e.target.value)}
                                                        rows={3}
                                                    />
                                                </div>
                                                <div className="space-y-4">
                                                   <Label>QR Code Preview</Label>
                                                   <div className="flex justify-center p-2 border rounded-md bg-muted">
                                                     <Image src={depositDetails[network].qrCodeUrl} alt={`${network} QR Code`} width={128} height={128} data-ai-hint="qr code" />
                                                   </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`${network}QrUrl`}>QR Code Image URL</Label>
                                                        <Input
                                                            id={`${network}QrUrl`}
                                                            value={depositDetails[network].qrCodeUrl}
                                                            onChange={(e) => handleDepositDetailsChange(network, 'qrCodeUrl', e.target.value)}
                                                        />
                                                    </div>
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
                </div>
            </div>
        </div>
    );
}
