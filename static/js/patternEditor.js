var PatternEditor = {
	startX: 20,
	dummyBoxSize: 40,
	matcherGap: 10,
	matcherPadding: 10,
	matcherItemGap: 10,
	height: null,
	width: null,

	svg: null,
	scrollLayer: null,

	currentMatcherIndex: null, // set on click query box
	currentMatcherItemIndex: 0, // set on click query box

	matchers: [], // parsed before sending to server

	init: function() {
		var self = this;

		self.height = (advancedContextMenuHeight - 125) * 0.8;
		self.width = advancedContextMenuWidth - 20;
		self.svg = d3.select("#advanced-context-menu .pattern-editor.content svg")
			.style("cursor", "pointer")
			.on("mousemove", self.mousemove)
			.on("mouseleave", self.mouseleave)
			.on("wheel", self.mousewheel);
		self.scrollLayer = d3.select("#advanced-context-menu .pattern-editor.content svg").append("g")
			.attr("class", "scroll-layer");
		self.initClickSVGBehaviour();
	},
	initClickSVGBehaviour: function() {
		var self = this;
		var signifierSelector = "#advanced-context-menu .pattern-editor.content svg";
		var advancedSelectionMenuSelector = "#advanced-selection-menu"; // ban this not behaviour

		Body.registerClickEvent(signifierSelector, advancedSelectionMenuSelector, clickSVG);

		function clickSVG() {
			if (self.Helper.needToRemoveMatcherItem()) {
				self.removeVisualMatcherItem();
			}
			else if (self.Helper.needToInsertOrAppendMatcherOrMatcherItem()) {
				self.removeCurrentClass();
				self.addVisualMatcherOrItem();
				self.showSelectionMenu();
				self.moveBackgroundToFront();
				self.setMatcherIndexAndIndexWithin("current");
			}
		}
	},
	mousemove: function() {
		var self = PatternEditor;
		var scrollLayerEl = self.scrollLayer.node();
		var scrollLayerTransform = self.scrollLayer.attr("transform");
		var scrolledPosX = Helper.getTranslation(scrollLayerTransform)[0];
		var mouseX = d3.mouse(this)[0] - scrolledPosX;
		var signifierLeftEdge = 0;
		var signifierRightEdge = null;
		var signifierTopEdge = null;
		var signifierBottomEdge = null;
		var toLeftOfOrInsideSomeMatchers = false;
		var onSomeMatcherItems = false;

		// loop through elements to get top left bottom right
		$(scrollLayerEl).find(".event-matcher").each(function() {
			var currentMatcherEl = this;
			var currentMatcherTransform = d3.select(currentMatcherEl).attr("transform");
			var currentMatcherTranslateX = Helper.getTranslation(currentMatcherTransform)[0];
			var currentMatcherBBox = currentMatcherEl.getBBox();
			var currentMatcherLeftEdge = currentMatcherBBox.x + currentMatcherTranslateX;
			var currentMatcherRightEdge = currentMatcherLeftEdge + currentMatcherBBox.width;

			if (mouseX < currentMatcherLeftEdge) { // insert before
				signifierRightEdge = currentMatcherLeftEdge;
				signifierTopEdge = currentMatcherBBox.y;
				signifierBottomEdge = signifierTopEdge + currentMatcherBBox.height;
				toLeftOfOrInsideSomeMatchers = true;

				self.Helper.removeAllMatcherClasses();
				d3.select(currentMatcherEl).classed("insert-before", true);
				return false;
			}

			if (mouseX >= currentMatcherLeftEdge && mouseX <= currentMatcherRightEdge) { // insert inside
				signifierLeftEdge = currentMatcherLeftEdge; // starting left edge
				signifierTopEdge = currentMatcherBBox.y;
				signifierBottomEdge = signifierTopEdge + currentMatcherBBox.height;
				toLeftOfOrInsideSomeMatchers = true;
				var toLeftOfSomeMatcherItems = false;

				$(currentMatcherEl).find(".event-matcher-item").each(function() {
					var currentMatcherItemEl = this;
					var currentMatcherItemTranform = d3.select(currentMatcherItemEl).attr("transform");
					var currentMatcherItemTranslateX = Helper.getTranslation(currentMatcherItemTranform)[0];
					var currentMatcherItemBBox = currentMatcherItemEl.getBBox();
					var currentMatcherItemLeftEdge = currentMatcherItemBBox.x + currentMatcherItemTranslateX + currentMatcherTranslateX;
					var currentMatcherItemRightEdge = currentMatcherItemLeftEdge + currentMatcherItemBBox.width;

					if (mouseX < currentMatcherItemLeftEdge) { // insert before item
						signifierRightEdge = currentMatcherItemLeftEdge;
						toLeftOfSomeMatcherItems = true;

						self.Helper.removeAllMatcherClasses();
						d3.select(currentMatcherItemEl).classed("insert-before", true);
						return false;
					}

					if (mouseX >= currentMatcherItemLeftEdge && mouseX <= currentMatcherItemRightEdge) { // delete the item on click
						onSomeMatcherItems = true;

						self.Helper.removeAllMatcherClasses();
						d3.select(currentMatcherItemEl).classed("delete", true);
						return false;
					}

					if (mouseX > currentMatcherItemRightEdge) // insert somewhere after, update signifierLeftEdge
						signifierLeftEdge = currentMatcherItemRightEdge;
				});

				if (!toLeftOfSomeMatcherItems && !onSomeMatcherItems) { // right to the last item
					signifierRightEdge = currentMatcherRightEdge;

					self.Helper.removeAllMatcherClasses();
					d3.select(currentMatcherEl).classed("append", true);
				}

				return false;
			}

			if (mouseX > currentMatcherRightEdge) // insert somewhere after, update signifierLeftEdge
				signifierLeftEdge = currentMatcherRightEdge;
		});

		if (onSomeMatcherItems) { // on a matcher item -> remove signifier and don't draw
			self.scrollLayer.select(".signifier").remove();
			return;
		}

		if (!toLeftOfOrInsideSomeMatchers) { // right to the last matcher -> draw box
			var noMatcherInEditor = self.scrollLayer.selectAll(".event-matcher").empty();
			var signifierLeftEdge = noMatcherInEditor ? self.startX : signifierLeftEdge + self.matcherGap;

			self.Helper.removeAllMatcherClasses();
			self.scrollLayer.classed("append", true);
		
			self.Helper.drawEmptyBox({
				x: signifierLeftEdge, 
				y: self.height / 2 - self.dummyBoxSize / 2, 
				width: self.dummyBoxSize, 
				height: self.dummyBoxSize
			});
		}

		if (toLeftOfOrInsideSomeMatchers) { // not right to the last -> draw cross hair
			self.Helper.drawCrossHair({
				x: signifierLeftEdge, 
				y: signifierTopEdge, 
				width: signifierRightEdge - signifierLeftEdge, 
				height: signifierBottomEdge - signifierTopEdge
			});
		}
	},
	mouseleave: function() {
		var self = PatternEditor;

		self.Helper.removeAllSignifiers();
		self.Helper.removeAllMatcherClasses();
	},
	mousewheel: function() {
		var self = PatternEditor;
		var wheelDelta = (d3.event.detail < 0 || d3.event.wheelDelta > 0) ? 20 : -20;
		var scrollLayerTransform = self.scrollLayer.attr("transform");
		var currentTranslateX = Helper.getTranslation(scrollLayerTransform)[0];
		var dx = wheelDelta + currentTranslateX;
		var scrollLayerWidth = self.scrollLayer.node().getBBox().width;
    	var contentWidthAndPadding = scrollLayerWidth + self.startX * 2;
    	var minDx = self.width - contentWidthAndPadding - self.dummyBoxSize - self.startX;

    	if (dx > 0)
    		dx = 0;
    	if (contentWidthAndPadding > self.width && dx < minDx)
			dx = minDx;
		if (contentWidthAndPadding <= self.width && dx < 0)
			dx = 0;

		// scroll!
		self.scrollLayer
			.attr("transform", "translate(" + [ dx, 0 ] + ")");
	},
	removeVisualMatcherItem: function() {
		var self = this;
		var parentMatcherEl = self.svg.select(".delete").node().parentNode;

		d3.select(parentMatcherEl).classed("delete", "true");
		self.setMatcherIndexAndIndexWithin("delete")
		self.deleteFromMatchers(self.currentMatcherIndex, self.currentMatcherItemIndex);
		self.redraw();
	},
	addVisualMatcherOrItem: function() { // add placeholder
		var self = this;
		var needToAppend = !self.svg.select(".append").empty();
		var needToInsert = !self.svg.select(".insert-before").empty();

		if (needToAppend) {
			var appendToThisEl = self.svg.select(".append").node();
			var appendItem = $(appendToThisEl).hasClass("event-matcher") ? "event-matcher-item" : "event-matcher";

			// append matcher item to matcher (store both indices later)
			if (appendItem == "event-matcher-item") {
				var signifier = self.scrollLayer.select(".signifier");
				var appendToThisElTranform = d3.select(appendToThisEl).attr("transform");
				var appendToThisElTranslateX = Helper.getTranslation(appendToThisElTranform)[0];

				var currentMatcher = d3.select(appendToThisEl)
					.classed("current", true);
				var currentMatcherItem = d3.select(appendToThisEl).append("g")
					.attr("class", "event-matcher-item current dummy");
				self.Helper.cloneRect(signifier, currentMatcherItem)
					.attr("x", signifier.attr("x") - appendToThisElTranslateX);
			}

			// append matcher (store only matcher index later)
			if (appendItem == "event-matcher") {
				var signifier = self.scrollLayer.select(".signifier");

				var currentMatcher = d3.select(appendToThisEl).append("g")
					.attr("class", "event-matcher current dummy");
				var currentMatcherItem = currentMatcher.append("g")
					.attr("class", "event-matcher-item"); // no current
				self.Helper.cloneRect(signifier, currentMatcherItem)
					.attr("class", "background");
			}
		}

		if (needToInsert) {
			var insertBeforeEl = self.svg.select(".insert-before").node();
			var insertBeforeParentEl = insertBeforeEl.parentNode;
			var insertItem = $(insertBeforeEl).hasClass("event-matcher") ? "event-matcher" : "event-matcher-item";

			// insert event matcher item (store both indices later)
			if (insertItem == "event-matcher-item") {
				var signifier = self.scrollLayer.select(".signifier");
				var parentTransform = d3.select(insertBeforeParentEl).attr("transform");
				var parentTranslateX = Helper.getTranslation(parentTransform)[0];

				var currentMatcher = d3.select(insertBeforeParentEl)
					.classed("current", true);
				var currentMatcherItem = d3.select(insertBeforeParentEl).insert("g", ".insert-before")
					.attr("class", "event-matcher-item current dummy");
				self.Helper.cloneRect(signifier, currentMatcherItem)
					.attr("x", signifier.attr("x") - parentTranslateX);
			}

			// insert event matcher (store only matcher index later)
			if (insertItem == "event-matcher") {
				var signifier = self.scrollLayer.select(".signifier");

				var currentMatcher = d3.select(insertBeforeParentEl).insert("g", ".insert-before")
					.attr("class", "event-matcher current dummy");
				var currentMatcherItem = currentMatcher.append("g")
					.attr("class", "event-matcher-item");
				self.Helper.cloneRect(signifier, currentMatcherItem)
					.attr("class", "background");
			}
		}
	},
	removeCurrentClass: function() {
		var self = this;

		self.svg.selectAll(".current")
			.classed("current", false);
	},
	showSelectionMenu: function() {
		var self = this;
		var currentMatcherItem = (!self.scrollLayer.select(".current.event-matcher-item").empty()) 
							   ? self.scrollLayer.select(".current.event-matcher-item")
							   : self.scrollLayer.select(".current.event-matcher .event-matcher-item");
		var bbox = currentMatcherItem.node().getBoundingClientRect();
		var menuTop = bbox.y + bbox.height / 2;
		var menuLeft = bbox.x + bbox.width / 2;

		AdvancedSelectionMenu.show(menuTop, menuLeft);
	},
	moveBackgroundToFront: function() {
		var self = this;
		var currentMatcher = self.scrollLayer.select(".current.event-matcher");
		var originBackground = currentMatcher.select(".background");

		self.Helper.cloneRect(originBackground, currentMatcher)
			.attr("class", "background");
		originBackground.remove();
	},
	setMatcherIndexAndIndexWithin: function(className) {
		var self = this;
		var matcherIndex = -1;
		var matcherItemIndex = -1;
		var lastMatcherIndex = self.matchers.length - 1;
		var matcherContainerEl = self.scrollLayer.node();

		$(matcherContainerEl).find(".event-matcher").each(function(i) {
			var currentMatcherEl = this;
			var currentMatcherHasRequiredClass = $(currentMatcherEl).hasClass(className);

			if (currentMatcherHasRequiredClass) {
				$(currentMatcherEl).find(".event-matcher-item").each(function(j) {
					var currentMatcherItemEl = this;
					var currentMatcherItemHasRequiredClass = $(currentMatcherItemEl).hasClass(className);

					if (currentMatcherItemHasRequiredClass) {
						matcherItemIndex = j;
						return false;
					}
				});

				matcherIndex = i;
				return false;
			}
		});

		self.currentMatcherIndex = matcherIndex;
		self.currentMatcherItemIndex = matcherItemIndex;
	},
	addToMatchers: function(itemName, AVOrOperator, data = null) {
		var self = this;
		var appendMatcher = (self.currentMatcherIndex > self.matchers.length - 1) && (self.currentMatcherItemIndex == -1);
		var appendMatcherItem = (self.currentMatcherIndex <= self.matchers.length - 1) && (self.currentMatcherItemIndex > self.matchers[self.currentMatcherIndex].length - 1);
		var insertMatcher = (self.currentMatcherIndex <= self.matchers.length - 1) && (self.currentMatcherItemIndex == -1);
		var insertMatcherItem = (self.currentMatcherIndex <= self.matchers.length - 1) && (self.currentMatcherItemIndex <= self.matchers[self.currentMatcherIndex].length - 1);
		var matcherItemObject = { itemName: itemName, type: AVOrOperator, data: data }; // store data for drawing tooltip

		if (appendMatcher)
			self.Helper.appendMatcherToArray(matcherItemObject);
		else if (appendMatcherItem)
			self.Helper.appendMatcherItemToArray(self.currentMatcherIndex, matcherItemObject);
		else if (insertMatcher)
			self.Helper.insertMatcherToArray(self.currentMatcherIndex, matcherItemObject);
		else if (insertMatcherItem)
			self.Helper.insertMatcherItemToArray(self.currentMatcherIndex, self.currentMatcherItemIndex, matcherItemObject);
	},
	deleteFromMatchers: function(matcherIndex, matcherItemIndex) {
		var self = this;

		self.Helper.deleteMatcherItemFromArray(matcherIndex, matcherItemIndex);

		if (self.matchers[matcherIndex].length == 0)
			self.Helper.deleteMatcherFromArray(matcherIndex);
	},
	drawMatchers: function() {
		var self = this;
		var matcherTranslateX = self.startX;

		for (var i = 0; i < self.matchers.length; i++) {
			// append event matcher rect
			var matcherGroup = self.scrollLayer.append("g")
				.attr("class", "event-matcher");
			var matcherGroupBackground = matcherGroup.append("rect")
				.attr("class", "background")
				.attr("rx", 3)
				.attr("ry", 3);

			// append event matcher items
			var matcherItemTranslateX = self.matcherPadding;

			for (var j = 0; j < self.matchers[i].length; j++) {
				var itemName = self.matchers[i][j].itemName;
				var type = self.matchers[i][j].type;
				var data = self.matchers[i][j].data;
				
				// add tooltip and corresponding data for values
				if (type == "AVPair") {
					var AVPair = data.attributeName + "=" + data.attributeValue;
					var symbolLeftRightPadding = 8;
					var symbolTopBottomPadding = 6;
					var symbolFontSize = 13;
					var symbolBorderRadius = 3;
					var symbolBackgroundColour = ColourManager.getColour(AVPair, false);
					var symbolTextColour = ColourManager.getForegroundTextColour(symbolBackgroundColour);
					var symbolStrokeColour = (symbolBackgroundColour == "white") ? FunnelVis.linkColour.dark : "none";
					var symbolStrokeWidth = (symbolBackgroundColour == "white") ? 1 : 2;

					var symbolGroup = matcherGroup.append("g")
						.datum(data)
						.attr("class", "event-matcher-item " + type)
						.on("mouseenter", mouseenterValue)
						.on("mouseleave", mouseleaveValue);

					symbolGroup.append("text")
						.attr("x", symbolLeftRightPadding / 2)
						.style("alignment-baseline", "middle")
						.style("font-family", "Arial")
						.style("font-weight", "bold")
						.style("font-size", symbolFontSize)
						.style("fill", symbolTextColour)
						.text(itemName);

					var bbox = symbolGroup.node().getBBox();
					symbolGroup.insert("rect", "text")
						.attr("x", bbox.x - (symbolLeftRightPadding - 2) / 2)
						.attr("y", bbox.y - (symbolTopBottomPadding - 2) / 2)
						.attr("width", bbox.width + symbolLeftRightPadding - 2)
						.attr("height", bbox.height + symbolTopBottomPadding - 2)
						.attr("rx", symbolBorderRadius)
						.attr("ry", symbolBorderRadius)
						.style("fill", symbolBackgroundColour)
						.style("stroke", symbolStrokeColour)
						.style("stroke-width", symbolStrokeWidth);
				}
				if (type == "operator") {
					var symbolFontSize = 9;
					var symbolTextColour = "#494949";
					var symbolGroup = matcherGroup.append("g")
						.attr("class", "event-matcher-item " + type)
						.on("mouseenter", mouseenterOperator)
						.on("mouseleave", mouseleaveOperator);

					symbolGroup.append("text")
						.style("alignment-baseline", "middle")
						.style("font-family", "Arial")
						.style("font-weight", "bold")
						.style("font-size", symbolFontSize)
						.style("fill", symbolTextColour)
						.text(itemName);
				}

				// translate the group within event matcher
				var bbox = symbolGroup.node().getBBox();
				var symbolGroupHeight = bbox.height;
				var symbolGroupWidth = bbox.width;

				symbolGroup.attr("transform", "translate(" + matcherItemTranslateX + "," + (self.height / 2) + ")");
				matcherItemTranslateX += symbolGroupWidth + self.matcherItemGap;
			}

			// change background
			var bbox = matcherGroup.node().getBBox();

			matcherGroupBackground
				.attr("x", 0)
				.attr("y", bbox.y - self.matcherPadding)
				.attr("width", bbox.width + self.matcherPadding * 2)
				.attr("height", bbox.height + self.matcherPadding * 2)
				.style("fill", "none")
				.style("stroke", "gray")
				.style("stroke-dasharray", "5, 3");

			// adjust event matcher position
			matcherGroup
				.attr("transform", "translate(" + matcherTranslateX + ",0)");

			// update translateX
			var bbox = matcherGroup.node().getBBox();
			var matcherGroupWidth = bbox.width;

			matcherTranslateX += matcherGroupWidth + self.matcherGap;
		}

		function mouseenterValue(d) {
			var symbolPosition = this.getBoundingClientRect();
			var bbox = this.getBBox();
			var tooltipText = d.attributeName + "=" + d.attributeValue;

			d3.select(this).selectAll("*")
				.style("opacity", 0.5);
			d3.select(this).append("text")
				.attr("x", bbox.x + bbox.width / 2)
				.attr("y", bbox.y + bbox.height / 2)
				.attr("class", "remove-button")
				.style("font-family", "FontAwesome")
				.style("text-anchor", "middle")
				.style("alignment-baseline", "middle")
				.style("fill", "#FE4365")
				.text("\uf00d");

			$("#my-tooltip")
				.attr("data-tooltip", tooltipText)
				.css("top", symbolPosition.y + symbolPosition.height + 13)
				.css("left", symbolPosition.x + symbolPosition.width / 2)
				.addClass("show")
				.removeClass("top"); // make sure it is not top
		}

		function mouseleaveValue() {
			$("#my-tooltip")
				.removeClass("show");
			d3.select(this).selectAll(".remove-button")
				.remove();
			d3.select(this).selectAll("*")
				.style("opacity", null);
		}

		function mouseenterOperator() {
			var bbox = this.getBBox();

			d3.select(this).selectAll("*")
				.style("opacity", 0.5);
			d3.select(this).append("text")
				.attr("x", bbox.x + bbox.width / 2)
				.attr("y", bbox.y + bbox.height / 2)
				.attr("class", "remove-button")
				.style("font-family", "FontAwesome")
				.style("text-anchor", "middle")
				.style("alignment-baseline", "middle")
				.style("fill", "#FE4365")
				.text("\uf00d");
		}

		function mouseleaveOperator() {
			d3.select(this).selectAll(".remove-button")
				.remove();
			d3.select(this).selectAll("*")
				.style("opacity", null);
		}
	},
	updateColourMarkers: function() {
		var self = this;

		self.scrollLayer.selectAll(".event-matcher-item.AVPair")
			.classed("colour-marker", true)
			.attr("colour-key", function(d) {
				return d.attributeName + "=" + d.attributeValue;
			});
	},
	redraw: function() {
		var self = this;
		var scrollLayerEl = self.scrollLayer.node();

		SyntaxChecker.checkSyntaxError();
		$(scrollLayerEl).empty(); // user jquery to keep the structure of deleted el
		self.drawMatchers();
		self.updateColourMarkers();
		AdvancedContextMenu.updateConfirmButton();
	},
	clear: function() {
		var self = this;

		self.scrollLayer.selectAll("*").remove();
		self.scrollLayer.attr("transform", null);
		self.matchers = [];
	},
	isEmpty: function() {
		var self = this;

		return self.matchers.length == 0;
	},

	// helper functions
	Helper: {
		removeAllMatcherClasses: function() {
			var self = PatternEditor;

			self.svg.selectAll(".insert-before").classed("insert-before", false);
			self.svg.selectAll(".append").classed("append", false);
			self.svg.selectAll(".delete").classed("delete", false);
		},
		removeAllSignifiers: function() {
			var self = PatternEditor;

			self.scrollLayer.selectAll(".signifier")
				.remove();
		},
		removeAllDummyBoxes: function() {
			var self = PatternEditor;

			self.scrollLayer.selectAll(".dummy").remove();
		},
		needToRemoveMatcherItem: function() {
			var self = PatternEditor;

			return !self.svg.select(".delete").empty();
		},
		needToInsertOrAppendMatcherOrMatcherItem: function() {
			var self = PatternEditor;
			var hasInsertBefore = !self.svg.select(".insert-before").empty();
			var hasAppend = !self.svg.select(".append").empty();

			return hasInsertBefore || hasAppend;
		},
		drawCrossHair: function(dimensions) {
			var self = PatternEditor

			if (self.scrollLayer.select(".signifier").empty())
				self.scrollLayer.insert("rect", ":first-child")
					.attr("class", "signifier");

			self.scrollLayer.select(".signifier")
				.attr("x", dimensions.x)
				.attr("y", dimensions.y)
				.attr("width", dimensions.width)
				.attr("height", dimensions.height)
				.style("fill", "#ffffc9")
				.style("stroke", "none")
				.style("stroke-width", 0)
				.style("stroke-dasharray", "none");
		},
		drawEmptyBox: function(dimensions) {
			var self = PatternEditor;

			if (self.scrollLayer.select(".signifier").empty())
				self.scrollLayer.insert("rect", ":first-child")
					.attr("class", "signifier");

			self.scrollLayer.select(".signifier")
				.attr("x", dimensions.x)
				.attr("y", dimensions.y)
				.attr("rx", 3)
				.attr("ry", 3)
				.attr("width", dimensions.width)
				.attr("height", dimensions.height)
				.style("fill", "#ffffe5")
				.style("stroke", "gray")
				.style("stroke-width", 1)
				.style("stroke-dasharray", "5, 3");
		},
		cloneRect: function(targetObject, parentObject) {
			var x = targetObject.attr("x");
			var y = targetObject.attr("y");
			var rx = targetObject.attr("rx");
			var ry = targetObject.attr("ry");
			var width = targetObject.attr("width");
			var height = targetObject.attr("height");
			var fill = targetObject.style("fill");
			var stroke = targetObject.style("stroke");
			var strokeWidth = targetObject.style("stroke-width");
			var strokeDasharray = targetObject.style("stroke-dasharray");

			var rectCreated = parentObject.append("rect")
				.attr("x", x)
				.attr("y", y)
				.attr("rx", rx)
				.attr("ry", ry)
				.attr("width", width)
				.attr("height", height)
				.style("fill", fill)
				.style("stroke", stroke)
				.style("stroke-width", strokeWidth)
				.style("stroke-dasharray", strokeDasharray);

			return rectCreated;
		},
		appendMatcherToArray: function(matcherItemObject) {
			var self = PatternEditor;

			self.matchers.push([ matcherItemObject ]);
		},
		insertMatcherToArray: function(index, matcherItemObject) {
			var self = PatternEditor;

			self.matchers.splice(index, 0, [ matcherItemObject ]);
		},
		deleteMatcherFromArray: function(index) {
			var self = PatternEditor;

			self.matchers.splice(index, 1);
		},
		appendMatcherItemToArray: function(matcherIndex, matcherItemObject) {
			var self = PatternEditor;

			self.matchers[matcherIndex].push(matcherItemObject);
		},
		insertMatcherItemToArray: function(matcherIndex, matcherItemIndex, matcherItemObject) {
			var self = PatternEditor;

			self.matchers[matcherIndex].splice(matcherItemIndex, 0, matcherItemObject)
		},
		deleteMatcherItemFromArray: function(matcherIndex, matcherItemIndex) {
			var self = PatternEditor;

			self.matchers[matcherIndex].splice(matcherItemIndex, 1);
		}
	}
}