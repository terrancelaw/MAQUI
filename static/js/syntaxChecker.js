var SyntaxChecker = {
	isSyntaxCorrect: true,

	checkSyntaxError: function() {
		var self = this;

		self.checkSyntax();
		self.updateMessage();
	},
	checkSyntax: function() {
		var self = this;
		var isSyntaxCorrect = true;

		for (var i = 0; i < PatternEditor.matchers.length; i++) {
			for (var j = 0; j < PatternEditor.matchers[i].length; j++) {
				var currentMatcher = PatternEditor.matchers[i];
				var type = PatternEditor.matchers[i][j].type;
		 		var itemName = PatternEditor.matchers[i][j].itemName;

		 		if (type == "operator" && itemName == "NOT")
		 			isSyntaxCorrect = self.checkNOT(currentMatcher, j);
		 		else if (type == "operator" && (itemName == "AND" || itemName == "OR"))
		 			isSyntaxCorrect = self.checkORAND(currentMatcher, j);
		 		else if (type == "operator" && itemName == "(")
		 			isSyntaxCorrect = self.checkOpenParenthesis(currentMatcher, j);
		 		else if (type == "operator" && itemName == ")")
		 			isSyntaxCorrect = self.checkCloseParenthesis(currentMatcher, j);
		 		else if (type == "AVPair")
		 			isSyntaxCorrect = self.checkValue(currentMatcher, j);

		 		if (!isSyntaxCorrect) {
		 			self.isSyntaxCorrect = isSyntaxCorrect;
		 			return;
				}
			}
		}

		// pass all tests
		self.isSyntaxCorrect = isSyntaxCorrect;
	},
	updateMessage: function() {
		var self = this;

		if (self.isSyntaxCorrect)
			$("#advanced-context-menu .pattern-editor.header .syntax-checker")
				.removeClass("wrong")
				.addClass("correct");

		if (!self.isSyntaxCorrect) 
			$("#advanced-context-menu .pattern-editor.header .syntax-checker")
				.removeClass("correct")
				.addClass("wrong");
	},
	clearPreviousData: function() {
		var self = this;

		self.isSyntaxCorrect = true;
	},
	checkNOT: function(matcherItemArray, index) {
		if (index == matcherItemArray.length - 1)
			return false;
		if (matcherItemArray[index + 1].type != "AVPair" && matcherItemArray[index + 1].itemName != "(")
			return false;

		return true;
	},
	checkORAND: function(matcherItemArray, index) {
		if (index == 0 || index == matcherItemArray.length - 1)
			return false;
		if (matcherItemArray[index - 1].type != "AVPair" && matcherItemArray[index - 1].itemName != ")")
			return false;
		if (matcherItemArray[index + 1].type != "AVPair" && matcherItemArray[index + 1].itemName != "(")
			return false;

		return true;
	},
	checkOpenParenthesis: function(matcherItemArray, index) {
		if (index == matcherItemArray.length - 1)
			return false;

		var foundClose = false;
		for (var i = index; i < matcherItemArray.length; i++)
			if (matcherItemArray[i].itemName == ")")
				foundClose = true;

		return foundClose;
	},
	checkCloseParenthesis: function(matcherItemArray, index) {
		if (index == 0)
			return false;

		var foundOpen = false;
		for (var i = index -  1; i >= 0; i--)
			if (matcherItemArray[i].itemName == "(")
				foundOpen = true;

		return foundOpen;
	},
	checkValue: function(matcherItemArray, index) {
		var matcherItemBefore = (index - 1 < 0) ? null : matcherItemArray[index - 1];
		var matcherItemAfter = (index + 1 > matcherItemArray.length - 1) ? null : matcherItemArray[index + 1];

		if (matcherItemBefore && matcherItemBefore.type == "AVPair")
			return false;
		if (matcherItemAfter && matcherItemAfter.type == "AVPair")
			return false;
		
		return true;
	}
}