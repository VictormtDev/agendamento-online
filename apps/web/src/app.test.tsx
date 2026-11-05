import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './app';

describe('App', () => {
  it('should render the platform title', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Plataforma de Agendamento' }),
    ).toBeInTheDocument();
  });
});
