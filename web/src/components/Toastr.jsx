import { reportSuccess, reportError, reportInfo, reportWarning } from '../util/Util.js';

export default function Toastr() {
  return <div>
    <h1>Toasts</h1>
    <button onClick={() => reportSuccess('Welcome welcome welcome!!', 'You are now home my friend.')}>Success Button</button>
    <button onClick={() => reportError('error string 1', 'error string 2')}>Error Button</button>
    <button onClick={() => reportInfo('string 1', 'string 2')}>Info Button</button>
    <button onClick={() => reportWarning('warning string 1', 'warning string 2')}>Warning Button</button>
  </div>;
}
