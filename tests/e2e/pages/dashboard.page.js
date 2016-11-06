/* global angular:false expect:false inject:false module:false element:false browser:false by:false */

"use strict"

module.exports = {}

var shared = require('./shared.page.js');
var landing = require('./landing.page.js');
var login = require('./login.page.js');

var TEST_USERNAME = shared.config.TEST_USERNAME;
var TEST_PASSWORD = shared.config.TEST_PASSWORD;

var PAGE_TITLE = 'Labs Workbench Dashboard';
var PAGE_ROUTE = shared.config.TEST_HOSTNAME + '/home';

var LINK_CATALOG_ID = 'catalogLink';

var catalogLink = function() {  return element(by.id(LINK_CATALOG_ID)); };

// Ensure we are on the dashboard page
module.exports.verify = function() {
  expect(browser.getCurrentUrl()).toBe(PAGE_ROUTE);
  expect(browser.getTitle()).toEqual(PAGE_TITLE);
};

// Navigate to the dashboard view
module.exports.get = function(loggedIn) {
  if (loggedIn) {
    landing.get();
    shared.navbar.clickApplicationsNav();
  } else {
    login.get();
    login.enterUsername(TEST_USERNAME);
    login.enterPassword(TEST_PASSWORD);
    login.clickLogin();
  }
  
  module.exports.verify();
};

module.exports.clickCatalogLink = function() {
  catalogLink().click();
};