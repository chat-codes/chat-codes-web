import {Component,Injectable,EventEmitter,Output,Input,ViewChild} from '@angular/core';
import * as _ from 'underscore';
import * as $ from 'jquery';
import {MessageGroups, TextMessageGroup, TextMessage, EditGroup} from 'chat-codes-services/src/chat-messages';
import {EditorStateTracker} from 'chat-codes-services/src/editor-state-tracker';


@Component({
    selector: 'chat-message',
    templateUrl: './single-message.component.html',
    styleUrls: ['./single-message.component.css'],
})

export class ChatMessageDisplay {
    @Input() editorStateTracker:EditorStateTracker;
    @Input() message:TextMessage;
    @Input() editor;
    @ViewChild('elem') elem;
    ngAfterViewInit() {
        const $elem = $(this.elem.nativeElement);
        $elem.html(this.message.getHTML());

  		$('a.line_ref', $elem).on('mouseenter', (me_event) => {
            let startingTimestamp:number = this.editorStateTracker.getCurrentTimestamp();
  			const {file, range} = this.getHighlightInfo(me_event.currentTarget);
  			const highlightID = this.addHighlight(file, range, this.message.getTimestamp());
  			$(me_event.target).on('mouseleave.removeHighlight', (ml_event) => {
                this.editorStateTracker.setCurrentTimestamp(startingTimestamp, {editor: this.editor.getEditorInstance()});
  				this.removeHighlight(file, highlightID);
  				$(me_event.target).off('mouseleave.removeHighlight');
  			});
        }).on('click', (c_event) => {
  			const {file, range} = this.getHighlightInfo(c_event.currentTarget);
  			this.focusRange(file, range, this.message.getTimestamp());
  		});
    }
  	private getHighlightInfo(elem) {
  		const $elem = $(elem);
  		const start = $elem.attr('data-start');
  		const end = $elem.attr('data-end');

  		return {
  			file: $elem.attr('data-file'),
  			range: {
  				start: _.map(start.split(','), (x:string) => parseInt(x)),
  				end: _.map(end.split(','), (x:string) => parseInt(x))
  			}
  		};
  	}
  	private addHighlight(editorID, range, timestamp) {
  		return this.editorStateTracker.addHighlight(editorID, range, timestamp, {
            editor: this.editor.getEditorInstance()
        });
  	}
  	private removeHighlight(editorID, highlightID) {
  		this.editorStateTracker.removeHighlight(editorID, highlightID, {
            editor: this.editor.getEditorInstance()
        });
  	}
  	private focusRange(editorID, range, timestamp) {
    	const editorState = this.editorStateTracker.getEditorState(editorID);
        this.editor.selectFile(editorState);
  		return this.editorStateTracker.focus(editorID, range, timestamp, {editor: this.editor.getEditorInstance()});
  	}
}
