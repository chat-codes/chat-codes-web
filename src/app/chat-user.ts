import * as _ from 'underscore';

export class ChatUserList {
    public users:Array<ChatUser>=[];
    public addAll(memberInfo) {
        const myID = memberInfo.myID;
        _.each(memberInfo.members, (memberInfo, id) => {
            this.add(id===myID, id, memberInfo.name);
        });
    }
    public add(isMe:boolean, id:string, name:string):ChatUser {
        const user = new ChatUser(isMe, id, name);
        this.users.push(user);
        return user;
    }

    public remove(id:string) {
        for(var i = 0; i<this.users.length; i++) {
            var id_i = this.users[i].id;
            if(id_i === id) {
                this.users.splice(i, 1);
                break;
            }
        }
    }

    private hasMember(id):boolean {
        return _.any(this.users, function(u) {
            return u.id === id;
        })
    }
    public getUser(id) {
        for(var i = 0; i<this.users.length; i++) {
            var id_i = this.users[i].id;
            if(id_i === id) {
                return this.users[i];
            }
        }
        return false;
    }
    public getMe() {
        for(var i = 0; i<this.users.length; i++) {
            if(this.users[i].isMe) {
                return this.users[i];
            }
        }
        return false;
    }
}

export class ChatUser {
    constructor(public isMe:boolean, public id:string, public name:string) {

    }
    public typingStatus:string='IDLE';
    public setTypingStatus(status:string) {
        this.typingStatus = status;
    }
}