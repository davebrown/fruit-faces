import { StrictMode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import FBLogin from '../FBLogin.jsx';
import { authStore, fbLoginCallback } from '../../stores/AuthStore.js';

jest.mock('../../stores/AuthStore.js', () => ({
  authStore: { addChangeListener: jest.fn(), removeChangeListener: jest.fn() },
  fbLoginCallback: jest.fn()
}));

afterEach(() => {
  delete window.FB;
  jest.clearAllMocks();
});

test('uses the existing Facebook SDK and preserves requested permissions', () => {
  window.FB = {
    login: jest.fn(),
    api: jest.fn((path, options, callback) => callback({ name: 'Test User', email: 'user@example.test' }))
  };
  const { unmount } = render(<StrictMode><FBLogin scope="publish_actions"/></StrictMode>);
  fireEvent.click(screen.getByRole('button'));
  const [callback, options] = window.FB.login.mock.calls[0];
  expect(options).toEqual({ scope: 'publish_actions', return_scopes: true });
  callback({ authResponse: { userID: 'test-user', accessToken: 'test-token', expiresIn: 3600 } });
  expect(window.FB.api).toHaveBeenCalledWith('/me', { fields: 'name,email,picture' }, expect.any(Function));
  expect(fbLoginCallback).toHaveBeenCalledWith({
    userID: 'test-user', accessToken: 'test-token', expiresIn: 3600,
    name: 'Test User', email: 'user@example.test'
  });
  callback({});
  expect(fbLoginCallback).toHaveBeenCalledTimes(1);
  unmount();
  expect(authStore.addChangeListener.mock.calls.length).toBe(authStore.removeChangeListener.mock.calls.length);
});

test('does not attempt login while the SDK is unavailable', () => {
  render(<FBLogin/>);
  expect(screen.getByRole('button').disabled).toBe(true);
});
