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
    @Input() timestamp;
    @ViewChild('elem') elem;

    private getHighlightInfo(elem) {
      const $elem = $(elem);
      console.log($elem);
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
        //const middleLine = range
        if(this.redoFlag){
          this.undoDelta(file);
          this.undoFlag = true;
        }
        //this.undoDelta(timestamp);
  			$(me_event.target).on('mouseleave.removeHighlight', (ml_event) => {
  				this.removeHighlight(file, highlightID);
          if(this.undoFlag){
            this.redoDelta(file);
            this.undoFlag = false;
          }
  				$(me_event.target).off('mouseleave.removeHighlight');
  			});
          }).on('click', (c_event) => {
            this.redoFlag = false;
            this.undoFlag = false;
  			const {file, range} = this.getHighlightInfo(c_event.target);
        setTimeout(() => {
    			this.redoFlag = true;
    		}, 2000);
  			this.focusRange(file, range);
  		});
    }
    private redoFlag = true;
    private undoFlag = false;

  	private addHighlight(editorID, range) {
  		return this.editorStateTracker.addHighlight(editorID, range);
  	}
    private undoDelta(editorID){
      return this.editorStateTracker.undoDelta(editorID, this.timestamp);
    }

    private redoDelta(editorID){
      return this.editorStateTracker.redoDelta(editorID, this.timestamp);
    }

  	private removeHighlight(editorID, highlightID) {
  		return this.editorStateTracker.removeHighlight(editorID, highlightID);
  	}

    @Output() selectFileEmitter = new EventEmitter<any>();
    @Output() scrollToLineEmitter = new EventEmitter<any>();
  	private focusRange(editorID, range) {
  		var editorState = this.editorStateTracker.focus(editorID, range, this.timestamp);
      console.log(editorState);
      this.selectFileEmitter.emit(editorState);
      const middleLine = Math.round( (range.start[0] + range.end[0])/2 );
      this.scrollToLineEmitter.emit(middleLine);
  	}

}
