import { SellForm } from '@/components/trade/SellForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TetherIcon } from '@/components/icons/TetherIcon';

export default function SellPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 md:py-12">
      <Card>
        <CardHeader className="text-center">
             <div className='flex justify-center mb-4'>
                <div className='p-3 bg-primary/10 rounded-full border-4 border-primary/20'>
                    <TetherIcon className='h-8 w-8 text-primary' />
                </div>
            </div>
          <CardTitle>Sell Tether (USDT)</CardTitle>
          <CardDescription>Fill in your details to sell USDT and receive INR.</CardDescription>
        </CardHeader>
        <CardContent>
          <SellForm />
        </CardContent>
      </Card>
    </div>
  );
}
