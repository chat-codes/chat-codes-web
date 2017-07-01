import {Injectable,EventEmitter} from '@angular/core';
import {CREDENTIALS} from './pusher-credentials';
import * as Pusher from 'pusher-js';
import * as _ from 'underscore';
import { URLSearchParams } from '@angular/http';
import { ChatUserList, ChatUser } from './chat-user'


function getAuthURL(userName) {
    let params = new URLSearchParams();
    params.set('name', userName); // the user's search value
	return 'http://chat.codes/auth.php?'+params.toString();
}

@Injectable()
export class PusherService {
    constructor(private userName:string, private channelName:string) {
        this.pusher = new Pusher(CREDENTIALS.key, {
    		cluster: CREDENTIALS.cluster,
    		encrypted: true,
    		authEndpoint: getAuthURL(this.userName)
        });
        this.channel = this.pusher.subscribe('private-'+this.channelName)
    	this.channel.bind('client-message', (data) => {
            this.message.emit(_.extend({
                sender: this.userList.getUser(data.uid)
            }, data));
    	});
        this.channel.bind('client-message-history', (data) => {
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
    	this.channel.bind('client-typing', (data) => {
            const {uid, status} = data;
            const user = this.userList.getUser(uid);

            if(user) {
                user.setTypingStatus(status);
            }
    	});

        this.presenceChannel = this.pusher.subscribe('presence-'+this.channelName);
        this.myID = this.presenceChannel.members.myID;

        if(this.presenceChannel.subscribed) {
            this.myID = this.presenceChannel.members.myID;
            this.userList.addAll(this.presenceChannel.members.members);
        } else {
            this.presenceChannel.bind('pusher:subscription_succeeded', (members) => {
                this.myID = members.myID;
                this.userList.addAll(members);
            });
        }

        this.presenceChannel.bind('pusher:member_added', (member) => {
            this.userList.add(false, member.id, member.info.name);
        });
        this.presenceChannel.bind('pusher:member_removed', (member) => {
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

        this.channel.trigger('client-message', data);
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

        this.channel.trigger('client-typing', data);
        this.typingStatus.emit(_.extend({
            sender: this.userList.getMe()
        }, data));

        if(meUser) {
            meUser.setTypingStatus(status);
        }
    }

    public membersChanged: EventEmitter<any> = new EventEmitter();
    public message: EventEmitter<any> = new EventEmitter();
    public typingStatus: EventEmitter<any> = new EventEmitter();
    public userList:ChatUserList = new ChatUserList();

    private pusher:Pusher;
    private myID:string;
    private channel;
    private presenceChannel;
    private getTimestamp():number {
        return new Date().getTime();
    }
}
