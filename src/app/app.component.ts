import { Component, Input, ViewEncapsulation, ViewChild, OnInit } from '@angular/core';
import { WebCommunicationService } from './web-communication.service';
import { Location } from '@angular/common';
import * as _ from 'underscore';
import * as $ from 'jquery';
import * as showdown from 'showdown';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css', '../../node_modules/bootstrap/dist/css/bootstrap.css', '../../node_modules/xterm/dist/xterm.css'],
    encapsulation: ViewEncapsulation.None,
})

export class AppComponent implements OnInit {
    ngOnInit() { }

    private message: String;
    @ViewChild('chatinput') private chatinput;

    editorCursorSelectionChanged(data) {
        this.chatinput.onEditorCursorSelectionChanged(data);
    }

    constructor() {
        const channelName = Location.stripTrailingSlash(location.pathname.substring(1));
        if (channelName) {
            this.channelName = channelName;
        }
        this.setName('remote');
    };

    private commLayer: WebCommunicationService;
    private at_bottom: boolean = false;

    public setName(name:string): void {
        this.hasName = true;
        this.name = name;

        this.commLayer = new WebCommunicationService(this.name, this.channelName);
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
    public createNewFile() {
        this.commLayer.ready().then(() => {
            const id:string = guid();
            const title:string = 'file-'+editorTitle;
            editorTitle++;
            this.commLayer.channelService.emitEditorOpened({
                id: id
            });
    		const openDelta =  {
    			type: 'open',
    			id: id,
    			contents: '',
    			grammarName: 'None',
    			title: title,
    			modified: false
    		};
            this.commLayer.channelService.emitEditorChanged(openDelta);
        });
    };
    private name:string = '';
    public hasName: boolean = false;
    public connected: boolean = false;
    private channelName:string = 'example_channel';
    @ViewChild('codeEditor') codeEditor;
}

let editorTitle:number = 1;

function guid():string {
    function s4():string {
        return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
}
