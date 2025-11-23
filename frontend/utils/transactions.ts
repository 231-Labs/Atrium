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

export const mintIdentity = (
  username: string,
  bio: string,
  avatarBlobId: string,
  imageBlobId: string,
  recipientAddress: string
) => {
  const tx = new Transaction();
  const [identity] = tx.moveCall({
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
  
  // Transfer Identity NFT to recipient
  tx.transferObjects([identity], recipientAddress);
  
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
  
  // 1. Prepare payment for initialization fee
  const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(initPriceInMist)]);

  // 2. Initialize Space (returns SpaceOwnership NFT, change, marketplace kiosk, kiosk cap)
  // Note: Fee is automatically transferred to protocol treasury inside the contract
  const [ownership, change, marketplaceKiosk, marketplaceKioskCap] = tx.moveCall({
    target: `${PACKAGE_ID}::space::initialize_space`,
    arguments: [
      tx.object(SPACE_REGISTRY_ID),
      tx.object(IDENTITY_REGISTRY_ID),
      tx.pure.string(name),
      tx.pure.string(description),
      tx.pure.string(coverImageBlobId),
      tx.pure.string(configQuiltBlobId),
      tx.pure.u64(subscriptionPriceInMist),
      paymentCoin,
      tx.object(SUI_CLOCK),
    ],
  });
  
  // 3. Get Space ID from SpaceOwnership NFT
  // Note: We'll need to query the event to get the actual space_id
  // For now, we'll create the creator subscription in a separate transaction after Space creation
  
  // 4. Transfer ownership to recipient
  tx.transferObjects([ownership], recipientAddress);
  
  // 5. Transfer change back to recipient
  tx.transferObjects([change], recipientAddress);

  // 6. Share Marketplace Kiosk (anyone can view NFTs)
  tx.moveCall({
    target: "0x2::transfer::public_share_object",
    arguments: [marketplaceKiosk],
    typeArguments: ["0x2::kiosk::Kiosk"],
  });

  // 7. Transfer Marketplace Kiosk Cap to the creator
  tx.transferObjects([marketplaceKioskCap], recipientAddress);

  return tx;
};

/**
 * Create a lifetime subscription for the space creator
 * Should be called after space is created
 */
export const createCreatorSubscription = (
  spaceId: string,
  creatorAddress: string,
) => {
  const tx = new Transaction();
  
  // Create creator subscription (returns Subscription NFT)
  const [creatorSubscription] = tx.moveCall({
    target: `${PACKAGE_ID}::subscription::create_creator_subscription`,
    arguments: [
      tx.object(SUBSCRIPTION_REGISTRY_ID),
      tx.object(spaceId),
      tx.pure.address(creatorAddress),
      tx.object(SUI_CLOCK),
    ],
  });
  
  // Transfer subscription NFT to creator
  tx.transferObjects([creatorSubscription], creatorAddress);

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
  subscriberAddress: string,
  creatorAddress: string,
) => {
  const tx = new Transaction();
  const totalPrice = priceInMist * durationDays;
  const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(totalPrice)]);
  
  // Returns: (Subscription NFT, payment for creator, change)
  const [subscription, paymentForCreator, change] = tx.moveCall({
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
  
  // Transfer subscription NFT to subscriber
  tx.transferObjects([subscription], subscriberAddress);
  
  // Transfer payment to creator
  tx.transferObjects([paymentForCreator], creatorAddress);
  
  // Transfer change back to subscriber
  tx.transferObjects([change], subscriberAddress);
  
  return tx;
};

export const renewSubscription = (
  subscriptionId: string,
  spaceId: string,
  priceInMist: number,
  durationDays: number,
  subscriberAddress: string,
  creatorAddress: string,
) => {
  const tx = new Transaction();
  const totalPrice = priceInMist * durationDays;
  const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(totalPrice)]);
  
  // Returns: (payment for creator, change)
  const [paymentForCreator, change] = tx.moveCall({
    target: `${PACKAGE_ID}::subscription::renew_subscription`,
    arguments: [
      tx.object(SUBSCRIPTION_REGISTRY_ID),
      tx.object(subscriptionId),
      paymentCoin,
      tx.object(spaceId),
      tx.pure.u64(durationDays),
      tx.object(SUI_CLOCK),
    ],
  });
  
  // Transfer payment to creator
  tx.transferObjects([paymentForCreator], creatorAddress);
  
  // Transfer change back to subscriber
  tx.transferObjects([change], subscriberAddress);
  
  return tx;
};

/**
 * Seal approve for content decryption - Subscriber version
 * @deprecated This function is not used. Use seal_approve_as_subscriber or seal_approve_as_creator directly in sealContent.ts
 * @param resourceIdBytes - Resource ID as bytes
 * @param spaceId - Space object ID
 * @param subscriptionId - Subscription NFT ID
 */
export const sealApproveBySubscription = (
  resourceIdBytes: Uint8Array,
  spaceId: string,
  subscriptionId: string,
) => {
  console.log('🔐 [sealApproveBySubscription] Building transaction with:', {
    resourceIdBytesLength: resourceIdBytes.length,
    resourceIdHex: Array.from(resourceIdBytes).map(b => b.toString(16).padStart(2, '0')).join(''),
    spaceId,
    spaceIdLength: spaceId.length,
    subscriptionId,
    packageId: PACKAGE_ID,
  });
  
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::subscription::seal_approve_as_subscriber`,
    arguments: [
      tx.pure.vector('u8', Array.from(resourceIdBytes)),
      tx.object(spaceId),
      tx.object(subscriptionId),  // Subscription NFT
      tx.object('0x6'),           // Clock object
    ],
  });
  return tx;
};

/**
 * Record content upload (emits ContentAdded event)
 * @param spaceId - Space object ID
 * @param ownershipId - SpaceOwnership NFT ID
 * @param blobObjectId - Walrus blob object ID (0x7e7f...)
 * @param blobId - Walrus blob ID for retrieval
 * @param contentType - Type of content (video, essay, image)
 * @param title - Content title
 * @param description - Content description
 * @param encrypted - Whether content is encrypted
 * @param price - Price in SUI (will be converted to MIST)
 * @param tags - Array of tags
 */
export const recordContent = (
  spaceId: string,
  ownershipId: string,
  blobObjectId: string,
  blobId: string,
  contentType: 'video' | 'essay' | 'image',
  title: string,
  description: string,
  encrypted: boolean,
  price: number,
  tags: string[]
) => {
  const tx = new Transaction();
  
  // Map content type to u8
  const typeMap: Record<string, number> = { 
    video: 1, 
    essay: 2, 
    image: 3 
  };
  
  tx.moveCall({
    target: `${PACKAGE_ID}::space::record_content`,
    arguments: [
      tx.object(spaceId),
      tx.object(ownershipId),
      tx.pure.id(blobObjectId),
      tx.pure.string(blobId),
      tx.pure.u8(typeMap[contentType]),
      tx.pure.string(title),
      tx.pure.string(description),
      tx.pure.bool(encrypted),
      tx.pure.u64(Math.floor(price * MIST_PER_SUI)),
      tx.pure.vector('string', tags),
      tx.object(SUI_CLOCK),
    ],
  });
  
  return tx;
};
