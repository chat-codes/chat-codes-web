import {ViewChild, Component, EventEmitter, Output, Input} from '@angular/core';
import { ChatUser } from 'chat-codes-services/src/chat-user';

@Component({
    selector: 'user-display',
    templateUrl: './user-display.component.html',
    styleUrls: ['./user-display.component.css'],
})
export class UserDisplay {
    public typingStatus:string = 'IDLE'
    ngOnInit() {
        this.typingStatus = this.user.getTypingStatus();
        (this.user as any).on('typingStatus', (status) => {
            setTimeout(() => {
                this.typingStatus = this.user.getTypingStatus();
            }, 0);
        });
    }
    @Input() user: ChatUser;
}