import {Injectable,EventEmitter} from '@angular/core';
import * as _ from 'underscore';
import { URLSearchParams } from '@angular/http';
import { ChatUserList, ChatUser } from './chat-user'
import { PusherCommunicationLayer } from './pusher-communication-layer';


function getAuthURL(userName) {
    let params = new URLSearchParams();
    params.set('name', userName); // the user's search value
	return 'http://chat.codes/auth.php?'+params.toString();
}

@Injectable()
export class PusherService {
    constructor(private userName:string, private channelName:string) {
        this.commLayer = new PusherCommunicationLayer({
            username: userName
        });
        this.channelName = channelName;
        this.commLayer.bind(this.channelName, 'terminal-data', (event) => {
            this.terminalData.emit(event);
        });
        this.commLayer.bind(this.channelName, 'message', (data) => {
            this.message.emit(_.extend({
                sender: this.userList.getUser(data.uid)
            }, data));
        });
        this.commLayer.bind(this.channelName, 'message-history', (data) => {
            if(data.forUser === this.myID) {
                _.each(data.allUsers, (u) => {
                    this.userList.add(false, u.id, u.name, u.active);
                });
                _.each(data.history, (m) => {
                    this.message.emit(_.extend({
                        sender: this.userList.getUser(m.uid)
                    }, m));
                });
            }
        });
    	this.commLayer.bind(this.channelName, 'typing', (data) => {
            const {uid, status} = data;
            const user = this.userList.getUser(uid);

            if(user) {
                user.setTypingStatus(status);
            }
    	});
        this.commLayer.bind(this.channelName, 'editor-event', (data) => {
            this.editorEvent.emit(data);
        });
        this.commLayer.bind(this.channelName, 'cursor-event', (data) => {
            this.cursorEvent.emit(data);
        });
    	this.commLayer.bind(this.channelName, 'editor-state', (data) => {
            this.editorState.emit(data);
    	});
    	this.commLayer.bind(this.channelName, 'editor-opened', (data) => {
            this.editorOpened.emit(data);
    	});

    	// this.channel.bind('client-editor-shared', (data) => {
        //     this.editorShared.emit(data);
    	// });
        // this.channel.bind('client-editor-destroyed', (data) => {
        //     this.editorDestroyed.emit(data);
    	// });
    	// this.channel.bind('client-editor-title-changed', (data) => {
        //     this.editorTitleChanged.emit(data);
    	// });
    	// this.channel.bind('client-editor-changed', (data) => {
        //     this.editorChanged.emit(data);
    	// });
    	// this.channel.bind('client-editor-grammar-changed', (data) => {
        //     this.editorGrammarChanged.emit(data);
    	// });
    	// this.channel.bind('client-cursor-destroyed', (data) => {
        //     this.cursorDestroyed.emit(data);
    	// });
    	// this.channel.bind('client-cursor-changed-position', (data) => {
        //     this.cursorChangedPosition.emit(data);
    	// });
        this.commLayer.getMembers(this.channelName).then((memberInfo) => {
            this.myID = memberInfo.myID;
            this.userList.addAll(memberInfo);
        });

        this.commLayer.onMemberAdded(this.channelName, (member) => {
            this.userList.add(false, member.id, member.info.name);
        });
        this.commLayer.onMemberRemoved(this.channelName, (member) => {
            this.userList.remove(member.id);
        });
    }
    public sendTextMessage(message:string):void {
        const data = {
            uid: this.myID,
            type: 'text',
            message: message,
            timestamp: this.getTimestamp()
        };

        this.commLayer.trigger(this.channelName, 'message', data);
        this.message.emit(_.extend({
            sender: this.userList.getMe()
        }, data));
    }
    public sendTypingStatus(status:string):void {
        const data = {
            uid: this.myID,
            type: 'status',
            status: status,
            timestamp: this.getTimestamp()
        };
        const meUser = this.userList.getMe();

        this.commLayer.trigger(this.channelName, 'typing', data);
        this.typingStatus.emit(_.extend({
            sender: this.userList.getMe()
        }, data));

        if(meUser) {
            meUser.setTypingStatus(status);
        }
    }
    public emitEditorChanged(delta) {
        this.commLayer.trigger(this.channelName, 'editor-event', _.extend({
			timestamp: this.getTimestamp(),
			remote: true
		}, delta));
    }

    public writeToTerminal(data) {
        this.commLayer.trigger(this.channelName, 'write-to-terminal', {
			timestamp: this.getTimestamp(),
			remote: true,
            contents: data
		});
    }

    public membersChanged: EventEmitter<any> = new EventEmitter();
    public message: EventEmitter<any> = new EventEmitter();
    public typingStatus: EventEmitter<any> = new EventEmitter();
    public editorEvent: EventEmitter<any> = new EventEmitter();
    public cursorEvent: EventEmitter<any> = new EventEmitter();
    public editorState: EventEmitter<any> = new EventEmitter();
    public editorOpened: EventEmitter<any> = new EventEmitter();
    // public editorShared: EventEmitter<any> = new EventEmitter();
    // public editorDestroyed: EventEmitter<any> = new EventEmitter();
    // public editorTitleChanged: EventEmitter<any> = new EventEmitter();
    // public editorChanged: EventEmitter<any> = new EventEmitter();
    // public editorGrammarChanged: EventEmitter<any> = new EventEmitter();
    // public cursorDestroyed: EventEmitter<any> = new EventEmitter();
    // public cursorChangedPosition: EventEmitter<any> = new EventEmitter();
    public terminalData: EventEmitter<any> = new EventEmitter();

    public userList:ChatUserList = new ChatUserList();

    private commLayer:PusherCommunicationLayer;
    private myID:string;
    private getTimestamp():number {
        return new Date().getTime();
    }
}
