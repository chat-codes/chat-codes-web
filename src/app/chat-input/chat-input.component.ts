import {Component,Injectable,EventEmitter,Output} from '@angular/core';
import * as _ from 'underscore';

const STATUS = {
  IDLE: 'IDLE',
  ACTIVE_TYPING: 'ACTIVE_TYPING',
  IDLE_TYPED: 'IDLE_TYPED'
}

@Component({
  selector: 'chat-input',
  templateUrl: './chat-input.component.html',
  styleUrls: ['./chat-input.component.css'],
})

export class ChatInput {
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
  onTextareaChange(val):void {
    if(val === '') {
      this.setTypingStatus(STATUS.IDLE);
      this.clearActiveTypingTimeout();
    } else {
      this.setTypingStatus(STATUS.ACTIVE_TYPING);
      this.resetActiveTypingTimeout();
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

  private message:string;
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
