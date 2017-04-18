import React from 'react';
import { Link } from 'react-router';
import request from 'browser-request';
//import Dispatcher from '../dispatcher/AppDispatcher.js';
//import { FB_INITIALIZED } from '../constants/FFConstants.js';
import { API_BASE_URL } from '../util/Util.js';

export default class Upload extends React.Component {

  constructor(props) {
    super(props);
    this.doUpload = this.doUpload.bind(this);
  }

  doUpload(evt) {
    console.log('doUpload');
  }
  render() {
    console.log('Upload.render', this.state);
    const target = API_BASE_URL + "/api/v1/images";
    return (
      <form action={target}
        encType="multipart/form-data" method="post">
        <p>
          Type some text (if you like):<br/>
          <input type="text" name="textline" size="30"/>
        </p>
        <p>
          Please specify a file, or a set of files:<br/>
          <input type="file" name="imagefile" size="40"/>
        </p>
        <div>
          <button onClick={this.doUpload}>Upload</button>
        </div>
      </form>    
    );      
  }
  
}
