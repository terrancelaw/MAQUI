var AdvancedContextMenu = {
	init: function() {
		var self = this;

		self.initCancelButton();
		self.initConfirmButton();
		self.initSwitchModeButton();
		self.initInputPatternNameBehaviour();
	},
	initCancelButton: function() {
		var self = this;

		$("#advanced-context-menu .footer .cancel-btn").click(clickCancelButton);

		function clickCancelButton() {
			self.hide();
		}
	},
	initConfirmButton: function() {
		var self = this;

		$("#advanced-context-menu .footer .confirm-btn").click(clickConfirmButton);

		function clickConfirmButton() {
			if (!$(this).hasClass("disabled")) {
				var onlyHasSingleAVPair = PatternEditor.matchers.length == 1 && PatternEditor.matchers[0].length == 1;

				if (onlyHasSingleAVPair) {
					var panelID = ContextMenu.targetPanelID;
					var ForSID = ContextMenu.targetForSID;
					var attributeName = PatternEditor.matchers[0][0].data.attributeName;
					var attributeValue = PatternEditor.matchers[0][0].data.attributeValue;

					WebAPI.createSimpleSplittingPoint(panelID, ForSID, attributeName, attributeValue, afterCreatingPatternSplittingPoint);
				}

				if (!onlyHasSingleAVPair) {
					PatternParser.createLogicTables(PatternEditor.matchers);

					var panelID = ContextMenu.targetPanelID;
					var ForSID = ContextMenu.targetForSID;
					var name = $("#advanced-context-menu .pattern-name.content input").val();
					var eventMatchers = PatternEditor.matchers;
					var orderedAVPairsForEachMatcher = PatternParser.orderedAttrValuePairsForEachMatcher;
					var logicTableForEachMatcher = PatternParser.logicTableForEachMatcher;

					WebAPI.createPatternSplittingPoint(panelID, ForSID, name, eventMatchers, orderedAVPairsForEachMatcher, logicTableForEachMatcher, afterCreatingPatternSplittingPoint);
				}

				self.hide();
			}
		}

		function afterCreatingPatternSplittingPoint(response) {
			var updatedPanelID = response.updatedPanelID;
			var minifiedFandS = response.minifiedFandS;
			var updatedPanelEl = $("#subsequence-view .panel[panel-id=" + updatedPanelID + "]")[0];

			FandSManager.update(minifiedFandS);
			FunnelVis.update(updatedPanelEl);
			Timeline.update(updatedPanelEl);
			ColourManager.refreshColourMarkers();
		}
	},
	initSwitchModeButton: function() {
		var self = this;

		$("#advanced-context-menu .switch-mode-btn").click(clickSwitchModeButton);

		function clickSwitchModeButton() {
			var top = $("#advanced-context-menu").css("top");
			var left = $("#advanced-context-menu").css("left");

			self.hide();
			SimpleContextMenu.show(top,left);
		}
	},
	initInputPatternNameBehaviour: function() {
		var self = this;

		$("#advanced-context-menu .pattern-name.content input").on("input", inputPatternName);

		function inputPatternName() {
			self.updateConfirmButton();
		}
	},
	hide: function() {
		$("#advanced-context-menu")
			.css("display", "none");
	},
	show: function(top, left) {
		$("#advanced-context-menu")
			.css("display", "block")
			.css("top", top)
			.css("left", left);
	},
	empty: function() {
		var self = this;
		var newPatternName = self.getUntitledPatternName();

		PatternEditor.clear();
		SyntaxChecker.clearPreviousData();
		$("#advanced-context-menu .pattern-name.content input").val(newPatternName);
		self.updateConfirmButton();
	},
	updateConfirmButton: function() {
		var isPatternEditorEmpty = PatternEditor.isEmpty();
		var isSyntaxCorrect = SyntaxChecker.isSyntaxCorrect;
		var isNameBoxEmpty = $("#advanced-context-menu .pattern-name.content input").val().length == 0;

		if (!isPatternEditorEmpty && isSyntaxCorrect && !isNameBoxEmpty)
			$("#advanced-context-menu .footer .confirm-btn").removeClass("disabled");
		else
			$("#advanced-context-menu .footer .confirm-btn").addClass("disabled");
	},
	getUntitledPatternName: function() {
		var newPatternName = "untitled pattern";
		var untitledPatternIndex = 0;

		for (var colour in ColourManager.colourToColourKeyDict) {
			var currentName = ColourManager.colourToColourKeyDict[colour];
			var currentNameIsUntitled = currentName.indexOf(newPatternName) != -1;

			if (currentNameIsUntitled) {
				var currentIndexString = $.trim(currentName.split("untitled pattern")[1]);
				var currentIndex = 1;

				if (currentIndexString != "")
					currentIndex = parseInt(currentIndexString);
				if (currentIndex > untitledPatternIndex)
					untitledPatternIndex = currentIndex;
			}
		}

		if (untitledPatternIndex != 0)
			newPatternName = newPatternName + " " + (untitledPatternIndex + 1);

		return newPatternName;
	}
}