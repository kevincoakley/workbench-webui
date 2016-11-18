/* global protractor:false expect:false inject:false module:false element:false browser:false by:false */

'use strict';


var helpers = require('../helpers.e2e.js');
var shared = require('./shared.page.js');

var DashboardPage = require('./dashboard.page.js');

var PAGE_TITLE = /Console: .*/;
var PAGE_ROUTE = /https\:\/\/.*\/\#\/home\/.*\/console/;

var EC = protractor.ExpectedConditions;

var ConsolePage = function() {
  this.console = element(by.id('console'));
};

// Navigate to the Console view
// TODO: How to handle parameters here?
ConsolePage.prototype.get = function(applicationId, serviceId, loggedIn) {
  var dashboardPage = new DashboardPage();
  var self = this;
  
  console.log("applicationId: " + applicationId);
  console.log("serviceId: " + serviceId);
  console.log("loggedIn: " + loggedIn);
  
  dashboardPage.get(loggedIn);
  
  return helpers.selectByModel(dashboardPage.applications, "stack.id", function(id) {
    return id === applicationId;
  }, function(application) {
    helpers.scrollIntoView(application);
    return dashboardPage.consoleBtn(application).isDisplayed().then(function(isDisplayed) {
      if (!isDisplayed) {
        application.click();
      }
      
      return helpers.selectByModel(dashboardPage.services(application), "svc.id", function(id) {
        return id === serviceId;
      }, function(svcMatch) {
        var consoleBtn = dashboardPage.consoleBtn(svcMatch);
        browser.wait(EC.elementToBeClickable(consoleBtn), 5000);
        // Click the "Edit" button next to the first service
        consoleBtn.click();
        helpers.expectNewTabOpen(PAGE_ROUTE, true);
        self.verify();
        
        return svcMatch;
      });
    });
  });
};

// FIXME: Feature envy
ConsolePage.prototype.getConsole = function(application, serviceId) {
  var dashboardPage = new DashboardPage();
  var self = this;
  
  return helpers.selectByModel(dashboardPage.services(application), "svc.id", function(id) {
    return id === serviceId;
  }, function(svcMatch) {
    var consoleBtn = dashboardPage.consoleBtn(svcMatch);
    browser.wait(EC.elementToBeClickable(consoleBtn), 5000);
    // Click the "Edit" button next to the first service
    consoleBtn.click();
    helpers.expectNewTabOpen(PAGE_ROUTE, true);
    self.verify();
    
    return svcMatch;
  });
};

// Ensure that we are on the correct page
ConsolePage.prototype.verify = function() { 
  expect(browser.getCurrentUrl()).toMatch(PAGE_ROUTE);
  expect(browser.getTitle()).toMatch(PAGE_TITLE);
};

/**
 * Insert public functions here for user interactions
 */

module.exports = ConsolePage;