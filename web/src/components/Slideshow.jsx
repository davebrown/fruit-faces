import React from 'react';
import { Link } from 'react-router';
import ImageGallery from 'react-image-gallery';
import ImageStore from '../stores/ImageStore.js';

export default class Slideshow extends React.Component {

  constructor(props) {
    super(props);
    this.images = [];
    const images = ImageStore.getImages();
    for (var i = 0; i < images.length; i++) {
      this.images.push({
        original: '/thumbs/' + images[i].full,
        thumbnail: '/thumbs/' + images[i].base + '_60x80_t.jpg'
      });
    }
  }

  handleImageLoad(event) {
    console.log('Image loaded ', event.target)
  }
  
  render() {
    return (
      <div className="red-border fill-area">
        <h1>SLIDESHOW</h1>
        <ImageGallery
          items={this.images}
          onImageLoad={this.handleImageLoad}/>
      </div>);
  }
}
