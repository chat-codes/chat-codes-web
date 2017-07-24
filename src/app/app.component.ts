import { Component, ViewEncapsulation, ViewChild } from '@angular/core';
import { WebCommunicationService } from './web-communication.service';
import { Location } from '@angular/common';
import * as _ from 'underscore';
import * as $ from 'jquery';
import * as showdown from 'showdown';

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
  private commLayer:WebCommunicationService;
  // private converter:showdown.Converter = new showdown.converter();
  setName(name:string):void {
    this.hasName = true;
    this.name = name;

    this.commLayer = new WebCommunicationService(this.name, this.channelName);
    this.commLayer.ready().then(() => {
      this.connected = true;
    });
  };
  getChatURL():string {
    return 'chat.codes/'+this.channelName;
  };
  sendTextMessage(message:string):void {
    this.commLayer.sendTextMessage(message);
  };
  updateTypingStatus(status:string):void {
    this.commLayer.sendTypingStatus(status);
  };
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
          // this.messageDisplay.nativeElement.scrollTop = this.messageDisplay.nativeElement.scrollHeight;
      } catch(err) { }
  }
	atBottom():boolean {
    const element = this.messageDisplay.nativeElement;
    return Math.abs(element.scrollTop + element.clientHeight - element.scrollHeight) < 100;
	}
  private name:string;
  private hasName:boolean = false;
  private connected:boolean = false;
  members:any = false;
  channelName = 'c2';
  @ViewChild('messageDisplay') messageDisplay;
}
