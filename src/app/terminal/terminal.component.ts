import {ViewChild, Component, EventEmitter, Output, Input} from '@angular/core';
import * as Terminal from 'xterm';
import { CommunicationService, ChannelCommunicationService } from 'chat-codes-services/src/communication-service';

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
        (this.commLayer as any).on('terminal-data', (event) => {
            term.write(event.data);
        });
    }
    @Input() commLayer: ChannelCommunicationService;
    @ViewChild('terminal') terminalElement;
}
