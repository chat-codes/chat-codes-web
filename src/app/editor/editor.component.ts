import {Component, ViewChild, EventEmitter, Output, Input} from '@angular/core';
import {PusherService} from '../pusher.service';
import {RemoteCursorMarker} from './remote_cursor_marker';
import { ChatUserList, ChatUser } from '../chat-user';

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
	editorStates: {[editorID:number]: any} = {}
	files: Array<any> = []
	selectedEditor:any=false;
	private getEditorState(editorID:number):any {
		return this.editorStates[editorID];
	}
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
	getAnchoredChange(delta, doc) {
		const anchoredChange = _.extend({
			oldRangeStartAnchor: this.getAnchorFromLocation(doc, delta.oldRange.start),
			oldRangeEndAnchor: this.getAnchorFromLocation(doc, delta.oldRange.end),
			newRangeStartAnchor: this.getAnchorFromLocation(doc, delta.newRange.start),
			newRangeEndAnchor: this.getAnchorFromLocation(doc, delta.newRange.end)
		}, delta);
		return anchoredChange;
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
				this.pusher.emitEditorChanged({
					id: session.forEditorID,
					type: 'edit',
					changes: [change]
				});
			}
		});

		this.pusher.editorEvent.subscribe((event) => {
			this.handleDelta(event);
		});
		this.pusher.cursorEvent.subscribe((event) => {
			const {id, type, uid} = event;
			let userList:ChatUserList = this.pusher.userList;
			let user = userList.getUser(uid);

			if(type === 'change-position') {
				const {newBufferPosition, oldBufferPosition, newRange, id, editorID} = event;
				const editorState = this.getEditorState(editorID);
				if(editorState) {
					const {remoteCursors, session} = editorState;
					remoteCursors.updateCursor(id, user, {row: newBufferPosition[0], column: newBufferPosition[1]});
				}
			} else if(type === 'change-selection') {
				const {newRange, id, editorID} = event;
				const editorState = this.getEditorState(editorID);
				if(editorState) {
					const {remoteCursors, session} = editorState;
					remoteCursors.updateSelection(id, user, this.getRangeFromSerializedRange(newRange));
				}
			} else if(type === 'destroy') {
				console.log(event);
			}
		});
		this.pusher.editorOpened.subscribe((event) => {
			this.onEditorOpened(event);
		});
		this.pusher.editorState.subscribe((event) => {
			_.each(event.state, (state) => {
				this.onEditorOpened(state);
			});
		});
    }
	private onEditorOpened(state) {
		const {id} = state;
		const EditSession = ace.acequire('ace/edit_session').EditSession;
	    const editor = this.editor.getEditor();
		const session = new EditSession('');
		session.forEditorID = id;
		const editorState =  _.extend({
			session: session
		}, state, {
			selected: false,
			deltas: [],
			cursors: {},
			selections: {},
			remoteCursors: new RemoteCursorMarker(session)
		});
		this.editorStates[id] = editorState;
		session.addDynamicMarker(editorState.remoteCursors);

		_.each(state.deltas, (delta) => {
			this.handleDelta(delta);
		});

		const selection = session.getSelection();
		selection.on('changeCursor', (event) => {
			const cursor = selection.getCursor();

			this.pusher.emitCursorPositionChanged({
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
			this.pusher.emitCursorSelectionChanged({
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
		const {session} = editorState;
		editorState.selected = true;

	    const editor = this.editor.getEditor();
		editor.setSession(session);

		this.selectedEditor = editorState;
	}

	private getDeltaHistory(editorID, type) {
		let editorState = this.getEditorState(editorID);
		return _.filter(editorState.deltas, (d) => {
			if(type) { if(_.isArray(type)) { return _.find(type, d.type);
				} else {
					return d.type === type;
				}
			} else {
				return true;
			}
		});
	}

	private handleDelta(event, mustPerformChange=true) {
		const {type, id} = event;
		if(type === 'edit') {
			const editorState = this.getEditorState(id);
			const {session} = editorState;
			const doc = session.getDocument();
			const anchoredChanges = _.map(event.changes, (change) => { return this.getAnchoredChange(change, doc) });
			event.changes = anchoredChanges;
		}
		const editorState = this.getEditorState(event.id);
		const deltas = editorState.deltas;
		let i = deltas.length-1;
		let d;
		for(; i>=0; i--) {
			d = deltas[i];
			if(d.timestamp > event.timestamp) {
				this.undoDelta(d);
			} else {
				break;
			}
		}
		const insertAt = i+1;

		deltas.splice.apply(deltas, [insertAt,0].concat(event));

		if(mustPerformChange) {
			i = insertAt;
		} else {
			i = insertAt + 1;
		}

		for(; i<deltas.length; i++) {
			d = deltas[i];
			this.doDelta(d);
		}
	}
	private getRangeFromSerializedRange(serializedRange) {
		const Range = ace.acequire('ace/range').Range
		return new Range(serializedRange.start[0], serializedRange.start[1], serializedRange.end[0], serializedRange.end[1]);
	}
	private getAnchorFromLocation(doc, loc) {
		const Anchor = ace.acequire('ace/anchor').Anchor;
		return new Anchor(doc, loc[0],loc[1]);
	}

	private doDelta(delta) {
		const {type, id} = delta;
		const editorState = this.getEditorState(id);
		const {session} = editorState;

		if(type === 'modified') {
			editorState.modified = delta.modified;
		} else if(type === 'edit') {
			const doc = session.getDocument();
			_.each(delta.changes, (change) =>{
				this.updatePositionsFromAnchor(change);
				const Range = ace.acequire('ace/range').Range
				const oldRange = this.getRangeFromSerializedRange(change.oldRange);
				const {newText} = change;

				session.replace(oldRange, newText);
			});
		} else if(type === 'title') {
			editorState.title = delta.newTitle;
		} else if(type === 'grammar') {
			session.setMode(this.getAceGrammarName(delta.newGrammarName));
		} else if(type === 'open') {
			editorState.title = delta.title;
			session.setValue(delta.contents);
			editorState.isOpen = true;
			const {grammarName} = delta;
			session.setMode(this.getAceGrammarName(delta.grammarName));
		} else if(type === 'destroy') {
			const EditSession = ace.acequire('ace/edit_session').EditSession;
      const editor = this.editor.getEditor();
			if(editor.getSession() === session) {
				editor.setSession(new EditSession(''));
			}
			editorState.isOpen = false;
		}
	}
	private getAceGrammarName(grammarName) {
		if(grammarName === 'TypeScript') {
			return 'ace/mode/typescript';
		} else if (grammarName === 'Null Grammar') {
			return '';
		} else if(grammarName === 'JavaScript') {
			return 'ace/mode/javascript';
		} else if(grammarName === 'HTML') {
			return 'ace/mode/html';
		} else if(grammarName === 'CSS') {
			return 'ace/mode/css';
		} else if(grammarName === 'JSON') {
			return 'ace/mode/json';
		} else if(grammarName === 'PHP') {
			return 'ace/mode/php';
		} else if(grammarName === 'Python') {
			return 'ace/mode/python';
		} else if(grammarName === 'Markdown') {
			return 'ace/mode/markdown';
		} else {
			return '';
		}
	}
	private undoDelta(delta) {
		const {type, id} = delta;
		const editorState = this.getEditorState(id);
		const {session} = editorState;

		if(type === 'modified') {
			editorState.modified = delta.oldModified;
		} else if(type === 'edit') {
			const doc = session.getDocument();
			_.each(delta.changes, (change) =>{
				const Range = ace.acequire('ace/range').Range
				const newRange = this.getRangeFromSerializedRange(change.newRange);
				const {oldText} = delta;
			    const editor = this.editor.getEditor();
				const session = editor.getSession();

				session.replace(newRange, oldText);
			});
		} else if(type === 'title') {
			editorState.title = delta.oldTitle;
		} else if(type === 'grammar') {
			session.setMode(this.getAceGrammarName(delta.oldGrammarName));
		} else if(type === 'open') {
			const EditSession = ace.acequire('ace/edit_session').EditSession;
      const editor = this.editor.getEditor();
			if(editor.getSession() === session) {
				editor.setSession(new EditSession(''));
			}
			editorState.isOpen = false;
		} else if(type === 'destroy') {
			editorState.isOpen = true;
		}
	}
	private getActiveEditors() {
		return _.chain(this.editorStates)
				.values()
				.filter((s) => { return s.isOpen; })
				.value();
	}
    @ViewChild('editor') editor;
    @Input() pusher: PusherService;
	@Output() public editorChanged:EventEmitter<any> = new EventEmitter();
	@Output() public cursorPositionChanged:EventEmitter<any> = new EventEmitter();
	@Output() public cursorSelectionChanged:EventEmitter<any> = new EventEmitter();
	keys(object: {}) { return _.keys(object); };
	values(object: {}) { return _.values(object); };
}
