import {
  BehaviorSubject,
  Observable
} from 'rxjs';

import { 
  autoinject,
  LogManager
} from 'aurelia-framework';

import {
  Developer,
  DeveloperCategory,
  DeveloperState
} from './developer-models';

import { DeveloperService } from './developer-service';

@autoinject()
export class DeveloperStore {
  // Aurelia logging helper
  public logger = LogManager.getLogger("DeveloperStore");

  // Redux-DevTools? Hell yeah
  public devToolsAvailable: boolean = false;
  public devTools: any;

  // our initial state
  public initialState: DeveloperState = {
    developers: [],
    activeCategory: null
  };

  // model your overall state as a BehaviorSubject(BHS) to be able to get the recent value
  // make sure the BHS is not exposed, so that from outside nobody is able to change the state
  // you can also specify the initial state (e.g. from localStorage) by passing it in as an attribute
  private _state: BehaviorSubject<DeveloperState> = new BehaviorSubject(this.initialState);

  // this observable is the only access for outside consumers, thus creating a single point of truth
  // it will propagate all changes made to the BHS
  public readonly state: Observable<DeveloperState> = this._state.asObservable();

  // extract implementations into a simple service
  // this way you can leverage both a observable and traditional style
  constructor(private developerService: DeveloperService) {
    this.setupDevTools();
    this.loadAllDevs();
  }

  /* ACTIONS */
  public addDeveloper(category: DeveloperCategory, name: string, skills: string[]): Observable<Developer> {
    if (!category || !name || !skills) {
      // do not return void but an empty observable in order to not break any outside subscriptions
      return Observable.empty<Developer>();
    }

    // we subscribe to the Promise returned by the service method
    const addObs = Observable.fromPromise(this.developerService.addNewDeveloper(category, name, skills));

    // we do subscribe to changes so that we get notified about the resolved promise
    addObs.subscribe(
      res => {
        // once completed we'll update the current store by first getting the current state
        const state = this._state.getValue();

        // depending on whether the currently active category is all or the one matching the new dev we'll add the new dev as well
        if (state.activeCategory === category || state.activeCategory === "all") {
          state.developers.push({ ...res });
        }

        // promote changes to other subscribers
        this._state.next(state);

        // update devtools
        this.updateDevToolsState("add new developer", state);
      }
    );

    // you don't have to care about disposing the subscription since this is a finite sequence
    // and rxjs will handle the disposition by itself

    return addObs;
  }

  // These actions just act as a filter to determine which type of developers to display 
  public loadAllDevs() {
    this.updateDevState("all", Observable.fromPromise(this.developerService.loadAllDevelopers()));
  }

  public loadProDevs() {
    this.updateDevState("pro", Observable.fromPromise(this.developerService.loadProDevelopers()));
  }

  public loadJuniorDevs() {
    this.updateDevState("junior", Observable.fromPromise(this.developerService.loadJuniorDevelopers()));
  }

  private updateDevState(category: DeveloperCategory, obs: Observable<Developer[]>) {
    // we subscribe to the passed in observable, notice the type casting to guarantee we're passing in a proper one
    obs.subscribe(
      response => {
        // once loaded get the reference to the current state
        const state = this._state.getValue();

        // update it with our new information
        state.activeCategory = category;
        state.developers = response.map((dev) => { return { ...dev }; });

        // and notify subscribers about changes
        this._state.next(state);

        // update devtools
        this.updateDevToolsState(`load ${category} devs`, state);
      },
      err => console.log(`Error loading ${category} developers`)
    );
  }

  private setupDevTools() {
    // define global access to store
    (<any>window).RxSE = {
      store: this._state
    };

    // check whether the user has the Redux-DevTools browser extension installed
    if ((<any>window).devToolsExtension) {
      this.logger.info("DevTools are available");
      this.devToolsAvailable = true;

      // establish a connection with the DevTools
      this.devTools = (<any>window).__REDUX_DEVTOOLS_EXTENSION__.connect();

      // set the initial state
      this.devTools.init(this.initialState);

      // subscribe to changes, e.g navigation from within the DevTools
      this.devTools.subscribe((message: any) => {
        this.logger.debug(`DevTools sent change ${message.type}`);

        if (message.type === "DISPATCH") {
          let newState = message.state ? JSON.parse(message.state) : null;

          if (message.payload && message.payload.type === "IMPORT_STATE") {
            const currState: number = message.payload.nextLiftedState.currentStateIndex;
            newState = message.payload.nextLiftedState.computedStates[currState].state;
          }
          // the state is sent as string, so don't forget to parse it :)
          this._state.next(newState);
        }
      });
    }
  }

  private updateDevToolsState(action: string, state: DeveloperState) {
    // if the Redux-DevTools are available, sync the states
    if (this.devToolsAvailable) {
      this.devTools.send(action, state);
    }
  }
}
