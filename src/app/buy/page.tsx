
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { BuyForm } from '@/components/trade/BuyForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TetherIcon } from '@/components/icons/TetherIcon';
import { Loader2, History, ShieldCheck, Zap } from 'lucide-react';
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
    <div className="container mx-auto max-w-5xl px-4 py-8 md:py-12 space-y-12">
      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3 space-y-8">
          <Card className="shadow-lg border-2">
            <CardHeader className="text-center md:text-left">
              <div className="flex items-center gap-4 mb-2">
                  <div className='p-3 bg-primary/10 rounded-full border-4 border-primary/20'>
                      <TetherIcon className='h-8 w-8 text-primary' />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">Buy Tether (USDT)</CardTitle>
                    <CardDescription>Instant purchase with institutional rates.</CardDescription>
                  </div>
              </div>
            </CardHeader>
            <CardContent>
              <BuyForm />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
            <Card className="bg-accent/5 border-accent/20">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-accent" /> Secure Platform
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-3">
                    <p className="text-muted-foreground">All transactions are secured with military-grade encryption and monitored by our 24/7 security team.</p>
                    <div className="flex items-center gap-2 font-bold text-accent">
                        <Zap className="h-4 w-4" /> 15-Min Fulfillment Goal
                    </div>
                </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <History className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Recent Buy History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Amount</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">No history.</TableCell>
                        </TableRow>
                      ) : (
                        sortedOrders.map(order => (
                          <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => order.status === 'pending_payment' && router.push(`/buy/payment/${order.id}`)}>
                            <TableCell className="text-[10px]">{format(new Date(order.createdAt), 'dd MMM')}</TableCell>
                            <TableCell className="font-semibold text-primary text-xs">{order.usdtAmount} USDT</TableCell>
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
      </div>
    </div>
  );
}
