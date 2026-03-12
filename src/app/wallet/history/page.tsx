
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Loader2, History, ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function WalletHistoryPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/wallet/history');
    }
  }, [user, isUserLoading, router]);

  const depositsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'deposits'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const withdrawalsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'withdrawals'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: deposits, isLoading: depositsLoading } = useCollection(depositsQuery);
  const { data: withdrawals, isLoading: withdrawalsLoading } = useCollection(withdrawalsQuery);

  if (isUserLoading || depositsLoading || withdrawalsLoading) {
    return (
        <div className="container mx-auto flex min-h-[50vh] items-center justify-center">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  const sortedDeposits = deposits?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];
  const sortedWithdrawals = withdrawals?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'completed': return <Badge className="bg-green-500">Completed</Badge>;
        case 'waiting_confirmation': return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">Processing</Badge>;
        case 'pending_hash': return <Badge variant="outline">Unpaid</Badge>;
        case 'expired': return <Badge variant="destructive">Expired</Badge>;
        case 'pending': return <Badge variant="secondary">Pending</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary/10 rounded-lg">
            <History className="h-6 w-6 text-primary" />
        </div>
        <div>
            <h1 className="text-2xl font-bold">Wallet History</h1>
            <p className="text-muted-foreground text-sm">Track your recent wallet activity.</p>
        </div>
      </div>

      <Tabs defaultValue="deposits">
        <TabsList className="mb-6">
            <TabsTrigger value="deposits">Deposits</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
        </TabsList>

        <TabsContent value="deposits">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Recent Deposits</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Network</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedDeposits.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                            No deposit history found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedDeposits.map(dep => (
                                        <TableRow key={dep.id} className="cursor-pointer hover:bg-muted/50" onClick={() => dep.status === 'pending_hash' && router.push('/wallet/deposit')}>
                                            <TableCell className="text-xs">
                                                {format(new Date(dep.createdAt), 'PPp')}
                                            </TableCell>
                                            <TableCell className="font-semibold text-green-600">
                                                +{dep.amount} USDT
                                            </TableCell>
                                            <TableCell>{dep.network}</TableCell>
                                            <TableCell>{getStatusBadge(dep.status)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
             <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Recent Withdrawals</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Network</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedWithdrawals.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                            No withdrawal history found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedWithdrawals.map(wd => (
                                        <TableRow key={wd.id}>
                                            <TableCell className="text-xs">
                                                {format(new Date(wd.createdAt), 'PPp')}
                                            </TableCell>
                                            <TableCell className="font-semibold text-red-600">
                                                -{wd.amount} USDT
                                            </TableCell>
                                            <TableCell>{wd.network}</TableCell>
                                            <TableCell>{getStatusBadge(wd.status)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
