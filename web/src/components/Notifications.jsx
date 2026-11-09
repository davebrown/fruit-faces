import { useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Dispatcher from '../dispatcher/AppDispatcher.js';
import { STATUS_REPORT } from '../constants/FFConstants.js';

export default function Notifications() {
  useEffect(() => {
    const token = Dispatcher.register(action => {
      if (action.actionType !== STATUS_REPORT) return;
      const { message, title, statusType } = action;
      const type = ['success', 'warning', 'info', 'error'].includes(statusType) ? statusType : 'error';
      toast[type](<>{title && <strong className="block-center">{title}</strong>}{message}</>, {
        toastId: `${type}:${title}:${message}`
      });
    });
    return () => Dispatcher.unregister(token);
  }, []);

  return <ToastContainer position="top-right" autoClose={3000} theme="colored"/>;
}
