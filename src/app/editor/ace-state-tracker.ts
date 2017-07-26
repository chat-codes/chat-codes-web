import {EditorStateTracker,EditorState} from 'chat-codes-services/src/editor-state-tracker';
import {ChannelCommunicationService} from 'chat-codes-services/src/communication-service';

declare let ace: any;

export class AceEditorWrapper {
	constructor(state, private channelCommunicationService:ChannelCommunicationService) {
		this.session.forEditorID = state.id;
		this.session.addDynamicMarker(this);
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
		this.session.replace(range, value);
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
	public addRemoteCursor(cursor, remoteCursorMarker) {
		if(cursor.pos) { // position
			this.session._signal("changeBackMarker");
		}
	}
	public updateRemoteCursorPosition(cursor, remoteCursorMarker) {
		this.session._signal("changeBackMarker");
	}
	private clazz:string = 'remoteCursor';
	public updateRemoteCursorSelection(cursor, remoteCursorMarker) {
		const {id,range,user} = cursor;
		const oldMarkerID = this.cursorMarkers[id];
		if(oldMarkerID) {
			this.session.removeMarker(oldMarkerID);
			delete this.cursorMarkers[id];
		}
		const markerID = this.session.addMarker(range, this.clazz + (user ? ' user-'+user.colorIndex : ''), false);
		this.cursorMarkers[id] = markerID;
	}
	public saveFile() {};

    public update(html, markerLayer, session, config)  {
	    var start = config.firstRow, end = config.lastRow;
		const remoteCursors = this.editorState.getRemoteCursors();
		const cursors = remoteCursors.getCursors();
		Object.keys(cursors).forEach((cursorID) => {
			const cursorInfo = cursors[cursorID];
			const {pos} = cursorInfo;
	        if (pos.row < start || pos.row > end) {
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
