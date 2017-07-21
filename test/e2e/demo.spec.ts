import {browser, element, by, ExpectedConditions, ElementFinder} from 'aurelia-protractor-plugin/protractor';
import * as prettyjson from 'prettyjson';

const reduxDevToolsTemplate = {
    "actionsById": {},
    "computedStates": [],
    "currentStateIndex": -1,
    "nextActionId": 0,
    "skippedActionIds": [],
    "stagedActionIds": []
}

function log(stuff) {
  console.log(prettyjson.render(stuff));

  var fs = require('fs');
  fs.writeFileSync('./test/e2e-run-output.json', JSON.stringify(stuff, null, 2));
}

function textContentToHaveChanged(elementFinder: ElementFinder, oldText: string): Function {  
  const wrapped = () => {
    return elementFinder.getText().then((actualText: string): boolean => {
      return actualText !== oldText;
    }, () => false);
  }

  return ExpectedConditions.and(wrapped);
}

describe('demo', () => {
  let states = Object.assign({}, reduxDevToolsTemplate);

  function getCurrentState(): any {
    return (<any>window).RxSE.store.getValue();
  }

  async function getStoreSnapshot(name) {
    const state = await browser.executeScript(getCurrentState);

    states.currentStateIndex++;
    states.nextActionId++;

    states.actionsById[states.currentStateIndex] = {
      "action": {
        "type": "@@INIT"
      },
      "timestamp": + new Date(),
      "type": "PERFORM_ACTION"
    };

    states.computedStates.push({state});
    states.stagedActionIds.push(states.currentStateIndex);
    
  }

  beforeEach(async () => {
    states = Object.assign({}, reduxDevToolsTemplate);

    await browser.loadAndWaitForAureliaPage("http://localhost:9000");
    await browser.wait(
      ExpectedConditions.presenceOf(element(by.css("h1"))), 2000
    );
  });

  it('should run a test scenario and create collect all the states', async () => {
    // Validate that we're on the right page
    await expect(element(by.tagName("H1")).getText()).toBe("RxJS BehaviorSubject Store Demo");

    // Check the intial state
    await getStoreSnapshot("Initial state");

    // Wait for the outstanding call to update the state and fetch it
    browser.sleep(500);
    await getStoreSnapshot("Start data loaded");


    const oldText = await element(by.css("ul")).getText();
    await element(by.buttonText("Load junior devs")).click();

    await browser.wait(textContentToHaveChanged(element(by.css("ul")), oldText), 2000);
    
    await getStoreSnapshot("Switched to juniors");

    log(states);
  });
});
