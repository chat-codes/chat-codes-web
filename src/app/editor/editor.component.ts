import {Component, ViewChild, EventEmitter, Output, Input} from '@angular/core';
import {PusherService} from '../pusher.service';

import * as _ from 'underscore';

declare let ace: any;

@Component({
	selector: 'code-editor',
	templateUrl: './editor.component.html',
	styleUrls: [],
})
export class EditorDisplay {
    constructor() { }
    ngOnInit() { }
	atomIDToEditSessionMap = {}
	editorStates: {[editorID:number]: any} = {}
	files: Array<any> = []
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
		const Anchor = ace.acequire('ace/anchor').Anchor;
		return  _.extend({
			oldRangeStartAnchor: new Anchor(doc, delta.oldRange.start[0], delta.oldRange.start[1]),
			oldRangeEndAnchor: new Anchor(doc, delta.oldRange.end[0], delta.oldRange.end[1]),
			newRangeStartAnchor: new Anchor(doc, delta.newRange.start[0], delta.newRange.start[1]),
			newRangeEndAnchor: new Anchor(doc, delta.newRange.end[0], delta.newRange.end[1])
		}, delta);
	}
	getChange(changeEvent) {
		const Range = ace.acequire('ace/range').Range
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
		const Range = ace.acequire('ace/range').Range

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
			console.log(event);
		});
		this.pusher.editorOpened.subscribe((event) => {
			this.onEditorOpened(event);
		});
		this.pusher.editorState.subscribe((event) => {
			this.onEditorOpened(event.state);
		});
    }
	private onEditorOpened(state) {
		const {id} = state;
		const EditSession = ace.acequire('ace/edit_session').EditSession;
        const editor = this.editor.getEditor();
		const session = new EditSession('');
		session.forEditorID = id;
		this.editorStates[id] = _.extend({
			session: session
		}, state, {
			deltas: []
		});

		_.each(state.deltas, (delta) => {
			this.handleDelta(delta);
		});
		editor.setSession(session);
	}
	private getTimestamp():number {
		return (new Date()).getTime();
	}
	private markers = {};
	private selectFile(session) {
        const editor = this.editor.getEditor();
		editor.setSession(session);
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
				const oldRange = new Range(change.oldRange.start[0], change.oldRange.start[1], change.oldRange.end[0], change.oldRange.end[1]);
				const {newText} = change;

				session.replace(oldRange, newText);
			});
		} else if(type === 'title') {
			editorState.title = delta.newTitle;
		} else if(type === 'grammar') {
			session.setGrammar(this.getAceGrammarName(delta.newGrammarName));
		} else if(type === 'open') {
			editorState.title = delta.title;
			session.setValue(delta.contents);
		}
	}
	private getAceGrammarName(grammarName) {
		return '';
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
				const newRange = new Range(delta.newRange.start[0], delta.newRange.start[1], delta.newRange.end[0], delta.newRange.end[1]);
				const {oldText} = delta;
		        const editor = this.editor.getEditor();
				const session = editor.getSession();

				session.replace(newRange, oldText);
			});
		} else if(type === 'title') {
			editorState.title = delta.oldTitle;
		} else if(type === 'grammar') {
			session.setGrammar(this.getAceGrammarName(delta.oldGrammarName));
		} else if(type === 'open') {
			editorState.title = delta.title;
			session.setValue(delta.contents);
		}
	}
    @ViewChild('editor') editor;
    @Input() pusher: PusherService;
	@Output() public editorChanged:EventEmitter<any> = new EventEmitter();
	keys(object: {}) { return _.keys(object); };
	values(object: {}) { return _.values(object); };
}
