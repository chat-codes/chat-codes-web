import {ViewChild, Component, EventEmitter, Output, Input} from '@angular/core';
import {WebCommunicationService} from '../web-communication.service';
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

        term.open(this.terminalElement.nativeElement, false);

        term.fit();  // Make the terminal's size and geometry fit the size of #terminal-container

        term.write('$ ');
        term.on('data', (key) => {
          this.commLayer.writeToTerminal(key);
        });
        this.commLayer.terminalData.subscribe((event) => {
            term.write(event.data);
        });
    }
    @Input() commLayer: WebCommunicationService;
    @ViewChild('terminal') terminalElement;
}
