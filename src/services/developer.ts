import {
  BehaviorSubject,
  Observable
} from 'rxjs';
import { autoinject } from 'aurelia-framework';

export interface Developer {
  name: string;
  skills: string[];
}

export type DeveloperCategory = "junior" | "pro" | "all";

const fakeBackend = {
  proDevs: [
    { name: "Awesome Dev", skills: ["JavaScript", "C#", "Fullstack"] },
    { name: "Pro Dev", skills: ["C++", "C#", "Backend"] },
    { name: "Old-School Champion Dev", skills: ["C++", "C", "Assembly"] },
  ],
  juniorDevs: [
    { name: "Beginner Dev", skills: ["JavaScript", "HTML", "CSS"] },
    { name: "So-called Dev", skills: ["If", "Else", "For"] },
    { name: "Kinda Dev", skills: ["CSS", "HTML"] },
  ]
}

export class DeveloperService {
  public loadAllDevelopers(): Promise<Developer[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...fakeBackend.proDevs, ...fakeBackend.juniorDevs]);
      }, 200);
    });
  }

  public loadProDevelopers(): Promise<Developer[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(fakeBackend.proDevs);
      }, 200);
    });
  }

  public loadJuniorDevelopers(): Promise<Developer[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(fakeBackend.juniorDevs);
      }, 200);
    });
  }

  public addNewDeveloper(category: DeveloperCategory, name: string, skills: string[]): Promise<Developer> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newDev = { name, skills };

        fakeBackend[`${category}Devs`].push(newDev);
        resolve(newDev);
      }, 2000);
    });
  }
}

// this is our overall state for the developer feature, everything that is necessary can be stored here
// keep UI relevant features inside the components though
export interface DeveloperState {
  developers: Developer[];
  activeCategory: DeveloperCategory 
}

@autoinject()
export class DeveloperStore {
  // model your overall state as a BehaviorSubject(BHS) to be able to get the recent value
  // make sure the BHS is not exposed, so that from outside nobody is able to change the state
  // you can also specify the initial state (e.g. from localStorage) by passing it in as an attribute
  private _state: BehaviorSubject<DeveloperState> = new BehaviorSubject({
    developers: [],
    activeCategory: null
  });

  // this observable is the only access for outside consumers, thus creating a single point of truth
  // it will propagate all changes made to the BHS
  public readonly state: Observable<DeveloperState> = this._state.asObservable();

  // extract implementations into a simple service
  // this way you can leverage both a observable and traditional style
  constructor(private developerService: DeveloperService) {
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
      },
      err => console.log(`Error loading ${category} developers`)
    );
  }
}
