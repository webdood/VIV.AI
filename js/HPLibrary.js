VIV = {
  browser : {
    IE : (navigator.appName=="Microsoft Internet Explorer"),
    FF : (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)),
    NS : (navigator.appName == "Netscape"),
    SAFARI : (/Safari[\/\s](\d+\.\d+)/.test(navigator.userAgent))
  },
  library : {
    savedValueOf : new Object(),  // savedValueOf will hold "original" values that we override/restore as needed
    ////////////////////////////////////////////////////////////////////////////////
    //
    // addClassName([object|string] oHTMLElement, string classNameToAdd)
    //           Adds classNameToAdd to an HTMLElement. Guaranteed not to add the same className twice.
    //           classNameToAdd can be a space separated list of classNames.
    //           You can pass in the id to an object or the actual object
    //
    ////////////////////////////////////////////////////////////////////////////////
    addClassName : function(oHTMLElement, classNameToAdd) {
      if (typeof(oHTMLElement)=="string")  { oHTMLElement = document.getElementById(oHTMLElement); }
      if (oHTMLElement && !this.hasClassName(oHTMLElement, classNameToAdd)) {   // Make sure we have an oHTMLElement ot operate on and that the classname isn't already there
        var theClassName = oHTMLElement.className;
        if (theClassName && (theClassName.length > 0)) {  // If oHTMLElement already has a class name, some malert(iTunesU.PodcastManager._universeOfore work is needed
          var classNamesToAdd = classNameToAdd.split(" ");
          if (classNamesToAdd.length===1 && ((" " + theClassName + " ").lastIndexOf(" " + classNameToAdd + " ") === -1) ) { // If we only have one className to potentially add, take the "less work" approach
            oHTMLElement.className = oHTMLElement.className + " " + classNameToAdd;
          } else {
            var theClassNames = theClassName.split(" "),
                iEnd = classNamesToAdd.length,
                aClassName,
                theClassNamesToAddArray = [];
            for (var i=0;i<classNamesToAdd.length;i++) {
              aClassName = classNamesToAdd[i];
              if (theClassNames.indexOf(aClassName)===-1) {
                theClassNamesToAddArray.push( aClassName );
              }
            }
            oHTMLElement.className = oHTMLElement.className + " " + ((theClassNamesToAddArray.length > 1) ? theClassNamesToAddArray.join(" ") : theClassNamesToAddArray[0]);
          }
        } else {
          oHTMLElement.className = classNameToAdd;        // If oHTMLElement did not already have a class name, just add it
        }
      }
    },
    /////////////////////////////////////////////////////////////////////////////////////////
    // addEvent( [object|string] oHTMLElement, string eventName, string handler )          //
    //   Adds an event handler to an HTMLElement.  Note that the eventName must be passed  //
    //   in without the "on" prefix.                                                       //
    /////////////////////////////////////////////////////////////////////////////////////////
    addEvent : function( oHTMLElement, eventName, handler ) {
      try   {
        if (typeof(oHTMLElement)=="string")  {
          oHTMLElement = document.getElementById(oHTMLElement);
        }
        if (VIV.browser.NS) {
          oHTMLElement.addEventListener(eventName, handler, false);
        } else {
          oHTMLElement.attachEvent("on" + eventName, handler);
        }
      }
      catch(err) {
      }
    },
    /////////////////////////////////////////////////////////////////////////////////////////
    // disableTextSelection() - (temporarily) disables text selection on the page          //
    /////////////////////////////////////////////////////////////////////////////////////////
    disableTextSelection : function() {
      switch (true) {
        case ( typeof document.onselectstart!="undefined" ) : // IE
          this.savedValueOf["onselectstart"] = document.onselectstart;
          document.onselectstart=function() { return false; };
          break;
        case ( typeof document.body.style.MozUserSelect != "undefined" ) : // Firefox
          this.savedValueOf["-moz-user-select"] = document.body.style.MozUserSelect || "text";
          document.body.style.MozUserSelect="none";
          break;
        case ( document.body.style["-khtml-user-select"] != "undefined" ) : // Safari
          this.savedValueOf["-khtml-user-select"] = document.body.style["-khtml-user-select"];
          document.body.style["-khtml-user-select"] = 'none';
          break;
      }
    },
    /////////////////////////////////////////////////////////////////////////////////////////
    // clearSelection() - Clears out any text that is currently selected in the page.      //
    /////////////////////////////////////////////////////////////////////////////////////////
    clearSelection : function() {
      var selection;
      if(document.selection && document.selection.empty){
        document.selection.empty();
      } else {
        if (window.getSelection) {
          selection=window.getSelection();
        }
        if (selection && selection.removeAllRanges) {
          selection.removeAllRanges();
        }
      }
    },
    /////////////////////////////////////////////////////////////////////////////////////////
    // disableTextSelection() - (temporarily) disables text selection on the page          //
    /////////////////////////////////////////////////////////////////////////////////////////
    disableTextSelection : function() {
      switch (true) {
        case ( typeof document.onselectstart!="undefined" ) : // IE
          this.savedValueOf["onselectstart"] = document.onselectstart;
          document.onselectstart=function() { return false; };
          break;
        case ( typeof document.body.style.MozUserSelect != "undefined" ) : // Firefox
          this.savedValueOf["-moz-user-select"] = document.body.style.MozUserSelect || "text";
          document.body.style.MozUserSelect="none";
          break;
        case ( document.body.style["-khtml-user-select"] != "undefined" ) : // Safari
          this.savedValueOf["-khtml-user-select"] = document.body.style["-khtml-user-select"];
          document.body.style["-khtml-user-select"] = 'none';
          break;
      }
    },
    /////////////////////////////////////////////////////////////////////////////////////////
    // enableTextSelection() - re-enables text selection after calling disableTextSelection//
    /////////////////////////////////////////////////////////////////////////////////////////
    enableTextSelection : function() {
      switch (true) {
        case ( typeof document.onselectstart!="undefined" ) : // IE
          document.onselectstart = this.savedValueOf["onselectstart"]
          break;
        case (typeof document.body.style.MozUserSelect != "undefined") :  // Firefox
          document.body.style.MozUserSelect = this.savedValueOf["-moz-user-select"]
          break;
        case ( document.body.style["-khtml-user-select"]!="undefined" ) : // Safari
          document.body.style["-khtml-user-select"] = this.savedValueOf["-khtml-user-select"];
          break;
      }
    },
    ///////////////////////////////////////////////////////////////////////////////////////
    // extractedWebkitTranslate3DProperty([object|string] oHTMLElement, string property) //
    // ================================================================================= //
    // Extracts x,y,or z value from a webkitTranslate3D style. Returns a string value.    //
    ///////////////////////////////////////////////////////////////////////////////////////
    extractedWebkitTranslate3DProperty : function( oHTMLElement, property ) {
      var retVal = 0;
      if (typeof(oHTMLElement)=="string")  { oHTMLElement = document.getElementById(oHTMLElement); }
      if (oHTMLElement.style.webkitTransform && oHTMLElement.style.webkitTransform.indexOf('translate3d') > -1 && property !== undefined) {
        var webkitTransform = oHTMLElement.style.webkitTransform,
            propertyArray   = webkitTransform.replace(/ /gi,"").replace("translate3d(","").replace(")","").split(","); // WAS webkitTransform.replace(/[translate3d( )]/gi,'').split(",");
        switch (property.toLowerCase()) {
          case "x" :
            retVal = propertyArray[0];
            break;
          case "y" :
            retVal = propertyArray[1];
            break;
          case "z" :
            retVal = propertyArray[2];
            break;
        }
      }
      return parseFloat(retVal);
    },
    ////////////////////////////////////////////////////////////////////////////////
    //
    // hasClassName([object|string] oHTMLElement, string classNameOfInterest)
    //           Returns a boolean value of if an HTMLElement has the className of interest
    //           You can pass in the id to an object or the actual object
    //
    ////////////////////////////////////////////////////////////////////////////////
    hasClassName : function(oHTMLElement, classNameOfInterest) {
      if (typeof(oHTMLElement)=="string")  { oHTMLElement = document.getElementById(oHTMLElement); }
      return (oHTMLElement) ? ((" " + oHTMLElement.className + " ").lastIndexOf(" " + classNameOfInterest + " ") > -1) : null;
    },
    ////////////////////////////////////////////////////////////////////////////////
    //
    // removeClassName([object|string] oHTMLElement, string classNameToRemove)
    //           Removes classNameToRemove from an HTMLElement, if it exists.
    //           classNameToRemove can be a space separated list of classNames.
    //           You can pass in the id to oHTMLElement or the actual object
    //
    ////////////////////////////////////////////////////////////////////////////////
    removeClassName : function(oHTMLElement, classNameToRemove) {
      if (typeof(oHTMLElement)=="string")  { oHTMLElement = document.getElementById(oHTMLElement); }
      if (oHTMLElement && classNameToRemove) {
        var theClassName = oHTMLElement.className;
        if (theClassName && (theClassName.length > 0)) {
          var theClassNameArray = theClassName.split(" "),
              classNamesToRemove = classNameToRemove.split(" "),
              iEnd = theClassNameArray.length,
              aClassName,
              theNewClassNameArray = [];
          for (var i=0;i<theClassNameArray.length;i++) {
            aClassName = theClassNameArray[i];
            if (classNamesToRemove.indexOf(aClassName)===-1) {
              theNewClassNameArray.push( aClassName );
            }
          }
          switch (true) {
            case (theNewClassNameArray.length>1) :
              oHTMLElement.className = theNewClassNameArray.join(" ");
              break;
            case (theNewClassNameArray.length==1) :
              oHTMLElement.className = theNewClassNameArray[0];
              break;
            case (theNewClassNameArray.length==0) :
              oHTMLElement.className = "";
              break;
          }
        }
        oHTMLElement.className = oHTMLElement.className.trim();
      }
    },
    /////////////////////////////////////////////////////////////////////////////////////////
    // removeEvent( [object|string] oHTMLElement, string eventName, string handler )       //
    //   Removes an event handler to an HTMLElement.  Note that the eventName must be      //
    //   passed in without the "on" prefix.                                                //
    /////////////////////////////////////////////////////////////////////////////////////////
    removeEvent : function( oHTMLElement, eventName, handler ) {
      try   {
        if (typeof(oHTMLElement)=="string")  {
          oHTMLElement = document.getElementById(oHTMLElement);
        }
        if (VIV.browser.NS) {
          oHTMLElement.removeEventListener(eventName, handler, false);
        } else {
          oHTMLElement.detachEvent("on" + eventName, handler);
        }
      }
      catch(err) {
      }
    }
  }
}
var oLogWindow;
function log( message ) {
  if (oLogWindow === undefined) {
    oLogWindow = document.getElementById('log');
  }
  if (oLogWindow) {
    oLogWindow.innerHTML += message + "<br/>";
  }
}
