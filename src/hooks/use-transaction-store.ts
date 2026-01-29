import { useState, useEffect, useCallback } from 'react';

const isServer = typeof window === 'undefined';

export function useTransactionStore() {
  const getTransaction = useCallback((id: string) => {
    if (isServer) return null;
    try {
      const item = window.localStorage.getItem(`transaction-${id}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage', error);
      return null;
    }
  }, []);

  const setTransaction = useCallback((id: string, value: any) => {
    if (isServer) return;
    try {
      const item = JSON.stringify(value);
      window.localStorage.setItem(`transaction-${id}`, item);
    } catch (error) {
      console.error('Error writing to localStorage', error);
    }
  }, []);
  
  const updateTransactionStatus = useCallback((id: string, status: string) => {
    if (isServer) return;
    try {
      const transaction = getTransaction(id);
      if (transaction) {
        transaction.status = status;
        setTransaction(id, transaction);
      }
    } catch (error) {
      console.error('Error updating transaction status in localStorage', error);
    }
  }, [getTransaction, setTransaction]);


  return { getTransaction, setTransaction, updateTransactionStatus };
}
