import { FiMapPin, FiBookmark, FiX } from 'react-icons/fi';
import styled from 'styled-components';

interface Coordinate {
  lat: number;
  lng: number;
  id: string;
  text: string;
  address?: string;
}

interface PinnedLocation extends Coordinate {
  pinnedAt: number;
}

interface LocationsSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  locations: Coordinate[];
  pinnedLocations: PinnedLocation[];
  onLocationClick: (location: Coordinate) => void;
  onPinLocation: (location: Coordinate) => void;
  onUnpinLocation: (locationId: string) => void;
  isPinned: (locationId: string, lat: number, lng: number) => boolean;
}

const Sidebar = styled.div<{ $isOpen: boolean }>`
  width: ${(props) => (props.$isOpen ? '360px' : '48px')};
  min-width: ${(props) => (props.$isOpen ? '360px' : '48px')};
  max-width: ${(props) => (props.$isOpen ? '360px' : '48px')};
  background: ${(props) => (props.$isOpen ? 'white' : 'transparent')};
  border-left: ${(props) => (props.$isOpen ? '1px solid #e9ecef' : 'none')};
  padding: ${(props) => (props.$isOpen ? '56px 12px 12px' : '56px 0 0')};
  overflow-y: ${(props) => (props.$isOpen ? 'auto' : 'hidden')};
  overflow-x: hidden;
  transition: all 0.3s ease;
  position: relative;
  flex-shrink: 0;
`;

const ToggleButton = styled.button<{ $isOpen: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 100;
  background: white;
  border: 2px solid #e9ecef;
  border-right: none;
  border-top: none;
  border-radius: 0 0 0 8px;
  padding: ${(props) => (props.$isOpen ? '8px 12px' : '12px 8px')};
  cursor: pointer;
  display: flex;
  flex-direction: ${(props) => (props.$isOpen ? 'row' : 'column')};
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #667eea;
  box-shadow: -2px 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  width: 100%;
  height: ${(props) => (props.$isOpen ? '48px' : '140px')};

  &:hover {
    background: #f8f9fa;
    box-shadow: -4px 4px 12px rgba(102, 126, 234, 0.2);
  }
`;

const SidebarContent = styled.div<{ $isOpen: boolean }>`
  opacity: ${(props) => (props.$isOpen ? '1' : '0')};
  visibility: ${(props) => (props.$isOpen ? 'visible' : 'hidden')};
  transition: opacity 0.3s ease, visibility 0.3s ease;
`;

const LocationsContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  margin-bottom: 12px;
`;

const LocationsHeader = styled.div`
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  border-radius: 8px 8px 0 0;
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  flex: 1;
`;

const LocationCount = styled.span`
  background: rgba(255, 255, 255, 0.3);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
`;

const LocationsContent = styled.div`
  padding: 8px;
  max-height: 400px;
  overflow-y: auto;
`;

const LocationItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  margin-bottom: 8px;
  transition: all 0.2s;
  background: white;
  cursor: pointer;

  &:hover {
    border-color: #667eea;
    background: #f8f9fa;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const LocationIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  flex-shrink: 0;
`;

const LocationInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const LocationText = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  word-break: break-word;
`;

const LocationCoords = styled.div`
  font-size: 11px;
  color: #666;
`;

const PinButton = styled.button<{ $pinned: boolean }>`
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: ${(props) => (props.$pinned ? '#667eea' : '#999')};
  display: flex;
  align-items: center;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    color: #667eea;
    transform: scale(1.1);
  }
`;

const EmptyState = styled.div`
  padding: 32px 16px;
  text-align: center;
  color: #666;
  font-size: 13px;
`;

const LocationsSidebar = ({
  isOpen,
  onToggle,
  locations,
  pinnedLocations,
  onLocationClick,
  onPinLocation,
  onUnpinLocation,
  isPinned,
}: LocationsSidebarProps) => {
  return (
    <Sidebar $isOpen={isOpen}>
      <ToggleButton $isOpen={isOpen} onClick={onToggle}>
        {isOpen ? (
          <>
            <FiX size={16} />
            <span>Close</span>
          </>
        ) : (
          <>
            <FiMapPin size={20} />
            <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              Locations
            </span>
          </>
        )}
      </ToggleButton>

      <SidebarContent $isOpen={isOpen}>
        {/* Pinned Locations */}
        <LocationsContainer>
          <LocationsHeader>
            <HeaderTitle>
              <FiBookmark size={16} />
              Pinned Locations
            </HeaderTitle>
            {pinnedLocations.length > 0 && (
              <LocationCount>{pinnedLocations.length}</LocationCount>
            )}
          </LocationsHeader>
          <LocationsContent>
            {pinnedLocations.length === 0 ? (
              <EmptyState>No pinned locations yet</EmptyState>
            ) : (
              pinnedLocations.map((location) => (
                <LocationItem
                  key={location.id}
                  onClick={() => onLocationClick(location)}
                >
                  <LocationIcon>
                    <FiBookmark size={16} />
                  </LocationIcon>
                  <LocationInfo>
                    <LocationText>
                      {location.address || `${location.lat}, ${location.lng}`}
                    </LocationText>
                    <LocationCoords>
                      {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </LocationCoords>
                  </LocationInfo>
                  <PinButton
                    $pinned={true}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnpinLocation(location.id);
                    }}
                    title="Unpin location"
                  >
                    <FiBookmark size={18} />
                  </PinButton>
                </LocationItem>
              ))
            )}
          </LocationsContent>
        </LocationsContainer>

        {/* Current Conversation Locations */}
        <LocationsContainer>
          <LocationsHeader>
            <HeaderTitle>
              <FiMapPin size={16} />
              Current Conversation
            </HeaderTitle>
            {locations.length > 0 && <LocationCount>{locations.length}</LocationCount>}
          </LocationsHeader>
          <LocationsContent>
            {locations.length === 0 ? (
              <EmptyState>No locations detected in this conversation</EmptyState>
            ) : (
              locations.map((location) => {
                const pinned = isPinned(location.id, location.lat, location.lng);
                return (
                  <LocationItem
                    key={location.id}
                    onClick={() => onLocationClick(location)}
                  >
                    <LocationIcon>
                      <FiMapPin size={16} />
                    </LocationIcon>
                    <LocationInfo>
                      <LocationText>
                        {location.address || `${location.lat}, ${location.lng}`}
                      </LocationText>
                      <LocationCoords>
                        {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                      </LocationCoords>
                    </LocationInfo>
                    <PinButton
                      $pinned={pinned}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (pinned) {
                          onUnpinLocation(location.id);
                        } else {
                          onPinLocation(location);
                        }
                      }}
                      title={pinned ? 'Unpin location' : 'Pin location'}
                    >
                      <FiBookmark size={18} />
                    </PinButton>
                  </LocationItem>
                );
              })
            )}
          </LocationsContent>
        </LocationsContainer>
      </SidebarContent>
    </Sidebar>
  );
};

export default LocationsSidebar;
