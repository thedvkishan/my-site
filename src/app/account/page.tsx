
'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User as UserIcon, Mail, Phone, Calendar, ShieldCheck, Wallet, ArrowDownCircle, ArrowUpCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { doc, query, collection, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';

export default function AccountPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login?redirect=/account');
        }
    }, [user, isUserLoading, router]);

    const profileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const buyOrdersQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'buyOrders'), where('userId', '==', user.uid), where('status', '==', 'completed'));
    }, [firestore, user]);

    const sellOrdersQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'sellOrders'), where('userId', '==', user.uid), where('status', '==', 'completed'));
    }, [firestore, user]);

    const depositsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'deposits'), where('userId', '==', user.uid), where('status', '==', 'completed'));
    }, [firestore, user]);

    const withdrawalsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'withdrawals'), where('userId', '==', user.uid), where('status', '==', 'completed'));
    }, [firestore, user]);

    const { data: profile, isLoading: profileLoading } = useDoc(profileRef);
    const { data: buyOrders } = useCollection(buyOrdersQuery);
    const { data: sellOrders } = useCollection(sellOrdersQuery);
    const { data: deposits } = useCollection(depositsQuery);
    const { data: withdrawals } = useCollection(withdrawalsQuery);

    const stats = useMemo(() => {
        return {
            totalBuy: buyOrders?.reduce((acc, curr) => acc + (curr.usdtAmount || 0), 0) || 0,
            totalSell: sellOrders?.reduce((acc, curr) => acc + (curr.usdtAmount || 0), 0) || 0,
            totalDeposit: deposits?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0,
            totalWithdrawal: withdrawals?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0,
            avgTime: "12-45 mins" // Static mock value as requested
        };
    }, [buyOrders, sellOrders, deposits, withdrawals]);

    if (isUserLoading || profileLoading || !user) {
        return (
            <div className="container mx-auto flex min-h-[50vh] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-6xl px-4 py-8 md:py-16">
            <div className="grid gap-8 md:grid-cols-3">
                {/* User Info Sidebar */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader className="text-center pb-2">
                            <div className="flex justify-center mb-4">
                                <Avatar className="h-24 w-24 border-4 border-primary/10">
                                    <AvatarImage src="" />
                                    <AvatarFallback className="bg-primary/5 text-primary text-2xl font-bold">
                                        {profile?.name?.charAt(0) || user.email?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <CardTitle className="text-xl">{profile?.name || 'User'}</CardTitle>
                            <CardDescription className="text-xs truncate">{user.email}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{user.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{profile?.phone || 'Not provided'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>Joined {profile?.createdAt ? format(new Date(profile.createdAt), 'MMM yyyy') : 'Recently'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <ShieldCheck className="h-4 w-4 text-green-500" />
                                <span className="text-green-600 font-semibold">Account Verified</span>
                            </div>
                            <Separator />
                            <Button variant="outline" className="w-full text-xs" onClick={() => router.push('/login')}>Change Password</Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="p-4">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-primary" /> Current Balance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="text-3xl font-black text-primary">
                                {(profile?.balance || 0).toLocaleString()} <span className="text-sm font-medium">USDT</span>
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Dashboard Stats */}
                <div className="md:col-span-2 space-y-8">
                    <h2 className="text-3xl font-black tracking-tight">Account Overview</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
                        <Card>
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="p-3 bg-green-500/10 rounded-xl">
                                    <TrendingUp className="h-6 w-6 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Buy</p>
                                    <p className="text-2xl font-black">{stats.totalBuy.toLocaleString()} <span className="text-xs font-normal">USDT</span></p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="p-3 bg-destructive/10 rounded-xl">
                                    <TrendingDown className="h-6 w-6 text-destructive" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Sell</p>
                                    <p className="text-2xl font-black">{stats.totalSell.toLocaleString()} <span className="text-xs font-normal">USDT</span></p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-xl">
                                    <ArrowDownCircle className="h-6 w-6 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Deposits</p>
                                    <p className="text-2xl font-black">{stats.totalDeposit.toLocaleString()} <span className="text-xs font-normal">USDT</span></p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="p-3 bg-orange-500/10 rounded-xl">
                                    <ArrowUpCircle className="h-6 w-6 text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Withdrawals</p>
                                    <p className="text-2xl font-black">{stats.totalWithdrawal.toLocaleString()} <span className="text-xs font-normal">USDT</span></p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-2 border-dashed">
                        <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-accent/10 rounded-full">
                                    <Clock className="h-8 w-8 text-accent" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Average Fulfillment Speed</h3>
                                    <p className="text-muted-foreground">Our institutional clearing system processes your orders rapidly.</p>
                                </div>
                            </div>
                            <div className="text-center md:text-right">
                                <p className="text-xs text-muted-foreground font-bold uppercase">Estimated Time</p>
                                <p className="text-4xl font-black text-accent">{stats.avgTime}</p>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <div className="flex justify-center pt-8">
                        <Button variant="outline" onClick={() => router.push('/')}>Back to Trading Dashboard</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
