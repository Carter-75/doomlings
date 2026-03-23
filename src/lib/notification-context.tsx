'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import Modal from '@/components/Modal';
import AnimatedButton from '@/components/AnimatedButton';

interface NotificationOptions {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface NotificationContextValue {
  showNotification: (options: NotificationOptions) => void;
  closeNotification: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<NotificationOptions | null>(null);

  const showNotification = useCallback((options: NotificationOptions) => {
    setModal(options);
  }, []);

  const closeNotification = useCallback(() => {
    setModal(null);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, closeNotification }}>
      {children}
      {modal && (
        <Modal
          isOpen={!!modal}
          onClose={closeNotification}
          title={modal.title}
          type={modal.type}
          actions={
            modal.onConfirm ? (
              <>
                <AnimatedButton onClick={closeNotification} className="is-light">
                  {modal.cancelText || 'Cancel'}
                </AnimatedButton>
                <AnimatedButton 
                  onClick={() => {
                    modal.onConfirm?.();
                    closeNotification();
                  }} 
                  className={`is-${modal.type || 'primary'}`}
                >
                  {modal.confirmText || 'Confirm'}
                </AnimatedButton>
              </>
            ) : null
          }
        >
          <p>{modal.message}</p>
        </Modal>
      )}
    </NotificationContext.Provider>
  );
}
