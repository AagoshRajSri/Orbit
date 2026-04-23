import '@testing-library/jest-dom';
import { vi } from 'vitest';

global.fetch = vi.fn();
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.sessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
window.matchMedia = vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));
window.CustomEvent = class CustomEvent extends Event {
  constructor(type, options) {
    super(type, options);
    this.detail = options?.detail;
  }
};
window.dispatchEvent = vi.fn();
window.addEventListener = vi.fn();
window.removeEventListener = vi.fn();
