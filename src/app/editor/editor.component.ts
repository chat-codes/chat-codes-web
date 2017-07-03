import {Component, ViewChild, EventEmitter, Output, Input} from '@angular/core';
import {PusherService} from '../pusher.service';
import * as _ from 'underscore';

declare var ace: any;

@Component({
	selector: 'code-editor',
	templateUrl: './editor.component.html',
	styleUrls: [],
})
export class EditorDisplay {
    constructor() { }
    ngOnInit() { }
    ngAfterViewInit() {
        const editor = this.editor.getEditor();
		const session = editor.getSession();
		const Range = ace.acequire('ace/range').Range

		editor.on('change', (event) => {
			console.log(event);
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
				const oldRange = new Range(c.oldRange.start[0], c.oldRange.start[1], c.oldRange.end[0], c.oldRange.end[1]);
				const newRange = new Range(c.newRange.start[0], c.newRange.start[1], c.newRange.end[0], c.newRange.end[1]);
				const {oldText, newText} = c;
				var actionArea = newRange.start;

				session.replace(oldRange, newText);
				actionArea = newRange.start;

				editor.scrollToRow(actionArea.row);
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
	private markers = {};
    @ViewChild('editor') editor;
    @Input() pusher: PusherService;
}
