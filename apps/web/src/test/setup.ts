import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library only auto-cleans when test globals are enabled; this project imports
// describe/it explicitly, so the DOM must be reset by hand between tests.
afterEach(() => {
  cleanup();
  localStorage.clear();
});
