import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Upload from '../Upload.jsx';
import FFActions from '../../actions/FFActions.js';

jest.mock('../../stores/AuthStore.js', () => ({
  authStore: {
    getUserID: () => 'test-user', getAccessToken: () => 'test-token',
    getPublishPermission: () => true,
    addChangeListener: jest.fn(), removeChangeListener: jest.fn()
  }
}));
jest.mock('browser-request', () => (options, callback) => callback(null, { statusCode: 200 }, '[]'));
jest.mock('../../actions/FFActions.js', () => ({
  imageAdded: jest.fn(), imageChanged: jest.fn()
}));
jest.mock('../../util/Util.js', () => ({
  API_BASE_URL: '', reportError: jest.fn(), reportSuccess: jest.fn(),
  errToString: error => error.message || String(error)
}));
jest.mock('../FBLogin.jsx', () => () => null);
jest.mock('../Timeline.jsx', () => () => null);
jest.mock('../../stores/ImageStore.js', () => ({}));

let xhr;
beforeEach(() => {
  jest.clearAllMocks();
  xhr = {
    open: jest.fn(), setRequestHeader: jest.fn(), send: jest.fn(), abort: jest.fn(),
    upload: {}, status: 201, responseText: ''
  };
  jest.spyOn(window, 'XMLHttpRequest').mockImplementation(() => xhr);
});
afterEach(() => jest.restoreAllMocks());

async function choosePhoto() {
  const file = new File(['image'], 'face.png', { type: 'image/png' });
  fireEvent.change(screen.getByLabelText('Choose photo'), { target: { files: [file] } });
  await screen.findByText('face.png');
  return file;
}

test('uploads the selected image with authentication, duplicate prevention, progress, and catalog updates', async () => {
  render(<Upload/>);
  const file = await choosePhoto();
  fireEvent.click(screen.getByRole('button', { name: 'Upload' }));
  const data = xhr.send.mock.calls[0][0];
  expect(data.get('imagefile')).toBe(file);
  expect(data.get('avoidDups')).toBe('true');
  expect(xhr.open).toHaveBeenCalledWith('POST', '/api/v1/images');
  expect(xhr.setRequestHeader).toHaveBeenCalledWith('X-FF-Auth', 'test-token');
  act(() => xhr.upload.onprogress({ loaded: 25, total: 100 }));
  expect(screen.getByRole('progressbar').value).toBe(25);
  const image = { root: '/1', base: 'new-face', full: 'new-face.jpg' };
  xhr.responseText = JSON.stringify(image);
  act(() => xhr.onload());
  expect(FFActions.imageAdded).toHaveBeenCalledWith(expect.objectContaining({ path: '/1/new-face' }));
  expect(FFActions.imageChanged).toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Upload' }).disabled).toBe(true);
});

test('keeps failed uploads retryable and aborts in-flight requests when unmounted', async () => {
  const { unmount } = render(<Upload/>);
  await choosePhoto();
  fireEvent.click(screen.getByRole('button', { name: 'Upload' }));
  xhr.status = 409;
  xhr.responseText = JSON.stringify({ message: 'Duplicate image' });
  act(() => xhr.onload());
  expect(screen.getByRole('alert').textContent).toBe('Duplicate image');
  expect(screen.getByRole('button', { name: 'Upload' }).disabled).toBe(false);
  expect(FFActions.imageAdded).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Upload' }));
  unmount();
  expect(xhr.abort).toHaveBeenCalled();
  expect(xhr.onload).toBeNull();
});

test('an invalid selection clears a previously valid image', async () => {
  render(<Upload/>);
  await choosePhoto();
  fireEvent.change(screen.getByLabelText('Choose photo'), {
    target: { files: [new File(['text'], 'notes.txt', { type: 'text/plain' })] }
  });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Upload' }).disabled).toBe(true));
  expect(screen.getByRole('alert').textContent).toContain('not an image file');
});
