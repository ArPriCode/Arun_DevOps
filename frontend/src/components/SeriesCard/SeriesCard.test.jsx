import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

let navigateMock;

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

import SeriesCard from './SeriesCard.jsx';

describe('SeriesCard', () => {
  beforeEach(() => {
    navigateMock = vi.fn();
  });

  it('renders title and rating', () => {
    render(
      <SeriesCard
        id={1}
        title="Test Series"
        rating={9}
        genres={['Action']}
        year={2023}
        seasons={2}
        image={null}
      />,
    );

    expect(screen.getByText('Test Series')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
  });

  it('is clickable', () => {
    render(
      <SeriesCard
        id={1}
        title="Clickable"
        rating={8}
        genres={['Drama']}
        year={2023}
        seasons={1}
        image={null}
      />,
    );

    fireEvent.click(screen.getByText('Clickable'));
    expect(navigateMock).toHaveBeenCalled();
  });
});

