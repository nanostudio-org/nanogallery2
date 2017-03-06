nanogallery2 - ChangeLog
===========
  
v1.1.0
------
// new: custom tools for thumbnails ('custom1..10' and the associated icons (icons.thumbnailCustomTool1..10))
// new: support for custom buttons on thumbnails
// new: callback on click on thumbnail's custom tool - fnThumbnailToolCustAction(action, G.I[idx])
// new: events 'itemSelected.nanogallery2', 'itemUnSelected.nanogallery2'
// new: data attribute case insensitive for items definition
// enhanced: image display toolbars handling (custom buttons, custom elements, definition order...)
// fixed: small bugs
  
  
v1.0.0
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
  
  
v0.9.3
------
- fixed: incorrect image size with Flickr storage
- fixed: double tap fired on zoom-in/out icons
- fixed: image next/previous scrolled 2 images on iPhone
- fixed: incorrect image display
- fixed: error on Google Photos albums with more then 1000 photos
- fixed: Google Photos data added after february 9, 2017 not accessible (module nanogp:https://github.com/nanostudio-org/nanogp)
- improved: image zoom management
  
  
v0.9.2a
------
- fixed: infobox not displayed in lightbox
- fixed: incorrect thumbnail height/widths calc for google (thanks to alexanderhowell - https://github.com/alexanderhowell)
- fixed: incorrect min-width in CSS

  
v0.9.2
------
- new option 'thumbnailOpenOriginal' : display the original image (for example in Flickr or Google Photos), without opening the lightbox
- some icons replaced
- minor changes in the lightbox layout
- new value for 'thumbnailToolbarImage': 'info'
- added support of Android stock browser
- minor bugfixes


