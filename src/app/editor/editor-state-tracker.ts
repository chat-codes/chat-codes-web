import {Injectable,EventEmitter} from '@angular/core';
import {RemoteCursorMarker} from './remote_cursor_marker';
import * as _ from 'underscore';
import { URLSearchParams } from '@angular/http';

declare let ace: any;

interface Delta {
    doAction(editorState:EditorState):void;
}
interface UndoableDelta extends Delta {
	undoAction(editorState:EditorState):void;
}

class TitleDelta implements UndoableDelta {
    constructor(private newTitle:string, private oldTitle:string) { }
    public doAction(editorState:EditorState) {
        editorState.setTitle(this.newTitle);
    }
	public undoAction(editorState:EditorState) {
        editorState.setTitle(this.oldTitle);
    }
}
class GrammarDelta implements UndoableDelta {
    constructor(private oldGrammarName:string, private newGrammarName:string) { }
    public doAction(editorState:EditorState) {
		const session = editorState.getSession();
    	session.setMode(this.getAceGrammarName(this.newGrammarName));
    }
	public undoAction(editorState:EditorState) {
		const session = editorState.getSession();
    	session.setMode(this.getAceGrammarName(this.oldGrammarName));
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
}

class EditChange implements UndoableDelta {
	private oldRangeStartAnchor;
	private oldRangeEndAnchor;
	private newRangeStartAnchor;
	private newRangeEndAnchor;
    constructor(private oldRange, private newRange, private oldText, private newText) {}
    public doAction(editorState:EditorState) {
		const session = editorState.getSession();
		const Range = ace.acequire('ace/range').Range
		const oldRange = this.getRangeFromSerializedRange(this.oldRange);

		session.replace(oldRange, this.newText);
    }
	public undoAction(editorState:EditorState) {
		const session = editorState.getSession();
		const Range = ace.acequire('ace/range').Range
		const newRange = this.getRangeFromSerializedRange(this.newRange);

		session.replace(newRange, this.oldText);
    }
	private getRangeFromSerializedRange(serializedRange) {
		const Range = ace.acequire('ace/range').Range
		return new Range(serializedRange.start[0], serializedRange.start[1], serializedRange.end[0], serializedRange.end[1]);
	}
	private getAnchorFromLocation(doc, loc) {
		const Anchor = ace.acequire('ace/anchor').Anchor;
		return new Anchor(doc, loc[0],loc[1]);
	}
	public addAnchor(doc) {
		this.oldRangeStartAnchor = this.getAnchorFromLocation(doc, this.oldRange.start);
		this.oldRangeEndAnchor = this.getAnchorFromLocation(doc, this.oldRange.end);
		this.newRangeStartAnchor = this.getAnchorFromLocation(doc, this.newRange.start);
		this.newRangeEndAnchor = this.getAnchorFromLocation(doc, this.newRange.end);
	}
}

class EditDelta implements UndoableDelta {
    constructor(private changes:Array<EditChange>) {}
    public doAction(editorState:EditorState) {
		_.each(this.changes, (c) => {
			c.doAction(editorState);
		});
    }
    public undoAction(editorState:EditorState) {
		_.each(this.changes.reverse(), (c) => {
			c.undoAction(editorState);
		});
    }
	public addAnchors(doc) {
		_.each(this.changes, (c) => {
			c.addAnchor(doc);
		});
	}
}

class OpenDelta implements UndoableDelta {
    constructor() {}
	doAction(editorState) {
	}
	undoAction(editorState) {
	}
}
class DestroyDelta implements UndoableDelta {
    constructor() {}
	doAction(editorState) {
	}
	undoAction(editorState) {
	}
}

	// 	if(type === 'modified') {
	// 		editorState.modified = delta.modified;
	// 	} else if(type === 'edit') {
	// 		const doc = session.getDocument();
	// 		_.each(delta.changes, (change) =>{
	// 			this.updatePositionsFromAnchor(change);
	// 			const Range = ace.acequire('ace/range').Range
	// 			const oldRange = this.getRangeFromSerializedRange(change.oldRange);
	// 			const {newText} = change;
	  //
	// 			session.replace(oldRange, newText);
	// 		});
	// 	} else if(type === 'title') {
	// 		editorState.title = delta.newTitle;
	// 	} else if(type === 'grammar') {
	// 		session.setMode(this.getAceGrammarName(delta.newGrammarName));
	// 	} else if(type === 'open') {
	// 		editorState.title = delta.title;
	// 		session.setValue(delta.contents);
	// 		editorState.isOpen = true;
	// 		const {grammarName} = delta;
	// 		session.setMode(this.getAceGrammarName(delta.grammarName));
	// 	} else if(type === 'destroy') {
	// 		const EditSession = ace.acequire('ace/edit_session').EditSession;
    //   const editor = this.editor.getEditor();
	// 		if(editor.getSession() === session) {
	// 			editor.setSession(new EditSession(''));
	// 		}
	// 		editorState.isOpen = false;
	// 	}

const EditSession = ace.acequire('ace/edit_session').EditSession;
export class EditorState {
	private isOpen:boolean;
	private deltas: Array<UndoableDelta> = [];
    private cursors:{[cursorID:number]:any} = {};
    private selections:{[selectionID:number]:any} = {};
	private session = new EditSession('');
	private editorID:number;
	private remoteCursors:RemoteCursorMarker;
	//  = new RemoteCursorMarker(session)
    constructor(private title:string) {
		this.remoteCursors = new RemoteCursorMarker(this.session)
	}
    public ngOnDestroy() {
    }
	public getSession() { return this.session; };
	public setTitle(newTitle:string) { this.title = newTitle; };
	public setIsOpen(val:boolean) { this.isOpen = val; };
	public getIsOpen(val:boolean) { return this.isOpen; };
	public getRemoteCursors():RemoteCursorMarker { return this.remoteCursors; };
	public getEditorID():number { return this.editorID; };
	private handleDelta(delta, mustPerformChange=true) {
		if(delta instanceof EditDelta) {
			const session = this.getSession();
			const doc = session.getDocument();
			delta.addAnchors(doc);
		}
		const deltas = this.deltas;
		let i = deltas.length-1;
		let d;
		for(; i>=0; i--) {
			d = deltas[i];
			// if(d.timestamp > event.timestamp) {
			// 	this.undoDelta(d);
			// } else {
			// 	break;
			// }
		}
		const insertAt = i+1;

		deltas.splice.apply(deltas, [insertAt,0].concat(delta));

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
	private doDelta(d) {

	}
	private undoDelta(d) {

	}
}
		// const editorState =  _.extend({
		// 	session: session
		// }, state, {
		// 	selected: false,
		// 	deltas: [],
		// 	cursors: {},
		// 	selections: {},
		// 	remoteCursors: new RemoteCursorMarker(session)
		// });

export class EditorStateTracker {
    private editorStates:{[editorID:number]: EditorState} = {};
    constructor() {
    }
    public ngOnDestroy() {
    }
	public handleEvent(event) {
		console.log(event);
		// this.handleDelta(event);
	}
	public handleDelta(delta) {

	};
	public getEditorState(editorID:number):EditorState {
        if(_.has(this.editorStates, editorID)) {
    		return this.editorStates[editorID];
        } else {
            return null;
        }
	}
	public getActiveEditors():Array<EditorState> {
		return _.chain(this.editorStates)
				.values()
				.filter((s) => { return s.getIsOpen(); })
				.value();
	}
	public onEditorOpened(state) {
		console.log(state);
		const editorState =  new EditorState(state.title);
		this.editorStates[state.id] = editorState;
		return editorState;

		// session.addDynamicMarker(editorState.remoteCursors);

		// _.each(state.deltas, (delta) => {
		// 	this.handleDelta(delta);
		// });
	}
	private getDeltaHistory(editorID, type) {
		// let editorState = this.getEditorState(editorID);
		// return _.filter(editorState.deltas, (d) => {
		// 	if(type) { if(_.isArray(type)) { return _.find(type, d.type);
		// 		} else {
		// 			return d.type === type;
		// 		}
		// 	} else {
		// 		return true;
		// 	}
		// });
	}
}
