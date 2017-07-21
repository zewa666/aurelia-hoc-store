exports.config = {
  directConnect: true,

  // Capabilities to be passed to the webdriver instance.
  capabilities: {
    'browserName': 'chrome'
  },
  
  specs: ['test/e2e/**/*.ts'],

  plugins: [{
    package: 'aurelia-protractor-plugin'
  }],

  onPrepare: function() {
    require('ts-node')
      .register({
        compilerOptions: { module: 'commonjs' },
        disableWarnings: true,
        fast: true
      });
  },

  // Options to be passed to Jasmine-node.
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000
  }
};