var InspectionViewMinSupEditor = {
	defaultMinSup: 0.3,

	init: function() {
		var self = this;
		
		self.initBottomText();
		self.initClickBehaviour();
		self.initConfirmBehaviour();
	},
	initBottomText: function() {
		var self = this;
		FrequentPatternView.minimumSupport = self.defaultMinSup;
		
		$("#inspection-view .frequent-pattern-view .minimum-support")
			.html("Minimum Support: " + Math.round(self.defaultMinSup * 100) + "%");
	},
	initClickBehaviour: function() {
		var self = this;
		var minSupTextSelector = "#inspection-view .frequent-pattern-view .minimum-support";
		var minSupEditorSelector = ".inspection-view.minimum-support.editor"; // ban this not behaviour

		Body.registerClickEvent(minSupTextSelector, minSupEditorSelector, clickMinSupText);
		Body.registerNotClickEvent(minSupEditorSelector, notClickMinSupEditor);

		function clickMinSupText() {
			var bbox = event.target.getBoundingClientRect();
			var textTop = bbox.top - 5;
			var textLeft = bbox.left + bbox.width / 2;
			var currentMinSupText = Math.round(FrequentPatternView.minimumSupport * 100) + "%";
			var alreadySelected = $(event.target).hasClass("selected");

			if (!alreadySelected)
				self.show(textTop, textLeft, currentMinSupText, event.target);
			if (alreadySelected)
				self.hide();
		}

		function notClickMinSupEditor() {
			self.hide();
		}
	},
	initConfirmBehaviour: function() {
		var self = this;

		$(".inspection-view.minimum-support.editor .fa-check").click(clickConfirmButton);

		function clickConfirmButton() {
			var input = $(".inspection-view.minimum-support.editor input").val();
			var isInputPercent = self.isPercent(input);

			if (isInputPercent) {
				var inputMinSup = parseFloat(input.slice(0, -1)) / 100;
				var hasChangeMinSup = inputMinSup != FrequentPatternView.minimumSupport;
				var subsequencesSelected = InspectionView.currentPanelID != null && InspectionView.currentForSID != null && InspectionView.currentOutputType != null;

				if (hasChangeMinSup && subsequencesSelected) {
					var panelID = InspectionView.currentPanelID;
					var ForSID = InspectionView.currentForSID;
					var outputType = InspectionView.currentOutputType;
					var attributeName = FrequentPatternView.attributeName;

					FrequentPatternView.minimumSupport = inputMinSup;
					FrequentPatternView.updateMinSupText();
					FrequentPatternView.showLoader();
					WebAPI.mineFrequentPattern(panelID, ForSID, outputType, inputMinSup, attributeName, afterMiningFrequentPattern);
				}

				if (hasChangeMinSup && !subsequencesSelected) {
					FrequentPatternView.minimumSupport = inputMinSup;
					FrequentPatternView.updateMinSupText();
				}
			}

			self.hide();
		}

		function afterMiningFrequentPattern(response) {
			var frequentPatterns = response.frequentPatterns;
			var tooManyFrequentPatterns = response.tooManyFrequentPatterns;

			FrequentPatternView.hideLoader();
			FrequentPatternView.update(tooManyFrequentPatterns, frequentPatterns);
			FrequentPatternView.updateColourMarkers();
		}
	},
	show: function(top, left, currentMinSup, minSupTextEl) {
		$(".inspection-view.minimum-support.editor")
			.css("display", "block");

		var bbox = $(".inspection-view.minimum-support.editor")[0].getBoundingClientRect();

		// show
		$(".inspection-view.minimum-support.editor")
			.css("top", top - bbox.height)
			.css("left", left - bbox.width / 2);
		$(".inspection-view.minimum-support.editor input")
			.val(currentMinSup);

		// highlight the clicked text
		$(minSupTextEl).addClass("selected");
	},
	hide: function() {
		$(".inspection-view.minimum-support.editor")
			.css("display", "none");

		$("#inspection-view .minimum-support") // remove highlight the clicked text
			.removeClass("selected");
	},
	isPercent: function(string) {
		return /^\d+(\.\d+)?%$/.test(string);
	}
}