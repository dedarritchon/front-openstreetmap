import { useState, useEffect } from 'react';
import { FiMap, FiTrash2, FiEye, FiEyeOff, FiNavigation } from 'react-icons/fi';
import styled from 'styled-components';
import { loadSavedRoutes, removeSavedRoute, type SavedRoute } from '../utils/savedRoutesStorage';

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

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  flex: 1;
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

const RoutesListContent = styled.div`
  padding: 12px;
  overflow-y: auto;
  flex: 1;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #666;
  font-size: 14px;
`;

const RouteItem = styled.div<{ $isVisible: boolean }>`
  padding: 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  margin-bottom: 8px;
  background: ${props => props.$isVisible ? '#f8f9fa' : 'white'};
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

interface SavedRoutesListProps {
  onClose: () => void;
  onRouteToggle: (routeId: string, visible: boolean) => void;
  visibleRouteIds: Set<string>;
  onRouteSelect?: (route: SavedRoute) => void;
}

const SavedRoutesList = ({ 
  onClose, 
  onRouteToggle, 
  visibleRouteIds,
  onRouteSelect 
}: SavedRoutesListProps) => {
  const [routes, setRoutes] = useState<SavedRoute[]>(loadSavedRoutes());

  // Listen for route updates
  useEffect(() => {
    const handleRoutesUpdate = () => {
      setRoutes(loadSavedRoutes());
    };
    
    window.addEventListener('savedRoutesUpdated', handleRoutesUpdate);
    
    return () => {
      window.removeEventListener('savedRoutesUpdated', handleRoutesUpdate);
    };
  }, []);

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
    if (onRouteSelect) {
      onRouteSelect(route);
    }
  };

  return (
    <RoutesListContainer>
      <RoutesListHeader>
        <HeaderTitle>
          <FiMap size={16} />
          Saved Routes ({routes.length})
        </HeaderTitle>
        <CloseButton onClick={onClose}>
          <FiNavigation size={16} />
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
                style={{ cursor: onRouteSelect ? 'pointer' : 'default' }}
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
