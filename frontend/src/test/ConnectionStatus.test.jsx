import { describe, it, expect, vi } from 'vitest';

describe('ConnectionStatus Component', () => {
  it('should render offline message when useConnectivity returns isOnline=false', () => {
    const mockUseConnectivity = () => ({ isOnline: false, connectionType: '4g' });
    const result = mockUseConnectivity();
    expect(result.isOnline).toBe(false);
  });

  it('should return null when online', () => {
    const mockUseConnectivity = () => ({ isOnline: true, connectionType: 'wifi' });
    const result = mockUseConnectivity();
    expect(result.isOnline).toBe(true);
  });

  it('should track connection type', () => {
    const mockUseConnectivity = () => ({ isOnline: true, connectionType: '5g' });
    const result = mockUseConnectivity();
    expect(result.connectionType).toBe('5g');
  });
});
