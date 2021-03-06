declare let ace: any;

export class RemoteCursorMarker {
    constructor(session) {
		this.session = session;
	}
	private clazz:string='remoteCursor';
	private session;
	private cursors:{[cursorID:number]:any} = {};
    // Cursor positions will be drawn on screen using the update() method, so just
    // add it to my list of cursors and invalidate the back marker layer
	public updateCursor(id, user, pos) {
		if(this.cursors[id]) {
			this.cursors[id].pos = pos;
		} else {
			this.cursors[id] = {pos: pos, user: user};
		}
		this.session._signal("changeBackMarker");
	};
    // Selections are represented by markers
	public updateSelection(id, user, range) {
		const markerID = this.session.addMarker(range, this.clazz + (user? ' user-'+user.colorIndex : ''), false);
		if(this.cursors[id]) {
			if(this.cursors[id].markerID) {
				this.session.removeMarker(this.cursors[id].markerID);
			}
		} else {
			this.cursors[id] = { user: user };
		}
		this.cursors[id].markerID = markerID;
	};
    public update(html, markerLayer, session, config)  {
	    var start = config.firstRow, end = config.lastRow;
		Object.keys(this.cursors).forEach((cursorID) => {
			const cursorInfo = this.cursors[cursorID];
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
	                "<div class='carret "+this.clazz+(cursorInfo.user ? ' user-'+cursorInfo.user.colorIndex:'')+"' style='",
	                "height:", height, "px;",
	                "top:", top, "px;",
	                "left:", left, "px;", width, "px'></div>"
	            );
	        }
		});
    }
}
