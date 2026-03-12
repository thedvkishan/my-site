'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, doc, updateDoc, increment } from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Eye, Search, User as UserIcon, Mail, Phone, Calendar, Wallet } from "lucide-react";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";

// Helper component to render details in a consistent way
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

    // Search/Filter logic
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
        <Card className="overflow-hidden border-2">
            <CardHeader className="p-6 bg-muted/30">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <CardTitle className="text-2xl font-black">Institutional Data Terminal</CardTitle>
                        <CardDescription>Comprehensive oversight of all platform activity and {users?.length || 0} registered users.</CardDescription>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by ID, Hash, Email..." 
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Tabs defaultValue="buyOrders" className="w-full">
                    <div className="px-6 pt-4 border-b">
                        <ScrollArea className="w-full whitespace-nowrap">
                            <TabsList className="inline-flex w-auto p-1 bg-transparent border-b-0">
                                <TabsTrigger value="buyOrders" className="data-[state=active]:bg-muted">Buy Orders ({filteredBuyOrders.length})</TabsTrigger>
                                <TabsTrigger value="sellOrders" className="data-[state=active]:bg-muted">Sell Orders ({filteredSellOrders.length})</TabsTrigger>
                                <TabsTrigger value="deposits" className="data-[state=active]:bg-muted">Deposits ({filteredDeposits.length})</TabsTrigger>
                                <TabsTrigger value="withdrawals" className="data-[state=active]:bg-muted">Withdrawals ({filteredWithdrawals.length})</TabsTrigger>
                                <TabsTrigger value="contact" className="data-[state=active]:bg-muted">Support ({filteredMessages.length})</TabsTrigger>
                                <TabsTrigger value="users" className="data-[state=active]:bg-muted">Users ({filteredUsers.length})</TabsTrigger>
                            </TabsList>
                        </ScrollArea>
                    </div>
                    
                    {isLoading && <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}
                    
                    <TabsContent value="buyOrders" className="m-0">
                        <ScrollArea className="h-[60vh]">
                            <Table>
                                <TableHeader className="bg-muted/50"><TableRow><TableHead>Date</TableHead><TableHead>ID / User</TableHead><TableHead>Status</TableHead><TableHead>Amount</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredBuyOrders.map(order => (
                                        <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="text-[10px] whitespace-nowrap">{order.createdAt ? format(new Date(order.createdAt), 'PPp') : 'N/A'}</TableCell>
                                            <TableCell>
                                                <div className="text-xs font-bold font-mono">{order.id}</div>
                                                <div className="text-[10px] text-muted-foreground">{order.email}</div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                                            <TableCell>
                                                <div className="font-black text-primary">{order.usdtAmount} USDT</div>
                                                <div className="text-[10px] text-muted-foreground">₹{order.inrAmount}</div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8 gap-2"><Eye className="h-4 w-4" /> View</Button></DialogTrigger>
                                                    <DialogContent className="max-w-2xl">
                                                        <DialogHeader><DialogTitle>Buy Order Details</DialogTitle><DialogDescription>Transaction Reference: {order.id}</DialogDescription></DialogHeader>
                                                        <div className="py-4 border rounded-xl bg-muted/10 px-4">
                                                            <DetailRow label="User ID" value={order.userId} />
                                                            <DetailRow label="Status" value={getStatusBadge(order.status)} />
                                                            <DetailRow label="USDT Amount" value={`${order.usdtAmount} USDT`} />
                                                            <DetailRow label="INR Amount" value={`₹${order.inrAmount}`} />
                                                            <DetailRow label="Network" value={order.network} />
                                                            <DetailRow label="Payment Mode" value={order.paymentMode} />
                                                            <DetailRow label="User Email" value={order.email} />
                                                            <DetailRow label="Payment Receipt" value={order.paymentReceiptUrl ? <a href={order.paymentReceiptUrl} target="_blank" className="text-primary hover:underline font-bold">Open Attached Document</a> : 'No Document Provided'} />
                                                        </div>
                                                        <DialogFooter className="gap-2">
                                                            <Button variant="destructive" size="sm" onClick={() => handleStatusUpdate('buyOrders', order.id, 'failed')} disabled={actionLoading === order.id}><XCircle className="mr-2 h-4 w-4" /> Reject Order</Button>
                                                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusUpdate('buyOrders', order.id, 'completed', order.userId, order.usdtAmount)} disabled={actionLoading === order.id}><CheckCircle2 className="mr-2 h-4 w-4" /> Approve & Credit</Button>
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
                        <ScrollArea className="h-[60vh]">
                           <Table>
                                <TableHeader className="bg-muted/50"><TableRow><TableHead>Date</TableHead><TableHead>ID / User</TableHead><TableHead>Status</TableHead><TableHead>Amount</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredSellOrders.map(order => (
                                        <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="text-[10px] whitespace-nowrap">{order.createdAt ? format(new Date(order.createdAt), 'PPp') : 'N/A'}</TableCell>
                                            <TableCell>
                                                <div className="text-xs font-bold font-mono">{order.id}</div>
                                                <div className="text-[10px] text-muted-foreground">{order.email}</div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                                            <TableCell>
                                                <div className="font-black text-destructive">{order.usdtAmount} USDT</div>
                                                <div className="text-[10px] text-muted-foreground">₹{order.inrAmount}</div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8 gap-2"><Eye className="h-4 w-4" /> View</Button></DialogTrigger>
                                                    <DialogContent className="max-w-2xl">
                                                        <DialogHeader><DialogTitle>Sell Order Processing</DialogTitle><DialogDescription>ID: {order.id}</DialogDescription></DialogHeader>
                                                        <div className="py-4 border rounded-xl bg-muted/10 px-4">
                                                            <DetailRow label="User Email" value={order.email} />
                                                            <DetailRow label="Status" value={getStatusBadge(order.status)} />
                                                            <DetailRow label="Payment Mode" value={order.paymentMode} />
                                                            {order.paymentMode === 'UPI' ? (
                                                                <>
                                                                    <DetailRow label="UPI ID" value={order.upiId} />
                                                                    <DetailRow label="Holder" value={order.upiHolderName} />
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <DetailRow label="Bank Name" value={order.bankName} />
                                                                    <DetailRow label="A/C Number" value={order.accountNumber} />
                                                                    <DetailRow label="IFSC Code" value={order.ifsc} />
                                                                    <DetailRow label="Account Holder" value={order.bankHolderName} />
                                                                </>
                                                            )}
                                                            <DetailRow label="USDT Deduct" value={`${order.usdtAmount} USDT`} />
                                                            <DetailRow label="Pay User" value={<span className="text-green-600 font-black">₹{order.inrAmount}</span>} />
                                                        </div>
                                                        <DialogFooter className="gap-2">
                                                            <Button variant="outline" size="sm" onClick={() => handleStatusUpdate('sellOrders', order.id, 'failed')} disabled={actionLoading === order.id}>Reject</Button>
                                                            <Button size="sm" onClick={() => handleStatusUpdate('sellOrders', order.id, 'completed')} disabled={actionLoading === order.id}><CheckCircle2 className="mr-2 h-4 w-4" /> Confirm Payment Sent</Button>
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
                        <ScrollArea className="h-[60vh]">
                            <Table>
                                <TableHeader className="bg-muted/50"><TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredDeposits.map(dep => (
                                        <TableRow key={dep.id}>
                                            <TableCell className="text-[10px]">{dep.createdAt ? format(new Date(dep.createdAt), 'PPp') : 'N/A'}</TableCell>
                                            <TableCell className="font-black text-green-600">{dep.amount} USDT</TableCell>
                                            <TableCell>{getStatusBadge(dep.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8 gap-2"><Eye className="h-4 w-4" /> Inspect</Button></DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader><DialogTitle>Deposit Verification</DialogTitle></DialogHeader>
                                                        <div className="space-y-2 py-4 border rounded-xl bg-muted/10 px-4 text-sm">
                                                            <DetailRow label="User ID" value={dep.userId} />
                                                            <DetailRow label="Network" value={dep.network} />
                                                            <DetailRow label="TXID Hash" value={<span className="font-mono text-xs break-all text-primary">{dep.txHash || 'Pending Submission'}</span>} />
                                                            <DetailRow label="Amount" value={`${dep.amount} USDT`} />
                                                        </div>
                                                        <DialogFooter className="gap-2">
                                                            <Button variant="outline" size="sm" onClick={() => handleStatusUpdate('deposits', dep.id, 'failed')} disabled={actionLoading === dep.id}>Reject</Button>
                                                            <Button size="sm" className="bg-primary" onClick={() => handleStatusUpdate('deposits', dep.id, 'completed', dep.userId, dep.amount)} disabled={actionLoading === dep.id}>Approve & Credit</Button>
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
                        <ScrollArea className="h-[60vh]">
                            <Table>
                                <TableHeader className="bg-muted/50"><TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Network</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredWithdrawals.map(wd => (
                                        <TableRow key={wd.id}>
                                            <TableCell className="text-[10px]">{wd.createdAt ? format(new Date(wd.createdAt), 'PPp') : 'N/A'}</TableCell>
                                            <TableCell className="font-black text-destructive">{wd.amount} USDT</TableCell>
                                            <TableCell><Badge variant="outline">{wd.network}</Badge></TableCell>
                                            <TableCell>{getStatusBadge(wd.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8 gap-2"><Eye className="h-4 w-4" /> Details</Button></DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader><DialogTitle>Withdrawal Request</DialogTitle></DialogHeader>
                                                        <div className="py-4 border rounded-xl bg-muted/10 px-4 text-sm">
                                                            <DetailRow label="User ID" value={wd.userId} />
                                                            <DetailRow label="Recipient" value={<span className="font-mono text-xs break-all text-destructive">{wd.address}</span>} />
                                                            <DetailRow label="Network" value={wd.network} />
                                                            <DetailRow label="Amount" value={`${wd.amount} USDT`} />
                                                        </div>
                                                        <DialogFooter className="gap-2">
                                                            <Button variant="destructive" size="sm" onClick={() => handleStatusUpdate('withdrawals', wd.id, 'failed', wd.userId, wd.amount)} disabled={actionLoading === wd.id}>Reject & Refund</Button>
                                                            <Button size="sm" className="bg-primary" onClick={() => handleStatusUpdate('withdrawals', wd.id, 'completed')} disabled={actionLoading === wd.id}>Confirm Sent</Button>
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
                         <ScrollArea className="h-[60vh]">
                           <Table>
                                <TableHeader className="bg-muted/50"><TableRow><TableHead>Date</TableHead><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredMessages.map(msg => (
                                        <TableRow key={msg.id}>
                                            <TableCell className="text-[10px]">{msg.submittedAt ? format(new Date(msg.submittedAt), 'PPp') : 'N/A'}</TableCell>
                                            <TableCell className="font-bold">{msg.name}</TableCell>
                                            <TableCell className="text-xs">{msg.email}</TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button></DialogTrigger>
                                                    <DialogContent className="max-w-2xl">
                                                        <DialogHeader><DialogTitle>Message from {msg.name}</DialogTitle><DialogDescription>{msg.email}</DialogDescription></DialogHeader>
                                                        <div className="p-6 bg-muted/20 rounded-xl border-2 border-dashed">
                                                            <p className="whitespace-pre-wrap text-sm italic">"{msg.description}"</p>
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
                        <ScrollArea className="h-[60vh]">
                            <Table>
                                <TableHeader className="bg-muted/50"><TableRow><TableHead>Joined</TableHead><TableHead>Name</TableHead><TableHead>Balance</TableHead><TableHead className="hidden md:table-cell">Email</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredUsers.map(u => (
                                        <TableRow key={u.id} className="hover:bg-muted/30">
                                            <TableCell className="text-[10px]">{u.createdAt ? format(new Date(u.createdAt), 'PPp') : 'N/A'}</TableCell>
                                            <TableCell className="font-black">{u.name}</TableCell>
                                            <TableCell className="font-bold text-primary">{(u.balance || 0).toLocaleString()} USDT</TableCell>
                                            <TableCell className="hidden md:table-cell text-xs font-mono">{u.email}</TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8 gap-2"><UserIcon className="h-4 w-4" /> Profile</Button></DialogTrigger>
                                                    <DialogContent className="max-w-md">
                                                        <DialogHeader>
                                                            <div className="flex items-center gap-4 mb-2">
                                                                <div className="p-3 bg-primary/10 rounded-full"><UserIcon className="h-6 w-6 text-primary" /></div>
                                                                <div>
                                                                    <DialogTitle>{u.name}</DialogTitle>
                                                                    <DialogDescription>Account Overview</DialogDescription>
                                                                </div>
                                                            </div>
                                                        </DialogHeader>
                                                        <div className="space-y-1 py-4">
                                                            <DetailRow label="Internal UID" value={u.userId} />
                                                            <DetailRow label="Email Address" value={<div className="flex items-center gap-2"><Mail className="h-3 w-3" /> {u.email}</div>} />
                                                            <DetailRow label="Phone Number" value={<div className="flex items-center gap-2"><Phone className="h-3 w-3" /> {u.phone}</div>} />
                                                            <DetailRow label="Wallet Balance" value={<div className="flex items-center gap-2 font-black text-primary text-lg"><Wallet className="h-4 w-4" /> {u.balance || 0} USDT</div>} />
                                                            <DetailRow label="Registration" value={<div className="flex items-center gap-2"><Calendar className="h-3 w-3" /> {u.createdAt ? format(new Date(u.createdAt), 'PPP') : 'N/A'}</div>} />
                                                            <DetailRow label="Recovery Question" value={<span className="italic">"{u.securityQuestion}"</span>} />
                                                            <DetailRow label="Recovery Answer" value={<span className="font-mono text-primary font-bold">{u.securityAnswer}</span>} />
                                                        </div>
                                                        <DialogFooter>
                                                            <Button variant="outline" className="w-full" onClick={() => toast({ title: "Admin Note", description: "Password resets are managed via the recovery flow." })}>Close Inspection</Button>
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
