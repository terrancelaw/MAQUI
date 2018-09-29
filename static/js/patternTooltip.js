var PatternTooltip = {
	sequenceAreaStartingWidth: 35,

	show: function(tooltipData, tagName, top, left) {
		var self = this;

		self.display();
		self.render(tooltipData, tagName);
		self.adjustWidthAndHeight(top, left);
	},
	hide: function() {
		$("#pattern-tooltip")
			.css("display", "none");
	},
	display: function(top) {
		$("#pattern-tooltip")
			.css("display", "block");
	},
	render: function(tooltipData, tagName) {
		var self = this;
		var onlyOneAVPair = tooltipData.length == 1 && tooltipData[0].length == 1;
		var firstMatcherItemIsParentheses = tooltipData[0][0].itemName == "(";
		var currentEventMatcherGroupY = onlyOneAVPair ? 7 : firstMatcherItemIsParentheses ? 28 : 32; // if contain more than one av, title is drawn

		// empty
		d3.select("#pattern-tooltip svg *")
			.remove();

		// draw whole group
		var patternGroup = d3.select("#pattern-tooltip svg").append("g")
			.attr("class", "pattern-group");

		// draw title
		if (!onlyOneAVPair) {
			patternGroup.append("text")
				.attr("x", 0)
				.attr("y", 7)
				.style("text-anchor", "middle")
				.style("alignment-baseline", "middle")
				.style("font-family", "Arial")
				.style("font-size", 11)
				.text(tagName);
		}

		// draw av pairs
		var eventMatcherGroups = patternGroup.selectAll("g")
			.data(tooltipData)
			.enter()
			.append("g")
			.attr("class", "event-matcher-group");

		eventMatcherGroups.each(function(d, matcherIndex) {
			var eventMatcherItems = d; // AV pairs and operators
			var onlyOneAVPairInMatcher = d.length == 1;
			var notLastMatcher = matcherIndex != tooltipData.length - 1;

			// draw matcher items inside an event
			for (var i = 0; i < eventMatcherItems.length; i++) {
				var currentMatcherItemType = eventMatcherItems[i].type;
				var currentMatcherItemName = eventMatcherItems[i].itemName;
				var currentMatcherContainsMoreThanOneAVPair = eventMatcherItems.length > 1;
				var isStartOrEnd = (currentMatcherItemName == "Start" || currentMatcherItemName == "End");

				if (currentMatcherItemType == "AVPair" && onlyOneAVPair) {
					var currentMatcherItemAttrName = eventMatcherItems[i].data.attributeName;
					var currentMatcherItemAttrValue = eventMatcherItems[i].data.attributeValue;
					var fullAVPairName = currentMatcherItemAttrName + "=" + currentMatcherItemAttrValue;

					if (isStartOrEnd)
						fullAVPairName = currentMatcherItemName;

					var AVPairGroup = d3.select(this).append("g");
					var text = AVPairGroup.append("text")
						.attr("x", 0)
						.attr("y", currentEventMatcherGroupY)
						.style("font-size", 10)
						.style("font-family", "Arial")
						.style("text-anchor", "middle")
						.style("alignment-baseline", "middle")
						.style("fill", "gray")
						.text(fullAVPairName);
				}
				if (currentMatcherItemType == "AVPair" && !onlyOneAVPair) {
					var currentMatcherItemAttrName = eventMatcherItems[i].data.attributeName;
					var currentMatcherItemAttrValue = eventMatcherItems[i].data.attributeValue;
					var fullAVPairName = currentMatcherItemAttrName + "=" + currentMatcherItemAttrValue;
					var backgroundColour = ColourManager.getColour(fullAVPairName, false);
					var textColour = ColourManager.getForegroundTextColour(backgroundColour);
					var strokeColour = (backgroundColour == "white") ? FunnelVis.linkColour.dark : "white";
					var strokeWidth = (backgroundColour == "white") ? 1 : 2;

					if (currentMatcherContainsMoreThanOneAVPair && i == 0) // small padding before
						currentEventMatcherGroupY += 5;

					var AVPairGroup = d3.select(this).append("g");
					var text = AVPairGroup.append("text")
						.attr("x", 0)
						.attr("y", currentEventMatcherGroupY)
						.style("font-size", 10)
						.style("font-family", "Arial")
						.style("text-anchor", "middle")
						.style("alignment-baseline", "middle")
						.style("fill", textColour)
						.text(fullAVPairName);

					var textBBox = text.node().getBBox();
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
					
					if (currentMatcherContainsMoreThanOneAVPair && i != eventMatcherItems.length - 1) // padding between
						currentEventMatcherGroupY += 15;
					if (!currentMatcherContainsMoreThanOneAVPair && notLastMatcher || (currentMatcherContainsMoreThanOneAVPair && i == eventMatcherItems.length - 1 && notLastMatcher)) // padding between
						currentEventMatcherGroupY += 30;
					if (currentMatcherContainsMoreThanOneAVPair && i == eventMatcherItems.length - 1 && notLastMatcher) // small padding after
						currentEventMatcherGroupY += 5;
				}
				if (currentMatcherItemType == "operator") {
					var operatorGroup = d3.select(this).append("g");
					var symbol = currentMatcherItemName;

					if (symbol == "(" || symbol == ")") {
						operatorGroup.append("text")
							.attr("x", 0)
							.attr("y", 0)
							.attr("transform", "translate(0," + currentEventMatcherGroupY + ") rotate(90)")
							.style("font-size", 9)
							.style("font-weight", "bold")
							.style("font-family", "Arial")
							.style("text-anchor", "middle")
							.style("alignment-baseline", "middle")
							.style("fill", "#494949")
							.text(symbol);
					}
					else {
						operatorGroup.append("text")
							.attr("x", 0)
							.attr("y", currentEventMatcherGroupY)
							.style("font-size", 9)
							.style("font-weight", "bold")
							.style("font-family", "Arial")
							.style("text-anchor", "middle")
							.style("alignment-baseline", "middle")
							.style("fill", "#494949")
							.text(symbol);
					}

					if (i != eventMatcherItems.length - 1) // padding between
						currentEventMatcherGroupY += 15;
					if (i == eventMatcherItems.length - 1 && notLastMatcher) // padding between
						currentEventMatcherGroupY += 30;
					if (i == eventMatcherItems.length - 1 && notLastMatcher) // padding after
						currentEventMatcherGroupY += 5;
				}
			}

			// draw rect box for matchers with more than one AV pair
			if (!onlyOneAVPairInMatcher) {
				var eventMatcherBBox = this.getBBox();

				d3.select(this).insert("rect", ":first-child")
					.attr("x", eventMatcherBBox.x - 5)
					.attr("y", eventMatcherBBox.y - 5)
					.attr("width", eventMatcherBBox.width + 10)
					.attr("height", eventMatcherBBox.height + 10)
					.style("fill", "white")
					.style("stroke", "gray")
					.style("stroke-dasharray", "5, 5");
			}
		});

		// draw area chart
		var firstEventMatcher = patternGroup.select(".event-matcher-group");
		var bbox = firstEventMatcher.node().getBBox();
		var startY = bbox.y + bbox.height / 2;
		var endY = currentEventMatcherGroupY;
		var middleX = bbox.x + bbox.width / 2;
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

		d3.select("#pattern-tooltip svg .pattern-group").insert("path", ":first-child")
			.attr("d", areaPath)
			.style("fill", FunnelVis.linkColour.dark)
			.style("opacity", 0.5)
			.style("stroke", "none");
	},
	adjustWidthAndHeight: function(top, left) {
		var patternBBox = d3.select("#pattern-tooltip svg .pattern-group").node().getBBox();
		var patternTooltipWidth = patternBBox.width + 20;
		var PatternTooltipHeight = patternBBox.height + 20;

		$("#pattern-tooltip")
			.css("width", patternTooltipWidth)
			.css("height", PatternTooltipHeight)
			.css("top", top)
			.css("left", left - patternTooltipWidth / 2);

		d3.select("#pattern-tooltip svg .pattern-group")
			.attr("transform", "translate(" + (patternTooltipWidth / 2) + ",10)");
	}
}