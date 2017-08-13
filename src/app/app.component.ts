import { Component, Input, ViewEncapsulation, ViewChild, OnInit } from '@angular/core';
import { WebCommunicationService } from './web-communication.service';
import { Location } from '@angular/common';
import { EditorDisplay } from './editor/editor.component';
import { ChatInput } from './chat-input/chat-input.component';
import { AceEditorModule } from 'ng2-ace-editor';
import * as _ from 'underscore';
import * as $ from 'jquery';
import * as showdown from 'showdown';
declare let ace: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css', '../../node_modules/bootstrap/dist/css/bootstrap.css', '../../node_modules/xterm/dist/xterm.css'],
  encapsulation: ViewEncapsulation.None,
})

export class AppComponent implements OnInit{
  ngOnInit() { }

  updateCISelectionFlag: Boolean;
  updateCISelectionFlagChanged(data){
    this.updateCISelectionFlag = data;
  }

  @ViewChild(EditorDisplay) editorDisplay: EditorDisplay;
  selectFileEmitterEvent(editorState){
    console.log("bad bad choice");
    this.editorDisplay.selectFile(editorState);
  }
  scrollToLineEmitterEvent(scrollToLineNumber){
    var editor = this.editorDisplay.editor.getEditor();
    editor.resize(true);
    editor.scrollToLine(scrollToLineNumber, true, true, function () {});
    //editor.gotoLine(scrollToLineNumber, 0, true);
  }

  //updata ChatInputSelection Range
  updataChatInputSelection(data):void{
      this.chatInputSelectionRange = {
        start: data.newRange.start[1],
        end: data.newRange.end[1]
      };
      //console.log(this.chatInputSelectionRange.start);
      //console.log(this.chatInputSelectionRange.end);
  }

  //update chatInputMessage String
  chatinputMessageChanged(message):void{
    this.message = message;
  }

  getOpenFileTitle():String{
    var editorStates = this.getActiveEditors();
    var title;
    _.each(editorStates, (editorstate)=>{
      if(editorstate.selected == true){
        title = editorstate.title;
      }
    })
    return title;
  }

  private chatInputSelectionRange;
  message: String;
  chatInputSelectionType: String; //EMPTY or A CHOSEN MESSAGE or A WRITTEN LINK
                                  //Or EMPTY CHOSEN MESSAGE or NO OPERATION or UNDEFINED NO OPERATION
                                  //Or NOT A LEGAL CHOSEN MESSAGE
  @ViewChild(ChatInput) chatInput: ChatInput
  linkStartIndex: number; linkEndIndex: number;

  editorCursorSelectionChanged(data){
    this.updateCISelectionFlag = false;
    //console.log("editor selection event works! set updateCISelectionFlag as false");
    var startRow = data.newRange.start[0];  var startCol = data.newRange.start[1];
    var endRow = data.newRange.end[0];      var endCol = data.newRange.end[1];

    //console.log("chatinputSelection start" + this.chatInputSelectionRange.start);
    //console.log("chatinputSelection end" + this.chatInputSelectionRange.end);

    if( (this.chatInputSelectionRange.start==this.chatInputSelectionRange.end && this.chatInputSelectionRange.start==0
    && (!message || message=='') ) || this.chatInputSelectionRange.start!=this.chatInputSelectionRange.end ){
      var message = this.message;
      this.checkChatInputSelectionType();

      if( startRow==endRow && startCol==endCol){
        if(this.chatInputSelectionType=="A WRITTEN LINK"){
          var messageTemp = this.message.substring(this.chatInputSelectionRange.start, this.chatInputSelectionRange.end+1);
          //console.log(messageTemp);
          messageTemp = messageTemp.substring(1, messageTemp.indexOf("]("));
          //console.log(messageTemp);
           if(messageTemp=="This is a link!"){
             this.attachChangedString("");
             this.chatInputSelectionRange.start = 0;
             this.chatInputSelectionRange.end = 0;
           }else{
            this.attachChangedString(messageTemp);
            this.chatInputSelectionRange.end = this.chatInputSelectionRange.start + messageTemp.length;
           }
        }
      }else{
        if(this.chatInputSelectionType=="EMPTY"){
          var messageTemp = "["+"This is a link!"+"]("+this.getOpenFileTitle()+":L"+startRow+","+startCol+"-L"+endRow+","+endCol+")";
          this.message = messageTemp;
          this.chatInputSelectionRange.start = 0;
          this.chatInputSelectionRange.end = messageTemp.length -1;
          this.setChatInputSelectionRange(this.chatInputSelectionRange.start, this.chatInputSelectionRange.end)
        }else if(this.chatInputSelectionType=="Chosen Message"){
          var messageTemp = this.message.substring(this.chatInputSelectionRange.start, this.chatInputSelectionRange.end);
          if(messageTemp == ''){
            messageTemp = "["+"This is a link!"+"]("+this.getOpenFileTitle()+":L"+startRow+","+startCol+"-L"+endRow+","+endCol+")";
          }else{
            messageTemp = "["+messageTemp+"]("+this.getOpenFileTitle()+":L"+startRow+","+startCol+"-L"+endRow+","+endCol+")";
          }
          this.attachChangedString(messageTemp);
          //this.chatInputSelectionRange.start does not change
          this.chatInputSelectionRange.end = this.chatInputSelectionRange.start + (messageTemp.length-1);
          this.setChatInputSelectionRange(this.chatInputSelectionRange.start, this.chatInputSelectionRange.end)
        }else if(this.chatInputSelectionType=="A WRITTEN LINK"){
          var messageTemp = this.message.substring(this.chatInputSelectionRange.start, this.chatInputSelectionRange.end);
          messageTemp = messageTemp.substring(1, messageTemp.indexOf("]("));
          messageTemp = "["+messageTemp+"]("+this.getOpenFileTitle()+":L"+startRow+","+startCol+"-L"+endRow+","+endCol+")";
          this.attachChangedString(messageTemp);
          //this.chatInputSelectionRange.start does not change
          this.chatInputSelectionRange.end = this.chatInputSelectionRange.start + (messageTemp.length-1);
          this.setChatInputSelectionRange(this.chatInputSelectionRange.start, this.chatInputSelectionRange.end)
        }
      }
    }
  }
  attachChangedString(messageTemp: String){
    var message = this.message;
    this.message = message.substring(0, this.chatInputSelectionRange.start)
    + messageTemp + message.substring(this.chatInputSelectionRange.end);
  }
  //EMPTY or ONE WORD or A WRITTEN LINK
  checkChatInputSelectionType():void{
    var message = this.message;
      if(!message || message=='' || message == undefined){
        this.chatInputSelectionType = "EMPTY";
      }
      else{
        var messageLeftPart = message.substring(0, this.chatInputSelectionRange.start+1);
        var messageRightPart = message.substring(this.chatInputSelectionRange.end-1);
        this.linkStartIndex = messageLeftPart.lastIndexOf('[');
        this.linkEndIndex = messageRightPart.indexOf(')')==-1? -1: messageRightPart.indexOf(')')+this.chatInputSelectionRange.end;
        if(this.linkStartIndex != -1 && this.linkEndIndex != -1){
          var messageTemp = message.substring(this.linkStartIndex+1, this.linkEndIndex);
          if(messageTemp.indexOf("](") != -1 && messageTemp.indexOf("[")==-1){
            this.chatInputSelectionRange.start = this.linkStartIndex;
            this.chatInputSelectionRange.end = this.linkEndIndex;
            this.setChatInputSelectionRange(this.chatInputSelectionRange.start, this.chatInputSelectionRange.end)
            this.chatInputSelectionType = "A WRITTEN LINK";
          }
          else{
            this.chatInputSelectionType = "Chosen Message";
          }
        }else{
          this.chatInputSelectionType = "Chosen Message";
        }
      }
      if(this.chatInputSelectionType == "Chosen Message"){
        var messageTemp = message.substring(this.chatInputSelectionRange.start, this.chatInputSelectionRange.end);
        //console.log("CHOSen Message Check");
        //console.log(messageTemp);
        if(messageTemp.indexOf('[')!=-1 || messageTemp.indexOf(']')!=-1 ||
          messageTemp.indexOf('(')!=-1 || messageTemp.indexOf(')')!=-1){
             this.chatInputSelectionType = "NOT A LEGAL CHOSEN MESSAGE";
          }
      }
      //console.log(this.chatInputSelectionType);
  }
  //Seemes this does not work
  setChatInputSelectionRange(startCol, endCol){
    const editor = this.chatInput.editor.getEditor();
    var Range = ace.acequire('ace/range').Range;
    editor.selection.setRange(new Range(0, startCol, 0, endCol));
    //console.log(editor.getSelectedText());
    var marker = editor.getSession().addMarker(new Range(0, startCol, 0, endCol),"warning","line", false);
    //console.log("set selection!");
  }

  constructor() {
    this.updateCISelectionFlag = false;
    this.chatInputSelectionRange = {
      start: 0,
      end: 0
    };
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
