'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from '@/firebase';
import { BuyForm } from '@/components/trade/BuyForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TetherIcon } from '@/components/icons/TetherIcon';
import { Loader2, History, ShieldCheck, Zap, Lock, Hash, Calendar, Wallet, CreditCard } from 'lucide-react';
import { collection, query, where, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function BuyPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/buy');
    }
  }, [user, isUserLoading, router]);

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const buyOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'buyOrders'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);
  const { data: buyOrders, isLoading: ordersLoading } = useCollection(buyOrdersQuery);

  if (isUserLoading || profileLoading) {
    return (
        <div className="container mx-auto flex min-h-[50vh] items-center justify-center">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (!user) return null;

  const isOnHold = profile?.status === 'on_hold';
  const sortedOrders = buyOrders?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];

  const handleRowClick = (order: any) => {
    setSelectedOrder(order);
  };

  const navigateToOrderAction = () => {
    if (!selectedOrder) return;
    if (selectedOrder.status === 'pending_payment') {
        router.push(`/buy/payment/${selectedOrder.id}`);
    } else if (selectedOrder.status === 'payment_processing') {
        router.push(`/buy/confirmation/${selectedOrder.id}`);
    }
    setSelectedOrder(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'completed': return <Badge className="bg-green-500">Completed</Badge>;
        case 'payment_processing': return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">Processing</Badge>;
        case 'pending_payment': return <Badge variant="outline">Unpaid</Badge>;
        case 'expired': return <Badge variant="destructive">Expired</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const DetailRow = ({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon: any }) => (
    <div className="flex items-center justify-between py-3 border-b last:border-0 border-dashed">
        <div className="flex items-center gap-2 text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </div>
        <div className="text-sm font-black">{value}</div>
    </div>
  );

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 md:py-12 space-y-12">
      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3 space-y-8">
          {isOnHold && (
            <Alert variant="destructive" className="border-2 border-destructive animate-pulse">
                <Lock className="h-5 w-5" />
                <AlertTitle className="font-bold">Trading Disabled</AlertTitle>
                <AlertDescription>Your account is currently on hold. You cannot perform new transactions at this time. Please contact support.</AlertDescription>
            </Alert>
          )}
          <Card className={`shadow-lg border-2 ${isOnHold ? 'opacity-60 pointer-events-none' : ''}`}>
            <CardHeader className="text-center md:text-left">
              <div className="flex items-center gap-4 mb-2">
                  <div className='p-3 bg-primary/10 rounded-full border-4 border-primary/20'>
                      <TetherIcon className='h-8 w-8 text-primary' />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">Buy Tether (USDT)</CardTitle>
                    <CardDescription>Instant purchase with professional rates.</CardDescription>
                  </div>
              </div>
            </CardHeader>
            <CardContent>
              <BuyForm disabled={isOnHold} />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
            <Card className="bg-accent/5 border-accent/20">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-accent" /> Professional Platform
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-3">
                    <p className="text-muted-foreground font-medium">All transactions are processed through secure settlement protocols and monitored for reliability.</p>
                    <div className="flex items-center gap-2 font-black text-accent uppercase text-[10px] tracking-wider">
                        <Zap className="h-4 w-4" /> Secure Settlement Goal
                    </div>
                </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <History className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg font-black uppercase">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="text-[10px] font-bold uppercase">Date</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Volume</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-12 text-muted-foreground font-medium italic">No recent history.</TableCell>
                        </TableRow>
                      ) : (
                        sortedOrders.map(order => (
                          <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleRowClick(order)}>
                            <TableCell className="text-[10px] font-medium">{format(new Date(order.createdAt), 'dd MMM HH:mm')}</TableCell>
                            <TableCell className="font-black text-primary text-xs">{order.usdtAmount} USDT</TableCell>
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

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase text-primary">
                    <Hash className="h-5 w-5" /> Buy Order Details
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Audit Information for Order #{selectedOrder?.id?.slice(-6)}</DialogDescription>
            </DialogHeader>
            
            {selectedOrder && (
                <div className="space-y-6 py-4">
                    <div className="bg-primary/5 p-4 rounded-xl space-y-1 border border-primary/10">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-muted-foreground uppercase">Order Status</span>
                            {getStatusBadge(selectedOrder.status)}
                        </div>
                    </div>

                    <div className="space-y-0.5">
                        <DetailRow icon={Hash} label="Protocol ID" value={<span className="font-mono text-[10px]">{selectedOrder.id}</span>} />
                        <DetailRow icon={Calendar} label="Created At" value={format(new Date(selectedOrder.createdAt), 'PPpp')} />
                        <DetailRow icon={Wallet} label="Buy Volume" value={<span className="text-green-600 font-black">+{selectedOrder.usdtAmount} USDT</span>} />
                        <DetailRow icon={CreditCard} label="Settlement" value={<span className="text-primary font-black">₹{selectedOrder.inrAmount?.toLocaleString()}</span>} />
                        <DetailRow icon={Zap} label="Clearing Method" value={selectedOrder.paymentMode} />
                        <DetailRow icon={Lock} label="Target Network" value={selectedOrder.network} />
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        {(selectedOrder.status === 'pending_payment' || selectedOrder.status === 'payment_processing') && (
                            <Button className="w-full font-black uppercase tracking-widest h-12 shadow-xl shadow-primary/20" onClick={navigateToOrderAction}>
                                {selectedOrder.status === 'pending_payment' ? 'Complete Payment' : 'View Settlement Progress'}
                            </Button>
                        )}
                        <Button variant="outline" className="w-full font-bold uppercase tracking-widest h-12" onClick={() => setSelectedOrder(null)}>
                            Close Audit
                        </Button>
                    </div>
                </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
