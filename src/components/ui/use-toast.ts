// src/components/ui/use-toast.ts
import { useState } from 'react';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = ({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { id, title, description, variant };
    
    setToasts(prev => [...prev, newToast]);
    
    // Remove toast após 5 segundos
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
    
    return { id };
  };

  const dismiss = (toastId?: string) => {
    if (toastId) {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    } else {
      setToasts([]);
    }
  };

  return {
    toast,
    dismiss,
    toasts
  };
}

