import {Component,Injectable,EventEmitter,Output,Input,ViewChild,AfterViewInit} from '@angular/core';
import * as _ from 'underscore';
import {MessageGroups, TextMessage, TextMessageGroup, EditGroup, ConnectionMessageGroup} from 'chat-codes-services/src/chat-messages';
import {EditorStateTracker} from 'chat-codes-services/src/editor-state-tracker';
import { CommunicationService, ChannelCommunicationService } from 'chat-codes-services/src/communication-service';
import {EditorDisplay} from '../editor/editor.component';

@Component({
    selector: 'chat-messages',
    templateUrl: './chat-messages.component.html',
    styleUrls: ['./chat-messages.component.css'],
})

export class ChatMessagesDisplay {
    @Input() commLayer: ChannelCommunicationService;
    @Input() editorStateTracker: EditorStateTracker;
    @Input() editor:EditorDisplay;
    @Input() isObserver:boolean;
    @Output() public onAddHighlight:EventEmitter<{message:TextMessage, range:any, file:string, version:number}> = new EventEmitter();
    @Output() public onSetVersion:EventEmitter<{message:TextMessage, version:number}> = new EventEmitter();
    public willChangeSize:EventEmitter<any> = new EventEmitter();
    public changedSize:EventEmitter<any> = new EventEmitter();
    // private currentTimestamp:number=-1;
    constructor() {
        // this.editorStateTracker = this.commLayer.getEditorStateTracker();
    }
    public onMessageSetVersion(e) { this.onSetVersion.emit(e);};
    public onMessageAddHighlight(e) {this.onAddHighlight.emit(e);};
    ngOnInit() {
        if(!this.isObserver) {
            setTimeout(() => { this.scrollToBottom(); }, 0);
        }

        let at_bottom = false;
        const messageGroups = this.commLayer.getMessageGroups() as any;
        messageGroups.on('group-will-be-added', (event) => {
            at_bottom = this.atBottom();
        });
        messageGroups.on('item-will-be-added', (event) => {
            at_bottom = this.atBottom();
        });
        this.willChangeSize.subscribe(() => {
            at_bottom = this.atBottom();
        });
        messageGroups.on('group-added', (event) => {
            setTimeout(() => { if(at_bottom) { this.scrollToBottom(); } }, 0);
        });
        messageGroups.on('item-added', (event) => {
            setTimeout(() => { if(at_bottom) { this.scrollToBottom(); } }, 0);
        });
        (this.editorStateTracker as any).on('timestampChanged', (event) => {
            this.updateCurrentTimestamp();
        });
        this.changedSize.subscribe(() => {
            setTimeout(() => { if(at_bottom) { this.scrollToBottom(); } }, 0);
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
    public revert(messageGroup:TextMessageGroup) {
        this.onSetVersion.emit({message: messageGroup.getEarliestItem(), version: messageGroup.getEditorVersion()})
		return this.editorStateTracker.setVersion(messageGroup.getEditorVersion(), messageGroup.getLatestTimestamp(), {editor: this.editor.getEditorInstance()});
    }
    private isChatMessage(message):boolean {
        return message instanceof TextMessageGroup;
    };
    private isEditMessage(message):boolean {
        return message instanceof EditGroup;
    };
    private isConnectMessage(message):boolean {
        return message instanceof ConnectionMessageGroup;
    };
    private updateCurrentTimestamp() {
        // this.currentTimestamp = this.editorStateTracker.getCurrentTimestamp();
    }
    public toLatest(event) {
        event.stopPropagation();
  		return this.editorStateTracker.toLatestVersion({editor: this.editor.getEditorInstance()});
    }
    @ViewChild('messageDisplay') messageDisplay;
}
