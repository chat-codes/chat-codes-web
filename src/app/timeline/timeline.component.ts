import {ViewChild, Component, EventEmitter, Output, Input} from '@angular/core';
// import * as snapsvg from 'snapsvg';
// import * as Snap from 'imports-loader?this=>window,fix=>module.exports=0!snapsvg/dist/snap.svg.js';
// var Snap = require( "imports-loader?this=>window,fix=>module.exports=0!snapsvg/dist/snap.svg.js" );
import "snapsvg-cjs";
declare var Snap: any;


@Component({
  selector: 'timeline-display',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.css'],
})
export class TimelineDisplay {
    ngOnInit() {
      // this.userElement.classList.add('user-'+this.user.colorIndex);
    //   this.createSvg();
    }
    private topTimestamp:number;
    private bottomTimestamp:number;
    private createSvg():void {
      this.svgCanvas = new Snap(this.svgElement.nativeElement);
      this.chatLine = this.svgCanvas.line(0,0,0,0);
      this.chatLine.attr({
        stroke: "red",
        strokeWidth: 5,
        'stroke-linecap': 'round'
      });

      this.editorLine = this.svgCanvas.line(0,0,0,0);
      this.editorLine.attr({
        stroke: "blue",
        strokeWidth: 5,
        'stroke-linecap': 'round'
      });

      let circ = this.svgCanvas.circle(22, 30, 10);
      circ.attr({
        fill: "white",
        stroke: "blue",
        strokeWidth: 5
      });
      let circ2 = this.svgCanvas.circle(43, 30, 10);
      circ2.attr({
        fill: "white",
        stroke: "red",
        strokeWidth: 5
      });

      this.latestTimestamp = this.svgCanvas.text(50, 50, "L");
      this.earliestTimestamp = this.svgCanvas.text(50, 50, "E");
      this.earliestTimestamp.attr({
        'text-anchor': 'middle'
      });
      this.latestTimestamp.attr({
        'text-anchor': 'middle'
      });

      this.updateDrawing();
    }
    private onResize(event) {
      this.updateDrawing();
    }
    @ViewChild('svg') svgElement;
    private svgCanvas;
    private chatLine;
    private editorLine;
    private earliestTimestamp;
    private latestTimestamp;
    private updateDrawing() {
      const {clientWidth, clientHeight} = this.svgElement.nativeElement;
      const chatX = 3*clientWidth/4;
      const editorX = clientWidth/4;
      this.chatLine.attr({
        x1: chatX,
        x2: chatX,
        y1: 0,
        y2: clientHeight
      });
      this.editorLine.attr({
        x1: editorX,
        x2: editorX,
        y1: 0,
        y2: clientHeight
      });
      this.latestTimestamp.attr({
        x: clientWidth/2,
        y: clientHeight - 10
      });
      this.earliestTimestamp.attr({
        x: clientWidth/2,
        y: 15
      });
    }
}
