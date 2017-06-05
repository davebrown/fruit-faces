import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { ToastContainer, ToastMessage } from 'react-toastr';

const ToastMessageFactory = React.createFactory(ToastMessage.animation);

export default class Toastr extends React.Component {

  constructor(props) {
    super(props);
    this.toastClick = this.toastClick.bind(this);
  }

  toastClick(type) {
    console.log('toast click: type:', type, 'this', this);
    /* msg types: error, success, warning, info
       clear()
     */
    const opts =  {
      timeOut: 3000,
      extendedTimeOut: 10000,
      preventDuplicates: true,
      closeButton: true
    };
    const cont = this.refs.container;
    if (type === 'success') {
      cont.success(
      "Welcome welcome welcome!!",
      "You are now home my friend. Welcome home my friend.", opts);
    } else if (type === 'info') {
      cont.info('string 1', 'string 2', opts);
    } else if (type === 'error') {
      cont.error('error string 1', 'error string 2', opts);
    } else {
      cont.warning('warning string 1', 'warning string 2', opts);
    }
  }
  render() {

    return (
      <div>
        <ToastContainer ref="container"
          toastMessageFactory={ToastMessageFactory}
          className="toast-top-right" />
        <h1>Toasts</h1>
        <button onClick={() => this.toastClick('success')}>Success Button</button>
        <button onClick={() => this.toastClick('error')}>Error Button</button>
        <button onClick={() => this.toastClick('info')}>Info Button</button>
        <button onClick={() => this.toastClick('warning')}>Warning Button</button>
      </div>
    );
  }
}
