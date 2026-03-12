'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck, Zap, MessageCircle, Loader2, Wallet, TrendingUp, CircleDollarSign, History } from 'lucide-react';
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
        <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-12">
                <div className="w-full">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome back!</h1>
                    <p className="text-muted-foreground mt-1 text-sm md:text-lg">Your secure portal for USDT trading is ready.</p>
                </div>
                <Card className="bg-primary/5 border-primary/20 w-full md:w-auto shrink-0">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Wallet className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Wallet Balance</p>
                            <p className="text-xl md:text-2xl font-bold">{(profile?.balance || 0).toLocaleString()} USDT</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12">
                <Button variant="outline" className="h-20 md:h-24 flex flex-col gap-1 md:gap-2 text-xs md:text-sm" asChild>
                    <Link href="/wallet/deposit">
                        <CircleDollarSign className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                        Deposit
                    </Link>
                </Button>
                <Button variant="outline" className="h-20 md:h-24 flex flex-col gap-1 md:gap-2 text-xs md:text-sm" asChild>
                    <Link href="/wallet/withdrawal">
                        <Wallet className="h-5 w-5 md:h-6 md:w-6 text-accent" />
                        Withdraw
                    </Link>
                </Button>
                <Button variant="outline" className="h-20 md:h-24 flex flex-col gap-1 md:gap-2 text-xs md:text-sm" asChild>
                    <Link href="/buy">
                        <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
                        Buy USDT
                    </Link>
                </Button>
                <Button variant="outline" className="h-20 md:h-24 flex flex-col gap-1 md:gap-2 text-xs md:text-sm" asChild>
                    <Link href="/wallet/history">
                        <History className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
                        History
                    </Link>
                </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-12">
                <Card className="relative overflow-hidden group hover:border-primary transition-colors border-2">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                        <TrendingUp className="w-24 h-24 md:w-32 md:h-32" />
                    </div>
                    <CardHeader className="p-5 md:p-6">
                        <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                            <CircleDollarSign className="h-6 w-6 text-primary" />
                            Buy USDT
                        </CardTitle>
                        <CardDescription>Instant purchase with local payment.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 md:p-6 pt-0 space-y-4 md:space-y-6">
                        <div className="bg-secondary p-4 rounded-lg">
                            <p className="text-xs text-muted-foreground">Current Buy Rate</p>
                            <p className="text-lg md:text-2xl font-bold">1 USDT ≈ ₹{settings.buyRate?.toFixed(2)}</p>
                        </div>
                        <Button className="w-full" asChild>
                            <Link href="/buy">
                                Buy Now <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden group hover:border-destructive transition-colors border-2">
                     <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                        <Wallet className="w-24 h-24 md:w-32 md:h-32" />
                    </div>
                    <CardHeader className="p-5 md:p-6">
                        <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                            <TetherIcon className="h-6 w-6" />
                            Sell USDT
                        </CardTitle>
                        <CardDescription>Convert USDT to local currency.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 md:p-6 pt-0 space-y-4 md:space-y-6">
                        <div className="bg-secondary p-4 rounded-lg">
                            <p className="text-xs text-muted-foreground">Current Sell Rate</p>
                            <p className="text-lg md:text-2xl font-bold">1 USDT ≈ ₹{settings.sellRate?.toFixed(2)}</p>
                        </div>
                        <Button variant="destructive" className="w-full" asChild>
                            <Link href="/sell">
                                Sell Now <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card className="mb-12 border-primary/20 bg-primary/5">
                <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-4 md:gap-6">
                    <div className="bg-primary/10 p-3 md:p-4 rounded-full">
                        <ShieldCheck className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                    </div>
                    <div className="text-center md:text-left">
                        <h3 className="text-lg md:text-xl font-bold">Security Tip</h3>
                        <p className="text-muted-foreground text-xs md:text-sm">Always double-check your wallet address before confirming a transaction. TetherSwap Zone will never ask for your private keys via email or chat.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  // Marketing Home for Guests
  return (
    <>
      <div className="container mx-auto max-w-6xl px-4 py-12 md:py-20">
        <div className="flex flex-col items-center mb-12 text-center">
          <TetherIcon className="w-16 h-16 md:w-20 md:h-20 mb-6 text-primary" />
          <h1 className="text-3xl md:text-6xl font-extrabold tracking-tighter text-foreground">
            TetherSwap Zone
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mt-4 max-w-3xl">
            Welcome to the premier destination for seamless and secure Tether (USDT) transactions. Join thousands of users trading USDT with the most trusted platform in the region.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
             <Button size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/signup">Get Started</Link>
             </Button>
             <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/contact">Learn More</Link>
             </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-20">
          <Link href="/buy">
            <Card className="h-full flex flex-col group hover:border-primary hover:shadow-lg transition-all duration-300 border-2">
              <CardHeader className="p-5 md:p-6">
                <CardTitle className="text-xl md:text-2xl font-semibold">Buy Tether (USDT)</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between p-5 md:p-6 pt-0">
                <div className="relative aspect-video mb-4 rounded-md overflow-hidden bg-muted">
                  <Image 
                    src={settings.buyBannerUrl || ''} 
                    alt="Buy Tether" 
                    fill
                    style={{ objectFit: 'cover' }}
                    data-ai-hint="crypto buy"
                    className="group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-muted-foreground mb-4 text-xs md:text-sm">
                  Purchase USDT effortlessly with your preferred local payment methods. Instant delivery guaranteed.
                </p>
                <Button className="w-full mt-auto">
                  Buy Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/sell">
            <Card className="h-full flex flex-col group hover:border-destructive hover:shadow-lg transition-all duration-300 border-2">
              <CardHeader className="p-5 md:p-6">
                <CardTitle className="text-xl md:text-2xl font-semibold">Sell Tether (USDT)</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between p-5 md:p-6 pt-0">
                 <div className="relative aspect-video mb-4 rounded-md overflow-hidden bg-muted">
                  <Image 
                    src={settings.sellBannerUrl || ''} 
                    alt="Sell Tether"
                    fill
                    style={{ objectFit: 'cover' }}
                    data-ai-hint="crypto sell"
                    className="group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-muted-foreground mb-4 text-xs md:text-sm">
                  Convert your USDT to local currency instantly. Best market rates and secure transfers.
                </p>
                <Button className="w-full mt-auto" variant="destructive">
                  Sell Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      <section className="bg-secondary py-12 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Why Choose TetherSwap Zone?</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-sm md:text-base">
              We are committed to providing a superior trading experience.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 text-center">
            <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 md:p-4 bg-primary/10 rounded-full mb-4 border-4 border-primary/20">
                <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">Rock-Solid Security</h3>
              <p className="text-muted-foreground text-xs md:text-sm">
                State-of-the-art security measures to protect your assets and personal information.
              </p>
            </div>
            <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 md:p-4 bg-primary/10 rounded-full mb-4 border-4 border-primary/20">
                <Zap className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">Lightning-Fast</h3>
              <p className="text-muted-foreground text-xs md:text-sm">
                Optimized transaction processing ensures your trades are settled in record time.
              </p>
            </div>
            <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 md:p-4 bg-primary/10 rounded-full mb-4 border-4 border-primary/20">
                <MessageCircle className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-muted-foreground text-xs md:text-sm">
                Our dedicated support team is available around the clock to assist you via our contact page.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Frequently Asked Questions</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-base md:text-lg font-medium">What is Tether (USDT)?</AccordionTrigger>
              <AccordionContent className="text-sm md:text-base text-muted-foreground">
                Tether (USDT) is a cryptocurrency known as a "stablecoin," designed to maintain a stable value pegged to the U.S. Dollar.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-base md:text-lg font-medium">How long do transactions take to complete?</AccordionTrigger>
              <AccordionContent className="text-sm md:text-base text-muted-foreground">
                Typically between 15 minutes to 3 hours depending on network congestion and payment verification.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </>
  );
}
