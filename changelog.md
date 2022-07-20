<img src="http://nanogallery2.nanostudio.org/img/nanogallery_logo_v3_main_black.png" alt="nanogallery2"/>  

# nanogallery2
### List of releases with new features and improvements



v3.0.5 - Jan 6, 2021
------
- fixed #299 - Thumbnail for videos not working  
- fixed #305 - JS requires CSP UNSAFE_EVAL  
- fixed #311 - debugger; sentence uncommented stops web load  
- fixed #313 - Lightbox standalone always opens first image, not clicked image  
- fixed #314 - Thumbnails not showing for youtube vids  
- fixed #317 - Thumbnails not showing up, but images are loaded  
- fixed #319 - Video file extension is case sensitive  
- fixed mixed line endings  
  
  
v3.0.4 - Oct 14, 2020
------
- fixed #288 removeIf polyfill breaks AngularJS
  
  
v3.0.3 - Sep 08, 2020
------
- fixed #252 module not found (npmjs)  
  
  
v3.0.2 - Jul 21, 2020
------
- new: **[BREAKING CHANGE for FLICKR user] a custom Flickr API key is now required:**  
      To request one: https://www.flickr.com/services/apps/create/  
      And set it with the new option 'flickrAPIKey'  
- new: data source, ignore markup elements which do not contain media data
- fixed: lightbox does not free it's resources on close, in some case
- fixed: lightbox previous media displayed over current media on startup
- fixed: #266 layout is not adjusted immediately anymore when resizing the browser window
- fixed: #268 self hosted video is not playing when clicked
- fixed: #269 value 'none' for option 'viewerGallery' not working
- fixed: Vimeo videos no playing
- changed: option 'galleryResizeAnimation' now set to false by default
- minor bugfixes

v3.0.1 - Jun 26, 2020
------
- fixed: Flickr connector
- fixed: lightbox error when thumbnails are disabled
- fixed: fullscreen mode remains activated when lightbox is closed after having been started in fullscreen mode
- fixed: requestAnimationFrame not used in some cases
- fixed: does not scroll to top of gallery when an album is opened
- minor bugfixes


v3.0.0 - Jun 19, 2020
------
- new features:
  - thumbnails on lightbox
  - mosaic layout is now fully responsive
  - options 'thumbnailGutterWidth' and 'thumbnailGutterHeight' are now responsive
  - filtering, option galleryFilterTagsMode/galleryL1FilterTagsMode - possible value 'single', 'multiple'
  - filtering, if no tag is selected then no filter is applied
  - loading spinner over thumbnail during album content download
  - first album level: new options thumbnailL1BorderHorizontal and thumbnailL1BorderVertical
  - gallery pagination: left/right buttons on top of the gallery (option 'galleryPaginationTopButtons')
  - lightbox: swipe up to close (additional to the existing swipe down gesture)
  - lightbox: button to add media to shopping cart
  - callback fnPopupMediaInfo(item, title, content) -> {title: my_title, content: my_content}
  - improved: swipe and touch gesture using velocity
  - rounded border on thumbnails (defined in 'galleryTheme')
  - improved: page scrollbar better removed on lightbox display, to avoid page reflow
  - randomized thumbnail display order: option 'thumbnailDisplayOrder' ('', 'random')
  - easing for thumbnail display animation: option 'thumbnailDisplayTransitionEasing' (default: easeOutQuart)
  - Google Photos: enable the use of filename as the title (#226 - thanks to Kevin Robert Keegan https://github.com/krkeegan)
  - Flickr: option tagBlockList to filter out images based on tags (#233 - thanks to Jonathan Keane https://github.com/jonkeane)
  - media title renaming with option 'titleTranslationMap'
  	
- changed:
  - **BREAKING**: option 'blackList' renamed to 'blockList'
  - **BREAKING**: option 'whiteList' renamed to 'allowList'
  - lightbox toolbar: option viewerToolbar.display now set to false by default
  - **BREAKING**: shopping cart handling refactored
  - thumbnail label: new option 'valign' in addition to the 'position' option
  - gallery filtering: icon for tags and for tag's filter reset
  - lightbox tool: icons layout and background
  - hover animation on thumbnails are now disabled by default ('touchAnimation' default value changed to false)
  - **BREAKING**: option 'thumbnailOpenImage' renamed in 'thumbnailOpenInLightox'
  - **BREAKING**: callbacks fnGalleryRenderStart/fnGalleryRenderEnd: now return the album object instead of it's index
  
- fixed:
  - nano_photos_provider2: on gallery initialization, if an album is defined, gallery does not display sub-albums
  - gallery may not be displayed depending on the display animation
  - lightbox: one touch will display toolbars and label when they are hidden
  - modal popup (media info, share): display not sharp, and wrong size on mobile devices
  - some artefacts around thumbnails in some use cases
  - #219 dragging in Firefox - many thanks to Largo (https://github.com/Largo)
  - #226 Google Photos issue on description value (#226 - thanks to Kevin Robert Keegan https://github.com/krkeegan)
  - many mirror fixes
  
- depreciated:
  - removed: viewerDisplayLogo option
  - removed options 'topOverImage', 'bottomOverImage' for lighbox vertical toolbar position
  - removed lightbox theme 'border'

v2.4.2 - Mar 22, 2019
------
- new: self hosted videos - support for WEBM and OGV formats (dependant on browser support)
- fixed: gallery not displayed under certain conditions
- fixed: first html5 video unclickable
- fixed: self hosted videos - support in html markup method
- removed: share on google+

v2.4.1 - Mar 13, 2019
------
- new: support for self hosted videos (mp4)
- new: lightbox - button to rotate images
- new: lightbox - fluid transition from zoomed to unzoomed image when displaying a new image
- new: API shopping cart update event now returns also the concerned item
- fixed: new data provider for the new Google Photos API (nanogp2 - https://github.com/nanostudio-org/nanogp2)
- note: Google Photos - videos cannot be played in the lightbox (only download is available)
- fixed #160: IE11: CSS can not be accessed
- fixed #161: IE11: startsWith not defined
- fixed #157: pagination - scroll to top of the gallery in mode pagination
- fixed #155: image transition effect SWIPE
- fixed: fullscreen issue in Chrome
- enhancement #175: gallery display shaking when pagination activated on mobile device
- enhancement: lightbox vertical pan handling
- removed: option 'albumListHidden' depreciated
  
	 
v2.3.0 - Sep 26, 2018
------
- new loading spinner with support of gif/png files with transparency
- new default lightbox image transition 'swipe2'
- optimized thumbnails lazy loading and display animation
- fixed #130 Joomla3/Bootstrap2 Image Zoom In Bug
- fixed #131 deep linking to image when only one album loaded
- fixed #144 copy-n-paste error - thanks to citrin for the fix


v2.2.0 - May 25, 2018
------
- new option 'eventsDebounceDelay' - thumbnail's lazy display fine tuning (response delay after resizing, rotation and scroll events)
- new API method 'resize' - force a gallery resize. To be used when adding/removing items dynamically, to avoid a full re-display of the thumbnails.
- new internal NGY2Item object method 'delete' - deletes the current item
- new internal NGY2Item object method 'addToGOM' - adds the current item to the Gallery Object Modell
- changed: 'thumbnailDisplayOutsideScreen' default value is now 'true'
- fixed issue on callbacks fnGalleryLayoutApplied, fnGalleryObjectModelBuilt, fnGalleryRenderStart (#121), galleryRenderEnd, fnShoppingCartUpdated, fnShoppingCartUpdated
- fixed #120 - thumbnails with a Single Quote wont load
- fixed #117 - Joomla/Bootstrap icon conflict - changed class in CSS file
- fixed #126 - custom theme using colorSchemeViewer not working
- fixed thumbnail effects 'labelSlideUp' and 'labelSlideDown'
- fixed thumbnail effects with CSS 2D/3D transformations


v2.1.0 - Mar 5, 2018
------
- new: API methods 'closeViewer', 'minimizeToolbar', 'maximizeToolbar', 'paginationPreviousPage', 'paginationNextPage', 'paginationGotoPage', 'paginationCountPages'
- fixed: single touch to open thumbnail when no hover effect defined
- fixed: lightbox support for empty top-left or top-right toolbar
- fixed: option 'galleryMosaicL1' renamed to 'galleryL1Mosaic'
- fixed: options 'touchAnimation' and 'touchAnimationL1'
- fixed: #82 option 'thumbnailAlbumDisplayImage'
- fixed: incorrect .nGY2GThumbnailSub size
- fixed: functions NGY2Item.thumbSet(), NGY2Item.imageSet(), NGY2Item.thumbSetImgHeight(), NGY2Item.thumbSetImgWidth()


v2.0.0 - Nov 30, 2017
------
- new: mosaic layout
- new: video support (Youtube, Vimeo and Dailymotion)
- new: image slider in thumbnail (see option 'thumbnailSliderDelay')
- new: value 'fillWidth' for option 'thumbnailAlignment' (is also the new default value)
- new: option 'thumbnailBaseGridHeight' for cascading layout
- new: markup content source supports the ID attribute
- new: option 'viewerTransitionMediaKind' to enable/disable media transition in lightbox
- new: module support
- new: callback fnProcessData for Flickr data
- enhanced: option 'thumbnailOpenOriginal' for all data types 
- enhanced: added keyword 'auto backup' to default value for 'blackList'
- enhanced: loading.gif embeded in CSS file
- changed: the lightbox is nor more closed when the user clicks/touches the area outside the image
- fixed: #67 viewer opens even if cutom viewer defined (broken in v1.5.0)
- fixed: image swipe left/right closes the lightbox
- fixed: #56 #68 destroy method issue -> warning: browser back to non existing location could happen
- fixed: #70 overflow-x: hidden; not working after exit gallery
- fixed: Flickr - album list blocked by hidden albums 
- fixed: #69 message 'error: no image to process.' no more displayed
- fixed: #77 link to the photo on flickr leads to photostream instead of album
- fixed: #78 exif time now handeld as string format
- fixed: image on selected thumbnail not visible
  
  
v1.5.0 - Sept 7, 2017
------
- new: swipe down to close lightbox
- new: thumbnail image dominant color in stacks
- new: thumbnail gradient color during image download (see galleryTheme)
- new: lightbox option 'viewerImageDisplay'
  Possible values : 'upscale' to upscale images to fullscreen, 'bestImageQuality' for highest quality on high DPI screens like retina
- new: define multiple thumbnails per item (url and size) - API and markup content source
- enhanced: lightbox image zoom and swipe
- removed: open image in Google Photos (broken since changes by Google)
- fixed: #51 - thumbnail to navigate up not displayed correctly
- fixed: Flickr incorrect image resolution
- fixed: thumbnail to navigate up displayed even without parent album
- fixed: option 'photoset' not a real alias of 'album'
- fixed: sorting for images/albums defined with HTML markup or javascript
- fixed: package manager compatibility
- fixed: incorrect cursor pointer when lightbox disabled
- fixed: endless loop if image/gallery in location hash does not exit (markup or javascript content)
- fixed: internal lightbox started although third party lightbox defined
- misc performance enhancements and bugfixes
  
  
v1.4.1 - June 11, 2017
------
- fixed: incorrect font embedded in nanogallery2.woff.css
  
  
v1.4.0 - June 11, 2017
------
- new: display thumbnail's images smoothly when fully downloaded (option 'thumbnailWaitImageLoaded')
- new: gallery display animations (options 'galleryDisplayTransition' and 'galleryDisplayTransitionDuration')
- new: tags support with nanoPhotosProvider2
- new: API functions to search in title and tags ('search2', 'search2Execute')
- enhanced: blurred image display during image download (thumbnails)
- enhanced: thumbnails display animations
- changed: default thumbnail background color from black to gray
- fixed: #46 rotate internal viewer doesn't resize gallery
- fixed: #46 hover effect 'toolsAppear' works only with one toolbar
- fixed: #46 hover effect issue on touch/mobile device
- fixed: #48 browser navigation back to root album doesn't work
- fixed: #48 API function displayItem
- fixed: image display quality in Chrome
- fixed: misc small issues


v1.3.0 - May 11, 2017
------
- new: display thumbnail's images smoothly when fully downloaded - option 'thumbnailWaitImageLoaded'
- new: gallery display animations (options 'galleryDisplayTransition' and 'galleryDisplayTransitionDuration')
- new: tags support with nanoPhotosProvider2
- new: API function 'SearchTags'
- enhanced: blurred image display during image download (thumbnails)
- enhanced: thumbnails display animations
- changed: default thumbnail background color from black to gray
- fixed: #46 rotate internal viewer doesn't resize gallery
- fixed: #46 hover effect 'toolsAppear' works only with one toolbar
- fixed: #46 hover effect issue on touch/mobile device
- fixed: image display quality in Chrome


v1.3.0 - May 11, 2017
------
- new: #3 Auto hide tools on image view after inactivity. Use the option viewerHideToolsDelay to define the delay in ms.
- new: compatibility to nanoPhotosProvider2 (https://github.com/nanostudio-org/nanoPhotosProvider2)
- new: possibility to display dominant color gradient (blurred images) during image load (on thumbnails, not supported by Google Photos or Flickr data source)
- new: thumbnail display transitions, new possibilties: 'flipDown', 'flipUp', 'slideUp2', 'slideDown2', 'slideRight', 'slideLeft'
- new: thumbnailDisplayTransition 'slideUp' and 'slideDown': distance can be defined (example: 'slideUp_200')
- new: share to VK.com
- new: #39 lightbox single tap/click to go to next/previous image (to remove the single tap delay, set option 'viewerZoom' to false)
- new: album level 1 specific options: 'fnThumbnailL1DisplayEffect', 'thumbnailL1DisplayTransition', 'thumbnailL1DisplayTransitionDuration', 'thumbnailL1DisplayInterval'
- new: #30 callbacks in HTML markup mode
- new: enhanced compatibility to browser without CSS Transform support
- new: ImagesLoaded now in version 4.1.1
- new: screenfull.js now in version 3.2.0
- changed: removed share button from to top right toolbar (can be changed with the option 'viewerTools')
- fixed: low image quality in some cases
- fixed: share to Google+
- fixed: old Picasa albums not retrieved (for data before 09/02/2017)
- fixed: #14 Slideshow stop on iPhone/android
- fixex: #34 Image description - filename no more used in title by default
- fixed: #37 Error using custom colors for colorSchemeViewer breaks nanoGallery2
- fixed: #38 Fullscreen icon when opening in fullscreen

  
v1.2.1 - Mar 23, 2017
------
- fixed: Google Photos albums not displayed (with NANOGP - https://github.com/nanostudio-org/nanogp)
- fixed: kind 'google' for (old) Picasa data
- fixed: #31 pagination 'pageChanged' event only fired with next/previous
- fixed: parameter 'galleryLastRowFull' ignored in justified layout

  
  
v1.2.0 - Mar 20, 2017
------
- new: thumbnails hover effects can now be chained and syntax has been enhanced with new options
- new: stack motions effects on thumbnails - options 'thumbnailStacks' and 'thumbnailL1Stacks' to add N stacks behind the thumbnails (thanks to Mary Lou from Codrops for the inspiration - https://tympanus.net/codrops/2017/03/15/stack-motion-hover-effects/)
- new: options 'thumbnailStacksTranslateX', 'thumbnailStacksTranslateY', 'thumbnailStacksTranslateZ', 'thumbnailStacksRotateX', 'thumbnailStacksRotateY', 'thumbnailStacksRotateZ', 'thumbnailStacksScale'
- new: color scheme option 'stackBackground'
- new: options 'thumbnailL1GutterWidth' and 'thumbnailL1GutterHeight'
- new: #23 define a specific image for download (options 'downloadURL' or 'ngdownloadurl')
- new: #21 option 'thumbnailDisplayOutsideScreen' to let the thumbnails always displayed even if not visible on screen (may impact performances)
- new: parameter 'itemsBaseURL' ignored when source of an image is an full URL
- new: #20 option 'data-ngcustomdata' (additionaly to 'ngcustomdata')
- new: thumbnail icon 'display' to open a thumbnail even if selection mode is activated
- changed: hammer.js v2.0.8
- changed: 'viewerDisplayLogo' default value set to false
- changed: access to old Picasa content now included in module google2
- fixed: #28 - Setting navigationBreadcrumb borderRadius does not have any impact
- fixed: parameter 'galleryMaxItems' not working with data source 'google2'
- fixed: parameter 'descriptionFontSize' ignored
- fixed: image zoom with mouse wheel on Firefox


v1.1.0 - Mar 6, 2017
------
- new: custom tools for thumbnails ('custom1..10' and the associated icons (icons.thumbnailCustomTool1..10))
- new: support for custom buttons on thumbnails
- new: callback on click on thumbnail's custom tool - fnThumbnailToolCustAction(action, item)
- new: events 'itemSelected.nanogallery2', 'itemUnSelected.nanogallery2'
- new: data-attribute case insensitive for items definition
- enhanced: image display toolbars handling (custom buttons, custom elements, definition order...)
- fixed: small bugs
  
  
v1.0.0 - Feb 27, 2017
------
- new: options to set the size of images and thumbnails
- new: options to set EXIF properties with javascript
- new: API option 'refresh' to display again the current gallery
- new: API option 'instance' to get the reference of the gallery instance
- new: API option 'search', display thumbnails with title containing the search string
- new: callbacks 'fnGalleryRenderStart', 'fnGalleryRenderEnd', 'fnGalleryObjectModelBuilt', 'fnGalleryLayoutApplied'
- changed: default thumbnail toolbar for albums - thumbnailToolbarAlbum : { topLeft: 'select', topRight : 'counter' }
- changed: default thumbnail toolbar for imgae - thumbnailToolbarImage : { topLeft: 'select', topRight : 'featured' }
- changed: default value of 'thumbnailDisplayInterval' from 30 to 15
- enhanced: high DPI screen, like Retina, support for self hosted content when image size defined
- fixed: misc issues with kind 'google2'
- fixed: zoom image in/out for self hosted content  
  
  
v0.9.3 - Feb 18, 2017
------
- fixed: incorrect image size with Flickr storage
- fixed: double tap fired on zoom-in/out icons
- fixed: image next/previous scrolled 2 images on iPhone
- fixed: incorrect image display
- fixed: error on Google Photos albums with more then 1000 photos
- fixed: Google Photos data added after february 9, 2017 not accessible (module nanogp:https://github.com/nanostudio-org/nanogp)
- improved: image zoom management
  
  
v0.9.2a - Jan 31, 2017
------
- fixed: infobox not displayed in lightbox
- fixed: incorrect thumbnail height/widths calc for google (thanks to alexanderhowell - https://github.com/alexanderhowell)
- fixed: incorrect min-width in CSS

  
v0.9.2 - Jan 26, 2017
------
- new option 'thumbnailOpenOriginal' : display the original image (for example in Flickr or Google Photos), without opening the lightbox
- some icons replaced
- minor changes in the lightbox layout
- new value for 'thumbnailToolbarImage': 'info'
- added support of Android stock browser
- minor bugfixes


