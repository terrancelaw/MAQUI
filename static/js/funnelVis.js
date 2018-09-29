var FunnelVis = {
	splittingPointsByID: {}, // { ID, el, styles: { x, y, height, fill }, data: { index, numberOfSequencesContaining, timeBefore, numberOfEventsBefore, timeBetweenThisAndPrevious, numberOfEventsBetweenThisAndPrevious, fullName, nextSID, tooltipData } }
	linksByID: {}, // { ID, el, data: { leftSID, rightSID } , styles: { x, y, width, height, fill } } // store SID for later retrieve name

	startX: null,
	endX: null,
	height: 110,
	splittingPointWidth: 15,
	margin: { left: 40, right: 40 },
	linkColour: { pale: "#f2f2f2", dark: "#d5d5d5", highlight: "#f9f9ea" },
	highlightedLinks: {}, // { panelID, left, right } store two SIDs for highlighting the links between them

	newlyAddedSID: [], // for initializing the x, y, height fill of el
	newlyAddedLinkID: [], // for initializing the x, y, height fill of el
	allSIDUpdated: [], // remove if not in the array
	allLinkIDUpdated: [], // remove if not in the array

	init: function(panelEl) {
		var self = this;
		var panelWidth = $(panelEl).width();

		self.startX = 0;
		self.endX = panelWidth - self.margin.right - self.margin.left;

		self.appendDivTo(panelEl);
		self.addFunnelGroup(panelEl);
	},
	appendDivTo: function(panelEl) {
		var html = "<div class='funnel'><svg></svg></div>";

		$(panelEl).append(html);
	},
	addFunnelGroup: function(panelEl) {
		var self = this;
		var funnelSVG = d3.select(panelEl).select(".funnel svg");
		var funnelDivHeight = $(panelEl).find(".funnel").height();
		var translateX = self.margin.left;
		var translateY = funnelDivHeight - self.height - 2; // move to bottom

		var funnelGroup = funnelSVG.append("g")
			.attr("class", "funnel-group")
			.attr("transform", "translate(" + translateX + "," + translateY + ")");
		funnelGroup.append("g")
			.attr("class", "link-layer");
		funnelGroup.append("g")
			.attr("class", "splitting-point-layer");
	},
	createBackground: function(newPanelEl) {
		var self = this;
		var linkLayer = d3.select(newPanelEl).select(".funnel svg .funnel-group .link-layer");

		linkLayer.insert("rect", ":first-child")
			.attr("class", "background")
			.attr("x", 0)
			.attr("y", 0)
			.attr("height", self.height)
			.attr("width", 0)
			.style("fill", self.linkColour.pale)
			.transition()
			.attr("width", self.endX - self.startX);
	},
	removeFromDataStructures: function(panelID) {
		var self = this;

		delete self.splittingPointsByID[panelID];
		delete self.linksByID[panelID];
	},
	update: function(panelEl, onlyAdjustScale = false) {
		var self = this;
		var panelID = $(panelEl).attr("panel-id");

		self.clearPreviousData();
		self.updateSplittingPointsByID(panelID);
		self.updateLinksByID(panelID);
		self.updateVisualization(panelID, onlyAdjustScale);
	},
	updateSplittingPointsByID: function(panelID) {
		var self = this;

		if (!(panelID in self.splittingPointsByID)) {
			self.splittingPointsByID[panelID] = {};
			self.initSplittingPointByID(panelID, "start");
			self.initSplittingPointByID(panelID, "end");
		}

		self.updateSplittingPointsData(panelID);
		self.removeRedundantSplittingPoints(panelID); // must do it once all are looped
		self.updateSplittingPointsStyles(panelID);
		self.updateSplittingPointDataBinding(panelID);
		self.initNewlyAddedSplittingPointEl(panelID);
		self.updateColourMarkers(panelID);
	},
	clearPreviousData: function() {
		var self = this;

		self.newlyAddedSID = [];
		self.newlyAddedLinkID = [];
		self.allSIDUpdated = [];
		self.allLinkIDUpdated = [];
	},
	updateSplittingPointsData: function(panelID) { // eight elements
		var self = this;
		var timeBeforePrevious = 0;
		var numberOfEventsBeforePrevious = 0;
		var startForSID = FandSManager.getLastFilterID(panelID);
		var currentForSID = FandSManager.getNextForSID(panelID, startForSID); // skip start
		var currentIndex = 1; // skip start

		// update start (start is a special case as it correspond to a filter but not s point)
		self.splittingPointsByID[panelID]["start"].data.numberOfSequencesContaining = FandSManager.minifiedFandS[panelID][startForSID].numberOfSequences.after;
		self.splittingPointsByID[panelID]["start"].data.numberOfEventsBefore = 0;
		self.splittingPointsByID[panelID]["start"].data.numberOfEventsBetweenThisAndPrevious = 0;
		self.splittingPointsByID[panelID]["start"].data.timeBefore = 0;
		self.splittingPointsByID[panelID]["start"].data.timeBetweenThisAndPrevious = 0;
		self.splittingPointsByID[panelID]["start"].data.index = 0;
		self.splittingPointsByID[panelID]["start"].data.fullName = SubsequenceView.startAndEndNames[panelID].start;
		self.splittingPointsByID[panelID]["start"].data.nextSID = (currentForSID == null) ? "end" : currentForSID;
		self.splittingPointsByID[panelID]["start"].data.tooltipData = Helper.createMatchers([ ["Start"] ]);
		self.allSIDUpdated.push("start");

		// update others
		while (currentForSID != null) {
			var numberOfEventsBetweenThisAndPrevious = FandSManager.minifiedFandS[panelID][currentForSID]["averageNumberOfEvents"]["before"];
			var timeBetweenThisAndPrevious = FandSManager.minifiedFandS[panelID][currentForSID]["averageTime"]["before"];
			var fullName = FandSManager.minifiedFandS[panelID][currentForSID].name;
			var nextForSID = FandSManager.getNextForSID(panelID, currentForSID);
			var eventMatchersExistInMinifiedForS = ("eventMatchers" in FandSManager.minifiedFandS[panelID][currentForSID]);

			// create if currentForSID not exists
			if (!(currentForSID in self.splittingPointsByID[panelID]))
				self.initSplittingPointByID(panelID, currentForSID);

			// update
			self.splittingPointsByID[panelID][currentForSID].data.numberOfEventsBefore = numberOfEventsBeforePrevious + numberOfEventsBetweenThisAndPrevious;
			self.splittingPointsByID[panelID][currentForSID].data.numberOfEventsBetweenThisAndPrevious = numberOfEventsBetweenThisAndPrevious;
			self.splittingPointsByID[panelID][currentForSID].data.timeBefore = timeBeforePrevious + timeBetweenThisAndPrevious;
			self.splittingPointsByID[panelID][currentForSID].data.timeBetweenThisAndPrevious = timeBetweenThisAndPrevious;
			self.splittingPointsByID[panelID][currentForSID].data.numberOfSequencesContaining = FandSManager.minifiedFandS[panelID][currentForSID].numberOfSequences.after; // before is fine too but must have after
			self.splittingPointsByID[panelID][currentForSID].data.index = currentIndex;
			self.splittingPointsByID[panelID][currentForSID].data.fullName = fullName;
			self.splittingPointsByID[panelID][currentForSID].data.nextSID = (nextForSID == null) ? "end" : nextForSID;
			self.splittingPointsByID[panelID][currentForSID].data.tooltipData = eventMatchersExistInMinifiedForS ? FandSManager.minifiedFandS[panelID][currentForSID]["eventMatchers"] : Helper.createMatchers([ [fullName] ]);
			self.allSIDUpdated.push(currentForSID);

			// update for next iteration
			timeBeforePrevious = timeBeforePrevious + timeBetweenThisAndPrevious;
			numberOfEventsBeforePrevious = numberOfEventsBeforePrevious + numberOfEventsBetweenThisAndPrevious;
			currentForSID = nextForSID;
			currentIndex++;
		}

		// update end (end is a special case as not in minified queries)
		var lastForSID = FandSManager.getLastForSID(panelID);
		var numberOfEventsBetweenEndAndPrevious = FandSManager.minifiedFandS[panelID][lastForSID]["averageNumberOfEvents"]["after"];
		var timeBetweenEndAndPrevious = FandSManager.minifiedFandS[panelID][lastForSID]["averageTime"]["after"];
		var startingNumberOfSequences = self.splittingPointsByID[panelID]["start"].data.numberOfSequencesContaining;

		self.splittingPointsByID[panelID]["end"].data.numberOfEventsBefore = numberOfEventsBeforePrevious + numberOfEventsBetweenEndAndPrevious;
		self.splittingPointsByID[panelID]["end"].data.numberOfEventsBetweenThisAndPrevious = numberOfEventsBetweenEndAndPrevious;
		self.splittingPointsByID[panelID]["end"].data.timeBefore = timeBeforePrevious + timeBetweenEndAndPrevious;
		self.splittingPointsByID[panelID]["end"].data.timeBetweenThisAndPrevious = timeBetweenEndAndPrevious;
		self.splittingPointsByID[panelID]["end"].data.numberOfSequencesContaining = startingNumberOfSequences;
		self.splittingPointsByID[panelID]["end"].data.index = currentIndex;
		self.splittingPointsByID[panelID]["end"].data.fullName = SubsequenceView.startAndEndNames[panelID].end;
		self.splittingPointsByID[panelID]["end"].data.nextSID = null;
		self.splittingPointsByID[panelID]["end"].data.tooltipData = Helper.createMatchers([ ["End"] ]);
		self.allSIDUpdated.push("end");
	},
	removeRedundantSplittingPoints: function(panelID) {
		var self = this;

		for (var currentSID in self.splittingPointsByID[panelID]) {
			if (self.allSIDUpdated.indexOf(currentSID) == -1) {
				self.splittingPointsByID[panelID][currentSID].el.remove();
				delete self.splittingPointsByID[panelID][currentSID];
			}
		}
	},
	updateSplittingPointsStyles: function(panelID) {
		var self = this;
		var panelEl = $("#subsequence-view .panel[panel-id='" + panelID + "']")[0];
		var isHScaleButtonSelected = TopBar.isHScaleButtonSelected(panelEl);
		var isVScaleButtonSelected = TopBar.isVScaleButtonSelected(panelEl);
		var startingNumberOfSequences = self.splittingPointsByID[panelID]["start"].data.numberOfSequencesContaining;
		var numberOfSPoints = Object.keys(self.splittingPointsByID[panelID]).length;
		var timeBeforeEnd = self.splittingPointsByID[panelID]["end"].data.timeBefore;
		var numberOfEventsBeforeEnd = self.splittingPointsByID[panelID]["end"].data.numberOfEventsBefore;
		var isXScaleTime = $(panelEl).find(".top-bar .x-scale-toggle").hasClass("time");
		var xScaleDomain = Helper.getXScaleDomain(isXScaleTime, isHScaleButtonSelected, numberOfSPoints, timeBeforeEnd, numberOfEventsBeforeEnd);

		var heightScale = d3.scaleLinear()
			.domain([ 0, startingNumberOfSequences ])
			.range([ 0, self.height ]);
		var xScale = d3.scaleLinear()
			.domain(xScaleDomain) // use time by default
			.range([ self.startX, self.endX ]);

    	for (var currentSID in self.splittingPointsByID[panelID]) {
    		var numberOfSequencesContainingCurrentSPoint = self.splittingPointsByID[panelID][currentSID].data.numberOfSequencesContaining;
    		var indexOfCurrentSPoint = self.splittingPointsByID[panelID][currentSID].data.index;
    		var timeBeforeCurrentSPoint = self.splittingPointsByID[panelID][currentSID].data.timeBefore;
    		var numberOfEventsBeforeCurrentSPoint = self.splittingPointsByID[panelID][currentSID].data.numberOfEventsBefore;
    		var distanceBeforeCurrentSPoint = Helper.getDistanceBeforeThis(isXScaleTime, isHScaleButtonSelected, indexOfCurrentSPoint, timeBeforeCurrentSPoint, numberOfEventsBeforeCurrentSPoint);
    		var valueOfCurrentSPoint = Helper.getValueOfThis(isVScaleButtonSelected, currentSID, startingNumberOfSequences, indexOfCurrentSPoint, numberOfSequencesContainingCurrentSPoint);
    		var fullName = self.splittingPointsByID[panelID][currentSID].data.fullName;
    		
    		var newX = xScale(distanceBeforeCurrentSPoint);
    		var newHeight = heightScale(valueOfCurrentSPoint);
    		var newY = self.height - newHeight;
    		var newFill = ColourManager.getColour(fullName);

    		self.splittingPointsByID[panelID][currentSID].styles.x = (currentSID == "end") ? self.endX : newX; // correct problem with end
    		self.splittingPointsByID[panelID][currentSID].styles.y = newY;
    		self.splittingPointsByID[panelID][currentSID].styles.height = newHeight;
    		self.splittingPointsByID[panelID][currentSID].styles.fill = newFill;
    	}
	},
	updateSplittingPointDataBinding: function(panelID) {
		var self = this;

		for (var currentSID in self.splittingPointsByID[panelID]) {
			var data = self.splittingPointsByID[panelID][currentSID];
			self.splittingPointsByID[panelID][currentSID].el.datum(data);
		}
	},
	initNewlyAddedSplittingPointEl: function(panelID) {
		var self = this;

		var panelEl = $("#subsequence-view .panel[panel-id='" + panelID + "']")[0];
		var isHScaleButtonSelected = TopBar.isHScaleButtonSelected(panelEl);
		var numberOfSPoints = Object.keys(self.splittingPointsByID[panelID]).length;
		var timeBeforeEnd = self.splittingPointsByID[panelID]["end"].data.timeBefore;
		var numberOfEventsBeforeEnd = self.splittingPointsByID[panelID]["end"].data.numberOfEventsBefore;
		var isXScaleTime = $(panelEl).find(".top-bar .x-scale-toggle").hasClass("time");
		var xScaleDomain = Helper.getXScaleDomain(isXScaleTime, isHScaleButtonSelected, numberOfSPoints, timeBeforeEnd, numberOfEventsBeforeEnd);

		var xScale = d3.scaleLinear()
			.domain(xScaleDomain) // use time by default
			.range([ self.startX, self.endX ]);

		for (var i = 0; i < self.newlyAddedSID.length; i++) {
			var currentSID = self.newlyAddedSID[i];
			var timeBetweenThisAndPrevious = self.splittingPointsByID[panelID][currentSID].data.timeBetweenThisAndPrevious;
			var numberOfEventsBetweenThisAndPrevious = self.splittingPointsByID[panelID][currentSID].data.numberOfEventsBetweenThisAndPrevious;
			var distanceBetweenThisAndPrevious = (currentSID == "start") ? 0 : Helper.getDistanceBetweenThisAndPrevious(isXScaleTime, isHScaleButtonSelected, timeBetweenThisAndPrevious, numberOfEventsBetweenThisAndPrevious);
			var xBetweenThisAndPrevious = (currentSID == "end") ? (self.endX - self.startX) : xScale(distanceBetweenThisAndPrevious);

			var initialX = self.splittingPointsByID[panelID][currentSID].styles.x - xBetweenThisAndPrevious;
			var initialY = self.splittingPointsByID[panelID][currentSID].styles.y;
    		var initialHeight = self.splittingPointsByID[panelID][currentSID].styles.height;
    		var initialFill = self.splittingPointsByID[panelID][currentSID].styles.fill;
    		var initialText = self.splittingPointsByID[panelID][currentSID].data.numberOfSequencesContaining;

    		self.splittingPointsByID[panelID][currentSID].el
				.attr("transform", "translate(" + initialX + "," + initialY + ")");
			self.splittingPointsByID[panelID][currentSID].el.select("rect")
				.attr("height", initialHeight)
				.style("fill", initialFill);
			self.splittingPointsByID[panelID][currentSID].el.select("text")
				.attr("text", initialText);
		}
	},
	updateColourMarkers: function(panelID) {
		var self = this;

		for (var SID in self.splittingPointsByID[panelID]) {
			var currentSPointEl = self.splittingPointsByID[panelID][SID].el;
			var currentFullName = self.splittingPointsByID[panelID][SID].data.fullName;

			currentSPointEl
				.classed("colour-marker", true)
				.attr("colour-key", currentFullName);
		}
	},
	initSplittingPointByID: function(panelID, SID) {
		var self = this;
		var spittintPointLayer = d3.select("#subsequence-view .panel[panel-id='" + panelID + "'] .funnel svg .funnel-group .splitting-point-layer");
		
		self.newlyAddedSID.push(SID);

		self.splittingPointsByID[panelID][SID] = {};
		self.splittingPointsByID[panelID][SID].ID = SID;
		self.splittingPointsByID[panelID][SID].el = spittintPointLayer.append("g")
			.attr("class", "splitting-point")
			.style("cursor", "pointer")
			.on("mouseenter", mouseenterSPoint)
			.on("mouseleave", mouseleaveSPoint);
		self.splittingPointsByID[panelID][SID].el.append("rect")
			.attr("x", - self.splittingPointWidth / 2)
			.attr("y", 0)
			.attr("rx", 2)
			.attr("ry", 2)
			.attr("width", self.splittingPointWidth)
			.style("stroke", "white")
			.style("stroke-width", 2);
		self.splittingPointsByID[panelID][SID].el.append("text")
			.attr("y", -10)
			.style("text-anchor", "middle")
			.style("alignment-baseline", "middle")
			.style("font-weight", "bold")
			.style("font-size", 11)
			.style("fill", "gray");

		self.splittingPointsByID[panelID][SID].styles = {};
		self.splittingPointsByID[panelID][SID].styles.x = null;
		self.splittingPointsByID[panelID][SID].styles.y = null;
		self.splittingPointsByID[panelID][SID].styles.height = null;
		self.splittingPointsByID[panelID][SID].styles.fill = null;

		self.splittingPointsByID[panelID][SID].data = {};
		self.splittingPointsByID[panelID][SID].data.numberOfSequencesContaining = null;
		self.splittingPointsByID[panelID][SID].data.timeBefore = null;
		self.splittingPointsByID[panelID][SID].data.numberOfEventsBefore = null;
		self.splittingPointsByID[panelID][SID].data.timeBetweenThisAndPrevious = null;
		self.splittingPointsByID[panelID][SID].data.numberOfEventsBetweenThisAndPrevious = null;
		self.splittingPointsByID[panelID][SID].data.fullName = null;
		self.splittingPointsByID[panelID][SID].data.nextSID = null;
		self.splittingPointsByID[panelID][SID].data.tooltipData = null;

		// data binding
		self.splittingPointsByID[panelID][SID].el
			.datum(self.splittingPointsByID[panelID][SID]);

		function mouseenterSPoint(d) {
			var panelID = $(event.target).closest(".panel").attr("panel-id");
			var tagID = d.ID; // tagID and SID are the same
			var tagName = d.data.fullName;
			var tooltipData = d.data.tooltipData;

			var tagEl = Timeline.tagsByID[panelID][tagID].el.node();
			var bbox = tagEl.getBoundingClientRect();
			var patternTooltipTop = bbox.top + bbox.height + 7;
			var patternTooltipLeft = bbox.left + bbox.width / 2;

			PatternTooltip.show(tooltipData, tagName, patternTooltipTop, patternTooltipLeft);

			// move to front
			d3.select(this).moveToFront();
			Timeline.tagsByID[panelID][tagID].el.moveToFront();
		}

		function mouseleaveSPoint() {
			$("#my-tooltip")
				.removeClass("show");
			PatternTooltip.hide();
		}
	},
	updateLinksByID: function(panelID) {
		var self = this;

		if (!(panelID in self.linksByID))
			self.linksByID[panelID] = {};

		self.updateBeforeLinks(panelID);
		self.updateAfterLinks(panelID);
		self.updateNotLinks(panelID);
		self.removeRedundantLinks(panelID); // must do it once all are looped
		self.updateLinkDataBinding(panelID);
		self.initNewlyAddedLinkEl(panelID);
	},
	updateBeforeLinks: function(panelID) {
		var self = this;
		var previousSID = "start";
		var currentSID = self.splittingPointsByID[panelID]["start"].data.nextSID;

		// create before link for all splitting points except "start" and "end"
		while (currentSID != "end") {
			var currentLinkID = currentSID + "-before";
			var leftSPointX = self.splittingPointsByID[panelID][previousSID].styles.x;
			var rightSPointX = self.splittingPointsByID[panelID][currentSID].styles.x;
			var newX = leftSPointX;
			var newY = self.splittingPointsByID[panelID][currentSID].styles.y;
			var newWidth = rightSPointX - leftSPointX;
			var newHeight = self.splittingPointsByID[panelID][currentSID].styles.height;
			var newFill = self.linkColour.pale;

			// create if not exist
			if (!(currentLinkID in self.linksByID[panelID]))
				self.initLinkByID(panelID, currentLinkID);

			// update data
			self.linksByID[panelID][currentLinkID].data.leftSID = previousSID;
			self.linksByID[panelID][currentLinkID].data.rightSID = currentSID;

			// update styles
			self.linksByID[panelID][currentLinkID].styles.x = newX;
			self.linksByID[panelID][currentLinkID].styles.y = newY;
			self.linksByID[panelID][currentLinkID].styles.width = newWidth;
			self.linksByID[panelID][currentLinkID].styles.height = newHeight;
			self.linksByID[panelID][currentLinkID].styles.fill = newFill;
			self.allLinkIDUpdated.push(currentLinkID);

			// update currentSID
			previousSID = currentSID;
			currentSID = self.splittingPointsByID[panelID][currentSID].data.nextSID;
		}
	},
	updateAfterLinks: function(panelID) {
		var self = this;
		var startForSID = FandSManager.getLastFilterID(panelID);
		var lastForSID = FandSManager.getLastForSID(panelID);
		var lastSID = (startForSID == lastForSID) ? "start" : lastForSID;
		var currentLinkID = lastSID + "-after";

		var newX = self.splittingPointsByID[panelID][lastSID].styles.x;
		var newY = self.splittingPointsByID[panelID][lastSID].styles.y;
		var newWidth = self.endX - newX;
		var newHeight = self.splittingPointsByID[panelID][lastSID].styles.height;
		var newFill = self.linkColour.pale;

		// create if not exist
		if (!(currentLinkID in self.linksByID[panelID]))
			self.initLinkByID(panelID, currentLinkID);

		// update data
		self.linksByID[panelID][currentLinkID].data.leftSID = lastSID;
		self.linksByID[panelID][currentLinkID].data.rightSID = "end";

		// update styles
		self.linksByID[panelID][currentLinkID].styles.x = newX;
		self.linksByID[panelID][currentLinkID].styles.y = newY;
		self.linksByID[panelID][currentLinkID].styles.width = newWidth;
		self.linksByID[panelID][currentLinkID].styles.height = newHeight;
		self.linksByID[panelID][currentLinkID].styles.fill = newFill;
		self.allLinkIDUpdated.push(currentLinkID);
	},
	updateNotLinks: function(panelID) {
		var self = this;
		var previousSID = "start";
		var currentSID = self.splittingPointsByID[panelID]["start"].data.nextSID;

		// create not link for all splitting points except "start" and "end"
		while (currentSID != "end") {
			var currentLinkID = currentSID + "-not";
			var newX = self.splittingPointsByID[panelID][previousSID].styles.x;
			var newY = self.splittingPointsByID[panelID][previousSID].styles.y;
			var newWidth = self.endX - newX;
			var newFill = self.linkColour.dark;
			var previousSPointHeight = self.splittingPointsByID[panelID][previousSID].styles.height;
			var currentSPointHeight = self.splittingPointsByID[panelID][currentSID].styles.height;
			var newHeight = previousSPointHeight - currentSPointHeight;

			// create if not exist
			if (!(currentLinkID in self.linksByID[panelID]))
				self.initLinkByID(panelID, currentLinkID);

			// update data
			self.linksByID[panelID][currentLinkID].data.leftSID = previousSID;
			self.linksByID[panelID][currentLinkID].data.rightSID = "end";

			// update styles
			self.linksByID[panelID][currentLinkID].styles.x = newX;
			self.linksByID[panelID][currentLinkID].styles.y = newY;
			self.linksByID[panelID][currentLinkID].styles.width = newWidth;
			self.linksByID[panelID][currentLinkID].styles.height = newHeight;
			self.linksByID[panelID][currentLinkID].styles.fill = newFill;
			self.allLinkIDUpdated.push(currentLinkID);

			// update currentSID
			previousSID = currentSID;
			currentSID = self.splittingPointsByID[panelID][currentSID].data.nextSID;
		}
	},
	updateLinkDataBinding: function(panelID) {
		var self = this;

		for (var currentLinkID in self.linksByID[panelID]) {
			var data = self.linksByID[panelID][currentLinkID];
			self.linksByID[panelID][currentLinkID].el.datum(data);
		}
	},
	initNewlyAddedLinkEl: function(panelID) {
		var self = this;

		for (var i = 0; i < self.newlyAddedLinkID.length; i++) {
			var currentLinkID = self.newlyAddedLinkID[i];
			var currentSID = currentLinkID.split("-")[0];
			var currentOutputType = currentLinkID.split("-")[1];
			var initialX = self.linksByID[panelID][currentLinkID].styles.x;
			var initialY = self.linksByID[panelID][currentLinkID].styles.y;
    		var initialHeight = self.linksByID[panelID][currentLinkID].styles.height;
    		var initialWidth = 0;
    		var initialFill = self.linksByID[panelID][currentLinkID].styles.fill;

			self.linksByID[panelID][currentLinkID].el
				.attr("x", initialX)
				.attr("y", initialY)
				.attr("width", initialWidth)
				.attr("height", initialHeight)
				.style("fill", initialFill);
		}
	},
	removeRedundantLinks: function(panelID) {
		var self = this;

		for (var currentLinkID in self.linksByID[panelID]) {
			if (self.allLinkIDUpdated.indexOf(currentLinkID) == -1) {
				self.linksByID[panelID][currentLinkID].el.remove();
				delete self.linksByID[panelID][currentLinkID];
			}
		}
	},
	initLinkByID: function(panelID, linkID) {
		var self = this;
		var linkLayer = d3.select("#subsequence-view .panel[panel-id='" + panelID + "'] .funnel svg .funnel-group .link-layer");
		var clickBahaviour = clickcancel()
			.on("click", clickLink)
			.on("dblclick", doubleClickLink);

		self.newlyAddedLinkID.push(linkID);
		self.linksByID[panelID][linkID] = {};
		self.linksByID[panelID][linkID].ID = linkID;
		self.linksByID[panelID][linkID].el = linkLayer.append("rect")
			.attr("class", "subsequence")
			.style("stroke", "white")
			.style("stroke-width", 2)
			.style("cursor", "pointer")
			.on("mouseover", mouseoverLink)
			.on("mouseout", mouseoutLink)
			.call(clickBahaviour);

		self.linksByID[panelID][linkID].data = {};
		self.linksByID[panelID][linkID].data.leftSID = null;
		self.linksByID[panelID][linkID].data.rightSID = null;

		self.linksByID[panelID][linkID].styles = {};
		self.linksByID[panelID][linkID].styles.x = null;
		self.linksByID[panelID][linkID].styles.y = null;
		self.linksByID[panelID][linkID].styles.width = null;
		self.linksByID[panelID][linkID].styles.height = null;
		self.linksByID[panelID][linkID].styles.fill = null;

		// data binding
		self.linksByID[panelID][linkID].el
			.datum(self.linksByID[panelID][linkID]);

		function mouseoverLink(d) {
			var highlighted = d3.select(this).classed("highlighted");

			if (!highlighted)
				d3.select(this).style("fill", "#fffff4");
		}

		function mouseoutLink(d) {
			var highlighted = d3.select(this).classed("highlighted");
			var originalFill = d.styles.fill;

			if (!highlighted)
				d3.select(this).style("fill", originalFill);
		}

		function clickLink() {
			var event = this;
			var panelID = $(event.target).closest(".panel").attr("panel-id");
			var ForSID = $(event.target).attr("ForS-ID");
			var outputType = $(event.target).attr("output-type");
			var clickedLinkLeftSID = d3.select(event.target).datum().data.leftSID; // for constructing context vis
			var startForSID = FandSManager.getLastFilterID(panelID);
			var highlightNot = outputType == "not";
			var leftSID = ForSID;
			var isLinkSelected = d3.select(event.target).classed("highlighted");

			if (ForSID == startForSID)
				leftSID = "start";
			if (outputType == "before")
				leftSID = self.getPreviousSID(panelID, leftSID);

			if (isLinkSelected) {
				self.deselectAllLinks();
				InspectionView.clear();
			}
			if (!isLinkSelected) {
				self.updateHighlightedLinks(panelID, leftSID, highlightNot, event.target);
				self.highlightStoredLinks();
				InspectionView.update(panelID, ForSID, outputType, clickedLinkLeftSID);
			}
		}

		function doubleClickLink() {
			var event = this;
			var panelID = $(event.target).closest(".panel").attr("panel-id");
			var ForSID = $(event.target).attr("ForS-ID");
			var outputType = $(event.target).attr("output-type");
			var newPanelEl = SubsequenceView.appendPanel();
			var clickedLinkLeftSID = d3.select(event.target).datum().data.leftSID;
			var clickedLinkRightSID = d3.select(event.target).datum().data.rightSID;

			TopBar.init(newPanelEl);
			FunnelVis.init(newPanelEl);
			Timeline.init(newPanelEl);
			SubsequenceView.scrollToBottom();
			SubsequenceView.createNewPanelOnServer(panelID, ForSID, outputType, false, newPanelEl, clickedLinkLeftSID, clickedLinkRightSID);
		}
	},
	updateVisualization: function(panelID, onlyAdjustScale) {
		var self = this;

		self.updateSplittingPointVis(panelID);
		self.updateLinkVis(panelID);
		self.updateHighlightedLinkAndInspectionView(panelID, onlyAdjustScale);
	},
	updateSplittingPointVis: function(panelID) {
		var self = this;

		for (var currentSID in self.splittingPointsByID[panelID]) {
			var newX = self.splittingPointsByID[panelID][currentSID].styles.x;
			var newY = self.splittingPointsByID[panelID][currentSID].styles.y;
			var newHeight = self.splittingPointsByID[panelID][currentSID].styles.height;
			var newFill = self.splittingPointsByID[panelID][currentSID].styles.fill;
			var newText = self.splittingPointsByID[panelID][currentSID].data.numberOfSequencesContaining;

			self.splittingPointsByID[panelID][currentSID].el
				.transition()
				.attr("transform", "translate(" + newX + "," + newY + ")");
			self.splittingPointsByID[panelID][currentSID].el.select("rect")
				.transition()
				.attr("height", newHeight)
				.style("fill", newFill);
			self.splittingPointsByID[panelID][currentSID].el.select("text")
				.style("opacity", "0")
				.transition()
				.style("opacity", null)
				.text(newText);
		}
	},
	updateLinkVis: function(panelID) {
		var self = this;
		var startForSID = FandSManager.getLastFilterID(panelID);

		for (var currentLinkID in self.linksByID[panelID]) {
			var SID = currentLinkID.split("-")[0];
			var outputType = currentLinkID.split("-")[1];
			var ForSID = (SID == "start") ? startForSID : SID;

			var newX = self.linksByID[panelID][currentLinkID].styles.x;
			var newY = self.linksByID[panelID][currentLinkID].styles.y;
			var newWidth = self.linksByID[panelID][currentLinkID].styles.width;
			var newHeight = self.linksByID[panelID][currentLinkID].styles.height;
			var newFill = self.linksByID[panelID][currentLinkID].styles.fill;

			self.linksByID[panelID][currentLinkID].el
				.attr("ForS-ID", ForSID)
				.attr("output-type", outputType);
			self.linksByID[panelID][currentLinkID].el
				.style("fill", newFill) // allowing transition fill prevent links to be highlighted!
				.transition()
				.attr("x", newX)
				.attr("y", newY)
				.attr("width", newWidth)
				.attr("height", newHeight);
		}
	},
	updateHighlightedLinkAndInspectionView: function(panelID, onlyAdjustScale) {
		var self = this;
		var hasClickedOnALink = (InspectionView.currentPanelID != null);
		var clickedLinkInUpdatingPanel = (InspectionView.currentPanelID == panelID);

		if (onlyAdjustScale)
			self.highlightStoredLinks(false);
		if (!hasClickedOnALink || !clickedLinkInUpdatingPanel || onlyAdjustScale)
			return;

		var panelID = InspectionView.currentPanelID;
		var oldStartOrEndForSIDOfHighlightedLink = InspectionView.currentForSID;
		var newStartOrEndForSIDOfHighlightedLink = d3.select(self.highlightedLinks.el).attr("ForS-ID");
		var highlightedLinkNoLongerExists = !self.isStoredHighlightedLinkExists();
		var ForSInsertedBeforeHighlightedLink = FandSManager.hasForSBeenInsertedBefore(panelID, oldStartOrEndForSIDOfHighlightedLink, newStartOrEndForSIDOfHighlightedLink);

		if (highlightedLinkNoLongerExists) {
			var highlightedLinkPanelID = self.highlightedLinks.panelID;
			var highlightedLinkLeftSID = self.highlightedLinks.leftSID;
			var highlightedLinkRightSID = self.highlightedLinks.rightSID;

			// if milestone is added interrupt transition
			if (highlightedLinkLeftSID in self.splittingPointsByID[highlightedLinkPanelID] && 
				highlightedLinkRightSID in self.splittingPointsByID[highlightedLinkPanelID]) {
				var SIDBeforeRightSID = self.highlightedLinks.leftSID;

				while (self.splittingPointsByID[highlightedLinkPanelID][SIDBeforeRightSID].data.nextSID != highlightedLinkRightSID)
					SIDBeforeRightSID = self.splittingPointsByID[highlightedLinkPanelID][SIDBeforeRightSID].data.nextSID;
				self.interruptTransition(highlightedLinkPanelID, highlightedLinkLeftSID, SIDBeforeRightSID);
			}

			// clear highlighted link and inspection view after highlighting
			self.highlightStoredLinks(false);
			setTimeout(clearHighlightedLinkAndInspectionView, 300);

			function clearHighlightedLinkAndInspectionView() {
				self.deselectAllLinks();
				InspectionView.clear();
			}
		}

		if (!highlightedLinkNoLongerExists && ForSInsertedBeforeHighlightedLink) {
			// update as they will be different when filters are adding through av pair view
			InspectionView.currentForSID = d3.select(self.highlightedLinks.el).attr("ForS-ID");
			InspectionView.currentOutputType = d3.select(self.highlightedLinks.el).attr("output-type");
			var panelID = InspectionView.currentPanelID;
			var ForSID = InspectionView.currentForSID;
			var outputType = InspectionView.currentOutputType;

			// highlight + update
			self.highlightStoredLinks(false);
			setTimeout(function() { InspectionView.update(panelID, ForSID, outputType) }, 300); // delayed to make interaction smoother
		}

		if (!highlightedLinkNoLongerExists && !ForSInsertedBeforeHighlightedLink) {
			// update as they will be different when filters are adding through av pair view
			InspectionView.currentForSID = d3.select(self.highlightedLinks.el).attr("ForS-ID");
			InspectionView.currentOutputType = d3.select(self.highlightedLinks.el).attr("output-type");

			// highlight
			self.highlightStoredLinks(false);
		}
	},
	getPreviousSID: function(panelID, targetSID) {
		var self = this;

		for (var currentSID in self.splittingPointsByID[panelID]) {
			var nextSID = self.splittingPointsByID[panelID][currentSID].data.nextSID;

			if (nextSID == targetSID)
				return currentSID;
		}
		
		return null; // the first
	},
	updateHighlightedLinks: function(panelID, leftSID, not, el, rightSID = null) {
		var self = this;

		if (rightSID == null)
			rightSID = self.splittingPointsByID[panelID][leftSID].data.nextSID;

		self.highlightedLinks = {
			panelID: panelID,
			leftSID: leftSID,
			rightSID: rightSID,
			not: not,
			el: el
		};
	},
	highlightStoredLinks: function(transition = true) {
		var self = this;
		var noActiveLink = !("panelID" in self.highlightedLinks);
		var allLinkIDsToBeHighlighted = [];

		if (noActiveLink)
			return;

		var panelID = self.highlightedLinks.panelID;
		var leftSID = self.highlightedLinks.leftSID;
		var rightSID = self.highlightedLinks.rightSID;
		var highlightNot = self.highlightedLinks.not;

		// remove previous highlights
		d3.selectAll(".funnel .link-layer rect.highlighted").each(function(d) {
			var originalFill = d.styles.fill;

			d3.select(this)
				.classed("highlighted", false)
				.style("fill", originalFill);
		});

		// no highlight if either ends are removed
		if (!(leftSID in self.splittingPointsByID[panelID]) || !(rightSID in self.splittingPointsByID[panelID]))
			return;

		// store highlight links
		if (highlightNot) {
			allLinkIDsToBeHighlighted.push(leftSID + "-not");
		}
		else if (rightSID != null) {
			var currentSID = leftSID;
			var nextSID = self.splittingPointsByID[panelID][currentSID].data.nextSID;
			var lastUpdatedSID = leftSID;

			while (currentSID != rightSID && nextSID != "end") {
				allLinkIDsToBeHighlighted.push(nextSID + "-before");
				lastUpdatedSID = nextSID;
				currentSID = nextSID;
				nextSID = self.splittingPointsByID[panelID][currentSID].data.nextSID;
			}

			if (rightSID == "end")
				allLinkIDsToBeHighlighted.push(lastUpdatedSID + "-after");
		}

		// highlight links
		if (transition) {
			for (var i = 0; i < allLinkIDsToBeHighlighted.length; i++) {
				var highlightLinkID = allLinkIDsToBeHighlighted[i];

				self.linksByID[panelID][highlightLinkID].el
					.classed("highlighted", true);
				self.linksByID[panelID][highlightLinkID].el
					.transition()
					.style("fill", self.linkColour.highlight);
			}
		}
		if (!transition) {
			for (var i = 0; i < allLinkIDsToBeHighlighted.length; i++) {
				var highlightLinkID = allLinkIDsToBeHighlighted[i];

				self.linksByID[panelID][highlightLinkID].el
					.classed("highlighted", true);
				self.linksByID[panelID][highlightLinkID].el
					.style("fill", self.linkColour.highlight);
			}
		}
	},
	isStoredHighlightedLinkExists: function() {
		var self = this;
		var noActiveLink = !("panelID" in self.highlightedLinks);

		if (noActiveLink)
			return false;

		var panelID = self.highlightedLinks.panelID;
		var leftSID = self.highlightedLinks.leftSID;
		var rightSID = self.highlightedLinks.rightSID;
		var leftSPointRightSID = null;

		if (!(leftSID in self.splittingPointsByID[panelID]))
			return false;
		if (self.splittingPointsByID[panelID][leftSID].data.nextSID != rightSID)
			return false;
		if (!(rightSID in self.splittingPointsByID[panelID]))
			return false;

		return true;
	},
	deselectAllLinks: function(transition = true) {
		var self = FunnelVis;
		var noActiveLink = !("panelID" in self.highlightedLinks);

		if (noActiveLink)
			return;

		if (transition) {
			d3.selectAll(".funnel .link-layer rect.highlighted").each(function(d) {
				var originalFill = d.styles.fill;

				d3.select(this)
					.classed("highlighted", false)
					.transition()
					.style("fill", originalFill);
			});
		}
		if (!transition) {
			d3.selectAll(".funnel .link-layer rect.highlighted").each(function(d) {
				var originalFill = d.styles.fill;

				d3.select(this)
					.classed("highlighted", false)
					.style("fill", originalFill);
			});
		}

		self.highlightedLinks = {};
	},
	interruptTransition: function(panelID, leftSID, rightSID) {
		var self = this;
		var currentSID = leftSID;
		var nextSID = self.splittingPointsByID[panelID][currentSID].data.nextSID;
		var lastUpdatedSID = leftSID;
		var allLinkIDsToBeInterrupted = [];

		while (currentSID != rightSID && nextSID != "end") {
			allLinkIDsToBeInterrupted.push(nextSID + "-before");
			lastUpdatedSID = nextSID;
			currentSID = nextSID;
			nextSID = self.splittingPointsByID[panelID][currentSID].data.nextSID;
		}

		if (rightSID == "end")
			allLinkIDsToBeInterrupted.push(lastUpdatedSID + "-after");

		for (var i = 0; i < allLinkIDsToBeInterrupted.length; i++) {
			var linkID = allLinkIDsToBeInterrupted[i];
			var width = self.linksByID[panelID][linkID].styles.width;

			self.linksByID[panelID][linkID].el
				.interrupt();
			self.linksByID[panelID][linkID].el
				.attr("width", width);
		}
	},
	highlightLinksInPanel: function(panelID, leftSID, rightSID) {
		var self = this;
		var currentSID = leftSID;
		var nextSID = self.splittingPointsByID[panelID][currentSID].data.nextSID;
		var lastUpdatedSID = leftSID;
		var allLinkIDsToBeHighlighted = [];

		while (currentSID != rightSID && nextSID != "end") {
			allLinkIDsToBeHighlighted.push(nextSID + "-before");
			lastUpdatedSID = nextSID;
			currentSID = nextSID;
			nextSID = self.splittingPointsByID[panelID][currentSID].data.nextSID;
		}

		if (rightSID == "end")
			allLinkIDsToBeHighlighted.push(lastUpdatedSID + "-after");

		for (var i = 0; i < allLinkIDsToBeHighlighted.length; i++) {
			var highlightLinkID = allLinkIDsToBeHighlighted[i];

			self.linksByID[panelID][highlightLinkID].el
				.style("fill", self.linkColour.highlight);
		}
	},
	removeHighlightLinksInPanel: function(panelID) {
		var panelEl = $("#subsequence-view .panel[panel-id='" + panelID + "']")[0];

		d3.select(panelEl).selectAll(".funnel .link-layer rect.subsequence").each(function(d) {
			var originalFill = d.styles.fill;

			d3.select(this)
				.transition()
				.duration(700)
				.style("fill", originalFill);
		});
	}
}