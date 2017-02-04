import amplitude from 'amplitude-js/amplitude.min';

const API_BASE_URL = process.env.FF_BACKEND_URL || 'http://localhost:9080';
const AMPLITUDE_KEY = process.env.AMPLITUDE_API_KEY || 'error-missing-amplitude-key';
const FB_APP_ID = process.env.FB_APP_ID || 'error-missing-fb-app-id';

// initialize amplitude and facebook
// FIXME: where to put these so they're 'early'?

var meta = document.createElement('meta');
meta.property = 'fb:app_id';
meta.content = FB_APP_ID;
document.getElementsByTagName('head')[0].appendChild(meta);

amplitude.init(AMPLITUDE_KEY);
window.fbAsyncInit = function() {
  FB.init({
    appId      : FB_APP_ID,
    xfbml      : true,
    version    : 'v2.8'
  });
  FB.AppEvents.logPageView();
};

(function(d, s, id){
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {return;}
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

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
  else if (input.message) return input.message;
  else if (input.toLocaleString) return input.toLocaleString();
  else if (input.toString) return input.toString();
  // ??
  return 'Unknown error';
}

export { amplitude, API_BASE_URL, errToString, imageHasTag };
