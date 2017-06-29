import {Component,Injectable,EventEmitter,Output} from '@angular/core';
import * as _ from 'underscore';

@Component({
  selector: 'name-entry',
  templateUrl: './name-entry.component.html',
  styleUrls: [],
})

export class NameEntry {
  private valueChange(name:string) {
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
  private onKeydown(event) {
    if(event.keyCode === 13) {
      const value = this.value.trim();
      if(value.length > 0 && value.length < this.MAX_LENGTH) {
        this.onEnter.emit(value);
      }
    }
  }
  @Output()
  public onEnter:EventEmitter<any> = new EventEmitter();
  private value:string;
  private feedback:string='';
  private feedbackClass:string='';
  private MAX_LENGTH = 20;
}
