import { useState } from 'react';
import { FiRotateCcw } from 'react-icons/fi';
import styled from 'styled-components';
import { loadSpeedSettings, saveSpeedSettings, resetSpeedSettings, type SpeedSettings } from '../utils/speedSettings';

const SettingsContainer = styled.div`
  width: 100%;
`;

const SettingsContent = styled.div`
  padding: 0;
  max-height: 500px;
  overflow-y: auto;
`;

const SettingsDescription = styled.div`
  font-size: 12px;
  color: #666;
  margin-bottom: 16px;
  line-height: 1.5;
`;

const SpeedInputGroup = styled.div`
  margin-bottom: 16px;
`;

const SpeedInputLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
`;

const SpeedInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SpeedInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const SpeedUnit = styled.span`
  font-size: 12px;
  color: #666;
  min-width: 40px;
`;

const ModeIcon = styled.span`
  font-size: 16px;
  min-width: 24px;
  text-align: center;
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #dee2e6;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;

  ${props => props.$variant === 'primary' ? `
    background: #667eea;
    color: white;
    
    &:hover {
      background: #5568d3;
    }
  ` : `
    background: #f8f9fa;
    color: #333;
    border: 1px solid #dee2e6;
    
    &:hover {
      background: #e9ecef;
    }
  `}
`;

const SaveSuccessMessage = styled.div`
  padding: 8px 12px;
  background: #d4edda;
  color: #155724;
  border-radius: 6px;
  font-size: 12px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const TRAVEL_MODE_CONFIG: Array<{
  key: keyof SpeedSettings;
  label: string;
  icon: string;
  description: string;
}> = [
  { key: 'driving', label: 'Driving', icon: '🚗', description: 'Average speed for car travel (urban/highway mix)' },
  { key: 'walking', label: 'Walking', icon: '🚶', description: 'Average walking speed' },
  { key: 'cycling', label: 'Cycling', icon: '🚴', description: 'Average cycling speed' },
  { key: 'transit', label: 'Transit', icon: '🚌', description: 'Average public transit speed (includes stops)' },
  { key: 'plane', label: 'Plane', icon: '✈️', description: 'Commercial plane cruising speed' },
  { key: 'boat', label: 'Boat', icon: '⛵', description: 'Average boat speed' },
  { key: 'container-ship', label: 'Container Ship', icon: '🚢', description: 'Container ship average speed' },
];

const SpeedSettingsPanel = () => {
  const [settings, setSettings] = useState<SpeedSettings>(loadSpeedSettings());
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSpeedChange = (mode: keyof SpeedSettings, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setSettings(prev => ({
        ...prev,
        [mode]: numValue,
      }));
    }
  };

  const handleSave = () => {
    saveSpeedSettings(settings);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    
    // Notify other components that settings have changed
    window.dispatchEvent(new CustomEvent('speedSettingsChanged', { detail: settings }));
  };

  const handleReset = () => {
    const defaults = resetSpeedSettings();
    setSettings(defaults);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    
    // Notify other components that settings have changed
    window.dispatchEvent(new CustomEvent('speedSettingsChanged', { detail: defaults }));
  };

  return (
    <SettingsContainer>
      <SettingsContent>
        {showSuccess && (
          <SaveSuccessMessage>
            ✓ Settings saved successfully!
          </SaveSuccessMessage>
        )}
        
        <SettingsDescription>
          Customize the average speeds used for calculating travel times. These values are saved locally and will be used for all route calculations.
        </SettingsDescription>

        {TRAVEL_MODE_CONFIG.map(({ key, label, icon, description }) => (
          <SpeedInputGroup key={key}>
            <SpeedInputLabel>
              <ModeIcon>{icon}</ModeIcon>
              <span>{label}</span>
            </SpeedInputLabel>
            <SpeedInputWrapper>
              <SpeedInput
                type="number"
                min="0.1"
                step="0.1"
                value={settings[key]}
                onChange={(e) => handleSpeedChange(key, e.target.value)}
                placeholder="0"
              />
              <SpeedUnit>km/h</SpeedUnit>
            </SpeedInputWrapper>
            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', paddingLeft: '32px' }}>
              {description}
            </div>
          </SpeedInputGroup>
        ))}

        <ActionsContainer>
          <ActionButton $variant="secondary" onClick={handleReset}>
            <FiRotateCcw size={14} />
            Reset to Defaults
          </ActionButton>
          <ActionButton $variant="primary" onClick={handleSave}>
            Save Settings
          </ActionButton>
        </ActionsContainer>
      </SettingsContent>
    </SettingsContainer>
  );
};

export default SpeedSettingsPanel;
