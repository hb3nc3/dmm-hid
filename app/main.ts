import * as path from "path";
import { devices, HID } from "node-hid";
import { app, BrowserWindow, ipcMain } from "electron";
import * as fs from "fs";
import { VictorEncodedValue } from "./victorEncodedValue";


const args = process.argv.slice(1), serve = args.some(val => val === '--serve');

function createWindow () {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            backgroundThrottling: false,
            contextIsolation: false,
            // enableRemoteModule: true
        }
    });
    if (serve) {
        mainWindow.loadURL('http://localhost:4200');
    } else {
        // Path when running electron executable
        let pathIndex = './index.html';

        if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
            // Path when running electron in local folder
            pathIndex = '../dist/index.html';
        }

        const url = new URL(path.join('file:', __dirname, pathIndex));
        mainWindow.loadURL(url.href);
    }
    mainWindow.webContents.openDevTools();
}


app.whenReady().then(() => {
    createWindow();
    ipcMain.on('get_available_devices', (event, arg) => {
        const allDevices = devices();
        event.sender.send('available_devices', allDevices.filter(device => device.vendorId === 0x1244 && device.productId === 0xd237));
    })

    ipcMain.on('get_data_from_device', (event,arg) => {
        console.log(arg)
        const device = new HID(arg);
        device.on("data", (buf: Buffer) => {
              const encodedValue = new VictorEncodedValue(buf);
              if (!encodedValue.isValid()) {
                return;
              }
              event.sender.send('data_from_device_' + arg, [new Date(), encodedValue])
        })
    })

    ipcMain.on('get_available_devices2', (event, arg) => {
        const allDevices = devices();
        event.sender.send('available_devices', allDevices);
    })

    ipcMain.on('get_data_from_device2', (event,arg) => {
        console.log(arg)
        for (let i = 0; i < 10; i++) {
            event.sender.send('data_from_device_' + arg, i);
        }
    })


    // const device = new HID( victorDevices[0].path );
    //
    // device.on("data", (buf: Buffer) => {
    //   const encodedValue = new VictorEncodedValue(buf);
    //   if (!encodedValue.isValid()) {
    //     return;
    //   }
    //   console.log(encodedValue.getValue().display.text)
    //   console.log (new Date().toString(), encodedValue.getValue().real.value)
    //
    // });

    app.on("activate", function () {
        // On macOS, it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});
