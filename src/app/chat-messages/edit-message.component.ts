import {Component,Injectable,EventEmitter,Output,Input,ViewChild} from '@angular/core';
import * as _ from 'underscore';
import * as $ from 'jquery';
import {MessageGroups, MessageGroup, EditGroup} from 'chat-codes-services/src/chat-messages';
import {ChatUser} from 'chat-codes-services/src/chat-user';
import {EditorStateTracker, EditorState} from 'chat-codes-services/src/editor-state-tracker';


@Component({
    selector: 'edit-message-group',
    templateUrl: './edit-message.component.html',
    styleUrls: ['./edit-message.component.css'],
})

export class EditMessageDisplay {
    @Input() editorStateTracker:EditorStateTracker;
    @Input() messageGroup:EditGroup;
    @Input() editor;
    @ViewChild('elem') elem;
    public authors:Array<ChatUser> = [];
    public numAuthors:number = 0;
    public editorStates:Array<EditorState> = [];
    public numEditorStates:number = 0;

    ngAfterViewInit() {
        setTimeout(() => { this.updateVariables(); }, 0);

		(this.messageGroup as any).on('delta-added', () => {
            this.updateVariables();
        });
    }
    private updateVariables():void {
        this.authors = this.messageGroup.getAuthors();
        this.numAuthors = this.authors.length;
        this.editorStates = this.messageGroup.getEditorStates();
        this.numEditorStates = this.editorStates.length;
    }
    public openFile(editorState:EditorState) {
        this.editor.selectFile(editorState);
    }
}
