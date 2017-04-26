import { autoinject } from 'aurelia-framework';
import {
  DeveloperStore,
  DeveloperState,
  DeveloperCategory
} from './services/developer';

@autoinject()
export class App {

  // this does not belong into the state as its solely related to this component
  // and represents its internal UI logic
  public newDevCategory: DeveloperCategory = "junior";
  public newDevName: string = "";
  public newDevSkills: string = "";

  // another ui logic handler to show disable the add button while inserting a new developer
  public addingDeveloperInProgress: boolean = false;
  

  // reference to the single state
  public state: DeveloperState;

  // inject the store, alternatively you can still inject the service and do it the old-school way
  constructor(private store: DeveloperStore) {}

  attached() {
    // this is the single point of data subscription, the state inside the component will be automatically updated
    // no need to take care of manually handling that
    this.store.state.subscribe(
      state => this.state = state
    );
  }

  addDeveloper() {
    // set the indicator to active in order to disable the add button
    this.addingDeveloperInProgress = true;

    // data from the store should be updated only using store actions
    // once the add process is done, reactivate the add button
    // notice that we don't use the next handler but the completed handler
    // since this is a finite sequence
    this.store.addDeveloper(
      this.newDevCategory,
      this.newDevName,
      this.newDevSkills
        .split(',')
        .map((s) => s.trim())
    ).subscribe(null, null, () => this.addingDeveloperInProgress = false);

    // no need to subscribe to the observable since the state subscription
    // will be automatically updated once the new developer is added
  }
}
