## Synopsis

VIV.AI Code Sample - playing with Electron, EurekAPI, Flickr
by Shannon Norrell
September 2016

## Code Example

This code sample is intended to convey a facility with a variety of APIs as well as basic UI design principles.

## Motivation

I thought I'd have some fun and come up with a way to see "Photos Near Me" triggered by a big button on the page.

One of the most inspiring apps that I use all the time is "GasBuddy". It has a single button on the page "Find Gas Near Me"
and is beautiful in its simplicity.  I also thought I'd have some fun playing with Electron to build a cross-platform chromeless web app.

Note that when the app first loads, it determines your IP address using api.ipify.org.
Next it determines your City, Zip, Lat, Lon using api.eurekapi.com
If a user manually enters a Zip Code, the app re-computes Lat, Lon using maps.googleapis.com
Finally, when asked to locate Photos Near Me, the app uses Flickr's search API
I used a block of code I wrote several years ago called xScroller for the carousel. If I had time, I would most likely
adapt the display of the images to use a "CoverFlow" style interface.
In the code itself, I wanted to illustrate a facility with newer ES6 concepts like Promises and Let and also the use of NODE modules
like the REQUEST Object.  Note that this entire project is versioned under GIT and uses NPM.

I also hope you will appreciate my CSS skills and are familiar with SASS. Take a look at viv.scss.
Also note the tie-in with VIV.AI screen image I got from the website. Note the border-radius of input elements and placement relative to your brand.

## Future
There are any number of refinements I would like to make to this app if I had the time including:

1. Currently does not support manually changing the City and subsequent conversion to lat/lon. 
2. Only supports manual update of Zip code and Lat/Lon from IP Address.
3. No validation on input elements.
4. Might be cool to add some data bindings. No time to research how best to go about this in Electron.
5. Refactor code to be more name-spaced (Typically for quick POCs I use dangling functions. Once the app gets a bit more complex I bring everything in under namespaced JS)
6. Play with multi-page Electron windows, possibly loading the JSON structure for the images in one window and binding images to urls in another
7. True Cross-Platform testing

## Installation

Make sure you have git and NPM installed

1. git clone https://github.com/webdood/VIV.AI.git MyFolderName
2. cd MyFolderName
3. npm install
4. electron .

(Note that I have not tested the app on anything other than a Mac)

## API Reference

Using the flickr API.

Flickr API Keys used are:
	
Key:
68e0f65ed847ae64ec829d51a5d5e52e

Secret:
56c6a5eee1677f8

- - - - - - - - - - - - - -
Using EurekAPI to determine GeoLocation (the build of Chromium used in Electron throws Error 403 when using geolocation)
EurekAPI Keys used are:
myEurekAPIKeySAKRPYRHQR56B5S57V9Z
(Note this is a 30 day trial started on 9/6/2016) after which this demo will break

QueryString used: http://api.eurekapi.com/iplocation/v1.8/locateip?key=SAKRPYRHQR56B5S57V9Z&ip=15.65.244.14&format=JSON
- - - - - - - - - - - - - -
Using IPIFY to determine IP address

QueryString used: https://api.ipify.org/?format=json to determine IP Address

## Tests

Jasmine tests go in spec folder

## Contributors

Shannon Norrell

## License

