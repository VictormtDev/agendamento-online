import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { StatusBadge } from './status-badge';

it('should show the status label', () => {
  render(<StatusBadge status="CANCELED" />);
  expect(screen.getByText('Cancelado')).toBeInTheDocument();
});
