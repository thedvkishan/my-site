
'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, User as UserIcon } from "lucide-react";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";

// Helper component to render details in a consistent way
const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="grid grid-cols-[160px_1fr] items-start gap-4">
        <span className="text-muted-foreground text-right">{label}</span>
        <div className="font-semibold break-words">{value}</div>
    </div>
);


export function AdminDataView() {
    const firestore = useFirestore();

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

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Submitted Data</CardTitle>
                <CardDescription>View all orders, wallet activity, messages, and registered users.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="buyOrders">
                    <TabsList className="grid w-full grid-cols-6 h-auto flex-wrap">
                        <TabsTrigger value="buyOrders">Buy</TabsTrigger>
                        <TabsTrigger value="sellOrders">Sell</TabsTrigger>
                        <TabsTrigger value="deposits">Deposits</TabsTrigger>
                        <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
                        <TabsTrigger value="contact">Messages</TabsTrigger>
                        <TabsTrigger value="users">Users</TabsTrigger>
                    </TabsList>
                    
                    {isLoading && <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}
                    
                    <TabsContent value="buyOrders">
                        <ScrollArea className="h-[60vh]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>USDT</TableHead>
                                        <TableHead>INR</TableHead>
                                        <TableHead>Email</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {buyOrders?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => (
                                        <Dialog key={order.id}>
                                            <DialogTrigger asChild>
                                                <TableRow className="cursor-pointer">
                                                    <TableCell className="text-xs">{format(new Date(order.createdAt), 'PPpp')}</TableCell>
                                                    <TableCell><Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>{order.status}</Badge></TableCell>
                                                    <TableCell>{order.usdtAmount}</TableCell>
                                                    <TableCell>{order.inrAmount}</TableCell>
                                                    <TableCell className="text-xs truncate max-w-[100px]">{order.email}</TableCell>
                                                </TableRow>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl">
                                                <DialogHeader>
                                                <DialogTitle>Buy Order Details</DialogTitle>
                                                <DialogDescription>Full information for transaction ID: {order.id}</DialogDescription>
                                                </DialogHeader>
                                                <ScrollArea className="max-h-[70vh] pr-6">
                                                    <div className="space-y-4 py-4 text-sm">
                                                        <DetailRow label="Status" value={<Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>{order.status}</Badge>} />
                                                        <DetailRow label="Created At" value={format(new Date(order.createdAt), 'PPpp')} />
                                                        <DetailRow label="USDT Amount" value={`${order.usdtAmount} USDT`} />
                                                        <DetailRow label="INR Amount" value={`₹${order.inrAmount.toLocaleString('en-IN')}`} />
                                                        <DetailRow label="Network" value={order.network} />
                                                        <DetailRow label="USDT Address" value={<span className="font-mono">{order.usdtAddress}</span>} />
                                                        <DetailRow label="Contact Email" value={order.email} />
                                                        <DetailRow label="Payment Receipt" value={
                                                            order.paymentReceiptUrl ? (
                                                                <Dialog>
                                                                <DialogTrigger asChild><Button variant="outline" size="sm">View Receipt</Button></DialogTrigger>
                                                                <DialogContent className="max-w-4xl h-[90vh]">
                                                                    <DialogHeader><DialogTitle>Receipt for Order {order.id}</DialogTitle></DialogHeader>
                                                                    {order.paymentReceiptUrl.startsWith('data:image') ? (
                                                                    <div className="relative h-full"><Image src={order.paymentReceiptUrl} alt="Receipt" fill style={{objectFit: 'contain'}} /></div>
                                                                    ) : (
                                                                    <iframe src={order.paymentReceiptUrl} className="w-full h-full"></iframe>
                                                                    )}
                                                                </DialogContent>
                                                                </Dialog>
                                                            ) : <span className="text-muted-foreground">N/A</span>
                                                        } />
                                                    </div>
                                                </ScrollArea>
                                            </DialogContent>
                                        </Dialog>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </TabsContent>
                    
                    <TabsContent value="sellOrders">
                        <ScrollArea className="h-[60vh]">
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>USDT</TableHead>
                                        <TableHead>INR</TableHead>
                                        <TableHead>Email</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sellOrders?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => (
                                        <Dialog key={order.id}>
                                            <DialogTrigger asChild>
                                                <TableRow className="cursor-pointer">
                                                    <TableCell className="text-xs">{format(new Date(order.createdAt), 'PPpp')}</TableCell>
                                                    <TableCell><Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>{order.status}</Badge></TableCell>
                                                    <TableCell>{order.usdtAmount}</TableCell>
                                                    <TableCell>{order.inrAmount}</TableCell>
                                                    <TableCell className="text-xs truncate max-w-[100px]">{order.email}</TableCell>
                                                </TableRow>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl">
                                                <DialogHeader><DialogTitle>Sell Order Details</DialogTitle><DialogDescription>Transaction ID: {order.id}</DialogDescription></DialogHeader>
                                                <ScrollArea className="max-h-[70vh] pr-6">
                                                     <div className="space-y-4 py-4 text-sm">
                                                        <DetailRow label="USDT Amount" value={`${order.usdtAmount} USDT`} />
                                                        <DetailRow label="INR Amount" value={`₹${order.inrAmount.toLocaleString('en-IN')}`} />
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
                                                            </>
                                                        )}
                                                        <DetailRow label="Contact Email" value={order.email} />
                                                    </div>
                                                </ScrollArea>
                                            </DialogContent>
                                        </Dialog>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="deposits">
                        <ScrollArea className="h-[60vh]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Hash</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deposits?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(dep => (
                                        <Dialog key={dep.id}>
                                            <DialogTrigger asChild>
                                                <TableRow className="cursor-pointer">
                                                    <TableCell className="text-xs">{format(new Date(dep.createdAt), 'PPpp')}</TableCell>
                                                    <TableCell><Badge variant={dep.status === 'completed' ? 'default' : 'secondary'}>{dep.status}</Badge></TableCell>
                                                    <TableCell>{dep.amount} USDT</TableCell>
                                                    <TableCell className="text-xs font-mono truncate max-w-[100px]">{dep.txHash || 'None'}</TableCell>
                                                </TableRow>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader><DialogTitle>Deposit Details</DialogTitle></DialogHeader>
                                                <div className="space-y-4 py-4 text-sm">
                                                    <DetailRow label="User ID" value={<span className="font-mono text-xs">{dep.userId}</span>} />
                                                    <DetailRow label="Status" value={<Badge>{dep.status}</Badge>} />
                                                    <DetailRow label="Amount" value={`${dep.amount} USDT`} />
                                                    <DetailRow label="Network" value={dep.network} />
                                                    <DetailRow label="TX Hash" value={<span className="font-mono text-xs break-all">{dep.txHash || 'N/A'}</span>} />
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="withdrawals">
                        <ScrollArea className="h-[60vh]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Address</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {withdrawals?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(wd => (
                                        <Dialog key={wd.id}>
                                            <DialogTrigger asChild>
                                                <TableRow className="cursor-pointer">
                                                    <TableCell className="text-xs">{format(new Date(wd.createdAt), 'PPpp')}</TableCell>
                                                    <TableCell><Badge variant={wd.status === 'completed' ? 'default' : 'secondary'}>{wd.status}</Badge></TableCell>
                                                    <TableCell>{wd.amount} USDT</TableCell>
                                                    <TableCell className="text-xs font-mono truncate max-w-[100px]">{wd.address}</TableCell>
                                                </TableRow>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader><DialogTitle>Withdrawal Details</DialogTitle></DialogHeader>
                                                <div className="space-y-4 py-4 text-sm">
                                                    <DetailRow label="User ID" value={<span className="font-mono text-xs">{wd.userId}</span>} />
                                                    <DetailRow label="Status" value={<Badge>{wd.status}</Badge>} />
                                                    <DetailRow label="Amount" value={`${wd.amount} USDT`} />
                                                    <DetailRow label="Network" value={wd.network} />
                                                    <DetailRow label="Recipient Address" value={<span className="font-mono text-xs break-all">{wd.address}</span>} />
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </TabsContent>
                    
                    <TabsContent value="contact">
                         <ScrollArea className="h-[60vh]">
                           <Table>
                                <TableHeader>
                                    <TableRow><TableHead>Date</TableHead><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Message</TableHead></TableRow>
                                </TableHeader>
                                <TableBody>
                                    {contactMessages?.slice().sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).map(msg => (
                                         <Dialog key={msg.id}>
                                            <DialogTrigger asChild><TableRow className="cursor-pointer"><TableCell className="text-xs">{format(new Date(msg.submittedAt), 'PPp')}</TableCell><TableCell>{msg.name}</TableCell><TableCell>{msg.email}</TableCell><TableCell className="truncate max-w-xs">{msg.description}</TableCell></TableRow></DialogTrigger>
                                            <DialogContent className="max-w-2xl">
                                                <DialogHeader><DialogTitle>Message from {msg.name}</DialogTitle><DialogDescription>{msg.email}</DialogDescription></DialogHeader>
                                                <p className="whitespace-pre-wrap py-4">{msg.description}</p>
                                            </DialogContent>
                                        </Dialog>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="users">
                        <ScrollArea className="h-[60vh]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Joined Date</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Balance</TableHead>
                                        <TableHead>Email</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(u => (
                                        <TableRow key={u.id}>
                                            <TableCell className="text-xs">{format(new Date(u.createdAt), 'PPpp')}</TableCell>
                                            <TableCell className="font-semibold">{u.name}</TableCell>
                                            <TableCell className="font-bold text-primary">{(u.balance || 0).toLocaleString()} USDT</TableCell>
                                            <TableCell className="text-xs">{u.email}</TableCell>
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
