import { Dispatcher } from '../AppDispatcher.js';

test('dispatch preserves listener order and skips listeners removed during an action', () => {
  const dispatcher = new Dispatcher();
  const calls = [];
  dispatcher.register(action => {
    calls.push(action.type);
    dispatcher.unregister(second);
  });
  const second = dispatcher.register(() => calls.push('removed'));
  dispatcher.register(() => calls.push('last'));
  dispatcher.dispatch({ type: 'first' });
  expect(calls).toEqual(['first', 'last']);
});

test('nested actions are rejected and errors do not leave the dispatcher stuck', () => {
  const dispatcher = new Dispatcher();
  const token = dispatcher.register(() => dispatcher.dispatch({}));
  expect(() => dispatcher.dispatch({})).toThrow('Cannot dispatch');
  expect(dispatcher.isDispatching()).toBe(false);
  dispatcher.unregister(token);
  const listener = jest.fn();
  dispatcher.register(listener);
  dispatcher.dispatch({ type: 'recovered' });
  expect(listener).toHaveBeenCalledWith({ type: 'recovered' });
});
