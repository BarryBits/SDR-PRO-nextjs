"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

export interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'success';
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

const variantConfig = {
  default: {
    icon: Info,
    iconColor: 'text-primary',
    confirmVariant: 'default' as const,
  },
  destructive: {
    icon: XCircle,
    iconColor: 'text-danger',
    confirmVariant: 'destructive' as const,
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-warning',
    confirmVariant: 'default' as const,
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-success',
    confirmVariant: 'default' as const,
  },
};

export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  onConfirm,
  loading = false,
}: ConfirmationModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao confirmar ação:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = loading || isProcessing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-${variant === 'destructive' ? 'danger' : variant === 'warning' ? 'warning' : variant === 'success' ? 'success' : 'primary'}/10`}>
              <Icon className={`h-6 w-6 ${config.iconColor}`} />
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
            </div>
          </div>
        </DialogHeader>
        
        <DialogDescription className="text-text-secondary leading-relaxed">
          {description}
        </DialogDescription>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            variant={config.confirmVariant}
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Processando...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook para usar o modal de confirmação
export function useConfirmationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<Omit<ConfirmationModalProps, 'open' | 'onOpenChange'>>({
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const openModal = (modalConfig: Omit<ConfirmationModalProps, 'open' | 'onOpenChange'>) => {
    setConfig(modalConfig);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const ConfirmationModalComponent = () => (
    <ConfirmationModal
      {...config}
      open={isOpen}
      onOpenChange={setIsOpen}
    />
  );

  return {
    openModal,
    closeModal,
    ConfirmationModal: ConfirmationModalComponent,
  };
}

