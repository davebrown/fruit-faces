import React from 'react';
import Modal from 'react-modal';
import Upload from './Upload.jsx';

export default class ModalTest extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    const styles = {
      overlay: {
        backgroundColor   : 'rgba(25, 25, 25, 0.75)'
      }/*,
      
      content: {
        top                   : '50%',
        left                  : '50%',
        right                 : 'auto',
        bottom                : 'auto',
        marginRight           : '-50%',
        transform             : 'translate(-50%, -50%)'
      }  */    
    };
    return (
      <Modal isOpen={true} contentLabel="upload images" style={styles}>
        <p>header text</p>
        <Upload/>
        <p>footer text</p>
      </Modal>
      );
  }
}
