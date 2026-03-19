import "@testing-library/jest-dom";
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MetricsView, type Metric } from './MetricsView';

describe('MetricsView', () => {
  const metrics: Metric[] = [
    { id: '1', name: 'Maintainability', value: '5%' },
    { id: '2', name: 'Issues', value: '10' },
  ];

  it('renders all metrics correctly', () => {
    render(<MetricsView metrics={metrics} />);

    // Check each metric 
    expect(screen.getByText('Issues')).toBeInTheDocument();
    expect(screen.getByText('Maintainability')).toBeInTheDocument();

    expect(screen.getByText('5%')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});
