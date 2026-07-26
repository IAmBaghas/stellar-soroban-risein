import React from 'react';
import { X, Wallet, ShieldCheck, ChevronRight } from 'lucide-react';

export interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  isInstalled?: boolean;
}

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWallet: (walletId: string) => void;
}

export const SUPPORTED_WALLETS: WalletOption[] = [
  {
    id: 'freighter',
    name: 'Freighter Wallet',
    icon: '🦊',
    description: 'Official browser extension by Stellar Development Foundation',
    isInstalled: true,
  },
  {
    id: 'albedo',
    name: 'Albedo',
    icon: '🛡️',
    description: 'Web-based browser wallet & signing service for Stellar',
    isInstalled: true,
  },
  {
    id: 'xbull',
    name: 'xBull Wallet',
    icon: '🐂',
    description: 'Powerful multi-network wallet for Stellar & Soroban dApps',
    isInstalled: true,
  },
  {
    id: 'rabet',
    name: 'Rabet',
    icon: '🐰',
    description: 'Lightweight browser extension for Stellar network',
    isInstalled: false,
  },
];

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  onSelectWallet,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--primary-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <Wallet size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Connect Wallet</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Select your preferred Stellar wallet</p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          {SUPPORTED_WALLETS.map((wallet) => (
            <div
              key={wallet.id}
              className="wallet-option"
              onClick={() => onSelectWallet(wallet.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span className="wallet-icon">{wallet.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {wallet.name}
                    {wallet.id === 'freighter' && (
                      <span className="badge badge-testnet" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                        Popular
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                    {wallet.description}
                  </div>
                </div>
              </div>
              <ChevronRight size={18} style={{ color: 'var(--text-subtle)' }} />
            </div>
          ))}
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <ShieldCheck size={14} style={{ color: 'var(--secondary)' }} /> Connected to Stellar Testnet
        </div>
      </div>
    </div>
  );
};
