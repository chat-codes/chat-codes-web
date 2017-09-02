import {Component,Injectable,EventEmitter,Output,Input,ViewChild} from '@angular/core';
import * as _ from 'underscore';
import {MessageGroups, TextMessageGroup, EditGroup} from 'chat-codes-services/src/chat-messages';
import {EditorStateTracker} from 'chat-codes-services/src/editor-state-tracker';
import {CommunicationService} from 'chat-codes-services/src/communication-service';
import {WebCommunicationService} from '../web-communication.service';
import {EditorDisplay} from '../editor/editor.component';

@Component({
    selector: 'chat-messages',
    templateUrl: './chat-messages.component.html',
    styleUrls: ['./chat-messages.component.css'],
})

export class ChatMessagesDisplay {
    @Input() commLayer: WebCommunicationService;
    @Input() editorStateTracker: EditorStateTracker;
    @Input() editor:EditorDisplay;
    private currentTimestamp:number=-1;
    ngAfterViewInit() {
        this.editorStateTracker = this.commLayer.getEditorStateTracker();

        this.scrollToBottom();
        let at_bottom = false;
        (this.commLayer.messageGroups as any).on('group-will-be-added', (event) => {
            at_bottom = this.atBottom();
        });
        (this.commLayer.messageGroups as any).on('item-will-be-added', (event) => {
            at_bottom = this.atBottom();
        });
        (this.commLayer.messageGroups as any).on('group-added', (event) => {
            setTimeout(() => { if(at_bottom) { this.scrollToBottom(); } }, 0);
        });
        (this.commLayer.messageGroups as any).on('item-added', (event) => {
            setTimeout(() => { if(at_bottom) { this.scrollToBottom(); } }, 0);
        });
        (this.editorStateTracker as any).on('timestampChanged', (event) => {
            this.updateCurrentTimestamp();
        });
    }
    private scrollToBottom(): void {
        const element = this.messageDisplay.nativeElement;
        try {
            element.scrollTop = element.scrollHeight;
        } catch (err) { console.error(err); }
    }
    private atBottom():boolean {
        const element = this.messageDisplay.nativeElement;
        return Math.abs(element.scrollTop + element.clientHeight - element.scrollHeight) < 100;
    }
    public revert(messageGroup) {
  		return this.editorStateTracker.setCurrentTimestamp(messageGroup.getLatestTimestamp(),  {editor: this.editor.getEditorInstance()});
    }
    private isChatMessage(message):boolean {
        return message instanceof TextMessageGroup;
    };
    private isEditMessage(message):boolean {
        return message instanceof EditGroup;
    };
    private updateCurrentTimestamp() {
        this.currentTimestamp = this.editorStateTracker.getCurrentTimestamp();
    }
    public toLatest(event) {
        event.stopPropagation();
  		return this.editorStateTracker.toLatestTimestamp({editor: this.editor.getEditorInstance()});
    }
    @ViewChild('messageDisplay') messageDisplay;
}
