import amplitude from 'amplitude-js/amplitude.min';

const API_BASE_URL = process.env.FF_BACKEND_URL || 'http://localhost:9080';
const AMPLITUDE_KEY = process.env.AMPLITUDE_API_KEY || 'error-missing-amplitude-key';


// initialize amplitude
// FIXME: where to put these so they're 'early'?

amplitude.init(AMPLITUDE_KEY);

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

function reportError(input) {
  const msg = errToString(input) || 'Unknown error occurred';
  // FIXME: find nicer place for this in the UI
  alert('oops: ' + msg);
}

amplitude.logEvent = function() { }

export { amplitude, API_BASE_URL, errToString, imageHasTag, reportError };
