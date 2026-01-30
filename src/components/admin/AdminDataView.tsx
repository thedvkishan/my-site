'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, collectionGroup, orderBy, query } from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";

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
                <CardDescription>View all orders and messages submitted by users.</CardDescription>
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
                                        <TableHead>Receipt</TableHead>
                                        <TableHead>USDT</TableHead>
                                        <TableHead>INR</TableHead>
                                        <TableHead>Network</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>USDT Address</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {buyOrders?.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell>{format(new Date(order.createdAt), 'PPpp')}</TableCell>
                                            <TableCell className="font-mono text-xs">{order.id}</TableCell>
                                            <TableCell><Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>{order.status}</Badge></TableCell>
                                            <TableCell>
                                              {order.paymentReceiptUrl ? (
                                                <Button asChild variant="link" size="sm" className="p-0 h-auto">
                                                  <a href={order.paymentReceiptUrl} target="_blank" rel="noopener noreferrer">
                                                    View Receipt
                                                  </a>
                                                </Button>
                                              ) : (
                                                <span className="text-muted-foreground text-xs">N/A</span>
                                              )}
                                            </TableCell>
                                            <TableCell>{order.usdtAmount}</TableCell>
                                            <TableCell>{order.inrAmount}</TableCell>
                                            <TableCell>{order.network}</TableCell>
                                            <TableCell>{order.email}</TableCell>
                                            <TableCell className="font-mono text-xs truncate max-w-xs">{order.usdtAddress}</TableCell>
                                        </TableRow>
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
                                        <TableRow key={order.id}>
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
                                        <TableRow key={msg.id}>
                                            <TableCell>{format(new Date(msg.submittedAt), 'PPp')}</TableCell>
                                            <TableCell className="font-mono text-xs">{msg.id}</TableCell>
                                            <TableCell>{msg.name}</TableCell>
                                            <TableCell>{msg.email}</TableCell>
                                            <TableCell className="max-w-md">{msg.description}</TableCell>
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
