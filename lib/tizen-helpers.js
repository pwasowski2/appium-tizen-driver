/*
 * Copyright (c) 2018-2021 Samsung Electronics Co., Ltd All Rights Reserved
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */
import _ from 'lodash';
import logger from './logger';
import SDB from 'appium-sdb';
import { mkdtemp, readFile, rm, rmdir } from 'fs/promises';
import { errors } from 'appium-base-driver';
import { Parser } from 'xml2js';

let helpers = {};

helpers.getDeviceInfoFromCaps = async function (opts = {}) {
  let sdb = await SDB.createSDB({
    sdbPort: opts.sdbPort
  });
  let udid;
  if (opts.udid) {
    udid = opts.udid;
  } else {
    udid = opts.deviceName;
  }

  let emPort = null;
  let status = false;

  if (udid.includes('192.168.250.250') || udid.includes('192.168.1.11')) {
    let result = await sdb.ConnectDevice(udid);
    if (result) {
      udid = udid + ':26101';
    }
  }

  logger.info('Retrieving device list');

  let devices = await sdb.getDevicesWithRetry();
  if (devices.length > 1) {
    for (let i = 0; i < devices.length; i++) {
      if (udid === devices[i].udid) {
        status = true;
      }
    }
  }
  if (!status) {
    udid = devices[0].udid;
  }
  emPort = sdb.getPortFromEmulatorString(udid);

  logger.info(`Using device: ${udid}`);
  return { udid, emPort };
};

helpers.getScreenResolution = async function (sdbPort) {
  try {
    const sdb = await SDB.createSDB({sdbPort});
    const tmpDirPath = await mkdtemp('appium_data');
    const pulledModelConfigPath = `${tmpDirPath}/model-config.xml`;
    await sdb.pull('/etc/config/model-config.xml', pulledModelConfigPath);
    const modelConfigStr = await readFile(pulledModelConfigPath, {encoding: 'UTF-8'});

    await rm(pulledModelConfigPath);
    await rmdir(tmpDirPath);

    const xmlParser = new Parser();
    const modelConfigXml = await xmlParser.parseStringPromise(modelConfigStr);
    const keys = modelConfigXml['model-config'].platform[0].key;
    const width = _.find(keys, (key) => key.$.name === 'tizen.org/feature/screen.width')._;
    const height = _.find(keys, (key) => key.$.name === 'tizen.org/feature/screen.height')._;

    return {x: parseInt(width, 10), y: parseInt(height, 10)};
  } catch (error) {
    logger.error(`An error occurred while getting screen resolution: ${error.name} (${error.message})`);
    throw new errors.SessionNotCreatedError(`Could not get device screen resolution.
    Please specify the resolution in the "opts" object passed to the TizenDriver's constructor, e.g.:
    opts.screenResolution = {x: 1920, y: 1080}`);
  }
};

helpers.createSDB = async function (udid, emPort, sdbPort, suppressKillServer) {
  let sdb = await SDB.createSDB({sdbPort, suppressKillServer});

  sdb.setDeviceId(udid);
  if (emPort) {
    sdb.setEmulatorPort(emPort);
  }

  return sdb;
};

helpers.truncateDecimals = function (number, digits) {
  let multiplier = Math.pow(10, digits);
  let adjustedNum = number * multiplier;
  let truncatedNum = Math[adjustedNum < 0 ? 'ceil' : 'floor'](adjustedNum);

  return truncatedNum / multiplier;
};

helpers.removeNullProperties = function (obj) {
  for (let key of _.keys(obj)) {
    if (_.isNull(obj[key]) || _.isUndefined(obj[key])) {
      delete obj[key];
    }
  }
};

export { helpers };
export default helpers;
