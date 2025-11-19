/**
 * Helper functions for Identity object field extraction
 * Handles both old (Option<String>) and new (String) contract versions
 */

export function extractBlobId(field: any): string | undefined {
  if (!field) return undefined;
  
  if (typeof field === 'string') {
    return field;
  }
  
  if (field?.vec?.[0]) {
    return field.vec[0];
  }
  
  return undefined;
}

export function getIdentityImageBlobId(identityFields: any): string | undefined {
  if (!identityFields) return undefined;
  
  const imageBlobId = extractBlobId(identityFields.image_blob_id);
  if (imageBlobId) return imageBlobId;
  
  const avatarBlobId = extractBlobId(identityFields.avatar_blob_id);
  return avatarBlobId;
}

