export interface DetectedLocation {
  id: string;
  text: string; // Original text that was detected
  type: 'maps_link' | 'address' | 'coordinates';
  coordinates?: {
    lat: number;
    lng: number;
  };
  address?: string;
  formattedAddress?: string; // Human-readable address from reverse geocoding
  messageId?: string;
  timestamp?: string;
  author?: string;
}

export interface ConversationMessage {
  id: string;
  content: string;
  timestamp?: string;
  author?: string;
}

export interface LocationsState {
  conversationLocations: DetectedLocation[];
  savedLocations: DetectedLocation[];
  isLoading: boolean;
  error: string | null;
}