
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
    const { data: contactMessages, isLoading: messagesLoading } = useCollection(contactMessagesQuery);
    const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
    
    const isLoading = buyOrdersLoading || sellOrdersLoading || messagesLoading || usersLoading;

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Submitted Data</CardTitle>
                <CardDescription>View all orders, messages, and registered users.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="buyOrders">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="buyOrders">Buy Orders</TabsTrigger>
                        <TabsTrigger value="sellOrders">Sell Orders</TabsTrigger>
                        <TabsTrigger value="contact">Messages</TabsTrigger>
                        <TabsTrigger value="users">Registered Users</TabsTrigger>
                    </TabsList>
                    
                    {isLoading && <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}
                    
                    <TabsContent value="buyOrders">
                        <ScrollArea className="h-[60vh]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>USDT</TableHead>
                                        <TableHead>INR</TableHead>
                                        <TableHead>Network</TableHead>
                                        <TableHead>Email</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {buyOrders?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => (
                                        <Dialog key={order.id}>
                                            <DialogTrigger asChild>
                                                <TableRow className="cursor-pointer">
                                                    <TableCell>{format(new Date(order.createdAt), 'PPpp')}</TableCell>
                                                    <TableCell className="font-mono text-xs">{order.id}</TableCell>
                                                    <TableCell><Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>{order.status}</Badge></TableCell>
                                                    <TableCell>{order.usdtAmount}</TableCell>
                                                    <TableCell>{order.inrAmount}</TableCell>
                                                    <TableCell>{order.network}</TableCell>
                                                    <TableCell>{order.email}</TableCell>
                                                </TableRow>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl">
                                                <DialogHeader>
                                                <DialogTitle>Buy Order Details</DialogTitle>
                                                <DialogDescription>Full information for transaction ID: {order.id}</DialogDescription>
                                                </DialogHeader>
                                                <ScrollArea className="max-h-[70vh] pr-6">
                                                    <div className="space-y-4 py-4 text-sm">
                                                        <DetailRow label="Transaction ID" value={<span className="font-mono">{order.id}</span>} />
                                                        <DetailRow label="User ID" value={<span className="font-mono">{order.userId}</span>} />
                                                        <DetailRow label="Status" value={<Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>{order.status}</Badge>} />
                                                        <DetailRow label="Created At" value={format(new Date(order.createdAt), 'PPpp')} />
                                                        <DetailRow label="USDT Amount" value={`${order.usdtAmount} USDT`} />
                                                        <DetailRow label="INR Amount" value={`₹${order.inrAmount.toLocaleString('en-IN')}`} />
                                                        <DetailRow label="Network" value={order.network} />
                                                        <DetailRow label="USDT Address" value={<span className="font-mono">{order.usdtAddress}</span>} />
                                                        <Separator className="my-4" />
                                                        <DetailRow label="Contact Email" value={order.email} />
                                                        <DetailRow label="Contact Number" value={order.contactNumber || 'N/A'} />
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
                                        <TableHead>ID</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>USDT</TableHead>
                                        <TableHead>INR</TableHead>
                                        <TableHead>Network</TableHead>
                                        <TableHead>Email</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sellOrders?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => (
                                        <Dialog key={order.id}>
                                            <DialogTrigger asChild>
                                                <TableRow className="cursor-pointer">
                                                    <TableCell>{format(new Date(order.createdAt), 'PPpp')}</TableCell>
                                                    <TableCell className="font-mono text-xs">{order.id}</TableCell>
                                                    <TableCell><Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>{order.status}</Badge></TableCell>
                                                    <TableCell>{order.usdtAmount}</TableCell>
                                                    <TableCell>{order.inrAmount}</TableCell>
                                                    <TableCell>{order.network}</TableCell>
                                                    <TableCell>{order.email}</TableCell>
                                                </TableRow>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl">
                                                <DialogHeader><DialogTitle>Sell Order Details</DialogTitle><DialogDescription>Transaction ID: {order.id}</DialogDescription></DialogHeader>
                                                <ScrollArea className="max-h-[70vh] pr-6">
                                                     <div className="space-y-4 py-4 text-sm">
                                                        <DetailRow label="Transaction ID" value={<span className="font-mono">{order.id}</span>} />
                                                        <DetailRow label="User ID" value={<span className="font-mono">{order.userId}</span>} />
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
                                                        <Separator className="my-4" />
                                                        <DetailRow label="Contact Email" value={order.email} />
                                                        <DetailRow label="Phone" value={order.phone || 'N/A'} />
                                                    </div>
                                                </ScrollArea>
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
                                            <DialogTrigger asChild><TableRow className="cursor-pointer"><TableCell>{format(new Date(msg.submittedAt), 'PPp')}</TableCell><TableCell>{msg.name}</TableCell><TableCell>{msg.email}</TableCell><TableCell className="truncate max-w-xs">{msg.description}</TableCell></TableRow></DialogTrigger>
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
                                        <TableHead>Email</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>User ID</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(u => (
                                        <TableRow key={u.id}>
                                            <TableCell>{format(new Date(u.createdAt), 'PPpp')}</TableCell>
                                            <TableCell className="font-semibold">{u.name}</TableCell>
                                            <TableCell>{u.email}</TableCell>
                                            <TableCell>{u.phone || 'N/A'}</TableCell>
                                            <TableCell className="font-mono text-xs">{u.userId}</TableCell>
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
