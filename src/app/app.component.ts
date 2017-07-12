import { Component,ViewEncapsulation } from '@angular/core';
import { PusherService } from './pusher.service';
import { Location } from '@angular/common';
import { ChatUser } from './chat-user';
import * as _ from 'underscore';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css', '../../node_modules/bootstrap/dist/css/bootstrap.css'],
  encapsulation: ViewEncapsulation.None,
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
      this.addToMessageGroups(data);
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
  private addToMessageGroups(data) {
    let lastMessageGroup = _.last(this.messageGroups);
    let groupToAddTo = lastMessageGroup;
    if(!lastMessageGroup || (lastMessageGroup.timestamp < data.timestamp - this.messageGroupingTimeThreshold) || (lastMessageGroup.sender.id !== data.sender.id )) {
      groupToAddTo = {
        sender: data.sender,
        timestamp: data.timestamp,
        messages: []
      };
      this.messageGroups.push(groupToAddTo);
    }
    groupToAddTo.messages.push(data);
  }
  private messageGroupingTimeThreshold:number = 5 * 60 * 1000; // 5 minutes
  private name:string;
  private hasName:boolean = false;
  members:any = false;
  messages:Array<any>=[];
  messageGroups:Array<any>=[];
  channelName = 'channel';
}
