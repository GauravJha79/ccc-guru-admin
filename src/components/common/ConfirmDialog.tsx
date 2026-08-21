import React from 'react';
import { AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  type = 'danger',
  isLoading = false,
}) => {
  const iconConfig = {
    danger: {
      icon: <AlertCircle className="w-6 h-6 text-rose-400" />,
      bg: 'bg-rose-500/10 border-rose-500/30',
      btnVariant: 'danger' as const,
    },
    warning: {
      icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
      bg: 'bg-amber-500/10 border-amber-500/30',
      btnVariant: 'primary' as const,
    },
    info: {
      icon: <HelpCircle className="w-6 h-6 text-lavender-400" />,
      bg: 'bg-lavender-500/10 border-lavender-500/30',
      btnVariant: 'primary' as const,
    },
  };

  const current = iconConfig[type];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={current.btnVariant}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex gap-4 items-start">
        <div className={`p-3 rounded-2xl border ${current.bg} flex-shrink-0 mt-0.5`}>
          {current.icon}
        </div>
        <div>
          <h3 className="text-base font-bold text-white">{title}</h3>
          <p className="text-sm text-dark-muted mt-1 leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  );
};
