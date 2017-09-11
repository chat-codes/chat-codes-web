import {Component,Injectable,EventEmitter,ViewChild, Output} from '@angular/core';
import * as _ from 'underscore';

@Component({
    selector: 'name-entry',
    templateUrl: './name-entry.component.html',
    styleUrls: ['./name-entry.component.css'],
})

export class NameEntry {
    public ngOnInit() {
        const inpElem = this.inp.nativeElement;
        setTimeout(() => {
            inpElem.focus();
            inpElem.select();
        }, 100);
	}

    public valueChange(name:string):void {
        const value = name.trim();

        if(value.length === 0) {
            this.feedback = 'Must be more than 0 characters';
            this.feedbackClass = 'error';
        } else if(value.length > this.MAX_LENGTH) {
            this.feedback = 'Must be ' + this.MAX_LENGTH + ' characters or fewer';
            this.feedbackClass = 'error';
        } else {
            this.feedback = '';
            this.feedbackClass = '';
        }
    }

    public onKeydown(event):void {
        if(event.keyCode === 13) {
            this.doSubmit();
        }
    }

    public doSubmit() {
        const value = this.value.trim();
        if(value.length > 0 && value.length < this.MAX_LENGTH) {
            localStorage.setItem('default-username', value);
            this.onEnter.emit(value);
        }
    }

    @Output()
    public onEnter:EventEmitter<any> = new EventEmitter();
    public value:string = localStorage.getItem('default-username') || '';
    public feedback:string='';
    public feedbackClass:string='';
    private MAX_LENGTH = 20;
    @ViewChild('inp') inp;
}
