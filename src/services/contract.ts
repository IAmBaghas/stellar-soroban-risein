import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { isConnected, requestAccess, getAddress, signTransaction as freighterSignTransaction } from '@stellar/freighter-api';
import {
  rpc,
  Contract,
  scValToNative,
  nativeToScVal,
  TransactionBuilder,
  Networks,
} from '@stellar/stellar-sdk';

// Deployed Soroban Notes Contract Address on Stellar Testnet
export const CONTRACT_ID = 'CBLU4IUASQ4WUMOXBFLZRSBBLILGOH33GS4LUPKFBCCCMJCDQNMF7G2M';
export const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';

export const sorobanServer = new rpc.Server(SOROBAN_RPC_URL);

export interface OnChainNote {
  id: string;
  title: string;
  content: string;
}

/**
 * Connect wallet using Freighter or StellarWalletsKit provider
 */
export async function connectSelectedWallet(walletId: string): Promise<{ address: string; name: string }> {
  if (walletId === 'freighter') {
    const installed = await isConnected();
    if (!installed.isConnected) {
      throw new Error('Freighter extension is not installed in your browser.');
    }
    const access = await requestAccess();
    if (access.error) {
      throw new Error(access.error || 'User rejected wallet access.');
    }
    const addrObj = await getAddress();
    if (addrObj.error || !addrObj.address) {
      throw new Error(addrObj.error || 'Failed to retrieve wallet public address.');
    }
    return { address: addrObj.address, name: 'Freighter Wallet' };
  }

  // Multi-wallet fallback
  try {
    const addrObj = await getAddress();
    if (addrObj.address) {
      return { address: addrObj.address, name: walletId.toUpperCase() };
    }
    throw new Error(`Wallet ${walletId} not available.`);
  } catch (err: any) {
    throw new Error(err.message || `Wallet ${walletId} is not installed or enabled.`);
  }
}

/**
 * 1. Read-only call: Fetch all notes stored in Soroban Contract instance storage.
 */
export async function fetchNotesFromContract(): Promise<OnChainNote[]> {
  try {
    const contract = new Contract(CONTRACT_ID);

    // Call get_notes() read-only simulation
    const tx = new TransactionBuilder(
      await sorobanServer.getAccount('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'),
      {
        fee: '100',
        networkPassphrase: Networks.TESTNET,
      }
    )
      .addOperation(contract.call('get_notes'))
      .setTimeout(30)
      .build();

    const simResult = await sorobanServer.simulateTransaction(tx);

    if (rpc.Api.isSimulationSuccess(simResult) && simResult.result) {
      const nativeVal = scValToNative(simResult.result.retval);
      if (Array.isArray(nativeVal)) {
        return nativeVal.map((item: any) => ({
          id: item.id ? item.id.toString() : '',
          title: item.title ? item.title.toString() : '',
          content: item.content ? item.content.toString() : '',
        }));
      }
    }
    return [];
  } catch (error) {
    console.warn('Simulated read returned empty or uninitialized storage:', error);
    return [];
  }
}

/**
 * 2. Write call: Create a new note on the Soroban smart contract with error handling.
 */
export async function createNoteOnContract(
  publicKey: string,
  title: string,
  content: string
): Promise<{ success: boolean; hash?: string; error?: string; errorType?: number }> {
  try {
    // Error Type 1: Check if wallet address is valid
    if (!publicKey) {
      return {
        success: false,
        error: 'Wallet not connected. Please select a wallet from StellarWalletsKit.',
        errorType: 1,
      };
    }

    const account = await sorobanServer.getAccount(publicKey);
    const contract = new Contract(CONTRACT_ID);

    // Build operation calling `create_note`
    const tx = new TransactionBuilder(account, {
      fee: '1000',
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        contract.call(
          'create_note',
          nativeToScVal(title, { type: 'string' }),
          nativeToScVal(content, { type: 'string' })
        )
      )
      .setTimeout(30)
      .build();

    // Prepare & simulate for footprint
    const preparedTx = await sorobanServer.prepareTransaction(tx);
    const xdrString = preparedTx.toXDR();

    // Request signature via Freighter
    let signedXdr: string = '';
    try {
      const signRes: any = await freighterSignTransaction(xdrString, {
        networkPassphrase: Networks.TESTNET,
      });
      signedXdr = typeof signRes === 'string' ? signRes : signRes.signedTxXdr || signRes.signedXDR || '';
    } catch (userErr: any) {
      // Error Type 2: User rejected transaction in wallet
      return {
        success: false,
        error: 'Transaction signing was rejected by the user in the wallet.',
        errorType: 2,
      };
    }

    if (!signedXdr) {
      return {
        success: false,
        error: 'User cancelled transaction signing.',
        errorType: 2,
      };
    }

    // Submit to Soroban RPC
    const signedTx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
    const sendResult = await sorobanServer.sendTransaction(signedTx);

    if (sendResult.status === 'ERROR') {
      return {
        success: false,
        error: 'Soroban contract execution failed or insufficient balance for gas fee.',
        errorType: 3,
      };
    }

    return {
      success: true,
      hash: sendResult.hash,
    };
  } catch (err: any) {
    // Error Type 3: Insufficient balance or simulation failure
    return {
      success: false,
      error: err.message || 'Soroban transaction failed during simulation or execution.',
      errorType: 3,
    };
  }
}

/**
 * 3. Write call: Delete a note by ID on the Soroban smart contract.
 */
export async function deleteNoteOnContract(
  publicKey: string,
  noteId: string
): Promise<{ success: boolean; hash?: string; error?: string; errorType?: number }> {
  try {
    if (!publicKey) {
      return {
        success: false,
        error: 'Wallet not connected.',
        errorType: 1,
      };
    }

    const account = await sorobanServer.getAccount(publicKey);
    const contract = new Contract(CONTRACT_ID);

    const tx = new TransactionBuilder(account, {
      fee: '1000',
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        contract.call('delete_note', nativeToScVal(BigInt(noteId), { type: 'u64' }))
      )
      .setTimeout(30)
      .build();

    const preparedTx = await sorobanServer.prepareTransaction(tx);
    const xdrString = preparedTx.toXDR();

    let signedXdr: string = '';
    try {
      const signRes: any = await freighterSignTransaction(xdrString, {
        networkPassphrase: Networks.TESTNET,
      });
      signedXdr = typeof signRes === 'string' ? signRes : signRes.signedTxXdr || signRes.signedXDR || '';
    } catch (userErr: any) {
      return {
        success: false,
        error: 'User cancelled transaction signing.',
        errorType: 2,
      };
    }

    if (!signedXdr) {
      return {
        success: false,
        error: 'User cancelled transaction signing.',
        errorType: 2,
      };
    }

    const signedTx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
    const sendResult = await sorobanServer.sendTransaction(signedTx);

    return {
      success: true,
      hash: sendResult.hash,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to delete note from Soroban contract.',
      errorType: 3,
    };
  }
}
