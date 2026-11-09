export class Dispatcher {
  callbacks = new Map();
  nextToken = 0;
  dispatching = false;

  register(callback) {
    const token = `listener-${this.nextToken++}`;
    this.callbacks.set(token, callback);
    return token;
  }

  unregister(token) {
    this.callbacks.delete(token);
  }

  isDispatching() {
    return this.dispatching;
  }

  dispatch(action) {
    if (this.dispatching) {
      throw new Error('Cannot dispatch an action while another action is being dispatched');
    }
    this.dispatching = true;
    try {
      for (const [token, callback] of [...this.callbacks]) {
        if (this.callbacks.has(token)) callback(action);
      }
    } finally {
      this.dispatching = false;
    }
  }
}

export default new Dispatcher();
