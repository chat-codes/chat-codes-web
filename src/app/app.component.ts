import { Component, Input, ViewEncapsulation, ViewChild, OnInit } from '@angular/core';
import { EditorStateTracker, EditorState } from 'chat-codes-services/src/editor-state-tracker';
import { WebCommunicationService } from './web-communication.service';
import { Location } from '@angular/common';
import * as _ from 'underscore';
import * as $ from 'jquery';
import * as showdown from 'showdown';

import { SharedbAceBinding } from './sharedb-ace-binding';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css', '../../node_modules/bootstrap/dist/css/bootstrap.css', '../../node_modules/xterm/dist/xterm.css'],
    encapsulation: ViewEncapsulation.None,
})

export class AppComponent implements OnInit {
    ngOnInit() { }

    @ViewChild('chatinput') private chatinput;

    editorCursorSelectionChanged(data) {
        this.chatinput.onEditorCursorSelectionChanged(data);
    }

    constructor() {
        const channelName = Location.stripTrailingSlash(location.pathname.substring(1));
        if (channelName) {
            this.channelName = channelName;
        }
        // this.setName('remote');
    };

    public editorStateTracker: EditorStateTracker;
    public commLayer: WebCommunicationService;
    private at_bottom: boolean = false;

    public setName(name:string): void {
        this.name = name;
        this.hasName = true;

        this.commLayer = new WebCommunicationService(this.name, this.channelName);
        this.editorStateTracker = this.commLayer.getEditorStateTracker();

        this.commLayer.ready().then((channel) => {
            this.connected = true;
        });
    };
    public getChatURL(): string {
        return 'chat.codes/' + this.channelName;
    };
    sendTextMessage(message: string): void {
        this.commLayer.sendTextMessage(message);
    };
    updateTypingStatus(status: string): void {
        this.commLayer.sendTypingStatus(status);
    };
    getActiveEditors() {
        return this.commLayer.getActiveEditors();
    };
    public createNewFile():Promise<EditorState> {
        return this.commLayer.ready().then(() => {
            return this.commLayer.channelService.getShareDBEditors();
        }).then((editorsDoc) => {
            const id:string = guid();
            const title:string = 'file-'+(editorsDoc.data.length+1);
            return this.editorStateTracker.createEditor(id, title, '', 'Python', false);
        }).then((es:EditorState) => {
            this.codeEditor.selectFile(es);
            return es;
        });
    };
    private name:string = '';
    public hasName: boolean = false;
    public connected: boolean = false;
    private channelName:string = 'example_channel';
    @ViewChild('codeEditor') codeEditor;
}

function guid():string {
    function s4():string {
        return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
}
