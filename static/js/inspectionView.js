var InspectionView = {
	currentPanelID: null, // for changing min Support and attribute name
	currentForSID: null, // for changing min Support and attribute name
	currentOutputType: null, // for changing min Support and attribute name
	clickedLinkLeftSID: null, // for drawing context vis

	update: function(panelID, ForSID, outputType, clickedLinkLeftSID = null) {
		var self = this;
		var notSID = (outputType == "not") ? ForSID : null;
		self.currentPanelID = panelID;
		self.currentForSID = ForSID;
		self.currentOutputType = outputType;

		if (clickedLinkLeftSID != null)
			self.clickedLinkLeftSID = clickedLinkLeftSID;

		InspectionViewContext.update(panelID, self.clickedLinkLeftSID, notSID);
		RawSequenceView.retrieveRawSequences(panelID, ForSID, outputType);
		AttributeValuePairView.retrieveAVPairs(panelID, ForSID, outputType);
		FrequentPatternView.retrieveFrequentPatterns(panelID, ForSID, outputType);
	},
	clear: function() {
		var self = this;

		FrequentPatternView.clear();
		RawSequenceView.clear();
		AttributeValuePairView.clear();
		InspectionViewContext.clear();

		self.currentPanelID = null;
		self.currentForSID = null;
		self.currentOutputType = null;
	},
	init: function() {
		var self = this;

		self.initClickHeaderBehaviour("frequent-pattern-view");
		self.initClickHeaderBehaviour("attribute-value-pair-view");
		self.initClickHeaderBehaviour("raw-sequence-view");
	},
	initClickHeaderBehaviour: function(className) {
		$("#inspection-view ." + className + ".header").click(function() {
			toggleHeader(className);
			toggleContent();
		});

		function toggleHeader(className) {
			var isSymbolUp = $("#inspection-view ." + className + ".header .symbol")
				.hasClass("fa-angle-double-up");

			if (isSymbolUp) {
				$("#inspection-view ." + className + ".header .symbol")
					.removeClass("fa-angle-double-up");
				$("#inspection-view ." + className + ".header .symbol")
					.addClass("fa-angle-double-down");
			}
			if (!isSymbolUp) {
				$("#inspection-view ." + className + ".header .symbol")
					.removeClass("fa-angle-double-down");
				$("#inspection-view ." + className + ".header .symbol")
					.addClass("fa-angle-double-up");
			}
		}

		function toggleContent() {
			var showFrequentPatternView = $("#inspection-view .frequent-pattern-view.header .symbol").hasClass("fa-angle-double-up");
			var showAttributeValuePairView = $("#inspection-view .attribute-value-pair-view.header .symbol").hasClass("fa-angle-double-up");
			var showRawSequenceView = $("#inspection-view .raw-sequence-view.header .symbol").hasClass("fa-angle-double-up");

			var numberOfContentShown = $("#inspection-view .header .symbol.fa-angle-double-up").length;
			var newContentHeight = (numberOfContentShown == 0) ? 0 : "calc((100% - 105px - 50px) / " + numberOfContentShown + ")";
			var newContentHeightInPixel = (numberOfContentShown == 0) ? 0 : ($("#inspection-view").height() - 105 - 50) / numberOfContentShown;

			if (showFrequentPatternView) {
				$("#inspection-view .frequent-pattern-view.content")
					.css("display", "block");
				$("#inspection-view .frequent-pattern-view.content")
					.animate({ height: newContentHeightInPixel }, {
						duration: 200,
						queue: false,
						complete: function() { $(this).css("height", newContentHeight); }
					});
				FrequentPatternView.refresh();
			}
			if (!showFrequentPatternView) {
				$("#inspection-view .frequent-pattern-view.content")
					.animate({ height: 0 }, {
						duration: 200,
						queue: false,
						complete: function() { $(this).css("display", "none"); }
					});
			}

			if (showAttributeValuePairView) {
				$("#inspection-view .attribute-value-pair-view.content")
					.css("display", "block");
				$("#inspection-view .attribute-value-pair-view.content")
					.animate({ height: newContentHeightInPixel }, {
						duration: 200,
						queue: false,
						complete: function() { $(this).css("height", newContentHeight); }
					});
				AttributeValuePairView.refresh();
			}
			if (!showAttributeValuePairView) {
				$("#inspection-view .attribute-value-pair-view.content")
					.animate({ height: 0 }, {
						duration: 200,
						queue: false,
						complete: function() { $(this).css("display", "none"); }
					});
			}

			if (showRawSequenceView) {
				$("#inspection-view .raw-sequence-view.content")
					.css("display", "block");
				$("#inspection-view .raw-sequence-view.content")
					.animate({ height: newContentHeightInPixel }, {
						duration: 200,
						queue: false,
						complete: function() { $(this).css("height", newContentHeight); }
					});
				RawSequenceView.refresh();
			}
			if (!showRawSequenceView) {
				$("#inspection-view .raw-sequence-view.content")
					.animate({ height: 0 }, {
						duration: 200,
						queue: false,
						complete: function() { $(this).css("display", "none"); }
					});
			}
		}
	}
}