var RawSequenceViewButtons = {
	currentSequenceEl: null,
	expandedSequenceMargin: { left: 17, right: 17, top: 25 },
	AVPairHeight: 28,
	AVPairStartY: 25,
	sequenceAreaStartingWidth: 35,

	init: function() {
		var self = this;

		self.initEnterButtonBehaviour();
		self.initClickExpandButton();
	},
	initEnterButtonBehaviour: function() {
		$("#inspection-view .raw-sequence-view.content .container .buttons .button")
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

		$("#inspection-view .raw-sequence-view.content .container .buttons .fa-caret")
			.click(clickExpandButton);

		function clickExpandButton() {
			var needExpand = !$(self.currentSequenceEl).hasClass("expanded");

			if (needExpand) {
				$(this).removeClass("fa-caret-down");
				$(this).addClass("fa-caret-up");
				$(this).attr("tooltip-text", "Collapse Pattern");
				$("#my-tooltip").attr("data-tooltip", "Collapse Pattern");
				self.addCaretToCollapsedSequence();
				self.createExpandedSequence();
				self.updateColourMarkers();
			}
			if (!needExpand) {
				$(this).removeClass("fa-caret-up");
				$(this).addClass("fa-caret-down");
				$(this).attr("tooltip-text", "Expand Pattern");
				$("#my-tooltip").attr("data-tooltip", "Expand Pattern");
				self.removeCaretFromCollapseSequence();
				self.removeExpandedSequence();
			}
		}
	},
	addCaretToCollapsedSequence: function() {
		var self = this;
		var sequenceGroupNewX = RawSequenceView.sequenceMarginLeftRight + 25;
		var sequenceGroupY = RawSequenceView.sequenceHeight / 2;
		var arrowOriginalX = -10;
		var arrowNewX = 13;
		var arrowY = RawSequenceView.sequenceHeight / 2;

		// shift pattern group
		d3.select(self.currentSequenceEl).select(".sequence-group")
			.transition()
			.attr("transform", "translate(" + sequenceGroupNewX + "," + sequenceGroupY + ")");

		// add button
		d3.select(self.currentSequenceEl).select("svg").append("text")
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
	createExpandedSequence: function() {
		var self = this;
		var selectedSequence = d3.select(self.currentSequenceEl).datum();

		$("<div class='expanded-sequence' style='display:none'><svg></svg></div>")
			.insertAfter($(self.currentSequenceEl));
		$(self.currentSequenceEl)
			.addClass("expanded");

		var expandedSequenceEl = $(self.currentSequenceEl).next(".expanded-sequence")[0];
		var expandedSequenceSVG = d3.select(expandedSequenceEl).select("svg");
		var expandedSequenceSVGGroup = expandedSequenceSVG.append("g")
			.attr("transform", "translate(" + self.expandedSequenceMargin.left + "," + self.expandedSequenceMargin.top + ")");

		// fade in expanded pattern
		$(expandedSequenceEl).mouseenter(mouseenterExpandedSequence);
		$(expandedSequenceEl).fadeIn(500);

		// draw title
		expandedSequenceSVGGroup.append("text")
			.attr("x", 0)
			.attr("y", 0)
			.style("fill", "gray")
			.text("Expanded Event Sequence");

		// draw av pairs
		var sequenceGroup = expandedSequenceSVGGroup.append("g");
		var AVPairGroups = sequenceGroup.selectAll("g")
			.data(selectedSequence)
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

		// translate sequence group
		var bbox = sequenceGroup.node().getBBox();
		var sequenceWidth = bbox.width;

		sequenceGroup
			.attr("transform", "translate(" + (sequenceWidth / 2) + ",0)");

		// draw area chart
		var firstAVPair = expandedSequenceSVGGroup.select(".AV-pair");
		var bbox = firstAVPair.node().getBBox();
		var startY = self.AVPairStartY;
		var endY = self.AVPairStartY + self.AVPairHeight * (selectedSequence.length - 1);
		var middleX = bbox.x + bbox.width / 2 + sequenceWidth / 2;
		var areaStartingWidth = (self.sequenceAreaStartingWidth > bbox.width) ? bbox.width * 0.8 : self.sequenceAreaStartingWidth;
		var areaArray = [
			{ x0: middleX - areaStartingWidth / 2, x1: middleX + areaStartingWidth / 2, y: startY },
			{ x0: middleX - areaStartingWidth * 0.2 / 2, x1: middleX + areaStartingWidth * 0.2 / 2, y: endY }
		];
		var area = d3.area()
			.x0(function(d) { return d.x0; })
			.x1(function(d) { return d.x1; })
			.y(function(d) { return d.y; });
		var areaPath = area(areaArray);

		expandedSequenceSVGGroup.insert("path", ":first-child")
			.attr("d", areaPath)
			.style("fill", FunnelVis.linkColour.dark)
			.style("opacity", 0.5)
			.style("stroke", "none");

		// change svg width and height + div width
		var svgGroupBBox = expandedSequenceSVGGroup.node().getBoundingClientRect();
		var svgHeight = svgGroupBBox.height + self.expandedSequenceMargin.top;
		var svgWidth = svgGroupBBox.width + self.expandedSequenceMargin.left + self.expandedSequenceMargin.right;
		var expandedSequenceDivWidth = $(expandedSequenceEl).width();
		
		expandedSequenceSVG
			.attr("height", svgHeight)
			.attr("width", svgWidth);

		if (expandedSequenceDivWidth < svgWidth)
			$(expandedSequenceEl)
				.css("width", svgWidth);

		function mouseenterExpandedSequence() {
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
		var expandedSequenceEl = $(self.currentSequenceEl).next(".expanded-sequence")[0];

		d3.select(expandedSequenceEl).selectAll(".AV-pair")
			.classed("colour-marker-passive", true)
			.attr("colour-key", function(d) {
				return d;
			});
	},
	removeCaretFromCollapseSequence: function() {
		var self = this;
		var sequenceGroupNewX = RawSequenceView.sequenceMarginLeftRight;
		var sequenceGroupY = RawSequenceView.sequenceHeight / 2;
		var arrowNewX = -10;
		var arrowY = RawSequenceView.sequenceHeight / 2;

		// shift pattern group
		d3.select(self.currentSequenceEl).select(".sequence-group")
			.transition()
			.attr("transform", "translate(" + sequenceGroupNewX + "," + sequenceGroupY + ")");

		// add button
		d3.select(self.currentSequenceEl).select("svg .arrow-down-symbol")
			.transition()
			.attr("x", arrowNewX)
			.remove();
	},
	removeExpandedSequence: function() {
		var self = this;

		$(self.currentSequenceEl).next(".expanded-sequence")
			.remove();
		$(self.currentSequenceEl)
			.removeClass("expanded");
	},
	hide: function() {
		$("#inspection-view .raw-sequence-view.content .container .buttons") 
			.css("display", "none");
	}
}