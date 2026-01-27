import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';

export interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
  place_id: number;
}

export interface Coordinate {
  lat: number;
  lng: number;
  id: string;
  text: string;
  address?: string;
}

export const useLocationSearch = (map: L.Map | null) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Search for locations using Nominatim
  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=10&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'FrontMapsApp/1.0',
        },
      });

      if (!response.ok) {
        console.error('Search request failed:', response.status);
        setSearchResults([]);
        setShowSearchDropdown(false);
        setIsSearching(false);
        return;
      }

      const results: SearchResult[] = await response.json();
      console.log(`🔍 Found ${results.length} search results for: "${query}"`);
      
      setSearchResults(results);
      setShowSearchDropdown(results.length > 0);
    } catch (error) {
      console.error('Error searching locations:', error);
      setSearchResults([]);
      setShowSearchDropdown(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchLocations(value);
      }, 500); // 500ms debounce
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  }, [searchLocations]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSearchResultClick = useCallback((result: SearchResult, onLocationSelect: (location: Coordinate) => void) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    const locationToSave: Coordinate = {
      lat,
      lng,
      id: `search-${result.place_id}-${Date.now()}`,
      text: result.display_name,
      address: result.display_name,
    };
    
    onLocationSelect(locationToSave);
    
    // Clear search
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchDropdown(false);
    
    // Center map on the saved location
    if (map) {
      map.setView([lat, lng], 15);
    }
  }, [map]);

  return {
    searchQuery,
    isSearching,
    searchResults,
    showSearchDropdown,
    searchContainerRef,
    handleSearchChange,
    handleSearchResultClick,
    setShowSearchDropdown,
  };
};
