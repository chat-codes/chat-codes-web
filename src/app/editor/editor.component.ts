import {Component, ViewChild, EventEmitter, Output, Input} from '@angular/core';
import {PusherService} from '../pusher.service';
import * as _ from 'underscore';
import * as DiffMatchPatch from 'diff-match-patch';

declare var ace: any;

@Component({
	selector: 'code-editor',
	templateUrl: './editor.component.html',
	styleUrls: [],
})
export class EditorDisplay {
    constructor() { }
    ngOnInit() { }
	deltas:Array<any> = []
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
		var oldRange, newRange, oldText, newText;
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
		const session = editor.getSession();
		const doc = session.getDocument();
		const Range = ace.acequire('ace/range').Range

		editor.on('change', (event) => {
			const curOpp = editor.curOp;
			if(curOpp && curOpp.command && curOpp.command.name) { // change was made locally
				console.log('local change');
				const delta = this.getDelta(event);
				this.handleDelta(delta, doc, false);
				this.pusher.emitEditorChanged(delta);
			} else {
				console.log('remote change');
			}
		});
		session.selection.on('changeCursor', (event) => {
			const range = editor.getSelectionRange();
		});

		this.pusher.editorShared.subscribe((data) => {
			editor.setValue(data.contents, -1);
		});
		this.pusher.editorDestroyed.subscribe((data) => {
			console.log(data);
		});
		this.pusher.editorTitleChanged.subscribe((data) => {
			console.log(data);
		});

		this.pusher.editorChanged.subscribe((data) => {
			_.each(data.changes, (c) => {
				this.handleDelta(c, doc);
				// var actionArea = newRange.start;
				//
				// session.replace(oldRange, newText);
				// actionArea = newRange.start;
				//
				// editor.scrollToRow(actionArea.row);
			});

		});
		this.pusher.editorGrammarChanged.subscribe((data) => {
			console.log(data);
		});
		this.pusher.cursorDestroyed.subscribe((data) => {
			console.log(data);
		});
		this.pusher.cursorChangedPosition.subscribe((data) => {
			const {oldBufferPosition, newBufferPosition} = data;
			const oldRange = new Range(oldBufferPosition[0], oldBufferPosition[1], oldBufferPosition[0], oldBufferPosition[1]+1);
			const newRange = new Range(newBufferPosition[0], newBufferPosition[1], newBufferPosition[0], newBufferPosition[1]+1);
			if(this.markers[data.id]) {
				session.removeMarker(this.markers[data.id]);
			}
			// } else {
			this.markers[data.id] = session.addMarker(newRange, 'rootCursor', 'text');
			// }
			// console.log(session.getMarkers());
		});
    }
	private getTimestamp():number {
		return (new Date()).getTime();
	}
	private markers = {};

	private handleDelta(delta, doc, mustPerformChange=true) {
		var i = this.deltas.length-1;
		var d;
		for(; i>=0; i--) {
			d = this.deltas[i];
			if(d.timestamp > delta.timestamp) {
				this.undoDelta(d);
			} else {
				break;
			}
		}
		const insertAt = i+1;

		const anchoredDelta = this.getAnchoredDelta(delta, doc);

		if(mustPerformChange) {
			this.doDelta(anchoredDelta);
		}

		this.deltas.splice(insertAt, 0, anchoredDelta);

		for(i = insertAt+1; i<this.deltas.length; i++) {
			d = this.deltas[i];
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
