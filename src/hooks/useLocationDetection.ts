import { useEffect, useState } from 'react';
import { detectCoordinates, detectAddresses, geocodeAddress, reverseGeocode } from '../utils/locationDetection';
import { useFrontContext } from './useFrontContext';

export interface Coordinate {
  lat: number;
  lng: number;
  id: string;
  text: string;
  address?: string;
}

export const useLocationDetection = () => {
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const frontContext = useFrontContext();

  useEffect(() => {
    const fetchMessagesAndDetectCoordinates = async () => {
      if (!frontContext || frontContext.type !== 'singleConversation') {
        console.log('📭 No front context or not a single conversation');
        setIsLoadingLocations(false);
        return;
      }

      const conversationId = frontContext.conversation?.id;
      if (!conversationId) {
        console.log('📭 No conversation ID');
        setIsLoadingLocations(false);
        return;
      }

      console.log('🔍 Starting to fetch conversation messages...', { conversationId });

      setIsLoadingLocations(true);
      try {
        const allMessages: any[] = [];
        const allComments: any[] = [];
        let nextPaginationToken: any = undefined;

        // Paginate through all messages
        do {
          console.log('📥 Fetching messages page...', { hasToken: !!nextPaginationToken });
          const messageList = await frontContext.listMessages(nextPaginationToken);
          console.log(`✅ Fetched ${messageList.results.length} messages in this page`);
          allMessages.push(...messageList.results);
          nextPaginationToken = messageList.nextPageToken;
        } while (nextPaginationToken);

        console.log(`✅ Total messages fetched: ${allMessages.length}`);

        // Paginate through all comments
        console.log('🔍 Starting to fetch conversation comments...');
        nextPaginationToken = undefined;
        do {
          console.log('📥 Fetching comments page...', { hasToken: !!nextPaginationToken });
          const commentList = await frontContext.listComments(nextPaginationToken);
          console.log(`✅ Fetched ${commentList.results.length} comments in this page`);
          allComments.push(...commentList.results);
          nextPaginationToken = commentList.nextPageToken;
        } while (nextPaginationToken);

        console.log(`✅ Total comments fetched: ${allComments.length}`);

        // Convert messages to text format
        const allContent = [
          ...allMessages.map((msg) => {
            let textContent = '';
            if (msg.content?.body && typeof msg.content.body === 'string') {
              textContent = msg.content.body;
            } else if (msg.body && typeof msg.body === 'string') {
              textContent = msg.body;
            } else if (msg.text && typeof msg.text === 'string') {
              textContent = msg.text;
            }
            
            // Strip HTML tags
            if (textContent) {
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = textContent;
              textContent = tempDiv.textContent || tempDiv.innerText || '';
            }
            
            return textContent;
          }),
          ...allComments.map((comment) => {
            let textContent = '';
            if (comment.body && typeof comment.body === 'string') {
              textContent = comment.body;
            } else if (comment.content?.body && typeof comment.content.body === 'string') {
              textContent = comment.content.body;
            } else if (comment.text && typeof comment.text === 'string') {
              textContent = comment.text;
            }
            
            // Strip HTML tags
            if (textContent) {
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = textContent;
              textContent = tempDiv.textContent || tempDiv.innerText || '';
            }
            
            return textContent;
          }),
        ];

        console.log(`📝 Total content items to analyze: ${allContent.length}`);

        // Detect coordinates and addresses from all content
        const detectedCoords: Coordinate[] = [];
        const detectedAddresses: { address: string; id: string; text: string }[] = [];
        
        allContent.forEach((text) => {
          if (!text || text.trim().length === 0) return;
          
          // Detect coordinates
          const coordLocations = detectCoordinates(text);
          coordLocations.forEach((loc) => {
            if (loc.coordinates) {
              detectedCoords.push({
                lat: loc.coordinates.lat,
                lng: loc.coordinates.lng,
                id: loc.id,
                text: loc.text,
              });
            }
          });
          
          // Detect addresses with ADDRESS: or DIRECTION: prefix
          const addressLocations = detectAddresses(text);
          addressLocations.forEach((loc) => {
            if (loc.address) {
              detectedAddresses.push({
                address: loc.address,
                id: loc.id,
                text: loc.text,
              });
            }
          });
        });

        console.log(`🎯 Total coordinates detected: ${detectedCoords.length}`);
        console.log(`🏠 Total addresses detected: ${detectedAddresses.length}`);
        
        // Deduplicate coordinates (same lat/lng within small tolerance)
        const uniqueCoords: Coordinate[] = [];
        const seenCoords = new Set<string>();
        
        detectedCoords.forEach((coord) => {
          const key = `${coord.lat.toFixed(6)},${coord.lng.toFixed(6)}`;
          if (!seenCoords.has(key)) {
            seenCoords.add(key);
            uniqueCoords.push(coord);
          }
        });
        
        console.log(`✅ After deduplication: ${uniqueCoords.length} unique coordinates`);
        
        // Geocode addresses to get coordinates (with rate limiting for Nominatim)
        if (detectedAddresses.length > 0) {
          console.log('🌍 Starting geocoding addresses...');
          const geocodedAddresses: (Coordinate | null)[] = [];
          
          // Process addresses one at a time with delay to respect Nominatim rate limit (1 req/sec)
          for (let index = 0; index < detectedAddresses.length; index++) {
            const addr = detectedAddresses[index];
            console.log(`  🔄 Geocoding address ${index + 1}/${detectedAddresses.length}: "${addr.address}"`);
            
            // Add delay between requests (except for the first one)
            if (index > 0) {
              await new Promise(resolve => setTimeout(resolve, 1100)); // 1.1 seconds between requests
            }
            
            try {
              const coords = await geocodeAddress(addr.address);
              if (coords) {
                console.log(`    ✅ Geocoded to: ${coords.lat}, ${coords.lng}`);
                geocodedAddresses.push({
                  lat: coords.lat,
                  lng: coords.lng,
                  id: addr.id,
                  text: addr.text,
                  address: addr.address,
                });
              } else {
                geocodedAddresses.push(null);
              }
            } catch (error) {
              console.error(`    ❌ Error geocoding:`, error);
              geocodedAddresses.push(null);
            }
          }
          
          // Add successfully geocoded addresses to coordinates list (check for duplicates)
          const validGeocoded = geocodedAddresses.filter((addr): addr is Coordinate => addr !== null);
          console.log(`✅ Successfully geocoded ${validGeocoded.length}/${detectedAddresses.length} addresses`);
          
          validGeocoded.forEach((coord) => {
            const key = `${coord.lat.toFixed(6)},${coord.lng.toFixed(6)}`;
            if (!seenCoords.has(key)) {
              seenCoords.add(key);
              uniqueCoords.push(coord);
            }
          });
        }
        
        // Update detectedCoords to use deduplicated list
        const finalCoords = uniqueCoords;
        
        // Reverse geocode coordinates that don't already have addresses
        const coordsNeedingAddresses = finalCoords.filter(c => !c.address);
        if (coordsNeedingAddresses.length > 0) {
          console.log('🏠 Starting reverse geocoding for coordinates...');
          const coordsWithAddresses = await Promise.all(
            coordsNeedingAddresses.map(async (coord) => {
              try {
                const address = await reverseGeocode(coord.lat, coord.lng);
                if (address) {
                  return { ...coord, address };
                }
                return coord;
              } catch (error) {
                console.error(`    ❌ Error reverse geocoding:`, error);
                return coord;
              }
            })
          );
          
          // Update coordinates that were reverse geocoded
          const updatedCoords = finalCoords.map(coord => {
            const updated = coordsWithAddresses.find(c => c.id === coord.id);
            return updated || coord;
          });
          
          console.log(`✅ Reverse geocoding complete. ${updatedCoords.filter(c => c.address).length} addresses found.`);
          setCoordinates(updatedCoords);
        } else {
          // All coordinates already have addresses (from geocoding)
          console.log('✅ All coordinates already have addresses');
          setCoordinates(finalCoords);
        }
      } catch (err) {
        console.error('❌ Error fetching messages and comments:', err);
      } finally {
        setIsLoadingLocations(false);
      }
    };

    if (frontContext) {
      fetchMessagesAndDetectCoordinates();
    }
  }, [frontContext]);

  return { coordinates, isLoadingLocations, setCoordinates };
};
