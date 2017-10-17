import React from 'react';
import { Link } from 'react-router-dom';
import FileUpload from 'react-fileupload';
import request from 'browser-request';
import { Icon } from 'react-fa';

import FFActions from '../actions/FFActions.js';
import { API_BASE_URL, reportError, reportSuccess, errToString } from '../util/Util.js';
import { authStore } from '../stores/AuthStore.js';
import FBLogin from './FBLogin.jsx';
import Timeline from './Timeline.jsx';
import ImageStore from '../stores/ImageStore.js';

export default class Upload extends React.Component {

  constructor(props) {
    super(props);
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

  
  componentWillMount() {
    authStore.addChangeListener(this.authChanged);
    this.uploadStopped();
    this.setState({
      avoidDups: true,
      postToFB: false,
      havePublishPermission: false,
      uploading: false,
      dataUploaded: 0,
      dataSize: 0,
      file: null,
      fileUri: null
    });
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
      const file = files[0];
      if (file.type.match('image.*')) {
        const uploader = this;
        const reader = new FileReader();
        reader.onload = (img) => {
          if (img && img.target && img.target.result) {
            uploader.setState({fileUri: img.target.result, file: file});
          }
          return (e) => {
            uploader.setState({fileUri: e.target.result, file: file});
          }
        };
        reader.readAsDataURL(file);
      } else {
        this.setState({
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

  fixupImage(newImage) {
    if (newImage.base) {
      newImage.path = newImage.root + '/' + newImage.base;
    }
  }
  
  uploadSuccess(newImage) {
    this.uploadStopped(newImage);
    var images = (this.state && this.state.uploadedImages) || [];
    if (newImage && newImage.base) {
      this.fixupImage(newImage);
      images.push(newImage);
      this.setState({ uploadedImages: images });
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
      fileUri: null
    });
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
    const target = API_BASE_URL + "/api/v1/images";
    const { uploading, dataUploaded, dataSize, uploadedImages,
            avoidDups, postToFB, havePublishPermission, file, fileUri } = this.state;
    const options = {
      baseUrl: target,
      fileFieldName: 'imagefile',
      chooseAndUpload: false,
      requestHeaders: {
        'X-FF-Auth': this.state.accessToken
      },
      paramAddToField: {
        avoidDups: avoidDups
      },
      chooseFile: this.chooseFile,
      beforeUpload: this.beforeUpload,
      uploadSuccess: this.uploadSuccess,
      uploadError: this.uploadError,
      uploadFail: this.uploadError,
      uploading: this.uploading,
      doUpload: this.doUpload
    };

    var progress = '';
    var filename = '';
    if (uploading) {
      progress = (<progress className="block-center" value={dataUploaded} max={dataSize}></progress>);
      filename = (<span className="footnote block-center text-center">{file && file.name || ''}</span>);
    } else if (this.state.error) {
      const err = this.state.error;
      const msg = errToString(err);
      setTimeout(function() {
        this.setState({error: null});
      }.bind(this), 3000);
      return (<div className="error">{msg}</div>);
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
          <FileUpload style={{ margin: '0 auto', padding: '12px', width: '100%' }} className="text-centerx" options={options}>
            <label className="form-label">
              <input checked={avoidDups ? 'checked' : ''} onChange={this.dupCheckHandler} type="checkbox"/>
              <i className="form-icon"></i> Prevent duplicate images
            </label>
            <label className="form-label">
              <input id="post-to-fb-check" checked={postToFB ? 'checked' : ''} onChange={this.fbCheckHandler} type="checkbox"/>
              <i className="form-icon"></i> Post to my Facebook timeline
            </label>
            {fbPublish}
            {commentInput}
            <button className="btn btn-primary btn-lg" ref="chooseBtn">Choose photo</button>
            {thumbPreview}
            <button id="upload-button" className={uploadClasses} ref="uploadBtn">Upload</button>
            {progress}
            {filename}
          </FileUpload>
        </div>
        <h4 className="text-center" style={{ marginBottom: '0px', marginTop: '18px' }}>
          Faces uploaded by you already</h4>
        { thumbDisplay }
        <div className="" style={{ height: '100px' }}></div>
      </div>
      );
  }
  
}
