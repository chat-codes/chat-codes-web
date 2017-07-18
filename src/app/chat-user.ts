import * as _ from 'underscore';

const NUM_COLORS = 4;

export class ChatUserList {
    public activeUsers:Array<ChatUser>=[];
    public allUsers:Array<ChatUser>=[];
    public addAll(memberInfo) {
        const myID = memberInfo.myID;
        _.each(memberInfo.members, (memberInfo, id) => {
            this.add(id===myID, id, memberInfo.name);
        });
    }
    public add(isMe:boolean, id:string, name:string, active:boolean=true):ChatUser {
        var user = this.hasUser(id);
        if(!user) {
            user = new ChatUser(isMe, id, name, active);
            if(active) {
                this.activeUsers.push(user);
            }
            this.allUsers.push(user);
        }
        return user;
    }
    public hasUser(id:string) {
        for(var i = 0; i<this.allUsers.length; i++) {
            var id_i = this.allUsers[i].id;
            if(id_i === id) {
                return this.allUsers[i];
            }
        }
        return false;
    }

    public remove(id:string) {
        for(var i = 0; i<this.activeUsers.length; i++) {
            var id_i = this.activeUsers[i].id;
            if(id_i === id) {
                this.activeUsers[i].active = false;
                this.activeUsers.splice(i, 1);
                break;
            }
        }
    }

    public getUser(id) {
        for(var i = 0; i<this.allUsers.length; i++) {
            var id_i = this.allUsers[i].id;
            if(id_i === id) {
                return this.allUsers[i];
            }
        }
        return false;
    }
    public getMe() {
        for(var i = 0; i<this.allUsers.length; i++) {
            if(this.allUsers[i].isMe) {
                return this.allUsers[i];
            }
        }
        return false;
    }
}

let current_user_color:number = 2;
export class ChatUser {
    constructor(public isMe:boolean, public id:string, public name:string, public active:boolean) {
        this.colorIndex = isMe ? 1 : current_user_color;
        current_user_color = 2+((current_user_color+1)%NUM_COLORS);
    }
    public colorIndex:number;
    public typingStatus:string='IDLE';
    public setTypingStatus(status:string) {
        this.typingStatus = status;
    }
}