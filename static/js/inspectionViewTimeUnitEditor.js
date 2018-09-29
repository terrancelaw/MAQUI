var InspectionViewTimeUnitEditor = {
	defaultMinSup: "sec",

	init: function() {
		var self = this;

		self.initBottomText();
		self.initClickBehaviour();
		self.initConfirmBehaviour();
	},
	initBottomText: function() {
		var self = this;

		AttributeValuePairView.timeUnit = self.defaultMinSup;
		AttributeValuePairView.updateTimeUnitText();
	},
	initClickBehaviour: function() {
		var self = this;
		var timeUnitTextSelector = "#inspection-view .attribute-value-pair-view .time-unit";
		var timeUnitEditorSelector = ".inspection-view.time-unit.editor"; // ban this not behaviour

		Body.registerClickEvent(timeUnitTextSelector, timeUnitEditorSelector, clickTimeUnitText);
		Body.registerNotClickEvent(timeUnitEditorSelector, notClickTimeUnitEditor);

		function clickTimeUnitText() {
			var bbox = event.target.getBoundingClientRect();
			var textTop = bbox.top - 5;
			var textLeft = bbox.left + bbox.width / 2;
			var alreadySelected = $(event.target).hasClass("selected");

			if (!alreadySelected)
				self.show(textTop, textLeft, event.target);
			if (alreadySelected)
				self.hide();
		}

		function notClickTimeUnitEditor() {
			self.hide();
		}
	},
	initConfirmBehaviour: function() {
		var self = this;

		$(".inspection-view.time-unit.editor .fa-check").click(clickConfirmButton);

		function clickConfirmButton() {
			var selectedTimeUnit = $(".inspection-view.time-unit.editor select option:selected").val();
			var AVPairs = AttributeValuePairView.AVPairs;

			AttributeValuePairView.timeUnit = selectedTimeUnit;
			AttributeValuePairView.updateTimeUnitText();
			if (AVPairs != null)
				AttributeValuePairView.update(AVPairs);
			self.hide();
		}
	},
	show: function(top, left, timeUnitTextEl) {
		$(".inspection-view.time-unit.editor")
			.css("display", "block");

		var self = this;
		var bbox = $(".inspection-view.time-unit.editor")[0].getBoundingClientRect();

		// show
		$(".inspection-view.time-unit.editor")
			.css("top", top - bbox.height)
			.css("left", left - bbox.width / 2);

		// highlight the clicked text
		$(timeUnitTextEl).addClass("selected");
	},
	hide: function() {
		$(".inspection-view.time-unit.editor")
			.css("display", "none");

		$("#inspection-view .time-unit") // remove highlight the clicked text
			.removeClass("selected");
	}
}