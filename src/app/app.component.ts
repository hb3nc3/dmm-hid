import { Component } from '@angular/core';
import { ElectronService } from "ngx-electron-fresh";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'dmm-hid';

  constructor(public readonly electronService: ElectronService) {
    if (electronService.isElectronApp) {
      electronService.ipcRenderer.send('get_available_devices2', '');
      electronService.ipcRenderer.on('available_devices', (event, args) => {
        console.log(event, args);
      });
    }
  }
}
