import { Transaction } from '@mysten/sui/transactions';
import { KioskTransaction, KioskClient } from '@mysten/kiosk';

export interface KioskCapData {
  objectId: string;
  kioskId: string;
  isPersonal?: boolean;
}

export function listNFT(
  nftId: string,
  nftType: string,
  price: bigint,
  kioskCapId: string | KioskCapData,
  kioskClient: KioskClient
): Transaction {
  if (!kioskClient) {
    throw new Error('kioskClient is required but was undefined');
  }
  if (!kioskCapId) {
    throw new Error('kioskCapId is required but was undefined');
  }

  const tx = new Transaction();
  const cap = typeof kioskCapId === 'string' ? kioskCapId : kioskCapId;

  const kioskTx = new KioskTransaction({ 
    transaction: tx, 
    kioskClient,
    cap: cap as any,
  });
  
  kioskTx.list({
    itemId: nftId,
    itemType: nftType,
    price,
  });

  kioskTx.finalize();

  return tx;
}

export function delistNFT(
  nftId: string,
  nftType: string,
  kioskCapId: string | KioskCapData,
  kioskClient: KioskClient
): Transaction {
  if (!kioskClient) {
    throw new Error('kioskClient is required but was undefined');
  }
  if (!kioskCapId) {
    throw new Error('kioskCapId is required but was undefined');
  }

  const tx = new Transaction();
  const cap = typeof kioskCapId === 'string' ? kioskCapId : kioskCapId;

  const kioskTx = new KioskTransaction({ 
    transaction: tx, 
    kioskClient,
    cap: cap as any,
  });
  
  kioskTx.delist({
    itemId: nftId,
    itemType: nftType,
  });

  kioskTx.finalize();

  return tx;
}

export async function purchaseNFT(
  sellerKioskId: string,
  nftId: string,
  nftType: string,
  price: bigint,
  buyerKioskId: string | null,
  kioskClient: KioskClient,
  buyerAddress: string
): Promise<Transaction> {
  console.log('🛒 purchaseNFT called with:', {
    sellerKioskId,
    nftId,
    nftType,
    price: price.toString(),
    buyerKioskId,
    buyerAddress,
    kioskClient: !!kioskClient
  });

  if (!kioskClient) {
    throw new Error('kioskClient is required');
  }

  if (!buyerAddress) {
    throw new Error('buyerAddress is required');
  }

  try {
    const tx = new Transaction();
    console.log('📝 Transaction created');

    // Fetch the buyer's kiosk caps
    const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({
      address: buyerAddress
    });
    
    console.log('🔑 Fetched kiosk caps:', kioskOwnerCaps?.length || 0);
    console.log('🔑 All caps:', kioskOwnerCaps?.map(cap => ({
      objectId: cap.objectId,
      kioskId: cap.kioskId,
      isPersonal: cap.isPersonal
    })));

    if (!kioskOwnerCaps || kioskOwnerCaps.length === 0) {
      throw new Error('You do not have any kiosks. Please create one in settings first.');
    }

    // Find the matching cap by kiosk ID, or use the first one if not specified
    let matchingCap = buyerKioskId 
      ? kioskOwnerCaps.find(cap => cap.kioskId === buyerKioskId)
      : kioskOwnerCaps[0];
    
    // Fallback to first kiosk if specified one not found
    if (!matchingCap && buyerKioskId) {
      console.warn('⚠️ Specified kiosk not found, using first available kiosk');
      console.warn('  Looking for:', buyerKioskId);
      console.warn('  Available:', kioskOwnerCaps.map(cap => cap.kioskId));
      matchingCap = kioskOwnerCaps[0];
    }

    if (!matchingCap) {
      throw new Error('Could not find a valid kiosk. Please create one in settings first.');
    }

    console.log('✅ Using kiosk cap:', {
      objectId: matchingCap.objectId,
      kioskId: matchingCap.kioskId,
      isPersonal: matchingCap.isPersonal
    });

    const kioskTx = new KioskTransaction({ 
      transaction: tx, 
      kioskClient,
      cap: matchingCap,
    });
    console.log('📦 KioskTransaction created');

    await kioskTx.purchaseAndResolve({
      itemId: nftId,
      itemType: nftType,
      price,
      sellerKiosk: sellerKioskId,
    });
    console.log('✅ purchaseAndResolve completed');

    kioskTx.finalize();
    console.log('✅ Transaction finalized');

    return tx;
  } catch (error) {
    console.error('❌ Error in purchaseNFT:', error);
    throw error;
  }
}

export function placeNFT(
  nftId: string,
  nftType: string,
  kioskCapId: string,
  kioskClient: KioskClient
): Transaction {
  const tx = new Transaction();

  const kioskTx = new KioskTransaction({ 
    transaction: tx, 
    kioskClient,
    cap: kioskCapId as any,
  });
  
  kioskTx.place({
    itemType: nftType,
    item: tx.object(nftId),
  });

  kioskTx.finalize();

  return tx;
}

export function takeNFT(
  nftId: string,
  nftType: string,
  kioskCapId: string,
  kioskClient: KioskClient,
  recipientAddress: string
): Transaction {
  const tx = new Transaction();

  const kioskTx = new KioskTransaction({ 
    transaction: tx, 
    kioskClient,
    cap: kioskCapId as any,
  });
  
  const item = kioskTx.take({
    itemType: nftType,
    itemId: nftId,
  });

  tx.transferObjects([item], tx.pure.address(recipientAddress));

  kioskTx.finalize();

  return tx;
}

