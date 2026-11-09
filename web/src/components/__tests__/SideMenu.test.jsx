import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SideMenu from '../SideMenu.jsx';

jest.mock('../../stores/AuthStore.js', () => ({
  authStore: {
    addChangeListener: jest.fn(), removeChangeListener: jest.fn(),
    getUserID: () => null, getFullName: () => null, getProfilePicUrl: () => null
  }
}));
jest.mock('../../util/Util.js', () => ({ responsiveWidth: () => false }));
jest.mock('../FBLogin.jsx', () => () => null);

test('menu links are accessible while open, and selecting a route closes the overlay', async () => {
  const container = document.createElement('div');
  container.id = 'container';
  document.body.appendChild(container);
  const { unmount } = render(<MemoryRouter>
    <SideMenu/>
    <main id="main">Page content</main>
  </MemoryRouter>, { container });
  try {
    fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
    fireEvent.click(await screen.findByRole('link', { name: 'Upload' }));
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Upload' })).toBeNull());
    expect(container.querySelector('.bm-overlay').style.opacity).toBe('0');
    expect(container.querySelector('#main').getAttribute('aria-hidden')).not.toBe('true');
  } finally {
    unmount();
    container.remove();
  }
});
