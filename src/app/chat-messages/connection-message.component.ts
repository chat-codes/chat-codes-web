import {Component,Injectable,EventEmitter,Output,Input,ViewChild} from '@angular/core';
import * as _ from 'underscore';
import * as $ from 'jquery';
import {MessageGroups, EditGroup, ConnectionMessageGroup} from 'chat-codes-services/src/chat-messages';
import {ChatUser} from 'chat-codes-services/src/chat-user';

@Component({
    selector: 'connection-message-group',
    templateUrl: './connection-message.component.html',
    styleUrls: ['./connection-message.component.css'],
})

export class ConnectionMessageDisplay {
    @Input() messageGroup:ConnectionMessageGroup;

    public users:Array<ChatUser> = [];
    public numUsers:number = 0;
    public action:string = '';

    ngAfterViewInit() {
        setTimeout(() => { this.updateVariables(); }, 0);
        
		(this.messageGroup as any).on('item-added', () => {
            this.updateVariables();
        });

		(this.messageGroup as any).on('delta-added', () => {
            this.updateVariables();
        });
    }
    private updateVariables():void {
        this.users = this.messageGroup.getUsers();
        this.numUsers = this.users.length;
        this.action = this.messageGroup.isConnect() ? 'connected':'disconnected';
    }
}
