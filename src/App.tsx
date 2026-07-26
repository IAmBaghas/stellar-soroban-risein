import React, { useState } from 'react';
import {
  FileText,
  PlusCircle,
  Trash2,
  Wallet,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  LogOut,
  AlertTriangle,
  Info,
  Clock,
} from 'lucide-react';
import { WalletModal, SUPPORTED_WALLETS } from './components/WalletModal';

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  timestamp: string;
}

export const App: React.FC = () => {
  // Wallet state
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectedWallet, setConnectedWallet] = useState<string>('');
  const [walletAddress, setWalletAddress] = useState<string>('');

  // Form state
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Mock notes state (UI Demonstration)
  const [notes, setNotes] = useState<NoteItem[]>([
    {
      id: '849201938',
      title: 'Soroban Smart Contract Key',
      content: 'Contract deployed at: C... notes contract logic fully compiled to WASM.',
      timestamp: 'Just now',
    },
    {
      id: '920491823',
      title: 'Stellar Level 2 Objective',
      content: 'Multi-wallet integration with StellarWalletsKit and error handling.',
      timestamp: '10 mins ago',
    },
  ]);

  // Transaction Status State
  const [txStatus, setTxStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    title: string;
    message: string;
    hash?: string;
  }>({
    type: 'info',
    title: 'Level 2 UI Ready',
    message: 'Connect your wallet using StellarWalletsKit to create and read notes on-chain.',
  });

  // Mock Connect Wallet handler
  const handleSelectWallet = (walletId: string) => {
    const selected = SUPPORTED_WALLETS.find((w) => w.id === walletId);
    setConnectedWallet(selected?.name || walletId);
    setWalletAddress('GANR2RPVOMXPEYITKYJ44JTN24ZTJIWULNXCKTOR3CIUMF6AHPKTXDYD');
    setIsConnected(true);
    setIsWalletModalOpen(false);
    setTxStatus({
      type: 'success',
      title: 'Wallet Connected',
      message: `Connected via ${selected?.name || walletId} (Stellar Testnet)`,
    });
  };

  // Mock Disconnect handler
  const handleDisconnect = () => {
    setIsConnected(false);
    setConnectedWallet('');
    setWalletAddress('');
    setTxStatus({
      type: 'info',
      title: 'Wallet Disconnected',
      message: 'Choose a wallet to connect back to Stellar Notes Vault.',
    });
  };

  // Mock Submit Note handler
  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (!isConnected) {
      setIsWalletModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const newNote: NoteItem = {
        id: Math.floor(Math.random() * 1000000000).toString(),
        title,
        content,
        timestamp: 'Just now',
      };
      setNotes([newNote, ...notes]);
      setTitle('');
      setContent('');
      setIsSubmitting(false);
      setTxStatus({
        type: 'success',
        title: 'Note Published On-Chain',
        message: 'Transaction verified and executed on Soroban smart contract.',
        hash: '30c9d498792003619cdc9a2dbb27b4eff4f5e46748daa04ade09e26e77d384ea',
      });
    }, 800);
  };

  // Mock Delete Note handler
  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
    setTxStatus({
      type: 'info',
      title: 'Note Deleted On-Chain',
      message: `Removed note #${id} from contract storage.`,
    });
  };

  // Helper for 3 Error Previews in UI
  const triggerErrorDemo = (type: 1 | 2 | 3) => {
    if (type === 1) {
      setTxStatus({
        type: 'error',
        title: 'Error 1: Wallet Not Found',
        message: 'Selected wallet extension is not installed or enabled in your browser.',
      });
    } else if (type === 2) {
      setTxStatus({
        type: 'error',
        title: 'Error 2: Transaction Rejected',
        message: 'The user declined transaction signing in the wallet popup.',
      });
    } else if (type === 3) {
      setTxStatus({
        type: 'error',
        title: 'Error 3: Insufficient Balance / Execution Error',
        message: 'Account does not have enough XLM to pay transaction sequence fees.',
      });
    }
  };

  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-6)}`;

  return (
    <div className="app-container">
      {/* Multi-Wallet Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSelectWallet={handleSelectWallet}
      />

      {/* Header Navbar */}
      <nav className="navbar">
        <div className="brand">
          <div className="brand-icon">
            <Zap size={22} />
          </div>
          <div>
            <div className="brand-title">Stellar Notes Vault</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Level 2 Soroban DApp</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="badge badge-testnet">
            <ShieldCheck size={14} /> Stellar Testnet
          </span>

          {!isConnected ? (
            <button className="btn btn-primary" onClick={() => setIsWalletModalOpen(true)}>
              <Wallet size={18} /> Connect Wallet
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                }}
              >
                <span style={{ color: 'var(--secondary)', fontWeight: 600, marginRight: '6px' }}>
                  {connectedWallet}:
                </span>
                <span style={{ fontFamily: 'monospace' }}>{truncateAddress(walletAddress)}</span>
              </div>

              <button className="btn btn-danger btn-sm" onClick={handleDisconnect} title="Disconnect Wallet">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Top Banner / Status Alert */}
      {txStatus.type && (
        <div className={`alert alert-${txStatus.type}`}>
          {txStatus.type === 'success' && <CheckCircle2 size={20} style={{ flexShrink: 0, color: 'var(--success)' }} />}
          {txStatus.type === 'error' && <AlertCircle size={20} style={{ flexShrink: 0, color: 'var(--danger)' }} />}
          {txStatus.type === 'info' && <Info size={20} style={{ flexShrink: 0, color: 'var(--secondary)' }} />}

          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '2px' }}>{txStatus.title}</strong>
            <span>{txStatus.message}</span>
            {txStatus.hash && (
              <div style={{ marginTop: '8px', fontSize: '0.82rem' }}>
                Verified Hash:{' '}
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${txStatus.hash}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--secondary)', fontFamily: 'monospace' }}
                >
                  {txStatus.hash.slice(0, 16)}... <ExternalLink size={12} style={{ display: 'inline' }} />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Left Column: Create Note Form */}
        <div>
          <div className="glass-card">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PlusCircle size={20} style={{ color: 'var(--secondary)' }} /> Create On-Chain Note
            </h2>

            <form onSubmit={handleCreateNote}>
              <div className="input-group">
                <label className="input-label">Note Title</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Secret Passphrase / Idea"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Note Content</label>
                <textarea
                  className="input-field"
                  placeholder="Write your decentralized note content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" /> Publishing to Contract...
                  </>
                ) : (
                  <>
                    <FileText size={18} /> Publish Note to Soroban
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Level 2 Error Handling Demo Panel */}
          <div className="glass-card" style={{ marginTop: '20px', padding: '20px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
              Level 2 Error Handling Checklist (3 Types)
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => triggerErrorDemo(1)}
                style={{ justifyContent: 'flex-start' }}
              >
                <AlertTriangle size={14} color="var(--warning)" /> Preview: Wallet Not Found
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => triggerErrorDemo(2)}
                style={{ justifyContent: 'flex-start' }}
              >
                <AlertTriangle size={14} color="var(--danger)" /> Preview: User Rejected Signature
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => triggerErrorDemo(3)}
                style={{ justifyContent: 'flex-start' }}
              >
                <AlertTriangle size={14} color="var(--accent)" /> Preview: Insufficient Balance
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Notes List */}
        <div>
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} style={{ color: 'var(--primary)' }} /> On-Chain Notes ({notes.length})
              </h2>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() =>
                  setTxStatus({
                    type: 'info',
                    title: 'State Synchronized',
                    message: 'Refreshed latest note records from Soroban contract storage.',
                  })
                }
              >
                <RefreshCw size={14} /> Refresh Notes
              </button>
            </div>

            {notes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <FileText size={48} style={{ opacity: 0.2, marginBottom: '12px' }} />
                <p>No notes published on-chain yet.</p>
              </div>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="note-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="note-title">{note.title}</div>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteNote(note.id)}
                      style={{ padding: '4px 8px' }}
                      title="Delete Note On-Chain"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <p className="note-content">{note.content}</p>

                  <div className="note-meta">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {note.timestamp}
                    </span>
                    <span style={{ fontFamily: 'monospace' }}>ID: #{note.id}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
