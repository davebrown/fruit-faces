import React from 'react';
import { Link } from 'react-router-dom';
import FileUpload from 'react-fileupload';
import request from 'browser-request';

import FFActions from '../actions/FFActions.js';
import { API_BASE_URL, reportError, reportSuccess, errToString } from '../util/Util.js';
import { authStore } from '../stores/AuthStore.js';
import FBLogin from './FBLogin.jsx';
import ThumbTable from './ThumbTable.jsx';
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
  }

  
  componentWillMount() {
    authStore.addChangeListener(this.authChanged);
    this.uploadStopped();
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
    //console.log('Upload.authChanged()->' + authStore.getUserID());
    this.setState({
      accessToken: authStore.getAccessToken()
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
  
  uploadStopped(newImage) {
    this.setState({
      uploading: false,
    });
  }
  
  doUpload(files, mill, xhrID) {
    console.log('doUpload: files: ', files, 'mill', mill, 'xhrID', xhrID);
    console.log('files.length', files.length);
    for (var i = 0; i < files.length; i++) {
      console.log('files[' + i + ']:', files[i]);
    }
    this.setState({
      uploading: true,
      dataUploaded: 0,
      dataSize: 100 * 1000,
      fileName: (files.length > 0 && files[0].name) || ''
    });
  }

  fixupImage(newImage) {
    if (newImage.base) {
      newImage.path = newImage.root + '/' + newImage.base;
    }
  }
    
  uploadSuccess(newImage) {
    this.uploadStopped(newImage);
    console.log('uploadSuccess', newImage);    
    var images = (this.state && this.state.uploadedImages) || [];
    if (newImage && newImage.base) {
      this.fixupImage(newImage);
      images.push(newImage);
      this.setState({ uploadedImages: images });
    }
    FFActions.imageAdded(newImage);
    FFActions.imageChanged(newImage);
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
    console.log('uploading progress', progress);
    this.setState({
      uploading: true,
      dataUploaded: progress.loaded,
      dataSize: progress.total
    });
  }
  
  render() {
    //console.log('Upload.render: state', this.state);
    if (!authStore.getUserID()) {
      return (<div className="center-single-child"><span>Please <FBLogin/> to upload images.</span></div>);
    }
    const target = API_BASE_URL + "/api/v1/images";

    const options = {
      baseUrl: target,
      fileFieldName: 'imagefile',
      chooseAndUpload: true,
      requestHeaders: {
        'X-FF-Auth': this.state.accessToken
      },
      uploadSuccess: this.uploadSuccess,
      uploadError: this.uploadError,
      uploadFail: this.uploadError,
      uploading: this.uploading,
      doUpload: this.doUpload
    };

    const { uploading, dataUploaded, dataSize, fileName, uploadedImages } = this.state;
    var progress = '';
    var filename = '';
    if (uploading) {
      //return (<div className="loading">Uploading</div>);
      progress = (<progress className="progress" value={dataUploaded} max={dataSize}></progress>);
      filename = (<span className="footnote">{fileName}</span>);
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
      thumbDisplay = (<ThumbTable images={uploadedImages} showLabel="true"/>);
    }
    return (
      <div className="">
        <div className="flex-column">
          <FileUpload style={{ margin: '0 auto', padding: '12px' }} className="text-center" options={options}>
            <button className="btn btn-primary btn-lg" ref="chooseAndUpload">Choose photos to upload</button>
          </FileUpload>
          {progress}
          {filename}
          <h4 className="text-center" style={{ marginBottom: '0px', marginTop: '8px' }}>Your images</h4>
          { thumbDisplay }
          <div className="" style={{ height: '100px' }}></div>
        </div>
      </div>
      );
  }
  
}
