import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar, initialsOf } from './avatar';

describe('initialsOf', () => {
  it('should take the first and last name initials', () => {
    expect(initialsOf('Ana Maria Souza')).toBe('AS');
  });

  it('should ignore extra spaces and lowercase', () => {
    expect(initialsOf('  bruno   lima ')).toBe('BL');
  });

  it('should use a single initial for a single name', () => {
    expect(initialsOf('Zeca')).toBe('Z');
  });
});

describe('Avatar', () => {
  it('should pick the same color for the same name', () => {
    const { container: first } = render(<Avatar name="Ana Souza" />);
    const { container: second } = render(<Avatar name="Ana Souza" />);
    expect(first.firstElementChild?.className).toBe(second.firstElementChild?.className);
  });
});
