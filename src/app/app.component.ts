import { Component, ViewEncapsulation, ViewChild } from '@angular/core';
import { PusherService } from './pusher.service';
import { Location } from '@angular/common';
import * as _ from 'underscore';
import * as $ from 'jquery';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css', '../../node_modules/bootstrap/dist/css/bootstrap.css', '../../node_modules/xterm/dist/xterm.css'],
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
    this.pusher.ready().then(() => {
      this.connected = true;
    });

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
    this.at_bottom = this.atBottom();
    groupToAddTo.messages.push(data);
  }
  at_bottom:boolean=false;
  ngAfterViewChecked() {
    if(this.at_bottom) {
      this.scrollToBottom();
    }
    if(this.messageDisplay) {
      this.at_bottom = this.atBottom();
    }
  }

  scrollToBottom(): void {
      try {
          this.messageDisplay.nativeElement.scrollTop = this.messageDisplay.nativeElement.scrollHeight;
      } catch(err) { }
  }
	atBottom():boolean {
    const element = this.messageDisplay.nativeElement;
    return Math.abs(element.scrollTop + element.clientHeight - element.scrollHeight) < 100;
	}
  private messageGroupingTimeThreshold:number = 5 * 60 * 1000; // 5 minutes
  private name:string;
  private hasName:boolean = false;
  private connected:boolean = false;
  members:any = false;
  messages:Array<any>=[];
  messageGroups:Array<any>=[];
  channelName = 'channel';
  @ViewChild('messageDisplay') messageDisplay;
}
