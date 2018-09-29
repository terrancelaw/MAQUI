var full = "100%";
var margin = 5;

var leftColWidth = "calc(100% - 333px)";
var rightColWidth = 300;

var subsequenceViewHeight = "calc(100% - 17.5px)";
var subsequenceViewMinHeight = 500;

var inspectionViewHeight = "calc(100% - 17.5px)";
var inspectionViewMinHeight = 500;
var inspectionViewContextHeight = 50;
var inspectionViewContextContainerWidth = "calc(100% - 2px - 16px)"; // padding = 2, margin = 16
var inspectionViewContextContainerHeight = "calc(100% - 16px)"; // margin = 16

var frequentPatternViewHeaderHeight = 35;
var frequentPatternViewContentHeight = "calc((100% - 105px - 50px) / 3)";
var frequentPatternViewContentContainerHeight = "calc(100% - 21px)";
var frequentPatternViewContentControlsWidth = "calc(100% - 2px - 16px)"; // padding = 2, margin = 16
var frequentPatternViewContentControlsHeight = 20 - 2; // padding top bottom = 2
var frequentPatternViewContentLoaderHeight = "calc(100% - 21px)";

var attributeValuePairViewHeaderHeight = 35;
var attributeValuePairViewContentHeight = "calc((100% - 105px - 50px) / 3)";
var attributeValuePairViewContentContainerHeight = "calc(100% - 21px)";
var attributeValuePairViewContentControlsWidth = "calc(100% - 2px - 16px)"; // padding = 2, margin = 16
var attributeValuePairViewContentControlsHeight = 20 - 2; // padding top bottom = 2
var attributeValuePairViewContentLoaderHeight = "calc(100% - 21px)";

var rawSequenceViewHeaderHeight = 35;
var rawSequenceViewContentHeight = "calc((100% - 105px - 50px) / 3)";
var rawSequenceViewContentContainerHeight = "calc(100% - 26px)";
var rawSequenceViewContentControlsWidth = "calc(100% - 2px - 16px)"; // padding = 2, margin = 16
var rawSequenceViewContentControlsHeight = 20 - 2; // padding top bottom = 2
var rawSequenceViewContentLoaderHeight = "calc(100% - 26px)";

var simpleContextMenuHeight = 270;
var simpleContextMenuWidth = 250;
var simpleContextMenuHeaderHeight = 30;
var simpleContextMenuAttributeContentHeight = 30;
var simpleContextMenuValuesSearchBoxHeight = 30;
var simpleContextMenuValuesContentHeight = "calc(100% - 155px)";
var simpleContextMenuValuesContentContainerHeight = "85%";
var simpleContextMenuValuesContentContainerWidth = "calc(100% - 20px)";
var simpleContextMenuFooterHeight = 35;
var simpleContextMenuFooterButtonHeight = 25;
var simpleContextMenuFooterButtonWidth = 109.5;

var sliderContextMenuHeight = 270;
var sliderContextMenuWidth = 250;
var sliderContextMenuHeaderHeight = 30;
var sliderContextMenuAttributeContentHeight = 30;
var sliderContextMenuRangeContentHeight = "calc(100% - 125px)";
var sliderContextMenuRangeContentSliderWidth = 170;
var sliderContextMenuFooterHeight = 35;
var sliderContextMenuFooterButtonHeight = 25;
var sliderContextMenuFooterButtonWidth = 109.5;

var advancedContextMenuHeight = 270;
var advancedContextMenuWidth = 250;
var advancedContextMenuHeaderHeight = 30;
var advancedContextMenuPatternNameContentHeight = 30;
var advancedContextMenuPatternEditorContentHeight = "calc(100% - 125px)";
var advancedContextMenuPatternEditorContentContainerHeight = "80%";
var advancedContextMenuPatternEditorContentContainerWidth = "calc(100% - 20px)";
var advancedContextMenuFooterHeight = 35;
var advancedContextMenuFooterButtonHeight = 25;
var advancedContextMenuFooterButtonWidth = 109.5;

var advancedSelectionMenuWidth = 250;
var advancedSelectionMenuHeight = 200;
var advancedSelectionMenuFirstColumnWidth = "26%";
var advancedSelectionMenuSecondColumnWidth = "calc(74% - 1px)";
var advancedSelectionMenuHeaderHeight = 25;
var advancedSelectionMenuOperatorContentHeight = "calc(100% - 25px)";
var advancedSelectionMenuAttributeContentHeight = 30;
var advancedSelectionMenuValuesSearchBoxHeight = 30;
var advancedSelectionMenuValuesContentHeight = "calc(100% - 110px)";
var advancedSelectionMenuValuesContentContainerHeight = "80%";
var advancedSelectionMenuValuesContentContainerWidth = "calc(100% - 24px)";

$(function() {
	$("body, html")
		.css("width", full)
		.css("height", full);

	// outer containers
	$("#left-column")
		.css("width", leftColWidth)
		.css("height", full)
		.css("margin-right", margin);
	$("#right-column")
		.css("width", rightColWidth)
		.css("height", full);

	// subsequence view
	$("#subsequence-view")
		.css("width", full)
		.css("height", subsequenceViewHeight)
		.css("min-height", subsequenceViewMinHeight);
	$("#subsequence-view > .container")
		.css("width", full)
		.css("height", full);

	// inspection view
	$("#inspection-view")
		.css("width", full)
		.css("height", inspectionViewHeight)
		.css("min-height", inspectionViewMinHeight);
	$("#inspection-view .context-visualization")
		.css("width", full)
		.css("height", inspectionViewContextHeight);
	$("#inspection-view .context-visualization .container")
		.css("width", inspectionViewContextContainerWidth)
		.css("height", inspectionViewContextContainerHeight);

	// frequent pattern view
	$("#inspection-view .frequent-pattern-view.header")
		.css("width", full)
		.css("height", frequentPatternViewHeaderHeight);
	$("#inspection-view .frequent-pattern-view.content")
		.css("width", full)
		.css("height", frequentPatternViewContentHeight);
	$("#inspection-view .frequent-pattern-view.content .container")
		.css("width", full)
		.css("height", frequentPatternViewContentContainerHeight);
	$("#inspection-view .frequent-pattern-view.content .container .all-patterns")
		.css("width", full)
		.css("height", full);
	$("#inspection-view .frequent-pattern-view.content .controls")
		.css("width", frequentPatternViewContentControlsWidth)
		.css("height", frequentPatternViewContentControlsHeight);
	$("#inspection-view .frequent-pattern-view.content .loader")
		.css("width", full)
		.css("height", frequentPatternViewContentLoaderHeight);

	// attribute value pair view
	$("#inspection-view .attribute-value-pair-view.header")
		.css("width", full)
		.css("height", attributeValuePairViewHeaderHeight);
	$("#inspection-view .attribute-value-pair-view.content")
		.css("width", full)
		.css("height", attributeValuePairViewContentHeight);
	$("#inspection-view .attribute-value-pair-view.content .container")
		.css("width", full)
		.css("height", attributeValuePairViewContentContainerHeight);
	$("#inspection-view .attribute-value-pair-view.content .container .all-attribute-value-pairs")
		.css("width", full)
		.css("height", full);
	$("#inspection-view .attribute-value-pair-view.content .controls")
		.css("width", attributeValuePairViewContentControlsWidth)
		.css("height", attributeValuePairViewContentControlsHeight);
	$("#inspection-view .attribute-value-pair-view.content .loader")
		.css("width", full)
		.css("height", attributeValuePairViewContentLoaderHeight);

	// raw sequence view
	$("#inspection-view .raw-sequence-view.header")
		.css("width", full)
		.css("height", rawSequenceViewHeaderHeight);
	$("#inspection-view .raw-sequence-view.content")
		.css("width", full)
		.css("height", rawSequenceViewContentHeight);
	$("#inspection-view .raw-sequence-view.content .container")
		.css("width", full)
		.css("height", rawSequenceViewContentContainerHeight);
	$("#inspection-view .raw-sequence-view.content .container .all-sequences")
		.css("width", full)
		.css("height", full);
	$("#inspection-view .raw-sequence-view.content .controls")
		.css("width", rawSequenceViewContentControlsWidth)
		.css("height", rawSequenceViewContentControlsHeight);
	$("#inspection-view .raw-sequence-view.content .loader")
		.css("width", full)
		.css("height", rawSequenceViewContentLoaderHeight);

	// simple context menu
	$("#simple-context-menu")
		.css("width", simpleContextMenuWidth)
		.css("height", simpleContextMenuHeight);
	$("#simple-context-menu .header")
		.css("width", full)
		.css("height", simpleContextMenuHeaderHeight);
	$("#simple-context-menu .attribute.content")
		.css("width", full)
		.css("height", simpleContextMenuAttributeContentHeight);
	$("#simple-context-menu .values.search-box")
		.css("width", full)
		.css("height", simpleContextMenuValuesSearchBoxHeight);
	$("#simple-context-menu .values.content")
		.css("width", full)
		.css("height", simpleContextMenuValuesContentHeight);
	$("#simple-context-menu .values.content .container")
		.css("width", simpleContextMenuValuesContentContainerWidth)
		.css("height", simpleContextMenuValuesContentContainerHeight);
	$("#simple-context-menu .values.content .container .dummy-div")
		.css("width", full)
		.css("height", full);
	$("#simple-context-menu .footer")
		.css("width", full)
		.css("height", simpleContextMenuFooterHeight);
	$("#simple-context-menu .footer .button")
		.css("width", simpleContextMenuFooterButtonWidth)
		.css("height", simpleContextMenuFooterButtonHeight);

	// slider context menu
	$("#slider-context-menu")
		.css("width", sliderContextMenuWidth)
		.css("height", sliderContextMenuHeight);
	$("#slider-context-menu .header")
		.css("width", full)
		.css("height", sliderContextMenuHeaderHeight);
	$("#slider-context-menu .attribute.content")
		.css("width", full)
		.css("height", sliderContextMenuAttributeContentHeight);
	$("#slider-context-menu .range.content")
		.css("width", full)
		.css("height", sliderContextMenuRangeContentHeight);
	$("#slider-context-menu .range.content #slider")
		.css("width", sliderContextMenuRangeContentSliderWidth);
	$("#slider-context-menu .footer")
		.css("width", full)
		.css("height", sliderContextMenuFooterHeight);
	$("#slider-context-menu .footer .button")
		.css("width", sliderContextMenuFooterButtonWidth)
		.css("height", sliderContextMenuFooterButtonHeight);

	// advanced context menu
	$("#advanced-context-menu")
		.css("width", advancedContextMenuWidth)
		.css("height", advancedContextMenuHeight);
	$("#advanced-context-menu .header")
		.css("width", full)
		.css("height", advancedContextMenuHeaderHeight);
	$("#advanced-context-menu .pattern-name.content")
		.css("width", full)
		.css("height", advancedContextMenuPatternNameContentHeight);
	$("#advanced-context-menu .pattern-editor.content")
		.css("width", full)
		.css("height", advancedContextMenuPatternEditorContentHeight);
	$("#advanced-context-menu .pattern-editor.content .container")
		.css("width", advancedContextMenuPatternEditorContentContainerWidth)
		.css("height", advancedContextMenuPatternEditorContentContainerHeight);
	$("#advanced-context-menu .footer")
		.css("width", full)
		.css("height", advancedContextMenuFooterHeight);
	$("#advanced-context-menu .footer .button")
		.css("width", advancedContextMenuFooterButtonWidth)
		.css("height", advancedContextMenuFooterButtonHeight);

	// advanced selection menu
	$("#advanced-selection-menu")
		.css("width", advancedSelectionMenuWidth)
		.css("height", advancedSelectionMenuHeight);
	$("#advanced-selection-menu .first-column")
		.css("width", advancedSelectionMenuFirstColumnWidth)
		.css("height", full);
	$("#advanced-selection-menu .second-column")
		.css("width", advancedSelectionMenuSecondColumnWidth)
		.css("height", full);
	$("#advanced-selection-menu .header")
		.css("width", full)
		.css("height", advancedSelectionMenuHeaderHeight);
	$("#advanced-selection-menu .operator.content")
		.css("width", full)
		.css("height", advancedSelectionMenuOperatorContentHeight);
	$("#advanced-selection-menu .attribute.content")
		.css("width", full)
		.css("height", advancedSelectionMenuAttributeContentHeight);
	$("#advanced-selection-menu .values.search-box")
		.css("width", full)
		.css("height", advancedSelectionMenuValuesSearchBoxHeight);
	$("#advanced-selection-menu .values.content")
		.css("width", full)
		.css("height", advancedSelectionMenuValuesContentHeight);
	$("#advanced-selection-menu .values.content .container")
		.css("width", advancedSelectionMenuValuesContentContainerWidth)
		.css("height", advancedSelectionMenuValuesContentContainerHeight);

	// svg
	d3.select("#advanced-context-menu .pattern-editor.content .container svg")
		.attr("width", full)
		.attr("height", full);
	d3.select("#pattern-tooltip svg")
		.attr("width", full)
		.attr("height", full);
	d3.select("#inspection-view .context-visualization .container svg")
		.attr("width", full)
		.attr("height", full);

	SubsequenceView.init();
	InspectionView.init();
	InspectionViewMinSupEditor.init();
	InspectionViewAttrNameEditor.init();
	InspectionViewTimeUnitEditor.init();
	FrequentPatternView.init();
	FrequentPatternViewButtons.init();
	AttributeValuePairView.init();
	AttributeValuePairViewButtons.init();
	RawSequenceView.init();
	RawSequenceViewButtons.init();
	ContextMenu.init();
	SimpleContextMenu.init();
	SliderContextMenu.init();
	SliderRangeEditor.init();
	AdvancedContextMenu.init();
	PatternEditor.init();
	AdvancedSelectionMenu.init();
	Body.init();
});

d3.selection.prototype.moveToFront = function() {
	return this.each(function() {
		this.parentNode.appendChild(this);
  	});
}

d3.selection.prototype.moveToBack = function() {  
    return this.each(function() { 
        var firstChild = this.parentNode.firstChild; 
        if (firstChild) { 
            this.parentNode.insertBefore(this, firstChild); 
        } 
    });
}

function clickcancel() {
  var event = d3.dispatch('click', 'dblclick');

  function cc(selection) {
    var down,
      tolerance = 5,
      last,
      wait = null;
    // euclidean distance
    function dist(a, b) {
      return Math.sqrt(Math.pow(a[0] - b[0], 2), Math.pow(a[1] - b[1], 2));
    }
    selection.on('mousedown', function() {
      down = d3.mouse(document.body);
      last = +new Date();
    });
    selection.on('mouseup', function() {
      if (dist(down, d3.mouse(document.body)) > tolerance) {
        return;
      } else {
        if (wait) {
          window.clearTimeout(wait);
          wait = null;
          event.call('dblclick', d3.event);
        } else {
          wait = window.setTimeout((function(e) {
            return function() {
              event.call('click', e);
              wait = null;
            };
          })(d3.event), 300);
        }
      }
    });
  };
  cc.on = function() {
    var value = event.on.apply(event, arguments);
    return value === event ? cc : value;
  };
  return cc;
}