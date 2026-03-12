
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  MessageCircle, 
  Loader2, 
  Wallet, 
  TrendingUp, 
  CircleDollarSign, 
  History, 
  Lock, 
  Globe, 
  CheckCircle2 
} from 'lucide-react';
import { TetherIcon } from '@/components/icons/TetherIcon';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';

type UserProfile = {
  balance?: number;
}

type Settings = {
  buyBannerUrl?: string;
  sellBannerUrl?: string;
  buyRate?: number;
  sellRate?: number;
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

  // If user is logged in, show a dashboard-style trading view
  if (user) {
    return (
        <div className="container mx-auto max-w-6xl px-4 py-8 md:py-16 animate-in fade-in duration-1000">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                <div className="space-y-2">
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                        Trading Hub
                    </h1>
                    <p className="text-muted-foreground md:text-xl">
                        Welcome back, <span className="text-foreground font-semibold">{user.email?.split('@')[0]}</span>. Your secure portal is ready.
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
                        className={`h-28 flex flex-col items-center justify-center gap-3 transition-all hover:scale-105 hover:shadow-lg border-2 animate-in slide-in-from-bottom-4 duration-500 fill-mode-both`}
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
                    <div className="absolute -top-12 -right-12 p-12 opacity-5 group-hover:opacity-10 transition-all duration-500 rotate-12 group-hover:rotate-0">
                        <TrendingUp className="w-48 h-48" />
                    </div>
                    <CardHeader className="p-8">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2 bg-primary/10 rounded-lg">
                                <CircleDollarSign className="h-6 w-6 text-primary" />
                             </div>
                             <CardTitle className="text-2xl font-bold">Buy USDT</CardTitle>
                        </div>
                        <CardDescription>Instant purchase with verified local payment methods.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
                        <div className="bg-secondary/50 border p-6 rounded-2xl flex justify-between items-center group-hover:bg-secondary transition-colors">
                            <div>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Market Rate</p>
                                <p className="text-3xl font-black">₹{(Number(settings.buyRate) || 0).toFixed(2)} <span className="text-sm font-medium text-muted-foreground">/ USDT</span></p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-green-500" />
                            </div>
                        </div>
                        <Button className="w-full h-14 text-lg font-bold rounded-xl" asChild>
                            <Link href="/buy">
                                Buy Now <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden group hover:border-destructive transition-all duration-300 border-2 shadow-sm hover:shadow-xl">
                     <div className="absolute -top-12 -right-12 p-12 opacity-5 group-hover:opacity-10 transition-all duration-500 rotate-12 group-hover:rotate-0">
                        <Wallet className="w-48 h-48" />
                    </div>
                    <CardHeader className="p-8">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2 bg-destructive/10 rounded-lg">
                                <TetherIcon className="h-6 w-6" />
                             </div>
                             <CardTitle className="text-2xl font-bold">Sell USDT</CardTitle>
                        </div>
                        <CardDescription>Convert your crypto to local currency with zero hassle.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
                        <div className="bg-secondary/50 border p-6 rounded-2xl flex justify-between items-center group-hover:bg-secondary transition-colors">
                            <div>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Market Rate</p>
                                <p className="text-3xl font-black">₹{(Number(settings.sellRate) || 0).toFixed(2)} <span className="text-sm font-medium text-muted-foreground">/ USDT</span></p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-destructive rotate-180" />
                            </div>
                        </div>
                        <Button variant="destructive" className="w-full h-14 text-lg font-bold rounded-xl" asChild>
                            <Link href="/sell">
                                Sell Now <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {[
                    { title: 'Secure Vault', desc: 'Industry-standard encryption for your funds.', icon: Lock },
                    { title: 'Global Access', desc: 'Trade 24/7 from anywhere in the world.', icon: Globe },
                    { title: 'Verified Only', desc: 'Secure verification for all transactions.', icon: CheckCircle2 },
                ].map((feature) => (
                    <div key={feature.title} className="p-6 rounded-2xl border bg-card hover:bg-accent/5 transition-colors">
                        <feature.icon className="h-8 w-8 text-primary mb-4" />
                        <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
  }

  // Marketing Home for Guests
  return (
    <>
      <div className="relative overflow-hidden">
        {/* Animated Background Element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10 overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[80%] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[80%] rounded-full bg-accent/5 blur-[120px] animate-pulse" />
        </div>

        <div className="container mx-auto max-w-6xl px-4 py-20 md:py-32">
            <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-top-10 duration-1000">
                <div className="relative">
                    <TetherIcon className="w-20 h-20 md:w-32 md:h-32 text-primary drop-shadow-[0_0_30px_rgba(38,161,123,0.3)] animate-bounce" />
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 -z-10" />
                </div>
                
                <div className="space-y-4">
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none">
                        TetherSwap <span className="text-primary italic">Zone</span>
                    </h1>
                    <p className="text-muted-foreground text-lg md:text-2xl max-w-3xl mx-auto font-medium">
                        Secure. Fast. Trusted. The ultimate destination for seamless Tether (USDT) transactions.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto pt-4">
                    <Button size="lg" className="h-16 px-10 text-xl font-bold rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105" asChild>
                        <Link href="/signup">Start Trading Now</Link>
                    </Button>
                    <Button variant="outline" size="lg" className="h-16 px-10 text-xl font-bold rounded-2xl border-2 hover:bg-secondary transition-all" asChild>
                        <Link href="/contact">Contact Support</Link>
                    </Button>
                </div>

                <div className="flex items-center gap-8 pt-12 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" />
                        <span className="text-sm font-bold uppercase tracking-widest">ISO Certified</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        <span className="text-sm font-bold uppercase tracking-widest">PCI Compliant</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        <span className="text-sm font-bold uppercase tracking-widest">Global Support</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <section className="bg-card py-24 md:py-32 border-y">
        <div className="container mx-auto max-w-6xl px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
                        <Zap className="h-3 w-3" /> Lightning Fast
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tight">
                        Experience Real-Time Trading.
                    </h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        No more waiting days for bank transfers. Our system is optimized for speed, ensuring your USDT or local currency is delivered in record time.
                    </p>
                    <ul className="space-y-4">
                        {[
                            'Instant USDT delivery upon payment confirmation.',
                            'Highest liquidity and best market rates.',
                            'Dedicated account managers for large volume trades.'
                        ].map((item) => (
                            <li key={item} className="flex items-center gap-3 font-semibold">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Card className="aspect-square flex flex-col items-center justify-center p-8 text-center border-2 hover:border-primary transition-colors">
                        <TrendingUp className="h-12 w-12 text-primary mb-4" />
                        <h3 className="text-3xl font-black">₹{(Number(settings.buyRate) || 0).toFixed(2)}</h3>
                        <p className="text-sm font-bold text-muted-foreground uppercase mt-1">Buy Rate</p>
                    </Card>
                    <Card className="aspect-square flex flex-col items-center justify-center p-8 text-center border-2 hover:border-destructive transition-colors mt-8">
                        <TrendingUp className="h-12 w-12 text-destructive rotate-180 mb-4" />
                        <h3 className="text-3xl font-black">₹{(Number(settings.sellRate) || 0).toFixed(2)}</h3>
                        <p className="text-sm font-bold text-muted-foreground uppercase mt-1">Sell Rate</p>
                    </Card>
                </div>
            </div>
        </div>
      </section>

      <section className="py-24 md:py-32 bg-secondary/30">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">Security You Can Trust.</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We employ military-grade security to protect your assets and privacy.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Cold Storage',
                desc: '98% of digital assets are stored in offline multi-signature vaults.',
                icon: Lock,
              },
              {
                title: 'Real-time Monitoring',
                desc: 'Our automated systems monitor for suspicious activity 24/7.',
                icon: ShieldCheck,
              },
              {
                title: 'Privacy Guaranteed',
                desc: 'We never share your personal data with third parties.',
                icon: ShieldCheck,
              },
            ].map((feature) => (
              <Card key={feature.title} className="p-8 border-2 hover:border-primary transition-all group">
                <div className="p-4 bg-primary/10 rounded-2xl w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-card">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">FAQs</h2>
            <p className="text-muted-foreground">Everything you need to know about the platform.</p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-2 rounded-2xl px-6 mb-4">
              <AccordionTrigger className="text-lg font-bold hover:no-underline">What is TetherSwap Zone?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-lg pb-6">
                TetherSwap Zone is a professional trading platform designed to facilitate secure and rapid exchanges between Tether (USDT) and local currencies. We prioritize security, liquidity, and speed.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-2 rounded-2xl px-6 mb-4">
              <AccordionTrigger className="text-lg font-bold hover:no-underline">Is my balance safe?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-lg pb-6">
                Yes. We use industry-leading encryption and secure wallet protocols. All user funds are segregated and protected by advanced security measures.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border-2 rounded-2xl px-6">
              <AccordionTrigger className="text-lg font-bold hover:no-underline">How fast are withdrawals?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-lg pb-6">
                Most withdrawal requests are processed within 15-60 minutes, depending on blockchain network traffic and internal verification steps.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <section className="py-24">
          <div className="container mx-auto max-w-5xl px-4">
              <div className="bg-primary rounded-[40px] p-12 md:p-24 text-center text-primary-foreground space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
                      <TetherIcon className="w-64 h-64" />
                  </div>
                  <h2 className="text-4xl md:text-7xl font-black tracking-tight leading-none relative z-10">
                      Ready to start trading?
                  </h2>
                  <p className="text-xl md:text-2xl opacity-90 relative z-10">
                      Join thousands of traders worldwide and experience the future of USDT exchange.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 relative z-10">
                      <Button size="lg" variant="secondary" className="h-16 px-12 text-xl font-bold rounded-2xl hover:scale-105 transition-transform" asChild>
                          <Link href="/signup">Create Free Account</Link>
                      </Button>
                  </div>
              </div>
          </div>
      </section>
    </>
  );
}
