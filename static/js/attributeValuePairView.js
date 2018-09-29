var AttributeValuePairView = {
	AVPairContainerEl: null,
	AVPairMarginLeftRight: 10,
	AVPairHeight: 43,

	attributeName: null,
	attributeType: null,
	attrIsNumericalOrCategorical: null,
	timeUnit: null,

	AVPairs: null, // av pair data from server (for changing time unit)
	
	init: function() {
		var self = this;

		self.initAVPairContainerEl();
		self.initMouseleaveContainerToRemoveButtons();
	},
	initAVPairContainerEl: function() {
		var self = this;

		self.AVPairContainerEl = $("#inspection-view .attribute-value-pair-view.content .container .all-attribute-value-pairs")[0];
	},
	initMouseleaveContainerToRemoveButtons: function() {
		$("#inspection-view .attribute-value-pair-view.content .container").mouseleave(mouseleaveContainer);

		function mouseleaveContainer() {
			$(this).find(".buttons")
				.css("display", "none");
		}
	},
	retrieveAVPairs: function(panelID, ForSID, outputType) {
		var self = this;
		var attrName = self.attributeName;
		var attrType = self.attributeType;

		if (self.attrIsNumericalOrCategorical == "categorical") {
			self.showLoader();
			WebAPI.getValueList(panelID, ForSID, outputType, attrName, attrType, afterGettingAVPairs);
		}
		if (self.attrIsNumericalOrCategorical == "numerical") {
			self.showLoader();
			WebAPI.getDiscretizedNumericalAttrCount(panelID, ForSID, outputType, attrName, afterGettingAVPairs);
		}

		function afterGettingAVPairs(AVPairs) {
			self.AVPairs = AVPairs;
			self.hideLoader();
			self.processAVPairsFromServer(AVPairs);
			self.update(AVPairs);
			self.updateColourMarkers();
		}
	},
	clear: function() {
		var self = this;

		$(self.AVPairContainerEl).empty();
		self.hideLoader();
	},
	refresh: function() {
		var self = this;

		d3.select(self.AVPairContainerEl).selectAll(".AV-pair-div .AV-pair").each(function() {
			var AVPairGroup = d3.select(this)
				.attr("transform", "translate(3,0)");
			var text = AVPairGroup.select("text");

			textBBox = text.node().getBBox();
			AVPairGroup.select("rect")
				.attr("x", textBBox.x - 5)
				.attr("y", textBBox.y - 3)
				.attr("width", textBBox.width + 10)
				.attr("height", textBBox.height + 6);
		});
	},
	processAVPairsFromServer: function(AVPairs) {
		var self = this;

		if (self.attrIsNumericalOrCategorical == "numerical")
			return;

		for (var i = 0; i < AVPairs.length; i++)
			AVPairs[i].value = self.attributeName + "=" + AVPairs[i].value;
	},
	update: function(AVPairs) {
		var self = this;
		var noLinksHighlighted = d3.selectAll(".funnel .link-layer rect.highlighted").empty();

		if (AVPairs.length == 0)
			self.showNoAVPairsMsg();
		if (noLinksHighlighted || AVPairs.length == 0) // users may unselected a link before the patterns are loaded
			return;

		// empty content
		$(self.AVPairContainerEl).empty();

		// draw attribute value pairs
		var AVPairDivs = d3.select(self.AVPairContainerEl).selectAll(".AV-pair-div")
			.data(AVPairs)
			.enter()
			.append("div")
			.attr("class", "AV-pair-div")
			.style("cursor", "pointer")
			.on("mouseenter", mouseenterAVPairDiv);

		var AVPairGroups = AVPairDivs.append("svg").append("g")
			.attr("class", "AV-pair-group")
			.attr("transform", "translate(" + self.AVPairMarginLeftRight + "," + (self.AVPairHeight / 2) + ")");

		AVPairGroups.each(function(d) {
			var support = Math.round(d.count / d.total * 100 * 10) / 10;

			d3.select(this).append("text")
				.attr("dx", -1)
				.attr("dy", 12)
				.style("font-size", 9)
				.style("font-family", "Arial")
				.style("alignment-baseline", "middle")
				.style("fill", "#a58975")
				.text("% Event Sequences: " + support + "% (" + d.count + "/" + d.total + ")");

			if (self.attributeType == "event") {
				var currentFullAVName = d.value;
				var xTranslate = 3;
				var backgroundColour = ColourManager.getColour(currentFullAVName, false);
				var textColour = ColourManager.getForegroundTextColour(backgroundColour);
				var strokeColour = (backgroundColour == "white") ? FunnelVis.linkColour.dark : "white";
				var strokeWidth = (backgroundColour == "white") ? 1 : 2;
				var textBBox = null;

				var AVPairGroup = d3.select(this).append("g")
					.datum(currentFullAVName)
					.attr("class", "AV-pair")
					.attr("transform", "translate(" + xTranslate + ",0)")
					.on("mouseenter", mouseenterAVPair)
					.on("mouseleave", mouseleaveAVPair);

				var text = AVPairGroup.append("text")
					.attr("dy", -5)
					.style("font-size", 10)
					.style("font-family", "Arial")
					.style("alignment-baseline", "middle")
					.style("fill", textColour)
					.text(currentFullAVName);

				textBBox = text.node().getBBox();
				AVPairGroup.insert("rect", "text")
					.attr("rx", 5)
					.attr("ry", 5)
					.attr("x", textBBox.x - 5)
					.attr("y", textBBox.y - 3)
					.attr("width", textBBox.width + 10)
					.attr("height", textBBox.height + 6)
					.style("fill", backgroundColour)
					.style("stroke", strokeColour)
					.style("stroke-width", strokeWidth);
			}

			if (self.attributeType == "record") {
				var currentFullAVName = d.value;
				var xTranslate = 3;

				// change time based on the time unit
				if (self.attributeName == "time") {
					var splittedString = currentFullAVName.split(/(<=)|</);
					var lowerBound = parseFloat(splittedString[0]);
					var upperBound = parseFloat(splittedString[splittedString.length - 1]);
					var timeUnit = self.timeUnit;
					var adjustedLowerBound = Math.round(Helper.computeTime(lowerBound, timeUnit));
					var adjustedUpperBound = Math.round(Helper.computeTime(upperBound, timeUnit));
					var editedMiddleTimeString = currentFullAVName.replace(/[0-9.]/g,"").replace("time", " time ");
					currentFullAVName = adjustedLowerBound + " " + timeUnit + " " + editedMiddleTimeString + " " + adjustedUpperBound + " " + timeUnit;
				}

				var AVPairGroup = d3.select(this).append("g")
					.datum(currentFullAVName)
					.attr("class", "AV-pair")
					.attr("transform", "translate(" + xTranslate + ",0)")
					.on("mouseenter", mouseenterAVPair)
					.on("mouseleave", mouseleaveAVPair);

				var text = AVPairGroup.append("text")
					.attr("dy", -5)
					.style("font-size", 10)
					.style("font-family", "Arial")
					.style("alignment-baseline", "middle")
					.style("fill", "#adadad")
					.text(currentFullAVName);

				textBBox = text.node().getBBox();
				AVPairGroup.insert("rect", "text")
					.attr("rx", 3)
					.attr("ry", 3)
					.attr("x", textBBox.x - 5)
					.attr("y", textBBox.y - 3)
					.attr("width", textBBox.width + 10)
					.attr("height", textBBox.height + 6)
					.style("fill", "#f2f2f2")
					.style("stroke", "#d5d5d5")
					.style("stroke-width", 1);
			}
		});

		function mouseenterAVPairDiv() {
			var AVPairDivBBox = this.getBoundingClientRect();
			var buttonContainerBBox = $("#inspection-view .attribute-value-pair-view.content .container")[0].getBoundingClientRect();
			var originalTop = AVPairDivBBox.top - buttonContainerBBox.top + AVPairDivBBox.height / 2 - 30 / 2; // 30 is height of buttons
			var originalLeft = AVPairDivBBox.left - buttonContainerBBox.left;
			var newTop = originalTop;
			var newLeft = AVPairDivBBox.left - buttonContainerBBox.left - 29;
			AttributeValuePairViewButtons.currentAVPairEl = this;

			d3.select("#inspection-view .attribute-value-pair-view.content .container .buttons")
				.interrupt()
				.style("top", originalTop + "px")
				.style("left", originalLeft + "px")
				.transition()
				.style("top", newTop + "px")
				.style("left", newLeft + "px");

			$("#inspection-view .attribute-value-pair-view.content .container .buttons") 
				.css("display", "block");
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
	highlightAVPairs: function(AVPairName) {
		var self = this;

		d3.select(self.AVPairContainerEl).selectAll(".AV-pair")
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

		if (self.attributeType == "event") {
			var backgroundColour = ColourManager.getColour(AVPairName, false);
			var textColour = ColourManager.getForegroundTextColour(backgroundColour);
			var strokeColour = (backgroundColour == "white") ? FunnelVis.linkColour.dark : "white";
			var strokeWidth = (backgroundColour == "white") ? 1 : 2;

			d3.select(self.AVPairContainerEl).selectAll(".AV-pair")
				.each(function(d) {
					var currentAVPairName = d;

					if (AVPairName == currentAVPairName) {
						d3.select(this).select("rect")
							.style("fill", backgroundColour)
							.style("stroke", strokeColour)
							.style("stroke-width", strokeWidth);
						d3.select(this).select("text")
							.style("fill", textColour);
					}
				});
		}

		if (self.attributeType == "record") {
			d3.select(self.AVPairContainerEl).selectAll(".AV-pair")
				.each(function(d) {
					var currentAVPairName = d;

					if (AVPairName == currentAVPairName) {
						d3.select(this).select("rect")
							.style("fill", "#f2f2f2")
							.style("stroke", "#d5d5d5")
							.style("stroke-width", 1);
						d3.select(this).select("text")
							.style("fill", "#adadad");
					}
				});
		}
	},
	updateColourMarkers: function() {
		var self = this;

		if (self.attributeType == "event") {
			d3.select(self.AVPairContainerEl).selectAll(".AV-pair-div .AV-pair")
				.classed("colour-marker", true)
				.attr("colour-key", function(d) {
					return d;
				});
		}
	},
	showNoAVPairsMsg: function() {
		var self = this;

		$(self.AVPairContainerEl)
			.empty();
		$(self.AVPairContainerEl)
			.append("<div class='empty'>No attribute value pairs found.</div>")
	},
	updateAttrNameText: function() {
		var self = this;

		$("#inspection-view .attribute-value-pair-view.content .controls .attribute-name")
			.html("Attribute Name: " + self.attributeName + " (" + self.attributeType + " attribute)");
	},
	updateTimeUnitText: function() {
		var self = this;

		$("#inspection-view .attribute-value-pair-view.content .controls .time-unit")
			.html("Time Unit: " + self.timeUnit);
	},
	showLoader: function() {
		$("#inspection-view .attribute-value-pair-view.content .loader")
			.css("display", "block");
	},
	hideLoader: function() {
		$("#inspection-view .attribute-value-pair-view.content .loader")
			.css("display", "none");
	},
	showTimeUnit: function() {
		$("#inspection-view .attribute-value-pair-view.content .controls .time-unit")
			.css("display", "block");
	},
	hideTimeUnit: function() {
		$("#inspection-view .attribute-value-pair-view.content .controls .time-unit")
			.css("display", "none");
	},
	showOrHideTimeUnit: function() {
		var self = this;

		if (self.attributeName == "time")
			self.showTimeUnit();
		else
			self.hideTimeUnit();
	}
}