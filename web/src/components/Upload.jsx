import React from 'react';
import { Link } from 'react-router-dom';
import request from 'browser-request';
import Icon from './Icon.jsx';

import FFActions from '../actions/FFActions.js';
import { API_BASE_URL, reportError, reportSuccess, errToString } from '../util/Util.js';
import { authStore } from '../stores/AuthStore.js';
import FBLogin from './FBLogin.jsx';
import Timeline from './Timeline.jsx';
import ImageStore from '../stores/ImageStore.js';

export default class Upload extends React.Component {

  constructor(props) {
    super(props);
    this.fileInput = React.createRef();
    this.state = {
      avoidDups: true, postToFB: false, havePublishPermission: false,
      uploading: false, dataUploaded: 0, dataSize: 0, file: null, fileUri: null
    };
    this.uploadSuccess = this.uploadSuccess.bind(this);
    this.uploadError = this.uploadError.bind(this);
    this.uploading = this.uploading.bind(this);
    this.doUpload = this.doUpload.bind(this);
    this.uploadStopped = this.uploadStopped.bind(this);
    this.authChanged = this.authChanged.bind(this);
    this.fetchUserImages = this.fetchUserImages.bind(this);
    this.dupCheckHandler = this.dupCheckHandler.bind(this);
    this.fbCheckHandler = this.fbCheckHandler.bind(this);
    this.beforeUpload = this.beforeUpload.bind(this);
    this.chooseFile = this.chooseFile.bind(this);
  }

  
  componentDidMount() {
    authStore.addChangeListener(this.authChanged);
    this.authChanged();
  }

  fetchUserImages() {
    if (authStore.getAccessToken() != null) {
      request({
        method: 'GET',
        url: API_BASE_URL + '/api/v1/images/mine',
        headers: {
          'X-FF-Auth': authStore.getAccessToken()
        }
      }, (er, response, bodyString) => {
        if (response && response.statusCode === 200) {
          var myImages =  JSON.parse(bodyString);
          myImages.forEach(this.fixupImage);
          this.setState({
            uploadedImages: myImages
          });
        } else if (er) {
          reportError(er, 'problem fetching images');
        }
      });
    }
  }

  authChanged() {
    this.setState({
      accessToken: authStore.getAccessToken(),
      havePublishPermission: authStore.getPublishPermission()
    });
    if (authStore.getAccessToken()) {
      if (!this.state || !this.state.uploadedImages) {
        this.fetchUserImages();
      }
    } else {
      this.setState({ uploadedImages: null });
    }
    
  }    

  componentWillUnmount() {
    authStore.removeChangeListener(this.authChanged);
    if (this.xhr) {
      this.xhr.onload = this.xhr.onerror = null;
      this.xhr.upload.onprogress = null;
      this.xhr.abort();
    }
    if (this.reader) {
      this.reader.onload = null;
      this.reader.abort();
    }
  }

  dupCheckHandler(e) {
    this.setState({ avoidDups: !this.state.avoidDups });
  }

  fbCheckHandler(e) {
    this.setState({ postToFB: !this.state.postToFB });
  }

  uploadStopped(newImage) {
    this.setState({
      uploading: false,
    });
  }

  chooseFile(files) {
    /*console.log('chooseFile: files: ', files);
    console.log('files.length', files.length);
    for (var i = 0; i < files.length; i++) {
      console.log('files[' + i + ']:', files[i], typeof(files[i]));
    }
    */
    if (files && files.length > 0) {
      if (this.reader) {
        this.reader.onload = null;
        this.reader.abort();
      }
      this.setState({ file: null, fileUri: null, error: null });
      const file = files[0];
      if (file.type.match('image.*')) {
        const reader = new FileReader();
        this.reader = reader;
        reader.onload = (img) => {
          if (img && img.target && img.target.result) {
            this.setState({fileUri: img.target.result, file, error: null});
          }
        };
        reader.readAsDataURL(file);
      } else {
        this.setState({
          file: null,
          fileUri: null,
          error: file.name + ' is not an image file'
        });
      }
    }
  }
  doUpload(files, mill, xhrID) {
    this.setState({
      uploading: true,
      dataUploaded: 0,
      dataSize: 100 * 1000
    });
  }

  startUpload = () => {
    if (!this.state.file || this.state.uploading || !this.beforeUpload()) return;
    const xhr = new XMLHttpRequest();
    this.xhr = xhr;
    const data = new FormData();
    data.append('imagefile', this.state.file);
    data.append('avoidDups', String(this.state.avoidDups));
    xhr.open('POST', API_BASE_URL + '/api/v1/images');
    xhr.setRequestHeader('X-FF-Auth', this.state.accessToken);
    xhr.upload.onprogress = this.uploading;
    xhr.onerror = () => this.uploadError(new Error('Network error while uploading image'));
    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) this.uploadSuccess(response);
        else this.uploadError(response);
      } catch (error) {
        this.uploadError(error);
      }
    };
    this.doUpload();
    xhr.send(data);
  };

  fixupImage(newImage) {
    if (newImage.base) {
      newImage.path = newImage.root + '/' + newImage.base;
      newImage.ext = newImage.full.substring(newImage.full.lastIndexOf('.') + 1);
    }
  }
  
  uploadSuccess(newImage) {
    this.uploadStopped(newImage);
    var images = (this.state && this.state.uploadedImages) || [];
    if (newImage && newImage.base) {
      this.fixupImage(newImage);
      this.setState({ uploadedImages: [...images, newImage] });
    }
    FFActions.imageAdded(newImage);
    FFActions.imageChanged(newImage);
    if (this.state.postToFB) {
      request({
        method: 'POST',
        url: API_BASE_URL + '/api/v1/images' + newImage.path + '/timeline',
        headers: {
          'X-FF-Auth': authStore.getAccessToken()
        },
        json:{message: this.commentInput.value || ''}
      }, (er, response, bodyString) => {
        if (response && (response.statusCode >= 200 && response.statusCode <= 299)) {
          reportSuccess('posted ' + (newImage.base || '') + ' to Facebook');
        } else {
          reportError(er, 'could not post to Facebook');
        }
      });
    }
    this.setState({
      file: null,
      fileUri: null,
      error: null
    });
    if (this.fileInput.current) this.fileInput.current.value = '';
    reportSuccess(newImage.base || '', 'Uploaded image');
  }
  
  uploadError(err) {
    this.uploadStopped();
    console.error('Upload.uploadError', err);
    reportError(err, 'problem uploading image');
    this.setState({
      error: err
    });
  }

  uploading(progress) {
    this.setState({
      uploading: true,
      dataUploaded: progress.loaded,
      dataSize: progress.total
    });
  }

  beforeUpload(files, mill) {
    /*if (files.length > 0) {
      const f = files.item(0);
      console.log('before upload: file ' + f.name + ' type=' + f.type + ' path=' + f.webkitRelativePath);
    }
    */
    var ret = true;
    var comment = (this.commentInput && this.commentInput.value) || null;
    if (comment) comment = comment.trim();
    if (this.state.postToFB && !comment) {
      ret = confirm("Proceed with empty Facebook post text?");
      if (!ret) {
        document.getElementById('fb-comment-text').focus();
      }
    }
    return ret;
  }
  render() {
    if (!authStore.getUserID()) {
      return (<div className="center-single-child"><span>Please <FBLogin/> to upload images.</span></div>);
    }
    const { uploading, dataUploaded, dataSize, uploadedImages,
            avoidDups, postToFB, havePublishPermission, file, fileUri } = this.state;

    var progress = '';
    var filename = '';
    if (uploading) {
      progress = (<progress className="block-center" value={dataUploaded} max={dataSize}></progress>);
      filename = (<span className="footnote block-center text-center">{file && file.name || ''}</span>);
    }
    var thumbDisplay;
    if (!uploadedImages) {
      thumbDisplay = (<span className="loading">loading</span>);
    } else if (uploadedImages.length === 0) {
      thumbDisplay = (<span className="text-center">None uploaded yet</span>);
    } else {
      thumbDisplay = (<Timeline images={uploadedImages} showLabel="true"/>);
    }

    var fbPublish = '';
    var commentInput = '';
    if (postToFB) {
      if (!havePublishPermission) {
        fbPublish = (<span>Please grant Art for Breakfast <FBLogin renderLink={false} scope='publish_actions' authText="permission"/> to post to your Facebook timeline</span>);
      } else {
        commentInput = (
          <div className="flex-column fb-comment">
            <span><Icon name="facebook" title="comment on Facebook"/> Facebook comment</span>
            <textarea id="fb-comment-text" className="form-input"
              placeholder="Type a facebook comment for your image..." rows="3"
              ref={(input) => { this.commentInput = input; } }
              >
            </textarea>
          </div>
        );
      }
    }
    var thumbPreview = '';
    if (file && fileUri) {
      thumbPreview = (
        <div className="flex-column thumb-cell">
          <img src={fileUri} style={{ width: '80px', height: '80px' }}/>
          <span className="footnote">{file.name}</span>
        </div>
      );
    } else {
      thumbPreview = (
        <div className="empty empty-thumb-cell">
        </div>
      );
    }
    var uploadClasses = 'btn btn-primary btn-lg';
    if (!file) {
      uploadClasses += ' disabled';
    }
    return (
      <div className="flex-column upload">
        <div className="flex-column form-group">
          <div style={{ margin: '0 auto', padding: '12px', width: '100%' }} className="text-centerx">
            <label className="form-label">
              <input checked={avoidDups} onChange={this.dupCheckHandler} type="checkbox"/>
              <i className="form-icon"></i> Prevent duplicate images
            </label>
            <label className="form-label">
              <input id="post-to-fb-check" checked={postToFB} onChange={this.fbCheckHandler} type="checkbox"/>
              <i className="form-icon"></i> Post to my Facebook timeline
            </label>
            {fbPublish}
            {commentInput}
            <input ref={this.fileInput} type="file" accept="image/*" aria-label="Choose photo" hidden
              onChange={event => this.chooseFile(event.target.files)} disabled={uploading}/>
            <button className="btn btn-primary btn-lg" onClick={() => this.fileInput.current.click()}
              disabled={uploading}>Choose photo</button>
            {thumbPreview}
            <button id="upload-button" className={uploadClasses} onClick={this.startUpload}
              disabled={!file || uploading}>Upload</button>
            {this.state.error && <div role="alert" className="error">{errToString(this.state.error)}</div>}
            {progress}
            {filename}
          </div>
        </div>
        <h4 className="text-center" style={{ marginBottom: '0px', marginTop: '18px' }}>
          Faces uploaded by you already</h4>
        { thumbDisplay }
        <div className="" style={{ height: '100px' }}></div>
      </div>
      );
  }
  
}
