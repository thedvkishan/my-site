'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Loader2, 
  Wallet, 
  TrendingUp, 
  CircleDollarSign, 
  History, 
  Globe, 
  Clock,
  Building2,
  CreditCard,
  Banknote,
  TrendingDown,
  AlertCircle,
  BarChart3,
  Activity,
  Headphones,
  Cpu,
  Lock,
  MessageSquare
} from 'lucide-react';
import { TetherIcon } from '@/components/icons/TetherIcon';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useFirestore, useDoc, useMemoFirebase, useUser, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { AppLogo } from '@/components/layout/AppLogo';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { MOCK_SETTINGS } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';

type UserProfile = {
  balance?: number;
  status?: string;
  name?: string;
}

type Settings = {
  buyRates?: Record<string, number>;
  sellRates?: Record<string, number>;
  allowPublicSignup?: boolean;
}

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const prevProfile = useRef<UserProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'appSettings');
  }, [firestore]);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: settings, isLoading: settingsLoading } = useDoc<Settings>(settingsRef);
  const { data: profile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    if (!profile || !auth) return;

    if (profile.status === 'banned') {
        signOut(auth).then(() => {
            router.push('/login');
            toast({
                variant: 'destructive',
                title: 'Access Revoked',
                description: 'Your account has been banned. Please contact support.',
            });
        });
        return;
    }

    if (prevProfile.current) {
        if (profile.balance !== undefined && prevProfile.current.balance !== undefined && profile.balance !== prevProfile.current.balance) {
            const diff = profile.balance - prevProfile.current.balance;
            toast({
                title: diff > 0 ? 'Balance Credited' : 'Balance Debited',
                description: `${Math.abs(diff).toLocaleString()} USDT has been ${diff > 0 ? 'added to' : 'removed from'} your wallet.`,
                className: diff > 0 ? 'bg-green-500 text-white' : 'bg-destructive text-white',
            });
        }

        if (profile.status !== prevProfile.current.status) {
            if (profile.status === 'on_hold') {
                toast({
                    variant: 'destructive',
                    title: 'Account on Hold',
                    description: 'Your account has been placed on hold. New transactions are restricted.',
                });
            } else if (profile.status === 'active' && prevProfile.current.status === 'on_hold') {
                toast({
                    title: 'Account Restored',
                    description: 'Your account is now active. You can resume trading.',
                });
            }
        }
    }

    prevProfile.current = profile;
  }, [profile, toast, auth, router]);

  // High-availability fallback logic for rates
  const buyRates = (settings?.buyRates && Object.keys(settings.buyRates).length > 0) ? settings.buyRates : MOCK_SETTINGS.buyRates;
  const sellRates = (settings?.sellRates && Object.keys(settings.sellRates).length > 0) ? settings.sellRates : MOCK_SETTINGS.sellRates;
  const bankBuyRate = Number(buyRates?.['Bank Transfer'] || 0);
  const bankSellRate = Number(sellRates?.['Bank Transfer'] || 0);

  if (!mounted) return null;

  if (user) {
    const isOnHold = profile?.status === 'on_hold';

    return (
        <div className="container mx-auto max-w-6xl px-4 py-8 md:py-16 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                            <AppLogo />
                        </div>
                        <h2 className="text-xl font-black tracking-tight text-primary uppercase">TetherSwap Zone</h2>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight">
                            Institutional <span className="text-primary">Hub</span>
                        </h1>
                        <div className="text-muted-foreground md:text-xl font-medium flex items-center gap-2">
                            Operational Terminal for <div className="text-foreground font-bold inline-flex">
                                {profileLoading ? <Skeleton className="h-6 w-32" /> : (profile?.name || user.email?.split('@')[0])}
                            </div>
                        </div>
                    </div>
                </div>
                <Card className="bg-primary/5 border-primary/20 w-full md:w-auto overflow-hidden relative group border-2 shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-6 flex items-center gap-6 relative">
                        <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner">
                            <Wallet className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1">Clearing Balance</p>
                            {profileLoading ? (
                                <Skeleton className="h-10 w-40" />
                            ) : (
                                <div className="text-4xl font-black text-primary tracking-tight">{(profile?.balance || 0).toLocaleString()} <span className="text-sm font-bold opacity-60">USDT</span></div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {isOnHold && (
                <Alert variant="destructive" className="mb-8 border-2 animate-pulse bg-destructive/5">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle className="font-black uppercase tracking-wider">Trading Privileges Suspended</AlertTitle>
                    <AlertDescription className="font-medium">Your account is currently "On Hold" by internal security. You can view your audit history, but new clearing operations are restricted. Please contact our institutional support desk.</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-16">
                {[
                    { label: 'Deposit', icon: CircleDollarSign, href: '/wallet/deposit', color: 'text-primary', bg: 'bg-primary/5' },
                    { label: 'Withdraw', icon: Wallet, href: '/wallet/withdrawal', color: 'text-accent', bg: 'bg-accent/5' },
                    { label: 'Buy USDT', icon: TrendingUp, href: '/buy', color: 'text-green-500', bg: 'bg-green-500/5' },
                    { label: 'Sell USDT', icon: TrendingDown, href: '/sell', color: 'text-destructive', bg: 'bg-destructive/5' },
                    { label: 'History', icon: History, href: '/wallet/history', color: 'text-muted-foreground', bg: 'bg-muted/5' },
                ].map((action, i) => (
                    <Button 
                        key={action.label} 
                        variant="outline" 
                        className={cn(
                            "h-32 flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.02] hover:shadow-xl border-2 animate-in slide-in-from-bottom-4 duration-500 fill-mode-both",
                            isOnHold && action.label !== 'History' && "opacity-50 grayscale cursor-not-allowed"
                        )}
                        style={{ animationDelay: `${i * 50}ms` }}
                        asChild={!isOnHold || action.label === 'History'}
                    >
                        {isOnHold && action.label !== 'History' ? (
                            <div className="flex flex-col items-center justify-center gap-3" onClick={() => toast({ variant: 'destructive', title: 'Hold Active', description: 'Institutional action restricted.' })}>
                                <div className={`p-4 rounded-2xl ${action.bg}`}>
                                    <action.icon className={`h-7 w-7 ${action.color}`} />
                                </div>
                                <span className="font-black text-xs uppercase tracking-widest">{action.label}</span>
                            </div>
                        ) : (
                            <Link href={action.href}>
                                <div className={`p-4 rounded-2xl ${action.bg}`}>
                                    <action.icon className={`h-7 w-7 ${action.color}`} />
                                </div>
                                <span className="font-black text-xs uppercase tracking-widest">{action.label}</span>
                            </Link>
                        )}
                    </Button>
                ))}
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
                <Card className={cn(
                    "relative overflow-hidden group hover:border-primary transition-all duration-500 border-2 shadow-sm hover:shadow-2xl bg-card",
                    isOnHold && "opacity-50 grayscale"
                )}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp className="h-32 w-32 -rotate-12" />
                    </div>
                    <CardHeader className="p-8">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                                <CircleDollarSign className="h-6 w-6 text-primary" />
                             </div>
                             <CardTitle className="text-3xl font-black">Buy USDT</CardTitle>
                        </div>
                        <CardDescription className="text-base font-medium">Acquire digital assets with institutional-grade clearing rates.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
                        <div className="bg-secondary/50 border-2 border-dashed p-6 rounded-2xl flex justify-between items-center group-hover:bg-primary/5 transition-colors">
                            <div>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1">Current Bank Rate</p>
                                {settingsLoading ? (
                                    <Skeleton className="h-10 w-32" />
                                ) : (
                                    <div className="text-4xl font-black tracking-tighter">₹{bankBuyRate.toFixed(2)} <span className="text-sm font-bold text-muted-foreground">/ UNIT</span></div>
                                )}
                            </div>
                            <div className="bg-primary/10 p-3 rounded-full">
                                <Activity className="h-6 w-6 text-primary animate-pulse" />
                            </div>
                        </div>
                        <Button className="w-full h-16 text-lg font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 group-hover:scale-[1.01] transition-transform" asChild={!isOnHold} disabled={isOnHold}>
                            <Link href="/buy">
                                BUY USDT <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className={cn(
                    "relative overflow-hidden group hover:border-destructive transition-all duration-500 border-2 shadow-sm hover:shadow-2xl bg-card",
                    isOnHold && "opacity-50 grayscale"
                )}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingDown className="h-32 w-32 rotate-12" />
                    </div>
                    <CardHeader className="p-8">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-destructive/10 rounded-xl border border-destructive/20">
                                <TetherIcon className="h-6 w-6" />
                             </div>
                             <CardTitle className="text-3xl font-black">Sell USDT</CardTitle>
                        </div>
                        <CardDescription className="text-base font-medium">Liquidate assets into local currency with zero slippage.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
                        <div className="bg-secondary/50 border-2 border-dashed p-6 rounded-2xl flex justify-between items-center group-hover:bg-destructive/5 transition-colors">
                            <div>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1">Current Bank Rate</p>
                                {settingsLoading ? (
                                    <Skeleton className="h-10 w-32" />
                                ) : (
                                    <div className="text-4xl font-black tracking-tighter">₹{bankSellRate.toFixed(2)} <span className="text-sm font-bold text-muted-foreground">/ UNIT</span></div>
                                )}
                            </div>
                            <div className="bg-destructive/10 p-3 rounded-full">
                                <Activity className="h-6 w-6 text-destructive animate-pulse" />
                            </div>
                        </div>
                        <Button variant="destructive" className="w-full h-16 text-lg font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-destructive/20 group-hover:scale-[1.01] transition-transform" asChild={!isOnHold} disabled={isOnHold}>
                            <Link href="/sell">
                                SELL USDT <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 mb-16">
                <Card className="lg:col-span-2 border-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                <CardTitle className="text-xl font-black uppercase tracking-tight">Market Intelligence</CardTitle>
                            </div>
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest animate-pulse border-primary/30 text-primary">LIVE Selling</Badge>
                        </div>
                        <CardDescription className="font-medium">Real-time selling rates across all supported settlement channels.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-border">
                            {settingsLoading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="bg-card p-6 flex flex-col gap-2">
                                        <Skeleton className="h-3 w-16" />
                                        <Skeleton className="h-8 w-24" />
                                    </div>
                                ))
                            ) : (
                                Object.entries(sellRates || {}).map(([method, rate]) => {
                                    const numericRate = Number(rate);
                                    const diff = numericRate - 95;
                                    const percent = (diff / 95) * 100;
                                    const isPositive = percent >= 0;

                                    return (
                                        <div key={method} className="bg-card p-6 flex flex-col gap-1 hover:bg-muted/30 transition-colors">
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{method}</p>
                                            <p className="text-2xl font-black">₹{numericRate.toFixed(2)}</p>
                                            <div className={cn(
                                                "flex items-center gap-1 text-[9px] font-bold",
                                                isPositive ? "text-green-600" : "text-destructive"
                                            )}>
                                                {isPositive ? <TrendingUp className="h-2 w-2" /> : <TrendingDown className="h-2 w-2" />}
                                                {isPositive ? '+' : ''}{percent.toFixed(2)}%
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 bg-muted/5">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            <CardTitle className="text-xl font-black uppercase tracking-tight">Safety Protocol</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-2">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-primary/10 rounded-lg shrink-0"><Cpu className="h-4 w-4 text-primary" /></div>
                            <div>
                                <p className="text-xs font-black uppercase mb-1">Encrypted Transit</p>
                                <p className="text-xs text-muted-foreground font-medium">All financial data is processed via 256-bit AES encrypted protocols.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-primary/10 rounded-lg shrink-0"><Lock className="h-4 w-4 text-primary" /></div>
                            <div>
                                <p className="text-xs font-black uppercase mb-1">Wallet Isolation</p>
                                <p className="text-xs text-muted-foreground font-medium">Clearing balances are stored in multi-sig cold-isolated vaults.</p>
                            </div>
                        </div>
                        <Separator />
                        <Button variant="outline" className="w-full h-12 font-black text-[10px] uppercase tracking-widest" asChild>
                            <Link href="/contact">
                                <Headphones className="mr-2 h-4 w-4" /> 24/7 Priority Support
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 rounded-3xl border-2 border-dashed bg-muted/10">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-background rounded-2xl shadow-sm border">
                        <MessageSquare className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Direct Support Desk</h3>
                        <p className="text-muted-foreground font-medium">Experience an issue? Our human desk is ready to assist your clearing operation.</p>
                    </div>
                </div>
                <Button className="h-14 px-8 font-black uppercase tracking-widest rounded-xl whitespace-nowrap" variant="outline" asChild>
                    <Link href="/contact">Open Support Ticket</Link>
                </Button>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col w-full overflow-hidden">
      <section className="py-12 border-b bg-muted/5">
        <div className="container mx-auto px-4 text-center space-y-6">
          <div className="flex justify-center items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm border-2">
                <AppLogo />
            </div>
            <div className="text-left">
                <h2 className="text-3xl font-black tracking-tighter leading-none">TetherSwap Zone</h2>
                <p className="text-primary font-bold text-xs uppercase tracking-widest mt-1">PROFESSIONAL USDT EXCHANGE</p>
            </div>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed font-medium">
            TetherSwap Zone is a professional digital asset platform providing reliable USDT exchange services. We combine speed and competitive pricing to deliver an efficient trading experience.
          </p>
        </div>
      </section>

      <section className="relative pt-20 pb-20 md:pt-32 md:pb-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-background -z-10" />
        <div className="container mx-auto max-w-6xl text-center space-y-8 animate-in fade-in slide-in-from-top-10 duration-1000">
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none">
            Reliably Buy & Sell <br />
            <span className="text-primary drop-shadow-sm">USDT Tether</span>
          </h1>
          
          <p className="text-muted-foreground text-lg md:text-2xl max-w-3xl mx-auto font-medium leading-relaxed">
            The professional platform for seamless USDT transactions. <br className="hidden md:block" />
            Fast settlements, competitive rates, and dedicated support.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto pt-8 justify-center">
            <Button size="lg" className="h-16 px-10 text-xl font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all" asChild>
                <Link href="/login">Sign In Now</Link>
            </Button>
            {(settings?.allowPublicSignup ?? MOCK_SETTINGS.allowPublicSignup) ? (
              <Button size="lg" variant="secondary" className="h-16 px-10 text-xl font-bold rounded-2xl shadow-xl hover:scale-105 transition-all" asChild>
                  <Link href="/signup">Register Now</Link>
              </Button>
            ) : (
              <Button variant="outline" size="lg" className="h-16 px-10 text-xl font-bold rounded-2xl border-2 hover:bg-secondary transition-all" asChild>
                  <Link href="/contact">Contact Support</Link>
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 pt-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-2 font-bold tracking-widest text-xs uppercase"><ShieldCheck className="h-5 w-5 text-primary" /> Reliable</div>
            <div className="flex items-center gap-2 font-bold tracking-widest text-xs uppercase"><Globe className="h-5 w-5 text-primary" /> Global</div>
            <div className="flex items-center gap-2 font-bold tracking-widest text-xs uppercase"><Clock className="h-5 w-5 text-primary" /> 24/7 Access</div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/20">
        <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Live Markets</h2>
                <p className="text-muted-foreground">Select your trade type to begin your transaction.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
                <Card className="relative overflow-hidden group hover:border-primary transition-all duration-300 border-2 shadow-sm hover:shadow-xl bg-card">
                    <CardHeader className="p-8">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2 bg-primary/10 rounded-lg">
                                <CircleDollarSign className="h-6 w-6 text-primary" />
                             </div>
                             <CardTitle className="text-2xl font-bold">Buy USDT</CardTitle>
                        </div>
                        <CardDescription>Fast purchase with no hidden fees.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
                        <div className="bg-secondary/50 border p-6 rounded-2xl flex justify-between items-center">
                            <div>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Bank Transfer Rate</p>
                                <div className="text-3xl font-black">₹{bankBuyRate.toFixed(2)}</div>
                            </div>
                            <Button size="sm" className="rounded-full font-bold px-6" asChild>
                                <Link href="/login">Sign In to Buy</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden group hover:border-destructive transition-all duration-300 border-2 shadow-sm hover:shadow-xl bg-card">
                    <CardHeader className="p-8">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2 bg-destructive/10 rounded-lg">
                                <TetherIcon className="h-6 w-6" />
                             </div>
                             <CardTitle className="text-2xl font-bold">Sell USDT</CardTitle>
                        </div>
                        <CardDescription>Convert USDT to INR with high liquidity.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
                        <div className="bg-secondary/50 border p-6 rounded-2xl flex justify-between items-center">
                            <div>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Bank Transfer Rate</p>
                                <div className="text-3xl font-black">₹{bankSellRate.toFixed(2)}</div>
                            </div>
                            <Button variant="destructive" size="sm" className="rounded-full font-bold px-6" asChild>
                                <Link href="/login">Sign In to Sell</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </section>

      <section className="py-16 bg-card border-y overflow-hidden">
        <div className="container mx-auto px-4 mb-10 text-center">
            <h3 className="text-2xl font-black uppercase tracking-widest text-muted-foreground/60">Supported Settlement Methods</h3>
        </div>
        <div className="relative flex overflow-x-hidden group">
            <div className="animate-marquee flex whitespace-nowrap py-4">
                {[
                    { name: 'Bank Transfer', icon: Building2 },
                    { name: 'UPI', icon: CreditCard },
                    { name: 'IMPS', icon: Building2 },
                    { name: 'NEFT', icon: CreditCard },
                    { name: 'RTGS', icon: Building2 },
                    { name: 'Cash Deposit', icon: Banknote },
                    { name: 'Tether BEP20', icon: CircleDollarSign },
                    { name: 'Tether TRC20', icon: CircleDollarSign },
                    { name: 'Tether ERC20', icon: CircleDollarSign },
                ].concat([
                    { name: 'Bank Transfer', icon: Building2 },
                    { name: 'UPI', icon: CreditCard },
                    { name: 'IMPS', icon: Building2 },
                    { name: 'NEFT', icon: CreditCard },
                    { name: 'RTGS', icon: Building2 },
                    { name: 'Cash Deposit', icon: Banknote },
                    { name: 'Tether BEP20', icon: CircleDollarSign },
                    { name: 'Tether TRC20', icon: CircleDollarSign },
                    { name: 'Tether ERC20', icon: CircleDollarSign },
                ]).map((pm, i) => (
                    <div key={i} className="mx-8 flex items-center gap-3 bg-muted/30 px-6 py-3 rounded-full border-2 border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all">
                        <pm.icon className="h-5 w-5 text-primary" />
                        <span className="font-bold text-sm tracking-tight">{pm.name}</span>
                    </div>
                ))}
            </div>
        </div>
        <style jsx>{`
            @keyframes marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
            }
            .animate-marquee {
                animation: marquee 30s linear infinite;
            }
        `}</style>
      </section>

      <section className="py-24 bg-card">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 border-2 transition-all hover:border-primary group bg-muted/5">
              <div className="p-4 bg-primary/5 rounded-2xl w-fit mb-6 group-hover:bg-primary/10">
                <ShieldCheck className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Professional Standard</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our platform operates with high standards of integrity and efficiency to protect your trading interest.
              </p>
            </Card>
            <Card className="p-8 border-2 transition-all hover:border-primary group bg-muted/5">
              <div className="p-4 bg-primary/5 rounded-2xl w-fit mb-6 group-hover:bg-primary/10">
                <Zap className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Priority Settlements</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our optimized clearing system ensures that most orders are fulfilled within a professional 30-180 minute timeframe.
              </p>
            </Card>
            <Card className="p-8 border-2 transition-all hover:border-primary group bg-muted/5">
              <div className="p-4 bg-primary/5 rounded-2xl w-fit mb-6 group-hover:bg-primary/10">
                <CircleDollarSign className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Competitive Pricing</h3>
              <p className="text-muted-foreground leading-relaxed">
                We monitor global rates continuously to provide some of the most competitive INR to USDT rates available.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground font-medium">Everything you need to know to get started.</p>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="border-2 rounded-2xl px-6 bg-muted/5">
              <AccordionTrigger className="text-lg font-bold hover:no-underline py-6">Is my account protected?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-lg pb-6 leading-relaxed">
                We utilize standard industry practices, including SSL encryption and secure account verification, to maintain a professional and stable trading environment.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-2 rounded-2xl px-6 bg-muted/5">
              <AccordionTrigger className="text-lg font-bold hover:no-underline py-6">What are the transaction limits?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-lg pb-6 leading-relaxed">
                To maintain efficiency, we have a minimum transaction limit of 100 USDT for all Buy, Sell, and Deposit orders. 
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border-2 rounded-2xl px-6 bg-muted/5">
              <AccordionTrigger className="text-lg font-bold hover:no-underline py-6">How long do settlements take?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-lg pb-6 leading-relaxed">
                Most settlement requests are processed promptly. Depending on network traffic and manual verification, it usually takes between 30 to 180 minutes for funds to reflect.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </div>
  );
}
