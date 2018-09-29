var InspectionViewContext = {
	currentPanelID: null, // for refresh
	currentClickedLinkLeftSID: null, // for refresh
	currentNotSID: null, // for refresh

	update: function(panelID, clickedLinkLeftSID, notSID) {
		var self = this;
		var contextArray = ContextVisHelper.generateContextArray(panelID, clickedLinkLeftSID, notSID);
		var contextSVG = d3.select("#inspection-view .context-visualization .container svg");
		self.currentPanelID = panelID;
		self.currentClickedLinkLeftSID = clickedLinkLeftSID;
		self.currentNotSID = notSID;

		d3.select("#inspection-view .context-visualization .container svg *").remove();
		ContextVisHelper.visualizeContextArray(contextSVG, contextArray);
	},
	refresh: function() {
		var self = this;

		if (!(self.currentPanelID == null && self.currentClickedLinkLeftSID == null && self.currentNotSID == null)) {
			var contextArray = ContextVisHelper.generateContextArray(self.currentPanelID, self.currentClickedLinkLeftSID, self.currentNotSID);
			var contextSVG = d3.select("#inspection-view .context-visualization .container svg");

			d3.select("#inspection-view .context-visualization .container svg *").remove();
			ContextVisHelper.visualizeContextArray(contextSVG, contextArray);
		}
	},
	clear: function() {
		var self = this;
		self.currentPanelID = null;
		self.currentClickedLinkLeftSID = null;
		self.currentNotSID = null;

		d3.select("#inspection-view .context-visualization .container svg *").remove();
	}
}