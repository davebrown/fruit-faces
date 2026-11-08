import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
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
jest.mock('react-fa', () => ({ Icon: () => null }));
test('real tooltip changes during continuous hover and stays dismissed after keyboard navigation', () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  try {
    act(() => {
      ReactDOM.render(
        <MemoryRouter>
          <Mosaic images={mockImages} selectedImage={null} filter={null}/>
        </MemoryRouter>,
        container
      );
    });
    const mosaic = container.querySelector('[data-for="table-tt"]');
    const thumbnailLink = mosaic.querySelector('a');
    const thumbnail = thumbnailLink.querySelector('img');
    const mouseEvent = type => act(() => {
      mosaic.dispatchEvent(new MouseEvent(type, { clientX: 15, clientY: 15 }));
    });
    const visibleTooltip = () => container.querySelector('#table-tt.show');

    mouseEvent('mouseenter');
    expect(visibleTooltip().textContent).toBe('Click a thumbnail to see it larger');
    for (const target of [thumbnail, thumbnailLink.querySelector('div')]) {
      act(() => target.click());
      expect(visibleTooltip()).toBeNull();
      mouseEvent('mousemove');
      expect(visibleTooltip()).toBeNull();
    }
    act(() => thumbnailLink.click());
    expect(visibleTooltip().textContent).toContain('Save mouse clicks!');
    expect(visibleTooltip().textContent).not.toContain('Click a thumbnail');
    mouseEvent('mousemove');
    expect(visibleTooltip().textContent).toContain('left / right / up / down keys');
    mouseEvent('mouseleave');
    expect(visibleTooltip()).toBeNull();
    mouseEvent('mouseenter');
    expect(visibleTooltip().textContent).toContain('Save mouse clicks!');
    act(() => thumbnail.click());
    expect(visibleTooltip().textContent).toContain('Save mouse clicks!');

    act(() => Dispatcher.dispatch({ actionType: KEY_NAV_HAPPENED }));
    expect(visibleTooltip()).toBeNull();
    act(() => thumbnail.click());
    mouseEvent('mousemove');
    mouseEvent('mouseleave');
    mouseEvent('mouseenter');
    act(() => {
      window.dispatchEvent(new Event('blur'));
      window.dispatchEvent(new Event('focus'));
    });
    expect(visibleTooltip()).toBeNull();
  } finally {
    act(() => ReactDOM.unmountComponentAtNode(container));
    container.remove();
  }
});
