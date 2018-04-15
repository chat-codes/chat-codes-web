import { Component, Input, ViewEncapsulation, ViewChild, OnInit } from '@angular/core';
import { EditorStateTracker, EditorState } from 'chat-codes-services/src/editor-state-tracker';
import { CommunicationService, ChannelCommunicationService } from 'chat-codes-services/src/communication-service';
import { Location } from '@angular/common';
import * as _ from 'underscore';
import * as $ from 'jquery';
import * as showdown from 'showdown';
import { AceEditorWrapper } from './editor/ace-editor-wrapper';

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
        if(this.chatinput) {
            this.chatinput.onEditorCursorSelectionChanged(data);
        }
    }

    constructor() {
        const paths:Array<string> = _.compact(location.pathname.substring(1).split('/'));
        if(paths.length > 0) {
            this.channelName = Location.stripTrailingSlash(paths[0]);
        }
        if(paths.length > 1) {
            this.channelID = Location.stripTrailingSlash(paths[1]);
            this.isObserver = true;
            this.setName(null);
        }
        // this.setName('remote');
    };

    public editorStateTracker: EditorStateTracker;
    public commLayer: CommunicationService;
    public channelCommLayer: ChannelCommunicationService;
    private at_bottom: boolean = false;
    private name:string = '';
    public hasName: boolean = false;
    public connected: boolean = false;
    private channelName:string;
    private channelID:string;
    public isObserver:boolean = false;

    public onGoLatest(e) {
        this.channelCommLayer.addAction({
            type: 'latest'
        });
    };

    public onSetVersion(e) {
        this.channelCommLayer.addAction({
            type: 'setVersion',
            range: e.range,
            file: e.file,
            version:e.version
        });
    };
    public onAddHighlight(e) {
        this.channelCommLayer.addAction({
            type: 'highlight',
            range: e.range,
            file: e.file,
            version:e.version
        });
    };
    public onRun(e) {
        this.channelCommLayer.addAction({
            type: 'run',
            editorValue: e.editorValue
        });
    };

    public setName(name:string): void {
        this.name = name;
        this.hasName = true;

        this.commLayer = new CommunicationService({
            username: this.name,
            host: window.location.host
            // host: 'localhost:8080',
        }, AceEditorWrapper);
        this.channelCommLayer = this.commLayer.createChannelWithName(this.channelName, this.channelID, this.isObserver);
        this.editorStateTracker = this.channelCommLayer.getEditorStateTracker();

        window['getChatDoc'] = () => {
            return this.channelCommLayer.getChatDoc();
        }

        this.channelCommLayer.ready().then((channel) => {
            this.connected = true;
        });
    };
    public getChatURL(): string {
        return 'chat.codes/' + this.channelName;
    };
    sendTextMessage(message: string): void {
        this.channelCommLayer.sendTextMessage(message);
    };
    updateTypingStatus(status: string): void {
        this.channelCommLayer.sendTypingStatus(status);
    };
    getActiveEditors() {
        return this.channelCommLayer.getActiveEditors();
    };
    public createNewFile():Promise<EditorState> {
        return this.channelCommLayer.ready().then(() => {
            return this.channelCommLayer.getShareDBEditors();
        }).then((editorsDoc) => {
            const id:string = guid();
            const title:string = 'file-'+(editorsDoc.data.length+1);
            return this.editorStateTracker.createEditor(id, title, '', 'Python', false);
        }).then((es:EditorState) => {
            this.codeEditor.selectFile(es);
            return es;
        });
    };
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
