import {Injectable,EventEmitter} from '@angular/core';
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
        editorState.title = this.newTitle;
    }
	public undoAction(editorState:EditorState) {
        editorState.title = this.oldTitle;
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

class EditDelta implements UndoableDelta {
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
	deltas: Array<UndoableDelta> = [];
    cursors:{[cursorID:number]:any} = {};
    selections:{[selectionID:number]:any} = {};
	private session = new EditSession('');
    constructor() { }
    public ngOnDestroy() {
    }
	public getSession() { return this.session; };
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
	public getEditorState(editorID:number):EditorState {
        if(_.has(this.editorStates, editorID)) {
    		return this.editorStates[editorID];
        } else {
            return null;
        }
	}
}
