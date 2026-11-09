import { useEffect, useState } from 'react';
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/image-gallery.css';
import ImageStore from '../stores/ImageStore.js';

export default function Slideshow() {
  const [images, setImages] = useState(() => ImageStore.getImages() || []);
  useEffect(() => {
    const update = () => setImages(ImageStore.getImages() || []);
    ImageStore.addChangeListener(update);
    update();
    return () => ImageStore.removeChangeListener(update);
  }, []);

  const items = images.map(image => ({
    original: `/thumbs${image.root}/${image.full}`,
    thumbnail: `/thumbs${image.root}/${image.base}_60x80_t.${image.ext}`
  }));
  return <div className="red-border fill-area">
    <h1>SLIDESHOW</h1>
    <ImageGallery items={items}/>
  </div>;
}
