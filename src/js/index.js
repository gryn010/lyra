/* eslint no-unused-expressions: 0 */
'use strict';

require('../scss/app.scss');

var throttle = require('lodash.throttle');

// Additional requires to polyfill + browserify package.
require('array.prototype.find');
require('string.prototype.startswith');
require('./transforms');

// Initialize the Redux store
var store = require('./store');
var reparse = require('./actions/vegaInvalidate');

// Initialize the Model.
var model = require('./model');
model.init();

// Set up the listeners that connect the model to the store
var listeners = require('./store/listeners');

// Bind the listener that will flow changes from the redux store into Vega
store.subscribe(listeners.createStoreListener(store, model));

// Bind a throttled model update onto the store so that we can be sure any
// of those changes will be reflected in Vega, without incurring the rendering
// overhead that we would be hit with were we to react to every single store
// dispatch cycle (as many of those cycles will be intermediate states).
// (16 is derived from 1000ms / 60fps)
store.subscribe(throttle(model.update, 16));

// Initialize components
var ui = require('./components');

var g = model.Scene.child('marks.group'),
    g2 = model.Scene.child('marks.group'),
    p = model.pipeline('cars'),
    p2 = model.pipeline('jobs'),
    p3 = model.pipeline('gapminder');

// Pre-populate state with one rect, one symbol, one text & one line mark
g2.child('marks.line');
g2.child('marks.symbol');
g2.child('marks.group');
// g2.child('marks.line');
// g2.child('marks.text');
// g.child('marks.area');

Promise.all([
  p._source.init({url: '/data/cars.json'}),
  p2._source.init({url: '/data/jobs.json'}),
  p3._source.init({url: '/data/gapminder.json'})
]).then(function() {
  ui.forceUpdate(function() {
    // Parse the model to initialize and render the Vega view
    store.dispatch(reparse(true));
  });
});

// Expose model, store and Sidebars globally (via `window`) for debugging
global.model = model;
global.store = store;
