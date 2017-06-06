import keyMirror from 'keymirror';

export let {IMAGE_CHANGED, IMAGE_ADDED, IMAGE_DELETED, IMAGES_LOADED, ORIENTATION_CHANGED, FILTER_CHANGED, KEY_NAV_HAPPENED, FB_INITIALIZED, FB_AUTH_CHANGED, STATUS_REPORT } = keyMirror({
  IMAGE_CHANGED: null,
  IMAGE_ADDED: null,
  IMAGE_DELETED: null,
  IMAGES_LOADED: null,
  ORIENTATION_CHANGED: null,
  FILTER_CHANGED: null,
  KEY_NAV_HAPPENED: null,
  FB_INITIALIZED: null,
  FB_AUTH_CHANGED: null,
  STATUS_REPORT: null
});