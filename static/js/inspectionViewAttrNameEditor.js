var InspectionViewAttrNameEditor = {
	attributeList: [],
	selectedView: null,

	init: function() {
		var self = this;

		self.initBottomText();
		self.initClickBehaviour();
		self.initConfirmBehaviour();
	},
	initBottomText: function() {
		var self = this;

		WebAPI.getAttributeList("all", afterGettingAttrList);

		function afterGettingAttrList(attributeList) {
			var firstAttrName = attributeList[0].attributeName;
			var firstAttrType = attributeList[0].attributeType;
			var firstAttrIsNumericalOrCategorical = attributeList[0].numericalOrCategorical;
			var firstEventAttrName = null;

			for (var i = 0; i < attributeList.length; i++) {
				if (attributeList[i].attributeType == "event") {
					firstEventAttrName = attributeList[i].attributeName;
					break;
				}
			}

			self.attributeList = attributeList;
			FrequentPatternView.attributeName = firstEventAttrName;
			RawSequenceView.attributeName = firstEventAttrName;
			AttributeValuePairView.attributeName = firstAttrName;
			AttributeValuePairView.attributeType = firstAttrType;
			AttributeValuePairView.attrIsNumericalOrCategorical = firstAttrIsNumericalOrCategorical;

			FrequentPatternView.updateAttrNameText();
			RawSequenceView.updateAttrNameText();
			AttributeValuePairView.updateAttrNameText();
			AttributeValuePairView.showOrHideTimeUnit();
		}
	},
	initClickBehaviour: function() {
		var self = this;
		var attrNameTextSelector = "#inspection-view .attribute-name";
		var attrNameEditorSelector = ".inspection-view.attribute-name.editor"; // ban this not behaviour

		Body.registerClickEvent(attrNameTextSelector, attrNameEditorSelector, clickAttrNameText);
		Body.registerNotClickEvent(attrNameEditorSelector, notClickAttrNameEditor);

		function clickAttrNameText() {
			var bbox = event.target.getBoundingClientRect();
			var textTop = bbox.top - 5;
			var textLeft = bbox.left + bbox.width / 2;
			var type = $(event.target).attr("type");
			var view = $(event.target).attr("view");
			var alreadySelected = $(event.target).hasClass("selected");

			if (!alreadySelected) {
				if (view == "pattern")
					self.selectedView = FrequentPatternView;
				if (view == "av-pair")
					self.selectedView = AttributeValuePairView;
				if (view == "sequence")
					self.selectedView = RawSequenceView;

				self.show(textTop, textLeft, type);
				self.removeAllSelectedClass();
				self.addSelectedClass(event.target);
			}
			
			if (alreadySelected) {
				self.hide();
				self.removeAllSelectedClass();
			}
		}

		function notClickAttrNameEditor() {
			self.hide();
			self.removeAllSelectedClass();
		}
	},
	initConfirmBehaviour: function() {
		var self = this;

		$(".inspection-view.attribute-name.editor .fa-check").click(clickConfirmButton);

		function clickConfirmButton() {
			var selectedAttrName = $(".inspection-view.attribute-name.editor select option:selected").val();
			var selectedAttrType = $(".inspection-view.attribute-name.editor select option:selected").attr("attributeType");
			var selectedAttrIsNumericalOrCategorical = $(".inspection-view.attribute-name.editor select option:selected").attr("numericalOrCategorical");
			var hasChangedAttrName = self.selectedView.attributeName != selectedAttrName;
			var subsequencesSelected = InspectionView.currentPanelID != null && InspectionView.currentForSID != null && InspectionView.currentOutputType != null;

			if (hasChangedAttrName) {
				var panelID = InspectionView.currentPanelID;
				var ForSID = InspectionView.currentForSID;
				var outputType = InspectionView.currentOutputType;

				if (self.selectedView == FrequentPatternView) {
					FrequentPatternView.attributeName = selectedAttrName;
					FrequentPatternView.updateAttrNameText();

					if (subsequencesSelected)
						FrequentPatternView.retrieveFrequentPatterns(panelID, ForSID, outputType);
				}

				if (self.selectedView == AttributeValuePairView) {
					AttributeValuePairView.attributeName = selectedAttrName;
					AttributeValuePairView.attributeType = selectedAttrType;
					AttributeValuePairView.attrIsNumericalOrCategorical = selectedAttrIsNumericalOrCategorical;
					AttributeValuePairView.updateAttrNameText();
					AttributeValuePairView.showOrHideTimeUnit();

					if (subsequencesSelected)
						AttributeValuePairView.retrieveAVPairs(panelID, ForSID, outputType);
				}

				if (self.selectedView == RawSequenceView) {
					RawSequenceView.attributeName = selectedAttrName;
					RawSequenceView.updateAttrNameText();

					if (subsequencesSelected)
						RawSequenceView.retrieveRawSequences(panelID, ForSID, outputType);
				}
			}

			self.hide();
			self.removeAllSelectedClass();
		}
	},
	show: function(top, left, type) {
		$(".inspection-view.attribute-name.editor")
			.css("display", "block");

		var self = this;
		var bbox = $(".inspection-view.attribute-name.editor")[0].getBoundingClientRect();

		// show
		$(".inspection-view.attribute-name.editor")
			.css("top", top - bbox.height)
			.css("left", left - bbox.width / 2);
		$(".inspection-view.attribute-name.editor select")
			.empty();

		// update options
		for (var i = 0; i < self.attributeList.length; i++) {
			var attributeName = self.attributeList[i].attributeName;
			var attributeType = self.attributeList[i].attributeType;
			var numericalOrCategorical = self.attributeList[i].numericalOrCategorical;
			var optionHTML = "";

			if (self.selectedView.attributeName == attributeName)
				optionHTML = "<option value='" + attributeName + "' name='" + attributeName + "' attributeType='" + attributeType + "' numericalOrCategorical='" + numericalOrCategorical + "' selected>" + attributeName + "</option>";
			if (self.selectedView.attributeName != attributeName)
				optionHTML = "<option value='" + attributeName + "' name='" + attributeName + "' attributeType='" + attributeType + "' numericalOrCategorical='" + numericalOrCategorical + "'>" + attributeName + "</option>";
			if (type == "event" && attributeType != "event")
				continue;

			$(".inspection-view.attribute-name.editor select").append(optionHTML);
		}
	},
	hide: function() {
		$(".inspection-view.attribute-name.editor")
			.css("display", "none");
	},
	addSelectedClass: function(targetEl) {
		$(targetEl)
			.addClass("selected");
	},
	removeAllSelectedClass: function() {
		$("#inspection-view .attribute-name")
			.removeClass("selected");
	}
}