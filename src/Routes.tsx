import * as React from 'react';
import {
//   Switch,
//   Route,
} from 'react-router-dom';
// import { Main } from './Main';
// import GuardedRoute from './GuardedRoute';

import 'normalize.css';
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css';
import '@blueprintjs/select/lib/css/blueprint-select.css';
import '@blueprintjs/table/lib/css/table.css';
// import { AuthenticationProvider, oidcLog } from '@axa-fr/react-oidc-context';

import './App.css';
import { Main } from './Main';

interface RoutesProps { }

export default function Routes (props: RoutesProps) {
  // const [auth, setAuth] = React.useState(false);
  // const [auth] = React.useState(false);
  // const history = useHistory();
  // const auth = useAuth();

  return (
    <Main />
  );  
}
