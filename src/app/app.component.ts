import { Component, Input, ViewEncapsulation, ViewChild, OnInit } from '@angular/core';
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

export class AppComponent implements OnInit {
  ngOnInit() { }

  private message: String;
  @ViewChild('chatinput') private chatinput;

  // chatinputMessageChanged(message):void{
  //   this.message = message;
  // }
  editorCursorSelectionChanged(data) {
    this.chatinput.onEditorCursorSelectionChanged(data);
    // var startRow = data.newRange.start[0]; var startCol = data.newRange.start[1];
    // var endRow = data.newRange.end[0]; var endCol = data.newRange.end[1];
    // if( startRow==endRow && startCol==endCol ){
    //   var message = this.getTypeMessage(this.message);
    //   if(message == "This is a link!"){
    //     this.message = undefined
    //   }else{
    //     this.message = message;
    //   }
    // }else{
    //   this.message = this.getTypeMessage(this.message);
    // //   console.log(this.getActiveEditors());
    //   var messageTemp = "["+this.message+"]("+this.getOpenFileTitle()+":L"+startRow+","+startCol+"-L"+endRow+","+endCol+")";
    //   this.message = messageTemp;
    // }
  }
  // getTypeMessage(message):String{
  //   if(message != undefined){
  //     var start = message.indexOf("[");
  //     var end = message.indexOf("]");
  //     if(start!=-1 && end!=-1 && start<end){
  //       return message.substring(start+1, end);
  //     }else{
  //       return message;
  //     }
  //   }else{
  //     return("This is a link!")
  //   }
  // }
  // getOpenFileTitle():String{
  //   var editorStates = this.getActiveEditors();
  //   var title;
  //   _.each(editorStates, (editorstate)=>{
  //     if(editorstate.selected == true){
  //       title = editorstate.title;
  //     }
  //   })
  //   return title;
  // }

  constructor() {
    const channelName = Location.stripTrailingSlash(location.pathname.substring(1));
    if (channelName) {
      this.channelName = channelName;
    }
    this.setName('remote');
  };
  private commLayer: WebCommunicationService;
  private at_bottom: boolean = false;
  setName(name: string): void {
    this.hasName = true;
    this.name = name;

    this.commLayer = new WebCommunicationService(this.name, this.channelName);
    this.commLayer.ready().then((channel) => {
      this.connected = true;
    });
  };
  getChatURL(): string {
    return 'chat.codes/' + this.channelName;
  };
  sendTextMessage(message: string): void {
    this.commLayer.sendTextMessage(message);
  };
  updateTypingStatus(status: string): void {
    this.commLayer.sendTypingStatus(status);
  };
  getActiveEditors() {
    return this.commLayer.getActiveEditors();
  }
  private name: string;
  private hasName: boolean = false;
  private connected: boolean = false;
  members: any = false;
  channelName = 'example_channel';
}
