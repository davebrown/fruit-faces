import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Mosaic from '../Mosaic.jsx';
import Dispatcher from '../../dispatcher/AppDispatcher.js';
import { KEY_NAV_HAPPENED } from '../../constants/FFConstants.js';

const mockImages = [
  { id: 1, root: '/1', base: 'first', ext: 'jpg', path: '/1/first' }
];

jest.mock('../../stores/ImageStore.js', () => ({
  getImages: () => mockImages,
  getFilterTag: () => null
}));
jest.mock('../../util/Util.js', () => ({
  amplitude: { logEvent: jest.fn() },
  history: { push: jest.fn() }
}));
jest.mock('../Filters.jsx', () => () => null);

test('real tooltip switches on the first click without pointer movement and stays dismissed after keyboard navigation', async () => {
  const { container } = render(
    <MemoryRouter><Mosaic images={mockImages} selectedImage={null} filter={null}/></MemoryRouter>
  );
  const mosaic = container.querySelector('#mosaic-grid');
  const link = mosaic.querySelector('a');
  fireEvent.mouseEnter(mosaic, { clientX: 15, clientY: 15 });
  await waitFor(() => expect(screen.getByRole('tooltip').textContent).toBe('Click a thumbnail to see it larger'));

  for (const target of [link.querySelector('img'), link.querySelector('div'), link]) {
    fireEvent.click(target);
    await waitFor(() => expect(screen.getByRole('tooltip').textContent).toContain('Save mouse clicks!'));
    expect(screen.getByRole('tooltip').textContent).not.toContain('Click a thumbnail');
    fireEvent.mouseMove(mosaic, { clientX: 20, clientY: 20 });
    expect(screen.getByRole('tooltip').textContent).toContain('left / right / up / down keys');
  }
  fireEvent.mouseLeave(mosaic);
  await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
  fireEvent.mouseEnter(mosaic);
  await waitFor(() => expect(screen.getByRole('tooltip').textContent).toContain('Save mouse clicks!'));

  act(() => Dispatcher.dispatch({ actionType: KEY_NAV_HAPPENED }));
  expect(screen.queryByRole('tooltip')).toBeNull();
  fireEvent.click(link);
  fireEvent.mouseLeave(mosaic);
  fireEvent.mouseEnter(mosaic);
  fireEvent.blur(window);
  fireEvent.focus(window);
  expect(screen.queryByRole('tooltip')).toBeNull();
});
