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
	deltas:{[editorID:number]: Array<any>} = {}
	files: Array<any> = []
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
	getAnchoredDelta(delta, doc) {
		const Anchor = ace.acequire('ace/anchor').Anchor;
		return  _.extend({
			oldRangeStartAnchor: new Anchor(doc, delta.oldRange.start[0], delta.oldRange.start[1]),
			oldRangeEndAnchor: new Anchor(doc, delta.oldRange.end[0], delta.oldRange.end[1]),
			newRangeStartAnchor: new Anchor(doc, delta.newRange.start[0], delta.newRange.start[1]),
			newRangeEndAnchor: new Anchor(doc, delta.newRange.end[0], delta.newRange.end[1])
		}, delta);
	}
	getDelta(changeEvent) {
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
				// console.log('local change');
				const delta = this.getDelta(event);
				// this.handleDelta(delta, doc, false);
				this.pusher.emitEditorChanged({
					id: session.forEditorID,
					changes: [delta]
				});
				// _.extend({
				// 	id: session.forEditorID
				// }, delta));
			// } else {
				// console.log('remote change');
			}
		});
		// session.selection.on('changeCursor', (event) => {
		// 	const range = editor.getSelectionRange();
		// });

		this.pusher.editorShared.subscribe((data) => {
			const EditSession = ace.acequire('ace/edit_session').EditSession;
			const session = new EditSession(data.contents);
			const editorID = data.id;

			this.atomIDToEditSessionMap[editorID] = session;
			session.forEditorID = editorID;
			editor.setSession(session)

			this.files.push({
				name: data.title,
				session: session
			});
			// editor.setValue(data.contents, -1);
		});
		this.pusher.editorDestroyed.subscribe((data) => {
			console.log(data);
		});
		this.pusher.editorTitleChanged.subscribe((data) => {
			console.log(data);
		});

		this.pusher.editorChanged.subscribe((data) => {
			const session = this.atomIDToEditSessionMap[data.id];
			const doc = session.getDocument();
			this.handleChanges(data, doc);
			// _.each(data.changes, (c) => {
			// 	this.handleDelta(c, doc);
			// 	// let actionArea = newRange.start;
			// 	//
			// 	// session.replace(oldRange, newText);
			// 	// actionArea = newRange.start;
			// 	//
			// 	// editor.scrollToRow(actionArea.row);
			// });

		});
		this.pusher.editorGrammarChanged.subscribe((data) => {
			console.log(data);
		});
		this.pusher.cursorDestroyed.subscribe((data) => {
			console.log(data);
		});
		this.pusher.cursorChangedPosition.subscribe((data) => {
			// const {oldBufferPosition, newBufferPosition} = data;
			// const oldRange = new Range(oldBufferPosition[0], oldBufferPosition[1], oldBufferPosition[0], oldBufferPosition[1]+1);
			// const newRange = new Range(newBufferPosition[0], newBufferPosition[1], newBufferPosition[0], newBufferPosition[1]+1);
			// if(this.markers[data.id]) {
			// 	session.removeMarker(this.markers[data.id]);
			// }
			// // } else {
			// this.markers[data.id] = session.addMarker(newRange, 'rootCursor', 'text');
			// // }
			// // console.log(session.getMarkers());
		});
    }
	private getTimestamp():number {
		return (new Date()).getTime();
	}
	private markers = {};
	private getEditorDeltaHistory(editorID:number):Array<any> {
		if(_.has(this.deltas, editorID)) {
			return this.deltas[editorID];
		} else {
			const deltas = []
			this.deltas[editorID] = deltas;
			return deltas;
		}
	}
	private selectFile(session) {
        const editor = this.editor.getEditor();
		editor.setSession(session);
	}

	private handleChanges(event, doc, mustPerformChange=true) {
		const deltas = this.getEditorDeltaHistory(event.id);
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

		const anchoredDeltas = _.map(event.changes, (delta) => { return this.getAnchoredDelta(delta, doc) });

		deltas.splice.apply(deltas, [insertAt,0].concat(anchoredDeltas));

		if(mustPerformChange) {
			i = insertAt;
		} else {
			i = insertAt + event.changes.length;
		}

		for(; i<deltas.length; i++) {
			d = deltas[i];
			this.updatePositionsFromAnchor(d);
			this.doDelta(d);
		}
	}

	private doDelta(delta) {
		const Range = ace.acequire('ace/range').Range
		const oldRange = new Range(delta.oldRange.start[0], delta.oldRange.start[1], delta.oldRange.end[0], delta.oldRange.end[1]);
		const newRange = new Range(delta.newRange.start[0], delta.newRange.start[1], delta.newRange.end[0], delta.newRange.end[1]);
		const {oldText, newText} = delta;
        const editor = this.editor.getEditor();
		const session = editor.getSession();

		session.replace(oldRange, newText);
	}
	private undoDelta(delta) {
		const Range = ace.acequire('ace/range').Range
		const oldRange = new Range(delta.oldRange.start[0], delta.oldRange.start[1], delta.oldRange.end[0], delta.oldRange.end[1]);
		const newRange = new Range(delta.newRange.start[0], delta.newRange.start[1], delta.newRange.end[0], delta.newRange.end[1]);
		const {oldText, newText} = delta;
        const editor = this.editor.getEditor();
		const session = editor.getSession();

		session.replace(newRange, oldText);
	}
    @ViewChild('editor') editor;
    @Input() pusher: PusherService;
	@Output() public editorChanged:EventEmitter<any> = new EventEmitter();
}
