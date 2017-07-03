import { Component } from '@angular/core';
import { PusherService } from './pusher.service';
import { Location } from '@angular/common';
import { ChatUser } from './chat-user';
import * as _ from 'underscore';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})

export class AppComponent {
  constructor() {
    const channelName = Location.stripTrailingSlash(location.pathname.substring(1));
    if(channelName) {
      this.channelName = channelName;
    }
    this.setName('remote');
  };
  private pusher:PusherService;

  setName(name:string):void {
    this.hasName = true;
    this.name = name;

    this.pusher = new PusherService(this.name, this.channelName);

    this.pusher.message.subscribe((data) => {
      this.messages.push(data);
    });
  };
  getChatURL():string {
    return 'chat.codes/'+this.channelName;
  };
  sendTextMessage(message:string):void {
    this.pusher.sendTextMessage(message);
  };
  updateTypingStatus(status:string):void {
    this.pusher.sendTypingStatus(status);
  };
  private name:string;
  private hasName:boolean = false;
  members:any = false;
  messages:Array<any>=[];
  channelName = 'channel';
}
