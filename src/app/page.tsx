import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { MOCK_BUY_BANNER_URL, MOCK_SELL_BANNER_URL } from '@/lib/constants';
import { TetherIcon } from '@/components/icons/TetherIcon';

export default function Home() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
      <div className="flex flex-col items-center mb-12">
        <TetherIcon className="w-16 h-16 mb-4" />
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-center">
          TetherSwap Zone
        </h1>
        <p className="text-muted-foreground text-center mt-4 max-w-2xl">
          The fastest and most secure way to buy and sell Tether (USDT). Choose your transaction type to get started.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Link href="/buy">
          <Card className="h-full flex flex-col group hover:border-primary transition-all">
            <CardHeader>
              <CardTitle className="text-2xl">Buy Tether (USDT)</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
              <div className="relative aspect-video mb-4 rounded-md overflow-hidden">
                <Image 
                  src={MOCK_BUY_BANNER_URL} 
                  alt="Buy Tether" 
                  fill
                  style={{ objectFit: 'cover' }}
                  data-ai-hint="crypto buy"
                  className="group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="text-muted-foreground mb-4">
                Purchase USDT quickly with your preferred payment method. Secure and reliable transactions.
              </p>
              <Button className="w-full mt-auto">
                Buy Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/sell">
          <Card className="h-full flex flex-col group hover:border-primary transition-all">
            <CardHeader>
              <CardTitle className="text-2xl">Sell Tether (USDT)</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
               <div className="relative aspect-video mb-4 rounded-md overflow-hidden">
                <Image 
                  src={MOCK_SELL_BANNER_URL} 
                  alt="Sell Tether"
                  fill
                  style={{ objectFit: 'cover' }}
                  data-ai-hint="crypto sell"
                  className="group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="text-muted-foreground mb-4">
                Sell your USDT and receive funds directly to your bank account or UPI. Fast and easy process.
              </p>
              <Button className="w-full mt-auto">
                Sell Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
