import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { NameEntry } from './name-entry/name-entry.component';
import { ChatInput } from './chat-input/chat-input.component';
import { UserDisplay } from './user/user-display.component';

import { PusherService } from './pusher.service';
import { MomentModule } from 'angular2-moment';

@NgModule({
  declarations: [
    AppComponent,
    ChatInput,
    NameEntry,
    UserDisplay
  ],
  imports: [
    BrowserModule,
    FormsModule,
    MomentModule
  ],
  providers: [ PusherService ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
