import { useState, useRef, useEffect } from 'react';
import { FiFilter, FiChevronDown, FiCheck } from 'react-icons/fi';
import styled from 'styled-components';
import type { ConversationInfo } from '../utils/conversationFiltering';

const FilterContainer = styled.div`
  position: relative;
  z-index: 2000;
`;

const FilterButton = styled.button<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: ${props => props.$isActive ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white'};
  color: ${props => props.$isActive ? 'white' : '#333'};
  border: ${props => props.$isActive ? 'none' : '1px solid #dee2e6'};
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  justify-content: space-between;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const FilterIcon = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ChevronIcon = styled.div<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  transition: transform 0.2s;
  transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const FilterDropdown = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 400px;
  overflow-y: auto;
  display: ${props => props.$isOpen ? 'block' : 'none'};
  animation: slideDown 0.2s ease-out;
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const DropdownSection = styled.div`
  padding: 8px;
  border-bottom: 1px solid #e9ecef;
  
  &:last-child {
    border-bottom: none;
  }
`;

const SectionTitle = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 8px;
  margin-bottom: 4px;
`;

const DropdownItem = styled.button<{ $isSelected: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: ${props => props.$isSelected ? '#f0f4ff' : 'transparent'};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  text-align: left;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$isSelected ? '#e6edff' : '#f8f9fa'};
  }
`;

const ItemLabel = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemTitle = styled.div`
  font-weight: 500;
  margin-bottom: 2px;
  word-break: break-word;
`;

const ItemMeta = styled.div`
  font-size: 11px;
  color: #666;
  display: flex;
  gap: 8px;
`;

const CheckIcon = styled.div<{ $visible: boolean }>`
  display: flex;
  align-items: center;
  color: #667eea;
  opacity: ${props => props.$visible ? 1 : 0};
`;

const EmptyState = styled.div`
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 13px;
`;

interface ConversationFilterProps {
  conversations: ConversationInfo[];
  selectedConversationId: string | null; // null means "All Conversations"
  onSelectConversation: (conversationId: string | null) => void;
}

const ConversationFilter = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
}: ConversationFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelectConversation = (conversationId: string | null) => {
    onSelectConversation(conversationId);
    setIsOpen(false);
  };

  const getButtonLabel = () => {
    if (selectedConversationId === null) {
      return 'All Conversations';
    }
    const conversation = conversations.find(c => c.id === selectedConversationId);
    return conversation?.label || 'Unknown Conversation';
  };

  const getTotalCounts = () => {
    const totalPoints = conversations.reduce((sum, c) => sum + c.pointsCount, 0);
    const totalRoutes = conversations.reduce((sum, c) => sum + c.routesCount, 0);
    return { totalPoints, totalRoutes };
  };

  const isFiltered = selectedConversationId !== null;

  return (
    <FilterContainer ref={containerRef}>
      <FilterButton 
        onClick={() => setIsOpen(!isOpen)}
        $isActive={isFiltered}
      >
        <FilterIcon>
          <FiFilter size={14} />
          <span>{getButtonLabel()}</span>
        </FilterIcon>
        <ChevronIcon $isOpen={isOpen}>
          <FiChevronDown size={16} />
        </ChevronIcon>
      </FilterButton>

      <FilterDropdown $isOpen={isOpen}>
        {conversations.length === 0 ? (
          <EmptyState>
            No conversations with saved routes or points yet.
            <br />
            Create a point or route in a conversation to see it here!
          </EmptyState>
        ) : (
          <>
            <DropdownSection>
              <DropdownItem
                $isSelected={selectedConversationId === null}
                onClick={() => handleSelectConversation(null)}
              >
                <ItemLabel>
                  <ItemTitle>All Conversations</ItemTitle>
                  <ItemMeta>
                    <span>{conversations.length} conversations</span>
                    <span>•</span>
                    <span>{getTotalCounts().totalPoints} points</span>
                    <span>•</span>
                    <span>{getTotalCounts().totalRoutes} routes</span>
                  </ItemMeta>
                </ItemLabel>
                <CheckIcon $visible={selectedConversationId === null}>
                  <FiCheck size={16} />
                </CheckIcon>
              </DropdownItem>
            </DropdownSection>

            <DropdownSection>
              <SectionTitle>Filter by Conversation</SectionTitle>
              {conversations.map(conversation => (
                <DropdownItem
                  key={conversation.id}
                  $isSelected={selectedConversationId === conversation.id}
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <ItemLabel>
                    <ItemTitle>{conversation.label}</ItemTitle>
                    <ItemMeta>
                      {conversation.pointsCount > 0 && <span>{conversation.pointsCount} points</span>}
                      {conversation.pointsCount > 0 && conversation.routesCount > 0 && <span>•</span>}
                      {conversation.routesCount > 0 && <span>{conversation.routesCount} routes</span>}
                    </ItemMeta>
                  </ItemLabel>
                  <CheckIcon $visible={selectedConversationId === conversation.id}>
                    <FiCheck size={16} />
                  </CheckIcon>
                </DropdownItem>
              ))}
            </DropdownSection>
          </>
        )}
      </FilterDropdown>
    </FilterContainer>
  );
};

export default ConversationFilter;
