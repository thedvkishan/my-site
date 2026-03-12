
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { BuyForm } from '@/components/trade/BuyForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TetherIcon } from '@/components/icons/TetherIcon';
import { Loader2, History } from 'lucide-react';
import { collection, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function BuyPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/buy');
    }
  }, [user, isUserLoading, router]);

  const buyOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'buyOrders'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: buyOrders, isLoading: ordersLoading } = useCollection(buyOrdersQuery);

  if (isUserLoading) {
    return (
        <div className="container mx-auto flex min-h-[50vh] items-center justify-center">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (!user) return null;

  const sortedOrders = buyOrders?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'completed': return <Badge className="bg-green-500">Completed</Badge>;
        case 'payment_processing': return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">Processing</Badge>;
        case 'pending_payment': return <Badge variant="outline">Unpaid</Badge>;
        case 'expired': return <Badge variant="destructive">Expired</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12 space-y-8">
      <Card className="shadow-lg border-2 max-w-2xl mx-auto">
        <CardHeader className="text-center">
            <div className='flex justify-center mb-4'>
                <div className='p-3 bg-primary/10 rounded-full border-4 border-primary/20'>
                    <TetherIcon className='h-8 w-8 text-primary' />
                </div>
            </div>
          <CardTitle className="text-2xl font-bold">Buy Tether (USDT)</CardTitle>
          <CardDescription>Order USDT directly to your wallet balance.</CardDescription>
        </CardHeader>
        <CardContent>
          <BuyForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <History className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-lg">Recent Buy Orders</CardTitle>
            <CardDescription>Your transaction history for buying USDT.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>INR</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      No buy history found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedOrders.map(order => (
                    <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => order.status === 'pending_payment' && router.push(`/buy/payment/${order.id}`)}>
                      <TableCell className="text-xs">
                        {format(new Date(order.createdAt), 'PPp')}
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        {order.usdtAmount} USDT
                      </TableCell>
                      <TableCell>₹{order.inrAmount.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
