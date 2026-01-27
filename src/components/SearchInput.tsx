import styled from 'styled-components';
import type { SearchResult } from '../hooks/useLocationSearch';

const SearchContainer = styled.div`
  flex: 1;
  max-width: 400px;
  position: relative;
  margin: 0 16px;
`;

const SearchInputField = styled.input`
  width: 100%;
  padding: 8px 12px;
  padding-right: 36px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &::placeholder {
    color: #999;
  }
`;

const SearchIcon = styled.span`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  pointer-events: none;
`;

const SearchDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 400px;
  overflow-y: auto;
  z-index: 3000;
`;

const SearchResultItem = styled.div`
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
  
  &:hover {
    background: #f8f9fa;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const SearchResultName = styled.div`
  font-weight: 500;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
`;

const SearchResultDetails = styled.div`
  font-size: 12px;
  color: #666;
`;

interface SearchInputProps {
  searchQuery: string;
  isSearching: boolean;
  searchResults: SearchResult[];
  showSearchDropdown: boolean;
  searchContainerRef: React.RefObject<HTMLDivElement | null> | React.RefObject<HTMLDivElement>;
  onSearchChange: (value: string) => void;
  onSearchResultClick: (result: SearchResult) => void;
  onFocus?: () => void;
}

export const SearchInput = ({
  searchQuery,
  isSearching,
  searchResults,
  showSearchDropdown,
  searchContainerRef,
  onSearchChange,
  onSearchResultClick,
  onFocus,
}: SearchInputProps) => {
  return (
    <SearchContainer ref={searchContainerRef}>
      <SearchInputField
        type="text"
        placeholder="Search for a location..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onFocus={() => {
          if (searchResults.length > 0) {
            onFocus?.();
          }
        }}
      />
      <SearchIcon>{isSearching ? '⏳' : '🔍'}</SearchIcon>
      {showSearchDropdown && searchResults.length > 0 && (
        <SearchDropdown>
          {searchResults.map((result) => (
            <SearchResultItem
              key={result.place_id}
              onClick={() => onSearchResultClick(result)}
            >
              <SearchResultName>{result.display_name}</SearchResultName>
              <SearchResultDetails>
                {parseFloat(result.lat).toFixed(6)}, {parseFloat(result.lon).toFixed(6)}
              </SearchResultDetails>
            </SearchResultItem>
          ))}
        </SearchDropdown>
      )}
    </SearchContainer>
  );
};
