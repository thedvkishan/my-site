'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, doc, updateDoc, increment, addDoc, orderBy, setDoc, arrayUnion } from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
    Loader2, 
    Eye, 
    Search, 
    User as UserIcon, 
    Mail, 
    Phone, 
    Wallet, 
    Hash, 
    ArrowUpRight, 
    ShieldAlert, 
    Lock, 
    Unlock, 
    Plus, 
    Minus, 
    ArrowDownCircle, 
    ArrowUpCircle, 
    TrendingUp, 
    TrendingDown,
    Zap,
    History,
    MessageSquare,
    Users,
    Filter,
    UserPlus,
    KeyRound,
    ShieldQuestion,
    ClipboardPen,
    MessageCircle,
    NotebookText
} from "lucide-react";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { SECURITY_QUESTIONS } from '@/lib/schemas';

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="grid grid-cols-[100px_1fr] md:grid-cols-[160px_1fr] items-start gap-4 py-2.5 border-b border-muted/50 last:border-0">
        <span className="text-muted-foreground text-left text-[10px] md:text-xs font-bold uppercase tracking-wider">{label}</span>
        <div className="font-semibold break-words text-xs md:text-sm">{value || 'N/A'}</div>
    </div>
);

const PENDING_STATUSES = [
    'pending_payment', 
    'payment_processing', 
    'waiting_confirmation', 
    'pending_deposit', 
    'pending_hash', 
    'pending'
];

const SETTLED_STATUSES = ['completed', 'failed', 'expired'];

export function AdminDataView() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [approvedAmount, setApprovedAmount] = useState<string>("");
    const [balanceAdjustment, setBalanceAdjustment] = useState<string>("");
    const [adminRemark, setAdminRemark] = useState("");
    const [transactionRemark, setTransactionRemark] = useState("");
    
    // New User Form State
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        initialBalance: '0',
        securityQuestion: '',
        securityAnswer: ''
    });

    const buyOrdersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'buyOrders'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const sellOrdersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'sellOrders'), orderBy('createdAt', 'desc'));
    }, [firestore]);
    
    const depositsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'deposits'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const withdrawalsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'withdrawals'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const contactMessagesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'contactMessages'), orderBy('submittedAt', 'desc'));
    }, [firestore]);

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: buyOrders, isLoading: buyOrdersLoading } = useCollection(buyOrdersQuery);
    const { data: sellOrders, isLoading: sellOrdersLoading } = useCollection(sellOrdersQuery);
    const { data: deposits, isLoading: depositsLoading } = useCollection(depositsQuery);
    const { data: withdrawals, isLoading: withdrawalsLoading } = useCollection(withdrawalsQuery);
    const { data: contactMessages, isLoading: messagesLoading } = useCollection(contactMessagesQuery);
    const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
    
    const isMainLoading = buyOrdersLoading || sellOrdersLoading || depositsLoading || withdrawalsLoading;

    const filterBySearch = (data: any[]) => {
        if (!searchQuery.trim()) return data;
        const q = searchQuery.toLowerCase();
        return data.filter(item => {
            if (item.id && item.id.toLowerCase().includes(q)) return true;
            return Object.values(item).some(val => 
                val !== null && val !== undefined && String(val).toLowerCase().includes(q)
            );
        });
    };

    const buyPending = useMemo(() => filterBySearch((buyOrders || []).filter(o => PENDING_STATUSES.includes(o.status))), [buyOrders, searchQuery]);
    const buySettled = useMemo(() => filterBySearch((buyOrders || []).filter(o => SETTLED_STATUSES.includes(o.status))), [buyOrders, searchQuery]);

    const sellPending = useMemo(() => filterBySearch((sellOrders || []).filter(o => PENDING_STATUSES.includes(o.status))), [sellOrders, searchQuery]);
    const sellSettled = useMemo(() => filterBySearch((sellOrders || []).filter(o => SETTLED_STATUSES.includes(o.status))), [sellOrders, searchQuery]);

    const depositsPending = useMemo(() => filterBySearch((deposits || []).filter(o => PENDING_STATUSES.includes(o.status))), [deposits, searchQuery]);
    const depositsSettled = useMemo(() => filterBySearch((deposits || []).filter(o => SETTLED_STATUSES.includes(o.status))), [deposits, searchQuery]);

    const withdrawalsPending = useMemo(() => filterBySearch((withdrawals || []).filter(o => PENDING_STATUSES.includes(o.status))), [withdrawals, searchQuery]);
    const withdrawalsSettled = useMemo(() => filterBySearch((withdrawals || []).filter(o => SETTLED_STATUSES.includes(o.status))), [withdrawals, searchQuery]);

    const filteredMessages = useMemo(() => filterBySearch(contactMessages || []), [contactMessages, searchQuery]);
    const filteredUsers = useMemo(() => filterBySearch(users || []), [users, searchQuery]);

    const createNotification = async (userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
        if (!firestore) return;
        const notifRef = collection(firestore, 'users', userId, 'notifications');
        await addDoc(notifRef, {
            userId,
            title,
            message,
            type,
            read: false,
            createdAt: new Date().toISOString()
        });
    };

    const handleStatusUpdate = async (type: string, id: string, status: string, userId?: string, amount?: number, overrideAmount?: number) => {
        if (!firestore) return;
        setActionLoading(id);
        
        const collName = type === 'buy' ? 'buyOrders' : type === 'sell' ? 'sellOrders' : type === 'deposit' ? 'deposits' : 'withdrawals';
        const finalAmount = overrideAmount !== undefined ? overrideAmount : amount;
        const remarkText = transactionRemark.trim() || "Institutional settlement protocol complete.";

        try {
            const orderRef = doc(firestore, collName, id);
            const updateData: any = { 
                status,
                adminRemark: remarkText,
                remarkDate: new Date().toISOString()
            };
            
            if (status === 'completed' && typeof finalAmount === 'number' && !isNaN(finalAmount)) {
                updateData.processedAmount = finalAmount;
            }

            await updateDoc(orderRef, updateData);

            if ((type === 'withdrawal' || type === 'sell') && userId && typeof amount === 'number' && typeof finalAmount === 'number') {
                const userRef = doc(firestore, 'users', userId);
                const typeLabel = type === 'withdrawal' ? 'Withdrawal' : 'Sell Order';

                if (status === 'failed') {
                    await updateDoc(userRef, { balance: increment(amount) });
                    await createNotification(userId, `${typeLabel} Returned`, `${amount.toLocaleString()} USDT has been returned to your clearing balance. Reason: ${remarkText}`, 'error');
                } else if (status === 'completed') {
                    if (finalAmount < amount) {
                        const refundDiff = amount - finalAmount;
                        await updateDoc(userRef, { balance: increment(refundDiff) });
                        await createNotification(userId, `${typeLabel} Adjustment`, `${refundDiff.toLocaleString()} USDT has been returned to your balance (Volume adjusted by protocol). Reason: ${remarkText}`, 'info');
                    }
                    await createNotification(userId, `${typeLabel} Finalized`, `Your ${typeLabel.toLowerCase()} request has been successfully processed. Note: ${remarkText}`, 'success');
                }
            } else if (userId) {
                const displayType = type.charAt(0).toUpperCase() + type.slice(1);
                const colorType = status === 'completed' ? 'success' : status === 'failed' ? 'error' : 'info';
                
                await createNotification(
                    userId, 
                    `${displayType} Confirmed`,
                    `Your ${displayType} order #${id.slice(-6)} has been ${status}. Note: ${remarkText}`,
                    colorType
                );
            }

            if ((type === 'deposit' || type === 'buy') && status === 'completed' && userId && typeof finalAmount === 'number') {
                const userRef = doc(firestore, 'users', userId);
                await updateDoc(userRef, { balance: increment(finalAmount) });
                await createNotification(userId, 'Balance Credited', `${finalAmount.toLocaleString()} USDT has been added to your clearing balance. Note: ${remarkText}`, 'success');
            }

            toast({ title: 'Status Updated', description: `Transaction marked as ${status}.` });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update transaction status.' });
        } finally {
            setActionLoading(null);
            setApprovedAmount(""); 
            setTransactionRemark("");
        }
    };

    const handleUserAction = async (userId: string, action: 'status' | 'balance', value: any) => {
        if (!firestore) return;
        setActionLoading(userId);
        const remarkText = adminRemark.trim() || "Institutional protocol adjustment.";
        
        try {
            const userRef = doc(firestore, 'users', userId);
            const actionLabel = action === 'status' ? `Status: ${value}` : `Balance: ${value} ${balanceAdjustment} USDT`;
            
            const remarkEntry = {
                remark: remarkText,
                action: actionLabel,
                date: new Date().toISOString()
            };

            const updateData: any = {
                lastRemark: remarkText,
                lastRemarkDate: new Date().toISOString(),
                remarksHistory: arrayUnion(remarkEntry)
            };

            if (action === 'status') {
                updateData.status = value;
                const statusDisplay = value === 'on_hold' ? 'On Hold' : value === 'active' ? 'Active' : 'Banned';
                const statusType = value === 'banned' ? 'error' : value === 'on_hold' ? 'warning' : 'success';
                await createNotification(userId, 'Security Status Updated', `Your account status is now ${statusDisplay}. Reason: ${remarkText}`, statusType);
                toast({ title: 'Status Updated', description: `User is now ${value}. Remark saved to history.` });
            } else if (action === 'balance') {
                const amount = parseFloat(balanceAdjustment);
                if (isNaN(amount)) throw new Error("Invalid amount");
                
                updateData.balance = increment(value === 'add' ? amount : -amount);
                await createNotification(
                    userId, 
                    value === 'add' ? 'Balance Adjusted (Credit)' : 'Balance Adjusted (Debit)', 
                    `${amount.toLocaleString()} USDT has been ${value === 'add' ? 'credited to' : 'debited from'} your clearing account. Reason: ${remarkText}`,
                    value === 'add' ? 'success' : 'info'
                );
                toast({ title: 'Balance Updated', description: `Balance adjusted by ${amount} USDT. Remark saved to history.` });
                setBalanceAdjustment("");
            }

            await updateDoc(userRef, updateData);
            setAdminRemark(""); // Clear remark after success
        } catch (error: any) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Action Failed', description: error.message || 'Could not perform action.' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreateUser = async () => {
        const { email, password, name, phone, initialBalance, securityQuestion, securityAnswer } = newUser;
        if (!email || !password || !name || !securityQuestion || !securityAnswer) {
            toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill in all required user fields.' });
            return;
        }

        setActionLoading('creating-user');
        try {
            // Institutional Protocol: Create Auth User without signing out current Admin
            const secondaryApp = initializeApp(firebaseConfig, 'InstitutionalRegistration');
            const secondaryAuth = getAuth(secondaryApp);
            
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const user = userCredential.user;

            await setDoc(doc(firestore, 'users', user.uid), {
                userId: user.uid,
                name,
                email,
                phone,
                balance: parseFloat(initialBalance) || 0,
                securityQuestion,
                securityAnswer: securityAnswer.toLowerCase().trim(),
                createdAt: new Date().toISOString(),
                status: 'active',
                remarksHistory: [{
                    remark: "Initial account provisioning.",
                    action: "Account Created",
                    date: new Date().toISOString()
                }]
            });

            toast({ title: 'User Provisioned', description: `Account for ${name} has been successfully created.` });
            setIsCreateDialogOpen(false);
            setNewUser({ name: '', email: '', phone: '', password: '', initialBalance: '0', securityQuestion: '', securityAnswer: '' });
        } catch (error: any) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Provisioning Failed', description: error.message || 'Could not create institutional account.' });
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return <Badge className="bg-green-500 text-white border-0">Completed</Badge>;
            case 'payment_processing': return <Badge className="bg-blue-500 text-white border-0">Processing</Badge>;
            case 'waiting_confirmation': return <Badge className="bg-yellow-500 text-yellow-950 border-0">Verifying</Badge>;
            case 'pending_payment':
            case 'pending_deposit':
            case 'pending_hash': return <Badge variant="outline">Pending</Badge>;
            case 'expired':
            case 'failed': return <Badge variant="destructive">{status}</Badge>;
            case 'active': return <Badge className="bg-green-500 text-white">Active</Badge>;
            case 'banned': return <Badge variant="destructive">Banned</Badge>;
            case 'on_hold': return <Badge className="bg-orange-500 text-white">Hold</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const renderTransactionRow = (order: any, category: 'buy' | 'sell' | 'deposit' | 'withdrawal') => (
        <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
            <TableCell>
                <div className="flex items-center gap-2">
                    <div className="text-[10px] font-black font-mono text-muted-foreground"><Hash className="h-2 w-2 inline" /> {order.id.slice(-6)}</div>
                    {getStatusBadge(order.status)}
                </div>
                <div className="text-[10px] text-muted-foreground font-medium truncate max-w-[120px] mt-1">{order.email || order.userId?.slice(-8)}</div>
            </TableCell>
            <TableCell>
                <div className={cn(
                    "font-black text-xs",
                    (category === 'buy' || category === 'deposit') ? "text-primary" : "text-destructive"
                )}>
                    {(category === 'buy' || category === 'deposit') ? '+' : '-'}{order.usdtAmount || order.amount} USDT
                </div>
                {order.inrAmount && <div className="text-[9px] text-muted-foreground font-bold">₹{order.inrAmount.toLocaleString()}</div>}
            </TableCell>
            <TableCell className="text-right">
                <Dialog onOpenChange={(open) => {
                    if (open) {
                        setApprovedAmount(String(order.usdtAmount || order.amount));
                        setTransactionRemark("");
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl mx-4">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black uppercase flex items-center gap-2">
                                {category.toUpperCase()} Protocol Details
                            </DialogTitle>
                            <DialogDescription className="text-xs">Transaction ID: {order.id}</DialogDescription>
                        </DialogHeader>
                        
                        <ScrollArea className="max-h-[65vh] py-4 pr-4">
                            <div className="border-2 border-dashed rounded-xl bg-muted/10 px-4 py-2 space-y-0.5">
                                <DetailRow label="Protocol Status" value={getStatusBadge(order.status)} />
                                <DetailRow label="Created At" value={order.createdAt ? format(new Date(order.createdAt), 'PPp') : 'N/A'} />
                                <DetailRow label="User Context" value={order.email || order.userId} />
                                <DetailRow label="Volume" value={<span className="font-black">{(order.usdtAmount || order.amount).toLocaleString()} USDT</span>} />
                                
                                {category === 'buy' && (
                                    <>
                                        <DetailRow label="Bank Amount" value={<span className="text-primary font-black">₹{order.inrAmount?.toLocaleString()}</span>} />
                                        <DetailRow label="Method" value={order.paymentMode} />
                                        <DetailRow label="Receipt Proof" value={order.paymentReceiptUrl ? (
                                            <div className="space-y-3 pt-1">
                                                <a href={order.paymentReceiptUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold flex items-center gap-2 text-xs bg-primary/10 w-fit px-3 py-1.5 rounded-full">
                                                    Open Original Proof <ArrowUpRight className="h-3.5 w-3.5" />
                                                </a>
                                                {order.paymentReceiptUrl.startsWith('data:image') && (
                                                    <div className="relative w-full mt-2 border-2 border-primary/20 rounded-xl overflow-hidden bg-white shadow-inner p-2">
                                                        <img src={order.paymentReceiptUrl} alt="Receipt Preview" className="max-w-full h-auto max-h-[400px] mx-auto" />
                                                    </div>
                                                )}
                                            </div>
                                        ) : <span className="text-muted-foreground italic">No receipt submitted</span>} />
                                    </>
                                )}

                                {category === 'sell' && (
                                    <>
                                        <DetailRow label="Settlement" value={<span className="text-destructive font-black text-lg">₹{order.inrAmount?.toLocaleString()}</span>} />
                                        <DetailRow label="Method" value={<Badge variant="secondary" className="font-bold text-[10px]">{order.paymentMode}</Badge>} />
                                        {order.paymentMode === 'UPI' ? (
                                            <>
                                                <DetailRow label="UPI ID" value={order.upiId} />
                                                <DetailRow label="Holder Name" value={order.upiHolderName} />
                                            </>
                                        ) : (
                                            <>
                                                <DetailRow label="Bank Name" value={order.bankName} />
                                                <DetailRow label="Account No" value={<span className="font-mono text-[10px]">{order.accountNumber}</span>} />
                                                <DetailRow label="IFSC Code" value={<span className="font-mono text-[10px]">{order.ifsc}</span>} />
                                                <DetailRow label="Holder" value={order.bankHolderName} />
                                            </>
                                        )}
                                    </>
                                )}

                                {category === 'deposit' && (
                                    <>
                                        <DetailRow label="Network" value={order.network} />
                                        <DetailRow label="TXID Hash" value={<span className="font-mono text-[10px] break-all text-primary font-bold">{order.txHash || 'Awaiting Submission'}</span>} />
                                    </>
                                )}

                                {category === 'withdrawal' && (
                                    <>
                                        <DetailRow label="Recipient" value={<span className="font-mono text-[10px] break-all text-destructive font-bold">{order.address}</span>} />
                                        <DetailRow label="Network" value={order.network} />
                                    </>
                                )}

                                {order.adminRemark && (
                                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 mt-4 space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary">
                                            <NotebookText className="h-3 w-3" /> Audit Remark
                                        </div>
                                        <p className="text-xs font-medium italic text-muted-foreground">"{order.adminRemark}"</p>
                                        {order.remarkDate && (
                                            <p className="text-[8px] text-right font-mono opacity-50">LOGGED: {format(new Date(order.remarkDate), 'dd MMM yyyy HH:mm')}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        {!SETTLED_STATUSES.includes(order.status) && (
                            <>
                                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-4 mt-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider">Final Approved Volume</Label>
                                        <div className="relative">
                                            <Input 
                                                type="number" 
                                                value={approvedAmount} 
                                                onChange={(e) => setApprovedAmount(e.target.value)}
                                                className="font-black text-lg border-primary/30"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary">USDT</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider">Action Protocol Remark</Label>
                                        <Input 
                                            placeholder="Reason for approval/rejection (Saved to Audit)" 
                                            className="h-10 text-xs border-primary/30"
                                            value={transactionRemark}
                                            onChange={(e) => setTransactionRemark(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter className="flex-row gap-2 mt-4">
                                    <Button variant="outline" className="flex-1 font-bold text-xs h-10" onClick={() => handleStatusUpdate(category, order.id, 'failed', order.userId, order.usdtAmount || order.amount)} disabled={actionLoading === order.id}>Reject & Refund</Button>
                                    <Button className="flex-1 bg-primary font-bold text-xs h-10" onClick={() => handleStatusUpdate(category, order.id, 'completed', order.userId, order.usdtAmount || order.amount, parseFloat(approvedAmount))} disabled={actionLoading === order.id}>Confirm & Complete</Button>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            </TableCell>
        </TableRow>
    );

    const renderSubTabs = (pendingData: any[], settledData: any[], category: 'buy' | 'sell' | 'deposit' | 'withdrawal') => (
        <Tabs defaultValue="pending" className="w-full">
            <div className="flex justify-start px-4 border-b bg-muted/5">
                <TabsList className="bg-transparent h-auto p-0 border-b-0">
                    <TabsTrigger value="pending" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 font-bold text-[10px] uppercase tracking-wider">
                        Pending Actions ({pendingData.length})
                    </TabsTrigger>
                    <TabsTrigger value="settled" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 font-bold text-[10px] uppercase tracking-wider">
                        Settled Archives ({settledData.length})
                    </TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="pending" className="m-0">
                <ScrollArea className="h-[60vh]">
                    <Table>
                        <TableHeader className="bg-muted/50"><TableRow><TableHead className="text-[10px] font-bold uppercase">Reference / Status</TableHead><TableHead className="text-[10px] font-bold uppercase">Volume</TableHead><TableHead className="text-right text-[10px] font-bold uppercase">View</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {pendingData.length === 0 ? (
                                <TableRow><TableCell colSpan={3} className="text-center py-24 text-muted-foreground font-medium italic">No pending {category} orders found.</TableCell></TableRow>
                            ) : pendingData.map(o => renderTransactionRow(o, category))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </TabsContent>
            <TabsContent value="settled" className="m-0">
                <ScrollArea className="h-[60vh]">
                    <Table>
                        <TableHeader className="bg-muted/50"><TableRow><TableHead className="text-[10px] font-bold uppercase">Reference / Status</TableHead><TableHead className="text-[10px] font-bold uppercase">Volume</TableHead><TableHead className="text-right text-[10px] font-bold uppercase">View</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {settledData.length === 0 ? (
                                <TableRow><TableCell colSpan={3} className="text-center py-24 text-muted-foreground font-medium italic">Archive is empty.</TableCell></TableRow>
                            ) : settledData.map(o => renderTransactionRow(o, category))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </TabsContent>
        </Tabs>
    );

    return (
        <Card className="overflow-hidden border-2 shadow-lg">
            <CardHeader className="p-4 md:p-6 bg-muted/30 border-b">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <CardTitle className="text-xl md:text-2xl font-black tracking-tight">Terminal Control Center</CardTitle>
                        <CardDescription className="text-xs md:text-sm">
                            Granular monitoring of all settlement protocols.
                        </CardDescription>
                    </div>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search ID, Email, Hash, Name..." 
                            className="pl-10 h-10 border-primary/20 shadow-sm focus:ring-primary/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Tabs defaultValue="buy" className="w-full">
                    <div className="border-b bg-muted/10">
                        <ScrollArea className="w-full whitespace-nowrap">
                            <TabsList className="flex w-full justify-start h-auto p-2 bg-transparent border-b-0 gap-2">
                                <TabsTrigger value="buy" className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md font-bold text-[10px] uppercase tracking-wider flex items-center gap-2">
                                    <TrendingUp className="h-3 w-3" /> Buy Protocol ({buyPending.length})
                                </TabsTrigger>
                                <TabsTrigger value="sell" className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md font-bold text-[10px] uppercase tracking-wider flex items-center gap-2">
                                    <TrendingDown className="h-3 w-3" /> Liquidation Hub ({sellPending.length})
                                </TabsTrigger>
                                <TabsTrigger value="deposit" className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md font-bold text-[10px] uppercase tracking-wider flex items-center gap-2">
                                    <ArrowDownCircle className="h-3 w-3" /> Wallet Credit ({depositsPending.length})
                                </TabsTrigger>
                                <TabsTrigger value="withdrawal" className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md font-bold text-[10px] uppercase tracking-wider flex items-center gap-2">
                                    <ArrowUpCircle className="h-3 w-3" /> Wallet Debit ({withdrawalsPending.length})
                                </TabsTrigger>
                                <TabsTrigger value="contact" className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md font-bold text-[10px] uppercase tracking-wider flex items-center gap-2">
                                    <MessageSquare className="h-3 w-3" /> Tickets ({filteredMessages.length})
                                </TabsTrigger>
                                <TabsTrigger value="users" className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md font-bold text-[10px] uppercase tracking-wider flex items-center gap-2">
                                    <Users className="h-3 w-3" /> Users ({filteredUsers.length})
                                </TabsTrigger>
                            </TabsList>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </div>
                    
                    {isMainLoading && <div className="flex justify-center items-center py-24"><Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" /></div>}
                    
                    <TabsContent value="buy" className="m-0">{renderSubTabs(buyPending, buySettled, 'buy')}</TabsContent>
                    <TabsContent value="sell" className="m-0">{renderSubTabs(sellPending, sellSettled, 'sell')}</TabsContent>
                    <TabsContent value="deposit" className="m-0">{renderSubTabs(depositsPending, depositsSettled, 'deposit')}</TabsContent>
                    <TabsContent value="withdrawal" className="m-0">{renderSubTabs(withdrawalsPending, withdrawalsSettled, 'withdrawal')}</TabsContent>
                    
                    <TabsContent value="contact" className="m-0">
                         <ScrollArea className="h-[65vh]">
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
                        <div className="p-4 border-b bg-muted/5 flex justify-between items-center">
                            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Provisioned Accounts</h3>
                            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest gap-2">
                                        <UserPlus className="h-3.5 w-3.5" /> Provision New User
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg mx-4">
                                    <DialogHeader>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-3 bg-primary/10 rounded-xl"><UserPlus className="h-6 w-6 text-primary" /></div>
                                            <div>
                                                <DialogTitle className="text-xl font-black uppercase">Provision Account</DialogTitle>
                                                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-primary">Institutional Registration Protocol</DialogDescription>
                                            </div>
                                        </div>
                                    </DialogHeader>
                                    
                                    <ScrollArea className="max-h-[60vh] pr-4">
                                        <div className="space-y-4 py-2">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase">Full Name</Label>
                                                    <Input placeholder="Institutional Identity" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase">Email Address</Label>
                                                    <Input type="email" placeholder="identity@domain.com" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase">Phone (Optional)</Label>
                                                    <Input placeholder="+91..." value={newUser.phone} onChange={(e) => setNewUser({...newUser, phone: e.target.value})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase">Initial Balance (USDT)</Label>
                                                    <Input type="number" placeholder="0.00" value={newUser.initialBalance} onChange={(e) => setNewUser({...newUser, initialBalance: e.target.value})} />
                                                </div>
                                            </div>
                                            
                                            <div className="p-4 bg-muted/30 rounded-xl border border-dashed border-primary/20 space-y-4">
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary">
                                                    <KeyRound className="h-3 w-3" /> Security Configuration
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase">Access Password</Label>
                                                    <Input type="password" placeholder="Minimum 6 characters" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase">Recovery Question</Label>
                                                    <Select onValueChange={(v) => setNewUser({...newUser, securityQuestion: v})}>
                                                        <SelectTrigger><SelectValue placeholder="Select Protocol Question" /></SelectTrigger>
                                                        <SelectContent>
                                                            {SECURITY_QUESTIONS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase">Recovery Answer</Label>
                                                    <Input placeholder="Secret protocol answer" value={newUser.securityAnswer} onChange={(e) => setNewUser({...newUser, securityAnswer: e.target.value})} />
                                                </div>
                                            </div>
                                        </div>
                                    </ScrollArea>

                                    <DialogFooter className="mt-4">
                                        <Button variant="outline" className="flex-1 font-bold text-xs h-12" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                                        <Button className="flex-1 font-bold text-xs h-12 gap-2" onClick={handleCreateUser} disabled={actionLoading === 'creating-user'}>
                                            {actionLoading === 'creating-user' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldQuestion className="h-4 w-4" />}
                                            Provision Account
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <ScrollArea className="h-[60vh]">
                            <Table>
                                <TableHeader className="bg-muted/50"><TableRow><TableHead className="text-[10px] font-bold uppercase">Name / Joined</TableHead><TableHead className="text-[10px] font-bold uppercase">Balance</TableHead><TableHead className="text-right text-[10px] font-bold uppercase">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredUsers.map(u => (
                                        <TableRow key={u.id} className="hover:bg-muted/30">
                                            <TableCell>
                                                <div className="font-black text-[10px] uppercase truncate max-w-[100px]">{u.name}</div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[8px] font-mono text-muted-foreground">{u.createdAt ? format(new Date(u.createdAt), 'dd/MM/yy') : 'N/A'}</span>
                                                    {getStatusBadge(u.status || 'active')}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-black text-primary text-xs">{(u.balance || 0).toLocaleString()} <span className="text-[8px]">USDT</span></TableCell>
                                            <TableCell className="text-right">
                                                <Dialog onOpenChange={(open) => {
                                                    if (!open) {
                                                        setBalanceAdjustment("");
                                                        setAdminRemark("");
                                                    }
                                                }}>
                                                    <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8 w-8 p-0"><UserIcon className="h-4 w-4" /></Button></DialogTrigger>
                                                    <DialogContent className="max-w-2xl mx-4">
                                                        <DialogHeader>
                                                            <div className="flex items-center gap-4 mb-2">
                                                                <div className="p-3 bg-primary/10 rounded-xl"><UserIcon className="h-6 w-6 text-primary" /></div>
                                                                <div>
                                                                    <DialogTitle className="text-xl font-black">{u.name}</DialogTitle>
                                                                    <DialogDescription className="font-bold uppercase tracking-widest text-[8px] text-primary">Institutional Terminal Profile</DialogDescription>
                                                                </div>
                                                            </div>
                                                        </DialogHeader>
                                                        
                                                        <Tabs defaultValue="profile">
                                                            <TabsList className="grid w-full grid-cols-3 mb-4">
                                                                <TabsTrigger value="profile">Profile</TabsTrigger>
                                                                <TabsTrigger value="activity">Audit Log</TabsTrigger>
                                                                <TabsTrigger value="controls">Management</TabsTrigger>
                                                            </TabsList>
                                                            
                                                            <TabsContent value="profile" className="space-y-0.5 py-2 bg-muted/5 rounded-xl px-2">
                                                                <DetailRow label="UID" value={<span className="font-mono text-[10px]">{u.userId}</span>} />
                                                                <DetailRow label="Email" value={<div className="flex items-center gap-1 font-bold text-xs"><Mail className="h-3 w-3 text-muted-foreground" /> {u.email}</div>} />
                                                                <DetailRow label="Phone" value={<div className="flex items-center gap-1 font-bold text-xs"><Phone className="h-3 w-3 text-muted-foreground" /> {u.phone || 'N/A'}</div>} />
                                                                <DetailRow label="Balance" value={<div className="flex items-center gap-1 font-black text-primary text-lg"><Wallet className="h-4 w-4" /> {(u.balance || 0).toLocaleString()} USDT</div>} />
                                                                <DetailRow label="Status" value={getStatusBadge(u.status || 'active')} />
                                                                <DetailRow label="Joined" value={u.createdAt ? format(new Date(u.createdAt), 'PPp') : 'N/A'} />
                                                                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 mt-4 space-y-2">
                                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary">
                                                                        <MessageCircle className="h-3 w-3" /> Latest guidance
                                                                    </div>
                                                                    <p className="text-xs font-medium italic text-muted-foreground">
                                                                        {u.lastRemark ? `"${u.lastRemark}"` : 'No protocol remarks found.'}
                                                                    </p>
                                                                    {u.lastRemarkDate && (
                                                                        <p className="text-[8px] text-right font-mono opacity-50 uppercase">
                                                                            Logged: {format(new Date(u.lastRemarkDate), 'dd MMM yyyy HH:mm')}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </TabsContent>

                                                            <TabsContent value="activity">
                                                                <ScrollArea className="h-[45vh] border-2 border-dashed rounded-xl p-2 bg-muted/5">
                                                                    <div className="space-y-6">
                                                                        {/* Transaction Activity */}
                                                                        <div className="space-y-3">
                                                                            <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-primary border-b pb-1"><History className="h-3 w-3" /> Clearing Activity</h4>
                                                                            <div className="grid gap-2">
                                                                                {[
                                                                                    ...(buyOrders || []).filter(o => o.userId === u.userId).map(o => ({ ...o, type: 'Buy', icon: TrendingUp })),
                                                                                    ...(sellOrders || []).filter(o => o.userId === u.userId).map(o => ({ ...o, type: 'Sell', icon: TrendingDown })),
                                                                                    ...(deposits || []).filter(o => o.userId === u.userId).map(o => ({ ...o, type: 'Deposit', icon: ArrowDownCircle })),
                                                                                    ...(withdrawals || []).filter(o => o.userId === u.userId).map(o => ({ ...o, type: 'Withdrawal', icon: ArrowUpCircle })),
                                                                                ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((activity, idx) => (
                                                                                    <div key={idx} className="flex items-center justify-between p-3 bg-background border rounded-xl shadow-sm">
                                                                                        <div className="flex items-center gap-3">
                                                                                            <div className={cn(
                                                                                                "p-2 rounded-lg",
                                                                                                (activity.type === 'Buy' || activity.type === 'Deposit') ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"
                                                                                            )}>
                                                                                                <activity.icon className="h-3.5 w-3.5" />
                                                                                            </div>
                                                                                            <div>
                                                                                                <p className="text-[9px] font-black uppercase tracking-tight">{activity.type} Protocol</p>
                                                                                                <p className="text-[8px] font-mono text-muted-foreground">{activity.id.slice(-8)} • {format(new Date(activity.createdAt), 'dd/MM/yy HH:mm')}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="text-right">
                                                                                            <p className={cn(
                                                                                                "text-xs font-black",
                                                                                                (activity.type === 'Buy' || activity.type === 'Deposit') ? "text-green-600" : "text-destructive"
                                                                                            )}>
                                                                                                {(activity.type === 'Buy' || activity.type === 'Deposit') ? '+' : '-'}{(activity.usdtAmount || activity.amount).toLocaleString()} <span className="text-[8px]">USDT</span>
                                                                                            </p>
                                                                                            {getStatusBadge(activity.status)}
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>

                                                                        {/* Protocol Remarks History */}
                                                                        <div className="space-y-3">
                                                                            <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-primary border-b pb-1"><ShieldQuestion className="h-3 w-3" /> Protocol Action History</h4>
                                                                            <div className="grid gap-2">
                                                                                {(u.remarksHistory || []).slice().reverse().map((r: any, idx: number) => (
                                                                                    <div key={idx} className="p-3 bg-background border rounded-xl space-y-1.5 shadow-sm">
                                                                                        <div className="flex justify-between items-center">
                                                                                            <span className="text-[9px] font-black uppercase tracking-tight text-primary">{r.action}</span>
                                                                                            <span className="text-[8px] font-mono text-muted-foreground">{r.date ? format(new Date(r.date), 'dd/MM/yy HH:mm') : 'N/A'}</span>
                                                                                        </div>
                                                                                        <p className="text-xs font-medium italic text-muted-foreground">"{r.remark}"</p>
                                                                                    </div>
                                                                                ))}
                                                                                {(!u.remarksHistory || u.remarksHistory.length === 0) && (
                                                                                    <p className="text-center py-8 text-xs text-muted-foreground italic">No archival actions recorded.</p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </ScrollArea>
                                                            </TabsContent>
                                                            
                                                            <TabsContent value="controls" className="space-y-6 py-4">
                                                                <div className="p-4 border-2 border-primary/20 rounded-xl bg-primary/5 space-y-3">
                                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                                        <ClipboardPen className="h-3 w-3" /> Institutional Protocol Remark
                                                                    </Label>
                                                                    <Input 
                                                                        placeholder="Reason for change (Mandatory for Audit)" 
                                                                        className="h-10 text-xs border-primary/30"
                                                                        value={adminRemark}
                                                                        onChange={(e) => setAdminRemark(e.target.value)}
                                                                    />
                                                                    <p className="text-[8px] text-muted-foreground italic">This remark is mandatory and will be saved to the permanent audit trail.</p>
                                                                </div>

                                                                <div className="space-y-4 p-4 border-2 border-dashed rounded-xl bg-muted/10">
                                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Balance Adjustment Terminal</Label>
                                                                    <div className="flex gap-2">
                                                                        <div className="relative flex-grow">
                                                                            <Input 
                                                                                type="number" 
                                                                                placeholder="Amount" 
                                                                                className="font-black"
                                                                                value={balanceAdjustment}
                                                                                onChange={(e) => setBalanceAdjustment(e.target.value)}
                                                                            />
                                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-40">USDT</span>
                                                                        </div>
                                                                        <Button size="icon" variant="outline" onClick={() => handleUserAction(u.id, 'balance', 'add')} disabled={actionLoading === u.id || !balanceAdjustment || !adminRemark} title="Credit Account"><Plus className="h-4 w-4 text-green-600" /></Button>
                                                                        <Button size="icon" variant="outline" onClick={() => handleUserAction(u.id, 'balance', 'subtract')} disabled={actionLoading === u.id || !balanceAdjustment || !adminRemark} title="Debit Account"><Minus className="h-4 w-4 text-destructive" /></Button>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="space-y-4 p-4 border-2 border-dashed rounded-xl bg-muted/10">
                                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Account Status Protocol</Label>
                                                                    <div className="grid grid-cols-3 gap-2">
                                                                        <Button 
                                                                            variant={u.status === 'active' || !u.status ? 'default' : 'outline'} 
                                                                            className="text-[9px] font-black h-9 flex items-center gap-1"
                                                                            onClick={() => handleUserAction(u.id, 'status', 'active')}
                                                                            disabled={actionLoading === u.id || !adminRemark}
                                                                        >
                                                                            <Unlock className="h-3 w-3" /> ACTIVE
                                                                        </Button>
                                                                        <Button 
                                                                            variant={u.status === 'on_hold' ? 'default' : 'outline'} 
                                                                            className="text-[9px] font-black h-9 bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1"
                                                                            onClick={() => handleUserAction(u.id, 'status', 'on_hold')}
                                                                            disabled={actionLoading === u.id || !adminRemark}
                                                                        >
                                                                            <Lock className="h-3 w-3" /> HOLD
                                                                        </Button>
                                                                        <Button 
                                                                            variant={u.status === 'banned' ? 'destructive' : 'outline'} 
                                                                            className="text-[9px] font-black h-9 flex items-center gap-1"
                                                                            onClick={() => handleUserAction(u.id, 'status', 'banned')}
                                                                            disabled={actionLoading === u.id || !adminRemark}
                                                                        >
                                                                            <ShieldAlert className="h-3 w-3" /> BAN
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </TabsContent>
                                                        </Tabs>
                                                        
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
