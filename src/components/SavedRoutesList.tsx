import { useState, useEffect } from 'react';
import { FiMap, FiTrash2, FiEye, FiEyeOff, FiNavigation, FiCopy, FiArrowLeft, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import styled from 'styled-components';
import { loadSavedRoutes, removeSavedRoute, updateSavedRoute, type SavedRoute } from '../utils/savedRoutesStorage';

const RoutesListContainer = styled.div`
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

const RoutesListHeader = styled.div`
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
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  flex: 1;
  min-width: 0;
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
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const RoutesListContent = styled.div`
  padding: 12px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #666;
  font-size: 14px;
`;

const RouteItem = styled.div<{ $isVisible: boolean; $isSelected?: boolean }>`
  padding: 12px;
  border: 1px solid ${props => props.$isSelected ? '#667eea' : '#dee2e6'};
  border-radius: 6px;
  margin-bottom: 8px;
  background: ${props => props.$isSelected ? '#f0f4ff' : props.$isVisible ? '#f8f9fa' : 'white'};
  transition: all 0.2s;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const RouteHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
`;

const RouteName = styled.div`
  font-weight: 600;
  font-size: 13px;
  color: #333;
  flex: 1;
  word-break: break-word;
`;

const RouteActions = styled.div`
  display: flex;
  gap: 4px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    background: #f0f0f0;
    color: #333;
  }
  
  &[data-danger="true"]:hover {
    background: #fee;
    color: #d32f2f;
  }
`;

const RouteDetails = styled.div`
  font-size: 11px;
  color: #666;
  line-height: 1.6;
`;

const RouteDetailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
`;

const RouteBadge = styled.span<{ $color: string }>`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.$color};
  border: 2px solid white;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  margin-right: 4px;
`;

const TravelModeEmoji: Record<string, string> = {
  driving: '🚗',
  walking: '🚶',
  cycling: '🚴',
  transit: '🚌',
  plane: '✈️',
  boat: '⛵',
  'container-ship': '🚢',
};

const RouteDetailView = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const RouteDetailHeader = styled.div`
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  border-radius: 8px 8px 0 0;
`;

const RouteDetailTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const EditableRouteName = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const RouteNameInput = styled.input`
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

const RouteNameDisplay = styled.span`
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
  flex-shrink: 0;
  min-width: 32px;
  height: 32px;

  &:hover {
    background: rgba(255, 255, 255, 0.35);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const RouteInfo = styled.div`
  margin-bottom: 12px;
  padding: 10px;
  background: white;
  border-radius: 6px;
  border-left: 4px solid #667eea;
`;

const RouteInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const RouteInfoLabel = styled.span`
  font-size: 11px;
  color: #666;
  font-weight: 500;
`;

const RouteInfoValue = styled.span`
  font-size: 12px;
  color: #333;
  font-weight: 600;
`;

const StepsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 0;
`;

const StepsTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  padding: 8px;
  background: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StepsTitleText = styled.span`
  flex: 1;
`;

const CopyButton = styled.button<{ $copied?: boolean }>`
  background: ${props => props.$copied ? '#34A853' : '#667eea'};
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const StepItem = styled.div`
  display: flex;
  gap: 10px;
  padding: 10px;
  border-left: 2px solid #e9ecef;
  margin-bottom: 8px;
  position: relative;
  background: white;
  border-radius: 4px;

  &:last-child {
    border-left: 2px dashed #e9ecef;
  }

  &::before {
    content: '';
    position: absolute;
    left: -6px;
    top: 12px;
    width: 10px;
    height: 10px;
    background: #667eea;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 0 0 2px #667eea;
  }
`;

const StepNumber = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: #667eea;
  min-width: 20px;
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepInstruction = styled.div`
  font-size: 12px;
  color: #333;
  line-height: 1.4;
  margin-bottom: 4px;
`;

const StepDistance = styled.div`
  font-size: 10px;
  color: #666;
`;

const SegmentHeader = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 12px;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
  
  &:first-child {
    margin-top: 0;
  }
`;

interface SavedRoutesListProps {
  onClose: () => void;
  onRouteToggle: (routeId: string, visible: boolean) => void;
  visibleRouteIds: Set<string>;
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  }
  return `${minutes} min`;
};

const SavedRoutesList = ({ 
  onClose, 
  onRouteToggle, 
  visibleRouteIds
}: SavedRoutesListProps) => {
  const [routes, setRoutes] = useState<SavedRoute[]>(loadSavedRoutes());
  const [previewRoute, setPreviewRoute] = useState<SavedRoute | null>(null);
  const [copiedDirections, setCopiedDirections] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  // Listen for route updates
  useEffect(() => {
    const handleRoutesUpdate = () => {
      const updatedRoutes = loadSavedRoutes();
      setRoutes(updatedRoutes);
      
      // Update preview route if it exists
      if (previewRoute) {
        const updatedPreview = updatedRoutes.find(r => r.id === previewRoute.id);
        if (updatedPreview) {
          setPreviewRoute(updatedPreview);
        }
      } else {
        // Set the most recently saved route as preview (last one in the list)
        if (updatedRoutes.length > 0) {
          const mostRecent = updatedRoutes[updatedRoutes.length - 1];
          // Only set as preview if it was just added (within last 5 seconds)
          const routeAge = Date.now() - new Date(mostRecent.savedAt).getTime();
          if (routeAge < 5000) {
            setPreviewRoute(mostRecent);
          }
        }
      }
    };
    
    window.addEventListener('savedRoutesUpdated', handleRoutesUpdate);
    
    return () => {
      window.removeEventListener('savedRoutesUpdated', handleRoutesUpdate);
    };
  }, [previewRoute]);

  // Update edited name when preview route changes
  useEffect(() => {
    if (previewRoute) {
      setEditedName(previewRoute.name);
    }
  }, [previewRoute]);

  const copyDirectionsToClipboard = (route: SavedRoute) => {
    if (!route.routeInfo.steps || route.routeInfo.steps.length === 0) return;
    
    // Build text version of directions
    let text = '📍 DIRECTIONS\n';
    text += '═'.repeat(40) + '\n\n';
    
    // Add route summary
    const modeEmoji = TravelModeEmoji[route.travelMode] || '🗺️';
    
    text += `${modeEmoji} Travel Mode: ${route.travelMode.charAt(0).toUpperCase() + route.travelMode.slice(1)}\n`;
    text += `📏 Total Distance: ${route.routeInfo.distance}\n`;
    text += `⏱️  Total Duration: ${route.routeInfo.duration}\n`;
    if (route.routeInfo.cost) {
      text += `💰 Total Cost: ${route.routeInfo.cost}\n`;
    }
    text += '\n' + '─'.repeat(40) + '\n\n';
    
    // Add turn-by-turn instructions
    let stepCounter = 0;
    route.routeInfo.steps.forEach((step) => {
      if (step.isSegmentStart) {
        // Segment header
        text += '\n' + '─'.repeat(40) + '\n';
        text += `🗺️  ${step.instruction}\n`;
        text += '─'.repeat(40) + '\n\n';
      } else {
        // Regular step
        stepCounter++;
        text += `${stepCounter}. ${step.instruction}\n`;
        text += `   ${(step.distance / 1000).toFixed(2)} km · ${formatDuration(step.duration)}\n\n`;
      }
    });
    
    text += '─'.repeat(40) + '\n';
    text += 'Generated by Maps Assistant\n';
    
    // Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
      setCopiedDirections(true);
      setTimeout(() => setCopiedDirections(false), 2000);
    }).catch(err => {
      console.error('Failed to copy directions:', err);
    });
  };

  const handleDelete = (e: React.MouseEvent, routeId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    try {
      removeSavedRoute(routeId);
      const updatedRoutes = loadSavedRoutes();
      setRoutes(updatedRoutes);
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('savedRoutesUpdated'));
      
      // Hide route if it was visible
      if (visibleRouteIds.has(routeId)) {
        onRouteToggle(routeId, false);
      }
    } catch (error) {
      console.error('Error deleting route:', error);
    }
  };

  const handleToggleVisibility = (e: React.MouseEvent, routeId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const isVisible = visibleRouteIds.has(routeId);
    onRouteToggle(routeId, !isVisible);
  };

  const handleSelectRoute = (route: SavedRoute) => {
    // Show route details in full-screen view
    setPreviewRoute(route);
  };

  const handleBackToList = () => {
    setPreviewRoute(null);
    setIsEditingName(false);
  };

  const handleStartEditName = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (previewRoute) {
      setEditedName(previewRoute.name);
      setIsEditingName(true);
    }
  };

  const handleSaveName = () => {
    if (previewRoute && editedName.trim()) {
      updateSavedRoute(previewRoute.id, { name: editedName.trim() });
      window.dispatchEvent(new CustomEvent('savedRoutesUpdated'));
      setIsEditingName(false);
    }
  };

  const handleCancelEditName = () => {
    if (previewRoute) {
      setEditedName(previewRoute.name);
      setIsEditingName(false);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEditName();
    }
  };

  // Show route detail view if a route is selected
  if (previewRoute) {
    return (
      <RoutesListContainer>
        <RouteDetailHeader>
          <BackButton onClick={handleBackToList}>
            <FiArrowLeft size={14} />
            Back
          </BackButton>
          <RouteDetailTitle>
            <FiMap size={16} />
            <EditableRouteName>
              {isEditingName ? (
                <>
                  <RouteNameInput
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={handleNameKeyDown}
                    onBlur={handleSaveName}
                    autoFocus
                    placeholder="Route name"
                  />
                  <EditButton onClick={handleSaveName} title="Save name">
                    <FiCheck size={16} />
                  </EditButton>
                </>
              ) : (
                <>
                  <RouteNameDisplay onClick={handleStartEditName} style={{ cursor: 'pointer' }} title="Click to edit">
                    {previewRoute.name}
                  </RouteNameDisplay>
                  <EditButton onClick={handleStartEditName} title="Edit route name">
                    <FiEdit2 size={16} />
                  </EditButton>
                </>
              )}
            </EditableRouteName>
          </RouteDetailTitle>
          <CloseButton onClick={onClose}>
            <FiNavigation size={16} />
          </CloseButton>
        </RouteDetailHeader>
        
        <RoutesListContent>
          <RouteDetailView>
            <RouteInfo>
              <RouteInfoRow>
                <RouteInfoLabel>Distance:</RouteInfoLabel>
                <RouteInfoValue>{previewRoute.routeInfo.distance}</RouteInfoValue>
              </RouteInfoRow>
              <RouteInfoRow>
                <RouteInfoLabel>Duration:</RouteInfoLabel>
                <RouteInfoValue>{previewRoute.routeInfo.duration}</RouteInfoValue>
              </RouteInfoRow>
              {previewRoute.routeInfo.cost && (
                <RouteInfoRow>
                  <RouteInfoLabel>Cost:</RouteInfoLabel>
                  <RouteInfoValue>{previewRoute.routeInfo.cost}</RouteInfoValue>
                </RouteInfoRow>
              )}
            </RouteInfo>

            {previewRoute.routeInfo.steps && previewRoute.routeInfo.steps.length > 0 && (
              <StepsContainer>
                <StepsTitle>
                  <StepsTitleText>📍 Turn-by-Turn Directions ({previewRoute.routeInfo.steps.length} steps)</StepsTitleText>
                  <CopyButton 
                    onClick={() => copyDirectionsToClipboard(previewRoute)}
                    $copied={copiedDirections}
                  >
                    <FiCopy size={12} />
                    {copiedDirections ? 'Copied!' : 'Copy'}
                  </CopyButton>
                </StepsTitle>
                {previewRoute.routeInfo.steps.map((step, index) => {
                  // Render segment header
                  if (step.isSegmentStart) {
                    return (
                      <SegmentHeader key={`segment-${index}`}>
                        🗺️ {step.instruction}
                      </SegmentHeader>
                    );
                  }
                  
                  // Calculate step number (excluding segment headers)
                  const stepNumber = previewRoute.routeInfo.steps!.slice(0, index).filter(s => !s.isSegmentStart).length + 1;
                  
                  return (
                    <StepItem key={index}>
                      <StepNumber>{stepNumber}</StepNumber>
                      <StepContent>
                        <StepInstruction>
                          {step.instruction}
                        </StepInstruction>
                        <StepDistance>
                          {(step.distance / 1000).toFixed(2)} km · {formatDuration(step.duration)}
                        </StepDistance>
                      </StepContent>
                    </StepItem>
                  );
                })}
              </StepsContainer>
            )}
          </RouteDetailView>
        </RoutesListContent>
      </RoutesListContainer>
    );
  }

  // Show routes list view
  return (
    <RoutesListContainer>
      <RoutesListHeader>
        <HeaderTitle>
          <FiMap size={16} />
          Saved Routes ({routes.length})
        </HeaderTitle>
        <CloseButton onClick={onClose}>
          <FiX size={16} />
        </CloseButton>
      </RoutesListHeader>
      
      <RoutesListContent>
        {routes.length === 0 ? (
          <EmptyState>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🗺️</div>
            <div>No saved routes yet</div>
            <div style={{ fontSize: '12px', marginTop: '8px', color: '#999' }}>
              Calculate a route and save it to see it here
            </div>
          </EmptyState>
        ) : (
          routes.map((route) => {
            const isVisible = visibleRouteIds.has(route.id);
            const modeEmoji = TravelModeEmoji[route.travelMode] || '🗺️';
            
            return (
              <RouteItem 
                key={route.id} 
                $isVisible={isVisible}
                onClick={() => handleSelectRoute(route)}
                style={{ cursor: 'pointer' }}
              >
                <RouteHeader>
                  <RouteName>
                    <RouteBadge $color={route.color} />
                    {route.name}
                  </RouteName>
                  <RouteActions onClick={(e) => e.stopPropagation()}>
                    <ActionButton
                      onClick={(e) => handleToggleVisibility(e, route.id)}
                      title={isVisible ? 'Hide route' : 'Show route'}
                    >
                      {isVisible ? <FiEye size={14} /> : <FiEyeOff size={14} />}
                    </ActionButton>
                    <ActionButton
                      onClick={(e) => handleDelete(e, route.id)}
                      title="Delete route"
                      data-danger="true"
                    >
                      <FiTrash2 size={14} />
                    </ActionButton>
                  </RouteActions>
                </RouteHeader>
                <RouteDetails>
                  <RouteDetailRow>
                    {modeEmoji} {route.travelMode.charAt(0).toUpperCase() + route.travelMode.slice(1)}
                  </RouteDetailRow>
                  <RouteDetailRow>
                    📏 {route.routeInfo.distance}
                  </RouteDetailRow>
                  <RouteDetailRow>
                    ⏱️ {route.routeInfo.duration}
                  </RouteDetailRow>
                  {route.routeInfo.cost && (
                    <RouteDetailRow>
                      💰 {route.routeInfo.cost}
                    </RouteDetailRow>
                  )}
                  {route.waypoints.length > 0 && (
                    <RouteDetailRow>
                      📍 {route.waypoints.length} waypoint{route.waypoints.length !== 1 ? 's' : ''}
                    </RouteDetailRow>
                  )}
                  <RouteDetailRow style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                    Saved {new Date(route.savedAt).toLocaleDateString()}
                  </RouteDetailRow>
                </RouteDetails>
              </RouteItem>
            );
          })
        )}
      </RoutesListContent>
    </RoutesListContainer>
  );
};

export default SavedRoutesList;
