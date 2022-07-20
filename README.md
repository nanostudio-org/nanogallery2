
# nanogallery2  
**modern photo / video gallery and lightbox &nbsp; [javascript library]**
  
nanogallery2 is a must have gallery and lightbox. Strengths of nanogallery2 include rich UI interactions, multiple responsive layouts, swipe and zoom gestures, multi-level albums, an HTML page generator and limitless options. Setup and use are simple. The documentation includes tutorials, samples and ready to use HTML pages.   
   
<img src="http://nanogallery2.nanostudio.org/img/nanogallery_logo_v3_main_black.png" alt="nanogallery2"/>  
  

![version](https://img.shields.io/badge/version-3.0.5-orange)
[![Build Status](https://travis-ci.org/nanostudio-org/nanogallery2.svg?branch=dev-gh-pages)](https://travis-ci.org/nanostudio-org/nanogallery2)
[![DeepScan grade](https://deepscan.io/api/teams/89/projects/394/branches/608/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=89&pid=394&bid=608)
<!-- 
![license](https://img.shields.io/static/v1?label=Open%20source%20license&message=GPLv3&color=green)
![license](https://img.shields.io/static/v1?label=Commercial%20license&message=for%20use%20in%20a%20revenue-generating%20product&color=green)
-->

  
  
<br />   <br />   
## Documentation, Demonstrations and Tutorials
-> [Check the homepage of the project](https://nanogallery2.nanostudio.org/documentation.html)   
  
<!--  
[![nanogallery2 youtube demo](https://github.com/nanostudio-org/nanogallery2/raw/gh-pages/videos/youtube_nanogallery2.png)](https://www.youtube.com/watch?v=Ir098VWCv8Q)
-->  
    
      
<br />   <br />   

## Features
### Markup or Javascript set up
### Images
### Videos (Youtube, Vimeo, Dailymotion)
### Media titles and descriptions, tags
### Touch and mobile friendly
### Smart lazy loading and displaying
### Deeplinking
### Gallery
- multiple base layouts: grid, cascading/mansonry, justified, mosaic
- responsive
- tag/keyword filtering
- display transition on gallery and thumbnails: reveal items on-scroll in an animated way
- hover/touch effects
- tools on thumbnails: social sharing, selection, download, shopping cart
- pagination, "display more" button
- albums
- blurred images for thumbnail preview
- breadcrumb navigation
- slider on last thumbnail
- thumbnails stacks
- themes
### Lightbox
- swipe / pinch to zoom
- mouse and keyboard
- image rotation / zoom
- fully customizable toolbars
- previous/next media transitions
- smart slideshow
- themes
### Custom icons
### show media location on google maps
### API / Events / Callbacks
### Fast animation engine
### Builder for quick online testing
### Detailled documentation with samples
### Super customizable
### Optional add-on for automatic publishing of self hosted images: [nanoPhotosProvider2](https://github.com/nanostudio-org/nano_photos_provider2)
  
<br />  
<br />  

## New features and improvements  
-> [Check ChangeLog](changelog.md)  


<br />  
<br />

## Some screenshots
<img src="https://github.com/nanostudio-org/nanogallery2/raw/master/screenshots/ngy2_mosaic3.jpg?raw=true" width="500px">  
<br />  
<img src="https://github.com/nanostudio-org/nanogallery2/raw/master/screenshots/ngy2_mosaic1.jpg?raw=true" width="500px">  
<br />  
<img src="https://github.com/nanostudio-org/nanogallery2/raw/master/screenshots/ngy2_mosaic2.jpg?raw=true" width="500px">  
<br />  
<img src="https://github.com/nanostudio-org/nanogallery2/raw/master/screenshots/ngy2_cascading.jpg?raw=true" width="500px">  
<br />  
<img src="https://github.com/nanostudio-org/nanogallery2/raw/master/screenshots/ngy2_justified.jpg?raw=true" width="500px">  
<br />  
<img src="https://github.com/nanostudio-org/nanogallery2/raw/master/screenshots/ngy2_grid1.jpg?raw=true" width="500px">  
<br />  
<img src="https://github.com/nanostudio-org/nanogallery2/raw/master/screenshots/ngy2_grid2.jpg?raw=true" width="500px">  
<br />  
<img src="https://github.com/nanostudio-org/nanogallery2/raw/master/screenshots/ngy2_tags.jpg?raw=true" width="500px">

<br />  
<br />  

## Usage

HTML markup setup examples:
```
  <div id="my_nanogallery2" 
    data-nanogallery2='{ "userID": "34858669@N00", "kind": "flickr", "thumbnailHeight": 150, "thumbnailWidth": 150 }'>
  </div>
```
```
  <div id="my_nanogallery2" data-nanogallery2  >
    <a href="img/img_01.jpg">Title Image 1
      <img src="img/img_01_thumbnail.jpg"/>
    </a>
    <a href="img/img_02.jpg">Title Image 2
      <img src="img/img_02_thumbnail.jpg"/>
    </a>
    <a href="img/img_03.jpg">Title Image 3
      <img src="img/img_03_thumbnail.jpg"/>
    </a>
  </div>
```
```
  <div id="my_nanogallery2" data-nanogallery2 = '{ "itemsBaseURL": "https://mywebserver/gallery/myimages/"}' >
    <a href="img_01.jpg" data-ngthumb="img_01t.jpg"  data-ngdesc="Description1"        >Title Image1</a>
    <a href="img_02.jpg" data-ngthumb="img_02ts.jpg" data-ngdesc="Image 2 description" >Title Image2</a>
    <a href="img_03.jpg" data-ngthumb="img_03t.jpg"                                    >Title Image3</a>
  </div>
```

<br />  

## Package managers

[npmjs](https://www.npmjs.com/package/nanogallery2): `npm install nanogallery2`

<br />  

## License
Dual licensed:
- GPLv3 for personal or open source projects with GPLv3 license
- Commercial license for use in a revenue-generating product

<br />

## Requirements
* Javascript must be enabled
* jQuery 1.12.4+ (not compatible with v3.0/v3.1, because of a jQuery regression described [here](https://github.com/jquery/jquery/issues/3193) )
  
<br />

 
**Many thanks to these technology contributors:** 
- for [shifty](https://github.com/jeremyckahn/shifty):
**[Jeremy Kahn](https://github.com/jeremyckahn) - special thanks for all your help!**
- for [imagesloaded](https://github.com/desandro/imagesloaded): 
[David DeSandro](https://github.com/desandro)
- for [screenfull.js](https://github.com/sindresorhus/screenfull.js):
[Sindre Sorhus](https://github.com/sindresorhus)
- for [Hammer.js](http://hammerjs.github.io/):
[Alexander Schmitz](https://github.com/arschmitz),
[Chris Thoburn](https://github.com/runspired),
[Jorik Tangelder](https://github.com/jtangelder)
- for [fontello.com](http://fontello.com):
[Vitaly Puzrin](https://github.com/puzrin)
  
&nbsp;  
&nbsp;  
**Many thanks to [BrowserStack](https://www.browserstack.com/) for their great testing services!**   
<img src="https://nanogallery.brisbois.fr/img/browserstack2.png" width="230px"/>
