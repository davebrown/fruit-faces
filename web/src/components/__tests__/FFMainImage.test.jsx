import { act, render, screen } from '@testing-library/react';
import FFMainImage from '../FFMainImage.js';
import Dispatcher from '../../dispatcher/AppDispatcher.js';
import FFActions from '../../actions/FFActions.js';
import { IMAGES_LOADED } from '../../constants/FFConstants.js';

let mockImages = {};
jest.mock('../../stores/ImageStore.js', () => ({
  getImage: path => mockImages[path],
  getSelectedImage: () => null
}));
jest.mock('../../stores/AuthStore.js', () => ({ authStore: {} }));
jest.mock('../../util/Util.js', () => ({
  history: { replace: jest.fn() }, responsiveWidth: () => false
}));
jest.mock('dateformat', () => () => 'date');
jest.mock('../FBBlock.jsx', () => () => null);
jest.mock('../TagForm.js', () => () => null);
jest.mock('../ImageToolbar.jsx', () => () => null);

const first = { path: '/1/first', root: '/1', base: 'first', full: 'first.jpg', user: {} };
const second = { path: '/1/second', root: '/1', base: 'second', full: 'second.jpg', user: {} };
const match = imageBase => ({ params: { userId: '1', imageBase } });
const mainImage = () => document.querySelector('#main-image').getAttribute('src');

test('resolves a deep link when the catalog arrives after the image component mounts', () => {
  mockImages = {};
  render(<FFMainImage match={match('first')}/>);
  expect(screen.getByText('whoops no image, wanted /1/first')).toBeTruthy();
  mockImages = { [first.path]: first };
  act(() => Dispatcher.dispatch({ actionType: IMAGES_LOADED }));
  expect(mainImage()).toBe('/thumbs/1/first.jpg');
});

test('keeps image actions and subsequent router navigation in sync without mutating props', () => {
  mockImages = { [first.path]: first, [second.path]: second };
  const { rerender } = render(<FFMainImage match={match('first')}/>);
  act(() => FFActions.imageChanged(second));
  expect(mainImage()).toBe('/thumbs/1/second.jpg');
  rerender(<FFMainImage match={match('second')}/>);
  rerender(<FFMainImage match={match('first')}/>);
  expect(mainImage()).toBe('/thumbs/1/first.jpg');
});
