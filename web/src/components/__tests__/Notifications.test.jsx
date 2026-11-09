import { StrictMode } from 'react';
import { act, render } from '@testing-library/react';
import { toast } from 'react-toastify';
import Notifications from '../Notifications.jsx';
import Dispatcher from '../../dispatcher/AppDispatcher.js';
import { STATUS_REPORT } from '../../constants/FFConstants.js';

jest.mock('react-toastify', () => ({
  ToastContainer: () => null,
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn(), warning: jest.fn() }
}));

test('status actions display once under StrictMode and stop displaying after unmount', () => {
  const { unmount } = render(<StrictMode><Notifications/></StrictMode>);
  const action = { actionType: STATUS_REPORT, statusType: 'success', title: 'Done', message: 'Uploaded' };
  act(() => Dispatcher.dispatch(action));
  expect(toast.success).toHaveBeenCalledTimes(1);
  unmount();
  act(() => Dispatcher.dispatch(action));
  expect(toast.success).toHaveBeenCalledTimes(1);
});
