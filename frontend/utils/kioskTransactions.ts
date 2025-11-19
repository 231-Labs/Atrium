import { Transaction } from '@mysten/sui/transactions';
import { KioskTransaction } from '@mysten/kiosk';

export function listNFT(
  nftId: string,
  nftType: string,
  price: string,
  kioskCapId: string,
  kioskClient: any
): Transaction {
  const tx = new Transaction();

  const kioskTx = new KioskTransaction({ 
    transaction: tx, 
    kioskClient,
    cap: tx.object(kioskCapId) as any,
  });
  
  kioskTx.list({
    itemType: nftType,
    itemId: nftId,
    price,
  });

  kioskTx.finalize();

  return tx;
}

export function delistNFT(
  nftId: string,
  nftType: string,
  kioskCapId: string,
  kioskClient: any
): Transaction {
  const tx = new Transaction();

  const kioskTx = new KioskTransaction({ 
    transaction: tx, 
    kioskClient,
    cap: tx.object(kioskCapId) as any,
  });
  
  kioskTx.delist({
    itemType: nftType,
    itemId: nftId,
  });

  kioskTx.finalize();

  return tx;
}

export async function purchaseNFT(
  sellerKioskId: string,
  nftId: string,
  nftType: string,
  price: string,
  buyerKioskCapId: string,
  kioskClient: any
): Promise<Transaction> {
  const tx = new Transaction();

  const kioskTx = new KioskTransaction({ 
    transaction: tx, 
    kioskClient,
    cap: tx.object(buyerKioskCapId) as any,
  });

  await kioskTx.purchaseAndResolve({
    itemType: nftType,
    itemId: nftId,
    price,
    sellerKiosk: sellerKioskId,
  });

  kioskTx.finalize();

  return tx;
}

export function placeNFT(
  nftId: string,
  nftType: string,
  kioskCapId: string,
  kioskClient: any
): Transaction {
  const tx = new Transaction();

  const kioskTx = new KioskTransaction({ 
    transaction: tx, 
    kioskClient,
    cap: tx.object(kioskCapId) as any,
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
  kioskClient: any,
  recipientAddress: string
): Transaction {
  const tx = new Transaction();

  const kioskTx = new KioskTransaction({ 
    transaction: tx, 
    kioskClient,
    cap: tx.object(kioskCapId) as any,
  });
  
  const item = kioskTx.take({
    itemType: nftType,
    itemId: nftId,
  });

  tx.transferObjects([item], tx.pure.address(recipientAddress));

  kioskTx.finalize();

  return tx;
}

