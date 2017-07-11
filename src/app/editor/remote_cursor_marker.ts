import * as _ from 'underscore';
declare let ace: any;

export class RemoteCursorMarker {
    constructor(session) {
		this.session = session;
	}
	private clazz:string='remoteCursor';
	private session;
	private cursors:{[cursorID:number]:any} = {};
	public updateCursor(id, pos, range) {
		if(_.has(this.cursors, id)) {
			this.cursors[id].pos = pos;
		} else {
			this.cursors[id] = {pos: pos};
		}
		this.session._signal("changeBackMarker");
	};
	public updateSelection(id, range) {
		const markerID = this.session.addMarker(range, this.clazz, false);
		if(_.has(this.cursors, id)) {
			if(this.cursors[id].markerID) {
				this.session.removeMarker(this.cursors[id].markerID);
			}
		} else {
			this.cursors[id] = {};
		}
		_.extend(this.cursors[id], {
			markerID: markerID
		});
	};
    public update(html, markerLayer, session, config)  {
	    var start = config.firstRow, end = config.lastRow;
		_.each(this.cursors, (cursorInfo) => {
			const {pos} = cursorInfo;
	        if (pos.row < start || pos.row > end) {
	            return;
	        } else {
	            // compute cursor position on screen
	            // this code is based on ace/layer/marker.js
	            var screenPos = session.documentToScreenPosition(pos)

	            var height = config.lineHeight;
	            var width = config.characterWidth;
	            var top = markerLayer.$getTop(screenPos.row, config);
	            var left = markerLayer.$padding + screenPos.column * width;
	            // can add any html here
	            html.push(
	                "<div class='carret "+this.clazz+"' style='",
	                "height:", height, "px;",
	                "top:", top, "px;",
	                "left:", left, "px;", width, "px'></div>"
	            );
	        }
		});
    }
}
