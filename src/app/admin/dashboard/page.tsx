'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MOCK_BANK_DETAILS, MOCK_UPI_ID } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

export default function AdminDashboardPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Form states for mock updates
    const [bankDetails, setBankDetails] = useState(MOCK_BANK_DETAILS);
    const [upiId, setUpiId] = useState(MOCK_UPI_ID);

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

    const handleLogout = () => {
        localStorage.removeItem('isAdminAuthenticated');
        toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
        router.push('/admin/login');
    };

    const handleSave = (type: 'bank' | 'upi') => {
        setIsLoading(true);
        setTimeout(() => {
            // Here you would typically make an API call to save the data.
            // For this mock, we just show a toast.
            toast({
                title: 'Settings Saved',
                description: `${type === 'bank' ? 'Bank details' : 'UPI and QR code'} have been updated.`,
            });
            setIsLoading(false);
        }, 1500);
    };

    if (!isAuthenticated) {
        // Render nothing or a loading spinner while checking auth
        return null;
    }

    return (
        <div className="container mx-auto max-w-4xl py-12">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Manage payment settings for TetherSwap Zone.</p>
                </div>
                <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Bank Payment Method</CardTitle>
                        <CardDescription>Update details for IMPS, NEFT, and RTGS payments.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                        <Button className="w-full" onClick={() => handleSave('bank')} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Bank Details
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>UPI & QR Code</CardTitle>
                        <CardDescription>Update details for UPI payments.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="upiId">UPI ID</Label>
                            <Input id="upiId" value={upiId} onChange={(e) => setUpiId(e.target.value)}/>
                        </div>
                        <Separator className="my-4" />
                        <div className="space-y-2">
                            <Label htmlFor="qrCode">Upload New QR Code</Label>
                            <Input id="qrCode" type="file" />
                            <p className="text-sm text-muted-foreground">This is a mock upload. No file will be processed.</p>
                        </div>
                        <Button className="w-full" onClick={() => handleSave('upi')} disabled={isLoading}>
                             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             Save UPI Settings
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
