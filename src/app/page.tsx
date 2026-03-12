
'use client';

import Image from 'next/image';
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
  Lock, 
  Globe, 
  CheckCircle2,
  BarChart3,
  Clock,
  ShieldAlert,
  Verified,
  Scale
} from 'lucide-react';
import { TetherIcon } from '@/components/icons/TetherIcon';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { AppLogo } from '@/components/layout/AppLogo';

type UserProfile = {
  balance?: number;
}

type Settings = {
  buyBannerUrl?: string;
  sellBannerUrl?: string;
  buyRateBank?: number;
  sellRateBank?: number;
}

export default function Home() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
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

  if (isUserLoading || settingsLoading || profileLoading || !settings) {
    return (
        <div className="container mx-auto flex min-h-[50vh] items-center justify-center">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }

  // LOGGED IN VIEW (DASHBOARD)
  if (user) {
    return (
        <div className="container mx-auto max-w-6xl px-4 py-8 md:py-16 animate-in fade-in duration-1000">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                <div className="space-y-2">
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                        Trading Hub
                    </h1>
                    <p className="text-muted-foreground md:text-xl">
                        Welcome back, <span className="text-foreground font-semibold">{user.email?.split('@')[0]}</span>.
                    </p>
                </div>
                <Card className="bg-primary/5 border-primary/20 w-full md:w-auto overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-6 flex items-center gap-6 relative">
                        <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner">
                            <Wallet className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">Total Assets</p>
                            <p className="text-3xl font-black text-primary">{(profile?.balance || 0).toLocaleString()} <span className="text-sm font-medium">USDT</span></p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                {[
                    { label: 'Deposit', icon: CircleDollarSign, href: '/wallet/deposit', color: 'text-primary', bg: 'bg-primary/5' },
                    { label: 'Withdraw', icon: Wallet, href: '/wallet/withdrawal', color: 'text-accent', bg: 'bg-accent/5' },
                    { label: 'Buy USDT', icon: TrendingUp, href: '/buy', color: 'text-green-500', bg: 'bg-green-500/5' },
                    { label: 'History', icon: History, href: '/wallet/history', color: 'text-muted-foreground', bg: 'bg-muted/5' },
                ].map((action, i) => (
                    <Button 
                        key={action.label} 
                        variant="outline" 
                        className="h-28 flex flex-col items-center justify-center gap-3 transition-all hover:scale-105 hover:shadow-lg border-2 animate-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                        style={{ animationDelay: `${i * 100}ms` }}
                        asChild
                    >
                        <Link href={action.href}>
                            <div className={`p-3 rounded-full ${action.bg}`}>
                                <action.icon className={`h-6 w-6 ${action.color}`} />
                            </div>
                            <span className="font-bold tracking-tight">{action.label}</span>
                        </Link>
                    </Button>
                ))}
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
                <Card className="relative overflow-hidden group hover:border-primary transition-all duration-300 border-2 shadow-sm hover:shadow-xl">
                    <CardHeader className="p-8">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2 bg-primary/10 rounded-lg">
                                <CircleDollarSign className="h-6 w-6 text-primary" />
                             </div>
                             <CardTitle className="text-2xl font-bold">Buy USDT</CardTitle>
                        </div>
                        <CardDescription>Fast purchase with local INR methods.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
                        <div className="bg-secondary/50 border p-6 rounded-2xl flex justify-between items-center">
                            <div>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Market Rate</p>
                                <p className="text-3xl font-black">₹{(Number(settings.buyRateBank) || 0).toFixed(2)} <span className="text-sm font-medium text-muted-foreground">/ USDT</span></p>
                            </div>
                            <BarChart3 className="h-10 w-10 text-primary opacity-20" />
                        </div>
                        <Button className="w-full h-14 text-lg font-bold rounded-xl" asChild>
                            <Link href="/buy">
                                Buy Now <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden group hover:border-destructive transition-all duration-300 border-2 shadow-sm hover:shadow-xl">
                    <CardHeader className="p-8">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2 bg-destructive/10 rounded-lg">
                                <TetherIcon className="h-6 w-6" />
                             </div>
                             <CardTitle className="text-2xl font-bold">Sell USDT</CardTitle>
                        </div>
                        <CardDescription>Instant conversion to local currency.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
                        <div className="bg-secondary/50 border p-6 rounded-2xl flex justify-between items-center">
                            <div>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Market Rate</p>
                                <p className="text-3xl font-black">₹{(Number(settings.sellRateBank) || 0).toFixed(2)} <span className="text-sm font-medium text-muted-foreground">/ USDT</span></p>
                            </div>
                            <BarChart3 className="h-10 w-10 text-destructive opacity-20 rotate-180" />
                        </div>
                        <Button variant="destructive" className="w-full h-14 text-lg font-bold rounded-xl" asChild>
                            <Link href="/sell">
                                Sell Now <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
  }

  // GUEST VIEW (MARKETING LANDING)
  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* Branding Hero Section */}
      <section className="py-12 border-b bg-muted/5">
        <div className="container mx-auto px-4 text-center space-y-6">
          <div className="flex justify-center items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm border">
                <AppLogo />
            </div>
            <div className="text-left">
                <h2 className="text-3xl font-black tracking-tighter leading-none">TetherSwap Zone</h2>
                <p className="text-primary font-bold text-xs uppercase tracking-widest mt-1">INSTITUTIONAL GRADE TRADING</p>
            </div>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed font-medium">
            TetherSwap Zone is a leading global digital asset platform providing professional-grade USDT exchange services. We combine security, speed, and competitive pricing to deliver the best trading experience.
          </p>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 md:pt-32 md:pb-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-background -z-10" />
        <div className="container mx-auto max-w-6xl text-center space-y-8 animate-in fade-in slide-in-from-top-10 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
            <ShieldCheck className="h-4 w-4" /> Trusted by 50,000+ Traders
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none">
            Securely Buy & Sell <br />
            <span className="text-primary drop-shadow-sm">USDT Tether</span>
          </h1>
          
          <p className="text-muted-foreground text-lg md:text-2xl max-w-3xl mx-auto font-medium leading-relaxed">
            The most professional platform for seamless USDT transactions. <br className="hidden md:block" />
            Fast settlements, institutional-grade security, and 24/7 support.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto pt-8 justify-center">
            <Button size="lg" className="h-16 px-10 text-xl font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all" asChild>
                <Link href="/signup">Get Started Now</Link>
            </Button>
            <Button variant="outline" size="lg" className="h-16 px-10 text-xl font-bold rounded-2xl border-2 hover:bg-secondary transition-all" asChild>
                <Link href="/login">Sign In</Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 pt-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-2 font-bold tracking-widest text-xs uppercase"><ShieldCheck className="h-5 w-5 text-primary" /> Certified</div>
            <div className="flex items-center gap-2 font-bold tracking-widest text-xs uppercase"><Lock className="h-5 w-5 text-primary" /> Encrypted</div>
            <div className="flex items-center gap-2 font-bold tracking-widest text-xs uppercase"><Globe className="h-5 w-5 text-primary" /> Global</div>
            <div className="flex items-center gap-2 font-bold tracking-widest text-xs uppercase"><Clock className="h-5 w-5 text-primary" /> 24/7 Live</div>
          </div>
        </div>
      </section>

      {/* Interactive Trade Section */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Live Markets</h2>
                <p className="text-muted-foreground">Select your trade type to begin institutional verification.</p>
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
                        <CardDescription>Instant purchase with zero hidden fees.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
                        <div className="bg-secondary/50 border p-6 rounded-2xl flex justify-between items-center">
                            <div>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Buy Rate</p>
                                <p className="text-3xl font-black">₹{(Number(settings.buyRateBank) || 0).toFixed(2)}</p>
                            </div>
                            <Button size="sm" className="rounded-full" asChild>
                                <Link href="/signup">Buy Now</Link>
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
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Sell Rate</p>
                                <p className="text-3xl font-black">₹{(Number(settings.sellRateBank) || 0).toFixed(2)}</p>
                            </div>
                            <Button variant="destructive" size="sm" className="rounded-full" asChild>
                                <Link href="/signup">Sell Now</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 bg-card border-y">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 border-2 transition-all hover:border-primary group">
              <div className="p-4 bg-primary/5 rounded-2xl w-fit mb-6 group-hover:bg-primary/10">
                <ShieldCheck className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Military-Grade Security</h3>
              <p className="text-muted-foreground leading-relaxed">
                98% of all digital assets are held in offline multi-signature cold storage vaults for maximum protection.
              </p>
            </Card>
            <Card className="p-8 border-2 transition-all hover:border-primary group">
              <div className="p-4 bg-primary/5 rounded-2xl w-fit mb-6 group-hover:bg-primary/10">
                <Zap className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Lightning Transactions</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our automated clearing system ensures that 95% of orders are fulfilled in under 15 minutes.
              </p>
            </Card>
            <Card className="p-8 border-2 transition-all hover:border-primary group">
              <div className="p-4 bg-primary/5 rounded-2xl w-fit mb-6 group-hover:bg-primary/10">
                <CircleDollarSign className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Best Market Rates</h3>
              <p className="text-muted-foreground leading-relaxed">
                We monitor global exchanges 24/7 to provide the most competitive INR to USDT rates in the industry.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Institutional Traders Choose Us (New Trust Section) */}
      <section className="py-24 bg-primary/5">
        <div className="container mx-auto max-w-6xl px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-16">Unrivaled Platform Integrity</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12">
                {[
                    { title: "1:1 Reserves", icon: Verified, desc: "Every USDT is backed 1:1 by real-world assets in audited institutional accounts." },
                    { title: "Regulatory Compliance", icon: Scale, desc: "Adhering to the highest standards of international financial regulations and AML protocols." },
                    { title: "Deep Liquidity", icon: TrendingUp, desc: "Our liquidity pools ensure minimal slippage even on high-volume institutional trades." },
                    { title: "Priority Support", icon: ShieldAlert, desc: "Our elite trading desk provides 24/7 priority assistance for all account holders." }
                ].map((item, i) => (
                    <div key={i} className="space-y-4">
                        <div className="flex justify-center">
                            <div className="p-4 bg-white rounded-3xl shadow-sm border border-primary/10">
                                <item.icon className="h-10 w-10 text-primary" />
                            </div>
                        </div>
                        <h4 className="text-xl font-bold">{item.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed px-4">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Trust & Rates */}
      <section className="py-24 bg-secondary/20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight">Real-Time Global Market Rates</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Transparency is at our core. We offer a minimal spread and zero hidden fees, ensuring you get the most value out of every trade.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl border bg-card">
                  <CheckCircle2 className="text-primary h-6 w-6" />
                  <span className="font-bold">Verified local payment methods</span>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl border bg-card">
                  <CheckCircle2 className="text-primary h-6 w-6" />
                  <span className="font-bold">Institutional-grade liquidity pools</span>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl border bg-card">
                  <CheckCircle2 className="text-primary h-6 w-6" />
                  <span className="font-bold">Secure KYC/AML compliance protocols</span>
                </div>
              </div>
            </div>
            <div className="grid gap-6">
               <Card className="p-8 border-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp className="h-24 w-24" /></div>
                  <p className="text-sm font-bold text-primary uppercase tracking-widest mb-1">Live Buy Price</p>
                  <h3 className="text-5xl font-black">₹{(Number(settings.buyRateBank) || 0).toFixed(2)}</h3>
                  <p className="text-muted-foreground text-sm mt-4">Per 1.00 USDT Token</p>
               </Card>
               <Card className="p-8 border-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 rotate-180"><TrendingUp className="h-24 w-24" /></div>
                  <p className="text-sm font-bold text-destructive uppercase tracking-widest mb-1">Live Sell Price</p>
                  <h3 className="text-5xl font-black">₹{(Number(settings.sellRateBank) || 0).toFixed(2)}</h3>
                  <p className="text-muted-foreground text-sm mt-4">Per 1.00 USDT Token</p>
               </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Everything you need to know to get started.</p>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="border-2 rounded-2xl px-6">
              <AccordionTrigger className="text-lg font-bold hover:no-underline">Is TetherSwap Zone secure?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-lg pb-6 leading-relaxed">
                Absolutely. We utilize high-level encryption (SSL), two-factor authentication (2FA), and offline cold storage for 98% of user assets. Our security protocols are audited regularly by third-party cybersecurity firms.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-2 rounded-2xl px-6">
              <AccordionTrigger className="text-lg font-bold hover:no-underline">What are the transaction limits?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-lg pb-6 leading-relaxed">
                To maintain high liquidity and security, we have a minimum transaction limit of 100 USDT for all Buy, Sell, and Deposit orders. There is no set maximum limit, though large trades may require additional verification.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border-2 rounded-2xl px-6">
              <AccordionTrigger className="text-lg font-bold hover:no-underline">How long do withdrawals take?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-lg pb-6 leading-relaxed">
                Most withdrawal requests are processed within 15-60 minutes. Depending on the blockchain network traffic (BEP20, TRC20, or ERC20), it may take up to 2 hours for funds to reflect in your external wallet.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </div>
  );
}
