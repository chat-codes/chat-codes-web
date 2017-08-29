import {Component, Injectable, EventEmitter, Output, OnInit, Input, ViewChild} from '@angular/core';
import * as _ from 'underscore';
declare let ace: any;

const chatInputSoftWrapNumber = 35;

const STATUS = {
    IDLE: 'IDLE',
    ACTIVE_TYPING: 'ACTIVE_TYPING',
    IDLE_TYPED: 'IDLE_TYPED'
}
function trimString(str, size) {
    return str.length > size ? str.substring(0, size-3) + '...' : str;
}

@Component({
    selector: 'chat-input',
    templateUrl: './chat-input.component.html',
    styleUrls: ['./chat-input.component.css'],
})

export class ChatInput implements OnInit{
    ngOnInit(){
        let editor = this.editor.getEditor();
        const session = editor.getSession();
        editor.$blockScrolling = Infinity;
        editor.setHighlightActiveLine(false);
        editor.renderer.setShowGutter(false);
        session.setUseWrapMode(true);
        session.setWrapLimitRange(chatInputSoftWrapNumber,chatInputSoftWrapNumber);
        session.setOption("indentedSoftWrap", false);
        session.setMode('markdown');
    }

    @ViewChild('editor') editor;
    @Input() public message : string;
    @Output() messageChanged = new EventEmitter<any>();

    onTextareaChange(val):void {
        if(val === '') {
            this.setTypingStatus(STATUS.IDLE);
            this.clearActiveTypingTimeout();
        } else {
            this.setTypingStatus(STATUS.ACTIVE_TYPING);
            this.resetActiveTypingTimeout();
        }
        this.messageChanged.emit(val);
    };

    onTextareaKeydown(event):void {
        if(event.keyCode === 13) { // Enter
            const toSend = this.message;
            this.message = '';
            event.preventDefault();
            event.stopPropagation();

            this.setTypingStatus(STATUS.IDLE);
            this.clearActiveTypingTimeout();

            this.send.emit(toSend);
        }
    };
    private rangeFromStartAndEnd(start, end) {
        const Range = ace.require('ace/range').Range;
        let startRow = _.has(start, 'row') ? start.row : start[0];
        let startCol = _.has(start, 'column') ? start.column : start[1];
        let endRow = _.has(end, 'row') ? end.row : end[0];
        let endCol = _.has(end, 'column') ? end.column : end[1];

        return new Range(startRow, startCol, endRow, endCol);
    };

    public onEditorCursorSelectionChanged(data):void {
        const Search = ace.require('ace/search').Search;
        const Range = ace.require('ace/range').Range;
        const chatEditor = this.editor.getEditor();
        const chatSession = chatEditor.getSession();
        const chatDocument = chatSession.getDocument();
        const chatSelection = chatSession.getSelection();
        const codeEditor = data.editor;
        const codeSession = codeEditor.getSession();
        const codeDocument = codeSession.getDocument();

        const range = this.rangeFromStartAndEnd(data.newRange.start, data.newRange.end);

        let locationString;

        if(range.isEmpty()) {
            locationString = false;
        } else {
            const {start,end} = range;
            const openFileTitle = data.fileName;

            if(range.start.column === 0 && range.end.column === 0) { // multi-full-line selection
                if(range.start.row === range.end.row-1) { //selected one full line
                    locationString = `${openFileTitle}:L${start.row}`;
                } else {
                    locationString = `${openFileTitle}:L${start.row}-L${end.row-1}`;
                }
            } else {
                locationString = `${openFileTitle}:L${start.row},${start.column}-L${end.row},${end.column}`;
            }
        }
        // const currentMessage = session.getText();
        // // const chatEditorBuffer = this.editor.getBuffer();
        // const chatInputSelectionRange = chatEditor.getSelectedBufferRange();
        const chatInputSelectionRange = chatSession.getSelection().getRange();
        const messageRegex = new RegExp('\\[(.*)\\]\s*\\((.*)\\)');
        // const messageMatch = currentMessage.match(messageRegex);

        let found = false;
        let searchQuery = new Search();
        searchQuery.set({
            regExp: true,
            needle: messageRegex
        });
        let matchRanges = searchQuery.findAll(chatSession);
        _.each(matchRanges, (matchRange) => {
            if(matchRange.intersects(chatInputSelectionRange)) {
                if(matchRange.isEqual(chatInputSelectionRange)) { // replace the text and the content
                    if(locationString) {
                        const textInRange = trimString(codeSession.getTextRange(range).replace(new RegExp('\n', 'g'), ' '), 10);
                        const newEnd = chatSession.replace(matchRange, `[\`${textInRange}\`](${locationString})`);
                        chatSelection.setSelectionRange(this.rangeFromStartAndEnd(matchRange.start, newEnd));
                    } else {
                        const newEnd = chatSession.replace(matchRange, '');
                        chatSelection.setSelectionRange(this.rangeFromStartAndEnd(matchRange.start, newEnd));
                    }
                } else { // just replace the content
                    const match = chatSession.getTextRange(matchRange).match(messageRegex);
                    const textStr = match[1];
                    const previousLinkStr = match[2];
                    if(locationString) {
                        let previousLinkSearchQuery = new Search();
                        previousLinkSearchQuery.set({
                            regExp: false,
                            needle: `(${previousLinkStr})`,
                            backwards: true,
                            range: matchRange
                        });
                        const previousLinkRange = previousLinkSearchQuery.find(chatSession);
                        if(previousLinkRange) {
                            chatSession.replace(previousLinkRange, `(${locationString})`);
                        }
                        let previousTextSearchQuery = new Search();
                        previousTextSearchQuery.set({
                            regExp: false,
                            needle: `${textStr}`,
                            range: matchRange
                        });
                        let previousTextRange = previousTextSearchQuery.find(chatSession);

                        if(previousTextRange) {
                            chatSelection.setSelectionRange(previousTextRange);
                        }
                    } else {
                        const newEnd = chatSession.replace(matchRange, `${textStr}`);
                        chatSelection.setSelectionRange(this.rangeFromStartAndEnd(matchRange.start, newEnd));
                    }
                }
                found = true;
            }
        });
        if(locationString && !found) {
            if(chatInputSelectionRange.isEmpty()) {
                const textInRange = trimString(codeSession.getTextRange(range).replace(new RegExp('\n', 'g'), ' '), 10);
                const newEnd = chatSession.replace(chatInputSelectionRange, `[\`${textInRange}\`](${locationString})`);
                chatSelection.setSelectionRange(this.rangeFromStartAndEnd(chatInputSelectionRange.start, newEnd));
            } else {
                const newOpenBracketEnd = chatSession.insert(chatInputSelectionRange.start, `[`);
                const newEnd = _.extend({}, chatInputSelectionRange.end, { column: chatInputSelectionRange.end.column+1});
                const endReplacementRange = chatSession.insert(newEnd, `](${locationString})`);


                chatSelection.setSelectionRange(this.rangeFromStartAndEnd(newOpenBracketEnd, newEnd));
            }
        }
    }



    private setTypingStatus(newStatus:string):string {
        if(this.typingStatus != newStatus) {
            this.typingStatus = newStatus;
            this.typing.emit(this.typingStatus);
        }
        return this.typingStatus;
    };

    @Output()
    public send:EventEmitter<any> = new EventEmitter();
    @Output()
    public typing:EventEmitter<any> = new EventEmitter();


    private typingTimeout:number = 3000;
    private typingStatus:string = STATUS.IDLE;
    private resetActiveTypingTimeout() {
        this.clearActiveTypingTimeout();
        this.setActiveTypingTimeout();
    }
    private setActiveTypingTimeout() {
        this.activeTypingTimeout = window.setTimeout(() => {
        this.setTypingStatus(STATUS.IDLE_TYPED);
        }, this.typingTimeout);
    }
    private clearActiveTypingTimeout():void {
        if(this.hasActiveTypingTimeout()) {
            window.clearTimeout(this.activeTypingTimeout);
            this.activeTypingTimeout = -1;
        }
    }
    private hasActiveTypingTimeout():boolean {
        return this.activeTypingTimeout >= 0;
    }
    private activeTypingTimeout:number = -1;
}
