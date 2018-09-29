var ContextVisHelper = {
	contextMargin: { left: 10, right: 10 },

	generateContextArray: function(clickedPanelID, clickedLinkLeftSID, notSID) {
		var self = this;
		var newContextArray = [];
		var namesForInsertion = [];
		var currentSID = "start";

		// get list of names for insertion
		while (currentSID != "end") {
			var currentName = FunnelVis.splittingPointsByID[clickedPanelID][currentSID].data.fullName;
			var currentTooltipData = FunnelVis.splittingPointsByID[clickedPanelID][currentSID].data.tooltipData;

			if (currentSID != clickedLinkLeftSID) // not reached the end
				namesForInsertion.push({ not: false, highlighted: false, name: currentName, tooltipData: currentTooltipData });

			if (currentSID == clickedLinkLeftSID) { // reach the end
				var notName = notSID ? FunnelVis.splittingPointsByID[clickedPanelID][notSID].data.fullName : null;
				var nextSID = FunnelVis.splittingPointsByID[clickedPanelID][currentSID].data.nextSID;
				var nextName = FunnelVis.splittingPointsByID[clickedPanelID][nextSID].data.fullName;
				var endName = FunnelVis.splittingPointsByID[clickedPanelID]["end"].data.fullName;
				var nextTooltipData = FunnelVis.splittingPointsByID[clickedPanelID][nextSID].data.tooltipData;
				var endTooltipData = FunnelVis.splittingPointsByID[clickedPanelID]["end"].data.tooltipData;
				var currentNameObject = { not: false, highlighted: true, name: currentName, tooltipData: currentTooltipData };
				var nextNameObject = { not: false, highlighted: false, name: nextName, tooltipData: nextTooltipData };
				var endNameObject = { not: false, highlighted: false, name: endName, tooltipData: endTooltipData };

				if (notSID != null)
					nextNameObject.not = true;

				namesForInsertion.push(currentNameObject);
				namesForInsertion.push(nextNameObject);
				if (nextSID != "end")
					namesForInsertion.push(endNameObject);

				break;
			}

			currentSID = FunnelVis.splittingPointsByID[clickedPanelID][currentSID].data.nextSID;
		}

		// set highlighted
		for (var i = 0; i < namesForInsertion.length - 1; i++) {
			var isCurrentHighlighted = namesForInsertion[i].highlighted;
			var isNextNot = namesForInsertion[i + 1].not;

			if (isCurrentHighlighted && isNextNot) {
				namesForInsertion[i + 1].highlighted = true;
				namesForInsertion[i + 2].highlighted = true;
				break;
			}
			if (isCurrentHighlighted && !isNextNot) {
				namesForInsertion[i + 1].highlighted = true;
				break;
			}
		}

		// replacement
		var highlightedNotNameObjects = [];
		var firstHighlightedNameIndex = null;
		var lastHighlightedNameIndex = null;

		for (var i = 0; i < ContextBar.contextByID[clickedPanelID].length; i++) {
			var isCurrentHighlighted = ContextBar.contextByID[clickedPanelID][i].highlighted;
			var isCurrentNot = ContextBar.contextByID[clickedPanelID][i].not;
			var currentName = ContextBar.contextByID[clickedPanelID][i].name;
			var currentTooltipData = ContextBar.contextByID[clickedPanelID][i].tooltipData;

			if (firstHighlightedNameIndex == null && isCurrentHighlighted)
				firstHighlightedNameIndex = i;
			if (isCurrentHighlighted)
				lastHighlightedNameIndex = i
			if (isCurrentHighlighted && isCurrentNot)
				highlightedNotNameObjects.push({ not: true, highlighted: false, name: currentName, tooltipData: currentTooltipData });
		}

		for (var i = 0; i < firstHighlightedNameIndex; i++) {
			var isCurrentHighlighted = ContextBar.contextByID[clickedPanelID][i].highlighted;
			var isCurrentNot = ContextBar.contextByID[clickedPanelID][i].not;
			var currentName = ContextBar.contextByID[clickedPanelID][i].name;
			var currentTooltipData = ContextBar.contextByID[clickedPanelID][i].tooltipData;

			newContextArray.push({ not: isCurrentNot, highlighted: false, name: currentName, tooltipData: currentTooltipData });
		}
		for (var i = 0; i < namesForInsertion.length; i++) {
			var isFirstHighlighted = namesForInsertion[0].highlighted;

			if (i == 1 && highlightedNotNameObjects.length != 0) {
				if (isFirstHighlighted)
					for (var j = 0; j < highlightedNotNameObjects.length; j++)
						highlightedNotNameObjects[j].highlighted = true;

				newContextArray = newContextArray.concat(highlightedNotNameObjects);
			}

			newContextArray.push(namesForInsertion[i]);
		}
		for (var i = lastHighlightedNameIndex + 1; i < ContextBar.contextByID[clickedPanelID].length; i++) {
			var isCurrentHighlighted = ContextBar.contextByID[clickedPanelID][i].highlighted;
			var isCurrentNot = ContextBar.contextByID[clickedPanelID][i].not;
			var currentName = ContextBar.contextByID[clickedPanelID][i].name;
			var currentTooltipData = ContextBar.contextByID[clickedPanelID][i].tooltipData;

			newContextArray.push({ not: isCurrentNot, highlighted: false, name: currentName, tooltipData: currentTooltipData });
		}

		return newContextArray;
	},
	visualizeContextArray: function(contextSVG, contextArray) {
		var self = this;
		var contextSVGEl = contextSVG.node();
		var contextDivWidth = $(contextSVGEl).width();
		var contextDivHeight = $(contextSVGEl).height();
		var numberOfTags = contextArray.length;
		var tagHeight = null;
		var contextGroup = contextSVG.append("g")
			.attr("class", "context")
			.attr("transform", "translate(" + self.contextMargin.left + "," + (contextDivHeight / 2) + ")");
		var linkLayer = contextGroup.append("g")
			.attr("class", "link-layer");
		var tagLayer = contextGroup.append("g")
			.attr("class", "tag-layer");
		var startHighlightTagX = 0;
		var startHighlightTagIndex = 0;
		var endHighlightTagX = contextDivWidth - self.contextMargin.right - self.contextMargin.left;
		var endHighlightTagIndex = contextArray.length - 1;

		// draw tags before highlight
		for (var i = 0; i < contextArray.length; i++) {
			var currentName = contextArray[i].name;
			var isCurrentNot = contextArray[i].not;
			var isCurrentHighlighted = contextArray[i].highlighted;
			var tagColour = ColourManager.getColour(currentName);
			var textColour = ColourManager.getForegroundTextColour(tagColour);
			var shortAVName = ShortNameManager.getShortName(currentName);

			var tag = tagLayer.append("g")
				.datum(contextArray[i])
				.attr("class", "tag")
				.attr("transform", "translate(" + startHighlightTagX + ",0)")
				.style("cursor", "pointer")
				.on("mouseenter", mouseenterTag)
				.on("mouseleave", mouseleaveTag);
			var text = tag.append("text")
				.style("font-family", "Arial")
				.style("font-size", 9)
				.style("alignment-baseline", "middle")
				.style("font-weight", "bold")
				.style("fill", textColour)
				.text(shortAVName);
			if (isCurrentNot) {
				var not = tag.append("text")
					.style("font-family", "FontAwesome")
					.style("font-size", 10)
					.style("alignment-baseline", "middle")
					.style("fill", "red")
					.text("\uf05e");

				var notBBox = not.node().getBBox();
				text.attr("dx", notBBox.width + 2);
			}

			var bbox = tag.node().getBBox();
			tagHeight = bbox.height;

			tag.insert("rect", ":first-child")
				.attr("x", bbox.x - 4)
				.attr("y", bbox.y - 3)
				.attr("width", bbox.width + 8)
				.attr("height", bbox.height + 6)
				.style("fill", tagColour)
				.attr("rx", 3)
				.attr("ry", 3)
				.style("stroke", "white")
				.style("stroke-width", 2);

			startHighlightTagX += bbox.width + 8 + 3;
			startHighlightTagIndex = i;

			if (isCurrentHighlighted)
				break;
		}

		// draw tags after highlight
		for (var i = contextArray.length - 1; i >= 0; i--) {
			var currentName = contextArray[i].name;
			var isCurrentNot = contextArray[i].not;
			var isCurrentHighlighted = contextArray[i].highlighted;
			var tagColour = ColourManager.getColour(currentName);
			var textColour = ColourManager.getForegroundTextColour(tagColour);
			var shortAVName = ShortNameManager.getShortName(currentName);

			var tag = tagLayer.append("g")
				.datum(contextArray[i])
				.attr("class", "tag")
				.attr("transform", "translate(" + endHighlightTagX + ",0)")
				.style("cursor", "pointer")
				.on("mouseenter", mouseenterTag)
				.on("mouseleave", mouseleaveTag);
			var text = tag.append("text")
				.style("font-family", "Arial")
				.style("font-size", 9)
				.style("text-anchor", "end")
				.style("alignment-baseline", "middle")
				.style("font-weight", "bold")
				.style("fill", textColour)
				.text(shortAVName);
			if (isCurrentNot) {
				var textBBox = text.node().getBBox();
				var not = tag.append("text")
					.attr("dx", -textBBox.width - 2)
					.style("font-family", "FontAwesome")
					.style("font-size", 10)
					.style("text-anchor", "end")
					.style("alignment-baseline", "middle")
					.style("fill", "red")
					.text("\uf05e");

				var notBBox = not.node().getBBox();
				endHighlightTagX -= 2 + notBBox.width;
			}

			var bbox = tag.node().getBBox();
			tagHeight = bbox.height;

			tag.insert("rect", ":first-child")
				.attr("x", bbox.x - 4)
				.attr("y", bbox.y - 3)
				.attr("width", bbox.width + 8)
				.attr("height", bbox.height + 6)
				.style("fill", tagColour)
				.attr("rx", 3)
				.attr("ry", 3)
				.style("stroke", "white")
				.style("stroke-width", 2);

			endHighlightTagIndex = i;
			endHighlightTagX -= bbox.width + 8 + 3;

			if (isCurrentHighlighted)
				break;
		}

		// draw link
		linkLayer.append("line")
			.attr("x1", startHighlightTagX)
			.attr("x2", endHighlightTagX)
			.attr("y1", 0)
			.attr("y2", 0)
			.style("stroke", "#e8e8e8")
			.style("stroke-width", tagHeight)
			.style("stroke-linecap", "round");

		// draw tags in highlight
		var numberOfIntervalsInHighlight = endHighlightTagIndex - startHighlightTagIndex;
		var intervalWidth = (endHighlightTagX - startHighlightTagX) / numberOfIntervalsInHighlight;
		var currentX = startHighlightTagX + intervalWidth;

		for (var i = startHighlightTagIndex + 1; i < endHighlightTagIndex; i++) {
			var currentName = contextArray[i].name;
			var isCurrentNot = contextArray[i].not;
			var isCurrentHighlighted = contextArray[i].highlighted;
			var tagColour = ColourManager.getColour(currentName);
			var textColour = ColourManager.getForegroundTextColour(tagColour);
			var shortAVName = ShortNameManager.getShortName(currentName);

			var tag = tagLayer.append("g")
				.datum(contextArray[i])
				.attr("class", "tag")
				.attr("transform", "translate(" + currentX + ",0)")
				.style("cursor", "pointer")
				.on("mouseenter", mouseenterTag)
				.on("mouseleave", mouseleaveTag);
			var text = tag.append("text")
				.style("font-family", "Arial")
				.style("font-size", 9)
				.style("text-anchor", "middle")
				.style("alignment-baseline", "middle")
				.style("font-weight", "bold")
				.style("fill", textColour)
				.text(shortAVName);
			if (isCurrentNot) {
				var textBBox = text.node().getBBox();
				var not = tag.append("text")
					.attr("dx", -textBBox.width / 2 - 2)
					.style("font-family", "FontAwesome")
					.style("font-size", 10)
					.style("text-anchor", "end")
					.style("alignment-baseline", "middle")
					.style("fill", "red")
					.text("\uf05e");
			}

			var bbox = tag.node().getBBox();
			tagHeight = bbox.height;

			tag.insert("rect", ":first-child")
				.attr("x", bbox.x - 4)
				.attr("y", bbox.y - 3)
				.attr("width", bbox.width + 8)
				.attr("height", bbox.height + 6)
				.style("fill", tagColour)
				.attr("rx", 3)
				.attr("ry", 3)
				.style("stroke", "white")
				.style("stroke-width", 2);

			currentX += intervalWidth;
		}

		function mouseenterTag(d) {
			var tooltipData = d.tooltipData;
			var tagName = d.name;
			var bbox = this.getBoundingClientRect();
			var patternTooltipTop = bbox.top + bbox.height + 7;
			var patternTooltipLeft = bbox.left + bbox.width / 2;
			
			PatternTooltip.show(tooltipData, tagName, patternTooltipTop, patternTooltipLeft);
		}

		function mouseleaveTag() {
			$("#my-tooltip").removeClass("show");
			PatternTooltip.hide();
		}
	},
	visualizeTimeAndEventCountFilters: function(contextSVG, timeAndEventCountFilterArray) {
		var self = this;
		var contextSVGEl = contextSVG.node();
		var contextDivWidth = $(contextSVGEl).width();
		var contextDivHeight = $(contextSVGEl).height();
		var filterGroup = contextSVG.select("g.context");

		for (var i = 0; i < timeAndEventCountFilterArray.length; i++) {
			var currentStartName = timeAndEventCountFilterArray[i].start;
			var startTagMiddleX = self.getTagMiddleX(contextSVG, currentStartName);
			var startTagColour = ColourManager.getColour(currentStartName);
			var currentEndName = timeAndEventCountFilterArray[i].end;
			var endTagMiddleX = self.getTagMiddleX(contextSVG, currentEndName);
			var endTagColour = ColourManager.getColour(currentEndName);
			var textOnLine = timeAndEventCountFilterArray[i].list.join(" , ");

			var filterLayer = filterGroup.append("g")
				.attr("class", "filter-layer")
				.attr("transform", "translate(0," + ((i + 1) * 15) + ")");

			// line between
			filterLayer.append("line")
				.attr("x1", startTagMiddleX)
				.attr("x2", endTagMiddleX)
				.attr("y1", 5)
				.attr("y2", 5)
				.style("stroke", "#e8e8e8")
				.style("stroke-width", 2)
				.style("stroke-linecap", "round");
			filterLayer.append("text")
				.attr("x", startTagMiddleX + (endTagMiddleX - startTagMiddleX) / 2)
				.attr("y", 5)
				.style("fill", "white")
				.style("stroke", "white")
				.style("stroke-width", 5)
				.style("alignment-baseline", "middle")
				.style("text-anchor", "middle")
				.style("font-size", 9)
				.text(textOnLine);
			filterLayer.append("text")
				.attr("x", startTagMiddleX + (endTagMiddleX - startTagMiddleX) / 2)
				.attr("y", 5)
				.style("fill", "gray")
				.style("alignment-baseline", "middle")
				.style("text-anchor", "middle")
				.style("font-size", 9)
				.text(textOnLine);

			// start tag
			filterLayer.append("rect")
				.datum(currentStartName)
				.attr("class", "start-tag")
				.attr("rx", 2)
				.attr("ry", 2)
				.attr("x", startTagMiddleX - 5)
				.attr("y", 0)
				.attr("width", 10)
				.attr("height", 10)
				.style("fill", startTagColour)
				.style("stroke", "white")
				.style("stroke-width", 2);

			// end tag
			filterLayer.append("rect")
				.datum(currentEndName)
				.attr("class", "end-tag")
				.attr("rx", 2)
				.attr("ry", 2)
				.attr("x", endTagMiddleX - 5)
				.attr("y", 0)
				.attr("width", 10)
				.attr("height", 10)
				.style("fill", endTagColour)
				.style("stroke", "white")
				.style("stroke-width", 2);
		}
	},
	getTagMiddleX: function(contextSVG, requestName) {
		var middleX = -1;

		contextSVG.selectAll(".tag-layer .tag").each(function(d) {
			var currentName = d.name;
			var currentTranslate = Helper.getTranslation(d3.select(this).attr("transform"));
			var rectX = parseInt(d3.select(this).select("rect").attr("x"));
			var rectWidth = parseInt(d3.select(this).select("rect").attr("width"));
			var currentX = currentTranslate[0] + rectX + rectWidth / 2;

			if (currentName == requestName) {
				middleX = currentX;
				return false;
			}
		});

		return middleX;
	}
}