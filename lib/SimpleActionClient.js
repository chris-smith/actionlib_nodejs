/*
 *    Copyright 2017 Rethink Robotics
 *
 *    Copyright 2017 Chris Smith
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

'use strict';

const ActionConfig = require('./ActionConfig.js');

const EventEmitter = require('events');

const ActionClient = require('./ActionClient.js');

class SimpleActionClient extends EventEmitter {
  constructor(options) {
    this._ac = new ActionClient(options);
    this._simpleState = SimpleGoalState.PENDING;

    this._goalHandle = null;
  }

  shutdown() {
    return this._ac.shutdown();
  }

  async waitForServer(timeout) {
    return this._ac.waitForActionServerToStart(timeout);
  }

  isServerConnected() {
    return this._ac.isServerConnected();
  }

  sendGoal(goal, doneCb, activeCb, feedbackCb) {
    if (this._goalHandle) {
      this._goalHandle.reset();
    }
  }

  sendGoalAndWait(goal, execTimeoutMs, preemptTimeoutMs) {

  }

  waitForResult(timeoutMs) {

  }

  getResult() {

  }

  getState() {
    return this._simpleState;
  }

  cancelAllGoals() {

  }

  cancelGoalsAtAndBeforeTime() {

  }

  cancelGoal() {

  }

  stopTrackingGoal() {

  }
}

class SimpleGoalState = {
  PENDING: 'PENDING'
};

module.exports = SimpleActionClient;
