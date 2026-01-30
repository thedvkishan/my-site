'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck, Zap, MessageCircle, Loader2 } from 'lucide-react';
import { TetherIcon } from '@/components/icons/TetherIcon';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

type Settings = {
  buyBannerUrl?: string;
  sellBannerUrl?: string;
}

export default function Home() {
  const firestore = useFirestore();
  
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'appSettings');
  }, [firestore]);

  const { data: settings, isLoading } = useDoc<Settings>(settingsRef);

  if (isLoading || !settings) {
    return (
        <div className="container mx-auto flex min-h-[50vh] items-center justify-center">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <>
      {/* Hero Section */}
      <div className="container mx-auto max-w-6xl px-4 py-12 md:py-20">
        <div className="flex flex-col items-center mb-12 text-center">
          <TetherIcon className="w-20 h-20 mb-6 text-primary" />
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-foreground">
            TetherSwap Zone
          </h1>
          <p className="text-muted-foreground text-lg mt-4 max-w-3xl">
            Welcome to the premier destination for seamless and secure Tether (USDT) transactions. Whether you're looking to buy USDT to enter the crypto market or sell to realize your gains, we provide a fast, reliable, and user-friendly platform tailored for you.
          </p>
        </div>

        {/* Buy/Sell Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          <Link href="/buy">
            <Card className="h-full flex flex-col group hover:border-primary hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold">Buy Tether (USDT)</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                <div className="relative aspect-video mb-4 rounded-md overflow-hidden">
                  <Image 
                    src={settings.buyBannerUrl} 
                    alt="Buy Tether" 
                    fill
                    style={{ objectFit: 'cover' }}
                    data-ai-hint="crypto buy"
                    className="group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-muted-foreground mb-4">
                  Purchase USDT effortlessly with your preferred local payment methods. Our streamlined process ensures your digital assets are delivered to your wallet promptly and securely.
                </p>
                <Button className="w-full mt-auto">
                  Buy Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/sell">
            <Card className="h-full flex flex-col group hover:border-destructive hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold">Sell Tether (USDT)</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                 <div className="relative aspect-video mb-4 rounded-md overflow-hidden">
                  <Image 
                    src={settings.sellBannerUrl} 
                    alt="Sell Tether"
                    fill
                    style={{ objectFit: 'cover' }}
                    data-ai-hint="crypto sell"
                    className="group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-muted-foreground mb-4">
                  Convert your USDT to INR and receive funds directly into your bank account or UPI. Experience a fast, transparent, and hassle-free selling process with competitive rates.
                </p>
                <Button className="w-full mt-auto" variant="destructive">
                  Sell Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Why Trust Us Section */}
      <section className="bg-secondary py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Why Choose TetherSwap Zone?</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              We are committed to providing a superior trading experience. Our platform is built on three core principles: Security, Speed, and Support.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <div className="p-4 bg-primary/10 rounded-full mb-4 border-4 border-primary/20">
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Rock-Solid Security</h3>
              <p className="text-muted-foreground">
                Your security is our highest priority. We employ state-of-the-art security measures, including end-to-end encryption and secure wallet management protocols, to protect your assets and personal information. Trade with confidence knowing your funds are safe.
              </p>
            </div>
            <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <div className="p-4 bg-primary/10 rounded-full mb-4 border-4 border-primary/20">
                <Zap className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Lightning-Fast Transactions</h3>
              <p className="text-muted-foreground">
                Time is money, especially in the crypto world. Our optimized transaction processing system ensures your trades are executed and settled in record time. Buy or sell USDT within minutes, not hours.
              </p>
            </div>
            <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <div className="p-4 bg-primary/10 rounded-full mb-4 border-4 border-primary/20">
                <MessageCircle className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Dedicated 24/7 Support</h3>
              <p className="text-muted-foreground">
                Questions or issues? Our dedicated support team is available around the clock to assist you. Whether you need help with a transaction or have a question about our platform, we're here for you via our contact page.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Frequently Asked Questions</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Have questions? We’ve got answers. Here are some of the most common queries we receive from our users.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg font-medium">What is Tether (USDT)?</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                Tether (USDT) is a cryptocurrency known as a "stablecoin." It is designed to maintain a stable value by being pegged to a reserve of real-world assets, primarily the U.S. Dollar. This means that 1 USDT aims to be worth approximately $1 USD. It combines the benefits of a digital currency (fast, borderless transactions) with the stability of a traditional fiat currency, making it a popular choice for traders to move in and out of more volatile cryptocurrencies like Bitcoin or Ethereum.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg font-medium">How long do transactions take to complete?</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                Transaction times can vary based on the chosen network and current congestion.
                <br /><br />
                <strong>Buying USDT:</strong> After you complete your payment via UPI, IMPS, or other methods, our team verifies the payment. Once verified, the USDT is dispatched to your wallet. This process typically takes between 15 minutes to 3 hours.
                <br /><br />
                <strong>Selling USDT:</strong> After you deposit USDT to our designated address, we wait for blockchain confirmation. The number of confirmations required depends on the network (BEP20, TRC20, ERC20). Once confirmed, we process the INR payment to your bank account or UPI, which is usually completed within a few hours.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg font-medium">What are the fees for buying and selling?</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                We believe in transparency. The rate you see is the rate you get. Our fees are already incorporated into the buy and sell rates displayed on the forms. We do not charge any additional hidden fees for our service. However, please be aware that when you send USDT (during a sell transaction), you will be responsible for paying the blockchain network's transaction fee (gas fee), which is independent of our platform.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-lg font-medium">Is my personal and financial information secure?</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                Absolutely. We use industry-standard security protocols to protect all user data. All sensitive information is encrypted both in transit and at rest. We do not store your full payment details on our servers. Your privacy and security are paramount, and we have implemented a robust infrastructure to ensure your data remains confidential and protected against unauthorized access.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger className="text-lg font-medium">What payment methods do you accept for buying USDT?</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                We cater primarily to the Indian market and support a wide range of popular local payment methods. You can buy USDT using:
                <br />- UPI (Unified Payments Interface)
                <br />- IMPS (Immediate Payment Service)
                <br />- NEFT (National Electronic Funds Transfer)
                <br />- RTGS (Real-Time Gross Settlement)
                <br />- Cash Deposit (at select bank branches)
                <br /><br />
                When you sell USDT, you can receive payment via UPI, IMPS, NEFT, or RTGS.
              </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-6">
              <AccordionTrigger className="text-lg font-medium">Why do I need to provide my email address?</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                Your email address serves as the primary channel for communication regarding your transactions. We send order confirmations, payment instructions, and status updates directly to your email to keep you informed every step of the way. This ensures you have a record of your transaction and can be notified of any important updates or issues that may require your attention. We respect your privacy and will not use your email for marketing purposes without your consent.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </>
  );
}
