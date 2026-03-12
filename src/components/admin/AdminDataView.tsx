'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, doc, updateDoc, increment } from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Eye } from "lucide-react";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

// Helper component to render details in a consistent way
const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="grid grid-cols-[160px_1fr] items-start gap-4 py-1">
        <span className="text-muted-foreground text-right text-xs md:text-sm">{label}</span>
        <div className="font-semibold break-words text-xs md:text-sm">{value}</div>
    </div>
);

export function AdminDataView() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const buyOrdersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'buyOrders'));
    }, [firestore]);

    const sellOrdersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'sellOrders'));
    }, [firestore]);
    
    const depositsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'deposits'));
    }, [firestore]);

    const withdrawalsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'withdrawals'));
    }, [firestore]);

    const contactMessagesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'contactMessages'));
    }, [firestore]);

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'));
    }, [firestore]);

    const { data: buyOrders, isLoading: buyOrdersLoading } = useCollection(buyOrdersQuery);
    const { data: sellOrders, isLoading: sellOrdersLoading } = useCollection(sellOrdersQuery);
    const { data: deposits, isLoading: depositsLoading } = useCollection(depositsQuery);
    const { data: withdrawals, isLoading: withdrawalsLoading } = useCollection(withdrawalsQuery);
    const { data: contactMessages, isLoading: messagesLoading } = useCollection(contactMessagesQuery);
    const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
    
    const isLoading = buyOrdersLoading || sellOrdersLoading || depositsLoading || withdrawalsLoading || messagesLoading || usersLoading;

    const handleStatusUpdate = async (type: 'buyOrders' | 'sellOrders' | 'deposits' | 'withdrawals', id: string, status: string, userId?: string, amount?: number) => {
        if (!firestore) return;
        setActionLoading(id);
        try {
            const orderRef = doc(firestore, type, id);
            await updateDoc(orderRef, { status });

            // If it's a deposit or a buy order being completed, increment user balance
            if ((type === 'deposits' || type === 'buyOrders') && status === 'completed' && userId && amount) {
                const userRef = doc(firestore, 'users', userId);
                await updateDoc(userRef, { balance: increment(amount) });
            }
            
            // If it's a withdrawal being completed, balance is already deducted at request time usually, 
            // but for simple logic we can handle failures here by refunding
            if (type === 'withdrawals' && status === 'failed' && userId && amount) {
                const userRef = doc(firestore, 'users', userId);
                await updateDoc(userRef, { balance: increment(amount) });
            }

            toast({ title: 'Status Updated', description: `Transaction marked as ${status}.` });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update transaction status.' });
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return <Badge className="bg-green-500">Completed</Badge>;
            case 'payment_processing': return <Badge className="bg-blue-500">Processing</Badge>;
            case 'waiting_confirmation': return <Badge className="bg-yellow-500 text-yellow-950">Verifying</Badge>;
            case 'pending_payment':
            case 'pending_deposit':
            case 'pending_hash': return <Badge variant="outline">Pending</Badge>;
            case 'expired':
            case 'failed': return <Badge variant="destructive">{status}</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader className="p-4 md:p-6">
                <CardTitle>User Submitted Data</CardTitle>
                <CardDescription>Review and manage all site transactions.</CardDescription>
            </CardHeader>
            <CardContent className="p-2 md:p-6">
                <Tabs defaultValue="buyOrders" className="w-full">
                    <ScrollArea className="w-full whitespace-nowrap mb-4">
                        <TabsList className="inline-flex w-auto p-1">
                            <TabsTrigger value="buyOrders">Buy</TabsTrigger>
                            <TabsTrigger value="sellOrders">Sell</TabsTrigger>
                            <TabsTrigger value="deposits">Deposits</TabsTrigger>
                            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
                            <TabsTrigger value="contact">Messages</TabsTrigger>
                            <TabsTrigger value="users">Users</TabsTrigger>
                        </TabsList>
                    </ScrollArea>
                    
                    {isLoading && <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}
                    
                    <TabsContent value="buyOrders">
                        <ScrollArea className="h-[60vh] border rounded-md">
                            <Table>
                                <TableHeader><TableRow><TableHead className="min-w-[120px]">Date</TableHead><TableHead>Status</TableHead><TableHead>USDT</TableHead><TableHead className="hidden md:table-cell">INR</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {buyOrders?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell className="text-[10px] md:text-xs">{format(new Date(order.createdAt), 'PPp')}</TableCell>
                                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                                            <TableCell className="font-medium">{order.usdtAmount}</TableCell>
                                            <TableCell className="hidden md:table-cell">₹{order.inrAmount}</TableCell>
                                            <TableCell>
                                                <Dialog>
                                                    <DialogTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button></DialogTrigger>
                                                    <DialogContent className="max-w-2xl w-[95vw] rounded-lg">
                                                        <DialogHeader><DialogTitle>Buy Order Details</DialogTitle><DialogDescription>ID: {order.id}</DialogDescription></DialogHeader>
                                                        <div className="space-y-2 py-4">
                                                            <DetailRow label="User ID" value={order.userId} />
                                                            <DetailRow label="Status" value={getStatusBadge(order.status)} />
                                                            <DetailRow label="USDT Amount" value={`${order.usdtAmount} USDT`} />
                                                            <DetailRow label="INR Amount" value={`₹${order.inrAmount}`} />
                                                            <DetailRow label="Network" value={order.network} />
                                                            <DetailRow label="Recipient Address" value={<span className="font-mono text-[10px] break-all">{order.usdtAddress}</span>} />
                                                            <DetailRow label="Payment Mode" value={order.paymentMode} />
                                                            <DetailRow label="Email" value={order.email} />
                                                            <DetailRow label="Receipt" value={order.paymentReceiptUrl ? <a href={order.paymentReceiptUrl} target="_blank" className="text-primary hover:underline text-xs">View Uploaded Receipt</a> : 'No Receipt'} />
                                                        </div>
                                                        <DialogFooter className="flex flex-row gap-2 sm:justify-end">
                                                            <Button variant="outline" size="sm" onClick={() => handleStatusUpdate('buyOrders', order.id, 'failed')} disabled={actionLoading === order.id}>Reject</Button>
                                                            <Button size="sm" onClick={() => handleStatusUpdate('buyOrders', order.id, 'completed', order.userId, order.usdtAmount)} disabled={actionLoading === order.id}><CheckCircle2 className="mr-2 h-4 w-4" /> Complete</Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </TabsContent>
                    
                    <TabsContent value="sellOrders">
                        <ScrollArea className="h-[60vh] border rounded-md">
                           <Table>
                                <TableHeader><TableRow><TableHead className="min-w-[120px]">Date</TableHead><TableHead>Status</TableHead><TableHead>USDT</TableHead><TableHead className="hidden md:table-cell">INR</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {sellOrders?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell className="text-[10px] md:text-xs">{format(new Date(order.createdAt), 'PPp')}</TableCell>
                                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                                            <TableCell className="font-medium">{order.usdtAmount}</TableCell>
                                            <TableCell className="hidden md:table-cell">₹{order.inrAmount}</TableCell>
                                            <TableCell>
                                                <Dialog>
                                                    <DialogTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button></DialogTrigger>
                                                    <DialogContent className="max-w-2xl w-[95vw] rounded-lg">
                                                        <DialogHeader><DialogTitle>Sell Order Details</DialogTitle><DialogDescription>ID: {order.id}</DialogDescription></DialogHeader>
                                                        <div className="space-y-2 py-4">
                                                            <DetailRow label="User ID" value={order.userId} />
                                                            <DetailRow label="Status" value={getStatusBadge(order.status)} />
                                                            <DetailRow label="USDT to Deduct" value={`${order.usdtAmount} USDT`} />
                                                            <DetailRow label="INR to Pay User" value={`₹${order.inrAmount}`} />
                                                            <DetailRow label="Payment Mode" value={order.paymentMode} />
                                                            {order.paymentMode === 'UPI' ? (
                                                                <>
                                                                    <DetailRow label="UPI ID" value={order.upiId} />
                                                                    <DetailRow label="Holder" value={order.upiHolderName} />
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <DetailRow label="Bank" value={order.bankName} />
                                                                    <DetailRow label="Account" value={order.accountNumber} />
                                                                    <DetailRow label="IFSC" value={order.ifsc} />
                                                                    <DetailRow label="Holder" value={order.bankHolderName} />
                                                                </>
                                                            )}
                                                            <DetailRow label="Email" value={order.email} />
                                                        </div>
                                                        <DialogFooter className="flex flex-row gap-2 sm:justify-end">
                                                            <Button variant="outline" size="sm" onClick={() => handleStatusUpdate('sellOrders', order.id, 'failed')} disabled={actionLoading === order.id}>Reject</Button>
                                                            <Button size="sm" onClick={() => handleStatusUpdate('sellOrders', order.id, 'completed')} disabled={actionLoading === order.id}><CheckCircle2 className="mr-2 h-4 w-4" /> Complete</Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="deposits">
                        <ScrollArea className="h-[60vh] border rounded-md">
                            <Table>
                                <TableHeader><TableRow><TableHead className="min-w-[120px]">Date</TableHead><TableHead>Status</TableHead><TableHead>Amount</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {deposits?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(dep => (
                                        <TableRow key={dep.id}>
                                            <TableCell className="text-[10px] md:text-xs">{format(new Date(dep.createdAt), 'PPp')}</TableCell>
                                            <TableCell>{getStatusBadge(dep.status)}</TableCell>
                                            <TableCell className="font-medium">{dep.amount} USDT</TableCell>
                                            <TableCell>
                                                <Dialog>
                                                    <DialogTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button></DialogTrigger>
                                                    <DialogContent className="w-[95vw] rounded-lg">
                                                        <DialogHeader><DialogTitle>Deposit Verification</DialogTitle></DialogHeader>
                                                        <div className="space-y-4 py-4">
                                                            <DetailRow label="User ID" value={<span className="font-mono text-[10px]">{dep.userId}</span>} />
                                                            <DetailRow label="Network" value={dep.network} />
                                                            <DetailRow label="TX Hash" value={<span className="font-mono text-[10px] break-all">{dep.txHash || 'Pending Submission'}</span>} />
                                                        </div>
                                                        <DialogFooter className="flex flex-row gap-2 sm:justify-end">
                                                            <Button variant="outline" size="sm" onClick={() => handleStatusUpdate('deposits', dep.id, 'failed')} disabled={actionLoading === dep.id}>Reject</Button>
                                                            <Button size="sm" onClick={() => handleStatusUpdate('deposits', dep.id, 'completed', dep.userId, dep.amount)} disabled={actionLoading === dep.id}>Confirm</Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="withdrawals">
                        <ScrollArea className="h-[60vh] border rounded-md">
                            <Table>
                                <TableHeader><TableRow><TableHead className="min-w-[120px]">Date</TableHead><TableHead>Status</TableHead><TableHead>Amount</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {withdrawals?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(wd => (
                                        <TableRow key={wd.id}>
                                            <TableCell className="text-[10px] md:text-xs">{format(new Date(wd.createdAt), 'PPp')}</TableCell>
                                            <TableCell>{getStatusBadge(wd.status)}</TableCell>
                                            <TableCell className="font-medium">{wd.amount} USDT</TableCell>
                                            <TableCell>
                                                <Dialog>
                                                    <DialogTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button></DialogTrigger>
                                                    <DialogContent className="w-[95vw] rounded-lg">
                                                        <DialogHeader><DialogTitle>Withdrawal Request</DialogTitle></DialogHeader>
                                                        <div className="space-y-4 py-4">
                                                            <DetailRow label="User ID" value={<span className="font-mono text-[10px]">{wd.userId}</span>} />
                                                            <DetailRow label="Recipient" value={<span className="font-mono text-[10px] break-all">{wd.address}</span>} />
                                                            <DetailRow label="Network" value={wd.network} />
                                                        </div>
                                                        <DialogFooter className="flex flex-row gap-2 sm:justify-end">
                                                            <Button variant="outline" size="sm" onClick={() => handleStatusUpdate('withdrawals', wd.id, 'failed', wd.userId, wd.amount)} disabled={actionLoading === wd.id}>Reject & Refund</Button>
                                                            <Button size="sm" onClick={() => handleStatusUpdate('withdrawals', wd.id, 'completed')} disabled={actionLoading === wd.id}>Mark Sent</Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </TabsContent>
                    
                    <TabsContent value="contact">
                         <ScrollArea className="h-[60vh] border rounded-md">
                           <Table>
                                <TableHeader><TableRow><TableHead className="min-w-[120px]">Date</TableHead><TableHead>Name</TableHead><TableHead className="hidden md:table-cell">Email</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {contactMessages?.slice().sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).map(msg => (
                                        <TableRow key={msg.id}>
                                            <TableCell className="text-[10px] md:text-xs">{format(new Date(msg.submittedAt), 'PPp')}</TableCell>
                                            <TableCell className="text-xs md:text-sm">{msg.name}</TableCell>
                                            <TableCell className="hidden md:table-cell text-xs">{msg.email}</TableCell>
                                            <TableCell>
                                                <Dialog>
                                                    <DialogTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button></DialogTrigger>
                                                    <DialogContent className="max-w-2xl w-[95vw] rounded-lg">
                                                        <DialogHeader><DialogTitle>Message from {msg.name}</DialogTitle><DialogDescription>{msg.email}</DialogDescription></DialogHeader>
                                                        <p className="whitespace-pre-wrap py-4 text-xs md:text-sm">{msg.description}</p>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="users">
                        <ScrollArea className="h-[60vh] border rounded-md">
                            <Table>
                                <TableHeader><TableRow><TableHead className="min-w-[120px]">Joined</TableHead><TableHead>Name</TableHead><TableHead>Balance</TableHead><TableHead className="hidden md:table-cell">Email</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {users?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(u => (
                                        <TableRow key={u.id}>
                                            <TableCell className="text-[10px] md:text-xs">{format(new Date(u.createdAt), 'PPp')}</TableCell>
                                            <TableCell className="font-semibold text-xs md:text-sm">{u.name}</TableCell>
                                            <TableCell className="font-bold text-primary text-xs md:text-sm">{(u.balance || 0).toLocaleString()} USDT</TableCell>
                                            <TableCell className="hidden md:table-cell text-[10px]">{u.email}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
