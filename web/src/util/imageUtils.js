/**
 * Pure utility functions extracted from ImageStore for testability.
 * ImageStore delegates to these so the logic can be unit-tested
 * without Flux dispatcher, browser-request, or DOM side effects.
 */

export function imageHasTag(image, tag) {
  if (image) {
    if (!image.tags) image.tags = [];
    for (var i = 0, len = image.tags.length; i < len; i++) {
      if (tag === image.tags[i]) return true;
    }
  }
  return false;
}

/**
 * Build a path-keyed map from an image array.
 * Mutates each image to set .path, .index, and .ext.
 * Returns the { path: image } map.
 */
export function indexImages(images) {
  const imageMap = {};
  for (var i = 0; i < images.length; i++) {
    var image = images[i];
    if (!image.path) {
      image.path = image.root + '/' + image.base;
    }
    imageMap[image.path] = image;
    image.index = i;
    image.ext = image.full.substring(image.full.lastIndexOf('.') + 1);
  }
  return imageMap;
}

/**
 * Interleave multiple arrays round-robin.
 * Sets .index on each element to its position in the output.
 */
export function mix(arrays) {
  var i, j;
  var ret = [];
  var max = 0;
  for (i = 0; i < arrays.length; i++) {
    max = max < arrays[i].length ? arrays[i].length : max;
  }
  for (i = 0; i < max; i++) {
    for (j = 0; j < arrays.length; j++) {
      if (i >= arrays[j].length) continue;
      var img = arrays[j][i];
      img.index = ret.length;
      ret.push(img);
    }
  }
  return ret;
}

export function getNextImage(images, selectedImage) {
  return selectedImage ? images[(selectedImage.index + 1) % images.length] : null;
}

export function getPreviousImage(images, selectedImage) {
  if (images && images.length && selectedImage) {
    var ind = selectedImage.index > 0 ? selectedImage.index - 1 : images.length - 1;
    return images[ind];
  }
  return null;
}

export function getAboveImage(images, selectedImage, mapWidth) {
  if (!selectedImage) return null;
  var newIndex = selectedImage.index - mapWidth;
  if (newIndex < 0) {
    var newCol = selectedImage.index % mapWidth - 1;
    if (newCol < 0) newCol = mapWidth - 1;
    var lastRowLen = images.length % mapWidth;
    if (newCol < lastRowLen) {
      newIndex = images.length - (lastRowLen - newCol);
    } else {
      newIndex = images.length - lastRowLen - (mapWidth - newCol);
    }
  }
  return images[newIndex];
}

export function getBelowImage(images, selectedImage, mapWidth) {
  if (!selectedImage) return null;
  var newIndex = selectedImage.index + mapWidth;
  if (newIndex < images.length) {
    return images[newIndex];
  }
  var newCol = selectedImage.index % mapWidth + 1;
  if (newCol === images.length) newCol = 0;
  newIndex = newCol;
  return newIndex < images.length ? images[newCol] : null;
}
