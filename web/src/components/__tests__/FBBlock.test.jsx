import { render } from '@testing-library/react';
import FBBlock from '../FBBlock.jsx';

test('each Facebook block decorates its own mounted element and cancels pending work on unmount', () => {
  jest.useFakeTimers();
  window.FB = { XFBML: { parse: jest.fn() } };
  try {
    const first = render(<FBBlock/>);
    const second = render(<FBBlock/>);
    jest.advanceTimersByTime(300);
    expect(window.FB.XFBML.parse.mock.calls.map(([element]) => element)).toEqual([
      first.container.firstChild, second.container.firstChild
    ]);
    first.rerender(<FBBlock className="updated"/>);
    first.unmount();
    second.unmount();
    jest.advanceTimersByTime(1000);
    expect(window.FB.XFBML.parse).toHaveBeenCalledTimes(2);
  } finally {
    delete window.FB;
    jest.useRealTimers();
  }
});
