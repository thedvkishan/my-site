import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { BuyForm } from './BuyForm';
import { SellForm } from './SellForm';
import { TetherIcon } from '../icons/TetherIcon';

export function TradeTerminal() {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-4 mb-6">
        <TetherIcon className="w-12 h-12" />
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-center">
          TetherSwap Zone
        </h1>
      </div>
      <p className="text-muted-foreground text-center mb-8 max-w-2xl">
        The fastest and most secure way to buy and sell Tether (USDT). Get started by choosing your transaction type below.
      </p>
      <Tabs defaultValue="buy" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buy">Buy Tether (USDT)</TabsTrigger>
          <TabsTrigger value="sell">Sell Tether (USDT)</TabsTrigger>
        </TabsList>
        <Card className="mt-4">
          <CardContent className="p-4 sm:p-6">
            <TabsContent value="buy" className="mt-0">
              <BuyForm />
            </TabsContent>
            <TabsContent value="sell" className="mt-0">
              <SellForm />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
