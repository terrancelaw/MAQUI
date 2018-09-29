var AttributeValuePairViewButtons = {
	currentAVPairEl: null,

	init: function() {
		var self = this;

		self.initEnterButtonBehaviour();
		self.initClickAddButton();
	},
	initEnterButtonBehaviour: function() {
		$("#inspection-view .attribute-value-pair-view.content .container .buttons .button")
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
	initClickAddButton: function() {
		var self = this;

		$("#inspection-view .attribute-value-pair-view.content .container .buttons .fa-plus")
			.click(clickAddButton);

		function clickAddButton() {
			var attrOnAVPairViewIsRecordAttr = AttributeValuePairView.attributeType == "record";
			var attrOnAVPairViewIsNumerical = AttributeValuePairView.attrIsNumericalOrCategorical == "numerical";

			if (attrOnAVPairViewIsRecordAttr && !attrOnAVPairViewIsNumerical) {
				var data = d3.select(self.currentAVPairEl).datum();
				var selectedAVPair = data.value;
				var splittedAVPair = selectedAVPair.split("=");
				var attributeName = splittedAVPair[0];
				var attributeValue = splittedAVPair[1];
				var panelID = InspectionView.currentPanelID;
				var ForSID = FandSManager.getLastFilterID(panelID);
				var onlyOneLinkInThePanel = Object.keys(FunnelVis.linksByID[panelID]).length == 1;
				var data = {
					attributeName: attributeName,
					attributeValue: attributeValue,
					type: "categoricalFilter"
				}

				if (onlyOneLinkInThePanel)
					addCategoricalFilterToPanel(panelID, ForSID, data);
				if (!onlyOneLinkInThePanel)
					createNewPanel(data);
			}

			if (attrOnAVPairViewIsRecordAttr && attrOnAVPairViewIsNumerical) {
				var data = d3.select(self.currentAVPairEl).datum();
				var selectedAVPair = data.value;
				var splittedString = selectedAVPair.split(/(<=)|</);
				var attributeName = AttributeValuePairView.attributeName;
				var lowerBound = parseFloat(splittedString[0]);
				var upperBound = parseFloat(splittedString[splittedString.length - 1]);
				var panelID = InspectionView.currentPanelID;
				var ForSID = FandSManager.getLastFilterID(panelID);
				var onlyOneLinkInThePanel = Object.keys(FunnelVis.linksByID[panelID]).length == 1;
				var data = {
					attributeName: attributeName,
					lowerBound: lowerBound,
					upperBound: upperBound,
					type: "numericalFilter"
				}
				
				if (onlyOneLinkInThePanel)
					addNumericalFilterToPanel(panelID, ForSID, data);
				if (!onlyOneLinkInThePanel)
					createNewPanel(data);
			}

			if (!attrOnAVPairViewIsRecordAttr) {
				var data = d3.select(self.currentAVPairEl).datum();
				var selectedAVPair = data.value;
				var splittedAVPair = selectedAVPair.split("=");
				var attributeName = splittedAVPair[0];
				var attributeValue = splittedAVPair[1];
				var panelID = InspectionView.currentPanelID;
				var ForSID = InspectionView.currentForSID;
				var onlyOneLinkInThePanel = Object.keys(FunnelVis.linksByID[panelID]).length == 1;
				var data = {
					attributeName: attributeName,
					attributeValue: attributeValue,
					type: "splittingPoint"
				}

				if (onlyOneLinkInThePanel) // special case
					WebAPI.createSimpleSplittingPoint(panelID, ForSID, attributeName, attributeValue, function(response) {
						var updatedPanelID = response.updatedPanelID;
						var minifiedFandS = response.minifiedFandS;
						var updatedPanelEl = $("#subsequence-view .panel[panel-id=" + updatedPanelID + "]")[0];

						FandSManager.update(minifiedFandS);
						FunnelVis.update(updatedPanelEl);
						Timeline.update(updatedPanelEl);
						ColourManager.refreshColourMarkers();
					});

				if (!onlyOneLinkInThePanel)
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

				if (data.type == "splittingPoint")
					setTimeout(function(){ addAVPairToFunnel(newPanelID, startingForSID, data); }, 200); // keep track of changes
				if (data.type == "categoricalFilter")
					addCategoricalFilterToPanel(newPanelID, startingForSID, data);
				if (data.type == "numericalFilter")
					addNumericalFilterToPanel(newPanelID, startingForSID, data);
			}
		}

		function addCategoricalFilterToPanel(panelID, ForSID, data) {
			var attributeName = data.attributeName;
			var attributeValue = data.attributeValue;

			WebAPI.createSimpleCategoricalFilter(panelID, ForSID, attributeName, attributeValue, afterCreatingSimpleFilter);
		}

		function addNumericalFilterToPanel(panelID, ForSID, data) {
			var attributeName = data.attributeName;
			var upperBound = data.upperBound;
			var lowerBound = data.lowerBound;
			var displayString = "";

			if (attributeName == "time") {
				var timeUnit = AttributeValuePairView.timeUnit;
				var upperBoundBasedOnUnit = Helper.computeTime(upperBound, timeUnit);
				var lowerBoundBasedOnUnit = Helper.computeTime(lowerBound, timeUnit);
				var minUnit = lowerBoundBasedOnUnit > 1 && timeUnit != "sec" ? (timeUnit + "s") : timeUnit;
				var maxUnit = upperBoundBasedOnUnit > 1 && timeUnit != "sec" ? (timeUnit + "s") : timeUnit;
				displayString = lowerBoundBasedOnUnit + minUnit + "<=time<=" + upperBoundBasedOnUnit + maxUnit;
			}

			WebAPI.createSimpleNumericalFilter(panelID, ForSID, attributeName, lowerBound, upperBound, displayString, afterCreatingSimpleFilter);
		}

		function addAVPairToFunnel(panelID, ForSID, data) {
			var attributeName = data.attributeName;
			var attributeValue = data.attributeValue;

			WebAPI.createSimpleSplittingPoint(panelID, ForSID, attributeName, attributeValue, afterCreatingPatternSplittingPoint);
		}

		function afterCreatingPatternSplittingPoint(response) {
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

		function afterCreatingSimpleFilter(response) {
			var updatedPanelID = response.updatedPanelID;
			var minifiedFandS = response.minifiedFandS;
			var updatedPanelEl = $("#subsequence-view .panel[panel-id=" + updatedPanelID + "]")[0];

			FandSManager.update(minifiedFandS);
			FunnelVis.update(updatedPanelEl);
			Timeline.update(updatedPanelEl);
			RecordAttributeBar.update(updatedPanelEl);
		}
	},
	hide: function() {
		$("#inspection-view .attribute-value-pair-view.content .container .buttons") 
			.css("display", "none");
	}
}