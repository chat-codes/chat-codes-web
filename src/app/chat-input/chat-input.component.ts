import {Component,Injectable,EventEmitter,Output, OnInit, Input, ViewChild} from '@angular/core';
import * as _ from 'underscore';
declare let ace: any;

const STATUS = {
  IDLE: 'IDLE',
  ACTIVE_TYPING: 'ACTIVE_TYPING',
  IDLE_TYPED: 'IDLE_TYPED'
}
export const chatInputSoftWrapNumber = 35;

@Component({
  selector: 'chat-input',
  templateUrl: './chat-input.component.html',
  styleUrls: ['./chat-input.component.css'],
})

export class ChatInput implements OnInit{
  ngOnInit(){ }

  //Pass current selection range data to AppComponent
  @Output() selectionRange = new EventEmitter<any>();
  //Set editor property
  //Get and send chatinput editor selection range
  @ViewChild('editor') editor;

  //updateCISelectionFlag 2 way binding
  @Input() updateCISelectionFlag = true;
  @Output() updateCISelectionFlagEmitter = new EventEmitter<any>();

  onClickChange(event){
    this.updateCISelectionFlag = true;
    this.updateCISelectionFlagEmitter.emit(this.updateCISelectionFlag);
    //console.log("Click once");
  }

  ngAfterViewInit() {
      //console.log(this.editor);
      const editor = this.editor.getEditor();
      var session = editor.getSession();

      session.setUseWrapMode(true);
      //session.setWrapLimitRange(10,10);
      session.setWrapLimitRange(chatInputSoftWrapNumber,chatInputSoftWrapNumber);
      session.setOption("indentedSoftWrap", false)

      editor.renderer.setShowGutter(false);
      var selection = editor.getSession().getSelection();

      // selection.on("changeCursor", function(){
      //   console.log(editor.getCursorPosition());
      // });
      //

      selection.on('changeSelection', (event) => {
        const serializedRanges = _.map(selection.getAllRanges(), (range) => {
  				return {
  					start: [range.start.row, range.start.column],
  					end: [range.end.row, range.end.column]
  				};
  			});
        if(this.updateCISelectionFlag==true){
          //console.log("this.updateCISelectionFlag is true");
          this.selectionRange.emit({
    				newRange: serializedRanges[0],
    				type: 'change-selection'
    			});
        }
      });
  }

  //2 way binding of message between AppComponent and chatInput
  @Input() public message : string;
  @Output() messageChanged = new EventEmitter<any>();


  onTextareaChange(val):void {
    if(val === '') {
      this.setTypingStatus(STATUS.IDLE);
      this.clearActiveTypingTimeout();
    } else {
      this.setTypingStatus(STATUS.ACTIVE_TYPING);
      this.resetActiveTypingTimeout();
    }
    //Send message whenever it changes
    this.messageChanged.emit(val);
  };

  onTextareaKeydown(event):void {
    if(event.keyCode === 13) { // Enter
      const toSend = this.message;
      this.message = '';
      event.preventDefault();
      event.stopPropagation();

      this.setTypingStatus(STATUS.IDLE);
      this.clearActiveTypingTimeout();

      this.send.emit(toSend);
    }
  };



  private setTypingStatus(newStatus:string):string {
    if(this.typingStatus != newStatus) {
      this.typingStatus = newStatus;
      this.typing.emit(this.typingStatus);
    }
    return this.typingStatus;
  };

  @Output()
  public send:EventEmitter<any> = new EventEmitter();
  @Output()
  public typing:EventEmitter<any> = new EventEmitter();


  private typingTimeout:number = 3000;
  private typingStatus:string = STATUS.IDLE;
  private resetActiveTypingTimeout() {
    this.clearActiveTypingTimeout();
    this.setActiveTypingTimeout();
  }
  private setActiveTypingTimeout() {
    this.activeTypingTimeout = window.setTimeout(() => {
      this.setTypingStatus(STATUS.IDLE_TYPED);
    }, this.typingTimeout);
  }
  private clearActiveTypingTimeout():void {
    if(this.hasActiveTypingTimeout()) {
      window.clearTimeout(this.activeTypingTimeout);
      this.activeTypingTimeout = -1;
    }
  }
  private hasActiveTypingTimeout():boolean {
    return this.activeTypingTimeout >= 0;
  }
  private activeTypingTimeout:number = -1;
}
