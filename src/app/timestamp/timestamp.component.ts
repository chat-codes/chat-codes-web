import {ViewChild, Component, Output, Input} from '@angular/core';
@Component({
    selector: 'timestamp',
    templateUrl: './timestamp.component.html',
    styleUrls: [],
})

export class TimestampDisplay {
    constructor() { }
    @Input() t:number;
    @Input() parens:boolean=false;
}
