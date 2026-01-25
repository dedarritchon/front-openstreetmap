import { FiMapPin, FiTrash2, FiNavigation } from 'react-icons/fi';
import styled from 'styled-components';

import type { DetectedLocation } from '../types/locations';

const LocationsContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  margin-top: 12px;
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
  max-height: 600px;
  overflow-y: auto;
`;

const LocationItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  margin-bottom: 8px;
  transition: all 0.2s;
  background: white;

  &:hover {
    border-color: #667eea;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const LocationMainRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

const LocationIcon = styled.div<{ $type: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${(props) => {
    switch (props.$type) {
      case 'maps_link':
        return '#4285F4';
      case 'coordinates':
        return '#34A853';
      case 'address':
        return '#FBBC04';
      default:
        return '#667eea';
    }
  }};
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

const LocationMeta = styled.div`
  font-size: 11px;
  color: #666;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const LocationType = styled.span`
  padding: 2px 6px;
  background: #e9ecef;
  border-radius: 4px;
  font-weight: 500;
`;

const PinButton = styled.button`
  background: none;
  border: none;
  padding: 6px 8px;
  cursor: pointer;
  color: #667eea;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0.7;
  transition: all 0.2s;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 500;

  &:hover {
    opacity: 1;
    transform: scale(1.05);
  }
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: #dc3545;
  display: flex;
  align-items: center;
  opacity: 0.7;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }
`;

const DirectionsButtons = styled.div`
  display: flex;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  margin-top: 4px;
`;

const DirectionButton = styled.button`
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #667eea;
  background: white;
  color: #667eea;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.2s;

  &:hover {
    background: #667eea;
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }
`;


const EmptyState = styled.div`
  padding: 32px 16px;
  text-align: center;
  color: #666;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  opacity: 0.3;
  margin-bottom: 12px;
`;

const EmptyText = styled.div`
  font-size: 14px;
  color: #666;
`;

interface LocationsListProps {
  conversationLocations: DetectedLocation[];
  savedLocations: DetectedLocation[];
  onLocationClick: (location: DetectedLocation) => void;
  onLocationRemove: (locationId: string, fromSaved?: boolean) => void;
  onSaveLocation?: (locationId: string) => void;
}

const LocationsList = ({
  conversationLocations,
  savedLocations,
  onLocationClick,
  onLocationRemove,
  onSaveLocation,
}: LocationsListProps) => {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'maps_link':
        return 'Maps Link';
      case 'coordinates':
        return 'Coordinates';
      case 'address':
        return 'Address';
      default:
        return type;
    }
  };

  const handleSetOrigin = (location: DetectedLocation) => {
    if (location.coordinates) {
      const event = new CustomEvent('setDirectionsOrigin', {
        detail: { lat: location.coordinates.lat, lng: location.coordinates.lng }
      });
      window.dispatchEvent(event);
    }
  };

  const handleSetDestination = (location: DetectedLocation) => {
    if (location.coordinates) {
      const event = new CustomEvent('setDirectionsDestination', {
        detail: { lat: location.coordinates.lat, lng: location.coordinates.lng }
      });
      window.dispatchEvent(event);
    }
  };

  const handleLocationClickWithSelection = (location: DetectedLocation) => {
    // Check if we're in selection mode by listening for a state change
    // We'll dispatch an event that DirectionsPanel can check
    if (location.coordinates) {
      const event = new CustomEvent('locationClickForDirections', {
        detail: { lat: location.coordinates.lat, lng: location.coordinates.lng, id: location.id }
      });
      window.dispatchEvent(event);
    }
    // Also call the regular click handler
    onLocationClick(location);
  };

  const renderLocationItem = (location: DetectedLocation, isSaved: boolean) => {
    // Check if location is pinned (exists in savedLocations)
    const isPinned = savedLocations.some(saved => saved.id === location.id);
    
    return (
      <LocationItem key={location.id}>
        <LocationMainRow onClick={() => handleLocationClickWithSelection(location)}>
          <LocationIcon $type={location.type}>
            <FiMapPin size={16} />
          </LocationIcon>
          
          <LocationInfo>
            <LocationText>
              {location.formattedAddress || location.text}
            </LocationText>
            <LocationMeta>
              <LocationType>{getTypeLabel(location.type)}</LocationType>
              {location.author && <span>by {location.author}</span>}
            </LocationMeta>
          </LocationInfo>

          {isSaved || isPinned ? (
            <DeleteButton
              onClick={(e) => {
                e.stopPropagation();
                onLocationRemove(location.id, isSaved || isPinned);
              }}
              title={isSaved ? "Remove location" : "Unpin location"}
            >
              <FiTrash2 size={16} />
            </DeleteButton>
          ) : onSaveLocation ? (
            <PinButton
              onClick={(e) => {
                e.stopPropagation();
                onSaveLocation(location.id);
              }}
              title="Pin location"
            >
              <FiMapPin size={16} />
              <span>Pin</span>
            </PinButton>
          ) : null}
        </LocationMainRow>
        
        {location.coordinates && (
          <DirectionsButtons>
            <DirectionButton
              onClick={(e) => {
                e.stopPropagation();
                handleSetOrigin(location);
              }}
              title="Set as origin"
              style={{ borderColor: '#34A853', color: '#34A853' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#34A853';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#34A853';
              }}
            >
              <FiNavigation size={12} />
              Origin
            </DirectionButton>
            <DirectionButton
              onClick={(e) => {
                e.stopPropagation();
                handleSetDestination(location);
              }}
              title="Set as destination"
              style={{ borderColor: '#EA4335', color: '#EA4335' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#EA4335';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#EA4335';
              }}
            >
              <FiNavigation size={12} />
              Destination
            </DirectionButton>
          </DirectionsButtons>
        )}
      </LocationItem>
    );
  };

  return (
    <>
      {/* Current Conversation Locations */}
      <LocationsContainer>
        <LocationsHeader>
          <HeaderTitle>
            <FiMapPin size={16} />
            Current Conversation Locations
          </HeaderTitle>
          {conversationLocations.length > 0 && (
            <LocationCount>{conversationLocations.length}</LocationCount>
          )}
        </LocationsHeader>

        <LocationsContent>
          {conversationLocations.length === 0 ? (
            <EmptyState>
              <EmptyIcon>📍</EmptyIcon>
              <EmptyText>
                No locations detected in this conversation.
                <br />
                Share maps links, addresses, or coordinates!
              </EmptyText>
            </EmptyState>
          ) : (
            conversationLocations.map((location) => renderLocationItem(location, false))
          )}
        </LocationsContent>
      </LocationsContainer>

      {/* My Locations (Saved) */}
      <LocationsContainer style={{ marginTop: '16px' }}>
        <LocationsHeader>
          <HeaderTitle>
            <FiMapPin size={16} />
            My Locations
          </HeaderTitle>
          {savedLocations.length > 0 && (
            <LocationCount>{savedLocations.length}</LocationCount>
          )}
        </LocationsHeader>

        <LocationsContent>
          {savedLocations.length === 0 ? (
            <EmptyState>
              <EmptyIcon>💾</EmptyIcon>
              <EmptyText>
                No saved locations yet.
                <br />
                Save locations from conversations to keep them!
              </EmptyText>
            </EmptyState>
          ) : (
            savedLocations.map((location) => renderLocationItem(location, true))
          )}
        </LocationsContent>
      </LocationsContainer>
    </>
  );
};

export default LocationsList;
