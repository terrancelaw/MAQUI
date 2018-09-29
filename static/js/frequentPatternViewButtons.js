var FrequentPatternViewButtons = {
	currentPatternEl: null,
	expandedPatternMargin: { left: 17, right: 17, top: 25 },
	AVPairHeight: 28,
	AVPairStartY: 25,
	patternAreaStartingWidth: 35,
	frequentPatternIndex: 1,
	multipleEventsIndex: 1,

	init: function() {
		var self = this;
			
		self.initEnterButtonBehaviour();
		self.initClickExpandButton();
		self.initClickAddButton();
	},
	initEnterButtonBehaviour: function() {
		$("#inspection-view .frequent-pattern-view.content .container .buttons .button")
			.mouseenter(mouseenterButton)
			.mouseleave(mouseleaveButton);

		function mouseenterButton() {
			var tooltipText = $(this).attr("tooltip-text");
			var bbox = this.getBoundingClientRect();

			$("#my-tooltip")
				.attr("data-tooltip", tooltipText)
				.css("top", bbox.top - 10)
				.css("left", bbox.left + bbox.width / 2)
				.addClass("show top");
		}

		function mouseleaveButton() {
			$("#my-tooltip")
				.removeClass("show");
		}
	},
	initClickExpandButton: function() {
		var self = this;

		$("#inspection-view .frequent-pattern-view.content .container .buttons .fa-caret")
			.click(clickExpandButton);

		function clickExpandButton() {
			var needExpand = !$(self.currentPatternEl).hasClass("expanded");

			if (needExpand) {
				$(this).removeClass("fa-caret-down");
				$(this).addClass("fa-caret-up");
				$(this).attr("tooltip-text", "Collapse Pattern");
				$("#my-tooltip").attr("data-tooltip", "Collapse Pattern");
				self.addCaretToCollapsedPattern();
				self.createExpandedPattern();
				self.updateColourMarkers();
			}
			if (!needExpand) {
				$(this).removeClass("fa-caret-up");
				$(this).addClass("fa-caret-down");
				$(this).attr("tooltip-text", "Expand Pattern");
				$("#my-tooltip").attr("data-tooltip", "Expand Pattern");
				self.removeCaretFromCollapsePattern();
				self.removeExpandedPattern();
			}
		}
	},
	initClickAddButton: function() {
		var self = this;

		$("#inspection-view .frequent-pattern-view.content .container .buttons .fa-reply-all")
			.click(clickAddAllButton);
		$("#inspection-view .frequent-pattern-view.content .container .buttons .fa-plus")
			.click(clickAddOneButton);

		function clickAddAllButton() {
			var data = d3.select(self.currentPatternEl).datum();
			var selectedPattern = data.pattern;

			addAllAVPairs(selectedPattern);
		}

		function clickAddOneButton() {
			var data = d3.select(self.currentPatternEl).datum();
			var selectedPattern = data.pattern;
			var onlyHasOneAVPair = selectedPattern.length == 1 && selectedPattern[0].length == 1;

			if (onlyHasOneAVPair)
				addPatternWithOneAVPair(selectedPattern[0][0]);
			if (!onlyHasOneAVPair)
				addPatternWithMoreThanOneAVPair(selectedPattern);
		}

		function addAllAVPairs(pattern) {
			var panelID = InspectionView.currentPanelID;
			var ForSID = InspectionView.currentForSID;
			var onlyOneLinkInThePanel = Object.keys(FunnelVis.linksByID[panelID]).length == 1;
			var AVPairs = [];

			// generate AVPairs
			for (var i = 0; i < pattern.length; i++) {
				var AVPairSet = pattern[i];
				var AVPairObject = {}; // an AVPair here can be a AND pattern

				if (AVPairSet.length == 1) {
					var AVPair = AVPairSet[0];
					var splittedString = AVPair.split("=");
					var attributeName = splittedString[0];
					var attributeValue = splittedString[1];

					AVPairObject.type = "AVPair";
					AVPairObject.attributeName = attributeName;
					AVPairObject.attributeValue = attributeValue;
				}

				if (AVPairSet.length > 1) {
					var eventMatchers = Helper.createMatchers([ AVPairSet ]);
					PatternParser.createLogicTables(eventMatchers);
					var name = "Multiple Events #" + self.multipleEventsIndex++;
					var orderedAVPairsForEachMatcher = PatternParser.orderedAttrValuePairsForEachMatcher;
					var logicTableForEachMatcher = PatternParser.logicTableForEachMatcher;

					AVPairObject.type = "Pattern";
					AVPairObject.name = name;
					AVPairObject.eventMatchers = eventMatchers;
					AVPairObject.orderedAVPairsForEachMatcher = orderedAVPairsForEachMatcher;
					AVPairObject.logicTableForEachMatcher = logicTableForEachMatcher;
				}

				AVPairs.push(AVPairObject);
			}

			if (onlyOneLinkInThePanel) {
				WebAPI.createMultipleSimpleSplittingPoints(panelID, ForSID, AVPairs, function(response) {
					var updatedPanelID = response.updatedPanelID;
					var minifiedFandS = response.minifiedFandS;
					var updatedPanelEl = $("#subsequence-view .panel[panel-id=" + updatedPanelID + "]")[0];

					FandSManager.update(minifiedFandS);
					FunnelVis.update(updatedPanelEl);
					Timeline.update(updatedPanelEl);
					ColourManager.refreshColourMarkers();
				});
			}

			if (!onlyOneLinkInThePanel) {
				var data = { AVPairs: AVPairs };

				createNewPanel(data);
			}

			self.hide();
		}

		function addPatternWithOneAVPair(AVPair) {
			var splittedAVPair = AVPair.split("=");
			var attributeName = splittedAVPair[0];
			var attributeValue = splittedAVPair[1];
			var panelID = InspectionView.currentPanelID;
			var ForSID = InspectionView.currentForSID;
			var onlyOneLinkInThePanel = Object.keys(FunnelVis.linksByID[panelID]).length == 1;
			var data = {
				attributeName: attributeName,
				attributeValue: attributeValue
			}

			if (onlyOneLinkInThePanel) { // special case
				WebAPI.createSimpleSplittingPoint(panelID, ForSID, attributeName, attributeValue, function(response) {
					var updatedPanelID = response.updatedPanelID;
					var minifiedFandS = response.minifiedFandS;
					var updatedPanelEl = $("#subsequence-view .panel[panel-id=" + updatedPanelID + "]")[0];

					FandSManager.update(minifiedFandS);
					FunnelVis.update(updatedPanelEl);
					Timeline.update(updatedPanelEl);
					ColourManager.refreshColourMarkers();
				});
			}

			if (!onlyOneLinkInThePanel) {
				createNewPanel(data);
			}

			self.hide();
		}

		function addPatternWithMoreThanOneAVPair(pattern) {
			// process data
			var eventMatchers = Helper.createMatchers(pattern);
			PatternParser.createLogicTables(eventMatchers);

			// send to server
			var name = "Frequent Pattern #" + self.frequentPatternIndex++;
			var orderedAVPairsForEachMatcher = PatternParser.orderedAttrValuePairsForEachMatcher;
			var logicTableForEachMatcher = PatternParser.logicTableForEachMatcher;
			var panelID = InspectionView.currentPanelID;
			var ForSID = InspectionView.currentForSID;
			var onlyOneLinkInThePanel = Object.keys(FunnelVis.linksByID[panelID]).length == 1;
			var data = {
				name: name,
				eventMatchers: eventMatchers,
				orderedAVPairsForEachMatcher: orderedAVPairsForEachMatcher,
				logicTableForEachMatcher: logicTableForEachMatcher
			}

			if (onlyOneLinkInThePanel) { // special case
				WebAPI.createPatternSplittingPoint(panelID, ForSID, name, eventMatchers, orderedAVPairsForEachMatcher, logicTableForEachMatcher, function(response) {
					var updatedPanelID = response.updatedPanelID;
					var minifiedFandS = response.minifiedFandS;
					var updatedPanelEl = $("#subsequence-view .panel[panel-id=" + updatedPanelID + "]")[0];

					FandSManager.update(minifiedFandS);
					FunnelVis.update(updatedPanelEl);
					Timeline.update(updatedPanelEl);
					ColourManager.refreshColourMarkers();
				});
			}

			if (!onlyOneLinkInThePanel) {
				createNewPanel(data);
			}
			
			self.hide();
		}

		function createNewPanel(data) {
			var highlightedLinkEl = d3.selectAll(".funnel .link-layer rect.highlighted").node();
			var panelID = $(highlightedLinkEl).closest(".panel").attr("panel-id");
			var ForSID = $(highlightedLinkEl).attr("ForS-ID");
			var outputType = $(highlightedLinkEl).attr("output-type");
			var newPanelEl = SubsequenceView.appendPanel();
			var clickedLinkLeftSID = d3.select(highlightedLinkEl).datum().data.leftSID;
			var clickedLinkRightSID = d3.select(highlightedLinkEl).datum().data.rightSID;

			TopBar.init(newPanelEl);
			FunnelVis.init(newPanelEl);
			Timeline.init(newPanelEl);
			SubsequenceView.scrollToBottom();
			SubsequenceView.createNewPanelOnServer(panelID, ForSID, outputType, false, newPanelEl, clickedLinkLeftSID, clickedLinkRightSID, afterCreatingNewPanel);

			function afterCreatingNewPanel(response) {
				var newPanelID = response.newPanelID;
				var startingForSID = FandSManager.getLastFilterID(newPanelID);
				var newPanelEl = $("#subsequence-view .panel[panel-id=" + newPanelID + "]")[0];

				setTimeout(function() { addPatternToFunnel(newPanelID, startingForSID, data) }, 200); // keep track of changes
			}
		}

		function addPatternToFunnel(panelID, ForSID, data) {
			var patternContainsOneEvent = "attributeName" in data  && "attributeValue" in data;
			var addMultipleAVPairs = "AVPairs" in data;

			if (addMultipleAVPairs) {
				var AVPairs = data.AVPairs;

				WebAPI.createMultipleSimpleSplittingPoints(panelID, ForSID, AVPairs, afterCreatingSplittingPoint);
			}

			if (!addMultipleAVPairs && patternContainsOneEvent) {
				var attributeName = data.attributeName;
				var attributeValue = data.attributeValue;

				WebAPI.createSimpleSplittingPoint(panelID, ForSID, attributeName, attributeValue, afterCreatingSplittingPoint);
			}

			if (!addMultipleAVPairs && !patternContainsOneEvent) {
				var name = data.name;
				var eventMatchers = data.eventMatchers;
				var orderedAVPairsForEachMatcher = data.orderedAVPairsForEachMatcher;
				var logicTableForEachMatcher = data.logicTableForEachMatcher;

				WebAPI.createPatternSplittingPoint(panelID, ForSID, name, eventMatchers, orderedAVPairsForEachMatcher, logicTableForEachMatcher, afterCreatingSplittingPoint);
			}
		}

		function afterCreatingSplittingPoint(response) {
			var updatedPanelID = response.updatedPanelID;
			var minifiedFandS = response.minifiedFandS;
			var updatedPanelEl = $("#subsequence-view .panel[panel-id=" + updatedPanelID + "]")[0];

			FandSManager.update(minifiedFandS);
			FunnelVis.update(updatedPanelEl);
			Timeline.update(updatedPanelEl);
			ColourManager.refreshColourMarkers();

			// transition hack
			FunnelVis.interruptTransition(updatedPanelID, "start", "1");
			FunnelVis.highlightLinksInPanel(updatedPanelID, "start", "end");
			setTimeout(function() { FunnelVis.removeHighlightLinksInPanel(updatedPanelID); }, 300);
		}
	},
	addCaretToCollapsedPattern: function() {
		var self = this;
		var patternGroupNewX = FrequentPatternView.patternMarginLeftRight + 25;
		var patternGroupY = FrequentPatternView.patternHeight / 2;
		var arrowOriginalX = -10;
		var arrowNewX = 12;
		var arrowY = FrequentPatternView.patternHeight / 2;

		// shift pattern group
		d3.select(self.currentPatternEl).select(".pattern-group")
			.transition()
			.attr("transform", "translate(" + patternGroupNewX + "," + patternGroupY + ")");

		// add button
		d3.select(self.currentPatternEl).select("svg").append("text")
			.attr("class", "arrow-down-symbol")
			.attr("x", arrowOriginalX)
			.attr("y", arrowY)
			.attr("dy", 1)
			.style("font-family", "FontAwesome")
			.style("alignment-baseline", "middle")
			.style("fill", "gray")
			.style("opacity", 0.5)
			.transition()
			.attr("x", arrowNewX)
			.attr("y", arrowY)
			.text("\uf0ab");
	},
	createExpandedPattern: function() {
		var self = this;
		var data = d3.select(self.currentPatternEl).datum();
		var selectedPattern = data.pattern;
		var support = Math.round(data.count / data.total * 100 * 10) / 10;

		$("<div class='expanded-pattern' style='display:none'><svg></svg></div>")
			.insertAfter($(self.currentPatternEl));
		$(self.currentPatternEl)
			.addClass("expanded");

		var expandedPatternEl = $(self.currentPatternEl).next(".expanded-pattern")[0];
		var expandedPatternSVG = d3.select(expandedPatternEl).select("svg");
		var expandedPatternSVGGroup = expandedPatternSVG.append("g")
			.attr("transform", "translate(" + self.expandedPatternMargin.left + "," + self.expandedPatternMargin.top + ")");

		// fade in expanded pattern
		$(expandedPatternEl).mouseenter(mouseenterExpandedPattern);
		$(expandedPatternEl).fadeIn(500);

		// draw title
		expandedPatternSVGGroup.append("text")
			.attr("x", 0)
			.attr("y", 0)
			.style("fill", "gray")
			.text("Expanded Pattern ( Support = " + support + "% )");

		// draw av pairs
		var patternGroup = expandedPatternSVGGroup.append("g");
		var AVPairGroups = patternGroup.selectAll("g")
			.data(selectedPattern)
			.enter()
			.append("g")
			.attr("class", "AV-pair")
			.attr("cursor", "pointer")
			.on("mouseenter", mouseenterAVPair)
			.on("mouseleave", mouseleaveAVPair);

		AVPairGroups.each(function(d, i) {
			var currentFullAVName = d;
			var backgroundColour = ColourManager.getColour(currentFullAVName, false);
			var textColour = ColourManager.getForegroundTextColour(backgroundColour);
			var strokeColour = (backgroundColour == "white") ? FunnelVis.linkColour.dark : "white";
			var strokeWidth = (backgroundColour == "white") ? 1 : 2;

			var text = d3.select(this).append("text")
				.attr("x", 0)
				.attr("y", self.AVPairStartY + i * self.AVPairHeight)
				.style("font-size", 10)
				.style("font-family", "Arial")
				.style("text-anchor", "middle")
				.style("alignment-baseline", "middle")
				.style("fill", textColour)
				.text(d);

			var textBBox = text.node().getBBox();
			d3.select(this).insert("rect", "text")
				.attr("rx", 5)
				.attr("ry", 5)
				.attr("x", textBBox.x - 5)
				.attr("y", textBBox.y - 3)
				.attr("width", textBBox.width + 10)
				.attr("height", textBBox.height + 6)
				.style("fill", backgroundColour)
				.style("stroke", strokeColour)
				.style("stroke-width", strokeWidth);
		});

		// translate pattern group
		var bbox = patternGroup.node().getBBox();
		var patternWidth = bbox.width;

		patternGroup
			.attr("transform", "translate(" + (patternWidth / 2) + ",0)");

		// draw area chart
		var firstAVPair = expandedPatternSVGGroup.select(".AV-pair");
		var bbox = firstAVPair.node().getBBox();
		var startY = self.AVPairStartY;
		var endY = self.AVPairStartY + self.AVPairHeight * (selectedPattern.length - 1);
		var middleX = bbox.x + bbox.width / 2 + patternWidth / 2;
		var areaStartingWidth = (self.patternAreaStartingWidth > bbox.width) ? bbox.width * 0.8 : self.patternAreaStartingWidth;
		var areaArray = [
			{ x0: middleX - areaStartingWidth / 2, x1: middleX + areaStartingWidth / 2, y: startY },
			{ x0: middleX - areaStartingWidth * 0.2 / 2, x1: middleX + areaStartingWidth * 0.2 / 2, y: endY }
		];
		var area = d3.area()
			.x0(function(d) { return d.x0; })
			.x1(function(d) { return d.x1; })
			.y(function(d) { return d.y; });
		var areaPath = area(areaArray);

		expandedPatternSVGGroup.insert("path", ":first-child")
			.attr("d", areaPath)
			.style("fill", FunnelVis.linkColour.dark)
			.style("opacity", 0.5)
			.style("stroke", "none");

		// change svg height
		var svgGroupBBox = expandedPatternSVGGroup.node().getBoundingClientRect();
		var svgHeight = svgGroupBBox.height + self.expandedPatternMargin.top;
		var svgWidth = svgGroupBBox.width + self.expandedPatternMargin.left + self.expandedPatternMargin.right;
		var expandedPatternDivWidth = $(expandedPatternEl).width();

		expandedPatternSVG
			.attr("width", svgWidth)
			.attr("height", svgHeight);

		if (expandedPatternDivWidth < svgWidth)
			$(expandedPatternEl)
				.css("width", svgWidth);

		function mouseenterExpandedPattern() {
			self.hide();
		}

		function mouseenterAVPair(d) {
			var currentAVPairName = d;

			FrequentPatternView.highlightAVPairs(currentAVPairName);
			AttributeValuePairView.highlightAVPairs(currentAVPairName);
			RawSequenceView.highlightAVPairs(currentAVPairName);
		}

		function mouseleaveAVPair(d) {
			var currentAVPairName = d;

			FrequentPatternView.removeHighlightAVPairs(currentAVPairName);
			AttributeValuePairView.removeHighlightAVPairs(currentAVPairName);
			RawSequenceView.removeHighlightAVPairs(currentAVPairName);
		}
	},
	updateColourMarkers: function() {
		var self = this;
		var expandedPatternEl = $(self.currentPatternEl).next(".expanded-pattern")[0];

		d3.select(expandedPatternEl).selectAll(".AV-pair")
			.classed("colour-marker-passive", true)
			.attr("colour-key", function(d) {
				return d;
			});
	},
	removeCaretFromCollapsePattern: function() {
		var self = this;
		var patternGroupNewX = FrequentPatternView.patternMarginLeftRight;
		var patternGroupY = FrequentPatternView.patternHeight / 2;
		var arrowNewX = -10;
		var arrowY = FrequentPatternView.patternHeight / 2;

		// shift pattern group
		d3.select(self.currentPatternEl).select(".pattern-group")
			.transition()
			.attr("transform", "translate(" + patternGroupNewX + "," + patternGroupY + ")");

		// add button
		d3.select(self.currentPatternEl).select("svg .arrow-down-symbol")
			.transition()
			.attr("x", arrowNewX)
			.remove();
	},
	removeExpandedPattern: function() {
		var self = this;

		$(self.currentPatternEl).next(".expanded-pattern")
			.remove();
		$(self.currentPatternEl)
			.removeClass("expanded");
	},
	hide: function() {
		$("#inspection-view .frequent-pattern-view.content .container .buttons") 
			.css("display", "none");
	}
}