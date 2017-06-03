import { EventEmitter } from 'events';
import request from 'browser-request';
import { FB_INITIALIZED, FB_AUTH_CHANGED } from '../constants/FFConstants.js';
import Dispatcher from '../dispatcher/AppDispatcher.js';
import FFActions from '../actions/FFActions.js';
import { amplitude, errToString, API_BASE_URL, reportSuccess } from '../util/Util.js';

// initial mirror
const UNKNOWN_LOGIN = {
  status: "unknown",
  userID: null,
  accessToken: null,
  name: null,
  picture: {
    data: {
      url: null
    }
  }
}

const CHANGE_EVENT = 'change';

var login = UNKNOWN_LOGIN;

class AuthStore extends EventEmitter {
  emitChange() {
    this.emit(CHANGE_EVENT);
  }

  addChangeListener(callback) {
    this.on(CHANGE_EVENT, callback);
  }

  removeChangeListener(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }

  getUserID() {
    var ret = login.userID;
    //console.log('AuthStore.getUserID()->' + ret);
    return ret;
  }
  
  getAccessToken() {
    return login.accessToken;
  }

  getFullName() {
    return login.name;
  }

  getProfilePicUrl() {
    //console.log('getprofilepic, login is', login);
    return login.picture.data && login.picture.data.url;
  }
  
  _setLogin(l) {
    //console.log('AuthStore._setLogin', l);
    login = l;
    this.emitChange();
    if (login.userID) {
      amplitude.setUserId(login.userID);
    } else {
      amplitude.setUserId(null);
    }
    if (login.accessToken) {
      request({
        method: 'POST',
        url: API_BASE_URL + '/api/v1/users/register',
        headers: {
          'X-FF-Auth': authStore.getAccessToken()
        }
      }, (er, response, bodyString) => {
        if (er) {
          amplitude.logEvent('REGISTER_ERROR', { errorMsg: errToString(er) });
        } else if (response.statusCode < 200 || response.statusCode > 299) {
          var errObj = JSON.parse(bodyString);
          amplitude.logEvent('REGISTER_ERROR', { errorMsg: errToString(errObj) });
        }
      });
      
    }
  }

  _setName(n) {
    login.name = n;
    this.emitChange();
  }

  _setProfilePicUrl(u) {
    login.picture.data.url = u;
    this.emitChange();
  }
}

const authStore = new AuthStore();

// initialize FB
// FIXME: where to put these so they're 'early'?
const FB_APP_ID = process.env.FB_APP_ID || 'error-missing-fb-app-id';

var meta = document.createElement('meta');
meta.property = 'fb:app_id';
meta.content = FB_APP_ID;
document.getElementsByTagName('head')[0].appendChild(meta);

window.fbAsyncInit = function() {
  FB.init({
    appId      : FB_APP_ID,
    xfbml      : true,
    version    : 'v2.8'
  });
  FB.AppEvents.logPageView();
  // https://developers.facebook.com/docs/reference/javascript/FB.getLoginStatus
  // this callback arg has the same shape as FB.getLoginStatus(), so pipe it to that same handler
  FB.Event.subscribe('auth.authResponseChange', (response) => {
    console.log('auth status change - ' + new Date(), response);
    fbStatusCallback(response);
  });
  //console.log('AuthStore: fbInitialized');
  FFActions.fbInitialized();
};

(function(d, s, id){
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {return;}
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

/* receives callback from FB.getLoginStatus() */
function fbStatusCallback(response) {
  //console.log('AuthStore.fbStatusCallback', response, response.status === 'connected');
  // compose an object that looks like the 'login' prototype above
  const ar = response.authResponse;
  var login = {
    status: response && response.status,
    userID: ar && ar.userID,
    accessToken: ar && ar.accessToken,
    name: 'unknown',
    picture: {
      data: {
        url: null
      }
    }
  }
  authStore._setLogin(login);
  if (response.status === 'connected') {
    amplitude.logEvent('FB_LOGIN', {});
    FB.api('/me', (rsp) => {
      if (!rsp || rsp.error) {
        console.warn('FB API error getting profile name', rsp);
        amplitude.logEvent('FB_PROFILE_ERROR', { errorMsg: errToString(rsp) });
      } else {
        authStore._setName(rsp.name);
        reportSuccess('You can upload fruit faces!', 'Logged in');
      }
      if (!Dispatcher.isDispatching()) {
        FFActions.fbAuthChanged();
      }
    });
    FB.api('/me/picture', (rsp) => {
      if (!rsp || rsp.error) {
        console.warn('FB api error getting profile pic', rsp);
        amplitude.logEvent('FB_PICTURE_ERROR', { errorMsg: errToString(rsp) });
      } else {
        var url = rsp.data && rsp.data.url;
        authStore._setProfilePicUrl(url);
        if (!Dispatcher.isDispatching())  FFActions.fbAuthChanged();
      }
    }, true);
  }
  if (!Dispatcher.isDispatching())  FFActions.fbAuthChanged();
}
/* receives callback from FacebookLogin component */
function fbLoginCallback(response) {
  //console.log('AuthStore.fbLoginCallback', response);
  //authStore._setLogin(response);
}

authStore._fbLoginCallback = fbLoginCallback;

Dispatcher.register((action) => {
  switch (action.actionType) {
    case FB_INITIALIZED:
      FB.getLoginStatus(fbStatusCallback, true);
      break;
  }
});

export { authStore, FB_APP_ID, fbLoginCallback };
