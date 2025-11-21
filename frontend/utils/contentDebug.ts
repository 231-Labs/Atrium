// Debug utilities for content storage
// Use in browser console: window.atriumDebug

import { getAllContent, getContentBySpace, deleteContent } from './contentStorage';

export const contentDebug = {
  // List all stored content
  listAll: () => {
    const contents = getAllContent();
    console.log('📦 Total contents:', contents.length);
    console.table(contents.map(c => ({
      id: c.id,
      spaceId: c.spaceId.slice(0, 10) + '...',
      title: c.title,
      type: c.type,
      encrypted: c.encrypted,
      blobId: c.blobId.slice(0, 20) + '...',
      objectId: c.walrusMetadata?.objectId?.slice(0, 20) + '...' || 'N/A',
      createdAt: new Date(c.createdAt).toLocaleString(),
    })));
    return contents;
  },

  // List contents for a specific space
  listBySpace: (spaceId: string) => {
    const contents = getContentBySpace(spaceId);
    console.log(`📦 Contents for space ${spaceId}:`, contents.length);
    console.table(contents);
    return contents;
  },

  // Clear all content
  clearAll: () => {
    if (confirm('⚠️ Are you sure you want to delete ALL content?')) {
      localStorage.removeItem('atrium_content_items');
      console.log('✅ All content cleared');
      window.dispatchEvent(new CustomEvent('atrium-content-updated'));
    }
  },

  // Delete specific content
  delete: (contentId: string) => {
    deleteContent(contentId);
    console.log('✅ Content deleted:', contentId);
    return getAllContent();
  },

  // Show detailed info for one content item
  details: (contentId: string) => {
    const contents = getAllContent();
    const content = contents.find(c => c.id === contentId);
    if (content) {
      console.log('📄 Content Details:');
      console.log(JSON.stringify(content, null, 2));
    } else {
      console.log('❌ Content not found:', contentId);
    }
    return content;
  },

  // Export all content as JSON
  export: () => {
    const contents = getAllContent();
    const json = JSON.stringify(contents, null, 2);
    console.log('📤 Exported content (copy this):');
    console.log(json);
    return json;
  },

  // Get raw localStorage data
  raw: () => {
    const raw = localStorage.getItem('atrium_content_items');
    console.log('🔍 Raw localStorage data:');
    console.log(raw);
    return raw;
  },
};

// Make it available in browser console
if (typeof window !== 'undefined') {
  (window as any).atriumDebug = contentDebug;
  console.log('🐛 Atrium Debug Tools loaded. Use window.atriumDebug to access:');
  console.log('  - atriumDebug.listAll()');
  console.log('  - atriumDebug.listBySpace(spaceId)');
  console.log('  - atriumDebug.clearAll()');
  console.log('  - atriumDebug.delete(contentId)');
  console.log('  - atriumDebug.details(contentId)');
  console.log('  - atriumDebug.export()');
  console.log('  - atriumDebug.raw()');
}

export default contentDebug;

