import styled from 'styled-components';
import { useRef } from 'react';
import type { MapStyle } from './MapComponent';
import { FiDownload, FiUpload } from 'react-icons/fi';

const HeaderContainer = styled.div`
  background: white;
  padding: 16px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 2500;
`;

const LocationCountButton = styled.button`
  margin-left: auto;
  font-size: 14px;
  color: #666;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: #f8f9fa;
    color: #667eea;
  }
`;

interface HeaderProps {
  mapStyle: MapStyle;
  onMapStyleChange: (style: MapStyle) => void;
  showDirections: boolean;
  showSavedRoutesList: boolean;
  savedRoutesCount: number;
  isLoadingLocations: boolean;
  totalLocations: number;
  onToggleDirections: () => void;
  onToggleSavedRoutesList: () => void;
  onToggleLocationsList: () => void;
  onExportPoints: () => void;
  onImportPoints: (file: File) => void;
  children?: React.ReactNode;
}

export const Header = ({
  mapStyle,
  onMapStyleChange,
  showDirections,
  showSavedRoutesList,
  savedRoutesCount,
  isLoadingLocations,
  totalLocations,
  onToggleDirections,
  onToggleSavedRoutesList,
  onToggleLocationsList,
  onExportPoints,
  onImportPoints,
  children,
}: HeaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMapStyleToggle = () => {
    if (mapStyle === 'standard') {
      onMapStyleChange('satellite');
    } else if (mapStyle === 'satellite') {
      onMapStyleChange('terrain');
    } else {
      onMapStyleChange('standard');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportPoints(file);
      // Reset input so same file can be imported again
      event.target.value = '';
    }
  };

  return (
    <HeaderContainer>
      <LocationCountButton 
        onClick={handleMapStyleToggle}
        title="Toggle map view (Standard → Terrain → Satellite)"
      >
        {mapStyle === 'terrain' ? '🗻' : mapStyle === 'satellite' ? '🛰️' : '🗺️'}
      </LocationCountButton>
      
      {children}
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <LocationCountButton 
          onClick={onExportPoints}
          title="Export points to CSV"
          disabled={totalLocations === 0}
          style={{ 
            opacity: totalLocations === 0 ? 0.5 : 1,
            cursor: totalLocations === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          <FiDownload style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          Export
        </LocationCountButton>
        <LocationCountButton 
          onClick={handleImportClick}
          title="Import points from CSV"
        >
          <FiUpload style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          Import
        </LocationCountButton>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <LocationCountButton 
          onClick={onToggleDirections}
          style={{ 
            background: showDirections ? '#667eea' : 'none',
            color: showDirections ? 'white' : '#666'
          }}
        >
          🧭 Directions
        </LocationCountButton>
        <LocationCountButton 
          onClick={onToggleSavedRoutesList}
          style={{ 
            background: showSavedRoutesList ? '#667eea' : 'none',
            color: showSavedRoutesList ? 'white' : '#666'
          }}
          title={`Saved Routes (${savedRoutesCount})`}
        >
          🗺️ Routes ({savedRoutesCount})
        </LocationCountButton>
        {isLoadingLocations ? (
          <LocationCountButton 
            disabled
            style={{ opacity: 0.7, cursor: 'wait' }}
          >
            ⏳ Loading locations...
          </LocationCountButton>
        ) : <LocationCountButton 
        onClick={onToggleLocationsList}
        >
          📍 Points ({totalLocations})
        </LocationCountButton>}
      </div>
    </HeaderContainer>
  );
};
