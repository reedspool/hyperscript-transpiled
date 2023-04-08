toplevel =
  feature / compoundExpression / empty

empty = _ { return { type: "EmptyProgram" }  }

feature =
        descriptor:featureDescriptor whitespace _ body:featureBody
        { return { type: 'Feature', event: descriptor.event, body } }

featureDescriptor =
        "on" whitespace _ event:eventName
        { return { event } }

// Want to get back here when ts-pegjs supports Peggy 3.*.*'s list syntax
// See https://peggyjs.org/documentation.html#parsing-lists
// See https://github.com/metadevpro/ts-pegjs/issues/93
// featureBody
//   = compoundExpression|1.., commandDelimeter|
// For now, using this stand-in:
featureBody
  = head:compoundExpression tail:(commandDelimeter @compoundExpression)* commandDelimeter? { return [head, ...tail]; }

commandDelimeter
= _ ";" _

compoundExpression = first:expression next:(whitespace _ "then" whitespace _ @expression)? {
                   return next ? { type: "CompoundExpression", first, next } : first
}

expression =
           // All the things that start with identifiers ("call", "next", "log")
           // must come before identifier expression
           selfReferenceExpression /
           setExpression /
           styleAttrExpression /
           functionCallExpression /
           nextExpression /
           logExpression /
           waitExpression /
           identifierExpression /
           stringExpression /
           // Anything with a number first must come before numbers
           secondsDurationExpression /
           millisecondsDurationExpression /
           numberExpression

logExpression = "log" arg:(whitespace _ expression)?
                { return { type: "LogExpression", args: arg ? [arg[2]] : [] } }

nextExpression = "next" whitespace _ selector:stringExpression
               { return { type: "NextExpression", selector } }

setExpression = "set" whitespace _ target:settableExpression whitespace _ "to" whitespace _ value:expression {
              return { type: "SetExpression", target, value }
}

settableExpression =
                   styleAttrExpression /
                   identifierExpression

styleAttrExpression = "*" attr:jsIdentifier target:(whitespace _ "of" whitespace _ expression)?
               { return { type: "StyleAttrExpression", attr, target: target && target[5] } }

waitExpression = "wait" duration:(whitespace _ durationExpression)?
                { return { type: "WaitExpression", duration: duration && duration[2] } }
durationExpression = millisecondsDurationExpression / secondsDurationExpression
millisecondsDurationExpression = value:numberExpression _ "ms" { return { type: "MillisecondsDurationExpression", value } }
secondsDurationExpression = value:numberExpression _ "s" { return { type: "SecondsDurationExpression", value } }
numberExpression = [0-9]+ ("." [0-9]+)? { return { type: "NumberExpression", value: text() } }

selfReferenceExpression =
           ("me" / "I") { return { type: "SelfReferenceExpression" } }

functionCallExpression =
           "call" whitespace _ name:identifierExpression _ "(" _ args:argList? _ ")"
           { return { type: "FunctionCallExpression", name, args : args ? args : [] }}

identifierExpression =
           head:jsIdentifier next:(_ "." _ @identifierExpression)?
           { return { type: "IdentifierExpression", value: head, next } }

jsIdentifier = (identifierStart identifierPart*) { return text() }
identifierStart = [a-zA-Z_$]
identifierPart = identifierStart / [0-9]

// See note on `featureBody`
// argList
// = expression|.., _ "," _|
// Note that the USAGE of argList now requires a `?`, to mean 0 or 1 of these
// lists, where the Peggy 3.*.* list syntax supports "zero or more" directly
argList
  = head:expression tail:(_ "," _ @expression)* { return [head, ...tail]; }


eventName =
          "click" /
          "init"

NL = [\n]
// Disregarded whitespace
_ = whitespace*
whitespace = [ \n\t]

// BEGIN Stolen from PEG.js JavaScript grammar example
// https://github.com/pegjs/pegjs/blob/master/examples/javascript.pegjs

stringExpression
  = '"' chars:DoubleStringCharacter* '"' {
      return { type: "StringExpression", value: chars.join("") };
    }
//     / "'" chars:SingleStringCharacter* "'" {
//       return { type: "Literal", value: chars.join("") };
//     }

// END Stolen from PEG.js JavaScript grammar example

DoubleStringCharacter
 = !('"') char:. { return char }

SingleStringCharacter
 = "\\\'" / .
