
'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, doc, updateDoc, increment } from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Eye, Search, User as UserIcon, Mail, Phone, Calendar, Wallet, Hash, ArrowUpRight } from "lucide-react";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="grid grid-cols-[120px_1fr] md:grid-cols-[160px_1fr] items-start gap-4 py-2.5 border-b border-muted/50 last:border-0">
        <span className="text-muted-foreground text-left text-[10px] md:text-sm font-bold uppercase tracking-wider">{label}</span>
        <div className="font-semibold break-words text-xs md:text-sm">{value || 'N/A'}</div>
    </div>
);

export function AdminDataView() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

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

    const filterData = (data: any[] | null) => {
        if (!data) return [];
        if (!searchQuery.trim()) return data;
        
        const q = searchQuery.toLowerCase();
        return data.filter(item => {
            return Object.values(item).some(val => 
                String(val).toLowerCase().includes(q)
            );
        });
    };

    const filteredBuyOrders = useMemo(() => filterData(buyOrders), [buyOrders, searchQuery]);
    const filteredSellOrders = useMemo(() => filterData(sellOrders), [sellOrders, searchQuery]);
    const filteredDeposits = useMemo(() => filterData(deposits), [deposits, searchQuery]);
    const filteredWithdrawals = useMemo(() => filterData(withdrawals), [withdrawals, searchQuery]);
    const filteredMessages = useMemo(() => filterData(contactMessages), [contactMessages, searchQuery]);
    const filteredUsers = useMemo(() => filterData(users), [users, searchQuery]);

    const handleStatusUpdate = async (type: 'buyOrders' | 'sellOrders' | 'deposits' | 'withdrawals', id: string, status: string, userId?: string, amount?: number) => {
        if (!firestore) return;
        setActionLoading(id);
        try {
            const orderRef = doc(firestore, type, id);
            await updateDoc(orderRef, { status });

            if ((type === 'deposits' || type === 'buyOrders') && status === 'completed' && userId && amount) {
                const userRef = doc(firestore, 'users', userId);
                await updateDoc(userRef, { balance: increment(amount) });
            }
            
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
        <Card className="overflow-hidden border-2 shadow-lg">
            <CardHeader className="p-4 md:p-6 bg-muted/30 border-b">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <CardTitle className="text-xl md:text-2xl font-black tracking-tight">Institutional Data Terminal</CardTitle>
                        <CardDescription className="text-xs md:text-sm">
                            {users?.length || 0} Traders | {buyOrders?.length || 0} Buys | {sellOrders?.length || 0} Sells
                        </CardDescription>
                    </div>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search Name, Email, ID, Hash..." 
                            className="pl-10 h-10 border-primary/20 shadow-sm focus:ring-primary/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Tabs defaultValue="buyOrders" className="w-full">
                    <div className="border-b bg-muted/10">
                        <ScrollArea className="w-full whitespace-nowrap">
                            <TabsList className="flex w-full justify-start h-auto p-2 bg-transparent border-b-0 gap-2">
                                <TabsTrigger value="buyOrders" className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md font-bold text-[10px] uppercase tracking-wider">Buy ({filteredBuyOrders.length})</TabsTrigger>
                                <TabsTrigger value="sellOrders" className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md font-bold text-[10px] uppercase tracking-wider">Sell ({filteredSellOrders.length})</TabsTrigger>
                                <TabsTrigger value="deposits" className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md font-bold text-[10px] uppercase tracking-wider">Deposits ({filteredDeposits.length})</TabsTrigger>
                                <TabsTrigger value="withdrawals" className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md font-bold text-[10px] uppercase tracking-wider">Withdraw ({filteredWithdrawals.length})</TabsTrigger>
                                <TabsTrigger value="contact" className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md font-bold text-[10px] uppercase tracking-wider">Support ({filteredMessages.length})</TabsTrigger>
                                <TabsTrigger value="users" className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md font-bold text-[10px] uppercase tracking-wider">Users ({filteredUsers.length})</TabsTrigger>
                            </TabsList>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </div>
                    
                    {isLoading && <div className="flex justify-center items-center py-24"><Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" /></div>}
                    
                    <TabsContent value="buyOrders" className="m-0">
                        <ScrollArea className="h-[60vh] md:h-[65vh]">
                            <Table>
                                <TableHeader className="bg-muted/50"><TableRow><TableHead className="text-[10px] font-bold uppercase">Ref / User</TableHead><TableHead className="text-[10px] font-bold uppercase">Volume</TableHead><TableHead className="text-right text-[10px] font-bold uppercase">View</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredBuyOrders.map(order => (
                                        <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell>
                                                <div className="text-[10px] font-black font-mono text-primary flex items-center gap-1"><Hash className="h-3 w-3" /> {order.id.slice(-6)}</div>
                                                <div className="text-[10px] text-muted-foreground font-medium truncate max-w-[120px]">{order.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-black text-primary text-xs">{order.usdtAmount} USDT</div>
                                                <div className="text-[9px] text-muted-foreground font-bold">₹{order.inrAmount?.toLocaleString()}</div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button></DialogTrigger>
                                                    <DialogContent className="max-w-xl mx-4">
                                                        <DialogHeader><DialogTitle className="text-xl font-black">Buy Order Details</DialogTitle><DialogDescription className="text-xs">Ref: {order.id}</DialogDescription></DialogHeader>
                                                        <ScrollArea className="max-h-[70vh] py-4 pr-4">
                                                            <div className="border-2 border-dashed rounded-xl bg-muted/10 px-4 py-2 space-y-0.5">
                                                                <DetailRow label="Created" value={order.createdAt ? format(new Date(order.createdAt), 'PPp') : 'N/A'} />
                                                                <DetailRow label="User UID" value={order.userId} />
                                                                <DetailRow label="Status" value={getStatusBadge(order.status)} />
                                                                <DetailRow label="Volume" value={`${order.usdtAmount} USDT`} />
                                                                <DetailRow label="Amount" value={<span className="text-primary font-black">₹{order.inrAmount?.toLocaleString()}</span>} />
                                                                <DetailRow label="Network" value={<Badge variant="outline" className="font-mono text-[10px]">{order.network}</Badge>} />
                                                                <DetailRow label="Method" value={order.paymentMode} />
                                                                <DetailRow label="Email" value={order.email} />
                                                                <DetailRow label="Receipt" value={order.paymentReceiptUrl ? <a href={order.paymentReceiptUrl} target="_blank" className="text-primary hover:underline font-bold flex items-center gap-1">View Proof <ArrowUpRight className="h-3 w-3" /></a> : <span className="text-muted-foreground italic">No proof uploaded</span>} />
                                                            </div>
                                                        </ScrollArea>
                                                        <DialogFooter className="flex-row gap-2 mt-2">
                                                            <Button variant="destructive" className="flex-1 font-bold text-xs h-10" onClick={() => handleStatusUpdate('buyOrders', order.id, 'failed')} disabled={actionLoading === order.id}>Reject</Button>
                                                            <Button className="flex-1 bg-green-600 hover:bg-green-700 font-bold text-xs h-10" onClick={() => handleStatusUpdate('buyOrders', order.id, 'completed', order.userId, order.usdtAmount)} disabled={actionLoading === order.id}>Approve</Button>
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
                    
                    <TabsContent value="sellOrders" className="m-0">
                        <ScrollArea className="h-[60vh] md:h-[65vh]">
                           <Table>
                                <TableHeader className="bg-muted/50"><TableRow><TableHead className="text-[10px] font-bold uppercase">Ref / User</TableHead><TableHead className="text-[10px] font-bold uppercase">Volume</TableHead><TableHead className="text-right text-[10px] font-bold uppercase">View</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredSellOrders.map(order => (
                                        <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell>
                                                <div className="text-[10px] font-black font-mono text-destructive flex items-center gap-1"><Hash className="h-3 w-3" /> {order.id.slice(-6)}</div>
                                                <div className="text-[10px] text-muted-foreground font-medium truncate max-w-[120px]">{order.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-black text-destructive text-xs">{order.usdtAmount} USDT</div>
                                                <div className="text-[9px] text-muted-foreground font-bold">₹{order.inrAmount?.toLocaleString()}</div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button></DialogTrigger>
                                                    <DialogContent className="max-w-xl mx-4">
                                                        <DialogHeader><DialogTitle className="text-xl font-black text-destructive">Sell Order Process</DialogTitle><DialogDescription className="text-xs">Ref: {order.id}</DialogDescription></DialogHeader>
                                                        <ScrollArea className="max-h-[70vh] py-4 pr-4">
                                                            <div className="border-2 border-dashed rounded-xl bg-muted/10 px-4 py-2 space-y-0.5">
                                                                <DetailRow label="Created" value={order.createdAt ? format(new Date(order.createdAt), 'PPp') : 'N/A'} />
                                                                <DetailRow label="User" value={order.email} />
                                                                <DetailRow label="Status" value={getStatusBadge(order.status)} />
                                                                <DetailRow label="Method" value={<Badge variant="secondary" className="font-bold text-[10px]">{order.paymentMode}</Badge>} />
                                                                {order.paymentMode === 'UPI' ? (
                                                                    <>
                                                                        <DetailRow label="UPI ID" value={order.upiId} />
                                                                        <DetailRow label="Name" value={order.upiHolderName} />
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <DetailRow label="Bank" value={order.bankName} />
                                                                        <DetailRow label="Acc No" value={<span className="font-mono text-[10px]">{order.accountNumber}</span>} />
                                                                        <DetailRow label="IFSC" value={<span className="font-mono text-[10px]">{order.ifsc}</span>} />
                                                                        <DetailRow label="Holder" value={order.bankHolderName} />
                                                                    </>
                                                                )}
                                                                <DetailRow label="Network" value={<Badge variant="outline" className="text-[10px]">{order.network}</Badge>} />
                                                                <DetailRow label="Volume" value={`${order.usdtAmount} USDT`} />
                                                                <DetailRow label="Settlement" value={<span className="text-destructive font-black text-lg">₹{order.inrAmount?.toLocaleString()}</span>} />
                                                            </div>
                                                        </ScrollArea>
                                                        <DialogFooter className="flex-row gap-2 mt-2">
                                                            <Button variant="outline" className="flex-1 font-bold text-xs h-10" onClick={() => handleStatusUpdate('sellOrders', order.id, 'failed')} disabled={actionLoading === order.id}>Reject</Button>
                                                            <Button className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-xs h-10" onClick={() => handleStatusUpdate('sellOrders', order.id, 'completed')} disabled={actionLoading === order.id}>Finalize</Button>
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

                    <TabsContent value="deposits" className="m-0">
                        <ScrollArea className="h-[60vh] md:h-[65vh]">
                            <Table>
                                <TableHeader className="bg-muted/50"><TableRow><TableHead className="text-[10px] font-bold uppercase">Hash / Net</TableHead><TableHead className="text-[10px] font-bold uppercase">Amount</TableHead><TableHead className="text-right text-[10px] font-bold uppercase">View</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredDeposits.map(dep => (
                                        <TableRow key={dep.id}>
                                            <TableCell>
                                                <div className="text-[9px] font-mono font-bold text-primary truncate max-w-[100px]">{dep.txHash || 'PENDING TXID'}</div>
                                                <div className="text-[9px] font-bold text-muted-foreground uppercase">{dep.network}</div>
                                            </TableCell>
                                            <TableCell className="font-black text-green-600 text-xs">+{dep.amount} USDT</TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button></DialogTrigger>
                                                    <DialogContent className="mx-4">
                                                        <DialogHeader><DialogTitle className="text-xl font-black">Blockchain Verification</DialogTitle></DialogHeader>
                                                        <div className="space-y-0.5 py-4 border rounded-xl bg-muted/10 px-4">
                                                            <DetailRow label="UID" value={dep.userId} />
                                                            <DetailRow label="Network" value={dep.network} />
                                                            <DetailRow label="TXID" value={<span className="font-mono text-[10px] break-all text-primary font-bold">{dep.txHash || 'Awaiting Submission'}</span>} />
                                                            <DetailRow label="Amount" value={<span className="font-black">{dep.amount} USDT</span>} />
                                                            <DetailRow label="Status" value={getStatusBadge(dep.status)} />
                                                            <DetailRow label="Date" value={dep.createdAt ? format(new Date(dep.createdAt), 'PPp') : 'N/A'} />
                                                        </div>
                                                        <DialogFooter className="flex-row gap-2 mt-2">
                                                            <Button variant="outline" className="flex-1 font-bold h-10 text-xs" onClick={() => handleStatusUpdate('deposits', dep.id, 'failed')} disabled={actionLoading === dep.id}>Reject</Button>
                                                            <Button className="flex-1 bg-primary font-bold h-10 text-xs" onClick={() => handleStatusUpdate('deposits', dep.id, 'completed', dep.userId, dep.amount)} disabled={actionLoading === dep.id}>Confirm</Button>
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

                    <TabsContent value="withdrawals" className="m-0">
                        <ScrollArea className="h-[60vh] md:h-[65vh]">
                            <Table>
                                <TableHeader className="bg-muted/50"><TableRow><TableHead className="text-[10px] font-bold uppercase">Address / Net</TableHead><TableHead className="text-[10px] font-bold uppercase">Volume</TableHead><TableHead className="text-right text-[10px] font-bold uppercase">View</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredWithdrawals.map(wd => (
                                        <TableRow key={wd.id}>
                                            <TableCell>
                                                <div className="text-[9px] font-mono font-bold text-destructive truncate max-w-[100px]">{wd.address}</div>
                                                <div className="text-[9px] font-bold text-muted-foreground uppercase">{wd.network}</div>
                                            </TableCell>
                                            <TableCell className="font-black text-destructive text-xs">-{wd.amount} USDT</TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button></DialogTrigger>
                                                    <DialogContent className="mx-4">
                                                        <DialogHeader><DialogTitle className="text-xl font-black text-destructive">Withdrawal Process</DialogTitle></DialogHeader>
                                                        <div className="py-4 border rounded-xl bg-muted/10 px-4 space-y-0.5">
                                                            <DetailRow label="UID" value={wd.userId} />
                                                            <DetailRow label="Address" value={<span className="font-mono text-[10px] break-all text-destructive font-bold">{wd.address}</span>} />
                                                            <DetailRow label="Network" value={wd.network} />
                                                            <DetailRow label="Volume" value={<span className="font-black">{wd.amount} USDT</span>} />
                                                            <DetailRow label="Status" value={getStatusBadge(wd.status)} />
                                                            <DetailRow label="Date" value={wd.createdAt ? format(new Date(wd.createdAt), 'PPp') : 'N/A'} />
                                                        </div>
                                                        <DialogFooter className="flex-row gap-2 mt-2">
                                                            <Button variant="destructive" className="flex-1 font-bold h-10 text-xs" onClick={() => handleStatusUpdate('withdrawals', wd.id, 'failed', wd.userId, wd.amount)} disabled={actionLoading === wd.id}>Reject</Button>
                                                            <Button className="flex-1 bg-primary font-bold h-10 text-xs" onClick={() => handleStatusUpdate('withdrawals', wd.id, 'completed')} disabled={actionLoading === wd.id}>Sent</Button>
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
                    
                    <TabsContent value="contact" className="m-0">
                         <ScrollArea className="h-[60vh] md:h-[65vh]">
                           <Table>
                                <TableHeader className="bg-muted/50"><TableRow><TableHead className="text-[10px] font-bold uppercase">Name / Date</TableHead><TableHead className="text-[10px] font-bold uppercase">Email</TableHead><TableHead className="text-right text-[10px] font-bold uppercase">View</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredMessages.map(msg => (
                                        <TableRow key={msg.id}>
                                            <TableCell>
                                                <div className="font-bold text-[10px] uppercase">{msg.name}</div>
                                                <div className="text-[8px] font-mono text-muted-foreground">{msg.submittedAt ? format(new Date(msg.submittedAt), 'dd/MM HH:mm') : 'N/A'}</div>
                                            </TableCell>
                                            <TableCell className="text-[9px] font-medium text-muted-foreground truncate max-w-[100px]">{msg.email}</TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button></DialogTrigger>
                                                    <DialogContent className="max-w-xl mx-4">
                                                        <DialogHeader><DialogTitle className="text-xl font-black">Support Inquiry</DialogTitle><DialogDescription className="text-xs">From: {msg.name}</DialogDescription></DialogHeader>
                                                        <div className="p-4 bg-muted/20 rounded-xl border-2 border-dashed border-primary/10 mt-2">
                                                            <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed italic">"{msg.description}"</p>
                                                        </div>
                                                        <DetailRow label="Email" value={msg.email} />
                                                        <DetailRow label="Date" value={msg.submittedAt ? format(new Date(msg.submittedAt), 'PPp') : 'N/A'} />
                                                        <div className="mt-4 flex justify-end">
                                                            <Button variant="outline" className="w-full font-bold h-10 text-xs">Mark as Resolved</Button>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="users" className="m-0">
                        <ScrollArea className="h-[60vh] md:h-[65vh]">
                            <Table>
                                <TableHeader className="bg-muted/50"><TableRow><TableHead className="text-[10px] font-bold uppercase">Name / Joined</TableHead><TableHead className="text-[10px] font-bold uppercase">Balance</TableHead><TableHead className="text-right text-[10px] font-bold uppercase">View</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredUsers.map(u => (
                                        <TableRow key={u.id} className="hover:bg-muted/30">
                                            <TableCell>
                                                <div className="font-black text-[10px] uppercase truncate max-w-[100px]">{u.name}</div>
                                                <div className="text-[8px] font-mono text-muted-foreground">{u.createdAt ? format(new Date(u.createdAt), 'dd/MM/yy') : 'N/A'}</div>
                                            </TableCell>
                                            <TableCell className="font-black text-primary text-xs">{(u.balance || 0).toLocaleString()} <span className="text-[8px]">USDT</span></TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8 w-8 p-0"><UserIcon className="h-4 w-4" /></Button></DialogTrigger>
                                                    <DialogContent className="max-w-md mx-4">
                                                        <DialogHeader>
                                                            <div className="flex items-center gap-4 mb-2">
                                                                <div className="p-3 bg-primary/10 rounded-xl"><UserIcon className="h-6 w-6 text-primary" /></div>
                                                                <div>
                                                                    <DialogTitle className="text-xl font-black">{u.name}</DialogTitle>
                                                                    <DialogDescription className="font-bold uppercase tracking-widest text-[8px] text-primary">Terminal Profile</DialogDescription>
                                                                </div>
                                                            </div>
                                                        </DialogHeader>
                                                        <div className="space-y-0.5 py-4 bg-muted/5 rounded-xl px-2">
                                                            <DetailRow label="UID" value={<span className="font-mono text-[10px]">{u.userId}</span>} />
                                                            <DetailRow label="Email" value={<div className="flex items-center gap-1 font-bold text-xs"><Mail className="h-3 w-3 text-muted-foreground" /> {u.email}</div>} />
                                                            <DetailRow label="Phone" value={<div className="flex items-center gap-1 font-bold text-xs"><Phone className="h-3 w-3 text-muted-foreground" /> {u.phone || 'N/A'}</div>} />
                                                            <DetailRow label="Balance" value={<div className="flex items-center gap-1 font-black text-primary text-lg"><Wallet className="h-4 w-4" /> {(u.balance || 0).toLocaleString()} USDT</div>} />
                                                            <DetailRow label="Joined" value={u.createdAt ? format(new Date(u.createdAt), 'PPp') : 'N/A'} />
                                                            <DetailRow label="Question" value={<span className="italic text-muted-foreground text-[10px]">"{u.securityQuestion}"</span>} />
                                                            <DetailRow label="Answer" value={<span className="font-mono text-primary font-black uppercase text-[10px]">{u.securityAnswer}</span>} />
                                                        </div>
                                                        <DialogFooter className="mt-2">
                                                            <Button variant="outline" className="w-full h-10 font-bold text-xs" onClick={() => toast({ title: "Audit complete" })}>Close Terminal</Button>
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
                </Tabs>
            </CardContent>
        </Card>
    );
}
