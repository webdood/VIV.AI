// xScroller.js
/* Learnings
   onWebkitTransitionEnd not firing reliably on iOS 5
   delay from onTouchEnd (no way around this I could find)
   onTouchEnd does not carry an event object with it (or at least one with clientX, clientY in it)
*/

(function() {
  var _default = {
        autoScrollVelocity : 10,
        classNameForScrollableObject : 'x-scrollable',
        classNameForHorizontalScrollableObject : 'x-horizontal',
        classNameForNonScrollableObject : "not-scrollable",
        classNameForPaginatedScrollableObject : 'paginated',
        classNameForVerticalScrollableObject : 'x-vertical',
        keyFrameAnimationNamePrefix : 'webdood-scroller-',
        pageEscapeVelocity : 33,
        snapBackTimeInMilliseconds : 200,
        velocitySampleFrequency : 300
      },
      globalStyleSheet,
      isTouch = "ontouchstart" in window,
      state = {
        animationGeneratorCounter : 0,
        currentAnimationClassName : null,
        currentAnimationTotalTime : 0,
        currentScrollingElement : null,
        touch : {
          startTime : null,
          currentPosition : {               // This tracks the finger as it swipes across the page
            ofInterest : null,              // "OfInterest" is the (x or y) value of interest to oScrollableElement
            x : null,                       // We track the x and the y for support of dual scrolling scenarios
            y : null
          },
          lastPosition : {                  // This is where the finger was at the time of last sampling by trackVelocity() ( Determines acceleration/velocity for subsequent scroll )
            ofInterest : null,              // "OfInterest" is the (x or y) value of interest to oScrollableElement
            x : null,                       // We track the x and the y for support of dual scrolling scenarios
            y : null
          },
          startPosition : {                 // This is where the finger started the swipe
            ofInterest : null,              // "OfInterest" is the (x or y) value of interest to oScrollableElement
            x : null,                       // We track the x and the y for support of dual scrolling scenarios
            y : null
          }
        }
      },
      velocityTracker = null;               // This is a handle to a setInterval that measures a the velocity at the time a swipe is finished
  function createScrollerFor( oHTMLElement ) {
    var oScrollableElement = null;
    if ( VIV.library.hasClassName(oHTMLElement, _default.classNameForHorizontalScrollableObject) ) {                                       // Horizontal
      oScrollableElement = createScrollerForHorizontalScrolling( oHTMLElement );
    }
    if ( VIV.library.hasClassName(oHTMLElement, _default.classNameForVerticalScrollableObject) ) {                                         // Vertical
      oScrollableElement = createScrollerForVerticalScrolling( oHTMLElement );
    }
    if ( VIV.library.hasClassName(oHTMLElement,_default.classNameForPaginatedScrollableObject) && oScrollableElement !== null ) {          // Paginated
      oScrollableElement.paginated = true;
      oScrollableElement.numberOfPages = (oScrollableElement.filter(oHTMLElement.scrollWidth, oHTMLElement.scrollHeight) / oScrollableElement.viewport)-1;
    }
    log('Returning ' + oScrollableElement.direction + ((oScrollableElement.paginated) ? ' paginated with ' + oScrollableElement.numberOfPages + ' pages' : ''))
    return oScrollableElement;
  }
  function createScrollerForHorizontalScrolling( node ) {
    if (node.style.webkitAnimation) {                       // Necessary to pause animation in order to get correct transform value
      node.style.webkitAnimationPlayState = "paused";
    }
    var parent = node.parentNode,
        position = new WebKitCSSMatrix(getComputedStyle(node).webkitTransform).m41 - (node.scrollableOffset||0);
    return {
      direction : 'horizontal',
      initialPosition : position,
      max: node.scrollWidth - parent.offsetWidth,
      min: -node.offsetWidth + parent.offsetWidth,
      node: node,
      numberOfPages : 1,
      viewport: parent.offsetWidth,
      currentPosition : function() {
        return new WebKitCSSMatrix(getComputedStyle(this.node).webkitTransform).m41;
      },
      filter: function(x, y) {            // This returns the portion of touch event that is interesting to this type of scroller
        return x;
      },
      update: function(position) {
        return 'translate3d(' + Math.round(position) + 'px, 0, 0)';
      }
    };
  }
  function createScrollerForVerticalScrolling( node ) {
    if (node.style.webkitAnimation) {                       // Necessary to pause animation in order to get correct transform value
      node.style.webkitAnimationPlayState = "paused";
    }
    var parent = node.parentNode,
        position = new WebKitCSSMatrix(getComputedStyle(node).webkitTransform).m42;
    return {
      direction : 'vertical',
      initialPosition : position,
      max: node.scrollHeight - parent.offsetHeight,
      min: -node.offsetHeight + parent.offsetHeight,
      node: node,
      numberOfPages : 1,
      viewport: parent.offsetHeight,
      currentPosition : function() {
        return new WebKitCSSMatrix(getComputedStyle(this.node).webkitTransform).m42;
      },
      filter: function(x, y) {            // This returns the portion of touch event that is interesting to this type of scroller
        return y;
      },
      update: function(position) {
        return 'translate3d(0, ' + Math.round(position) + 'px, 0)';
      }
    };
  }
  function onLoad() {
    var ss = document.createElement("style");
    document.head.appendChild(ss);
    globalStyleSheet = document.styleSheets[document.styleSheets.length-1];
    globalStyleSheet.insertRule("." +  _default.classNameForScrollableObject + " { -webkit-transform: translate3d(0,0,0);width:100%;height:100%; }", 0);
    globalStyleSheet.insertRule(".snap-back  { -webkit-transition-property: -webkit-transform; -webkit-transition-timing-function:ease-in; -webkit-transition-duration: " + _default.snapBackTimeInMilliseconds + "ms;  }", 0);
    // TODO -add code such that, onOrientationChange, scrollTo(0)
  }
  function onTouchStart(event) {
    log('onTouchStart');
    var bContinueTraversing = true,
        touch   = isTouch ? event.touches[0] : event,
        element = touch.target,
        oScrollableElement = null;
    // Determine if we are over a scrollable element
    while (bContinueTraversing && element) {
      if (VIV.library.hasClassName(element, _default.classNameForNonScrollableObject)) {    // Stop traversing if we hit an element that has the special "not-scrollable" classname attached to it
        bContinueTraversing = false;
        log('abort scroll')
      } else {
        if (VIV.library.hasClassName(element, _default.classNameForScrollableObject)) {      // We have found a scrollable item
          oScrollableElement = element;
          bContinueTraversing = false;
        } else {
          element = element.parentNode;
        }
      }
    }
    if (oScrollableElement) {
      if (state.currentScrollingElement !== null) {    // Clean-up
        scrollStop();
        VIV.library.removeEvent(document, (isTouch) ? 'touchend' : 'mouseup', onTouchEnd);
        VIV.library.removeEvent(document, (isTouch) ? 'touchmove' : 'mousemove', onTouchMove);
      }
      VIV.library.disableTextSelection();       // Prevent accidental text-selection
      VIV.library.clearSelection();             // Clear out any test selection that may have been made (Possible enhancement: Only clear ranges if selection is within scrollable element)
      VIV.library.removeClassName(oScrollableElement, state.currentAnimationClassName)
      state.currentAnimationClassName = null;
      state.currentScrollingElement = createScrollerFor( oScrollableElement );
      state.touch.startTime = new Date();
      state.touch.startPosition.x = state.touch.currentPosition.x = state.touch.lastPosition.x = touch.clientX;    // Capture where we started
      state.touch.startPosition.y = state.touch.currentPosition.y = state.touch.lastPosition.y = touch.clientY;
      state.touch.startPosition.ofInterest = state.touch.currentPosition.ofInterest = state.touch.lastPosition.ofInterest = state.currentScrollingElement.filter( touch.clientX, touch.clientY);

      VIV.library.addEvent(document, (isTouch) ? 'touchmove' : 'mousemove', onTouchMove);
      VIV.library.addEvent(document, (isTouch) ? 'touchend' : 'mouseup', onTouchEnd);
      velocityTracker = setInterval(trackVelocity, _default.velocitySampleFrequency)
    } else {
      state.currentScrollingElement = null;
      VIV.library.removeEvent(document, (isTouch) ? 'touchend' : 'mouseup', onTouchEnd);
      VIV.library.removeEvent(document, (isTouch) ? 'touchmove' : 'mousemove', onTouchMove);
    }
  }
  function onTouchEnd(event) {
    log('onTouchEnd');
    VIV.library.removeEvent(document, (isTouch) ? 'touchend' : 'mouseup', onTouchEnd);
    VIV.library.removeEvent(document, (isTouch) ? 'touchmove' : 'mousemove', onTouchMove);
    clearInterval(velocityTracker);
    if(state.currentScrollingElement) {
      var oScrollableElement = state.currentScrollingElement,
          touchX = state.touch.currentPosition.x,
          touchY = state.touch.currentPosition.y,
          delta  = state.touch.currentPosition.ofInterest - state.touch.startPosition.ofInterest,
          deltaTime = new Date() - state.touch.startTime,
          lastDelta = state.touch.currentPosition.ofInterest - state.touch.lastPosition.ofInterest,     // How far did the finger move during the last sampling period ( _default.velocitySampleFrequency )
          lastVelocity = Math.abs(lastDelta / _default.velocitySampleFrequency)*100,
          velocity = Math.abs(delta / deltaTime) * 100,
          directionOfScroll = (oScrollableElement.direction==="vertical") ? ((delta<0) ? "up" : "down") : ((delta<0) ? "left" : "right");
      //    log("Direction is " + directionOfScroll);
      //    log('delta:' + delta + ' dt:'+ deltaTime + ' velocity:' + velocity + ' lastDelta:' + lastDelta + ' lastVelocity:' + lastVelocity)
      switch (true) {
        case (-oScrollableElement.currentPosition()<oScrollableElement.min) :      // We have dragged the window past the minimum allowed
          state.currentAnimationClassName = 'snap-back';
          state.currentAnimationTotalTime = _default.snapBackTimeInMilliseconds;
          scrollTo( oScrollableElement.min );
          log('snap to min!')
          break;
        case (-oScrollableElement.currentPosition()>oScrollableElement.max) :      // We have dragged the window past the maximum allowed
          state.currentAnimationClassName = 'snap-back';
          state.currentAnimationTotalTime = _default.snapBackTimeInMilliseconds
          scrollTo( -oScrollableElement.max );
          log('snap to max!')
          break;
        case (oScrollableElement.paginated) :               // We are paginated
          log('velocity:'+velocity + ' kPageEscapeVelocity:' + _default.pageEscapeVelocity + ' maxpgs:' + oScrollableElement.numberOfPages);
          var currentPageNumber = Math.abs(Math.round(oScrollableElement.currentPosition()/oScrollableElement.viewport)),
              nextPageNumber = currentPageNumber;           // Default is we will snap back to the current page we are already on
          if (velocity > _default.pageEscapeVelocity) {     // Snap to the next page if we have enough velocity or have moved enough pixels to warrant paging
            nextPageNumber = Math.min(oScrollableElement.numberOfPages, Math.max(0, currentPageNumber + ((directionOfScroll==="up" || directionOfScroll==="left") ? 1 : -1)));
          }
          state.currentAnimationClassName = 'snap-back';
          state.currentAnimationTotalTime = _default.snapBackTimeInMilliseconds;
          scrollTo( -oScrollableElement.viewport * nextPageNumber );
          log("Snap from page " + currentPageNumber + ' to ' + nextPageNumber + ' dir:' + directionOfScroll); // total:' + oScrollableElement.numberOfPages)
          break;
        default :
          // TODO - compute time to do so as function of velocity
          if (lastVelocity > _default.autoScrollVelocity) {
            state.currentAnimationClassName = _default.keyFrameAnimationNamePrefix + (state.animationGeneratorCounter++),
              state.currentAnimationTotalTime = 500;               // was cubic-bezier(.22,.96,.55,1);
            globalStyleSheet.insertRule("." + state.currentAnimationClassName + " { -webkit-transition-property: -webkit-transform; -webkit-transition-timing-function: cubic-bezier(.08, .69, .81, 1); -webkit-transition-duration: " + state.currentAnimationTotalTime + "ms;  }", 0);
            log('delta: ' + Math.abs(delta) + ' lastVelocity:' + lastVelocity + ' net:' + (lastVelocity-_default.autoScrollVelocity))
            var numberOfPixelsToPotentiallyScroll = Math.abs(delta) * (1+lastVelocity/100),
                newPosition = oScrollableElement.currentPosition() - ((delta<0) ? numberOfPixelsToPotentiallyScroll : -numberOfPixelsToPotentiallyScroll);
            if (-newPosition < oScrollableElement.min) { newPosition = oScrollableElement.min; log('Capped at min of ' + oScrollableElement.min) }
            if (-newPosition > oScrollableElement.max) { newPosition = -oScrollableElement.max; log('Capped at max of ' + -oScrollableElement.max) }
            //          log('new: ' + newPosition + ' min:' + oScrollableElement.min )
            scrollTo( newPosition );
          }
          break;
      }
      setTimeout( function() {
          if (state.currentScrollingElement) {
            VIV.library.removeClassName(state.currentScrollingElement.node,state.currentAnimationClassName)
            state.currentScrollingElement = null;
          }
          VIV.library.enableTextSelection();
        }, state.currentAnimationTotalTime||0
      );
    }
  }
  function onTouchMove(event) {
    event.preventDefault();
    var oScrollableElement = state.currentScrollingElement,
        touch  = isTouch ? event.touches[0] : event;
    if (oScrollableElement) {                                      // Sometimes we can get to a touchmove event when the scrollableElement is still being destroyed from previous operations
      state.touch.currentPosition.x = touch.clientX;               // Touch position had to be abstracted out because onTouchEnd was found to not be returning clientX, clientY on iOS 5
      state.touch.currentPosition.y = touch.clientY;
      state.touch.currentPosition.ofInterest = oScrollableElement.filter( touch.clientX, touch.clientY );
      oScrollableElement.node.style.webkitTransform = oScrollableElement.update(oScrollableElement.initialPosition + state.touch.currentPosition.ofInterest - state.touch.startPosition.ofInterest);
    }
  }
  function scrollStop() {
    log('scrollStop')
    //    VIV.library.removeEvent(state.currentScrollingElement.node,'webkitTransitionEnd',function() { scrollStop(); });
    if (state.currentScrollingElement) {
      VIV.library.removeClassName(state.currentScrollingElement.node,state.currentAnimationClassName);
    }
  }
  function scrollTo( position ) {
    //    VIV.library.addEvent(state.currentScrollingElement.node,'webkitTransitionEnd',function() { scrollStop(); });
    VIV.library.addClassName(state.currentScrollingElement.node,state.currentAnimationClassName);
    state.currentScrollingElement.node.style.webkitTransform = state.currentScrollingElement.update( position );
    setTimeout(function() { scrollStop(); }, _default.snapBackTimeInMilliseconds);
  }
  function setup() {
    VIV.library.addEvent(document, (isTouch) ? 'touchstart' : 'mousedown', onTouchStart);
    VIV.library.addEvent(window,'load',onLoad);
  }
  function trackVelocity() {
    var deltaSinceLastSample = state.touch.currentPosition.ofInterest - state.touch.lastPosition.ofInterest;
    log('tracking ' + deltaSinceLastSample);
    state.touch.lastPosition.x = state.touch.currentPosition.x;
    state.touch.lastPosition.y = state.touch.currentPosition.y;
    state.touch.lastPosition.ofInterest = state.touch.currentPosition.ofInterest;
  }
  setup();
})();