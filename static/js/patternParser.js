var PatternParser = {
	// data created while evaluating each infix exp
	currentPostFixExp: [],
	currentBinaryStringsForEachAVPair: {},
	currentAttrValuePairs: [],
	currentLogicTable: [],

	// send to server
	orderedAttrValuePairsForEachMatcher: [],
	logicTableForEachMatcher: [],

	createLogicTables: function(matchers) {
		var self = this;
		var allInfixExp = matchers;

		self.clearPreviousData();

		for (var i = 0; i < allInfixExp.length; i++) {
			self.initOutputDataForCurrentInfixExp(allInfixExp[i]);
			self.initBinaryStringsForEachAVPair();
			self.convertInfixToPostFix(allInfixExp[i]);
			self.generateTable();
			self.storeResults();
		}
	},
	clearPreviousData: function() {
		var self = this;

		self.orderedAttrValuePairsForEachMatcher = [];
		self.logicTableForEachMatcher = [];
	},
	initOutputDataForCurrentInfixExp: function(infixExp) { // init AVPairs and logic tables
		var self = this;
		self.currentAttrValuePairs = [];
		self.currentLogicTable = [];

		// get all attribute value pairs from the event matcher
		for (var i = 0; i < infixExp.length; i++) {
			if (infixExp[i].type == "AVPair") {
				var attributeName = infixExp[i].data.attributeName;
				var attributeValue = infixExp[i].data.attributeValue;

				self.currentAttrValuePairs.push({
					attributeName: attributeName,
					attributeValue: attributeValue
				});
			}
		}

		// init table
		var numberOfAttrValuePairInMatcher = self.currentAttrValuePairs.length;
		var numberOfPossibleCombinations = Math.pow(2, numberOfAttrValuePairInMatcher);

		for (var i = 0; i < numberOfPossibleCombinations; i++)
			self.currentLogicTable.push(true);
	},
	initBinaryStringsForEachAVPair: function() {
		var self = this;
		var numberOfPossibleCombinations = Math.pow(2, self.currentAttrValuePairs.length);
		self.currentBinaryStringsForEachAVPair = {};

		for (var i = 0 ; i < self.currentAttrValuePairs.length; i++) {
			var key = self.currentAttrValuePairs[i].attributeName + "=" + self.currentAttrValuePairs[i].attributeValue;
			var currentBinaryString = [];
			var numberOfSameValues =  Math.pow(2, i);
			var currentValue = false;

			while (currentBinaryString.length < numberOfPossibleCombinations) {
				var valueArrayInThisIteration = [];

				for (var j = 0; j < numberOfSameValues; j++)
					valueArrayInThisIteration.push(currentValue);

				currentValue = !currentValue;
				currentBinaryString = currentBinaryString.concat(valueArrayInThisIteration);
			}

			self.currentBinaryStringsForEachAVPair[key] = currentBinaryString;
		}
	},
	convertInfixToPostFix: function(infixExp) {
		var self = this;
		var operatorStack = [];
		var postFixExp = [];

		// convert infix to postfix
		for (var i = 0; i < infixExp.length; i++) {
			if (infixExp[i].type == "AVPair") {
				var newValueObject = self.createNewOperatorAndValueObject(infixExp[i]);

				postFixExp.push(newValueObject);
			}

			if (infixExp[i].type == "operator") {
				if (operatorStack.length == 0) // empty, must push
					operatorStack.push(infixExp[i]);

				else if (infixExp[i].itemName == "(") // current item is (, just push it
					operatorStack.push(infixExp[i]);

				else if (infixExp[i].itemName == ")") { // current item is ), pop until see (
					while (operatorStack[operatorStack.length - 1].itemName != "(") {
						var topOperator = operatorStack.pop();
						var newOperatorObject = self.createNewOperatorAndValueObject(topOperator);
						postFixExp.push(newOperatorObject);
					}

					operatorStack.pop();
				}

				else if (operatorStack[operatorStack.length - 1].itemName != "(") { // current item is something else, if top is another operator, pop then push
					var topOperator = operatorStack.pop();
					var newOperatorObject = self.createNewOperatorAndValueObject(topOperator);
					postFixExp.push(newOperatorObject);
					operatorStack.push(infixExp[i]);
				}

				else if (operatorStack[operatorStack.length - 1].itemName == "(") // current item is something else, if top is (, just push
					operatorStack.push(infixExp[i]);
			}
		}

		// pop the rest in the stack
		while (operatorStack.length != 0) {
			var topOperator = operatorStack.pop();
			var newOperatorObject = self.createNewOperatorAndValueObject(topOperator);
			postFixExp.push(newOperatorObject);
		}

		self.currentPostFixExp = postFixExp;
	},
	createNewOperatorAndValueObject: function(oldObject) {
		var self = this;
		var newObject = {};

		if (oldObject.type == "operator") {
			newObject.type = "operator";
			newObject.operation = oldObject.itemName;
		}
		if (oldObject.type == "AVPair") {
			var key = oldObject.data.attributeName + "=" + oldObject.data.attributeValue;
			newObject.type = "AVPair";
			newObject.binaryString = self.currentBinaryStringsForEachAVPair[key];
		}

		return newObject;
	},
	generateTable: function() {
		var self = this;
		var binaryStringStack = [];

		for (var i = 0; i < self.currentPostFixExp.length; i++) {
			if (self.currentPostFixExp[i].type == "AVPair")
				binaryStringStack.push(self.currentPostFixExp[i]);

			if (self.currentPostFixExp[i].type == "operator") {
				if (self.currentPostFixExp[i].operation == "NOT") { // NOT
					var binaryStringObject = binaryStringStack.pop();
					var newBinaryString = self.createNOTBinaryString(binaryStringObject.binaryString);
					var newBinaryStringObject = { type: "AVPair", binaryString: newBinaryString };
					binaryStringStack.push(newBinaryStringObject);
				}

				if (self.currentPostFixExp[i].operation == "AND") { // AND
					var binaryStringObject1 = binaryStringStack.pop();
					var binaryStringObject2 = binaryStringStack.pop();
					var newBinaryString = self.createANDBinaryString(binaryStringObject1.binaryString, binaryStringObject2.binaryString);
					var newBinaryStringObject = { type: "AVPair", binaryString: newBinaryString };
					binaryStringStack.push(newBinaryStringObject);
				}

				if (self.currentPostFixExp[i].operation == "OR") { // OR
					var binaryStringObject1 = binaryStringStack.pop();
					var binaryStringObject2 = binaryStringStack.pop();
					var newBinaryString = self.createORBinaryString(binaryStringObject1.binaryString, binaryStringObject2.binaryString);
					var newBinaryStringObject = { type: "AVPair", binaryString: newBinaryString };
					binaryStringStack.push(newBinaryStringObject);
				}
			}
		}

		self.currentLogicTable = binaryStringStack[0].binaryString;
	},
	storeResults: function() {
		var self = this;

		self.orderedAttrValuePairsForEachMatcher.push(self.currentAttrValuePairs);
		self.logicTableForEachMatcher.push(self.currentLogicTable);
	},
	createNOTBinaryString: function(originalBinaryString) {
		var NOTBinaryString = [];

		for (var i = 0; i < originalBinaryString.length; i++) {
			var valueAfterNOT = !originalBinaryString[i];
			NOTBinaryString.push(valueAfterNOT);
		}

		return NOTBinaryString;
	},
	createANDBinaryString: function(binaryString1, binaryString2) {
		var ANDBinaryString = [];

		for (var i = 0; i < binaryString1.length; i++) {
			var valueAfterAND = binaryString1[i] && binaryString2[i];
			ANDBinaryString.push(valueAfterAND);
		}

		return ANDBinaryString;
	},
	createORBinaryString: function(binaryString1, binaryString2) {
		var ORBinaryString = [];

		for (var i = 0; i < binaryString1.length; i++) {
			var valueAfterOR = binaryString1[i] || binaryString2[i];
			ORBinaryString.push(valueAfterOR);
		}

		return ORBinaryString;
	}
}