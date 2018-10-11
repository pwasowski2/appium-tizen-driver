import { fs } from 'appium-support';
import B from 'bluebird';
import path from 'path';
import jimp from 'jimp';

const swipeStepsPerSec = 28;

let commands = {}, extensions = {};

commands.flick = async function (element, xSpeed, ySpeed, xOffset, yOffset, speed) {
  if (element) {
    return await this.fakeFlickElement(element, xOffset, yOffset, speed);
  } else {
    return await this.fakeFlick(xSpeed, ySpeed);
  }
};

commands.fakeFlick = async function (xSpeed, ySpeed) {
  return await this.bootstrap.sendAction('element:flick', { xSpeed, ySpeed });
};

commands.fakeFlickElement = async function (elementId, xoffset, yoffset, speed) {
  let steps = 1250.0 / speed + 1;

  let xStart = 1;
  let yStart = 1;

  if (elementId === this.sessionId) {
    elementId = null;
  }
  if (elementId) {
    let location = await this.getLocationValueByElementId(elementId);
    xStart = location[0];
    yStart = location[1];
  }

  let xEnd = xStart + xoffset;
  let yEnd = yStart + yoffset;

  let params = [xStart, yStart, xEnd, yEnd, steps];

  return await this.doSwipe(params);
};

commands.swipe = async function (startX, startY, endX, endY, duration) {
  if (startX === 'null') {
    startX = 1;
  }
  if (startY === 'null') {
    startY = 1;
  }
  let swipeOpts = [
    startX, startY, endX, endY,
    Math.round(duration * swipeStepsPerSec)
  ];

  return await this.doSwipe(swipeOpts);
};

commands.doSwipe = async function (swipeOpts) {
  return await this.bootstrap.sendAction("swipe", swipeOpts);
};

commands.pullFile = async function (remotePath) {
  const rootDir = path.resolve(__dirname, '..', '..');
  const filePath = path.resolve(rootDir, 'file');
  let localFile = filePath + '/appiumfile.tmp';
  await this.sdb.pull(remotePath, localFile);
  let data = await fs.readFile(localFile);
  let b64data = new Buffer(data).toString('base64');
  if (await fs.exists(localFile)) {
    await fs.unlink(localFile);
  }
  return b64data;
};

async function takeScreenShot (sdb) {
  return await sdb.takeScreenShot();
}

async function getScreenshotData (sdb) {
  const rootDir = path.resolve(__dirname, '..', '..');
  const filePath = path.resolve(rootDir, 'file');
  let localFile = filePath + '/screenShot.tmp';
  if (await fs.exists(localFile)) {
    await fs.unlink(localFile);
  }
  try {
    const pngDir = '/tmp/';
    const png = path.posix.resolve(pngDir, 'dump_screen.png');
    await sdb.pull(png, localFile);
    return await jimp.read(localFile);
  } finally {
    if (await fs.exists(localFile)) {
      await fs.unlink(localFile);
    }
  }
}

commands.getScreenshot = async function () {
  let result = await takeScreenShot(this.sdb);

  if (result) {
    let image = await getScreenshotData(this.sdb);
    const getBuffer = B.promisify(image.getBuffer, { context: image });
    const imgBuffer = await getBuffer(jimp.MIME_PNG);
    return imgBuffer.toString('base64');
  } else {
    return null;
  }
};

Object.assign(extensions, commands);
export { commands };
export default extensions;