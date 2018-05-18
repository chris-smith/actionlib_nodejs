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

const ClientGoalHandle = require('./ClientGoalHandle.js');

let GOAL_COUNT = 0;

/**
 * @class ActionClient
 * EXPERIMENTAL
 *
 */
class ActionClient extends EventEmitter {
  constructor(options) {
    this._acInterface = new ActionClientInterface(options);

    this._acInterface.on('status', this._handleStatus.bind(this));
    this._acInterface.on('feedback', this._handleFeedback.bind(this));
    this._acInterface.on('result', this._handleResult.bind(this));

    const actionType = this._acInterface.getType();
    this._messageTypes = this._messageTypes = ActionConfig.getMessagesForAction(actionType);

    this._goalLookup = {};
  }

  shutdown() {
    return this._acInterface.shutdown();
  }

  sendGoal(goal, transitionCb = null, feedbackCb = null) {
    const actionGoal = new this._messageTypes.actionGoal();

    const now = timeUtils.now();
    actionGoal.header.stamp = now;
    actionGoal.goalId.stamp = now;
    const goalIdStr = `${getNodeName()}-${GOAL_COUNT++}-${now.secs}.${now.nsecs}`;
    actionGoal.goalId.id = goalIdStr;
    actionGoal.goal = goal;

    this._acInterface.sendGoal(actionGoal);

    const handle = new ClientGoalHandle(actionGoal, this._acInterface);

    if (transitionCb && typeof transitionCb === 'function') {
      handle.on('transition', transitionCb);
    }
    if (feedbackCb && typeof feedbackCb === 'function') {
      handle.on('feedback', feedbackCb);
    }

    this._goalLookup[goalIdStr] = handle;

    return handle;
  }

  cancelAllGoals() {
    this._acInterface.cancelAllGoals();
  }

  cancelGoalsAtAndBeforeTime(time) {
    this._acInterface.cancelGoalsAtAndBeforeTime(time);
  }

  async waitForActionServerToStart(timeout) {
    return this._acInterface.waitForActionServerToStart(timeout);
  }

  isServerConnected() {
    return this._acInterface.isServerConnected();
  }

  _handleStatus(msg) {
    const list = msg.status_list;
    const len = list.length;

    const statusMap = {};

    for (let i = 0; i < len; ++i) {
      const entry = list[i];
      const goalId = entry.goal_id.id;

      statusMap[goalId] = entry;
    }

    for (let goalId in this._goalLookup) {
      const goalHandle = this._goalLookup[goalId];
      goalHandle.updateStatus(statusMap[goalId]);
    }
  }

  _handleFeedback(msg) {
    const goalId = msg.status.goal_id.id;
    const goalHandle = this._goalLookup[goalId];
    if (goalHandle) {
      goalHandle.updateFeedback(msg);
    }
  }

  _handleResult(msg) {
    const goalId = msg.status.goal_id.id;
    const goalHandle = this._goalLookup[goalId];
    if (goalHandle) {
      delete this._goalLookup[goalId];
      goalHandle.updateResult(msg);
    }
  }
}

module.exports = ActionClient;

//------------------------------------------------------------------------
//   Hook into configuration
//------------------------------------------------------------------------

let GoalStatusMsg, GoalStatuses, GoalIdMsg, GoalStatusArrayMsg;
let timeUtils, log, ActionClientInterface, getNodeName;

ActionConfig.on('configured', function(config) {
  timeUtils = config.time;
  log = config.log;
  getNodeName = config.getNodeName;

  GoalStatusMsg = config.messages.getMessage('actionlib_msgs/GoalStatus');
  GoalStatuses = config.messages.getMessageConstants('actionlib_msgs/GoalStatus');
  GoalIdMsg = config.messages.getMessage('actionlib_msgs/GoalId');
  GoalStatusArrayMsg = config.messages.getMessage('actionlib_msgs/GoalStatusArray');

  ActionClientInterface = config.ActionClientInterface;
});
