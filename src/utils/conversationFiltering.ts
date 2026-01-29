import { loadPinnedLocations } from './pinnedLocationsStorage';
import { loadSavedRoutes } from './savedRoutesStorage';

export interface ConversationInfo {
  id: string;
  label: string;
  pointsCount: number;
  routesCount: number;
}

/**
 * Get all unique conversations from saved routes and pinned locations
 */
export function getAllConversations(): ConversationInfo[] {
  const routes = loadSavedRoutes();
  const locations = loadPinnedLocations();
  
  const conversationMap = new Map<string, ConversationInfo>();
  
  // Add conversations from routes
  routes.forEach(route => {
    if (route.conversationId) {
      const existing = conversationMap.get(route.conversationId);
      if (existing) {
        existing.routesCount++;
      } else {
        conversationMap.set(route.conversationId, {
          id: route.conversationId,
          label: `Conversation ${route.conversationId.slice(0, 8)}...`,
          pointsCount: 0,
          routesCount: 1,
        });
      }
    }
  });
  
  // Add conversations from locations
  locations.forEach(location => {
    if (location.conversationId) {
      const existing = conversationMap.get(location.conversationId);
      if (existing) {
        existing.pointsCount++;
      } else {
        conversationMap.set(location.conversationId, {
          id: location.conversationId,
          label: `Conversation ${location.conversationId.slice(0, 8)}...`,
          pointsCount: 1,
          routesCount: 0,
        });
      }
    }
  });
  
  return Array.from(conversationMap.values()).sort((a, b) => {
    // Sort by most recent activity (most items)
    const aTotal = a.pointsCount + a.routesCount;
    const bTotal = b.pointsCount + b.routesCount;
    return bTotal - aTotal;
  });
}

/**
 * Get the label for "All Conversations" option
 */
export function getAllConversationsLabel(conversations: ConversationInfo[]): string {
  const totalPoints = conversations.reduce((sum, c) => sum + c.pointsCount, 0);
  const totalRoutes = conversations.reduce((sum, c) => sum + c.routesCount, 0);
  
  return `All Conversations (${conversations.length} conversations, ${totalPoints} points, ${totalRoutes} routes)`;
}
