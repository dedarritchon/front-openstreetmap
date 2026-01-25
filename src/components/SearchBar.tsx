import L from 'leaflet';
import { useCallback, useRef, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import styled from 'styled-components';

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 500px;
`;

const SearchInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
`;

const SearchIcon = styled(FiSearch)`
  position: absolute;
  left: 16px;
  color: #666;
  font-size: 20px;
  pointer-events: none;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 14px 48px 14px 48px;
  border: none;
  outline: none;
  font-size: 16px;
  background: transparent;

  &::placeholder {
    color: #999;
  }

  &:focus {
    outline: none;
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: color 0.2s;

  &:hover {
    color: #333;
  }
`;

const SuggestionsContainer = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
`;

const SuggestionItem = styled.div`
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f8f9fa;
  }
`;

const SuggestionMain = styled.div`
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
`;

const SuggestionSecondary = styled.div`
  font-size: 12px;
  color: #666;
`;

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

interface SearchBarProps {
  map: L.Map | null;
  onPlaceSelect?: (place: { lat: number; lng: number; name: string }) => void;
  placeholder?: string;
}

const SearchBar = ({
  map,
  onPlaceSelect,
  placeholder = 'Search for a location...',
}: SearchBarProps) => {
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback(async (value: string) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        // Use Nominatim search API (free, no API key required)
        const encodedQuery = encodeURIComponent(value);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=5&addressdetails=1`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'FrontMapsApp/1.0', // Required by Nominatim
          },
        });

        if (response.ok) {
          const data: NominatimResult[] = await response.json();
          setSuggestions(data);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    handleSearch(value);
  };

  const handleSuggestionClick = async (suggestion: NominatimResult) => {
    if (!map) return;

    try {
      const lat = parseFloat(suggestion.lat);
      const lng = parseFloat(suggestion.lon);
      
      setSearchValue(suggestion.display_name);
      setShowSuggestions(false);

      // Center map on selected location
      map.setView([lat, lng], 15);

      if (onPlaceSelect) {
        onPlaceSelect({
          lat,
          lng,
          name: suggestion.display_name,
        });
      }
    } catch (error) {
      console.error('Error selecting place:', error);
    }
  };

  const handleClear = () => {
    setSearchValue('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <SearchContainer>
      <SearchInputWrapper>
        <SearchIcon />
        <SearchInput
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />
        {searchValue && (
          <ClearButton onClick={handleClear}>
            <FiX size={20} />
          </ClearButton>
        )}
      </SearchInputWrapper>

      {showSuggestions && suggestions.length > 0 && (
        <SuggestionsContainer>
          {suggestions.map((suggestion) => {
            const parts = suggestion.display_name.split(',');
            const mainText = parts[0] || suggestion.display_name;
            const secondaryText = parts.slice(1).join(', ').trim();
            
            return (
              <SuggestionItem
                key={suggestion.place_id}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <SuggestionMain>{mainText}</SuggestionMain>
                {secondaryText && <SuggestionSecondary>{secondaryText}</SuggestionSecondary>}
              </SuggestionItem>
            );
          })}
        </SuggestionsContainer>
      )}
    </SearchContainer>
  );
};

export default SearchBar;
