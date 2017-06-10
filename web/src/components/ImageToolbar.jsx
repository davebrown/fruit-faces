import React from 'react';
import { Icon } from 'react-fa';

export default class ImageToolbar extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    const { onTagClick, onStarClick, onDeleteClick, onFBClick, onUploadClick } = this.props;

    /* for when favorites are implemented
       (<Icon name="star" onClick={onStarClick}/>)
     */

    return (
      <div id="image-toolbar" className={ 'flex-container image-toolbar ' + (this.props.className || '')}>
        <Icon name="tags" title="edit tags" onClick={onTagClick}/>
        <Icon name="close" title="delete image" onClick={onDeleteClick}/>
        <Icon name="facebook" title="comment on Facebook" onClick={onFBClick}/>
        <Icon name="upload" title="upload an image" onClick={onUploadClick}/>
        <span></span>
      </div>
    );
  }
}
