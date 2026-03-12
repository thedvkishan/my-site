
'use client';

import { useState, useMemo } from 'react';
import { Bell, Check, Loader2, Info, CheckCircle2, AlertTriangle, XCircle, Trash2 } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, orderBy, limit, doc, updateDoc, writeBatch, getDocs, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function NotificationBell() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const notificationsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(
            collection(firestore, 'users', user.uid, 'notifications'),
            orderBy('createdAt', 'desc'),
            limit(20)
        );
    }, [firestore, user]);

    const { data: notifications, isLoading } = useCollection(notificationsQuery);

    const unreadCount = useMemo(() => {
        return notifications?.filter(n => !n.read).length || 0;
    }, [notifications]);

    const handleMarkAllAsRead = async () => {
        if (!firestore || !user?.uid || !notifications) return;
        setIsProcessing(true);
        try {
            const unread = notifications.filter(n => !n.read);
            if (unread.length === 0) return;

            const batch = writeBatch(firestore);
            unread.forEach(n => {
                const ref = doc(firestore, 'users', user.uid, 'notifications', n.id);
                batch.update(ref, { read: true });
            });
            await batch.commit();
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        if (!firestore || !user?.uid) return;
        try {
            const ref = doc(firestore, 'users', user.uid, 'notifications', id);
            await updateDoc(ref, { read: true });
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteNotification = async (id: string) => {
        if (!firestore || !user?.uid) return;
        try {
            const ref = doc(firestore, 'users', user.uid, 'notifications', id);
            await deleteDoc(ref);
        } catch (error) {
            console.error(error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
            case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    if (!user) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 hover:bg-muted/50 rounded-full">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white ring-2 ring-background">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 shadow-2xl border-2">
                <div className="flex items-center justify-between p-4 border-b">
                    <DropdownMenuLabel className="p-0 text-sm font-bold flex items-center gap-2">
                        Activity Terminal {unreadCount > 0 && <Badge variant="secondary" className="h-5 text-[10px] font-black">{unreadCount} New</Badge>}
                    </DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary hover:bg-primary/5" onClick={handleMarkAllAsRead} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />} Mark All Read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[400px]">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-20">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : notifications && notifications.length > 0 ? (
                        <div className="flex flex-col">
                            {notifications.map((n) => (
                                <div 
                                    key={n.id} 
                                    className={cn(
                                        "relative group flex items-start gap-3 p-4 border-b last:border-0 hover:bg-muted/30 transition-colors cursor-default",
                                        !n.read && "bg-primary/5 border-l-2 border-l-primary"
                                    )}
                                    onClick={() => !n.read && handleMarkAsRead(n.id)}
                                >
                                    <div className="mt-0.5">{getIcon(n.type)}</div>
                                    <div className="flex-1 space-y-1">
                                        <p className={cn("text-xs font-bold leading-tight", !n.read ? "text-primary" : "text-foreground")}>{n.title}</p>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">{n.message}</p>
                                        <p className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-tight">
                                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteNotification(n.id);
                                        }}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-3">
                            <div className="p-3 bg-muted rounded-full">
                                <Bell className="h-6 w-6 text-muted-foreground/40" />
                            </div>
                            <div>
                                <p className="text-sm font-bold">All caught up!</p>
                                <p className="text-xs text-muted-foreground">No recent activity found in your terminal.</p>
                            </div>
                        </div>
                    )}
                </ScrollArea>
                <div className="p-2 border-t bg-muted/5 flex justify-center">
                    <Button variant="ghost" size="sm" className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground" onClick={() => toast({ title: "Check Wallet History", description: "All past records are in your profile." })}>
                        View All History
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
