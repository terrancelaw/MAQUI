DraggableRecordAttrTag = {
	hasDragged: null,
	deletingPanelID: null,
	deletingForSID: null,

	show: function(top, left, text) {
		$("#draggable-record-attribute-tag")
			.css("display", "block")
			.css("top", top)
			.css("left", left)
			.css("transform", "translate(-50%, -50%)")
			.html(text);
	},
	move: function(top, left) {
		$("#draggable-record-attribute-tag")
			.css("top", top)
			.css("left", left);
	},
	hide: function() {
		$("#draggable-record-attribute-tag")
			.css("display", "none");
	},
	storeInfoBeforeRemove: function(panelID, ForSID) {
		var self = this;

		self.deletingPanelID = panelID;
		self.deletingForSID = ForSID;
	}
}