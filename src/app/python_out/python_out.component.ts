import {ViewChild, Component, EventEmitter, Output, Input} from '@angular/core';
import * as Terminal from 'xterm';
import * as skulpt from 'skulpt';
import {EditorDisplay} from '../editor/editor.component';
import { CommunicationService, ChannelCommunicationService } from 'chat-codes-services/src/communication-service';

@Component({
    selector: 'python-output',
    templateUrl: './python_out.component.html',
    styleUrls: ['./python_out.component.css'],
})

export class PythonOutputDisplay {
    constructor() {
    }
    ngOnInit() {
        Terminal.loadAddon('fit');  // Load the `fit` addon
        this.term = new Terminal();
        this.term.open(this.terminalElement.nativeElement, false);
        this.term.fit();  // Make the terminal's size and geometry fit the size of #terminal-container
        // this.term.write('$ ');
    }
    run():void {
        const editorStateTracker = this.commLayer.getEditorStateTracker();
        function builtinRead(x) {
            if (skulpt.builtinFiles === undefined || skulpt.builtinFiles["files"][x] === undefined) {
                throw "File not found: '" + x + "'";
            }
            return skulpt.builtinFiles["files"][x];
        }
        skulpt.python3 = true;
        skulpt.configure({output:(text) => {
            this.term.write(text);
        }, read:builtinRead});

        const editorInstance = this.editor.getEditorInstance();
        const editorValue:string = editorInstance.getValue();

        this.onRun.emit({ editorValue });

        this.term.clear();
        this.term.reset();
        const myPromise = skulpt.misceval.asyncToPromise(function() {
            return skulpt.importMainWithBody("<stdin>", false, editorValue, true);
        });

        myPromise.then((mod) => {
        }, (err) => {
            this.term.writeln(err.toString());
        });
    }

    private term:Terminal;
    @Output() public onRun:EventEmitter<{editorValue:string}> = new EventEmitter();
    @Input() commLayer: ChannelCommunicationService;
    @Input() editor:EditorDisplay;
    @ViewChild('terminal') terminalElement;
}
