import {Component,Injectable,EventEmitter,Output,Input,ViewChild} from '@angular/core';
import * as _ from 'underscore';
import * as $ from 'jquery';
import {MessageGroups} from 'chat-codes-services/src/chat-messages';
import {EditorStateTracker} from 'chat-codes-services/src/editor-state-tracker';


@Component({
  selector: 'chat-message',
  templateUrl: './single-message.component.html',
  styleUrls: ['./single-message.component.css'],
})

export class ChatMessageDisplay {
    @Input() editorStateTracker:EditorStateTracker;
    @Input() message;
    @ViewChild('elem') elem;
    ngAfterViewInit() {
      const $elem = $(this.elem.nativeElement);
      $elem.html(this.message.html);
  		// if(this.message.editorID) {
  		// 	$elem.append($('<a />').attr({
  		// 		'data-file': this.message.editorID,
  		// 		'data-start': '1,1',
  		// 		'data-end': '2,2',
  		// 		'href': 'javascript:void(0)'
  		// 	}).addClass('line_ref').text('LINK'));
  		// }

  		$('a.line_ref', $elem).on('mouseenter', (me_event) => {
  			const {file, range} = this.getHighlightInfo(me_event.target);
  			const highlightID = this.addHighlight(file, range);
  			$(me_event.target).on('mouseleave.removeHighlight', (ml_event) => {
  				this.removeHighlight(file, highlightID);
  				$(me_event.target).off('mouseleave.removeHighlight');
  			});
          }).on('click', (c_event) => {
  			const {file, range} = this.getHighlightInfo(c_event.target);
  			this.focusRange(file, range);
  		});
    }
  	private getHighlightInfo(elem) {
  		const $elem = $(elem);
  		const start = $elem.attr('data-start');
  		const end = $elem.attr('data-end');
  		return {
  			file: $elem.attr('data-file'),
  			range: {
  				start: _.map(start.split(','), x => parseInt(x)),
  				end: _.map(end.split(','), x => parseInt(x))
  			}
  		};
  	}
  	private addHighlight(editorID, range) {
  		return this.editorStateTracker.addHighlight(editorID, range);
  	}
  	private removeHighlight(editorID, highlightID) {
  		return this.editorStateTracker.removeHighlight(editorID, highlightID);
  	}

    @Output() selectFileEmitter = new EventEmitter<any>();
  	private focusRange(editorID, range) {
  		var editorState = this.editorStateTracker.focus(editorID, range);
      console.log(editorState);
      this.selectFileEmitter.emit(editorState);    
  	}

}
