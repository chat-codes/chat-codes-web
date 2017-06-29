import {Component, EventEmitter, Output, Input} from '@angular/core';
import {ChatUser} from '../chat-user';

@Component({
  selector: 'user-display',
  templateUrl: './user-display.component.html',
  styleUrls: [],
})
export class UserDisplay {
    @Input() user: ChatUser;
}