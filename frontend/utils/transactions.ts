import { Transaction } from "@mysten/sui/transactions";
import { 
  SUI_CLOCK, 
  MIST_PER_SUI, 
  SUI_CHAIN,
  PACKAGE_ID,
  IDENTITY_REGISTRY_ID,
  SPACE_REGISTRY_ID,
  FAN_REGISTRY_ID,
  SUBSCRIPTION_REGISTRY_ID,
} from "@/config/sui";

// Re-export for convenience
export { 
  SUI_CLOCK, 
  MIST_PER_SUI, 
  SUI_CHAIN,
  PACKAGE_ID,
  IDENTITY_REGISTRY_ID,
  SPACE_REGISTRY_ID,
  FAN_REGISTRY_ID,
  SUBSCRIPTION_REGISTRY_ID,
};

export const mintIdentity = (username: string, bio: string, avatarBlobId: string, imageBlobId: string) => {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::identity::mint_identity`,
    arguments: [
      tx.object(IDENTITY_REGISTRY_ID),
      tx.pure.string(username),
      tx.pure.string(bio),
      tx.pure.string(avatarBlobId),
      tx.pure.string(imageBlobId),
      tx.object(SUI_CLOCK),
    ],
  });
  return tx;
};

export const bindAvatar = (identityId: string, avatarBlobId: string) => {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::identity::bind_avatar`,
    arguments: [
      tx.object(identityId),
      tx.pure.string(avatarBlobId),
    ],
  });
  return tx;
};

export const updateImage = (identityId: string, imageBlobId: string) => {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::identity::update_image`,
    arguments: [
      tx.object(identityId),
      tx.pure.string(imageBlobId),
    ],
  });
  return tx;
};

export const updateBio = (identityId: string, bio: string) => {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::identity::update_bio`,
    arguments: [
      tx.object(identityId),
      tx.pure.string(bio),
    ],
  });
  return tx;
};

export const becomeCreator = (identityId: string) => {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::identity::become_creator`,
    arguments: [
      tx.object(IDENTITY_REGISTRY_ID),
      tx.object(identityId)
    ],
  });
  return tx;
};

export const initializeSpace = (
  name: string,
  description: string,
  coverImageBlobId: string,
  configQuiltBlobId: string,
  subscriptionPriceInMist: number,
  initPriceInMist: number,
  recipientAddress: string,
) => {
  const tx = new Transaction();
  
  // 1. Create Marketplace Kiosk (for NFT trading in 3D scene)
  const [marketplaceKiosk, marketplaceKioskCap] = tx.moveCall({
    target: "0x2::kiosk::new",
    arguments: [],
  });

  // 2. Prepare payment for initialization fee
  const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(initPriceInMist)]);

  // 3. Initialize Space (creates shared Space + SpaceOwnership NFT)
  tx.moveCall({
    target: `${PACKAGE_ID}::space::initialize_space`,
    arguments: [
      tx.object(SPACE_REGISTRY_ID),
      marketplaceKiosk,  // Marketplace Kiosk (for NFT trading)
      tx.pure.string(name),
      tx.pure.string(description),
      tx.pure.string(coverImageBlobId),
      tx.pure.string(configQuiltBlobId),
      tx.pure.u64(subscriptionPriceInMist),
      paymentCoin,
      tx.object(SUI_CLOCK),
    ],
  });

  // 4. Share Marketplace Kiosk (anyone can view NFTs)
  tx.moveCall({
    target: "0x2::transfer::public_share_object",
    arguments: [marketplaceKiosk],
    typeArguments: ["0x2::kiosk::Kiosk"],
  });

  // 5. Transfer Marketplace Kiosk Cap to the creator
  // Note: SpaceOwnership NFT is automatically transferred to creator by the contract
  tx.transferObjects([marketplaceKioskCap], tx.pure.address(recipientAddress));

  return tx;
};

export const updateSpaceConfig = (
  spaceId: string,
  ownershipId: string,
  options: {
    newName?: string;
    newDescription?: string;
    newCoverImage?: string;
    newConfigQuilt?: string;
    newSubscriptionPrice?: number;
  }
) => {
  const tx = new Transaction();
  
  // Prepare optional arguments using Option type
  const newName = options.newName 
    ? tx.pure.option('string', options.newName)
    : tx.pure.option('string', null);
  
  const newDescription = options.newDescription 
    ? tx.pure.option('string', options.newDescription)
    : tx.pure.option('string', null);
  
  const newCoverImage = options.newCoverImage 
    ? tx.pure.option('string', options.newCoverImage)
    : tx.pure.option('string', null);
  
  const newConfigQuilt = options.newConfigQuilt 
    ? tx.pure.option('string', options.newConfigQuilt)
    : tx.pure.option('string', null);
  
  const newSubscriptionPrice = options.newSubscriptionPrice !== undefined
    ? tx.pure.option('u64', options.newSubscriptionPrice)
    : tx.pure.option('u64', null);

  tx.moveCall({
    target: `${PACKAGE_ID}::space::update_space_config`,
    arguments: [
      tx.object(spaceId),
      tx.object(ownershipId),  // SpaceOwnership NFT for verification
      newName,
      newDescription,
      newCoverImage,
      newConfigQuilt,
      newSubscriptionPrice,
      tx.object(SUI_CLOCK),
    ],
  });
  return tx;
};

// Note: add_fan_avatar is not an entry function in the contract.
// It is called internally by the subscription::subscribe function.
// This function is kept for reference but cannot be used directly.
export const addFanAvatar = (
  kioskId: string,
  fanAddress: string,
  avatarBlobId: string,
) => {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::space::add_fan_avatar`,
    arguments: [
      tx.object(kioskId),
      tx.pure.address(fanAddress),
      tx.pure.string(avatarBlobId),
    ],
  });
  return tx;
};

export const addVideo = (
  spaceId: string,
  ownershipId: string,
  videoBlobId: string,
) => {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::space::add_video`,
    arguments: [
      tx.object(spaceId),
      tx.object(ownershipId),  // SpaceOwnership NFT for verification
      tx.pure.string(videoBlobId),
      tx.object(SUI_CLOCK),
    ],
  });
  return tx;
};

export const subscribeToSpace = (
  identityId: string,
  spaceId: string,
  priceInMist: number,
  durationDays: number,
) => {
  const tx = new Transaction();
  const totalPrice = priceInMist * durationDays;
  const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(totalPrice)]);
  
  tx.moveCall({
    target: `${PACKAGE_ID}::subscription::subscribe`,
    arguments: [
      tx.object(SUBSCRIPTION_REGISTRY_ID),
      tx.object(FAN_REGISTRY_ID),
      tx.object(spaceId),
      tx.object(identityId),
      paymentCoin,
      tx.pure.u64(durationDays),
      tx.object(SUI_CLOCK),
    ],
  });
  return tx;
};

export const renewSubscription = (
  subscriptionId: string,
  priceInMist: number,
  durationDays: number,
) => {
  const tx = new Transaction();
  const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(priceInMist)]);
  
  tx.moveCall({
    target: `${PACKAGE_ID}::subscription::renew_subscription`,
    arguments: [
      tx.object(subscriptionId),
      paymentCoin,
      tx.pure.u64(durationDays),
      tx.object(SUI_CLOCK),
    ],
  });
  return tx;
};

export const sealApproveBySubscription = (
  resourceIdBytes: Uint8Array,
  spaceKioskId: string,
) => {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::space::seal_approve_by_subscription`,
    arguments: [
      tx.pure.vector('u8', Array.from(resourceIdBytes)),
      tx.object(spaceKioskId),
    ],
  });
  return tx;
};
