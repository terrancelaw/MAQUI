var FrequentPatternView = {
	patternContainerEl: null,
	patternMarginLeftRight: 10,
	patternHeight: 43,

	minimumSupport: null,
	attributeName: null,

	init: function() {
		var self = this;

		self.initPatternContainerEl();
		self.initMouseleaveContainerToRemoveButtons();
	},
	initPatternContainerEl: function() {
		var self = this;

		self.patternContainerEl = $("#inspection-view .frequent-pattern-view.content .container .all-patterns")[0];
	},
	initMouseleaveContainerToRemoveButtons: function() {
		$("#inspection-view .frequent-pattern-view.content .container").mouseleave(mouseleaveContainer);

		function mouseleaveContainer() {
			$(this).find(".buttons")
				.css("display", "none");
		}
	},
	retrieveFrequentPatterns: function(panelID, ForSID, outputType) {
		var self = this;
		var minSup = self.minimumSupport;
		var attrName = self.attributeName;

		self.showLoader();
		WebAPI.mineFrequentPattern(panelID, ForSID, outputType, minSup, attrName, afterMiningFrequentPattern);

		function afterMiningFrequentPattern(response) {
			var frequentPatterns = response.frequentPatterns;
			var tooManyFrequentPatterns = response.tooManyFrequentPatterns;

			self.hideLoader();
			self.update(tooManyFrequentPatterns, frequentPatterns);
			self.updateColourMarkers();
		}
	},
	clear: function() {
		var self = this;

		$(self.patternContainerEl).empty();
		self.hideLoader();
	},
	refresh: function() {
		var self = this;

		d3.select(self.patternContainerEl).selectAll(".pattern *").remove();
		self.drawAllRows();
	},
	showNoFrequentPatternMsg: function() {
		var self = this;

		$(self.patternContainerEl)
			.empty();
		$(self.patternContainerEl)
			.append("<div class='empty'>No frequent patterns found.</div>")
	},
	showTooManyFrequentPatternMsg: function() {
		var self = this;

		$(self.patternContainerEl)
			.empty();
		$(self.patternContainerEl)
			.append("<div class='empty'>There are too many frequent patterns to mine. Try to increase the minimum support.</div>")
	},
	createAndBindDataToRows: function(frequentPatterns) {
		var self = this;
		var patternDiv = d3.select(self.patternContainerEl).selectAll(".pattern")
			.data(frequentPatterns)
			.enter()
			.append("div")
			.attr("class", "pattern")
			.style("cursor", "pointer")
			.on("mouseenter", mouseenterPattern);

		function mouseenterPattern() {
			var patternBBox = this.getBoundingClientRect();
			var buttonContainerBBox = $("#inspection-view .frequent-pattern-view.content .container")[0].getBoundingClientRect();
			var scrollLeft = $("#inspection-view .frequent-pattern-view.content .all-patterns").scrollLeft();
			var originalTop = patternBBox.top - buttonContainerBBox.top + patternBBox.height / 2 - 30 / 2; // 30 is height of buttons
			var originalLeft = patternBBox.left - buttonContainerBBox.left + scrollLeft;
			var newTop = originalTop;
			var newLeft = patternBBox.left - buttonContainerBBox.left + scrollLeft - 71;
			var isCurrentPatternExpanded = $(this).hasClass("expanded");
			FrequentPatternViewButtons.currentPatternEl = this;

			if (isCurrentPatternExpanded) {
				$("#inspection-view .frequent-pattern-view.content .container .buttons .fa-caret")
					.removeClass("fa-caret-down");
				$("#inspection-view .frequent-pattern-view.content .container .buttons .fa-caret")
					.addClass("fa-caret-up");
				$("#inspection-view .frequent-pattern-view.content .container .buttons .fa-caret")
					.attr("tooltip-text", "Collapse Pattern");
			}
			if (!isCurrentPatternExpanded) {
				$("#inspection-view .frequent-pattern-view.content .container .buttons .fa-caret")
					.removeClass("fa-caret-up");
				$("#inspection-view .frequent-pattern-view.content .container .buttons .fa-caret")
					.addClass("fa-caret-down");
				$("#inspection-view .frequent-pattern-view.content .container .buttons .fa-caret")
					.attr("tooltip-text", "Expand Pattern");
			}
			
			d3.select("#inspection-view .frequent-pattern-view.content .container .buttons")
				.interrupt()
				.style("top", originalTop + "px")
				.style("left", originalLeft + "px")
				.transition()
				.style("top", newTop + "px")
				.style("left", newLeft + "px");

			$("#inspection-view .frequent-pattern-view.content .container .buttons") 
				.css("display", "block");
		}
	},
	drawAllRows: function() {
		var self = this;
		var patternDiv = d3.select(self.patternContainerEl).selectAll(".pattern")
		var patternGroups = patternDiv.append("svg").append("g")
			.attr("class", "pattern-group")
			.attr("transform", "translate(" + self.patternMarginLeftRight + "," + (self.patternHeight / 2) + ")");

		patternGroups.each(function(d) {
			var pattern = d.pattern;
			var support = Math.round(d.count / d.total * 100 * 10) / 10;
			var startXTranslate = 3;
			var currentXTranslate = startXTranslate;

			d3.select(this).append("text")
				.attr("dx", -1)
				.attr("dy", 11)
				.style("font-size", 9)
				.style("font-family", "Arial")
				.style("fill", "#a58975")
				.style("alignment-baseline", "middle")
				.text("Support: " + support + "% (" + d.count + "/" + d.total + ")");

			var lineBehindTags = d3.select(this).append("line")
				.attr("stroke", "#a58975")
				.attr("y1", -5)
				.attr("y2", -5)
				.attr("x1", startXTranslate); // set x2 after drawing the pattern

			for (var i = 0; i < pattern.length; i++) {
				var eventBoxLeftX = null;
				var eventBoxRightX = null;

				// draw AV pair
				for (var j = 0; j < pattern[i].length; j++) {
					var currentFullAVName = pattern[i][j];
					var backgroundColour = ColourManager.getColour(currentFullAVName, false);
					var textColour = ColourManager.getForegroundTextColour(backgroundColour);
					var strokeColour = (backgroundColour == "white") ? FunnelVis.linkColour.dark : "white";
					var strokeWidth = (backgroundColour == "white") ? 1 : 2;
					var shortAVName = ShortNameManager.getShortName(currentFullAVName);
					var textBBox = null;

					// padding before
					if (pattern[i].length > 1 && j == 0) {
						currentXTranslate += 3;
						eventBoxLeftX = currentXTranslate;
					}

					// draw the tag
					var AVPairGroup = d3.select(this).append("g")
						.datum(currentFullAVName)
						.attr("class", "AV-pair")
						.attr("transform", "translate(" + currentXTranslate + ",0)")
						.on("mouseenter", mouseenterAVPair)
						.on("mouseleave", mouseleaveAVPair);
					var text = AVPairGroup.append("text")
						.attr("dy", -5)
						.style("font-size", 9)
						.style("font-family", "Arial")
						.style("alignment-baseline", "middle")
						.style("fill", textColour)
						.text(shortAVName);
					textBBox = text.node().getBBox();
					AVPairGroup.insert("rect", "text")
						.attr("rx", 5)
						.attr("ry", 5)
						.attr("x", textBBox.x - 3)
						.attr("y", textBBox.y - 2)
						.attr("width", textBBox.width + 6)
						.attr("height", textBBox.height + 4)
						.style("fill", backgroundColour)
						.style("stroke", strokeColour)
						.style("stroke-width", strokeWidth);

					// padding between
					if (!(i == pattern.length - 1 && j == pattern[i].length - 1))
						currentXTranslate += AVPairGroup.node().getBBox().width + 5;

					// padding after
					if (pattern[i].length > 1 && j == pattern[i].length - 1) {
						currentXTranslate += 3;
						eventBoxRightX = currentXTranslate;
					}

					// draw the event box
					if (pattern[i].length > 1 && j == pattern[i].length - 1) {
						var AVPairBBox = AVPairGroup.node().getBBox();

						if (i == pattern.length - 1 && j == pattern[i].length - 1)
							eventBoxRightX += AVPairBBox.width + 5;

						d3.select(this).append("rect")
							.attr("rx", 3)
							.attr("ry", 3)
							.attr("x", eventBoxLeftX - 3 - 4)
							.attr("y", AVPairBBox.y - 3)
							.attr("width", eventBoxRightX - eventBoxLeftX)
							.attr("height", AVPairBBox.height + 6)
							.style("fill", "none")
							.style("stroke", "#705d4f")
							.style("stroke-dasharray", "5, 5");
					}

					// longer distance for av pairs between events
					if (i != pattern.length - 1)
						currentXTranslate += 15;
				}
			}

			lineBehindTags.attr("x2", currentXTranslate);

			// increase pattern div width if needed
			var currentPatternDivWidth = $(self.patternContainerEl).width();
			var patternDiv = $(d3.select(this).node()).closest(".pattern");
			var patternWidth = d3.select(this).node().getBBox().width + self.patternMarginLeftRight * 2;

			if (patternWidth > currentPatternDivWidth)
				patternDiv.css("width", patternWidth);
		});

		function mouseenterAVPair(d) {
			var currentAVPairName = d;
			var bbox = this.getBoundingClientRect();

			FrequentPatternView.highlightAVPairs(currentAVPairName);
			AttributeValuePairView.highlightAVPairs(currentAVPairName);
			RawSequenceView.highlightAVPairs(currentAVPairName);
			
			$("#my-tooltip")
				.attr("data-tooltip", currentAVPairName)
				.css("top", bbox.top - 10)
				.css("left", bbox.left + bbox.width / 2)
				.addClass("show top");
		}

		function mouseleaveAVPair(d) {
			var currentAVPairName = d;
			
			FrequentPatternView.removeHighlightAVPairs(currentAVPairName);
			AttributeValuePairView.removeHighlightAVPairs(currentAVPairName);
			RawSequenceView.removeHighlightAVPairs(currentAVPairName);

			$("#my-tooltip")
				.removeClass("show");
		}
	},
	update: function(tooManyFrequentPatterns, frequentPatterns) {
		var self = this;
		var noLinksHighlighted = d3.selectAll(".funnel .link-layer rect.highlighted").empty();

		if (tooManyFrequentPatterns) {
			self.showTooManyFrequentPatternMsg();
			return;
		}
		if (frequentPatterns.length == 0) {
			self.showNoFrequentPatternMsg();
			return;
		}
		if (noLinksHighlighted) // users may unselected a link before the patterns are loaded
			return;

		$(self.patternContainerEl).empty();
		self.createAndBindDataToRows(frequentPatterns);
		self.drawAllRows();
	},
	highlightAVPairs: function(AVPairName) {
		var self = this;

		d3.select(self.patternContainerEl).selectAll(".AV-pair")
			.each(function(d) {
				var currentAVPairName = d;

				if (AVPairName == currentAVPairName) {
					d3.select(this).select("rect")
						.style("fill", "#ffffd1")
						.style("stroke", FunnelVis.linkColour.dark)
						.style("stroke-width", 1);
					d3.select(this).select("text")
						.style("fill", "gray");
				}
			});
	},
	removeHighlightAVPairs: function(AVPairName) {
		var self = this;
		var backgroundColour = ColourManager.getColour(AVPairName, false);
		var textColour = ColourManager.getForegroundTextColour(backgroundColour);
		var strokeColour = (backgroundColour == "white") ? FunnelVis.linkColour.dark : "white";
		var strokeWidth = (backgroundColour == "white") ? 1 : 2;

		// restore all highlights
		d3.select(self.patternContainerEl).selectAll(".AV-pair")
			.each(function(d) {
				var currentAVPairName = d;

				if (AVPairName == currentAVPairName) {
					d3.select(this).selectAll("rect")
						.style("fill", backgroundColour)
						.style("stroke", strokeColour)
						.style("stroke-width", strokeWidth);
					d3.select(this).selectAll("text")
						.style("fill", textColour);
				}
			});
	},
	updateMinSupText: function() {
		var self = this;

		$("#inspection-view .frequent-pattern-view.content .controls .minimum-support")
			.html("Minimum Support: " + Math.round(self.minimumSupport * 100) + "%");
	},
	updateAttrNameText: function() {
		var self = this;

		$("#inspection-view .frequent-pattern-view.content .controls .attribute-name")
			.html("Attribute Name: " + self.attributeName);
	},
	showLoader: function() {
		$("#inspection-view .frequent-pattern-view.content .loader")
			.css("display", "block");
	},
	hideLoader: function() {
		$("#inspection-view .frequent-pattern-view.content .loader")
			.css("display", "none");
	},
	updateColourMarkers: function() {
		var self = this;

		d3.select(self.patternContainerEl).selectAll(".pattern .AV-pair")
			.classed("colour-marker", true)
			.attr("colour-key", function(d) {
				return d;
			});
	}
}