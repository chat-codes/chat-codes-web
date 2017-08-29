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
    private authors:Array<ChatUser> = [];
    private numAuthors:number = 0;
    private editorStates:Array<EditorState> = [];
    private numEditorStates:number = 0;
    ngAfterViewInit() {
        this.updateVariables();

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
