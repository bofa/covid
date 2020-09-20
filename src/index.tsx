import * as React from 'react';
import { render } from 'react-dom';
import {
  HashRouter as Router,
} from 'react-router-dom';

import 'normalize.css';
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css';
import '@blueprintjs/select/lib/css/blueprint-select.css';

import './App.css';
import Routes from './Routes';

export function App () {

  return (
    <Router>
      <Routes/>
    </Router>
  );  
}

render(<App />, document.getElementById('root'));
