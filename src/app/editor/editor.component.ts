import {Component, ViewChild, EventEmitter, Output, Input} from '@angular/core';
import { WebCommunicationService } from '../web-communication.service';
import { ChatUserList, ChatUser } from 'chat-codes-services/src/chat-user';
import { AceEditorStateTracker } from './ace-state-tracker';

import * as _ from 'underscore';

declare let ace: any;

@Component({
	selector: 'code-editor',
	templateUrl: './editor.component.html',
	styleUrls: ['./editor.component.css'],
})
export class EditorDisplay {
    constructor() { }
    ngOnInit() { }
	atomIDToEditSessionMap = {}
	private editorStateTracker:AceEditorStateTracker = new AceEditorStateTracker();
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

		this.commLayer.editorEvent.subscribe((event) => {
			this.editorStateTracker.handleEvent(event);
		});
		this.commLayer.cursorEvent.subscribe((event) => {
			const {id, type, uid} = event;
			let userList:ChatUserList = this.commLayer.userList;
			let user = userList.getUser(uid);

			if(type === 'change-position') {
				const {newBufferPosition, oldBufferPosition, newRange, id, editorID} = event;
				const editorState = this.editorStateTracker.getEditorState(editorID);
				if(editorState) {
					const remoteCursors = editorState.getRemoteCursors();
					const aceWrapper = editorState.getEditorWrapper();
					const session = aceWrapper.getSession();
					// const {remoteCursors, session} = editorState;
					remoteCursors.updateCursor(id, user, {row: newBufferPosition[0], column: newBufferPosition[1]});
				}
			} else if(type === 'change-selection') {
				const {newRange, id, editorID} = event;
				const editorState = this.editorStateTracker.getEditorState(editorID);
				if(editorState) {
					const remoteCursors = editorState.getRemoteCursors();
					const aceWrapper = editorState.getEditorWrapper();
					const session = aceWrapper.getSession();
					// const {remoteCursors, session} = editorState;
					remoteCursors.updateSelection(id, user, this.getRangeFromSerializedRange(newRange));
				}
			} else if(type === 'destroy') {
				console.log(event);
			}
		});
		this.commLayer.editorOpened.subscribe((event) => {
			this.onEditorOpened(event);
		});
		this.commLayer.editorState.subscribe((event) => {
			_.each(event.state, (state) => {
				this.onEditorOpened(state);
			});
		});
    }
	private onEditorOpened(state) {
		const editorState = this.editorStateTracker.onEditorOpened(state);
		const aceWrapper = editorState.getEditorWrapper();
		const session = aceWrapper.getSession();
		const id = editorState.getEditorID();
		const selection = session.getSelection();
		selection.on('changeCursor', (event) => {
			const cursor = selection.getCursor();

			this.commLayer.emitCursorPositionChanged({
				editorID: id,
				type: 'change-position',
				newBufferPosition: [cursor.row, cursor.column]
			});
		});
		selection.on('changeSelection', (event) => {
			const serializedRanges = _.map(selection.getAllRanges(), (range) => {
				return {
					start: [range.start.row, range.start.column],
					end: [range.end.row, range.end.column]
				};
			});
			this.commLayer.emitCursorSelectionChanged({
				editorID: id,
				newRange: serializedRanges[0],
				type: 'change-selection'
			});
		});
		this.selectFile(editorState);
	}
	private getTimestamp():number {
		return (new Date()).getTime();
	}
	private selectFile(editorState) {
		if(this.selectedEditor) {
			this.selectedEditor.selected = false;
		}
		const aceWrapper = editorState.getEditorWrapper();
		const session = aceWrapper.getSession();
		editorState.selected = true;

	    const editor = this.editor.getEditor();
		editor.setSession(session);

		this.selectedEditor = editorState;
	}


	private getRangeFromSerializedRange(serializedRange) {
		const Range = ace.acequire('ace/range').Range
		return new Range(serializedRange.start[0], serializedRange.start[1], serializedRange.end[0], serializedRange.end[1]);
	}

	private getActiveEditors() {
		return this.editorStateTracker.getActiveEditors();
	}
    @ViewChild('editor') editor;
    @Input() commLayer: WebCommunicationService;
	@Output() public editorChanged:EventEmitter<any> = new EventEmitter();
	@Output() public cursorPositionChanged:EventEmitter<any> = new EventEmitter();
	@Output() public cursorSelectionChanged:EventEmitter<any> = new EventEmitter();
}
