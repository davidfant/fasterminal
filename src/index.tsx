import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import 'rsuite/dist/styles/rsuite-default.css';
// import 'rsuite/lib/styles/index.less';
import './custom.less';
import App from './App';
import {ShellProvider} from './client/shellContext';

ReactDOM.render(
  <ShellProvider>
    <App />
  </ShellProvider>,
  document.getElementById('root')
);

