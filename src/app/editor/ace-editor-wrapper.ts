import {EditorStateTracker,EditorState} from 'chat-codes-services/src/editor-state-tracker';
import {ChannelCommunicationService} from 'chat-codes-services/src/communication-service';

declare let ace: any;
import * as _ from 'underscore';

export class AceEditorWrapper {
	constructor(state, private channelCommunicationService:ChannelCommunicationService) {
		this.session.forEditorID = state.id;
		this.session.addDynamicMarker(this);

		const selection = this.session.getSelection();
		selection.on('changeCursor', (event) => {
			const cursor = selection.getCursor();

			channelCommunicationService.emitCursorPositionChanged({
				editorID: state.id,
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
			channelCommunicationService.emitCursorSelectionChanged({
				editorID: state.id,
				newRange: serializedRanges[0],
				type: 'change-selection'
			});
		});
	}
	public setEditorState(editorState) {
		this.editorState = editorState;
	}
	private editorState;
	private session = new (ace.acequire('ace/edit_session').EditSession)('');
	public setGrammar(grammarName:string) {
    	this.session.setMode(this.getAceGrammarName(grammarName));
	}
	public replaceText(serializedRange, value:string) {
		const range = this.getRangeFromSerializedRange(serializedRange);
		const oldText = this.session.getTextRange(range);
		const newRange = { start: serializedRange.start, end: serializedRange.end };
		const newEnd = this.session.replace(range, value);
		newRange.end = [newEnd.row, newEnd.column];
		return {
			oldText: oldText,
			newRange: newRange
		}
		// const this.session.replace(range, value));
		// console.log(this.session.replace(range, value));

	}
	public setText(value:string) {
		this.session.setValue(value);
	}
	public getAnchor(range) {
		const doc = this.session.getDocument();
		return {
			start: this.getAnchorFromLocation(doc, range.start),
			end: this.getAnchorFromLocation(doc, range.end)
		};
	}
	public getCurrentAnchorPosition(anchor) {
		return {
			start: [anchor.start.row, anchor.start.column],
			end: [anchor.end.row, anchor.end.column]
		};
	}
	private getRangeFromSerializedRange(serializedRange) {
		const Range = ace.acequire('ace/range').Range
		return new Range(serializedRange.start[0], serializedRange.start[1], serializedRange.end[0], serializedRange.end[1]);
	}
	private getAnchorFromLocation(doc, loc) {
		const Anchor = ace.acequire('ace/anchor').Anchor;
		return new Anchor(doc, loc[0],loc[1]);
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
	private cursorMarkers:{[cursorID:number]:number} = {};
	public getSession() { return this.session; }
	public addRemoteCursor(cursor, remoteCursorMarker) {}
	public addRemoteCursorSelection(cursor, remoteCursorMarker) { }
	public addRemoteCursorPosition(cursor, remoteCursorMarker) {
		this.session._signal("changeBackMarker");
	}
	public updateRemoteCursorPosition(cursor, remoteCursorMarker) {
		this.session._signal("changeBackMarker");
	}
	public removeRemoteCursor(cursor, remoteCursorMarker) {
		const {id,range,user} = cursor;
		const oldMarkerID = this.cursorMarkers[id];
		if(oldMarkerID) {
			this.session.removeMarker(oldMarkerID);
			delete this.cursorMarkers[id];
		}
	}
	private clazz:string = 'remoteCursor';
	public updateRemoteCursorSelection(cursor, remoteCursorMarker) {
		const {id,range,user} = cursor;
		const oldMarkerID = this.cursorMarkers[id];
		if(oldMarkerID) {
			this.session.removeMarker(oldMarkerID);
			delete this.cursorMarkers[id];
		}
		const aceRange = this.getRangeFromSerializedRange(range);
		const markerID = this.session.addMarker(aceRange, this.clazz + (user ? ' user-'+user.colorIndex : ''), false);
		this.cursorMarkers[id] = markerID;
	}
	public saveFile() {};
	public addHighlight(range) {
		const aceRange = this.getRangeFromSerializedRange(range);
		const markerID = this.session.addMarker(aceRange, this.clazz + ' user-1', false);
		return markerID;
	}
	public removeHighlight(id) {
		this.session.removeMarker(id);
	}
	public focus(range) {
		const aceRange = this.getRangeFromSerializedRange(range);
		const markerID = this.session.addMarker(aceRange, this.clazz + ' user-1', false);
		setTimeout(() => {
			this.session.removeMarker(markerID);
		}, 2000);
	}

    public update(html, markerLayer, session, config)  {
	    var start = config.firstRow, end = config.lastRow;
		const remoteCursors = this.editorState.getRemoteCursors();
		const cursors = remoteCursors.getCursors();
		Object.keys(cursors).forEach((cursorID) => {
			const cursorInfo = cursors[cursorID];
			const {pos} = cursorInfo;
	        if (!pos || pos.row < start || pos.row > end) {
	            return;
	        } else {
	            // compute cursor position on screen
	            // this code is based on ace/layer/marker.js
	            var screenPos = session.documentToScreenPosition(pos)

	            var height = config.lineHeight;
	            var width = config.characterWidth;
	            var top = markerLayer.$getTop(screenPos.row, config);
	            var left = markerLayer.$padding + screenPos.column * width;
	            // can add any html here
	            html.push(
	                "<div class='carret "+this.clazz+(cursorInfo.user ? ' user-'+cursorInfo.user.colorIndex:'')+"' style='",
	                "height:", height, "px;",
	                "top:", top, "px;",
	                "left:", left, "px;", width, "px'></div>"
	            );
	        }
		});
    }
}
