var Body = {
	clickEvents: [],
	notClickEvents: [],

	init: function() {
		var self = this;

		self.initEnterBehaviour();
		self.initClickBehaviour();
	},
	initEnterBehaviour: function() {
		var self = this;

		$("body").keypress(function(event) {
			if (event.keyCode === 13) {
				var isMinSupEditorOpened = $(".inspection-view.minimum-support.editor").css("display") == "block";
				var isAttrNameOpened = $(".inspection-view.attribute-name.editor").css("display") == "block";
				var isTimeUnitOpened = $(".inspection-view.time-unit.editor").css("display") == "block";

				if (isMinSupEditorOpened)
					$(".inspection-view.minimum-support.editor .fa-check").click();
				if (isAttrNameOpened)
					$(".inspection-view.attribute-name.editor .fa-check").click();
				if (isTimeUnitOpened)
					$(".inspection-view.time-unit.editor .fa-check").click();
			}
		});
	},
	initClickBehaviour: function() {
		var self = this;

		$("body").mousedown(function(event) {
			var currentDeactivatedSelector = [];

			for (var i = 0; i < self.clickEvents.length; i++) {
				var currentTargetSelector = self.clickEvents[i].targetSelector;
				var currentDeactivateSelector = self.clickEvents[i].deactivateSelector;
				var onClickCurrentTarget = self.clickEvents[i].onClickTarget;
				var clickedCurrentTarget = $(event.target).closest(currentTargetSelector).length != 0;

				if (clickedCurrentTarget) {
					currentDeactivatedSelector.push(currentDeactivateSelector);
					onClickCurrentTarget(event);
				}
			}

			for (var i = 0; i < self.notClickEvents.length; i++) {
				var currentTargetSelector = self.notClickEvents[i].targetSelector;
				var onNotClickCurrentTarget = self.notClickEvents[i].onNotClickTarget;
				var notClickedCurrentTarget = $(event.target).closest(currentTargetSelector).length == 0;
				var currentTargetSelectorDeactivated = currentDeactivatedSelector.indexOf(currentTargetSelector) != -1;

				if (currentTargetSelectorDeactivated)
					continue;
				if (notClickedCurrentTarget)
					onNotClickCurrentTarget(event);
			}
		});
	},
	registerClickEvent: function(targetSelector, deactivateSelector, onClickTarget) {
		var self = this;

		self.clickEvents.push({
			targetSelector: targetSelector,
			deactivateSelector: deactivateSelector,
			onClickTarget: onClickTarget
		});
	},
	registerNotClickEvent: function(targetSelector, onNotClickTarget) {
		var self = this;

		self.notClickEvents.push({
			targetSelector: targetSelector,
			onNotClickTarget: onNotClickTarget
		});
	}
}