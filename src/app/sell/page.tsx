'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from '@/firebase';
import { SellForm } from '@/components/trade/SellForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TetherIcon } from '@/components/icons/TetherIcon';
import { Loader2, History, Lock, TrendingDown, Hash, Calendar, Wallet, CreditCard, ExternalLink } from 'lucide-react';
import { collection, query, where, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function SellPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/sell');
    }
  }, [user, isUserLoading, router]);

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const sellOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'sellOrders'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);
  const { data: sellOrders, isLoading: ordersLoading } = useCollection(sellOrdersQuery);

  if (isUserLoading || profileLoading) {
    return (
        <div className="container mx-auto flex min-h-[50vh] items-center justify-center">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (!user) return null;

  const isOnHold = profile?.status === 'on_hold';
  const sortedOrders = sellOrders?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];

  const handleRowClick = (order: any) => {
    setSelectedOrder(order);
  };

  const navigateToOrderAction = () => {
    if (!selectedOrder) return;
    if (selectedOrder.status === 'payment_processing') {
        router.push(`/sell/confirmation/${selectedOrder.id}`);
    }
    setSelectedOrder(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'completed': return <Badge className="bg-green-500">Completed</Badge>;
        case 'payment_processing': return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">Processing</Badge>;
        case 'pending_deposit': return <Badge variant="outline">Awaiting Deposit</Badge>;
        case 'expired': return <Badge variant="destructive">Expired</Badge>;
        case 'failed': return <Badge variant="destructive">Rejected</Badge>;
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
    <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12 space-y-8">
      {isOnHold && (
        <Alert variant="destructive" className="border-2 border-destructive animate-pulse max-w-2xl mx-auto">
            <Lock className="h-5 w-5" />
            <AlertTitle className="font-bold">Trading Disabled</AlertTitle>
            <AlertDescription>Your account is currently on hold. You cannot perform new transactions at this time. Please contact support.</AlertDescription>
        </Alert>
      )}
      <Card className={`shadow-lg border-2 max-w-2xl mx-auto ${isOnHold ? 'opacity-60 pointer-events-none' : ''}`}>
        <CardHeader className="text-center">
             <div className='flex justify-center mb-4'>
                <div className='p-3 bg-primary/10 rounded-full border-4 border-primary/20'>
                    <TetherIcon className='h-8 w-8 text-primary' />
                </div>
            </div>
          <CardTitle className="text-2xl font-black uppercase">Sell Tether (USDT)</CardTitle>
          <CardDescription className="font-medium">Liquidate digital assets into local currency with zero slippage.</CardDescription>
        </CardHeader>
        <CardContent>
          <SellForm disabled={isOnHold} />
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <TrendingDown className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-lg font-black uppercase">Liquidation Log</CardTitle>
            <CardDescription className="text-xs font-medium">History of your USDT to INR settlements.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase">Date</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase">Volume</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase">Settlement</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground font-medium italic">
                      No liquidation history found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedOrders.map(order => (
                    <TableRow key={order.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => handleRowClick(order)}>
                      <TableCell className="text-[10px] font-medium">
                        {format(new Date(order.createdAt), 'dd MMM HH:mm')}
                      </TableCell>
                      <TableCell className="font-black text-destructive text-xs">
                        -{order.usdtAmount} USDT
                      </TableCell>
                      <TableCell className="font-bold text-xs">₹{order.inrAmount.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase text-destructive">
                    <TrendingDown className="h-5 w-5" /> Liquidation Audit
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Record Details for Order #{selectedOrder?.id?.slice(-6)}</DialogDescription>
            </DialogHeader>
            
            {selectedOrder && (
                <div className="space-y-6 py-4">
                    <div className="bg-destructive/5 p-4 rounded-xl space-y-1 border border-destructive/10">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-muted-foreground uppercase">Status</span>
                            {getStatusBadge(selectedOrder.status)}
                        </div>
                    </div>

                    <div className="space-y-0.5">
                        <DetailRow icon={Hash} label="Protocol ID" value={<span className="font-mono text-[10px]">{selectedOrder.id}</span>} />
                        <DetailRow icon={Calendar} label="Date" value={format(new Date(selectedOrder.createdAt), 'PPpp')} />
                        <DetailRow icon={Wallet} label="Liquidated Volume" value={<span className="text-destructive font-black">-{selectedOrder.usdtAmount} USDT</span>} />
                        <DetailRow icon={CreditCard} label="Net Settlement" value={<span className="text-primary font-black text-lg">₹{selectedOrder.inrAmount?.toLocaleString()}</span>} />
                        <DetailRow icon={ExternalLink} label="Receiving Mode" value={selectedOrder.paymentMode} />
                        
                        {selectedOrder.paymentMode === 'UPI' ? (
                            <DetailRow icon={CreditCard} label="UPI Reference" value={selectedOrder.upiId} />
                        ) : (
                            <DetailRow icon={CreditCard} label="Account Audit" value={`${selectedOrder.bankName} (...${selectedOrder.accountNumber?.slice(-4)})`} />
                        )}
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        {selectedOrder.status === 'payment_processing' && (
                            <Button className="w-full font-black uppercase tracking-widest h-12 shadow-xl shadow-destructive/20" variant="destructive" onClick={navigateToOrderAction}>
                                View Processing State
                            </Button>
                        )}
                        <Button variant="outline" className="w-full font-bold uppercase tracking-widest h-12" onClick={() => setSelectedOrder(null)}>
                            Close Record
                        </Button>
                    </div>
                </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
