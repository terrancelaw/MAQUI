var RawSequenceView = {
	sequenceContainerEl: null,
	sequenceMarginLeftRight: 10,
	sequenceHeight: 30,

	attributeName: null,

	init: function() {
		var self = this;

		self.initSequenceContainerEl();
		self.initMouseleaveContainerToRemoveButtons();
	},
	initSequenceContainerEl: function() {
		var self = this;

		self.sequenceContainerEl = $("#inspection-view .raw-sequence-view.content .container .all-sequences")[0];
	},
	initMouseleaveContainerToRemoveButtons: function() {
		$("#inspection-view .raw-sequence-view.content .container").mouseleave(mouseleaveContainer);

		function mouseleaveContainer() {
			$(this).find(".buttons")
				.css("display", "none");
		}
	},
	retrieveRawSequences: function(panelID, ForSID, outputType) {
		var self = this;
		var attrName = self.attributeName;
		var numberOfSequencesShown = $("#inspection-view .raw-sequence-view.content .all-sequences .sequence").length;
		var numberOfSequencesRequested = numberOfSequencesShown + 10;

		self.showLoader();
		WebAPI.getRawSequences(panelID, ForSID, outputType, numberOfSequencesRequested, attrName, afterGettingRawSequences);

		function afterGettingRawSequences(response) {
			var rawSequences = response.rawSequences;
			var hasMoreToShow = response.hasMoreToShow;

			RawSequenceView.hideLoader();
			RawSequenceView.update(rawSequences, hasMoreToShow);
			RawSequenceView.updateColourMarkers();
		}
	},
	clear: function() {
		var self = this;

		$(self.sequenceContainerEl).empty();
		self.hideLoader();
	},
	createAndBindDataToRows: function(rawSequences) {
		var self = this;
		var sequenceDiv = d3.select(self.sequenceContainerEl).selectAll(".sequence")
			.data(rawSequences)
			.enter()
			.append("div")
			.attr("class", "sequence")
			.style("cursor", "pointer")
			.on("mouseenter", mouseenterSequence);

		function mouseenterSequence() {
			var sequenceBBox = this.getBoundingClientRect();
			var buttonContainerBBox = $("#inspection-view .raw-sequence-view.content .container")[0].getBoundingClientRect();
			var scrollLeft = $("#inspection-view .raw-sequence-view.content .all-sequences").scrollLeft();
			var originalTop = sequenceBBox.top - buttonContainerBBox.top + sequenceBBox.height / 2 - 30 / 2; // 30 is height of buttons
			var originalLeft = sequenceBBox.left - buttonContainerBBox.left + scrollLeft;
			var newTop = originalTop;
			var newLeft = sequenceBBox.left - buttonContainerBBox.left + scrollLeft - 29;
			var isCurrentSequenceExpanded = $(this).hasClass("expanded");
			RawSequenceViewButtons.currentSequenceEl = this;

			if (isCurrentSequenceExpanded) {
				$("#inspection-view .raw-sequence-view.content .container .buttons .fa-caret")
					.removeClass("fa-caret-down");
				$("#inspection-view .raw-sequence-view.content .container .buttons .fa-caret")
					.addClass("fa-caret-up");
				$("#inspection-view .raw-sequence-view.content .container .buttons .fa-caret")
					.attr("tooltip-text", "Collapse Pattern");
			}
			if (!isCurrentSequenceExpanded) {
				$("#inspection-view .raw-sequence-view.content .container .buttons .fa-caret")
					.removeClass("fa-caret-up");
				$("#inspection-view .raw-sequence-view.content .container .buttons .fa-caret")
					.addClass("fa-caret-down");
				$("#inspection-view .raw-sequence-view.content .container .buttons .fa-caret")
					.attr("tooltip-text", "Expand Pattern");
			}

			d3.select("#inspection-view .raw-sequence-view.content .container .buttons")
				.interrupt()
				.style("top", originalTop + "px")
				.style("left", originalLeft + "px")
				.transition()
				.style("top", newTop + "px")
				.style("left", newLeft + "px");

			$("#inspection-view .raw-sequence-view.content .container .buttons") 
				.css("display", "block");
		}
	},
	drawAllRows: function() {
		var self = this;
		var sequenceDiv = d3.select(self.sequenceContainerEl).selectAll(".sequence");
		var sequenceGroup = sequenceDiv.append("svg").append("g")
			.attr("class", "sequence-group")
			.attr("transform", "translate(" + self.sequenceMarginLeftRight + "," + (self.sequenceHeight / 2) + ")");

		sequenceGroup.each(function(d) {
			var eventSequence = d;
			var startXTranslate = 3;
			var currentXTranslate = startXTranslate;

			var lineBehindTags = d3.select(this).append("line")
				.attr("stroke", "#a58975")
				.attr("y1", 1)
				.attr("y2", 1)
				.attr("x1", startXTranslate); // set x2 after drawing the pattern

			for (var i = 0; i < eventSequence.length; i++) {
				var eventBoxLeftX = null;
				var eventBoxRightX = null;

				// draw AV pair
				for (var j = 0; j < eventSequence[i].length; j++) {
					var currentFullAVName = eventSequence[i][j];
					var backgroundColour = ColourManager.getColour(currentFullAVName, false);
					var textColour = ColourManager.getForegroundTextColour(backgroundColour);
					var strokeColour = (backgroundColour == "white") ? FunnelVis.linkColour.dark : "white";
					var strokeWidth = (backgroundColour == "white") ? 1 : 2;
					var shortAVName = ShortNameManager.getShortName(currentFullAVName);
					var textBBox = null;

					// padding before
					if (eventSequence[i].length > 1 && j == 0) {
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
						.attr("dy", 1)
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
					if (!(i == eventSequence.length - 1 && j == eventSequence[i].length - 1))
						currentXTranslate += AVPairGroup.node().getBBox().width + 5;

					// padding after
					if (eventSequence[i].length > 1 && j == eventSequence[i].length - 1) {
						currentXTranslate += 3;
						eventBoxRightX = currentXTranslate;
					}

					// draw the event box
					if (eventSequence[i].length > 1 && j == eventSequence[i].length - 1) {
						var AVPairBBox = AVPairGroup.node().getBBox();

						if (i == eventSequence.length - 1 && j == eventSequence[i].length - 1)
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
				}

				// longer distance for av pairs between events
				if (i != eventSequence.length - 1)
					currentXTranslate += 15;
			}

			lineBehindTags.attr("x2", currentXTranslate);

			// increase pattern div width if needed
			var currentSequenceDivWidth = $(self.sequenceContainerEl).width();
			var sequenceDiv = $(d3.select(this).node()).closest(".sequence");
			var sequenceWidth = d3.select(this).node().getBBox().width + self.sequenceMarginLeftRight * 2;

			if (sequenceWidth > currentSequenceDivWidth)
				sequenceDiv.css("width", sequenceWidth);
		});

		function mouseenterAVPair(d) {
			var currentAVPairName = d;
			var bbox = this.getBoundingClientRect();

			FrequentPatternView.highlightAVPairs(currentAVPairName);
			AttributeValuePairView.highlightAVPairs(currentAVPairName);
			RawSequenceView.highlightAVPairs(currentAVPairName);
			
			// show tooltip
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
			
			// remove tooltip
			$("#my-tooltip")
				.removeClass("show");
		}
	},
	drawShowMoreButton: function(hasMoreToShow) {
		var self = this;

		if (hasMoreToShow) {
			var moreButtonHTML = "<div class='more-button'>" +
									"<span>Click to Show More</span>" +
								"</div>";

			$(self.sequenceContainerEl)
				.append(moreButtonHTML);
			$(self.sequenceContainerEl).find(".more-button")
				.mouseenter(mouseenterMoreButton)
				.click(clickMoreButton);
		}

		function mouseenterMoreButton() {
			RawSequenceViewButtons.hide();
		}

		function clickMoreButton() {
			var panelID = InspectionView.currentPanelID;
			var ForSID = InspectionView.currentForSID;
			var outputType = InspectionView.currentOutputType;

			self.retrieveRawSequences(panelID, ForSID, outputType);
		}
	},
	refresh: function() {
		var self = this;

		d3.select(self.sequenceContainerEl).selectAll(".sequence *").remove();
		self.drawAllRows();
	},
	update: function(rawSequences, hasMoreToShow) {
		var self = this;
		var noLinksHighlighted = d3.selectAll(".funnel .link-layer rect.highlighted").empty();

		if (rawSequences.length == 0)
			self.showNoEventSequencesMsg();
		if (noLinksHighlighted || rawSequences.length == 0) // users may unselected a link before the sequences are loaded
			return;

		$(self.sequenceContainerEl).empty();
		self.createAndBindDataToRows(rawSequences);
		self.drawAllRows();
		self.drawShowMoreButton(hasMoreToShow);
	},
	highlightAVPairs: function(AVPairName) {
		var self = this;

		d3.select(self.sequenceContainerEl).selectAll(".AV-pair")
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
		d3.select(self.sequenceContainerEl).selectAll(".AV-pair")
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
	showNoEventSequencesMsg: function() {
		var self = this;

		$(self.sequenceContainerEl)
			.empty();
		$(self.sequenceContainerEl)
			.append("<div class='empty'>No event sequences found.</div>")
	},
	updateAttrNameText: function() {
		var self = this;

		$("#inspection-view .raw-sequence-view.content .controls .attribute-name")
			.html("Attribute Name: " + self.attributeName);
	},
	updateColourMarkers: function() {
		var self = this;

		d3.select(self.sequenceContainerEl).selectAll(".sequence .AV-pair")
			.classed("colour-marker", true)
			.attr("colour-key", function(d) {
				return d;
			});
	},
	showLoader: function() {
		$("#inspection-view .raw-sequence-view.content .loader")
			.css("display", "block");
	},
	hideLoader: function() {
		$("#inspection-view .raw-sequence-view.content .loader")
			.css("display", "none");
	}
}