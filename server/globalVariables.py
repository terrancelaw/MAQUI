eventSequencesByID = {}
eventAttrIndexToEventAttrNameDict = {}
eventAttrNameToEventAttrIndexDict = {}
eventAttrValueToEventAttrValueIndexDict = {}
eventAttrValueIndexToEventAttrValueDict = {}

recordAttributesByID = {}
recordAttrIndexToRecordAttrNameDict = {}
recordAttrNameToRecordAttrIndexDict = {}
recordAttrNameToNumericalOrCategoricalDict = {}

FandS = {}
# { panelID: {
#       ForSID: {
#           name,
#           input,
#           output,
#           averageTime, (in second)
#           averageNumberOfEvents,
#           applyToSequences,
#           applyToRecordAttributes,
#           trueStart,
#           trueEnd
#       }
#    }
# }