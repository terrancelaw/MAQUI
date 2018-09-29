var ContextBar = {
	contextByID: {}, // [{ not, highlighted , name, tooltipData }]
	timeAndEventCountFilterListByID: {}, // [{ start, end, list }]

	update: function(clickedPanelID, newPanelID, clickedLinkLeftSID, notSID, timeAndEventCountFilterList) {
		var self = this;

		self.updateContextByID(clickedPanelID, newPanelID, clickedLinkLeftSID, notSID);
		self.updateTimeAndEventCountFilterListByID(clickedPanelID, newPanelID, timeAndEventCountFilterList);
		self.visualizeContext(newPanelID);
		self.adjustContextSVGHeight(newPanelID);
		self.updateColourMarkers(newPanelID);
	},
	removeFromDataStructures: function(deletedPanelID) {
		var self = this;

		delete self.contextByID[deletedPanelID];
	},
	updateContextByID: function(clickedPanelID, newPanelID, clickedLinkLeftSID, notSID) {
		var self = this;

		if (clickedPanelID == null)
			self.contextByID[newPanelID] = [
				{ not: false, highlighted: true, name: "Start", tooltipData: Helper.createMatchers([ ["Start"] ]) }, 
				{ not: false, highlighted: true, name: "End", tooltipData: Helper.createMatchers([ ["End"] ]) }
			];

		if (clickedPanelID != null)
			self.contextByID[newPanelID] = ContextVisHelper.generateContextArray(clickedPanelID, clickedLinkLeftSID, notSID);
	},
	updateTimeAndEventCountFilterListByID: function(clickedPanelID, newPanelID, timeAndEventCountFilterList) {
		var self = this;

		if (clickedPanelID == null || timeAndEventCountFilterList.length == 0)
			self.timeAndEventCountFilterListByID[newPanelID] = [];

		else if (clickedPanelID != null) {
			var startName = null;
			var endName = null;
			self.timeAndEventCountFilterListByID[newPanelID] = [];

			// find start and end name
			for (var i = 0; i < self.contextByID[clickedPanelID].length; i++) {
				if (self.contextByID[clickedPanelID][i].highlighted && startName == null)
					startName = self.contextByID[clickedPanelID][i].name;
				if (self.contextByID[clickedPanelID][i].highlighted && startName != null)
					endName = self.contextByID[clickedPanelID][i].name;
			}

			// push filters in clicked panel
			for (var i = 0; i < self.timeAndEventCountFilterListByID[clickedPanelID].length; i++) {
				var previousTimeAndEventFilters = self.timeAndEventCountFilterListByID[clickedPanelID][i];
				self.timeAndEventCountFilterListByID[newPanelID].push(previousTimeAndEventFilters);
			}

			// add newly added filters
			self.timeAndEventCountFilterListByID[newPanelID].push({
				start: startName,
				end: endName,
				list: timeAndEventCountFilterList
			});
		}
	},
	refreshAll: function() {
		var self = this;

		$(".panel").each(function() {
			var panelID = $(this).attr("panel-id");

			self.clearContext(panelID);
			self.visualizeContext(panelID);
			self.adjustContextSVGHeight(panelID);
			self.updateColourMarkers(panelID);
		});
	},
	clearContext: function(panelID) {
		var panelEl = $("#subsequence-view .panel[panel-id=" + panelID + "]")[0];

		d3.select(panelEl).select(".top-bar .context.content svg *").remove();
	},
	visualizeContext: function(newPanelID) {
		var self = this;
		var newPanelEl = $("#subsequence-view .panel[panel-id=" + newPanelID + "]")[0];
		var contextSVG = d3.select(newPanelEl).select(".top-bar .context.content svg");
		var contextArray = self.contextByID[newPanelID];
		var timeAndEventCountFilterArray = self.timeAndEventCountFilterListByID[newPanelID];

		ContextVisHelper.visualizeContextArray(contextSVG, contextArray);
		ContextVisHelper.visualizeTimeAndEventCountFilters(contextSVG, timeAndEventCountFilterArray);
	},
	adjustContextSVGHeight: function(newPanelID) {
		var self = this;
		var newPanelEl = $("#subsequence-view .panel[panel-id=" + newPanelID + "]")[0];
		var contextSVG = d3.select(newPanelEl).select(".top-bar .context.content svg");
		var contextSVGHeight = $(contextSVG.node()).height();
		var contextGroupHeight = contextSVG.select("g.context").node().getBBox().height;

		if (contextGroupHeight + contextSVGHeight / 2 > contextSVGHeight)
			contextSVG.style("height", contextGroupHeight + contextSVGHeight / 2);
	},
	updateColourMarkers: function(newPanelID) {
		var self = this;
		var newPanelEl = $("#subsequence-view .panel[panel-id=" + newPanelID + "]")[0];
		var tagLayer = d3.select(newPanelEl).select(".top-bar .context.content svg .tag-layer");
		var filterLayer = d3.select(newPanelEl).select(".top-bar .context.content svg .filter-layer");

		filterLayer.selectAll(".start-tag")
			.classed("colour-marker active", true)
			.attr("colour-key", function(d) { return d });
		filterLayer.selectAll(".end-tag")
			.classed("colour-marker active", true)
			.attr("colour-key", function(d) { return d });
		tagLayer.selectAll(".tag")
			.classed("colour-marker active", true)
			.attr("colour-key", function(d) { return d.name });
	}
}