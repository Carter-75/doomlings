'use client';

import React, { useEffect, useState } from 'react';
import AnimatedButton from './AnimatedButton';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  type?: 'info' | 'warning' | 'error' | 'success';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  actions,
  type = 'info'
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const getTypeColor = () => {
    switch (type) {
      case 'warning': return 'var(--warning)';
      case 'error': return 'var(--error)';
      case 'success': return 'var(--success)';
      default: return 'var(--primary-orange)';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content animate-pop-in" 
        onClick={e => e.stopPropagation()}
        style={{ borderTop: `4px solid ${getTypeColor()}` }}
      >
        <div className="modal-header">
          <h3 style={{ color: getTypeColor() }}>{title}</h3>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        <div className="modal-footer">
          {actions || (
            <AnimatedButton onClick={onClose} className="is-primary">
              Close
            </AnimatedButton>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 50% 15%, rgba(var(--primary-rgb), 0.12), rgba(0, 0, 0, 0.78));
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
        }

        .modal-content {
          background: linear-gradient(145deg, rgba(var(--primary-rgb), 0.12), var(--darker-bg) 38%, var(--dark-bg));
          border: 1px solid rgba(var(--secondary-rgb), 0.28);
          border-radius: var(--border-radius);
          width: 100%;
          max-width: 500px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(var(--primary-rgb), 0.18), 0 0 24px rgba(var(--primary-rgb), 0.18);
          overflow: hidden;
          position: relative;
        }

        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(var(--secondary-rgb), 0.2);
          background: linear-gradient(180deg, rgba(var(--primary-rgb), 0.1), rgba(255, 255, 255, 0.01));
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .modal-close-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 1.5rem;
          cursor: pointer;
          transition: color 0.2s;
          padding: 0;
          line-height: 1;
        }

        .modal-close-btn:hover {
          color: var(--text-primary);
        }

        .modal-body {
          padding: 24px;
          color: var(--text-secondary);
          line-height: 1.6;
          font-size: 1rem;
        }

        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid rgba(var(--secondary-rgb), 0.2);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.12), rgba(var(--primary-rgb), 0.08));
        }

        .animate-pop-in {
          animation: pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes pop-in {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Modal;
