import {EditorStateTracker,EditorState,RemoteCursorMarker} from 'chat-codes-services/src/editor-state-tracker';
import {ChannelCommunicationService} from 'chat-codes-services/src/communication-service';
import {SharedbAceBinding} from './sharedb-ace-binding';

declare let ace: any;
import * as _ from 'underscore';

export class AceEditorWrapper {
	private showingRemoteCursors:boolean = true;
	private sdbBinding:SharedbAceBinding;
	constructor(state, private channelCommunicationService:ChannelCommunicationService) {
		const {id} = state;
		this.channelCommunicationService.getShareDBEditors().then((doc) => {
			let i = 0;
			for(; i<doc.data.length; i++) {
				if(doc.data[i].id === id){
					break;
				}
			}
			const path = [i, 'contents'];
			this.sdbBinding = new SharedbAceBinding({
				doc, path, session:this.session
			});
			if(this.channelCommunicationService.getIsObserver()) {
				this.sdbBinding.setInitialValue();
				this.sdbBinding.unlisten();
			}
		});
		this.session.forEditorID = id;
		this.session.addDynamicMarker(this);

		const selection = this.session.getSelection();
		selection.on('changeCursor', (event) => {
			const cursor = selection.getCursor();

			channelCommunicationService.onCursorPositionChanged({
				editorID: state.id,
				type: 'change-position',
				newBufferPosition: [cursor.row, cursor.column]
			});
		});
		selection.on('changeSelection', (event) => {
			const serializedRanges = _.map(selection.getAllRanges(), (range:any) => {
				return {
					start: [range.start.row, range.start.column],
					end: [range.end.row, range.end.column]
				};
			});
			channelCommunicationService.onCursorSelectionChanged({
				editorID: state.id,
				newRange: serializedRanges[0],
				type: 'change-selection'
			});
		});
	}
	public suspendEditorBinding() {
		this.sdbBinding.unlisten();
	}
	public resumeEditorBinding() {
		this.sdbBinding.setInitialValue();
		this.sdbBinding.listen();
	}
	public setEditorState(editorState) {
		this.editorState = editorState;
	}
	private editorState;
	private session = new (ace.require('ace/edit_session').EditSession)('');
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
		const Range = ace.require('ace/range').Range
		let startRow = serializedRange.start[0];
		let startColumn = serializedRange.start[1];
		let endRow = serializedRange.end[0];
		let endColumn = serializedRange.end[1];
		if(startColumn < 0) {
			startColumn = 0;
		}
		if(endColumn < 0) {
			endRow = endRow+1;
			endColumn = 0;
		}
		return new Range(startRow, startColumn, endRow, endColumn);
	}
	private getAnchorFromLocation(doc, loc) {
		const Anchor = ace.require('ace/anchor').Anchor;
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
	public addRemoteCursorSelection(cursor, remoteCursorMarker:RemoteCursorMarker) {}
	public addRemoteCursorPosition(cursor, remoteCursorMarker:RemoteCursorMarker) {
		this.session._signal("changeBackMarker");
	}
	public updateRemoteCursorPosition(cursor, remoteCursorMarker:RemoteCursorMarker) {
		this.session._signal("changeBackMarker");
	}
	public removeRemoteCursor(cursor, remoteCursorMarker:RemoteCursorMarker) {
		const {id,range,user} = cursor;
		const oldMarkerID = this.cursorMarkers[id];
		if(oldMarkerID) {
			this.session.removeMarker(oldMarkerID);
			delete this.cursorMarkers[id];
		}
	}
	private clazz:string = 'remoteCursor';
	public updateRemoteCursorSelection(cursor, remoteCursorMarker:RemoteCursorMarker) {
		if(this.showingRemoteCursors) {
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
	}
	public saveFile() {};
	public setReadOnly(isReadOnly:boolean, extraInfo){
		const {editor} = extraInfo;
		editor.setReadOnly(isReadOnly);
	}
	public addHighlight(range) {
		const aceRange = this.getRangeFromSerializedRange(range);
		const markerID = this.session.addMarker(aceRange, this.clazz + ' user-1', false);
		return markerID;
	}
	public removeHighlight(id) {
		this.session.removeMarker(id);
	}
	public focus(range, extraInfo) {
		// scrollToRow(range.start[0]);
		const {editor} = extraInfo;

		const aceRange = this.getRangeFromSerializedRange(range);
		const markerID = this.session.addMarker(aceRange, this.clazz + ' user-1', false);

		const averageRow = Math.round((aceRange.start.row + aceRange.end.row)/2);

		editor.scrollToLine(averageRow, true, true, () => {});
		setTimeout(() => {
			this.session.removeMarker(markerID);
		}, 2000);
	}
	public hideRemoteCursors() {
		this.showingRemoteCursors = false;
		this.session._signal("changeBackMarker");
		_.each(this.cursorMarkers, (markerID, id) => {
			this.session.removeMarker(markerID);
			delete this.cursorMarkers[id];
		});
	}
	public showRemoteCursors(cursorTracker?:RemoteCursorMarker) {
		this.showingRemoteCursors = true;
		this.session._signal("changeBackMarker");
		if(cursorTracker) {
			const serializedCursors = cursorTracker.getCursors();
			_.each(serializedCursors, (serializedCursor:any) => {
				const {range} = serializedCursor;
				this.addRemoteCursorSelection(serializedCursor, cursorTracker);
				this.updateRemoteCursorSelection(serializedCursor, cursorTracker);
			});
		}
	}

    public update(html, markerLayer, session, config)  {
		if(this.showingRemoteCursors) {
		    var start = config.firstRow, end = config.lastRow;
			const remoteCursors = this.editorState.getRemoteCursors();
			const cursors = remoteCursors.getCursors();
			cursors.forEach((cursorInfo) => {
				const {pos} = cursorInfo;
		        if (!pos || pos.row < start || pos.row > end) {
		            return;
		        } else {
		            // compute cursor position on screen
		            // this code is based on ace/layer/marker.js
		            var screenPos = session.documentToScreenPosition(...pos)

		            var height = config.lineHeight;
		            var width = config.characterWidth;
		            var top = markerLayer.$getTop(screenPos.row, config);
		            var left = markerLayer.$padding + screenPos.column * width;
		            // can add any html here
					const user = cursorInfo.user;
		            html.push(
		                "<div class='carret "+this.clazz+(user ? ' user-'+user.getColorIndex():'')+"' style='",
		                "height:", height, "px;",
		                "top:", top, "px;",
		                "left:", left, "px;", width, "px'></div>"
		            );
		        }
			});
		}
    }
}
