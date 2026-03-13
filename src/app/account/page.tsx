
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Mail, Phone, Calendar, ShieldCheck, Wallet, ArrowDownCircle, ArrowUpCircle, Clock, TrendingUp, TrendingDown, UserPlus, KeyRound, ShieldQuestion } from 'lucide-react';
import { doc, query, collection, where, setDoc, updateDoc, increment, addDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { SECURITY_QUESTIONS } from '@/lib/schemas';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';

export default function AccountPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [isProvisioning, setIsProvisioning] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        securityQuestion: '',
        securityAnswer: ''
    });

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login?redirect=/account');
        }
    }, [user, isUserLoading, router]);

    const profileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'settings', 'appSettings');
    }, [firestore]);

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
    const { data: settings } = useDoc<any>(settingsRef);
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
            avgTime: "30 - 180 min"
        };
    }, [buyOrders, sellOrders, deposits, withdrawals]);

    const handleProvisionUser = async () => {
        const { email, password, name, securityQuestion, securityAnswer } = newUser;
        const fee = settings?.provisionFee ?? 150;

        if (!email || !password || !name || !securityQuestion || !securityAnswer) {
            toast({ variant: 'destructive', title: 'Protocol Error', description: 'All security fields are mandatory.' });
            return;
        }

        if ((profile?.balance || 0) < fee) {
            toast({ variant: 'destructive', title: 'Insufficient Clearance', description: `Provisioning requires ${fee} USDT clearing balance.` });
            return;
        }

        setIsProvisioning(true);
        try {
            const secondaryApp = initializeApp(firebaseConfig, 'PeerProvisioning');
            const secondaryAuth = getAuth(secondaryApp);
            
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const createdUser = userCredential.user;

            await setDoc(doc(firestore!, 'users', createdUser.uid), {
                userId: createdUser.uid,
                name,
                email,
                balance: 0,
                securityQuestion,
                securityAnswer: securityAnswer.toLowerCase().trim(),
                createdAt: new Date().toISOString(),
                status: 'active'
            });

            if (profileRef) {
                await updateDoc(profileRef, { balance: increment(-fee) });
                await addDoc(collection(firestore!, 'users', user!.uid, 'notifications'), {
                    title: 'Account Provisioned',
                    message: `${name} has been successfully provisioned. Deducted ${fee} USDT protocol fee.`,
                    type: 'success',
                    read: false,
                    createdAt: new Date().toISOString()
                });
            }

            toast({ title: 'Provisioning Successful', description: `Protocol created for ${name}.` });
            setIsCreateDialogOpen(false);
            setNewUser({ name: '', email: '', password: '', securityQuestion: '', securityAnswer: '' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Provisioning Failed', description: error.message });
        } finally {
            setIsProvisioning(false);
        }
    };

    if (isUserLoading || profileLoading || !user) {
        return (
            <div className="container mx-auto flex min-h-[50vh] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-6xl px-4 py-8 md:py-16 animate-in fade-in duration-1000">
            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-1 space-y-6">
                    <Card className="border-2 shadow-sm">
                        <CardHeader className="text-center pb-2">
                            <div className="flex justify-center mb-4">
                                <Avatar className="h-24 w-24 border-4 border-primary/10">
                                    <AvatarFallback className="bg-primary/5 text-primary text-2xl font-bold">
                                        {profile?.name?.charAt(0) || user.email?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <CardTitle className="text-xl font-black uppercase tracking-tight">{profile?.name || 'Institutional Identity'}</CardTitle>
                            <CardDescription className="text-xs truncate font-mono">{user.email}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <div className="flex items-center gap-3 text-sm font-medium">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{user.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm font-medium">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{profile?.phone || 'Not provided'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm font-medium">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>Joined {profile?.createdAt ? format(new Date(profile.createdAt), 'MMM yyyy') : 'Recently'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <ShieldCheck className="h-4 w-4 text-green-500" />
                                <span className="text-green-600 font-bold uppercase text-[10px] tracking-widest">Active Verification</span>
                            </div>
                            <Separator />
                            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="w-full font-black uppercase tracking-widest gap-2 h-12 shadow-lg shadow-primary/10" variant="secondary">
                                        <UserPlus className="h-4 w-4" /> Provision Sub-Account
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl font-black uppercase">Provision Network Member</DialogTitle>
                                        <DialogDescription className="text-xs font-medium">A protocol fee of <span className="text-primary font-bold">{settings?.provisionFee ?? 150} USDT</span> will be charged to your clearing balance.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] font-black uppercase">Member Full Name</Label>
                                            <Input placeholder="Legal Identity" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] font-black uppercase">Credential Email</Label>
                                            <Input type="email" placeholder="identity@domain.com" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] font-black uppercase">Terminal Password</Label>
                                            <Input type="password" placeholder="Min 6 characters" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
                                        </div>
                                        <div className="p-4 bg-muted/30 rounded-xl border border-dashed border-primary/20 space-y-4">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary">
                                                <KeyRound className="h-3 w-3" /> Security Protocol
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase">Recovery Question</Label>
                                                <Select onValueChange={(v) => setNewUser({...newUser, securityQuestion: v})}>
                                                    <SelectTrigger className="text-xs"><SelectValue placeholder="Select Question" /></SelectTrigger>
                                                    <SelectContent>
                                                        {SECURITY_QUESTIONS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase">Recovery Secret</Label>
                                                <Input placeholder="Secret answer" value={newUser.securityAnswer} onChange={(e) => setNewUser({...newUser, securityAnswer: e.target.value})} />
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" className="h-12 font-bold uppercase text-xs" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                                        <Button className="h-12 font-black uppercase tracking-widest text-xs flex-1 gap-2" onClick={handleProvisionUser} disabled={isProvisioning}>
                                            {isProvisioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldQuestion className="h-4 w-4" />}
                                            Pay {settings?.provisionFee ?? 150} USDT & Provision
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/20 border-2">
                        <CardHeader className="p-4">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-muted-foreground">
                                <Wallet className="h-3 w-3 text-primary" /> Clearing Balance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="text-4xl font-black text-primary tracking-tight">
                                {(profile?.balance || 0).toLocaleString()} <span className="text-sm font-bold opacity-60">USDT</span>
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2 space-y-8">
                    <h2 className="text-3xl font-black tracking-tight uppercase">Operational Overview</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
                        <Card className="border-2">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="p-3 bg-green-500/10 rounded-xl">
                                    <TrendingUp className="h-6 w-6 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Total Buy</p>
                                    <p className="text-2xl font-black">{stats.totalBuy.toLocaleString()} <span className="text-xs font-normal">USDT</span></p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-2">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="p-3 bg-destructive/10 rounded-xl">
                                    <TrendingDown className="h-6 w-6 text-destructive" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Total Sell</p>
                                    <p className="text-2xl font-black">{stats.totalSell.toLocaleString()} <span className="text-xs font-normal">USDT</span></p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-2">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-xl">
                                    <ArrowDownCircle className="h-6 w-6 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Total Deposits</p>
                                    <p className="text-2xl font-black">{stats.totalDeposit.toLocaleString()} <span className="text-xs font-normal">USDT</span></p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-2">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="p-3 bg-orange-500/10 rounded-xl">
                                    <ArrowUpCircle className="h-6 w-6 text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Total Withdrawals</p>
                                    <p className="text-2xl font-black">{stats.totalWithdrawal.toLocaleString()} <span className="text-xs font-normal">USDT</span></p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-2 border-dashed bg-muted/5">
                        <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-accent/10 rounded-2xl">
                                    <Clock className="h-8 w-8 text-accent" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black uppercase tracking-tight">Protocol Latency</h3>
                                    <p className="text-muted-foreground text-sm font-medium">Institutional clearing requests process within standard timelines.</p>
                                </div>
                            </div>
                            <div className="text-center md:text-right">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Target Speed</p>
                                <p className="text-4xl font-black text-accent tracking-tighter">{stats.avgTime}</p>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <div className="flex justify-center pt-8">
                        <Button variant="outline" className="h-12 px-8 font-bold uppercase text-xs border-2" onClick={() => router.push('/')}>Back to Trading Terminal</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
