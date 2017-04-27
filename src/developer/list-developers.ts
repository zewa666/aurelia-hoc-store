import { 
  autoinject,
  bindable
} from 'aurelia-framework';

import { DeveloperState } from './data/developer-models';
import { DeveloperStore } from './data/developer-store';

/*
 * a classic dumb component, all if its actions are directly called from within the store
 * inside the template
 */
@autoinject()
export class ListDevelopers {
  // the store gets passed in via element attributes
  @bindable() public state: DeveloperState;

  // we can still reference the store via DI
  constructor(private store: DeveloperStore) {}
}
