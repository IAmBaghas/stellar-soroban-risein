import React from 'react';
import { X, Wallet, ShieldCheck, ChevronRight } from 'lucide-react';
import { connectSelectedWallet } from '../services/contract';

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
  onSelectWallet: (walletId: string, address: string, walletName: string) => void;
  onError: (errorMessage: string) => void;
}

export const SUPPORTED_WALLETS: WalletOption[] = [
  {
    id: 'freighter',
    name: 'Freighter Wallet',
    icon: '🦊',
    description: 'Official extension by Stellar Development Foundation',
    isInstalled: true,
  },
  {
    id: 'albedo',
    name: 'Albedo Wallet',
    icon: '🛡️',
    description: 'Web-based browser wallet & signing service',
    isInstalled: true,
  },
  {
    id: 'xbull',
    name: 'xBull Wallet',
    icon: '🐂',
    description: 'Multi-network wallet for Stellar & Soroban dApps',
    isInstalled: true,
  },
  {
    id: 'rabet',
    name: 'Rabet Wallet',
    icon: '🐰',
    description: 'Lightweight extension for Stellar network',
    isInstalled: false,
  },
];

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  onSelectWallet,
  onError,
}) => {
  if (!isOpen) return null;

  const handleWalletClick = async (wallet: WalletOption) => {
    try {
      const { address, name } = await connectSelectedWallet(wallet.id);
      onSelectWallet(wallet.id, address, name);
      onClose();
    } catch (err: any) {
      onError(`Error Type 1 (Wallet Not Found / Connection Failed): ${err.message || 'Selected wallet is not installed or available.'}`);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
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
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>StellarWalletsKit</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Select your multi-wallet provider</p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 6,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          {SUPPORTED_WALLETS.map((wallet) => (
            <div
              key={wallet.id}
              className="wallet-option"
              onClick={() => handleWalletClick(wallet)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span className="wallet-icon">{wallet.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {wallet.name}
                    {wallet.id === 'freighter' && (
                      <span className="badge badge-testnet" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                        Popular
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: 2 }}>
                    {wallet.description}
                  </div>
                </div>
              </div>
              <ChevronRight size={18} style={{ color: 'var(--text-subtle)' }} />
            </div>
          ))}
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <ShieldCheck size={14} style={{ color: 'var(--secondary)' }} /> Powered by @creit.tech/stellar-wallets-kit
        </div>
      </div>
    </div>
  );
};
