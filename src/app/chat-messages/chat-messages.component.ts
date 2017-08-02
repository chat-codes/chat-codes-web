import {Component,Injectable,EventEmitter,Output,Input} from '@angular/core';
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
    }
}
