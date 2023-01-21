import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { NgxElectronModule } from "ngx-electron-fresh";

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
      NgxElectronModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
