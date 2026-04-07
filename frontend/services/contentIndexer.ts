import { SuiJsonRpcClient, SuiEvent } from '@mysten/sui/jsonRpc';
import { PACKAGE_ID } from '@/config/sui';
import { saveContent, StoredContent } from '@/utils/contentStorage';

/**
 * ContentIndexer - 从链上事件索引内容
 * 使用事件驱动的索引策略，不依赖合约存储
 */
export class ContentIndexer {
  private suiClient: SuiJsonRpcClient;
  
  constructor(suiClient: SuiJsonRpcClient) {
    this.suiClient = suiClient;
  }
  
  /**
   * 查询空间的历史内容事件
   * @param spaceId - Space object ID
   * @returns 内容列表
   */
  async querySpaceContents(spaceId: string): Promise<StoredContent[]> {
    try {
      const events = await this.suiClient.queryEvents({
        query: {
          MoveEventType: `${PACKAGE_ID}::space::ContentAdded`
        },
        limit: 50,
        order: 'descending'
      });
      
      const contents: StoredContent[] = [];
      
      for (const event of events.data) {
        const data = event.parsedJson as any;
        
        // 只处理当前 space 的内容
        if (data.space_id === spaceId) {
          const content: StoredContent = {
            id: data.blob_object_id,
            spaceId: data.space_id,
            blobId: data.blob_id,
            walrusMetadata: {
              blobId: data.blob_id,
              objectId: data.blob_object_id,
            },
            title: data.title,
            description: data.description,
            type: this.mapContentType(data.content_type),
            encrypted: data.encrypted,
            price: data.price / 1000000000, // Convert MIST to SUI
            tags: data.tags || [],
            createdAt: new Date(Number(data.created_at)).toISOString(),
          };
          
          contents.push(content);
        }
      }
      
      console.log(`📚 Indexed ${contents.length} contents for space ${spaceId}`);
      return contents;
      
    } catch (error) {
      console.error('Failed to query content events:', error);
      throw error;
    }
  }
  
  /**
   * 将 u8 content_type 映射为字符串类型
   */
  private mapContentType(type: number): 'video' | 'essay' | 'image' | 'merch' {
    const map: Record<number, 'video' | 'essay' | 'image' | 'merch'> = {
      1: 'video',
      2: 'essay',
      3: 'image',
    };
    return map[type] || 'essay';
  }
  
  /**
   * 订阅新内容事件（实时更新）
   * 注意：此功能在浏览器端使用，不适合 Vercel serverless
   * @param spaceId - Space object ID
   * @param onContentAdded - 回调函数
   * @returns 取消订阅函数
   */
  async subscribeToContentEvents(
    spaceId: string,
    onContentAdded: (content: StoredContent) => void
  ): Promise<() => Promise<boolean>> {
    try {
      const unsubscribe = await (this.suiClient as any).subscribeEvent({
        filter: {
          MoveEventType: `${PACKAGE_ID}::space::ContentAdded`
        },
        onMessage: (event: SuiEvent) => {
          const data = event.parsedJson as any;
          
          // 只处理当前 space 的内容
          if (data.space_id === spaceId) {
            const content: StoredContent = {
              id: data.blob_object_id,
              spaceId: data.space_id,
              blobId: data.blob_id,
              walrusMetadata: {
                blobId: data.blob_id,
                objectId: data.blob_object_id,
              },
              title: data.title,
              description: data.description,
              type: this.mapContentType(data.content_type),
              encrypted: data.encrypted,
              price: data.price / 1000000000,
              tags: data.tags || [],
              createdAt: new Date(Number(data.created_at)).toISOString(),
            };
            
            console.log('🔔 New content event received:', content.title);
            onContentAdded(content);
          }
        }
      });
      
      console.log('👂 Subscribed to ContentAdded events for space:', spaceId);
      return unsubscribe;
      
    } catch (error) {
      console.error('Failed to subscribe to content events:', error);
      throw error;
    }
  }
}

