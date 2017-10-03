import {Component,Injectable,EventEmitter,Output,Input,ViewChild} from '@angular/core';
import * as _ from 'underscore';
import * as $ from 'jquery';
import {MessageGroups, EditGroup} from 'chat-codes-services/src/chat-messages';
import {ChatUser} from 'chat-codes-services/src/chat-user';
import {EditorStateTracker, EditorState} from 'chat-codes-services/src/editor-state-tracker';

import {Diff2Html} from 'diff2html';

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
    public showingDetails:boolean = false;
    public authors:Array<ChatUser> = [];
    public numAuthors:number = 0;
    public editorStates:Array<EditorState> = [];
    public numEditorStates:number = 0;

    public showingChanges:boolean = true;

    private diffSummaries:Array<any> = [];
    private diffHTMLs:Array<string> = [];

    ngAfterViewInit() {
        setTimeout(() => { this.updateVariables(); }, 0);

        const deboucnedUpdateVariables = _.debounce(_.bind(this.updateVariables, this), 1000);
		(this.messageGroup as any).on('item-added', () => {
            deboucnedUpdateVariables();
        });
    }
    public toggleDetails() {
        this.showingDetails = !this.showingDetails;
        if(this.showingDetails) {
            this.updateDiffHTMLs();
        } else {
            this.showLatestCode();
        }
    }
    private updateVariables():void {
        this.authors = this.messageGroup.getAuthors();
        this.numAuthors = this.authors.length;
        this.editorStates = this.messageGroup.getEditorStates();
        this.numEditorStates = this.editorStates.length;

        if(this.showingChanges && this.showingDetails) {
            this.updateDiffHTMLs();
        }
    }
    public openFile(editorState:EditorState) {
        this.editor.selectFile(editorState);
    }
    public toggleShowingChanges() {
        if(this.showingChanges) {
            this.showingChanges = false;
        } else {
            this.updateDiffHTMLs();
            this.showingChanges = true;
        }
    }
    private updateDiffHTMLs() {
        this.diffSummaries = this.messageGroup.getDiffSummary();
        this.diffHTMLs = _.map(this.diffSummaries, (ds) => {
            const html = Diff2Html.getPrettyHtml(ds.diff);
            return html;
        });
    }
    public showCodeBefore() {
  // 		return this.editorStateTracker.goBeforeDelta(this.messageGroup.getEarliestItem(), {editor: this.editor.getEditorInstance()});
    }
    public showCodeAfter() {
  // 		return this.editorStateTracker.goAfterDelta(this.messageGroup.getLatestItem(), {editor: this.editor.getEditorInstance()});
    }
    public isShowingCodeBefore():boolean {
        return false;
  // 		return this.editorStateTracker.isShowingCodeBefore(this.messageGroup.getEarliestItem());
    }
    public isShowingCodeAfter():boolean {
        return false;
  // 		return this.editorStateTracker.isShowingCodeAfter(this.messageGroup.getLatestItem());
    }
    public showLatestCode() {
        // this.editorStateTracker.toLatestTimestamp({editor: this.editor.getEditorInstance() });
    }
}
