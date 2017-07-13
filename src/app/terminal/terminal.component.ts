import {ViewChild, Component, EventEmitter, Output, Input} from '@angular/core';
import {PusherService} from '../pusher.service';
import * as Terminal from 'xterm';

@Component({
  selector: 'terminal',
  templateUrl: './terminal.component.html',
  styleUrls: ['./terminal.component.css'],
})

export class TerminalDisplay {
    constructor() { }
    ngOnInit() {
        Terminal.loadAddon('fit');  // Load the `fit` addon
        const term = new Terminal();

        term.open(this.terminalElement.nativeElement);

        term.fit();  // Make the terminal's size and geometry fit the size of #terminal-container

        term.write('$ ');
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
