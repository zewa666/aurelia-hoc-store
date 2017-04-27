import { autoinject } from 'aurelia-framework';

import { DeveloperState } from './data/developer-models';
import { DeveloperStore } from './data/developer-store';

@autoinject()
export class DeveloperOverview {
  // reference to the single state
  // this will be shared with all subcomponents
  public state: DeveloperState;

  // inject the store, alternatively you can still inject the service and do it the old-school way
  constructor(private store: DeveloperStore) {}

  attached() {
    // this is the single point of data subscription, the state inside the component will be automatically updated
    // no need to take care of manually handling that. This will also update all subcomponents
    this.store.state.subscribe(
      state => this.state = state
    );
  }
}
