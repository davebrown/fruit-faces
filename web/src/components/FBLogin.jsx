import React from 'react';
import Icon from './Icon.jsx';
import { authStore, fbLoginCallback } from '../stores/AuthStore.js';

export default class FBLogin extends React.Component {
  state = { ready: false };

  componentDidMount() {
    authStore.addChangeListener(this.authChanged);
    this.authChanged();
  }

  componentWillUnmount() {
    authStore.removeChangeListener(this.authChanged);
  }

  authChanged = () => {
    this.setState({ ready: Boolean(window.FB?.login) });
  };

  login = event => {
    event.preventDefault();
    if (!window.FB?.login) return;
    window.FB.login(response => {
      if (!response.authResponse?.accessToken) return;
      window.FB.api('/me', { fields: 'name,email,picture' }, profile => {
        fbLoginCallback({ ...response.authResponse, ...(profile.error ? {} : profile) });
      });
    }, {
      scope: this.props.scope || 'email,public_profile',
      return_scopes: true
    });
  };

  render() {
    const { renderLink, authText } = this.props;
    const label = authText || (renderLink ? ' Login' : ' Login with Facebook');
    return renderLink ?
      <a href="#" className="bm-menu menu-item" onClick={this.login} aria-disabled={!this.state.ready}>
        <Icon name="facebook-square"/>{label}
      </a> :
      <button type="button" className="btn btn-sm" onClick={this.login} disabled={!this.state.ready}>
        <Icon name="facebook-square"/>{label}
      </button>;
  }
}
