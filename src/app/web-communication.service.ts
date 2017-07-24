import {Injectable,EventEmitter} from '@angular/core';
import * as _ from 'underscore';
import { CommunicationService } from 'chat-codes-services/src/communication-service';
import { ChatUserList, ChatUser } from 'chat-codes-services/src/chat-user';
import { PusherCommunicationLayer } from 'chat-codes-services/src/pusher-communication-layer';
import { MessageGroups, MessageGroup } from 'chat-codes-services/src/chat-messages';
import { CREDENTIALS } from './pusher-credentials';


@Injectable()
export class WebCommunicationService {
    constructor(private userName:string, private channelName:string) {
        this.commService = new CommunicationService(userName, channelName, CREDENTIALS.key, CREDENTIALS.cluster);
        (this.commService as any).on('members-changed', (e) => { this.membersChanged.emit(e); });
        (this.commService as any).on('message', (e) => { this.message.emit(e); });
        (this.commService as any).on('typing-status', (e) => { this.typingStatus.emit(e); });
        (this.commService as any).on('editor-event', (e) => { this.editorEvent.emit(e); });
        (this.commService as any).on('cursor-event', (e) => { this.cursorEvent.emit(e); });
        (this.commService as any).on('editor-state', (e) => { this.editorState.emit(e); });
        (this.commService as any).on('editor-opened', (e) => { this.editorOpened.emit(e); });
        (this.commService as any).on('terminal-data', (e) => { this.terminalData.emit(e); });

        this.userList = this.commService.userList;
        this.messageGroups = this.commService.messageGroups;
    }
    private commService:CommunicationService;
    public ngOnDestroy() {
        this.commService.destroy();
    }
    public ready() { return this.commService.ready(); };
    public sendTextMessage(data) { this.commService.sendTextMessage(data); };
    public sendTypingStatus(data) { this.commService.sendTypingStatus(data); };
    public emitEditorChanged(data) { this.commService.emitEditorChanged(data); };
    public emitCursorPositionChanged(data) { this.commService.emitCursorPositionChanged(data); };
    public emitCursorSelectionChanged(data) { this.commService.emitCursorSelectionChanged(data); };
    public writeToTerminal(data) { this.commService.writeToTerminal(data); };


    public membersChanged: EventEmitter<any> = new EventEmitter();
    public message: EventEmitter<any> = new EventEmitter();
    public typingStatus: EventEmitter<any> = new EventEmitter();
    public editorEvent: EventEmitter<any> = new EventEmitter();
    public cursorEvent: EventEmitter<any> = new EventEmitter();
    public editorState: EventEmitter<any> = new EventEmitter();
    public editorOpened: EventEmitter<any> = new EventEmitter();
    public terminalData: EventEmitter<any> = new EventEmitter();

    public userList:ChatUserList;
    public messageGroups:MessageGroups;

    private commLayer:PusherCommunicationLayer;
    private myID:string;
    private getTimestamp():number {
        return new Date().getTime();
    }
}
// @Injectable()
// export class WebCommunicationService {
//     constructor(private userName:string, private channelName:string) {
//         this.commLayer = new PusherCommunicationLayer({
//             username: userName
//         }, CREDENTIALS.key, CREDENTIALS.cluster);
//         this.channelName = channelName;
//         this.commLayer.bind(this.channelName, 'terminal-data', (event) => {
//             this.terminalData.emit(event);
//         });
//         this.commLayer.bind(this.channelName, 'message', (data) => {
//             this.message.emit(_.extend({
//                 sender: this.userList.getUser(data.uid)
//             }, data));
//         });
//         this.commLayer.bind(this.channelName, 'message-history', (data) => {
//             if(data.forUser === this.myID) {
//                 _.each(data.allUsers, (u) => {
//                     this.userList.add(false, u.id, u.name, u.active);
//                 });
//                 _.each(data.history, (m) => {
//                     this.message.emit(_.extend({
//                         sender: this.userList.getUser(m.uid)
//                     }, m));
//                 });
//             }
//         });
//     	this.commLayer.bind(this.channelName, 'typing', (data) => {
//             const {uid, status} = data;
//             const user = this.userList.getUser(uid);
//
//             if(user) {
//                 user.setTypingStatus(status);
//             }
//     	});
//         this.commLayer.bind(this.channelName, 'editor-event', (data) => {
//             this.editorEvent.emit(data);
//         });
//         this.commLayer.bind(this.channelName, 'cursor-event', (data) => {
//             this.cursorEvent.emit(data);
//         });
//     	this.commLayer.bind(this.channelName, 'editor-state', (data) => {
//             this.editorState.emit(data);
//     	});
//     	this.commLayer.bind(this.channelName, 'editor-opened', (data) => {
//             this.editorOpened.emit(data);
//     	});
//
//     	// this.channel.bind('client-editor-shared', (data) => {
//         //     this.editorShared.emit(data);
//     	// });
//         // this.channel.bind('client-editor-destroyed', (data) => {
//         //     this.editorDestroyed.emit(data);
//     	// });
//     	// this.channel.bind('client-editor-title-changed', (data) => {
//         //     this.editorTitleChanged.emit(data);
//     	// });
//     	// this.channel.bind('client-editor-changed', (data) => {
//         //     this.editorChanged.emit(data);
//     	// });
//     	// this.channel.bind('client-editor-grammar-changed', (data) => {
//         //     this.editorGrammarChanged.emit(data);
//     	// });
//     	// this.channel.bind('client-cursor-destroyed', (data) => {
//         //     this.cursorDestroyed.emit(data);
//     	// });
//     	// this.channel.bind('client-cursor-changed-position', (data) => {
//         //     this.cursorChangedPosition.emit(data);
//     	// });
//         this.commLayer.getMembers(this.channelName).then((memberInfo) => {
//             this.myID = memberInfo.myID;
//             this.userList.addAll(memberInfo);
//         });
//
//         this.commLayer.onMemberAdded(this.channelName, (member) => {
//             this.userList.add(false, member.id, member.info.name);
//         });
//         this.commLayer.onMemberRemoved(this.channelName, (member) => {
//             this.userList.remove(member.id);
//         });
//         this.message.subscribe((data) => {
//           this.messageGroups.addMessage(data);
//         });
//     }
//     public ready() {
//         return this.commLayer.channelReady(this.channelName);
//     }
//     public emitSave(data) {
//         this.message.emit(_.extend({
//             sender: this.userList.getMe(),
//             timestamp: this.getTimestamp()
//         }, data));
//     }
//
//     public sendTextMessage(message:string):void {
//         const data = {
//             uid: this.myID,
//             type: 'text',
//             message: message,
//             timestamp: this.getTimestamp()
//         };
//
//         this.commLayer.trigger(this.channelName, 'message', data);
//         this.message.emit(_.extend({
//             sender: this.userList.getMe()
//         }, data));
//     }
//     public sendTypingStatus(status:string):void {
//         const data = {
//             uid: this.myID,
//             type: 'status',
//             status: status,
//             timestamp: this.getTimestamp()
//         };
//         const meUser = this.userList.getMe();
//
//         this.commLayer.trigger(this.channelName, 'typing', data);
//         this.typingStatus.emit(_.extend({
//             sender: this.userList.getMe()
//         }, data));
//
//         if(meUser) {
//             meUser.setTypingStatus(status);
//         }
//     }
//     public emitEditorChanged(delta) {
//         this.commLayer.trigger(this.channelName, 'editor-event', _.extend({
// 			timestamp: this.getTimestamp(),
//             uid: this.myID,
// 			remote: true
// 		}, delta));
//     }
//
//     public emitCursorPositionChanged(delta) {
//         this.commLayer.trigger(this.channelName, 'cursor-event', _.extend({
// 			timestamp: this.getTimestamp(),
//             uid: this.myID,
// 			remote: true
// 		}, delta));
//     }
//     public emitCursorSelectionChanged(delta) {
//         this.commLayer.trigger(this.channelName, 'cursor-event', _.extend({
// 			timestamp: this.getTimestamp(),
//             uid: this.myID,
// 			remote: true
// 		}, delta));
//     }
//
//     public writeToTerminal(data) {
//         this.commLayer.trigger(this.channelName, 'write-to-terminal', {
// 			timestamp: this.getTimestamp(),
//             uid: this.myID,
// 			remote: true,
//             contents: data
// 		});
//     }
//
//     public ngOnDestroy() {
//         this.commLayer.destroy();
//     }
//
//
//     public membersChanged: EventEmitter<any> = new EventEmitter();
//     public message: EventEmitter<any> = new EventEmitter();
//     public typingStatus: EventEmitter<any> = new EventEmitter();
//     public editorEvent: EventEmitter<any> = new EventEmitter();
//     public cursorEvent: EventEmitter<any> = new EventEmitter();
//     public editorState: EventEmitter<any> = new EventEmitter();
//     public editorOpened: EventEmitter<any> = new EventEmitter();
//     public terminalData: EventEmitter<any> = new EventEmitter();
//
//     public userList:ChatUserList = new ChatUserList();
//     public messageGroups:MessageGroups = new MessageGroups(this.userList);
//
//     private commLayer:PusherCommunicationLayer;
//     private myID:string;
//     private getTimestamp():number {
//         return new Date().getTime();
//     }
// }
