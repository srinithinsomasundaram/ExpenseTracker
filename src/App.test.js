import { render, screen } from '@testing-library/react';
import App from './App';

test('Yesp', () => {
  render(<App />);
  const linkElement = screen.getByText(/Yesp/i);
  expect(linkElement).toBeInTheDocument();
});
