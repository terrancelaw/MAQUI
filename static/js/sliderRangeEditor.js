var SliderRangeEditor = {
	init: function() {
		$("#slider-range-editor")
			.on("keydown", keydownSliderRangeEditor) // not allow non char
			.on("input", inputSliderRangeEditor); // change width

		function keydownSliderRangeEditor(e) {
			// Allow: backspace, delete, tab, escape, enter and .
	        if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
	             // Allow: Ctrl/cmd+A
	            (e.keyCode == 65 && (e.ctrlKey === true || e.metaKey === true)) ||
	             // Allow: Ctrl/cmd+C
	            (e.keyCode == 67 && (e.ctrlKey === true || e.metaKey === true)) ||
	             // Allow: Ctrl/cmd+X
	            (e.keyCode == 88 && (e.ctrlKey === true || e.metaKey === true)) ||
	             // Allow: home, end, left, right
	            (e.keyCode >= 35 && e.keyCode <= 39)) {
	                 // let it happen, don't do anything
	                 return;
	        }

	        // Ensure that it is a number and stop the keypress
	        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
	            e.preventDefault();
	        }
		}

		function inputSliderRangeEditor(e) {
        	// append dummy
        	var value = $(this).val();
        	var dummyHTML = "<span id='dummy-editor-text'>" + value + "</span>"
        	
        	$("body")
        		.append(dummyHTML);
        	$("#dummy-editor-text")
        		.css("display", "inline-block")
        		.css("font-size", 13)
        		.css("font-weight", "bold");

        	// change text box width
        	var dummyEl = $("#dummy-editor-text")[0];
        	var dummyWidth = dummyEl.getBoundingClientRect().width;

        	$(this).css("width", dummyWidth + 1);
        	$("#dummy-editor-text").remove();
		}
	}
}