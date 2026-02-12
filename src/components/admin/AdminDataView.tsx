'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, orderBy, query } from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
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
        return query(collection(firestore, 'buyOrders'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const sellOrdersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'sellOrders'), orderBy('createdAt', 'desc'));
    }, [firestore]);
    
    const contactMessagesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'contactMessages'), orderBy('submittedAt', 'desc'));
    }, [firestore]);


    const { data: buyOrders, isLoading: buyOrdersLoading } = useCollection(buyOrdersQuery);
    const { data: sellOrders, isLoading: sellOrdersLoading } = useCollection(sellOrdersQuery);
    const { data: contactMessages, isLoading: messagesLoading } = useCollection(contactMessagesQuery);
    
    const isLoading = buyOrdersLoading || sellOrdersLoading || messagesLoading;

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Submitted Data</CardTitle>
                <CardDescription>View all orders and messages submitted by users. Click a row to see full details.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="buyOrders">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="buyOrders">Buy Orders</TabsTrigger>
                        <TabsTrigger value="sellOrders">Sell Orders</TabsTrigger>
                        <TabsTrigger value="contact">Contact Messages</TabsTrigger>
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
                                        <TableHead>USDT Address</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {buyOrders?.map(order => (
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
                                                    <TableCell className="font-mono text-xs truncate max-w-xs">{order.usdtAddress}</TableCell>
                                                </TableRow>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl">
                                                <DialogHeader>
                                                <DialogTitle>Buy Order Details</DialogTitle>
                                                <DialogDescription>
                                                    Full information for transaction ID: {order.id}
                                                </DialogDescription>
                                                </DialogHeader>
                                                <ScrollArea className="max-h-[70vh] pr-6">
                                                    <div className="space-y-4 py-4 text-sm">
                                                        <DetailRow label="Transaction ID" value={<span className="font-mono">{order.id}</span>} />
                                                        <DetailRow label="User ID" value={<span className="font-mono">{order.userId}</span>} />
                                                        <DetailRow label="Status" value={<Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>{order.status}</Badge>} />
                                                        <DetailRow label="Created At" value={format(new Date(order.createdAt), 'PPpp')} />
                                                        <DetailRow label="Expires At" value={format(new Date(order.expiresAt), 'PPpp')} />
                                                        
                                                        <Separator className="my-4" />

                                                        <DetailRow label="USDT Amount" value={`${order.usdtAmount} USDT`} />
                                                        <DetailRow label="INR Amount" value={`₹${order.inrAmount.toLocaleString('en-IN')}`} />
                                                        <DetailRow label="Network" value={order.network} />
                                                        <DetailRow label="USDT Address" value={<span className="font-mono">{order.usdtAddress}</span>} />

                                                        <Separator className="my-4" />

                                                        <DetailRow label="Contact Email" value={order.email} />
                                                        <DetailRow label="Contact Number" value={order.contactNumber || 'N/A'} />
                                                        <DetailRow label="Country" value={order.country} />
                                                        <DetailRow label="Payment Mode" value={order.paymentMode} />
                                                        <DetailRow label="Payment Receipt" value={
                                                            order.paymentReceiptUrl ? (
                                                                <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button variant="outline" size="sm">View Receipt</Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="max-w-4xl h-[90vh]">
                                                                    <DialogHeader>
                                                                    <DialogTitle>Payment Receipt for Order {order.id}</DialogTitle>
                                                                    </DialogHeader>
                                                                    {order.paymentReceiptUrl.startsWith('data:image') ? (
                                                                    <div className="relative h-full">
                                                                        <Image src={order.paymentReceiptUrl} alt="Payment Receipt" fill style={{objectFit: 'contain'}} />
                                                                    </div>
                                                                    ) : order.paymentReceiptUrl.startsWith('data:application/pdf') ? (
                                                                    <iframe src={order.paymentReceiptUrl} className="w-full h-full" title="Receipt PDF"></iframe>
                                                                    ) : (
                                                                    <a href={order.paymentReceiptUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                                                                        Open receipt in new tab
                                                                    </a>
                                                                    )}
                                                                </DialogContent>
                                                                </Dialog>
                                                            ) : (
                                                                <span className="text-muted-foreground">N/A</span>
                                                            )
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
                                        <TableHead>Payment To</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sellOrders?.map(order => (
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
                                                    <TableCell className="text-xs">
                                                        {order.paymentMode === 'UPI' ? `UPI: ${order.upiId}` : `Bank: ${order.accountNumber}`}
                                                    </TableCell>
                                                </TableRow>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl">
                                                <DialogHeader>
                                                    <DialogTitle>Sell Order Details</DialogTitle>
                                                    <DialogDescription>
                                                        Full information for transaction ID: {order.id}
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <ScrollArea className="max-h-[70vh] pr-6">
                                                     <div className="space-y-4 py-4 text-sm">
                                                        <DetailRow label="Transaction ID" value={<span className="font-mono">{order.id}</span>} />
                                                        <DetailRow label="User ID" value={<span className="font-mono">{order.userId}</span>} />
                                                        <DetailRow label="Status" value={<Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>{order.status}</Badge>} />
                                                        <DetailRow label="Created At" value={format(new Date(order.createdAt), 'PPpp')} />
                                                        <DetailRow label="Expires At" value={format(new Date(order.expiresAt), 'PPpp')} />

                                                        <Separator className="my-4" />

                                                        <DetailRow label="USDT Amount" value={`${order.usdtAmount} USDT`} />
                                                        <DetailRow label="INR Amount" value={`₹${order.inrAmount.toLocaleString('en-IN')}`} />
                                                        <DetailRow label="Network" value={order.network} />

                                                        <Separator className="my-4" />
                                                        
                                                        <DetailRow label="Receiving Mode" value={order.paymentMode} />
                                                        {order.paymentMode === 'UPI' && (
                                                            <>
                                                                <DetailRow label="UPI Holder Name" value={order.upiHolderName} />
                                                                <DetailRow label="UPI ID" value={order.upiId} />
                                                            </>
                                                        )}
                                                        {['IMPS', 'RTGS', 'NEFT', 'Cash Deposit'].includes(order.paymentMode) && (
                                                            <>
                                                                <DetailRow label="Bank Holder Name" value={order.bankHolderName} />
                                                                <DetailRow label="Bank Name" value={order.bankName} />
                                                                <DetailRow label="Account Number" value={<span className="font-mono">{order.accountNumber}</span>} />
                                                                <DetailRow label="IFSC Code" value={<span className="font-mono">{order.ifsc}</span>} />
                                                            </>
                                                        )}

                                                        <Separator className="my-4" />
                                                        
                                                        <DetailRow label="Contact Email" value={order.email} />
                                                        <DetailRow label="Contact Number" value={order.phone || 'N/A'} />
                                                        <DetailRow label="Country" value={order.country} />
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
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Message</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {contactMessages?.map(msg => (
                                         <Dialog key={msg.id}>
                                            <DialogTrigger asChild>
                                                <TableRow className="cursor-pointer">
                                                    <TableCell>{format(new Date(msg.submittedAt), 'PPp')}</TableCell>
                                                    <TableCell className="font-mono text-xs">{msg.id}</TableCell>
                                                    <TableCell>{msg.name}</TableCell>
                                                    <TableCell>{msg.email}</TableCell>
                                                    <TableCell className="max-w-md truncate">{msg.description}</TableCell>
                                                </TableRow>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl">
                                                <DialogHeader>
                                                    <DialogTitle>Contact Message</DialogTitle>
                                                    <DialogDescription>
                                                        From: {msg.name} ({msg.email})
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <ScrollArea className="max-h-[70vh] pr-6">
                                                     <div className="space-y-4 py-4 text-sm">
                                                        <DetailRow label="Message ID" value={<span className="font-mono">{msg.id}</span>} />
                                                        <DetailRow label="Submitted At" value={format(new Date(msg.submittedAt), 'PPpp')} />
                                                        <Separator className="my-4" />
                                                        <div className="space-y-2">
                                                            <div className="text-muted-foreground text-right">Description</div>
                                                            <p className="font-semibold whitespace-pre-wrap">{msg.description}</p>
                                                        </div>
                                                     </div>
                                                </ScrollArea>
                                            </DialogContent>
                                        </Dialog>
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
