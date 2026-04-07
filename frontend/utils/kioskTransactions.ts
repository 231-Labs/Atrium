import { Transaction } from '@mysten/sui/transactions';
import { KioskTransaction, KioskClient } from '@mysten/kiosk';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';

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
  if (!kioskClient) {
    throw new Error('kioskClient is required');
  }

  if (!buyerAddress) {
    throw new Error('buyerAddress is required');
  }

  try {
    const suiClient = kioskClient.client as SuiJsonRpcClient;
    const { data: kioskCaps } = await suiClient.getOwnedObjects({
      owner: buyerAddress,
      filter: {
        StructType: '0x2::kiosk::KioskOwnerCap'
      },
      options: {
        showContent: true,
        showType: true,
      }
    });

    if (!kioskCaps || kioskCaps.length === 0) {
      throw new Error('You do not have any kiosks. Please create one in settings first.');
    }

    // Find the matching cap or use first one
    let capObj = kioskCaps[0];
    
    if (buyerKioskId && kioskCaps.length > 1) {
      // Try to find matching kiosk
      const found = kioskCaps.find(cap => {
        if (cap.data?.content && 'fields' in cap.data.content) {
          const fields = cap.data.content.fields as any;
          const kioskId = fields.for || fields.kiosk_id;
          return kioskId === buyerKioskId;
        }
        return false;
      });
      if (found) capObj = found;
    }

    if (!capObj.data?.content || !('fields' in capObj.data.content)) {
      throw new Error('Invalid kiosk cap structure');
    }

    const fields = capObj.data.content.fields as any;
    const finalKioskId = fields.for || fields.kiosk_id;
    const finalKioskCapId = capObj.data.objectId;

    if (!finalKioskId || !finalKioskCapId) {
      throw new Error('Could not extract kiosk ID or cap ID');
    }

    // Fetch transfer policy
    const policies = await kioskClient.getTransferPolicies({
      type: nftType
    });
    
    if (!policies || policies.length === 0) {
      throw new Error('No transfer policy found for this NFT type');
    }
    
    const policy = policies[0];

    // Check for royalty rule
    const hasRoyaltyRule = policy.rules && policy.rules.some((rule: any) => {
      const ruleStr = typeof rule === 'string' ? rule : JSON.stringify(rule);
      return ruleStr.includes('royalty_rule') || ruleStr.includes('RoyaltyRule');
    });

    // Build transaction manually
    const tx = new Transaction();
    
    // Calculate royalty (10% = 1000 basis points)
    const royaltyBps = 1000;
    const priceNum = Number(price);
    const royaltyAmount = hasRoyaltyRule ? Math.floor((priceNum * royaltyBps) / 10000) : 0;

    // Split coins for payment
    const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(priceNum)]);
    
    // Split coins for royalty if needed
    let royaltyCoin;
    if (royaltyAmount > 0) {
      [royaltyCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(royaltyAmount)]);
    }

    // Purchase from kiosk
    const [item, transferRequest] = tx.moveCall({
      target: '0x2::kiosk::purchase',
      typeArguments: [nftType],
      arguments: [
        tx.object(sellerKioskId),
        tx.pure.id(nftId),
        paymentCoin,
      ],
    });

    // Pay royalty if needed
    if (hasRoyaltyRule && royaltyAmount > 0 && royaltyCoin) {
      let royaltyPackageId = null;
      
      // Extract package ID from policy rules
      if (policy.rules && policy.rules.length > 0) {
        const royaltyRuleStr = policy.rules.find((rule: any) => {
          const ruleStr = typeof rule === 'string' ? rule : JSON.stringify(rule);
          return ruleStr.includes('royalty_rule');
        });
        
        if (royaltyRuleStr) {
          const ruleStr = typeof royaltyRuleStr === 'string' ? royaltyRuleStr : JSON.stringify(royaltyRuleStr);
          const packageMatch = ruleStr.match(/^(0x[a-fA-F0-9]+)::/);
          if (packageMatch) {
            royaltyPackageId = packageMatch[1];
          }
        }
      }
      
      // Fallback: extract package ID from NFT type
      if (!royaltyPackageId) {
        const packageMatch = nftType.match(/(0x[a-fA-F0-9]+)::/);
        if (packageMatch) {
          royaltyPackageId = packageMatch[1];
        } else {
          throw new Error('Could not extract package ID from NFT type or policy rules');
        }
      }
      
      tx.moveCall({
        target: `${royaltyPackageId}::royalty_rule::pay`,
        typeArguments: [nftType],
        arguments: [
          tx.object(policy.id),
          transferRequest,
          royaltyCoin,
        ],
      });
    }

    // Confirm transfer request
    tx.moveCall({
      target: '0x2::transfer_policy::confirm_request',
      typeArguments: [nftType],
      arguments: [
        tx.object(policy.id),
        transferRequest,
      ],
    });

    // Place item in buyer's kiosk
    tx.moveCall({
      target: '0x2::kiosk::place',
      typeArguments: [nftType],
      arguments: [
        tx.object(finalKioskId),
        tx.object(finalKioskCapId),
        item,
      ],
    });

    return tx;
  } catch (error) {
    console.error('Error in purchaseNFT:', error);
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

