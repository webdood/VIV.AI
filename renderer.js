// Renderer.js for index.html by Shannon Norrell, September 29, 2016
// ===========
// This code sample is intended to convey a facility with a variety of APIs as well as basic UI design principles.
// I thought I'd have some fun and come up with a way to see "Photos Near Me" triggered by a big button on the page
// One of the most inspiring apps that I use all the time is "GasBuddy". It has a single button on the page "Find Gas Near Me"
// and is beautiful in its simplicity.  I also thought I'd have some fun playing with Electron to build a cross-platform chromeless web app.
// Note that when the app first loads, it determines your IP address using api.ipify.org.
// Next it determines your City, Zip, Lat, Lon using api.eurekapi.com
// If a user manually enters a Zip Code, the app re-computes Lat, Lon using maps.googleapis.com
// Finally, when asked to locate Photos Near Me, the app uses Flickr's search API
// I used a block of code I wrote several years ago called xScroller for the carousel. If I had time, I would most likely
// adapt the display of the images to use a "CoverFlow" style interface.
// In the code itself, I wanted to illustrate a facility with newer ES6 concepts like Promises and Let and also the use of NODE modules
// like the REQUEST Object.  Note that this entire project is versioned under GIT uses NPM.
//
// I also hope you will appreciate my CSS skills and are familiar with SASS. Take a look at viv.scss.
// Also note the tie-in with VIV.AI screen image I got from the website. Note the border-radius of input elements and placement relative to your brand.
// There are any number of refinements I would like to make to this app if I had the time including:
/*
 Currently does not support manually changing the City and subsequent conversion to lat/lon. Only supports manual update of Zip code
 and Lat/Lon from IP Address.
 No validation on input elements.
 Might be cool to add some data bindings. No time to research how best to go about this in Electron.
 Refactor code to be more name-spaced (Typically for quick POCs I use dangling functions. Once the app gets a bit more complex I bring everything in under namespaced JS)
 Play with multi-page Electron windows, possibly loading the JSON structure for the images in one window and binding images to urls in another
*/

var DEBUG_MODE = true;  // Simple flag to keep the console clean
var myInfo = {
      ipAddress : null,
      latitude : null,
      longitude : null,
      city : null,
      postal_code : null
    };

///////////////////////////////////////////////////////////////////////////
// showPhotosNearMe() - uses the flickr.photos.search API                //
// ==================   Demonstrates use of node REQUEST Object.         //
// Template REST Call (JSON) is: https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=68e0f65ed847ae64ec829d51a5d5e52e&lat=33.6062809&lon=-117.6728185&radius=15&format=json&nojsoncallback=1
///////////////////////////////////////////////////////////////////////////
function showPhotosNearMe() {
  var myFlickrAPIKey = '68e0f65ed847ae64ec829d51a5d5e52e',
      theURL = 'https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=' + myFlickrAPIKey + '&lat=' + myInfo.latitude + '&lon=' + myInfo.longitude + '&radius=1&format=json&nojsoncallback=1',
      oRequest = require('request');
  if (DEBUG_MODE) {
    console.log(`showPhotosNearMe:: Latitude: ${myInfo.latitude}\nLongitude: ${myInfo.longitude}`);  // NOTE - the use of ES6 Template Strings
    console.log(`showPhotosNearMe:: URL: ${theURL}`);
  }
  VIV.library.removeClassName('pleaseWaitLoadingSpinner','hidden');
  oRequest(theURL, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      let oResults = JSON.parse(body);
      let oGalleryContents = document.getElementById('gallery-contents');
      let bigString = '<ul>';
      for (var i=0,iEnd=oResults.photos.photo.length;i<iEnd;i++) {
        let oPhoto = oResults.photos.photo[i];
        if (i<iEnd-1) {
          bigString += '<li><img src="https://farm' + oPhoto.farm + '.staticflickr.com/' + oPhoto.server + '/' +oPhoto.id + '_' + oPhoto.secret + '.jpg"/></li>\n';
        } else {
          // Add special code to the last image so that the gallery displays when all images have been loaded
          // Note ran into a weird context/scope issue here with electron callign a funciton, so put the code inline for POC.
          bigString += '<li><img onload="VIV.library.removeClassName(\'gallery\',\'hidden\');VIV.library.addClassName(\'pleaseWaitLoadingSpinner\',\'hidden\')" src="https://farm' + oPhoto.farm + '.staticflickr.com/' + oPhoto.server + '/' +oPhoto.id + '_' + oPhoto.secret + '.jpg"/></li>\n';
        }

      }
      bigString += '</ul>';
      // I realize that using innerHTML is "non standard" and I would probably use some form of
      // react or other framework here, but innerHTML is a LOT faster to JS. And I only have a few hours to complete this code sample
      document.getElementById('gallery-contents').innerHTML = bigString;
    }
  })
}

///////////////////////////////////////////////////////////////////////////
// determineIPAddress() - determines IP address by calling api.ipify.org //
// ====================   demonstrates use of native XMLHttprequest      //
// This code block uses the api.ipify.org restful API                    //
///////////////////////////////////////////////////////////////////////////
function determineIPAddress() {
  return new Promise(function(resolve, reject) {
    var oXMLHttpRequest = new XMLHttpRequest();
    oXMLHttpRequest.open("GET","https://api.ipify.org/?format=json");
    oXMLHttpRequest.onload = function() {
      if (oXMLHttpRequest.status == 200 && oXMLHttpRequest.responseText) {
        let hostIPInfo = JSON.parse( oXMLHttpRequest.responseText );
        resolve(hostIPInfo.ip);
      } else {
        reject(Error("Unable to determine IP address."))
      }
    }
    oXMLHttpRequest.send();
  });
}

////////////////////////////////////////////////////////////////////////////
// determineLocationBasedOnIPAddress() - determines postal code and city. //
// ===================================   Demonstrates use of node REQUEST //
// object, Promises, Let. This code block uses the api.eurekapi.com API   //
////////////////////////////////////////////////////////////////////////////
function determineLocationBasedOnIPAddress() {
  return new Promise(function(resolve, reject) {
    var myEurekAPIKey = 'SAKRPYRHQR56B5S57V9Z',
        theURL = "http://api.eurekapi.com/iplocation/v1.8/locateip?key=" + myEurekAPIKey + "&ip=" + myInfo.ipAddress + "&format=JSON",
        oRequest = require('request');
    oRequest(theURL, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        try {
          let locationGoodies = JSON.parse(body);
          resolve(locationGoodies.geolocation_data);
        }
        catch(err) {
          reject('Unexpected error. This happened to me when operating behind an autocache proxy. Please enter City/Zip manually.')
        }
      } else {
        reject("Error contacting eurekapi.")
      }
    })
  });
}

///////////////////////////////////////////////////////////////////////////
// determineLocationBasedOnPostalCode() - determines LAT/LON based on    //
// ====================================   postal code. This uses regular //
// XMLHttpRequest without Promises                                       //
// This code block uses the maps.googleapis.com restful API              //
///////////////////////////////////////////////////////////////////////////
function determineLocationBasedOnPostalCode() {
  var oXMLHttpRequest = new XMLHttpRequest(),
      theURL = 'http://maps.googleapis.com/maps/api/geocode/json?address=' + myInfo.postal_code;
  oXMLHttpRequest.open("GET",theURL);
  oXMLHttpRequest.onload = function() {
    if (oXMLHttpRequest.status == 200 && oXMLHttpRequest.responseText) {
      try {
        let locationGoodies = JSON.parse(oXMLHttpRequest.responseText).results[0];
        myInfo.latitude     = locationGoodies.geometry.location.lat;
        myInfo.longitude    = locationGoodies.geometry.location.lng;
        myInfo.city         = locationGoodies.address_components[1].long_name;
        document.getElementById('city').value = myInfo.city;
      }
      catch(err) {
        alert('Unexpected error using googleapis. No time to edge-test this');
      }
    } else {
      alert("Unable to determine IP address.");
    }
  }
  oXMLHttpRequest.send();
}

// Main
document.addEventListener("DOMContentLoaded", function() {          // "Proper" timing for adding event handlers and setting things up.
  var oButton       = document.getElementsByTagName('button')[0],   // "Proper" unobtrusive adding of event handlers.
      oInputCity    = document.getElementById('city'),
      oInputZipCode = document.getElementById('zipCode');
  oButton.addEventListener("click", function() { showPhotosNearMe() }, false);
  oInputCity.addEventListener("focus", function() { oInputZipCode.focus() }, false);  // Not the greatest user experience, but until I add support for determining LAT/LON from a City, only allow updating Zip Code
  oInputZipCode.addEventListener("change", function() { myInfo.postal_code = this.value; determineLocationBasedOnPostalCode(); }, false);

  document.addEventListener('touchmove', function(e) { e.preventDefault(); }, false);
  window.ondragstart = function() { return false; } // Prevent dragging of images

  // Illustrating use of promises .... calling several web services to determine IP Address, City, Postal Code and Latitude/Longitude of user and to pre-populate fields
  determineIPAddress().then( function(ipAddress) {          // Determine IP Address
    myInfo.ipAddress = ipAddress;
    determineLocationBasedOnIPAddress().then( function(oLocation) {         // Determine City, Postal Code and Lat/Lon based on ipAddress
      myInfo.city         = oLocation.city;
      myInfo.latitude     = oLocation.latitude;
      myInfo.longitude    = oLocation.longitude;
      myInfo.postal_code  = oLocation.postal_code;
      document.getElementById('city').value    = myInfo.city;
      document.getElementById('zipCode').value = myInfo.postal_code;
      if (DEBUG_MODE) {
        console.log(`Ip Address: ${myInfo.ipAddress}\nCity: ${myInfo.city}\nZip Code: ${myInfo.postal_code}`);  // NOTE - the use of ES6 Template Strings
      }
    }, function(errMessage) {
      alert(errMessage);
    })
  }, function(errMessage) {
    alert(errMessage);
  });

});


