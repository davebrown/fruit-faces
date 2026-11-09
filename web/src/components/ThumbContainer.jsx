import React from 'react';
import { Link } from 'react-router-dom';

import Timeline from './Timeline.jsx';
import Mosaic from './Mosaic.jsx';
import Dispatcher from '../dispatcher/AppDispatcher.js';
import { IMAGES_LOADED, IMAGE_CHANGED, IMAGE_ADDED, IMAGE_DELETED, KEY_NAV_HAPPENED, FILTER_CHANGED } from '../constants/FFConstants.js';
import imageStore from '../stores/ImageStore.js';

export default class ThumbContainer extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      imagesLoaded: false,
      images: [],
      selectedImage: null,
      filter: null,
      view: 'mosaic'
    }
    this.imageChangeListener = this.imageChangeListener.bind(this);
    this.viewChange = this.viewChange.bind(this);
  }

  componentDidMount() {
    this.dispatcherToken = Dispatcher.register(this.imageChangeListener);
    this.setState({
      imagesLoaded: imageStore.getImages() !== null,
      images: imageStore.getImages() || [],
      selectedImage: imageStore.getSelectedImage(),
      filter: imageStore.getFilterTag()
    });
  }

  componentWillUnmount() {
    Dispatcher.unregister(this.dispatcherToken);
  }
  
  imageChangeListener(action) {
    switch (action.actionType) {
      case IMAGES_LOADED:
        this.setState({
          imagesLoaded: true,
          images: action.images,
          selectedImage: imageStore.getSelectedImage()
        });
        break;
      case FILTER_CHANGED:
        this.setState({ filter: action.filter });
      case KEY_NAV_HAPPENED:
        break;
      case IMAGE_CHANGED:
      case IMAGE_ADDED:
      case IMAGE_DELETED:
        this.setState({
          selectedImage: imageStore.getSelectedImage()
        });
        break;
    }
  }

  viewChange(e) {
    this.setState({ view: e });
  }

  render() {
    const { imagesLoaded, images, selectedImage, filter, view } = this.state;
    const timeline = (<Timeline images={images} selectedImage={selectedImage}/>);
    const viewComp = view == 'timeline' ? timeline : (<Mosaic images={images} selectedImage={selectedImage} filter={filter}/>);
    return (
      <div className="flex-column flex-fixed scrollable thumb-container">
        <div className="thumb-view-chooser">
          <label key="radio-mosaic" className="form-radio">
            <input type="radio" name="thumb-view" value="mosaic" checked={view === 'mosaic'}
              onChange={() => this.viewChange('mosaic')}/> <i className="form-icon"></i> mosaic view
          </label>
          <label key="radio-timeline" className="form-radio">
            <input type="radio" name="thumb-view" value="timeline" checked={view === 'timeline'}
              onChange={() => this.viewChange('timeline')}/> <i className="form-icon"></i> timeline view
          </label>
        </div>
        {viewComp}
      </div>
    );
  }    
}
