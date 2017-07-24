import {ViewChild, Component, EventEmitter, Output, Input} from '@angular/core';
import { ChatUser } from 'chat-codes-services/src/chat-user';

@Component({
  selector: 'user-display',
  templateUrl: './user-display.component.html',
  styleUrls: ['./user-display.component.css'],
})
export class UserDisplay {
    ngOnInit() { }
    @Input() user: ChatUser;
}