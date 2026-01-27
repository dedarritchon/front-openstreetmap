import { useState, useEffect } from 'react';
import { FiMapPin, FiTrash2, FiX, FiArrowLeft, FiEdit2, FiCheck, FiMap, FiNavigation, FiDownload, FiUpload } from 'react-icons/fi';
import styled from 'styled-components';

import type { DetectedLocation } from '../types/locations';

export type LocationListItem = DetectedLocation & { name?: string };

const LocationsListWrapper = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  max-width: 400px;
  width: 100%;
  max-height: 600px;
  display: flex;
  flex-direction: column;
`;

const LocationsContainer = styled.div`
  background: white;
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const LocationsScrollContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
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

const HeaderButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const LocationsContent = styled.div`
  padding: 8px;
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

const LocationDetailHeader = styled.div`
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  border-radius: 8px 8px 0 0;
`;

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  transition: background 0.2s;
  margin-right: auto;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const EditableLocationName = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
`;

const LocationNameInput = styled.input`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  flex: 1;
  min-width: 0;

  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.25);
  }
`;

const LocationNameDisplay = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EditButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const LocationDetailContent = styled.div`
  padding: 12px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const DetailRow = styled.div`
  font-size: 13px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const DetailLabel = styled.span`
  color: #666;
  font-weight: 500;
  min-width: 80px;
`;

const DetailActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
`;

const DetailActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  background: white;
  color: #333;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f8f9fa;
    border-color: #667eea;
    color: #667eea;
  }

  &[data-variant='danger']:hover {
    border-color: #dc3545;
    color: #dc3545;
  }
`;

interface LocationsListProps {
  conversationLocations: LocationListItem[];
  savedLocations: LocationListItem[];
  onLocationClick: (location: DetectedLocation) => void;
  onLocationRemove: (locationId: string, fromSaved?: boolean) => void;
  onSaveLocation?: (locationId: string) => void;
  onUpdateLocation?: (locationId: string, updates: { name: string }) => void;
  onGetDirections?: (location: DetectedLocation) => void;
  onClose?: () => void;
  onExportPoints?: () => void;
  onImportPoints?: (file: File) => void;
}

const LocationsList = ({
  conversationLocations,
  savedLocations,
  onLocationClick,
  onLocationRemove,
  onSaveLocation,
  onUpdateLocation,
  onGetDirections,
  onClose,
  onExportPoints,
  onImportPoints,
}: LocationsListProps) => {
  const [previewLocation, setPreviewLocation] = useState<{ location: LocationListItem; isSaved: boolean } | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  
  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && onImportPoints) {
        onImportPoints(file);
      }
    };
    input.click();
  };

  useEffect(() => {
    if (previewLocation) {
      const display = previewLocation.location.name ?? previewLocation.location.formattedAddress ?? previewLocation.location.text;
      setEditedName(display);
    }
  }, [previewLocation]);

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

  const displayName = (loc: LocationListItem) => loc.name ?? loc.formattedAddress ?? loc.text;

  const handleSelectLocation = (location: LocationListItem, isSaved: boolean) => {
    setPreviewLocation({ location, isSaved });
    setIsEditingName(false);
  };

  const handleBackToList = () => {
    setPreviewLocation(null);
    setIsEditingName(false);
  };

  const handleStartEditName = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (previewLocation?.isSaved && onUpdateLocation) {
      setEditedName(displayName(previewLocation.location));
      setIsEditingName(true);
    }
  };

  const handleSaveName = () => {
    if (previewLocation?.isSaved && onUpdateLocation && editedName.trim()) {
      onUpdateLocation(previewLocation.location.id, { name: editedName.trim() });
      setPreviewLocation((prev) =>
        prev ? { ...prev, location: { ...prev.location, name: editedName.trim() } } : null
      );
      setIsEditingName(false);
    }
  };

  const handleCancelEditName = () => {
    if (previewLocation) {
      setEditedName(displayName(previewLocation.location));
      setIsEditingName(false);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveName();
    else if (e.key === 'Escape') handleCancelEditName();
  };

  const handleGetDirections = () => {
    if (!previewLocation?.location.coordinates) return;
    window.dispatchEvent(
      new CustomEvent('locationClickForDirections', {
        detail: {
          lat: previewLocation.location.coordinates.lat,
          lng: previewLocation.location.coordinates.lng,
          id: previewLocation.location.id,
        },
      })
    );
    window.dispatchEvent(
      new CustomEvent('setDirectionsOrigin', {
        detail: {
          lat: previewLocation.location.coordinates.lat,
          lng: previewLocation.location.coordinates.lng,
          id: previewLocation.location.id,
        },
      })
    );
    onGetDirections?.(previewLocation.location);
  };

  const handleFocusOnMap = () => {
    if (previewLocation?.location.coordinates) {
      onLocationClick(previewLocation.location);
    }
    handleBackToList();
    onClose?.();
  };

  const renderLocationItem = (location: LocationListItem, isSaved: boolean) => {
    const isPinned = savedLocations.some((s) => s.id === location.id);
    return (
      <LocationItem key={location.id}>
        <LocationMainRow onClick={() => handleSelectLocation(location, isSaved || isPinned)}>
          <LocationIcon $type={location.type}>
            <FiMapPin size={16} />
          </LocationIcon>
          <LocationInfo>
            <LocationText>{displayName(location)}</LocationText>
            <LocationMeta>
              <LocationType>{getTypeLabel(location.type)}</LocationType>
              {location.author && <span>by {location.author}</span>}
            </LocationMeta>
          </LocationInfo>
          {isSaved || isPinned ? (
            <DeleteButton
              onClick={(e) => {
                e.stopPropagation();
                onLocationRemove(location.id, true);
              }}
              title="Unpin location"
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
      </LocationItem>
    );
  };

  if (previewLocation) {
    const { location, isSaved } = previewLocation;
    const coords = location.coordinates;
    const canEditName = isSaved && !!onUpdateLocation;

    return (
      <LocationsListWrapper>
        <LocationDetailHeader>
          <BackButton onClick={handleBackToList}>
            <FiArrowLeft size={14} />
            Back
          </BackButton>
          <EditableLocationName>
            {canEditName && isEditingName ? (
              <>
                <LocationNameInput
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  onBlur={handleSaveName}
                  autoFocus
                  placeholder="Location name"
                />
                <EditButton onClick={handleSaveName} title="Save name">
                  <FiCheck size={16} />
                </EditButton>
              </>
            ) : (
              <>
                <LocationNameDisplay
                  onClick={canEditName ? handleStartEditName : undefined}
                  style={{ cursor: canEditName ? 'pointer' : 'default' }}
                  title={canEditName ? 'Click to edit' : undefined}
                >
                  {editedName || displayName(location)}
                </LocationNameDisplay>
                {canEditName && (
                  <EditButton onClick={handleStartEditName} title="Edit name">
                    <FiEdit2 size={16} />
                  </EditButton>
                )}
              </>
            )}
          </EditableLocationName>
          {onClose && (
            <CloseButton onClick={onClose} title="Close">
              <FiX size={16} />
            </CloseButton>
          )}
        </LocationDetailHeader>
        <LocationDetailContent>
          {coords && (
            <DetailRow>
              <DetailLabel>Coordinates</DetailLabel>
              <span>{coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</span>
            </DetailRow>
          )}
          <DetailRow>
            <DetailLabel>Type</DetailLabel>
            <span>{getTypeLabel(location.type)}</span>
          </DetailRow>
          {location.formattedAddress && !location.name && (
            <DetailRow>
              <DetailLabel>Address</DetailLabel>
              <span>{location.formattedAddress}</span>
            </DetailRow>
          )}
          <DetailActions>
            {coords && onGetDirections && (
              <DetailActionButton type="button" onClick={handleGetDirections}>
                <FiNavigation size={16} />
                Get directions from here
              </DetailActionButton>
            )}
            {coords && (
              <DetailActionButton type="button" onClick={handleFocusOnMap}>
                <FiMap size={16} />
                Focus on map
              </DetailActionButton>
            )}
            {isSaved ? (
              <DetailActionButton
                type="button"
                data-variant="danger"
                onClick={() => {
                  onLocationRemove(location.id, true);
                  handleBackToList();
                }}
              >
                <FiTrash2 size={16} />
                Unpin location
              </DetailActionButton>
            ) : onSaveLocation ? (
              <DetailActionButton
                type="button"
                onClick={() => {
                  onSaveLocation(location.id);
                  handleBackToList();
                }}
              >
                <FiMapPin size={16} />
                Pin location
              </DetailActionButton>
            ) : null}
          </DetailActions>
        </LocationDetailContent>
      </LocationsListWrapper>
    );
  }

  return (
    <LocationsListWrapper>
      <LocationsContainer>
        <LocationsHeader>
          <HeaderTitle>
            <FiMapPin size={16} />
            Locations ({conversationLocations.length + savedLocations.length})
          </HeaderTitle>
          {onExportPoints && savedLocations.length > 0 && (
            <HeaderButton onClick={onExportPoints} title="Export points to CSV">
              <FiDownload size={14} />
            </HeaderButton>
          )}
          {onImportPoints && (
            <HeaderButton onClick={handleImportClick} title="Import points from CSV">
              <FiUpload size={14} />
            </HeaderButton>
          )}
          {onClose && (
            <CloseButton onClick={onClose} title="Close">
              <FiX size={16} />
            </CloseButton>
          )}
        </LocationsHeader>
        <LocationsScrollContent>
          {conversationLocations.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '8px', padding: '0 4px' }}>
                Current Conversation ({conversationLocations.length})
              </div>
              <LocationsContent>
                {conversationLocations.map((loc) => renderLocationItem(loc, false))}
              </LocationsContent>
            </div>
          )}
          {savedLocations.length > 0 && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '8px', padding: '0 4px' }}>
                My Locations ({savedLocations.length})
              </div>
              <LocationsContent>
                {savedLocations.map((loc) => renderLocationItem(loc, true))}
              </LocationsContent>
            </div>
          )}
          {conversationLocations.length === 0 && savedLocations.length === 0 && (
            <EmptyState>
              <EmptyIcon>📍</EmptyIcon>
              <EmptyText>
                No locations found.
                <br />
                Share maps links, addresses, or coordinates!
              </EmptyText>
            </EmptyState>
          )}
        </LocationsScrollContent>
      </LocationsContainer>
    </LocationsListWrapper>
  );
};

export default LocationsList;
