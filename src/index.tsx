import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import 'rsuite/dist/styles/rsuite-default.css';
// import 'rsuite/lib/styles/index.less';
import './custom.less';
import App from './App';

ReactDOM.render(
  // <React.StrictMode>
    <App />
  //</React.StrictMode>
  ,
  document.getElementById('root')
);

