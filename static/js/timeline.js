var Timeline = {
	tagsByID: {}, // { ID, el, styles: { x, fill, text, fontSize, fontColour }, data: { index, timeBefore, numberOfEventsBefore, timeBetweenThisAndPrevious, numberOfEventsBetweenThisAndPrevious, fullName, nextTagID, tooltipData } }
	textByID: {}, // { ID, el, styles: { x }, data: { numberOfEvents, time } }

	newlyAddedTagID: [], // for updating new before animation
	newlyAddedTextID: [],// for updating new before animation
	allTagIDUpdated: [], // for removing old
	allTextIDUpdated: [], // for removing old

	init: function(panelEl) {
		var self = this;

		self.appendDivTo(panelEl);
		self.addTimelineGroup(panelEl);
	},
	appendDivTo: function(panelEl) {
		var html = "<div class='timeline'><svg></svg></div>";

		$(panelEl).append(html);
	},
	addTimelineGroup: function(panelEl) {
		var timelineSVG = d3.select(panelEl).select(".timeline svg");
		var timelineDivHeight = $(panelEl).find(".timeline").height();
		var translateX = FunnelVis.margin.left;
		var translateY = timelineDivHeight / 2;

		var timelineGroup = timelineSVG.append("g")
			.attr("class", "timeline-group")
			.attr("transform", "translate(" + translateX + "," + translateY + ")");
		timelineGroup.append("g")
			.attr("class", "text-layer");
		timelineGroup.append("g")
			.attr("class", "tag-layer");
		timelineGroup.append("g")
			.attr("class", "plus-sign-layer");
	},
	addEmptyTimeline: function(panelEl) {
		var timelineSVG = d3.select(panelEl).select(".timeline svg");
		var initialPathData = "M " + FunnelVis.startX + " 0 L " + FunnelVis.startX + " 0";
		var finalPathData = "M " + FunnelVis.startX + " 0 L " + FunnelVis.endX + " 0";
		var timelineGroup = timelineSVG.select("g.timeline-group")

		timelineGroup.insert("path", ":first-child")
			.attr("d", initialPathData)
			.style("stroke", "#e0d4cc")
			.style("stroke-width", 2);
		timelineGroup.select("path")
			.transition()
			.attr("d", finalPathData);
	},
	initMousemoveBehaviour: function(panelEl) {
		var self = this;

		$(panelEl).find(".timeline").mousemove(mousemoveTimeline);

		function mousemoveTimeline(event) {
			var panelID = $(this).closest(".panel").attr("panel-id");
			var mouseX = event.pageX;
			var currentTagID = "start";
			var nextTagID = self.tagsByID[panelID]["start"].data.nextTagID;

			while (nextTagID != null) {
				var leftTagEl = self.tagsByID[panelID][currentTagID].el.node();
				var rightTagEl = self.tagsByID[panelID][nextTagID].el.node();
				var leftTagBBox = leftTagEl.getBoundingClientRect();
				var rightTagBBox = rightTagEl.getBoundingClientRect();
				var leftTagX = leftTagBBox.x + leftTagBBox.width;
				var rightTagX = rightTagBBox.x;
				var allPlusSigns = d3.select(this).selectAll(".plus-sign-layer .plus-sign");
				var leftPlusSign = d3.select(this).select(".plus-sign-layer .plus-sign.tagID" + currentTagID);

				// display add event button if needed
				allPlusSigns.style("display", "none");

				if (mouseX > leftTagX && mouseX < rightTagX) {
					leftPlusSign.style("display", "");
					break;
				}

				// update
				currentTagID = nextTagID;
				nextTagID = self.tagsByID[panelID][currentTagID].data.nextTagID;
			}
		}
	},
	initMouseleaveBehaviour: function(panelEl) {
		$(panelEl).find(".timeline").mouseleave(mouseleaveTimeline);

		function mouseleaveTimeline() {
			if (!ContextMenu.isOpened()) {
				d3.select(this).selectAll(".plus-sign-layer .plus-sign")
					.style("display", "none");
			}
		}
	},
	initClickPlusSignBehaviour: function() {
		var plusSignSelector = "#subsequence-view .panel .timeline .plus-sign-layer .plus-sign";
		var contextMenuAndEditorSelector = ".context-menu, #slider-range-editor"; // ban this not behaviour

		Body.registerClickEvent(plusSignSelector, contextMenuAndEditorSelector, clickPlusSign);

		function clickPlusSign(event) {
			var plusSignEl = $(event.target).closest(".plus-sign")[0];
			var panelID = $(event.target).closest(".panel").attr("panel-id");
			var ForSID = d3.select(plusSignEl).attr("ForS-ID");
			var outputType = "after";
			var bbox = plusSignEl.getBoundingClientRect();

			ContextMenu.recordTargetSubsequence(panelID, ForSID, outputType, "split"); // so that you know to which subsequences to apply the operation
			ContextMenu.empty();
			ContextMenu.show("event", bbox.y + 10, bbox.x + 10);
		}
	},
	removeFromDataStructures: function(panelID) {
		var self = this;

		delete self.tagsByID[panelID];
		delete self.textByID[panelID];
	},
	refreshAll: function() {
		var self = this;

		$(".panel").each(function() {
			var panelID = $(this).attr("panel-id");

			self.clearPreviousData();
			self.updateTagsByID(panelID);
			self.updateTextByID(panelID);
			self.updateVisualization(panelID);
			self.updatePlusSigns(panelID);
		});
	},
	update: function(panelEl) {
		var self = this;
		var panelID = $(panelEl).attr("panel-id");

		self.clearPreviousData();
		self.updateTagsByID(panelID);
		self.updateTextByID(panelID);
		self.updateVisualization(panelID);
		self.updatePlusSigns(panelID);
	},
	clearPreviousData: function() {
		var self = this;

		self.newlyAddedTagID = [];
		self.newlyAddedTextID = [];
		self.allTagIDUpdated = [];
		self.allTextIDUpdated = [];
	},
	updateTagsByID: function(panelID) {
		var self = this;

		if (!(panelID in self.tagsByID)) {
			self.tagsByID[panelID] = {};
			self.initTagByID(panelID, "start");
			self.initTagByID(panelID, "end");
		}

		self.updateTagData(panelID);
		self.removeRedundantTags(panelID);
		self.updateTagStyles(panelID);
		self.updateTagsDataBinding(panelID);
		self.initNewlyAddedTagEl(panelID);
		self.updateColourMarkers(panelID);
	},
	updateTagData: function(panelID) { // seven elements
		var self = this;
		var timeBeforePrevious = 0;
		var numberOfEventsBeforePrevious = 0;
		var startForSID = FandSManager.getLastFilterID(panelID);
		var currentForSID = FandSManager.getNextForSID(panelID, startForSID); // skip start
		var currentIndex = 1; // skip start

		// update start (start is a special case as it correspond to a filter but not s point)
		self.tagsByID[panelID]["start"].data.numberOfEventsBefore = 0;
		self.tagsByID[panelID]["start"].data.numberOfEventsBetweenThisAndPrevious = 0;
		self.tagsByID[panelID]["start"].data.timeBefore = 0;
		self.tagsByID[panelID]["start"].data.timeBetweenThisAndPrevious = 0;
		self.tagsByID[panelID]["start"].data.fullName = SubsequenceView.startAndEndNames[panelID].start;
		self.tagsByID[panelID]["start"].data.index = 0;
		self.tagsByID[panelID]["start"].data.nextTagID = (currentForSID == null) ? "end" : currentForSID;
		self.tagsByID[panelID]["start"].data.tooltipData = Helper.createMatchers([ ["Start"] ]);
		self.allTagIDUpdated.push("start");

		while (currentForSID != null) {
			var numberOfEventsBetweenThisAndPrevious = FandSManager.minifiedFandS[panelID][currentForSID]["averageNumberOfEvents"]["before"];
			var timeBetweenThisAndPrevious = FandSManager.minifiedFandS[panelID][currentForSID]["averageTime"]["before"];
			var fullName = FandSManager.minifiedFandS[panelID][currentForSID].name;
			var nextForSID = FandSManager.getNextForSID(panelID, currentForSID);
			var eventMatchersExistInMinifiedForS = ("eventMatchers" in FandSManager.minifiedFandS[panelID][currentForSID]);

			// create if currentForSID not exists
			if (!(currentForSID in self.tagsByID[panelID]))
				self.initTagByID(panelID, currentForSID);

			// update
			self.tagsByID[panelID][currentForSID].data.numberOfEventsBefore = numberOfEventsBeforePrevious + numberOfEventsBetweenThisAndPrevious;
			self.tagsByID[panelID][currentForSID].data.numberOfEventsBetweenThisAndPrevious = numberOfEventsBetweenThisAndPrevious;
			self.tagsByID[panelID][currentForSID].data.timeBefore = timeBeforePrevious + timeBetweenThisAndPrevious;
			self.tagsByID[panelID][currentForSID].data.timeBetweenThisAndPrevious = timeBetweenThisAndPrevious;
			self.tagsByID[panelID][currentForSID].data.fullName = fullName;
			self.tagsByID[panelID][currentForSID].data.index = currentIndex;
			self.tagsByID[panelID][currentForSID].data.nextTagID = (nextForSID == null) ? "end" : nextForSID;
			self.tagsByID[panelID][currentForSID].data.tooltipData = eventMatchersExistInMinifiedForS ? FandSManager.minifiedFandS[panelID][currentForSID]["eventMatchers"] : Helper.createMatchers([ [fullName] ]);
			self.allTagIDUpdated.push(currentForSID);

			// update for the next iteration
			numberOfEventsBeforePrevious = numberOfEventsBeforePrevious + numberOfEventsBetweenThisAndPrevious;
			timeBeforePrevious = timeBeforePrevious + timeBetweenThisAndPrevious;
			currentForSID = nextForSID;
			currentIndex++;
		}
		
		// update end (end is a special case as not in minified queries)
		var lastForSID = FandSManager.getLastForSID(panelID);
		var numberOfEventsBetweenEndAndPrevious = FandSManager.minifiedFandS[panelID][lastForSID]["averageNumberOfEvents"]["after"];
		var timeBetweenEndAndPrevious = FandSManager.minifiedFandS[panelID][lastForSID]["averageTime"]["after"];

		self.tagsByID[panelID]["end"].data.numberOfEventsBefore = numberOfEventsBeforePrevious + numberOfEventsBetweenEndAndPrevious;
		self.tagsByID[panelID]["end"].data.numberOfEventsBetweenThisAndPrevious = numberOfEventsBetweenEndAndPrevious;
		self.tagsByID[panelID]["end"].data.timeBefore = timeBeforePrevious + timeBetweenEndAndPrevious;
		self.tagsByID[panelID]["end"].data.timeBetweenThisAndPrevious = timeBetweenEndAndPrevious;
		self.tagsByID[panelID]["end"].data.fullName = SubsequenceView.startAndEndNames[panelID].end;
		self.tagsByID[panelID]["end"].data.nextTagID = null;
		self.tagsByID[panelID]["end"].data.index = currentIndex;
		self.tagsByID[panelID]["end"].data.tooltipData = Helper.createMatchers([ ["End"] ]);
		self.allTagIDUpdated.push("end");
	},
	removeRedundantTags: function(panelID) {
		var self = this;

		for (var currentTagID in self.tagsByID[panelID]) {
			if (self.allTagIDUpdated.indexOf(currentTagID) == -1) {
				self.tagsByID[panelID][currentTagID].el.remove();
				delete self.tagsByID[panelID][currentTagID];
			}
		}
	},
	updateTagStyles: function(panelID) {
		var self = this;

		var panelEl = $("#subsequence-view .panel[panel-id='" + panelID + "']")[0];
		var isHScaleButtonSelected = TopBar.isHScaleButtonSelected(panelEl);
		var numberOfTags = Object.keys(self.tagsByID[panelID]).length;
		var timeBeforeEnd = self.tagsByID[panelID]["end"].data.timeBefore;
		var numberOfEventsBeforeEnd = self.tagsByID[panelID]["end"].data.numberOfEventsBefore;
		var isXScaleTime = $(panelEl).find(".top-bar .x-scale-toggle").hasClass("time");
		var xScaleDomain = Helper.getXScaleDomain(isXScaleTime, isHScaleButtonSelected, numberOfTags, timeBeforeEnd, numberOfEventsBeforeEnd);

		var xScale = d3.scaleLinear()
			.domain(xScaleDomain) // use time by default
			.range([ FunnelVis.startX, FunnelVis.endX ]);

		for (var currentTagID in self.tagsByID[panelID]) {
			var indexOfCurrentTag = self.tagsByID[panelID][currentTagID].data.index;
			var timeBeforeCurrentTag = self.tagsByID[panelID][currentTagID].data.timeBefore;
			var numberOfEventsBeforeCurrentTag = self.tagsByID[panelID][currentTagID].data.numberOfEventsBefore;
			var distanceBeforeCurrentTag = Helper.getDistanceBeforeThis(isXScaleTime, isHScaleButtonSelected, indexOfCurrentTag, timeBeforeCurrentTag, numberOfEventsBeforeCurrentTag);
			var fullName = self.tagsByID[panelID][currentTagID].data.fullName;

			var newX = xScale(distanceBeforeCurrentTag);
			var newFill = ColourManager.getColour(fullName);
			var newText = ShortNameManager.getShortName(fullName);
			var newFontSize = (fullName == "Start" || fullName == "End") ? 10 : 12;
			var newFontColour = (fullName == "Start" || fullName == "End") ? "gray" : ColourManager.getForegroundTextColour(newFill);

			self.tagsByID[panelID][currentTagID].styles.x = (currentTagID == "end") ? FunnelVis.endX : newX;
    		self.tagsByID[panelID][currentTagID].styles.fill = newFill;
    		self.tagsByID[panelID][currentTagID].styles.text = newText;
    		self.tagsByID[panelID][currentTagID].styles.fontSize = newFontSize;
    		self.tagsByID[panelID][currentTagID].styles.fontColour = newFontColour;
		}
	},
	updateTagsDataBinding: function(panelID) {
		var self = this;

		for (var currentTagID in self.tagsByID[panelID]) {
			var data = self.tagsByID[panelID][currentTagID];
			self.tagsByID[panelID][currentTagID].el.datum(data);
		}
	},
	initNewlyAddedTagEl: function(panelID) {
		var self = this;

		var panelEl = $("#subsequence-view .panel[panel-id='" + panelID + "']")[0];
		var isHScaleButtonSelected = TopBar.isHScaleButtonSelected(panelEl);
		var numberOfTags = Object.keys(self.tagsByID[panelID]).length;
		var timeBeforeEnd = self.tagsByID[panelID]["end"].data.timeBefore;
		var numberOfEventsBeforeEnd = self.tagsByID[panelID]["end"].data.numberOfEventsBefore;
		var isXScaleTime = $(panelEl).find(".top-bar .x-scale-toggle").hasClass("time");
		var xScaleDomain = Helper.getXScaleDomain(isXScaleTime, isHScaleButtonSelected, numberOfTags, timeBeforeEnd, numberOfEventsBeforeEnd);

		var xScale = d3.scaleLinear()
			.domain(xScaleDomain) // use time by default
			.range([ FunnelVis.startX, FunnelVis.endX ]);

		for (var i = 0; i < self.newlyAddedTagID.length; i++) {
			// init text
			var currentTagID = self.newlyAddedTagID[i];
			var timeBetweenThisAndPrevious = self.tagsByID[panelID][currentTagID].data.timeBetweenThisAndPrevious;
			var numberOfEventsBetweenThisAndPrevious = self.tagsByID[panelID][currentTagID].data.numberOfEventsBetweenThisAndPrevious;
			var distanceBetweenThisAndPrevious = (currentTagID == "start") ? 0 : Helper.getDistanceBetweenThisAndPrevious(isXScaleTime, isHScaleButtonSelected, timeBetweenThisAndPrevious, numberOfEventsBetweenThisAndPrevious);
			var xBetweenThisAndPrevious = (currentTagID == "end") ? (FunnelVis.endX - FunnelVis.startX) : xScale(distanceBetweenThisAndPrevious);

			var initialX = self.tagsByID[panelID][currentTagID].styles.x - xBetweenThisAndPrevious;
			var initialText = self.tagsByID[panelID][currentTagID].styles.text;
			var initialFontSize = self.tagsByID[panelID][currentTagID].styles.fontSize;
			var initialFontColour = self.tagsByID[panelID][currentTagID].styles.fontColour;

			self.tagsByID[panelID][currentTagID].el
				.attr("transform", "translate(" + initialX + ",0)");
			self.tagsByID[panelID][currentTagID].el.select("text")
				.style("font-size", initialFontSize)
				.style("fill", initialFontColour)
				.text(initialText);

			// init rect
			var bbox = self.tagsByID[panelID][currentTagID].el.select("text").node().getBBox();
			var initialFill = self.tagsByID[panelID][currentTagID].styles.fill;

			self.tagsByID[panelID][currentTagID].el.select("rect")
				.attr("x", bbox.x)
				.attr("y", bbox.y)
				.attr("width", bbox.width)
				.attr("height", bbox.height)
				.style("fill", initialFill);
		}
	},
	initTagByID: function(panelID, tagID) {
		var self = this;
		var tagLayer = d3.select("#subsequence-view .panel[panel-id='" + panelID + "'] .timeline svg .timeline-group .tag-layer");
		
		self.newlyAddedTagID.push(tagID);

		self.tagsByID[panelID][tagID] = {};
		self.tagsByID[panelID][tagID].ID = tagID;
		self.tagsByID[panelID][tagID].el = tagLayer.append("g")
			.attr("class", "tag")
			.style("cursor", "pointer")
			.on("mouseenter", mouseenterTag)
			.on("mouseleave", mouseleaveTag);
		self.tagsByID[panelID][tagID].el.append("rect")
			.attr("rx", 3)
			.attr("ry", 3)
			.style("stroke", "white")
			.style("stroke-width", 2);
		self.tagsByID[panelID][tagID].el.append("text")
			.style("font-family", "Arial")
			.style("text-anchor", "middle")
			.style("alignment-baseline", "middle")
			.style("font-weight", "bold");

		self.tagsByID[panelID][tagID].styles = {};
		self.tagsByID[panelID][tagID].styles.x = null;
		self.tagsByID[panelID][tagID].styles.fill = null;
		self.tagsByID[panelID][tagID].styles.text = null;
		self.tagsByID[panelID][tagID].styles.fontSize = null;
		self.tagsByID[panelID][tagID].styles.fontColour = null;

		self.tagsByID[panelID][tagID].data = {};
		self.tagsByID[panelID][tagID].data.timeBefore = null;
		self.tagsByID[panelID][tagID].data.numberOfEventsBefore = null;
		self.tagsByID[panelID][tagID].data.timeBetweenThisAndPrevious = null;
		self.tagsByID[panelID][tagID].data.numberOfEventsBetweenThisAndPrevious = null;
		self.tagsByID[panelID][tagID].data.fullName = null;
		self.tagsByID[panelID][tagID].data.nextTagID = null;

		// data binding
		self.tagsByID[panelID][tagID].el
			.datum(self.tagsByID[panelID][tagID]);

		// double click for none start and end
		if (tagID != "start" && tagID != "end")
			self.tagsByID[panelID][tagID].el.on("click", clickTag);

		function mouseenterTag(d) {
			var panelID = $(this).closest(".panel").attr("panel-id");
			var SID = d.ID; // SID = tagID
			var tooltipData = d.data.tooltipData;
			var tagName = d.data.fullName;
			var bbox = this.getBoundingClientRect();
			var patternTooltipTop = bbox.top + bbox.height + 7;
			var patternTooltipLeft = bbox.left + bbox.width / 2;
			var myTooltipTop = bbox.top - 10;
			var myTooltipLeft = bbox.left + bbox.width / 2;

			if (SID != "start" && SID != "end") {
				// show remove sign
				d3.select(this).selectAll("*")
					.style("opacity", 0.5);
				d3.select(this).append("text")
					.attr("class", "remove-button")
					.style("font-family", "FontAwesome")
					.style("text-anchor", "middle")
					.style("alignment-baseline", "middle")
					.style("fill", "#FE4365")
					.text("\uf00d");

				// show remove tooltip
				$("#my-tooltip")
					.attr("data-tooltip", "Remove Event or Pattern")
					.css("top", myTooltipTop)
					.css("left", myTooltipLeft)
					.addClass("show top");
			}

			PatternTooltip.show(tooltipData, tagName, patternTooltipTop, patternTooltipLeft);

			// move to front
			d3.select(this).moveToFront();
			FunnelVis.splittingPointsByID[panelID][SID].el.moveToFront();
		}

		function mouseleaveTag() {
			$("#my-tooltip")
				.removeClass("show");
			d3.select(this).selectAll(".remove-button")
				.remove();
			d3.select(this).selectAll("*")
				.style("opacity", null);
			PatternTooltip.hide();
		}

		function clickTag(d) {
			var panelID = $(this).closest(".panel").attr("panel-id");
			var ForSID = d.ID;

			WebAPI.removeSorF(panelID, ForSID, afterRemovingSorF);
		}

		function afterRemovingSorF(response) {
			var updatedPanelID = response.updatedPanelID;
			var removedForSID = response.removedForSID;
			var minifiedFandS = response.minifiedFandS;
			var updatedPanelEl = $("#subsequence-view .panel[panel-id=" + updatedPanelID + "]")[0];
			var deletedAVPair = FandSManager.minifiedFandS[updatedPanelID][removedForSID].name; // do before update minifiedFandS

			FandSManager.update(minifiedFandS);
			FunnelVis.update(updatedPanelEl);
			Timeline.update(updatedPanelEl);
			ColourManager.refreshColourMarkers();
			$("#my-tooltip").removeClass("show"); // in case the mouse is on tag
			PatternTooltip.hide();
		}
	},
	updateTextByID: function(panelID) {
		var self = this;

		if (!(panelID in self.textByID))
			self.textByID[panelID] = {};

		self.updateTextData(panelID);
		self.removeRedundantText(panelID);
		self.updateTextStyles(panelID);
		self.updateTextDataBinding(panelID);
		self.initNewlyAddedTextEl(panelID);
	},
	updateTextData: function(panelID) { // 2 elements
		var self = this;
		var currentTagID = "start";
		var nextTagID = self.tagsByID[panelID]["start"].data.nextTagID;

		while (nextTagID != null) {
			var currentTextID = currentTagID + "-" + nextTagID;

			// create if not exist
			if (!(currentTextID in self.textByID[panelID]))
				self.initTextByID(panelID, currentTextID);

			// update data
			self.textByID[panelID][currentTextID].data.numberOfEvents = self.tagsByID[panelID][nextTagID].data.numberOfEventsBetweenThisAndPrevious;
			self.textByID[panelID][currentTextID].data.time = self.tagsByID[panelID][nextTagID].data.timeBetweenThisAndPrevious;
			self.allTextIDUpdated.push(currentTextID);

			// update currentTextID and nextTagID
			currentTagID = nextTagID;
			nextTagID = self.tagsByID[panelID][currentTagID].data.nextTagID;
		}
	},
	updateTextStyles: function(panelID) {
		var self = this;

		for (var currentTextID in self.textByID[panelID]) {
			var leftTagID = currentTextID.split("-")[0];
			var rightTagID = currentTextID.split("-")[1];
			var leftTagX = self.tagsByID[panelID][leftTagID].styles.x;
			var rightTagX = self.tagsByID[panelID][rightTagID].styles.x;
			var newX = leftTagX + (rightTagX - leftTagX) / 2;

			// update style
			self.textByID[panelID][currentTextID].styles.x = newX;
		}
	},
	updateTextDataBinding: function(panelID) {
		var self = this;

		for (var currentTextID in self.textByID[panelID]) {
			var data = self.textByID[panelID][currentTextID];
			self.textByID[panelID][currentTextID].el.datum(data);
		}
	},
	initNewlyAddedTextEl: function(panelID) {
		var self = this;

		for (var i = 0; i < self.newlyAddedTextID.length; i++) {
			var currentTextID = self.newlyAddedTextID[i];
			var leftTagID = currentTextID.split("-")[0];
			var initialX = self.tagsByID[panelID][leftTagID].styles.x;
			var initialTimeText = Helper.generateTimeString(self.textByID[panelID][currentTextID].data.time);
			var initialEventText = Math.round(self.textByID[panelID][currentTextID].data.numberOfEvents * 10) / 10 + " events";
			var textGroupEl = self.textByID[panelID][currentTextID].el.node();

			self.textByID[panelID][currentTextID].el
				.attr("transform", "translate(" + initialX + ",0)");
			self.textByID[panelID][currentTextID].el.select("text.time")
				.text(initialTimeText);
			self.textByID[panelID][currentTextID].el.select("text.number-of-events")
				.text(initialEventText);
			self.updateBackgroundRect(textGroupEl);
		}
	},
	updateColourMarkers: function(panelID) {
		var self = this;

		for (var tagID in self.tagsByID[panelID]) {
			var currentFullName = self.tagsByID[panelID][tagID].data.fullName;
			var currentTagEl = self.tagsByID[panelID][tagID].el;

			currentTagEl
				.classed("colour-marker active", true)
				.attr("colour-key", currentFullName);
		}
	},
	removeRedundantText: function(panelID) {
		var self = this;

		for (var currentTextID in self.textByID[panelID]) {
			if (self.allTextIDUpdated.indexOf(currentTextID) == -1) {
				self.textByID[panelID][currentTextID].el.remove();
				delete self.textByID[panelID][currentTextID];
			}
		}
	},
	initTextByID: function(panelID, textID) {
		var self = this;
		var textLayer = d3.select("#subsequence-view .panel[panel-id='" + panelID + "'] .timeline svg .timeline-group .text-layer");

		self.newlyAddedTextID.push(textID);

		self.textByID[panelID][textID] = {};
		self.textByID[panelID][textID].ID = textID;
		self.textByID[panelID][textID].el = textLayer.append("g")
			.on("mouseenter", mouseenterText);
		self.textByID[panelID][textID].el.append("rect")
			.attr("class", "time")
			.style("fill", "white");
		self.textByID[panelID][textID].el.append("rect")
			.attr("class", "number-of-events")
			.style("fill", "white");
		self.textByID[panelID][textID].el.append("text")
			.attr("class", "time")
			.attr("y", -9)
			.style("alignment-baseline", "middle")
			.style("text-anchor", "middle")
			.style("font-size", 11);
		self.textByID[panelID][textID].el.append("text")
			.attr("class", "number-of-events")
			.attr("y", 11)
			.style("alignment-baseline", "middle")
			.style("text-anchor", "middle")
			.style("font-size", 11);

		self.textByID[panelID][textID].styles = {};
		self.textByID[panelID][textID].styles.x = null;

		self.textByID[panelID][textID].data = {};
		self.textByID[panelID][textID].data.numberOfEvents = null;
		self.textByID[panelID][textID].data.time = null;

		// data binding
		self.textByID[panelID][textID].el
			.datum(self.textByID[panelID][textID]);

		function mouseenterText() {
			d3.select(this).moveToFront();
		}
	},
	moveOverlappingText: function(panelID) {
		var self = this;

		for (var currentTextID in self.textByID[panelID]) {
			var leftTagID = self.textByID[panelID][currentTextID].ID.split("-")[0];
			var rightTagID = self.textByID[panelID][currentTextID].ID.split("-")[1];
			var leftTagWidth = self.tagsByID[panelID][leftTagID].el.node().getBBox().width;
			var rightTagWidth = self.tagsByID[panelID][rightTagID].el.node().getBBox().width;
			var currentTextWidth = self.textByID[panelID][currentTextID].el.node().getBBox().width;

			var leftTagRightEdgeX = self.tagsByID[panelID][leftTagID].styles.x + leftTagWidth / 2;
			var rightTagLeftEdgeX = self.tagsByID[panelID][rightTagID].styles.x - rightTagWidth / 2;
			var currentTextLeftEdgeX = self.textByID[panelID][currentTextID].styles.x - currentTextWidth / 2;
			var currentTextRightEdgeX = self.textByID[panelID][currentTextID].styles.x + currentTextWidth / 2;
			var isOverlapped = (currentTextLeftEdgeX < leftTagRightEdgeX || currentTextRightEdgeX > rightTagLeftEdgeX);
			var textGroupEl = self.textByID[panelID][currentTextID].el.node();

			if (isOverlapped) {
				self.textByID[panelID][currentTextID].el.select("text.time").attr("y", -18)
				self.textByID[panelID][currentTextID].el.select("text.number-of-events").attr("y", 18);
				self.updateBackgroundRect(textGroupEl);
			}
			if (!isOverlapped) {
				self.textByID[panelID][currentTextID].el.select("text.time").attr("y", -9)
				self.textByID[panelID][currentTextID].el.select("text.number-of-events").attr("y", 11);
				self.updateBackgroundRect(textGroupEl);
			}
		}
	},
	updateVisualization: function(panelID) {
		var self = this;

		for (var currentTagID in self.tagsByID[panelID]) {
			// update text
			var newX = self.tagsByID[panelID][currentTagID].styles.x;
			var newText = self.tagsByID[panelID][currentTagID].styles.text;
			var newFontSize = self.tagsByID[panelID][currentTagID].styles.fontSize;
			var newFontColour = self.tagsByID[panelID][currentTagID].styles.fontColour;

			self.tagsByID[panelID][currentTagID].el
				.transition()
				.attr("transform", "translate(" + newX + ",0)");
			self.tagsByID[panelID][currentTagID].el.select("text")
				.style("font-size", newFontSize)
				.style("fill", newFontColour)
				.text(newText);

			// update rect
			var bbox = self.tagsByID[panelID][currentTagID].el.select("text").node().getBBox();
			var newFill = self.tagsByID[panelID][currentTagID].styles.fill;

			self.tagsByID[panelID][currentTagID].el.select("rect")
				.attr("x", bbox.x - 4)
				.attr("y", bbox.y - 3)
				.attr("width", bbox.width + 8)
				.attr("height", bbox.height + 6)
				.style("fill", newFill);
		}

		for (currentTextID in self.textByID[panelID]) {
			var newX = self.textByID[panelID][currentTextID].styles.x;
			var newTimeText = Helper.generateTimeString(self.textByID[panelID][currentTextID].data.time);
			var newEventText = Math.round(self.textByID[panelID][currentTextID].data.numberOfEvents * 10) / 10 + " events";
			var textGroupEl = self.textByID[panelID][currentTextID].el.node();

			self.textByID[panelID][currentTextID].el
				.transition()
				.attr("transform", "translate(" + newX + ",0)");
			self.textByID[panelID][currentTextID].el.select("text.time")
				.text(newTimeText)
				.style("opacity", "0")
				.transition()
				.style("opacity", null);
			self.textByID[panelID][currentTextID].el.select("text.number-of-events")
				.text(newEventText)
				.style("opacity", "0")
				.transition()
				.style("opacity", null);
			self.updateBackgroundRect(textGroupEl);
		}

		self.moveOverlappingText(panelID);
		self.updateTextHighlight(panelID);
	},
	updateTextHighlight: function(panelID) {
		var self = this;
		var timelineTextLayer = d3.select("#subsequence-view .panel[panel-id='" + panelID + "'] .timeline svg .timeline-group .text-layer");
		var isXScaleTime = $("#subsequence-view .panel[panel-id='" + panelID + "'] .top-bar .x-scale-toggle").hasClass("time");

		if (isXScaleTime) {
			timelineTextLayer.selectAll("text").classed("highlighted", false);
			timelineTextLayer.selectAll("text.time").classed("highlighted", true);
		}
		if (!isXScaleTime) {
			timelineTextLayer.selectAll("text").classed("highlighted", false);
			timelineTextLayer.selectAll("text.number-of-events").classed("highlighted", true);
		}
	},
	updatePlusSigns: function(panelID) {
		var self = this;
		var plusSignLayer = d3.select("#subsequence-view .panel[panel-id='" + panelID + "'] .timeline svg .timeline-group .plus-sign-layer");
		var startForSID = FandSManager.getLastFilterID(panelID);
		var currentTagID = "start";
		var nextTagID = self.tagsByID[panelID]["start"].data.nextTagID;

		plusSignLayer.selectAll("*").remove();

		while (nextTagID != null) {
			var ForSID = (currentTagID == "start") ? startForSID : currentTagID;
			var currentTagX = self.tagsByID[panelID][currentTagID].styles.x;
			var nextTagX = self.tagsByID[panelID][nextTagID].styles.x;
			var pluxSignX = (currentTagX + nextTagX) / 2;
			var pluxSignY = 0;

			var plusSign = plusSignLayer.append("g")
				.attr("class", "plus-sign tagID" + currentTagID)
				.attr("ForS-ID", ForSID)
				.attr("transform", "translate(" + pluxSignX + "," + pluxSignY + ")")
				.style("cursor", "pointer")
				.style("display", "none")
				.on("mouseover", mouseoverPlusSign)
				.on("mouseout", mouseoutPlusSign);
			var background = plusSign.append("rect")
				.attr("x", "-0.7em")
				.attr("y", "-0.15em")
				.attr("rx", 2)
				.attr("ry", 2)
				.attr("width", "1.4em")
				.attr("height", "0.3em")
				.style("fill", "white");
			var plusSignText = plusSign.append("text")
				.attr("x", 0)
				.attr("y", "0.11em")
				.style("font-family", "fontAwesome")
				.style("fill", "#83AF9B")
				.style("text-anchor", "middle")
				.style("alignment-baseline", "middle")
				.text("\uf067");

			// update SID
			currentTagID = nextTagID;
			nextTagID = self.tagsByID[panelID][currentTagID].data.nextTagID;
		}

		function mouseoverPlusSign() {
			var bbox = this.getBoundingClientRect();

			$("#my-tooltip")
				.attr("data-tooltip", "Add Event or Pattern")
				.css("top", bbox.top - 10)
				.css("left", bbox.left + bbox.width / 2)
				.addClass("show top")
		}

		function mouseoutPlusSign() {
			$("#my-tooltip")
				.removeClass("show");
		}
	},
	updateBackgroundRect: function(textGroupEl) {
		var timeTextBBox = d3.select(textGroupEl).select("text.time").node().getBBox();
		var eventTextBBox = d3.select(textGroupEl).select("text.number-of-events").node().getBBox();

		d3.select(textGroupEl).select("rect.time")
			.attr("x", timeTextBBox.x - 2)
			.attr("y", timeTextBBox.y + 2)
			.attr("width", timeTextBBox.width + 4)
			.attr("height", timeTextBBox.height - 4);
		d3.select(textGroupEl).select("rect.number-of-events")
			.attr("x", eventTextBBox.x - 2)
			.attr("y", eventTextBBox.y + 2)
			.attr("width", eventTextBBox.width + 4)
			.attr("height", eventTextBBox.height - 4);
	}
}