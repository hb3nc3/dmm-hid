import { app, BrowserWindow } from "electron";
import * as path from "path";
import { devices, HID } from "node-hid";

// based on: http://sigrok.org/wiki/Victor_protocol

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    width: 800,
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "../index.html"));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
}

function getBit(payload: Buffer, byte: number, bit: number): boolean {
  return !!(payload[byte] & (1 << bit));
}
function getMode(payload: Buffer) {
  let isVoltage = getBit(payload, 3, 0);
  let isCurrent = getBit(payload, 3, 1);
  let isResistance = getBit(payload, 3, 2);
  let isFrequency = getBit(payload, 3, 4);
  let isCapacitance = getBit(payload, 3, 5);
  let isTempC = getBit(payload, 3, 6);
  let isTempF = getBit(payload, 3, 7);
  let isContinuity = getBit(payload, 4, 4); // combination with resistance
  let isDiode = getBit(payload, 4, 5); // combination with resistance
  let isDutyCycle = getBit(payload, 4, 6); // combination with resistance
  let isMaxMode = getBit(payload, 5, 2);
  let isMinMode = getBit(payload, 5, 3);
  let isAutoRange = getBit(payload, 6, 2);
  let isDC = getBit(payload, 6, 3);
  let isAC = getBit(payload, 6, 4);
  let isRelative = getBit(payload, 6, 5);
  let isHold = getBit(payload, 6, 6);
  return {
    minMaxMode: isMinMode ? 'min' : isMaxMode ? 'max' : null,
    isAutoRange,
    acDc: isDC ? 'DC' : isAC? 'AC' : null,
    isRelative,
    isHold,
    mode: isDiode && isVoltage ? 'Diode' :
        isCurrent ? 'Current' :
            isFrequency ? 'Frequency' :
                isDutyCycle ? 'Duty cycle' :
                    isCapacitance ? 'Capacitance' :
                        isTempC ? 'Temperature in C' :
                            isTempF ? 'Temperature in F' :
                                isVoltage ? 'Diode' :
                                    isContinuity && isResistance ? 'Continuity' :
                                        isResistance ? 'Resistance' : null,
    unit: isDiode && isVoltage ? 'V' :
        isCurrent ? 'A' :
            isFrequency ? 'Hz' :
                isDutyCycle ? '%' :
                    isCapacitance ? 'F' :
                        isTempC ? 'C' :
                            isTempF ? 'F' :
                                isVoltage ? 'V' :
                                    isContinuity && isResistance ? 'Ohm' :
                                        isResistance ? 'Ohm' : null
  }
}
function getPrefix(payload: Buffer) {
  const isNano = getBit(payload, 5, 6)
  const isMicro = getBit(payload, 4, 0)
  const isMilli = getBit(payload, 4, 1)
  const isKilo = getBit(payload, 4, 2)
  const isMega = getBit(payload, 4, 3)
  return {
    prefix: isNano ? 'n' :
        isMicro ? 'u' :
            isMilli ? 'm' :
                isKilo ? 'k' :
                    isMega ? 'M' : '',
    value: isNano ? 10E-9 :
        isMicro ? 10E-6 :
            isMilli ? 10E-3 :
                isKilo ? 10E2 :
                    isMega ? 10E3 : 1,
  }
}
function getValue(payload: Buffer) {
  const decimalPoint = (payload[7] & 0b11110000) >> 4;
  let isNegative = getBit(payload, 2, 0);
  const map: {[x: number]:number} = {0xC:0,0x8C:1,0x4C:2,0xCC:3,0x2C:4,0xAC:5,0x6C:6,0xEC:7,0x1C:8,0x9C:9};
  const digit3 = map[payload[12]];
  const digit2 = map[payload[11]];
  const digit1 = map[payload[10]];
  const digit0 = map[payload[9]];
  const value = (isNegative ? -1 : 1) * parseFloat(`${digit3}${decimalPoint === 8 ? '.' : ''}${digit2}${decimalPoint === 4 ? '.' : ''}${digit1}${decimalPoint === 2 ? '.' : ''}${digit0}}`);
  const mode = getMode(payload);
  const prefix = getPrefix(payload);
  return {
    display: {
      value,
      unit: `${prefix.prefix}${mode.unit}`,
      acDc: mode.acDc,
      text: `${value} ${prefix.prefix}${mode.unit}${mode.acDc ? ' ' + mode.acDc : ''}`
    },
    real: {
      value: value * prefix.value,
      unit: mode.unit,
      acDc: mode.acDc
    }
  }
}

// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();
  const alldevices = devices();
  console.log(alldevices)
  console.log(alldevices[5].product)
  let device = new HID( alldevices[5].path );

  device.on("data", (buf: Buffer) => {
    const key = 'jodenxunickxia'
    const newPos = [6,13,5,11,2,7,9,8,3,10,12,0,4,1]
    let payload: Buffer = new Buffer(14);
    key.split('').forEach((x,i) => {
      payload[newPos[i]] = buf[i] - x.charCodeAt(0);
    })
    if (payload[0] !== 0x50 ) {return}

    console.log(getValue(payload).display.text)
    console.log (new Date().toString(), getValue(payload).real.value)

  });

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
