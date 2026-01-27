import { addPinnedLocation, type PinnedLocation } from './pinnedLocationsStorage';

/**
 * Export pinned locations to CSV format
 * Format: coord,name
 */
export const exportPointsToCSV = (locations: PinnedLocation[]): void => {
  if (locations.length === 0) {
    alert('No points to export');
    return;
  }

  // Create CSV content
  const csvLines = ['coord,name'];
  
  locations.forEach((location) => {
    const coord = `"${location.lat},${location.lng}"`;
    const name = `"${(location.name || location.address || location.text || '').replace(/"/g, '""')}"`;
    csvLines.push(`${coord},${name}`);
  });

  const csvContent = csvLines.join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `map-points-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log(`✅ Exported ${locations.length} points to CSV`);
};

/**
 * Parse CSV content and extract coordinates and names
 */
const parseCSV = (content: string): Array<{ lat: number; lng: number; name: string }> => {
  const lines = content.split('\n').filter(line => line.trim());
  
  // Skip header if it exists
  const startIndex = lines[0].toLowerCase().includes('coord') ? 1 : 0;
  
  const points: Array<{ lat: number; lng: number; name: string }> = [];
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      // Parse CSV line (handle quoted values)
      const matches = line.match(/(?:"([^"]*)"|([^,]+))(?:,|$)/g);
      if (!matches || matches.length < 2) continue;
      
      // Extract coord and name
      const coordStr = matches[0].replace(/[",]/g, '').trim();
      const name = matches.slice(1).join(',').replace(/^"|"$/g, '').replace(/""/g, '"').trim();
      
      // Parse coordinates
      const [latStr, lngStr] = coordStr.split(',').map(s => s.trim());
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      
      if (isNaN(lat) || isNaN(lng)) {
        console.warn(`⚠️ Invalid coordinates on line ${i + 1}: ${coordStr}`);
        continue;
      }
      
      // Validate coordinate ranges
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.warn(`⚠️ Coordinates out of range on line ${i + 1}: ${lat}, ${lng}`);
        continue;
      }
      
      points.push({ lat, lng, name: name || `Point ${i}` });
    } catch (error) {
      console.warn(`⚠️ Error parsing line ${i + 1}: ${line}`, error);
    }
  }
  
  return points;
};

/**
 * Import points from CSV file
 */
export const importPointsFromCSV = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const points = parseCSV(content);
        
        if (points.length === 0) {
          reject(new Error('No valid points found in CSV file'));
          return;
        }
        
        // Add all points as pinned locations
        let successCount = 0;
        points.forEach((point) => {
          try {
            const locationId = `csv-import-${point.lat}-${point.lng}-${Date.now()}-${Math.random()}`;
            addPinnedLocation({
              id: locationId,
              lat: point.lat,
              lng: point.lng,
              text: point.name,
              name: point.name,
            });
            successCount++;
          } catch (error) {
            console.error(`❌ Error adding point: ${point.name}`, error);
          }
        });
        
        // Notify that pinned locations were updated
        window.dispatchEvent(new CustomEvent('pinnedLocationsUpdated'));
        
        console.log(`✅ Imported ${successCount} points from CSV`);
        resolve(successCount);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};
