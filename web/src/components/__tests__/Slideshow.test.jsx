import { act, render, screen } from '@testing-library/react';
import Slideshow from '../Slideshow.jsx';

let mockImages = null;
let mockListener;
const mockRemove = jest.fn();
jest.mock('../../stores/ImageStore.js', () => ({
  getImages: () => mockImages,
  addChangeListener: listener => { mockListener = listener; },
  removeChangeListener: listener => mockRemove(listener)
}));
jest.mock('react-image-gallery', () => ({ items }) => <>{items.map(item =>
  <img key={item.original} src={item.original} alt="slide"/>
)}</>);

test('a direct slideshow visit displays a catalog that arrives after mounting and cleans up its subscription', () => {
  const { unmount } = render(<Slideshow/>);
  expect(screen.queryByRole('img')).toBeNull();
  mockImages = [{ root: '/1', base: 'face', full: 'face.jpg', ext: 'jpg' }];
  act(() => mockListener());
  expect(screen.getByRole('img').getAttribute('src')).toBe('/thumbs/1/face.jpg');
  unmount();
  expect(mockRemove).toHaveBeenCalledWith(mockListener);
});
