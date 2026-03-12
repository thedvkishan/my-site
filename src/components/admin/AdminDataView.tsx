
'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, doc, updateDoc, increment } from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Eye, Search, User as UserIcon, Mail, Phone, Calendar, Wallet, Hash } from "lucide-react";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="grid grid-cols-[160px_1fr] items-start gap-4 py-2 border-b border-muted/50 last:border-0">
        <span className="text-muted-foreground text-right text-xs md:text-sm font-medium">{label}</span>
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
            <CardHeader className="p-6 bg-muted/30 border-b">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <CardTitle className="text-2xl font-black tracking-tight">Institutional Data Terminal</CardTitle>
                        <CardDescription>
                            Global oversight: {users?.length || 0} Traders | {buyOrders?.length || 0} Buys | {sellOrders?.length || 0} Sells
                        </CardDescription>
                    </div>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search Name, Email, ID, Hash..." 
                            className="pl-10 h-11 border-primary/20 shadow-sm focus:ring-primary/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Tabs defaultValue="buyOrders" className="w-full">
                    <div className="px-6 pt-4 border-b bg-muted/10">
                        <ScrollArea className="w-full whitespace-nowrap">
                            <TabsList className="inline-flex w-auto p-1 bg-transparent border-b-0 space-x-1">
                                <TabsTrigger value="buyOrders" className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md font-bold text-xs uppercase tracking-wider">Buy Orders ({filteredBuyOrders.length})</TabsTrigger>
                                <TabsTrigger value="sellOrders" className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md font-bold text-xs uppercase tracking-wider">Sell Orders ({filteredSellOrders.length})</TabsTrigger>
                                <TabsTrigger value="deposits" className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md font-bold text-xs uppercase tracking-wider">Deposits ({filteredDeposits.length})</TabsTrigger>
                                <TabsTrigger value="withdrawals" className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md font-bold text-xs uppercase tracking-wider">Withdrawals ({filteredWithdrawals.length})</TabsTrigger>
                                <TabsTrigger value="contact" className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md font-bold text-xs uppercase tracking-wider">Support ({filteredMessages.length})</TabsTrigger>
                                <TabsTrigger value="users" className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md font-bold text-xs uppercase tracking-wider">Users ({filteredUsers.length})</TabsTrigger>
                            </TabsList>
                        </ScrollArea>
                    </div>
                    
                    {isLoading && <div className="flex justify-center items-center py-24"><Loader2 className="h-16 w-16 animate-spin text-primary opacity-20" /></div>}
                    
                    <TabsContent value="buyOrders" className="m-0">
                        <ScrollArea className="h-[65vh]">
                            <Table>
                                <TableHeader className="bg-muted/50"><TableRow><TableHead>Date</TableHead><TableHead>Order ID / User</TableHead><TableHead>Status</TableHead><TableHead>Amount (USDT/INR)</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredBuyOrders.map(order => (
                                        <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="text-[10px] whitespace-nowrap font-mono">{order.createdAt ? format(new Date(order.createdAt), 'PPp') : 'N/A'}</TableCell>
                                            <TableCell>
                                                <div className="text-xs font-black font-mono text-primary flex items-center gap-1"><Hash className="h-3 w-3" /> {order.id}</div>
                                                <div className="text-[10px] text-muted-foreground font-medium">{order.email}</div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                                            <TableCell>
                                                <div className="font-black text-primary text-base">{order.usdtAmount} USDT</div>
                                                <div className="text-[10px] text-muted-foreground font-bold">₹{order.inrAmount?.toLocaleString()}</div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8 gap-2 font-bold"><Eye className="h-4 w-4" /> View</Button></DialogTrigger>
                                                    <DialogContent className="max-w-2xl">
                                                        <DialogHeader><DialogTitle className="text-2xl font-black">Buy Order Details</DialogTitle><DialogDescription>Reference: {order.id}</DialogDescription></DialogHeader>
                                                        <div className="py-6 border-2 border-dashed rounded-2xl bg-muted/10 px-6 space-y-1">
                                                            <DetailRow label="User UID" value={order.userId} />
                                                            <DetailRow label="Status" value={getStatusBadge(order.status)} />
                                                            <DetailRow label="USDT Volume" value={`${order.usdtAmount} USDT`} />
                                                            <DetailRow label="Settlement (INR)" value={<span className="text-primary font-black">₹{order.inrAmount?.toLocaleString()}</span>} />
                                                            <DetailRow label="Network Type" value={<Badge variant="outline" className="font-mono">{order.network}</Badge>} />
                                                            <DetailRow label="Payment Method" value={order.paymentMode} />
                                                            <DetailRow label="Verified Email" value={order.email} />
                                                            <DetailRow label="Attached Receipt" value={order.paymentReceiptUrl ? <a href={order.paymentReceiptUrl} target="_blank" className="text-primary hover:underline font-bold flex items-center gap-2">View Document <ArrowUpRight className="h-4 w-4" /></a> : <span className="text-muted-foreground italic">No proof uploaded</span>} />
                                                        </div>
                                                        <DialogFooter className="gap-3 mt-4">
                                                            <Button variant="destructive" className="font-bold h-11" onClick={() => handleStatusUpdate('buyOrders', order.id, 'failed')} disabled={actionLoading === order.id}><XCircle className="mr-2 h-4 w-4" /> Reject</Button>
                                                            <Button className="bg-green-600 hover:bg-green-700 font-bold h-11" onClick={() => handleStatusUpdate('buyOrders', order.id, 'completed', order.userId, order.usdtAmount)} disabled={actionLoading === order.id}><CheckCircle2 className="mr-2 h-4 w-4" /> Approve & Credit</Button>
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
                        <ScrollArea className="h-[65vh]">
                           <Table>
                                <TableHeader className="bg-muted/50"><TableRow><TableHead>Date</TableHead><TableHead>Order ID / User</TableHead><TableHead>Status</TableHead><TableHead>Volume (USDT/INR)</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredSellOrders.map(order => (
                                        <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="text-[10px] whitespace-nowrap font-mono">{order.createdAt ? format(new Date(order.createdAt), 'PPp') : 'N/A'}</TableCell>
                                            <TableCell>
                                                <div className="text-xs font-black font-mono text-destructive flex items-center gap-1"><Hash className="h-3 w-3" /> {order.id}</div>
                                                <div className="text-[10px] text-muted-foreground font-medium">{order.email}</div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                                            <TableCell>
                                                <div className="font-black text-destructive text-base">{order.usdtAmount} USDT</div>
                                                <div className="text-[10px] text-muted-foreground font-bold">₹{order.inrAmount?.toLocaleString()}</div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8 gap-2 font-bold"><Eye className="h-4 w-4" /> View</Button></DialogTrigger>
                                                    <DialogContent className="max-w-2xl">
                                                        <DialogHeader><DialogTitle className="text-2xl font-black text-destructive">Sell Order Process</DialogTitle><DialogDescription>Order: {order.id}</DialogDescription></DialogHeader>
                                                        <div className="py-6 border-2 border-dashed rounded-2xl bg-muted/10 px-6 space-y-1">
                                                            <DetailRow label="User Account" value={order.email} />
                                                            <DetailRow label="Current Status" value={getStatusBadge(order.status)} />
                                                            <DetailRow label="Settlement Mode" value={<Badge variant="secondary" className="font-bold">{order.paymentMode}</Badge>} />
                                                            {order.paymentMode === 'UPI' ? (
                                                                <>
                                                                    <DetailRow label="Recipient UPI" value={order.upiId} />
                                                                    <DetailRow label="Legal Name" value={order.upiHolderName} />
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <DetailRow label="Institution" value={order.bankName} />
                                                                    <DetailRow label="Account Number" value={<span className="font-mono">{order.accountNumber}</span>} />
                                                                    <DetailRow label="IFSC Code" value={<span className="font-mono">{order.ifsc}</span>} />
                                                                    <DetailRow label="Legal Holder" value={order.bankHolderName} />
                                                                </>
                                                            )}
                                                            <DetailRow label="USDT Liquidation" value={`${order.usdtAmount} USDT`} />
                                                            <DetailRow label="Disbursement" value={<span className="text-destructive font-black text-xl">₹{order.inrAmount?.toLocaleString()}</span>} />
                                                        </div>
                                                        <DialogFooter className="gap-3 mt-4">
                                                            <Button variant="outline" className="font-bold h-11" onClick={() => handleStatusUpdate('sellOrders', order.id, 'failed')} disabled={actionLoading === order.id}>Reject</Button>
                                                            <Button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold h-11" onClick={() => handleStatusUpdate('sellOrders', order.id, 'completed')} disabled={actionLoading === order.id}><CheckCircle2 className="mr-2 h-4 w-4" /> Finalize Settlement</Button>
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
                        <ScrollArea className="h-[65vh]">
                            <Table>
                                <TableHeader className="bg-muted/50"><TableRow><TableHead>Date</TableHead><TableHead>Hash / Network</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredDeposits.map(dep => (
                                        <TableRow key={dep.id}>
                                            <TableCell className="text-[10px] whitespace-nowrap font-mono">{dep.createdAt ? format(new Date(dep.createdAt), 'PPp') : 'N/A'}</TableCell>
                                            <TableCell>
                                                <div className="text-[10px] font-mono font-bold text-primary truncate max-w-[200px]">{dep.txHash || 'PENDING TXID'}</div>
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase">{dep.network}</div>
                                            </TableCell>
                                            <TableCell className="font-black text-green-600">+{dep.amount} USDT</TableCell>
                                            <TableCell>{getStatusBadge(dep.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8 gap-2 font-bold"><Eye className="h-4 w-4" /> Inspect</Button></DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader><DialogTitle className="text-xl font-black">Blockchain Verification</DialogTitle></DialogHeader>
                                                        <div className="space-y-1 py-4 border rounded-xl bg-muted/10 px-4 text-sm">
                                                            <DetailRow label="Internal UID" value={dep.userId} />
                                                            <DetailRow label="Network Protocol" value={dep.network} />
                                                            <DetailRow label="TXID Hash" value={<span className="font-mono text-xs break-all text-primary font-bold">{dep.txHash || 'Awaiting Hash Submission'}</span>} />
                                                            <DetailRow label="Reported Amount" value={<span className="font-black">{dep.amount} USDT</span>} />
                                                        </div>
                                                        <DialogFooter className="gap-2 mt-4">
                                                            <Button variant="outline" className="font-bold" onClick={() => handleStatusUpdate('deposits', dep.id, 'failed')} disabled={actionLoading === dep.id}>Reject</Button>
                                                            <Button className="bg-primary font-bold" onClick={() => handleStatusUpdate('deposits', dep.id, 'completed', dep.userId, dep.amount)} disabled={actionLoading === dep.id}>Confirm & Credit Wallet</Button>
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
                        <ScrollArea className="h-[65vh]">
                            <Table>
                                <TableHeader className="bg-muted/50"><TableRow><TableHead>Date</TableHead><TableHead>Destination Address</TableHead><TableHead>Volume</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredWithdrawals.map(wd => (
                                        <TableRow key={wd.id}>
                                            <TableCell className="text-[10px] whitespace-nowrap font-mono">{wd.createdAt ? format(new Date(wd.createdAt), 'PPp') : 'N/A'}</TableCell>
                                            <TableCell>
                                                <div className="text-[10px] font-mono font-bold text-destructive truncate max-w-[200px]">{wd.address}</div>
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase">{wd.network}</div>
                                            </TableCell>
                                            <TableCell className="font-black text-destructive">-{wd.amount} USDT</TableCell>
                                            <TableCell>{getStatusBadge(wd.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8 gap-2 font-bold"><Eye className="h-4 w-4" /> Details</Button></DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader><DialogTitle className="text-xl font-black text-destructive">Withdrawal Fulfillment</DialogTitle></DialogHeader>
                                                        <div className="py-4 border rounded-xl bg-muted/10 px-4 text-sm space-y-1">
                                                            <DetailRow label="User UID" value={wd.userId} />
                                                            <DetailRow label="Recipient Wallet" value={<span className="font-mono text-xs break-all text-destructive font-bold">{wd.address}</span>} />
                                                            <DetailRow label="Network" value={wd.network} />
                                                            <DetailRow label="Withdraw Volume" value={<span className="font-black">{wd.amount} USDT</span>} />
                                                        </div>
                                                        <DialogFooter className="gap-2 mt-4">
                                                            <Button variant="destructive" className="font-bold" onClick={() => handleStatusUpdate('withdrawals', wd.id, 'failed', wd.userId, wd.amount)} disabled={actionLoading === wd.id}>Reject & Refund</Button>
                                                            <Button className="bg-primary font-bold" onClick={() => handleStatusUpdate('withdrawals', wd.id, 'completed')} disabled={actionLoading === wd.id}>Confirm TX Sent</Button>
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
                         <ScrollArea className="h-[65vh]">
                           <Table>
                                <TableHeader className="bg-muted/50"><TableRow><TableHead>Date</TableHead><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredMessages.map(msg => (
                                        <TableRow key={msg.id}>
                                            <TableCell className="text-[10px] font-mono">{msg.submittedAt ? format(new Date(msg.submittedAt), 'PPp') : 'N/A'}</TableCell>
                                            <TableCell className="font-bold text-xs uppercase tracking-tight">{msg.name}</TableCell>
                                            <TableCell className="text-xs font-medium text-muted-foreground">{msg.email}</TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button></DialogTrigger>
                                                    <DialogContent className="max-w-2xl">
                                                        <DialogHeader><DialogTitle className="text-2xl font-black">Support Inquiry</DialogTitle><DialogDescription>From: {msg.name} ({msg.email})</DialogDescription></DialogHeader>
                                                        <div className="p-8 bg-muted/20 rounded-2xl border-4 border-dashed border-primary/10 mt-4">
                                                            <p className="whitespace-pre-wrap text-base font-medium leading-relaxed italic">"{msg.description}"</p>
                                                        </div>
                                                        <div className="mt-4 flex justify-end">
                                                            <Button variant="outline" className="font-bold">Mark as Resolved</Button>
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
                        <ScrollArea className="h-[65vh]">
                            <Table>
                                <TableHeader className="bg-muted/50"><TableRow><TableHead>Registration</TableHead><TableHead>Legal Name</TableHead><TableHead>Balance</TableHead><TableHead className="hidden md:table-cell">Verified Email</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredUsers.map(u => (
                                        <TableRow key={u.id} className="hover:bg-muted/30">
                                            <TableCell className="text-[10px] font-mono">{u.createdAt ? format(new Date(u.createdAt), 'PPp') : 'N/A'}</TableCell>
                                            <TableCell className="font-black text-sm uppercase">{u.name}</TableCell>
                                            <TableCell className="font-black text-primary text-base">{(u.balance || 0).toLocaleString()} <span className="text-[10px] font-medium">USDT</span></TableCell>
                                            <TableCell className="hidden md:table-cell text-xs font-medium text-muted-foreground">{u.email}</TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8 gap-2 font-bold"><UserIcon className="h-4 w-4" /> Profile</Button></DialogTrigger>
                                                    <DialogContent className="max-w-md">
                                                        <DialogHeader>
                                                            <div className="flex items-center gap-4 mb-2">
                                                                <div className="p-4 bg-primary/10 rounded-2xl shadow-inner"><UserIcon className="h-8 w-8 text-primary" /></div>
                                                                <div>
                                                                    <DialogTitle className="text-2xl font-black">{u.name}</DialogTitle>
                                                                    <DialogDescription className="font-bold uppercase tracking-widest text-[10px] text-primary">Institutional Profile</DialogDescription>
                                                                </div>
                                                            </div>
                                                        </DialogHeader>
                                                        <div className="space-y-1 py-6 bg-muted/5 rounded-2xl px-2">
                                                            <DetailRow label="Internal UID" value={<span className="font-mono text-xs">{u.userId}</span>} />
                                                            <DetailRow label="Email Identity" value={<div className="flex items-center gap-2 font-bold"><Mail className="h-3 w-3 text-muted-foreground" /> {u.email}</div>} />
                                                            <DetailRow label="Contact Line" value={<div className="flex items-center gap-2 font-bold"><Phone className="h-3 w-3 text-muted-foreground" /> {u.phone || 'N/A'}</div>} />
                                                            <DetailRow label="Available Liquidity" value={<div className="flex items-center gap-2 font-black text-primary text-xl"><Wallet className="h-5 w-5" /> {(u.balance || 0).toLocaleString()} USDT</div>} />
                                                            <DetailRow label="Member Since" value={<div className="flex items-center gap-2 font-medium"><Calendar className="h-3 w-3 text-muted-foreground" /> {u.createdAt ? format(new Date(u.createdAt), 'PPP') : 'N/A'}</div>} />
                                                            <DetailRow label="Recovery Question" value={<span className="italic text-muted-foreground">"{u.securityQuestion}"</span>} />
                                                            <DetailRow label="Encrypted Answer" value={<span className="font-mono text-primary font-black uppercase text-xs">{u.securityAnswer}</span>} />
                                                        </div>
                                                        <DialogFooter className="mt-4">
                                                            <Button variant="outline" className="w-full h-11 font-bold" onClick={() => toast({ title: "Admin Action", description: "Audit complete." })}>Close Terminal</Button>
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
