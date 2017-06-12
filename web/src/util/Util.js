import amplitude from 'amplitude-js/amplitude.min';
import createHistory from 'history/createHashHistory';
import FFActions from '../actions/FFActions.js';

const hashHistory = createHistory();

const API_BASE_URL = process.env.FF_BACKEND_URL || 'http://localhost:9080';
const AMPLITUDE_KEY = process.env.AMPLITUDE_API_KEY || 'error-missing-amplitude-key';
var REDIRECT_URI = process.env.FF_URL || 'http://localhost:3000/'
if (process.env.NODE_ENV === 'production') {
  REDIRECT_URI = 'https://ff.moonspider.com/';
}
// initialize amplitude
// FIXME: where to put these so they're 'early'?

amplitude.init(AMPLITUDE_KEY);

/*
var _logEvent = amplitude.logEvent;

amplitude.logEvent = function(key, obj) {
  if (obj.hasOwnProperty('imageBase') && !obj['imageBase']) {
    throw new Error('amplitudeEvent key=' + key + ' with imageBase "' + obj['imageBase'] + '"');
  }
  //_logEvent(key, obj);
}
*/
function imageHasTag(image, tag) {
  if (image) {
    if (!image.tags) image.tags = [];
    for (var i = 0, len = image.tags.length; i < len; i++) {
      if (tag === image.tags[i]) return true;
    }
  }
  return false;
}


function errToString(input) {
  if (input === null) return 'null';
  else if (typeof input === 'string') return input;
  // try to look for methods on Error
  else if (input.message) {
    // capture 'type' field if present
    var prefix = "";
    if (input.type) {
      prefix = '(type: ' + input.type + ') ';
    }
    return prefix + input.message;
  }
  else if (input.toLocaleString) return input.toLocaleString();
  else if (input.toString) return input.toString();
  // ??
  return 'Unknown error';
}

function reportSuccess(message, title) {
  FFActions.statusReport(message, title || '', 'success');
}

function reportInfo(message, title) {
  FFActions.statusReport(message, title || '', 'info');
}

function reportWarning(message, title) {
  FFActions.statusReport(message, title || '', 'warning');
}

function reportError(input, title) {
  const msg = errToString(input) || 'Unknown error occurred';
  title = title || '';
  FFActions.statusReport(msg, title, 'error');
}

function responsiveWidth() {
  return window.innerWidth < 1240;
}

export { amplitude, API_BASE_URL, errToString, imageHasTag, reportError, reportSuccess, reportInfo, reportWarning, REDIRECT_URI, hashHistory, responsiveWidth };
