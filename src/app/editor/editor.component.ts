import {Component, ViewChild, EventEmitter, Output, Input} from '@angular/core';
import { WebCommunicationService } from '../web-communication.service';
import { ChatUserList, ChatUser } from 'chat-codes-services/src/chat-user';
import {ChatInput} from '../chat-input/chat-input.component'
import {EditorStateTracker} from 'chat-codes-services/src/editor-state-tracker';

import * as _ from 'underscore';

declare let ace: any;

@Component({
	selector: 'code-editor',
	templateUrl: './editor.component.html',
	styleUrls: ['./editor.component.css'],
})
export class EditorDisplay {
    constructor() { }
    ngOnInit() {
		this.editorStateTracker = this.commLayer.getEditorStateTracker();
	}
	atomIDToEditSessionMap = {}
	files: Array<any> = []
	selectedEditor:any=false;
	updatePositionsFromAnchor(delta) {
		const oldRangeStart = delta.oldRangeStartAnchor.getPosition();
		const oldRangeEnd = delta.oldRangeEndAnchor.getPosition();
		const newRangeStart = delta.newRangeStartAnchor.getPosition();
		const newRangeEnd = delta.newRangeEndAnchor.getPosition();

		delta.oldRange.start = [oldRangeStart.row, oldRangeStart.column];
		delta.oldRange.end = [oldRangeEnd.row, oldRangeEnd.column];
		delta.newRange.start = [newRangeStart.row, newRangeStart.column];
		delta.newRange.end = [newRangeEnd.row, newRangeEnd.column];
		return delta;
	}
	getChange(changeEvent) {
		const {action, lines, start, end} = changeEvent;
		let oldRange, newRange, oldText, newText;
		if(action === 'insert') {
			oldRange = {
				start: [start.row, start.column],
				end: [start.row, start.column]
			};
			newRange = {
				start: [start.row, start.column],
				end: [end.row, end.column]
			};
			oldText = '';
			newText = lines.join('\n');
		} else { //if(action === 'remove')
			newRange = {
				start: [start.row, start.column],
				end: [start.row, start.column]
			};
			oldRange = {
				start: [start.row, start.column],
				end: [end.row, end.column]
			};
			newText = '';
			oldText = lines.join('\n');
		}
		return {
			oldRange: oldRange,
			newRange: newRange,
			oldText: oldText,
			newText: newText,
		};
	}
    ngAfterViewInit() {
		const editor = this.editor.getEditor();
	    editor.$blockScrolling = Infinity;

		editor.commands.addCommand({
			name: 'saveContents',
			bindKey: {
				win: 'Ctrl-s',
				mac: 'Command-s'
			},
			exec: function(editor) {
				const session = editor.getSession();
				const editorID = session.forEditorID;

				this.pusher.emitSave({
					id: session.forEditorID,
					type: 'save',
				});
			}
		});

		editor.on('change', (event) => {
			const curOpp = editor.curOp;
			if(curOpp && curOpp.command && curOpp.command.name) { // change was made locally
				const session = editor.getSession();
				const change = this.getChange(event);
				this.commLayer.emitEditorChanged({
					id: session.forEditorID,
					type: 'edit',
					changes: [change]
				});
			}
		});

		this.commLayer.history.subscribe((event) => {
			const {editorState} = event;
			const editors = editorState.getAllEditors();
			if(editors.length > 0) {
				this.selectFile(editors[0]);
			}
		})

		this.commLayer.editorOpened.subscribe((event) => {
			const editorStateTracker = this.commLayer.channelService.editorStateTracker;
			const editorState = editorStateTracker.getEditorState(event.id);
			this.selectFile(editorState);
			// this.onEditorOpened(editorState);
		});
		const activeEditors = this.editorStateTracker.getActiveEditors();
		if(activeEditors.length > 0) {
			this.selectFile(activeEditors[0]);
		}
    }
	private getTimestamp():number {
		return (new Date()).getTime();
	}
	public getEditorInstance() {
		return this.editor.getEditor();
	}

	public selectFile(editorState) {
		if(this.selectedEditor) {
			this.selectedEditor.selected = false;
		}
		const aceWrapper = editorState.getEditorWrapper();
		const session = aceWrapper.getSession();
		editorState.selected = true;
	    const editor = this.getEditorInstance();
		editor.setSession(session);
		this.selectedEditor = editorState;

		const selection = session.getSelection();
		selection.on('changeSelection', (event) => {
			const serializedRanges = _.map(selection.getAllRanges(), (range:any) => {
				return {
					start: [range.start.row, range.start.column],
					end: [range.end.row, range.end.column]
				};
			});
			this.cursorSelectionChanged.emit({
				editor: editor,
				session: session,
				fileName: editorState.title,
				newRange: serializedRanges[0],
				type: 'change-selection'
			});
		});
	}


	private getRangeFromSerializedRange(serializedRange) {
		const Range = ace.require('ace/range').Range
		return new Range(serializedRange.start[0], serializedRange.start[1], serializedRange.end[0], serializedRange.end[1]);
	}

	public toLatest() {
		this.editorStateTracker.toLatestTimestamp({editor: this.editor.getEditor() });
	}

	public editorStateTracker:EditorStateTracker;

    @ViewChild('editor') editor;
    @Input() commLayer: WebCommunicationService;
		//@Input() chatInput: ChatInput;
	@Output() public editorChanged:EventEmitter<any> = new EventEmitter();
	@Output() public cursorPositionChanged:EventEmitter<any> = new EventEmitter();
	@Output() public cursorSelectionChanged:EventEmitter<any> = new EventEmitter();
}
