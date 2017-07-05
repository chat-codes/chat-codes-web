import {ViewChild, Component, EventEmitter, Output, Input} from '@angular/core';
import {PusherService} from '../pusher.service';
import * as Terminal from 'xterm';

@Component({
  selector: 'terminal',
  templateUrl: './terminal.component.html',
  styleUrls: ['./xterm.css'],
})

export class TerminalDisplay {
    constructor() { }
    ngOnInit() {
        const term = new Terminal();
        term.open(this.terminalElement.nativeElement);
        term.write('$');
        term.on('data', (key) => {
          this.pusher.writeToTerminal(key);
        });
        this.pusher.terminalData.subscribe((event) => {
            term.write(event.data);
        });
    }
    @Input() pusher: PusherService;
    @ViewChild('terminal') terminalElement;
}
