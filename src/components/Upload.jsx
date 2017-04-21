import React from 'react';
import { Link } from 'react-router';
import request from 'browser-request';
import FileUpload from 'react-fileupload';
import FFActions from '../actions/FFActions.js';
import { API_BASE_URL, reportError, errToString } from '../util/Util.js';
import { authStore } from '../stores/AuthStore.js';

export default class Upload extends React.Component {

  constructor(props) {
    super(props);
    this.uploadSuccess = this.uploadSuccess.bind(this);
    this.uploadError = this.uploadError.bind(this);
    this.uploading = this.uploading.bind(this);
    this.doUpload = this.doUpload.bind(this);
    this.uploadStopped = this.uploadStopped.bind(this);
  }

  componentWillMount() {
    this.uploadStopped();
  }

  uploadStopped() {
    this.setState({
      uploading: false
    });
  }
  doUpload(files, mill, xhrID) {
    this.setState({
      uploading: true
    });
  }
  uploadSuccess(response) {
    this.uploadStopped();
    console.log('uploadSuccess', response);
    FFActions.imageAdded(response);
    FFActions.imageChanged(response);
  }
  
  uploadError(err) {
    this.uploadStopped();
    console.error('Upload.uploadError', err);
    reportError(err);
    this.setState({
      error: err
    });
  }

  uploading(progress) {
    console.log('uploading progress', progress);
  }
  
  render() {
    const target = API_BASE_URL + "/api/v1/images";

    const options = {
      baseUrl: target,
      fileFieldName: 'imagefile',
      chooseAndUpload: true,
      requestHeaders: {
        'X-FF-Auth': authStore.getAccessToken()
      },
      uploadSuccess: this.uploadSuccess,
      uploadError: this.uploadError,
      uploadFail: this.uploadError,
      uploading: this.uploading,
      doUpload: this.doUpload
    };

    if (this.state.uploading) {
      return (<div className="loading">Uploading</div>);
    } else if (this.state.error) {
      const err = this.state.error;
      const msg = errToString(err);
      setTimeout(function() {
        this.setState({error: null});
      }.bind(this), 3000);
      return (<div className="error">{msg}</div>);
    }
    return (
      <FileUpload options={options}>
        <button className="ff-button" ref="chooseAndUpload">Choose photos</button>
      </FileUpload>
      );
  }
  
}
