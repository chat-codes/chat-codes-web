import {Component,Injectable,EventEmitter,Output,Input,ViewChild} from '@angular/core';
import * as _ from 'underscore';
import {MessageGroups} from 'chat-codes-services/src/chat-messages';
import {EditorStateTracker} from 'chat-codes-services/src/editor-state-tracker';
import {CommunicationService} from 'chat-codes-services/src/communication-service';
import {WebCommunicationService} from '../web-communication.service';

@Component({
  selector: 'chat-messages',
  templateUrl: './chat-messages.component.html',
  styleUrls: ['./chat-messages.component.css'],
})

export class ChatMessagesDisplay {
    @Input() commLayer: WebCommunicationService;
    ngAfterViewInit() {
      this.scrollToBottom();
      let at_bottom = false;
      (this.commLayer.messageGroups as any).on('message-will-be-added', (event) => {
        at_bottom = this.atBottom();
      });
      (this.commLayer.messageGroups as any).on('message-added', (event) => {
        if(at_bottom) {
          this.scrollToBottom();
        }
      });
    }
    private scrollToBottom(): void {
        try {
          this.messageDisplay.nativeElement.scrollTop = this.messageDisplay.nativeElement.scrollHeight;
        } catch (err) { }
    }
    private atBottom(): boolean {
        const element = this.messageDisplay.nativeElement;
        return Math.abs(element.scrollTop + element.clientHeight - element.scrollHeight) < 100;
    }
  @ViewChild('messageDisplay') messageDisplay;

  @Output() selectFileEmitter = new EventEmitter<any>();
  selectFileEmitterEvent(editorState){
    this.selectFileEmitter.emit(editorState);
  }
}
