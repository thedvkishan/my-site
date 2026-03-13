'use client';

import { useAuth } from "@/firebase";
import { signInAnonymously } from "firebase/auth";
import { useEffect } from "react";

export function AnonymousAuthProvider({ children }: { children: React.ReactNode }) {
    const auth = useAuth();
    useEffect(() => {
        if (auth && !auth.currentUser) {
            signInAnonymously(auth).catch(error => {
                console.error("Anonymous sign-in failed:", error);
            });
        }
    }, [auth]);

    return <>{children}</>;
}
