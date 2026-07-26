import React, { useState, useEffect } from 'react';
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
import { WalletModal } from './components/WalletModal';
import {
  CONTRACT_ID,
  fetchNotesFromContract,
  createNoteOnContract,
  deleteNoteOnContract,
  OnChainNote,
} from './services/contract';

export const App: React.FC = () => {
  // Wallet State
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectedWalletName, setConnectedWalletName] = useState<string>('');
  const [walletAddress, setWalletAddress] = useState<string>('');

  // Form State
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Notes List State (Fetched directly from Soroban contract)
  const [notes, setNotes] = useState<OnChainNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState<boolean>(false);

  // Status & Error Feedback State
  const [txStatus, setTxStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    title: string;
    message: string;
    hash?: string;
  }>({
    type: 'info',
    title: 'Soroban Smart Contract Connected',
    message: `Contract ID: ${CONTRACT_ID.slice(0, 10)}...${CONTRACT_ID.slice(-10)}`,
  });

  // Load notes on mount
  const handleRefreshNotes = async () => {
    setIsLoadingNotes(true);
    try {
      const fetched = await fetchNotesFromContract();
      if (fetched && fetched.length > 0) {
        setNotes(fetched);
      }
    } catch (err) {
      console.warn('Error loading notes:', err);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  useEffect(() => {
    handleRefreshNotes();
  }, []);

  // Handle Wallet Select from StellarWalletsKit
  const handleSelectWallet = (walletId: string, address: string, name: string) => {
    setWalletAddress(address);
    setConnectedWalletName(name);
    setIsConnected(true);
    setIsWalletModalOpen(false);
    setTxStatus({
      type: 'success',
      title: 'Wallet Connected via StellarWalletsKit',
      message: `Active Provider: ${name} (${address.slice(0, 6)}...${address.slice(-6)})`,
    });
  };

  // Handle Wallet Error (Error Type 1)
  const handleWalletError = (errorMessage: string) => {
    setTxStatus({
      type: 'error',
      title: 'Error Type 1: Wallet Connection Failed',
      message: errorMessage,
    });
  };

  // Handle Disconnect
  const handleDisconnect = () => {
    setIsConnected(false);
    setWalletAddress('');
    setConnectedWalletName('');
    setTxStatus({
      type: 'info',
      title: 'Wallet Disconnected',
      message: 'Connect a wallet via StellarWalletsKit to interact with the contract.',
    });
  };

  // Handle Create Note (Write call to Soroban)
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (!isConnected || !walletAddress) {
      setIsWalletModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    setTxStatus({
      type: 'info',
      title: 'Transaction Status: Pending',
      message: 'Building & signing Soroban contract call in selected wallet...',
    });

    try {
      const result = await createNoteOnContract(walletAddress, title, content);

      if (result.success && result.hash) {
        setTxStatus({
          type: 'success',
          title: 'Transaction Status: Success!',
          message: `Successfully executed create_note() on Soroban Testnet!`,
          hash: result.hash,
        });
        setTitle('');
        setContent('');
        await handleRefreshNotes();
      } else {
        // Handled Error Types 1, 2, or 3
        const errTitle =
          result.errorType === 2
            ? 'Error Type 2: Transaction Rejected'
            : result.errorType === 3
            ? 'Error Type 3: Insufficient Balance / Execution Failed'
            : 'Error Type 1: Wallet Error';

        setTxStatus({
          type: 'error',
          title: errTitle,
          message: result.error || 'Transaction failed to complete.',
        });
      }
    } catch (err: any) {
      setTxStatus({
        type: 'error',
        title: 'Error Type 3: Contract Execution Error',
        message: err.message || 'Unexpected error submitting transaction to Soroban.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Note (Write call to Soroban)
  const handleDeleteNote = async (noteId: string) => {
    if (!isConnected || !walletAddress) {
      setIsWalletModalOpen(true);
      return;
    }

    setTxStatus({
      type: 'info',
      title: 'Transaction Status: Pending',
      message: `Executing delete_note(${noteId}) on Soroban...`,
    });

    try {
      const result = await deleteNoteOnContract(walletAddress, noteId);

      if (result.success && result.hash) {
        setTxStatus({
          type: 'success',
          title: 'Transaction Status: Success!',
          message: `Successfully deleted note #${noteId} from contract storage.`,
          hash: result.hash,
        });
        await handleRefreshNotes();
      } else {
        setTxStatus({
          type: 'error',
          title: result.errorType === 2 ? 'Error Type 2: User Rejected' : 'Error Type 3: Execution Error',
          message: result.error || 'Failed to delete note.',
        });
      }
    } catch (err: any) {
      setTxStatus({
        type: 'error',
        title: 'Error Type 3: Delete Note Failed',
        message: err.message || 'Failed to delete note.',
      });
    }
  };

  // Demo Error Handler Buttons
  const triggerErrorDemo = (type: 1 | 2 | 3) => {
    if (type === 1) {
      setTxStatus({
        type: 'error',
        title: 'Error Type 1: Wallet Not Found',
        message: 'Wallet extension not installed or enabled in browser.',
      });
    } else if (type === 2) {
      setTxStatus({
        type: 'error',
        title: 'Error Type 2: User Rejected Signature',
        message: 'Transaction signing was cancelled by the user in the wallet popup.',
      });
    } else if (type === 3) {
      setTxStatus({
        type: 'error',
        title: 'Error Type 3: Insufficient Balance / Execution Failure',
        message: 'Account does not have enough XLM balance to fund Soroban transaction fees.',
      });
    }
  };

  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-6)}`;

  return (
    <div className="app-container">
      {/* Multi-Wallet Modal via StellarWalletsKit */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSelectWallet={handleSelectWallet}
        onError={handleWalletError}
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
                  {connectedWalletName}:
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

      {/* Real-Time Transaction Status Tracking Banner */}
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
                Verifiable Explorer Hash:{' '}
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${txStatus.hash}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--secondary)', fontFamily: 'monospace', fontWeight: 600 }}
                >
                  {txStatus.hash} <ExternalLink size={12} style={{ display: 'inline' }} />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
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
                  placeholder="e.g. Passphrase Backup / Audit Log"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Note Content</label>
                <textarea
                  className="input-field"
                  placeholder="Write your note content here..."
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
                    <RefreshCw size={18} className="animate-spin" /> Calling create_note()...
                  </>
                ) : (
                  <>
                    <FileText size={18} /> Publish Note to Soroban Contract
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Level 2 Error Handling Verification Checklist */}
          <div className="glass-card" style={{ marginTop: '20px', padding: '20px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
              Level 2 Required Error Handlers (3 Types)
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => triggerErrorDemo(1)}
                style={{ justifyContent: 'flex-start' }}
              >
                <AlertTriangle size={14} color="var(--warning)" /> Type 1: Wallet Not Found
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => triggerErrorDemo(2)}
                style={{ justifyContent: 'flex-start' }}
              >
                <AlertTriangle size={14} color="var(--danger)" /> Type 2: User Rejected Signature
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => triggerErrorDemo(3)}
                style={{ justifyContent: 'flex-start' }}
              >
                <AlertTriangle size={14} color="var(--accent)" /> Type 3: Insufficient Balance / Execution Error
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Deployed Contract Notes List */}
        <div>
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} style={{ color: 'var(--primary)' }} /> Contract Notes ({notes.length})
              </h2>

              <button
                className="btn btn-secondary btn-sm"
                onClick={handleRefreshNotes}
                disabled={isLoadingNotes}
              >
                <RefreshCw size={14} className={isLoadingNotes ? 'animate-spin' : ''} /> Sync Contract
              </button>
            </div>

            <div style={{ marginBottom: '14px', fontSize: '0.78rem', color: 'var(--text-subtle)', background: 'rgba(0, 229, 255, 0.05)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(0, 229, 255, 0.15)' }}>
              Deployed Contract ID: <span style={{ fontFamily: 'monospace', color: 'var(--secondary)' }}>{CONTRACT_ID}</span>
            </div>

            {notes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <FileText size={48} style={{ opacity: 0.2, marginBottom: '12px' }} />
                <p>No notes found in contract storage.</p>
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
                    <span>Target: Soroban Testnet</span>
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
