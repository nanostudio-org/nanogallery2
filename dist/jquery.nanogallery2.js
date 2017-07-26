/* nanogallery2 - v0.0.0 - DEV DO NOT USE -2017-07-26 - http://nanogallery2.nanostudio.org - DEV DO NOT USE - */
/**!
 * @preserve nanogallery2 - javascript image gallery
 * Homepage: http://nanogallery2.nanostudio.org
 * Sources:  https://github.com/nanostudio-org/nanogallery2
 *
 * License:  GPLv3 and commercial licence
 * 
 * Requirements:
 *  - jQuery (http://www.jquery.com) - version >= 1.7.1
 *
 * Components:
 *  - shifty (https://github.com/jeremyckahn/shifty) - is embeded
 *  - TinyColor (https://github.com/bgrins/TinyColor) - is embedded
 *  - imagesloaded (https://github.com/desandro/imagesloaded) - is embebed
 *  - hammer.js (http://hammerjs.github.io/) - is embeded
 *  - screenfull.js (https://github.com/sindresorhus/screenfull.js) - is embeded
 *  - webfont generated with http://fontello.com - mainly based on Font Awesome Copyright (C) 2012 by Dave Gandy (http://fontawesome.io/)
 *  - ICO online converter: https://iconverticons.com/online/
 */

/*
v1.4.1 BETA - DO NOT USE
- new: thumbnail image dominant color now used in stacks
- new: option 'viewerImageDisplay' (use value 'upscale' to upscale small images)
- enhanced: lightbox image zoom
- fixed: #51 - thumbnail to navigate up not displayed correctly
- fixed: thumbnail to navigate up displayed even without parent album
- fixed: option 'photoset' not a real alias of 'album'
- fixed: sorting for images/albums defined with HTML markup or javascript
- fixed: package manager compatibility
- fixed: cursor pointer when lightbox disabled
- fixed: endless loop if image/gallery in location hash does not exit (markup or javascript content)
- misc performance enhancements

TODO:
- changer logo portable (violet)
- API: custom sort
- Thumbnail icon : sous le texte, en bas de l'imagette (1 nouvelle ligne sous le texte)
- carr� autour num page pagination
- viewer : d�marrer pre-chargement des 2 images en d�call� (plus de bande passante pour la principale)
- nanophotosprovider: get all pictures from all albums
- last thumbnail +N -> slide next images on it (withouthover effect)
- viewer : click outside image to close 
- viewer : retrieve max zoom factor (3 at this time)
- font size in viewerColorScheme? change option name -> styleProfil
- colorScheme : rond + couleur  autour thumbnail tool
- thumbnail tools:
    - plus de possibilit� de localisation en particulier par rapport au label
    - rating avec 5 �toiles
    

*/ 
 

// ###########################################
// ##### nanogallery2 as a JQUERY PLUGIN #####
// ###########################################
;(function ($) {
  "use strict";

  $.nanogallery2 = function (elt, options) {
  
    // To avoid scope issues, use '_this' instead of 'this'
    // to reference this class from internal events and functions.
    var _this = this;

    // Access to jQuery and DOM versions of element
    _this.$e  = jQuery(elt);
    _this.e   = elt;

    // Add a reverse reference to the DOM object
    _this.$e.data('nanogallery2data', _this);

    _this.init = function () {
  
      // define these global objects only once per HTML page
      if (typeof window.NGY2Item === 'undefined') {
  
        window.NGY2Tools = (function () {

          function NGY2Tools() {
            var nextId = 1;                   // private static --> all instances
          }

          // check album name - albumList/blackList/whiteList
          NGY2Tools.FilterAlbumName = function( title, ID ) {
            var s=title.toUpperCase();
            if( this.albumList.length > 0 ) {
              for( var j=0; j < this.albumList.length; j++) {
                if( s === this.albumList[j].toUpperCase() || ID === this.albumList[j] ) {
                  return true;
                }
              }
            }
            else {
              var found=false;
              if( this.whiteList !== null ) {
                //whiteList : authorize only album cointaining one of the specified keyword in the title
                for( var j=0; j<this.whiteList.length; j++) {
                  if( s.indexOf(this.whiteList[j]) !== -1 ) {
                    found=true;
                  }
                }
                if( !found ) { return false; }
              }


              if( this.blackList !== null ) {
                //blackList : ignore album cointaining one of the specified keyword in the title
                for( var j=0; j<this.blackList.length; j++) {
                  if( s.indexOf(this.blackList[j]) !== -1 ) { 
                    return false;
                  }
                }
              }
              
              return true;
            }
          };


          /** @function nanoAlert */
          /* Display an alert message in a specific element */
          NGY2Tools.NanoAlert = function(context, msg, verbose) {
            NGY2Tools.NanoConsoleLog.call(context, msg);
            if( context.$E.conConsole != null ) {
              context.$E.conConsole.css({visibility:'visible', minHeight:'100px'});
              if( verbose == false ) {
                context.$E.conConsole.append('<p>'+ msg + '</p>');
              }
              else {
                context.$E.conConsole.append('<p>nanogallery2: '+msg+ ' ['+context.baseEltID+']</p>');
              }
              //alert('nanoGALLERY: ' + msg);
            }
          };
          
  
          /** @function NanoConsoleLog */
          /* write message to the browser console */
          NGY2Tools.NanoConsoleLog = function(context, msg) {
            if (window.console) { console.log('nanogallery2: ' + msg + ' ['+context.baseEltID+']'); }
          };
          

          /** @function PreloaderDisplay() */
          /* Display/hide preloader */
          NGY2Tools.PreloaderDisplay = function(display) {
            if( display === true ) {
              this.$E.conLoadingB.removeClass('nanoGalleryLBarOff').addClass('nanoGalleryLBar');
            }
            else {
              this.$E.conLoadingB.removeClass('nanoGalleryLBar').addClass('nanoGalleryLBarOff');
            }
          };

          //+ Jonas Raoni Soares Silva
          //@ http://jsfromhell.com/array/shuffle [v1.0]
          NGY2Tools.AreaShuffle = function (o) {
            for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
            return o;
          };
          
          /** @function GetImageTitleFromURL() */
          /* retrieve filemane */
          NGY2Tools.GetImageTitleFromURL = function( imageURL ) {
            if( this.O.thumbnailLabel.get('title') == '%filename' ) {
              return (imageURL.split('/').pop()).replace('_',' ');
            }
            
            if( this.O.thumbnailLabel.get('title') == '%filenameNoExt' ) {
              var s=imageURL.split('/').pop();
              return (s.split('.').shift()).replace('_',' ');
            }
            // return imageURL;
            return '';
          };
          

          /** @function AlbumPostProcess() */
          /* post process one album based on plugin general parameters  --> sorting/maxItems*/
          NGY2Tools.AlbumPostProcess = function(albumID) {

            // this function can probably be optimized....
          
            var sortOrder=this.gallerySorting[this.GOM.curNavLevel];
            var maxItems=this.galleryMaxItems[this.GOM.curNavLevel];
          
            if( sortOrder != '' || maxItems > 0 ) {
            
              // copy album's items to a new array
              var currentAlbum=this.I.filter( function( obj ) {
                return( obj.albumID == albumID && obj.kind != 'albumUp' );
              });
        
              // sorting options
              switch( sortOrder ) {
                case 'RANDOM':
                  currentAlbum = NGY2Tools.AreaShuffle(currentAlbum);
                  break;
                case 'REVERSED':
                  currentAlbum = currentAlbum.reverse();
                  break;
                case 'TITLEASC':
                  currentAlbum.sort(function (a, b) {
                    return( (a.title.toUpperCase() < b.title.toUpperCase()) ? -1 : ((a.title.toUpperCase() > b.title.toUpperCase()) ? 1 : 0) );
                  });
                  break;
                case 'TITLEDESC':
                  currentAlbum.sort(function (a, b) {
                    return( (a.title.toUpperCase() > b.title.toUpperCase()) ? -1 : ((a.title.toUpperCase() < b.title.toUpperCase()) ? 1 : 0) );
                  });
                  break;
              }     

              // max Items
              if( maxItems > 0 && currentAlbum.length > maxItems ) {
                currentAlbum.splice(maxItems-1,currentAlbum.length-maxItems );
              }
              
              // remove the albums's items from the global items array
              this.I.removeIf( function( obj ) {
                return( obj.albumID == albumID && obj.kind != 'albumUp' );
              });
              
              // add the sorted items back to the album
              this.I.push.apply(this.I, currentAlbum);

            }
          };
          
          
          return NGY2Tools;
        })(); 

        // ====================
        // ===== NGY2Item =====
        // ====================
        window.NGY2Item = (function() {
          var nextId = 1;                   // private static --> all instances

          // constructor
          function NGY2Item( itemID ) {
          //window.NGY2Item = function( itemID ) {
            var ID = 0;                     // private

            // public (this instance only)
            if( itemID === undefined || itemID === null ) {
              ID = nextId++;
            }
            else {
              ID = itemID;
            }
            this.GetID = function () { return ID; };
            
            // public
            this.kind =                 '';       // 'image', 'album' or 'albumUp'
            this.G =                    null;     // pointer to global instance
            this.title =                '';       // image title
            this.description =          '';       // image description
            this.albumID =              0;        // ID of the parent album
            this.src =                  '';       // full sized image URL
            this.width =                0;        // image width
            this.height =               0;        // image height
            this.destinationURL =       '';       // thumbnail destination URL --> open URL instead of displaying image
            this.downloadURL =          '';       // thumbnail download URL --> specify the image for download button
            this.author =               '';       // image/album author
            this.left=                  0;        // store position to animate from old to new
            this.top=                   0;
            this.width=                 0;        // store size to avoid setting width/height if not required
            this.height=                0;
            this.resizedContentWidth=   0;        // store size of content (image) to avoid setting width/height if not required
            this.resizedContentHeight=  0;
            this.thumbs = {                       // URLs and sizes for user defined
              url:    { l1: { xs: '', sm:'', me: '', la: '', xl: '' }, lN: { xs: '', sm: '', me: '', la:'', xl: '' } },
              width:  { l1: { xs: 0,  sm: 0, me: 0,  la: 0 , xl: 0  }, lN: { xs: 0 , sm: 0,  me: 0,  la: 0, xl: 0  } },
              height: { l1: { xs: 0,  sm: 0, me: 0,  la: 0 , xl: 0  }, lN: { xs: 0,  sm: 0,  me: 0,  la: 0, xl: 0  } }
            };
            this.thumbnailImgRevealed   = false;  // thumbnail image already revealed
            this.imageDominantColors    = null;   // base64 GIF
            this.imageDominantColor     = null;   // HEX RGB
            this.featured =             false;    // featured element
            this.flickrThumbSizes =     {};       // store URLs for all available thumbnail sizes (flickr)
            this.picasaThumbs =         null;     // store URLs and sizes
            this.hovered =              false;    // is the thumbnail currently hovered?
            this.hoverInitDone =        false;
            this.contentIsLoaded =      false;    // album: are items already loaded?
            this.contentLength =        0;        // album: number of items (real number of items in memory)
            this.numberItems =          0;        // album: number of items (value returned by data source)
            this.imageNumber =          0;        // image number in the album
            this.imageCounter =         0;        // number of images in an album
            this.eltTransform =         [];       // store the CSS transformations
            this.eltFilter =            [];       // store the CSS filters
            this.eltEffect =            [];       // store data about hover effects animations
            this.authkey =              '';       // for Google Photos private (hidden) albums
            this.paginationLastPage =   0;        // for albums
            this.paginationLastWidth =  0;        // for albums
            this.customData =           {};
            this.selected =             false;
            this.imageWidth =           0;        // image natural (real) width
            this.imageHeight =          0;        // image natural (real) height
            this.$elt =                 null;     // pointer to the corresponding DOM element
            this.$Elts =                [];       // cached pointers to the thumbnail content -> to avoid jQuery().find()
            this.tags =                 [];       // list of tags of the current item
            this.albumTagList =         [];       // list of all the tags of the items contained in the current album
            this.albumTagListSel =      [];       // list of currently selected tags (only for albums)
            this.exif= { exposure: '', flash: '', focallength: '', fstop: '', iso: '', model: '', time: '', location: ''};
          }

          // public static
          
          NGY2Item.Get = function( instance, ID ) {
            var l=instance.I.length;
            for( var i=0; i<l; i++ ) {
              if( instance.I[i].GetID() == ID ) {
                return instance.I[i];
              }
            }
            return null;
          };
            
          NGY2Item.GetIdx = function( instance, ID ) {
            var l=instance.I.length;
            for( var i=0; i<l; i++ ) {
              if( instance.I[i].GetID() == ID ) {
                return i;
              }
            }
            return -1;
          };
          
          // create new item (image, album or albumUp)
          NGY2Item.New = function( instance, title, description, ID, albumID, kind, tags ) {
            var album=NGY2Item.Get( instance, albumID );
            
            if( albumID != -1 && albumID != 0 && title !='image gallery by nanogallery2 [build]'  ) {
              if( instance.O.thumbnailLevelUp && album.getContentLength(false) == 0 && instance.O.album == '' ) {
                // add navigation thumbnail (album up)
                var item=new NGY2Item('0');
                instance.I.push(item);
                album.contentLength+=1;
                item.title='UP';
                item.albumID=albumID;
                item.kind='albumUp';
                item.G=instance;

                jQuery.extend( true, item.thumbs.width, instance.tn.defaultSize.width);
                jQuery.extend( true, item.thumbs.height, instance.tn.defaultSize.height);
              }
            }
            
            var item=NGY2Item.Get(instance, ID);
            if( item === null ){
              // create a new item (otherwise, just update the existing one)
              item=new NGY2Item(ID);
              instance.I.push(item);
              if( albumID != -1 && title !='image gallery by nanogallery2 [build]' ) {
                album.contentLength+=1;
              }
            }
            item.G=instance;

            item.albumID=albumID;
            item.kind=kind;
            if( kind == 'image' ) {
              album.imageCounter+=1;
              item.imageNumber=album.imageCounter;
            }

            // check keyword to find features images/albums
            var kw=instance.O.thumbnailFeaturedKeyword;
            if( kw != '' ) {
              // check if item featured based on a keyword in the title or in the description
              kw=kw.toUpperCase();
              var p=title.toUpperCase().indexOf(kw);
              if( p > -1) {
                item.featured=true;
                // remove keyword case unsensitive
                title=title.substring(0, p) + title.substring(p+kw.length, title.length);
              }
              p=description.toUpperCase().indexOf(kw);
              if( p > -1) {
                item.featured=true;
                // remove keyword case unsensitive
                description=description.substring(0, p) + description.substring(p+kw.length, description.length);
              }
            }
            
            // TAGS 
            // if( instance.galleryFilterTags.Get() != false ) {
              // if( instance.galleryFilterTags.Get() == true ) {
                // if( tags != '' && tags != undefined ) {
                  // use set tags
                  // item.setTags(tags.split(' '));
                // }
              // }
              // else {
                // extract tags starting with # (in title)
              if( typeof  instance.galleryFilterTags.Get() == 'string' ) {
                switch( instance.galleryFilterTags.Get().toUpperCase() ) {
                  case 'TITLE':
                    var re = /(?:^|\W)#(\w+)(?!\w)/g, match, matches = [];
                    var tags="";
                    while (match = re.exec(title)) {
                      matches.push(match[1].replace(/^\s*|\s*$/, ''));   //trim trailing/leading whitespace
                    }
                    item.setTags(matches);  //tags;
                    title=title.split('#').join('');   //replaceall
                    break;
                  case 'DESCRIPTION':
                    var re = /(?:^|\W)#(\w+)(?!\w)/g, match, matches = [];
                    var tags="";
                    while (match = re.exec(description)) {
                      matches.push(match[1].replace(/^\s*|\s*$/, ''));   //trim trailing/leading whitespace
                    }
                    item.setTags(matches);  //tags;
                    description=description.split('#').join('');   //replaceall
                    break;
                }
              }
                else {
                  if( tags != '' && tags != undefined ) {
                    // use set tags
                    item.setTags(tags.split(' '));
                  }
                }
              // }
            // }
            
            // set (maybe modified) fields title and description
            item.title=escapeHtml(instance, title);
            item.description=escapeHtml(instance, description);
            return item;
          };
          
          // function to avoid XSS issue - Cross Site Scripting
          // original: https://github.com/janl/mustache.js/blob/master/mustache.js#L55
          var entityMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;' };
          function escapeHtml (instance, string) {
            if( instance.O.allowHTMLinData == true ) {
              return string;
            }
            else {
              return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap (s) {
                return entityMap[s];
              });
            }
          }
          
          
          NGY2Item.get_nextId = function () {
            return nextId;
          };

          //=== public (shared across instances)

          //--- cached sub elements
          NGY2Item.prototype.$getElt = function( elt, forceRefresh ) {
            if( this.$elt == null ) { return null; }
            if( this.$Elts[elt] !== undefined && !forceRefresh == true ) {
              return this.$Elts[elt];
            }
            else {
              if( elt == '.nGY2GThumbnail' ) {
                this.$Elts[elt]=this.$elt;
              }
              else {
                this.$Elts[elt]=this.$elt.find(elt);
              }
              return this.$Elts[elt];
            }
          };

          //--- returns the album containing the item
          NGY2Item.prototype.album = function() {
            return this.G.I[NGY2Item.GetIdx(this.G, this.albumID)];
          };

          //--- set one image (url and size)
          NGY2Item.prototype.imageSet = function( src, w, h ) {
            this.src = src;
            this.width = w;
            this.height = h;
          };
          
          //--- set one thumbnail (url and size) - screenSize and level are optionnal
          NGY2Item.prototype.thumbSet = function( src, w, h, screenSize, level ) {
            var lst=['xs','sm','me','la','xl'];
            if( typeof screenSize === 'undefined' || screenSize == '' || screenSize == null ) {
              for( var i=0; i< lst.length; i++ ) {
                if( typeof level === 'undefined' || level == '' ) {
                  this.thumbs.url.l1[lst[i]]=src;
                  this.thumbs.height.l1[lst[i]]=h;
                  this.thumbs.width.l1[lst[i]]=w;
                  this.thumbs.url.lN[lst[i]]=src;
                  this.thumbs.height.lN[lst[i]]=h;
                  this.thumbs.width.lN[lst[i]]=w;
                }
                else {
                  this.thumbs.url[level][lst[i]]=src;
                  this.thumbs.height[level][lst[i]]=h;
                  this.thumbs.width[level][lst[i]]=w;
                }
              }
            }
            else {
              if( typeof level === 'undefined' || level == '' || level == null ) {
                this.thumbs.url.l1[screenSize]=src;
                this.thumbs.height.l1[screenSize]=h;
                this.thumbs.width.l1[screenSize]=w;
                this.thumbs.url.lN[screenSize]=src;
                this.thumbs.height.lN[screenSize]=h;
                this.thumbs.width.lN[screenSize]=w;
              }
              else {
                this.thumbs.url[level][screenSize]=src;
                this.thumbs.height[level][screenSize]=h;
                this.thumbs.width[level][screenSize]=w;
              }
            }
          
            var lst=['xs','sm','me','la','xl'];
            for( var i=0; i< lst.length; i++ ) {
              this.thumbs.height.l1[lst[i]]=h;
            }
            for( var i=0; i< lst.length; i++ ) {
              if( this.G.tn.settings.height.lN[lst[i]] == this.G.tn.settings.getH() && this.G.tn.settings.width.l1[lst[i]] == this.G.tn.settings.getW() ) {
                this.thumbs.height.lN[lst[i]]=h;
              }
            }
          };

          //--- set thumbnail image real height for current level/resolution, and for all others level/resolutions having the same settings
          NGY2Item.prototype.thumbSetImgHeight = function( h ) {              
            var lst=['xs','sm','me','la','xl'];
            for( var i=0; i< lst.length; i++ ) {
              if( this.G.tn.settings.height.l1[lst[i]] == this.G.tn.settings.getH() && this.G.tn.settings.width.l1[lst[i]] == this.G.tn.settings.getW() ) {
                this.thumbs.height.l1[lst[i]]=h;
              }
            }
            for( var i=0; i< lst.length; i++ ) {
              if( this.G.tn.settings.height.lN[lst[i]] == this.G.tn.settings.getH() && this.G.tn.settings.width.l1[lst[i]] == this.G.tn.settings.getW() ) {
                this.thumbs.height.lN[lst[i]]=h;
              }
            }
          };

          //--- set thumbnail image real width for current level/resolution, and for all others level/resolutions having the same settings
          NGY2Item.prototype.thumbSetImgWidth = function( w ) {              
            var lst=['xs','sm','me','la','xl'];
            for( var i=0; i< lst.length; i++ ) {
              if( this.G.tn.settings.height.l1[lst[i]] == this.G.tn.settings.getH() && this.G.tn.settings.width.l1[lst[i]] == this.G.tn.settings.getW() ) {
                this.thumbs.width.l1[lst[i]]=w;
              }
            }
            for( var i=0; i< lst.length; i++ ) {
              if( this.G.tn.settings.height.lN[lst[i]] == this.G.tn.settings.getH() && this.G.tn.settings.width.l1[lst[i]] == this.G.tn.settings.getW() ) {
                this.thumbs.width.lN[lst[i]]=w;
              }
            }
          };
        
          //--- Returns Thumbnail image (depending of the screen resolution)
          NGY2Item.prototype.thumbImg = function () {   
            var tnImg = { src:'', width:0, height:0 };

            if( this.title == 'image gallery by nanogallery2 [build]' ) {
              tnImg.src = this.G.emptyGif;
              tnImg.url = this.G.emptyGif;
              return tnImg;
            }
            tnImg.src = this.thumbs.url[this.G.GOM.curNavLevel][this.G.GOM.curWidth];
            tnImg.width = this.thumbs.width[this.G.GOM.curNavLevel][this.G.GOM.curWidth];
            tnImg.height = this.thumbs.height[this.G.GOM.curNavLevel][this.G.GOM.curWidth];
            return tnImg;
          };
          
          //--- Set tags to items and add these tags to the album
          NGY2Item.prototype.setTags = function( tags ) {              
          if( tags.length > 0 ) {
              this.tags = tags;
              var lstTags = this.album().albumTagList;
              for( var i = 0; i < tags.length; i++ ) {
                var tfound = false;
                for( var j = 0; j < lstTags.length; j++ ) {
                  if( tags[i].toUpperCase() == lstTags[j].toUpperCase() ) {
                    tfound = true;
                  }
                }
                if( tfound == false) {
                  this.album().albumTagList.push(tags[i])
                  this.album().albumTagListSel.push(tags[i])
                }
              }
            }
          };
          
          //--- check if 1 of current item's tags is selected (tag filter)
          NGY2Item.prototype.checkTagFilter = function() {
            if( this.G.galleryFilterTags.Get() != false && this.album().albumTagList.length > 0 ) {
              if( this.G.O.thumbnailLevelUp && this.kind=='albumUp' ) {
                return true;
              }
              var found = false;
              var lstTags = this.album().albumTagListSel;
              for( var i = 0; i < this.tags.length; i++ ) {
                for( var j = 0; j < lstTags.length; j++ ) {
                  if( this.tags[i].toUpperCase() == lstTags[j].toUpperCase() ) {
                    found = true;
                    break;
                  }
                }
              }
              return found;
            }
            else
              return true;
          };
          
          //--- check if 1 of current item's tags is found using API search
          NGY2Item.prototype.isSearchTagFound = function() {
            if( this.G.GOM.albumSearchTags == '' ) { return true; }
            if( this.G.O.thumbnailLevelUp && this.kind == 'albumUp' ) { return true; }

            //var lstTags=this.album().albumTagListSel;
            for( var i = 0; i < this.tags.length; i++ ) {
              if( this.tags[i].toUpperCase().indexOf( this.G.GOM.albumSearchTags ) >= 0 ) {
                return true;
              }
            }
            return false;
          };
          
          //--- check if current item can be displayed
          NGY2Item.prototype.isToDisplay = function( albumID ) {
            return this.albumID == albumID && this.checkTagFilter() && this.isSearchFound() && this.isSearchTagFound();
          };
          
          
          
          //--- returns the number of items of the current album
          //--- count using tags filter
          NGY2Item.prototype.getContentLength = function( filterTags ) {
            if( filterTags == false || this.albumTagList.length == 0 || this.G.galleryFilterTags.Get() == false ) {
              return this.contentLength;
            }
            else {
              var l = this.G.I.length;
              var cnt = 0;
              var albumID = this.GetID();
              for( var idx = 0; idx < l; idx++ ) {
                var item = this.G.I[idx];
                if( item.isToDisplay(albumID) ) {
                  cnt++;
                }
              }
              return cnt;
            }
          };
          
          NGY2Item.prototype.isSearchFound = function() {
            if( this.G.GOM.albumSearch != '' ) {
              if( this.title.toUpperCase().indexOf( this.G.GOM.albumSearch ) == -1 ) {
                return false;
              }
            }
            return true;
          }
          
          
          //--- for future use...
          NGY2Item.prototype.responsiveURL = function () {
            var url = '';
            switch(this.G.O.kind) {
              case '':
                url = this.src;
                break;
              case 'flickr':
                url = this.src;
                break;
              case 'picasa':
              case 'google':
              case 'google2':
              default:
                url = this.src;
                break;
            }
            return url;
          };
          
          
          //--- Reveal the thumbnail image with animation on opacity
          NGY2Item.prototype.ThumbnailImageReveal = function () {

            if( this.thumbnailImgRevealed == false ) {
              this.thumbnailImgRevealed=true;
              var tweenable = new NGTweenable();
              tweenable.tween({
                from:         { opacity: 0 },
                to:           { opacity: 1 },
                attachment:   { item: this },
                delay:        0,
                duration:     600,
                easing:       'easeOutQuart',
                step:         function (state, att) {
                  if( att.item.$getElt('.nGY2TnImg') != null ) {
                    att.item.$getElt('.nGY2TnImg').css('opacity', state.opacity);
                  }
                }
              });
            }
          };
          
          
          // In case of thumbnails with stacks - apply a percent to a value which include a unit
          function ValueApplyPercent( str, percent ) {
            str=String(str);
            if( str === '0' || percent == 1 ) { return str; }
            var n = Number(str.replace(/[a-zA-Z]/g, ''));
            var ar = str.match(/([^\-0-9\.]+)/g);
            var a = '';
            if( ar != null && ar.length > 0 ) {
              a = ar.join();
            }
             
            if( isNaN(n) || n == 0 ) {
              return str;
            }

            n = n * percent;
            return n + a;
          } 
          
          //--- 2D/3D css transform - apply the cached value to element
          NGY2Item.prototype.CSSTransformApply = function ( eltClass ) {
            var obj=this.eltTransform[eltClass];

            if( eltClass == '.nGY2GThumbnail' ) {
              // thumbnail
              var nbStacks = obj.$elt.length-1;
              var pTranslateX = 1;
              var pTranslateY = 1;
              var pTranslateZ = 1;
              var pTranslate = 1;
              var pRotateX = 1;
              var pRotateY = 1;
              var pRotateZ = 1;
              var pRotate = 1;
              var pScale = 1;
              for( var n = nbStacks; n >= 0; n-- ) {
                // units must be given with
                var v = 'translateX('+ValueApplyPercent(obj.translateX,pTranslateX)+') translateY('+ValueApplyPercent(obj.translateY,pTranslateY)+') translateZ('+ValueApplyPercent(obj.translateZ,pTranslateZ)+') scale('+ValueApplyPercent(obj.scale,pScale)+') translate('+ValueApplyPercent(obj.translate,pTranslate)+')';
                if( !(this.G.IE <= 9) && !this.G.isGingerbread ) {
                  v += ' rotateX('+ValueApplyPercent(obj.rotateX,pRotateX)+') rotateY('+ValueApplyPercent(obj.rotateY,pRotateY)+') rotateZ('+ValueApplyPercent(obj.rotateZ,pRotateZ)+') rotate('+ValueApplyPercent(obj.rotate,pRotate)+')';
                }
                else {
                  v += ' rotate('+ValueApplyPercent(obj.rotateZ,pRotateZ)+')';
                }
                obj.$elt[n].style[this.G.CSStransformName] = v;
                
                if( nbStacks > 0 ) {
                  // apply a percent to the stack elements
                  pTranslateX -= this.G.tn.opt.Get('stacksTranslateX');
                  pTranslateY -= this.G.tn.opt.Get('stacksTranslateY');
                  pTranslateZ -= this.G.tn.opt.Get('stacksTranslateZ');
                  pRotateX -= this.G.tn.opt.Get('stacksRotateX');
                  pRotateY -= this.G.tn.opt.Get('stacksRotateY');
                  pRotateZ -= this.G.tn.opt.Get('stacksRotateZ');
                  pScale -= this.G.tn.opt.Get('stacksScale');
                }
              }
            }
            else {
              // thumbnail sub element
              if( obj.$elt[0] != undefined ) {
                // units must be given with
                var v = 'translateX('+obj.translateX+') translateY('+obj.translateY+') translateZ('+obj.translateY+') scale('+obj.scale+') translate('+obj.translate+')';
                if( !(this.G.IE <= 9) && !this.G.isGingerbread ) {
                  v += ' rotateX('+obj.rotateX+') rotateY('+obj.rotateY+') rotateZ('+obj.rotateZ+') rotate('+obj.rotate+')';
                }
                else {
                  v += ' rotate('+obj.rotateZ+')';
                }
                obj.$elt[0].style[this.G.CSStransformName] = v;
              }
            }
          };

          //--- 2D/3D css transform - set a value in cache
          NGY2Item.prototype.CSSTransformSet = function ( eltClass, transform, value ) {
            if( this.eltTransform[eltClass] == undefined ) {
              this.eltTransform[eltClass]={ translateX: 0, translateY: 0, translateZ: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1, translate: '0px,0px', rotate: 0 };
              this.eltTransform[eltClass].$elt=this.$getElt(eltClass);
            }
            this.eltTransform[eltClass][transform]=value;
          };

          //--- CSS Filters - apply the cached value to element
          NGY2Item.prototype.CSSFilterApply = function ( eltClass ) {
            var obj=this.eltFilter[eltClass];
            var v = 'blur('+obj.blur+') brightness('+obj.brightness+') grayscale('+obj.grayscale+') sepia('+obj.sepia+') contrast('+obj.contrast+') opacity('+obj.opacity+') saturate('+obj.saturate+')';
            if( obj.$elt != null ) {
              for( var n = 0; n < obj.$elt.length; n++ ) {
                if( obj.$elt[n] != undefined ) {
                  obj.$elt[n].style.WebkitFilter = v;
                  obj.$elt[n].style.filter = v;
                }
              }
            }
          };

          //--- CSS Filters - set a value in cache
          NGY2Item.prototype.CSSFilterSet = function ( eltClass, filter, value ) {
            if( this.eltFilter[eltClass] == undefined ) {
              this.eltFilter[eltClass] = { blur:0, brightness:'100%', grayscale:'0%', sepia:'0%', contrast:'100%', opacity:'100%', saturate:'100%' };
              this.eltFilter[eltClass].$elt = this.$getElt(eltClass);
            }
            this.eltFilter[eltClass][filter] = value;
          };

          //--- thumbnail hover animation
          NGY2Item.prototype.animate = function ( effect, delay, hoverIn ) {
            if( this.$getElt() == null  ) { return; }

            var context = {};
            context.G = this.G;
            context.item = this;
            context.effect = effect;
            context.hoverIn = hoverIn;
            context.cssKind = '';
            if( hoverIn ) {
              // HOVER IN
              
              if( this.eltEffect[effect.element] == undefined ) {
                this.eltEffect[effect.element] = [];
              }
              if( this.eltEffect[effect.element][effect.type] == undefined ) {
                this.eltEffect[effect.element][effect.type] = { initialValue: 0, lastValue: 0 };
              }
              if( effect.firstKeyframe ) {
                // store initial and current value -> for use in the back animation
                this.eltEffect[effect.element][effect.type] = { initialValue: effect.from, lastValue: effect.from};
              }
              
              context.animeFrom = effect.from;
              context.animeTo = effect.to;
              context.animeDuration = parseInt(effect.duration);
              context.animeDelay = 30 + parseInt(effect.delay+delay);  // 30ms is a default delay to avoid conflict with other initializations
              context.animeEasing = effect.easing;
            }
            else {
              // HOVER OUT
              if( effect.firstKeyframe ) {
                context.animeFrom = this.eltEffect[effect.element][effect.type].lastValue;
                context.animeTo = this.eltEffect[effect.element][effect.type].initialValue;
                // context.animeTo=effect.from;
              }
              else {
                // context.animeFrom=effect.from;
                context.animeFrom = this.eltEffect[effect.element][effect.type].lastValue;
                context.animeTo = this.eltEffect[effect.element][effect.type].initialValue;
                // context.animeTo=effect.to;
                
              }
              
              context.animeDuration = parseInt(effect.durationBack);
              context.animeDelay = 30 + parseInt(effect.delayBack+delay);   // 30ms is a default delay to avoid conflict with other initializations
              context.animeEasing = effect.easingBack;
            }

            // detect if animation on CSS transform
            var transform=['translateX', 'translateY', 'translateZ', 'scale', 'rotateX', 'rotateY', 'rotateZ'];
            for( var i = 0; i < transform.length; i++ ) {
              if( effect.type == transform[i] ) {
                context.cssKind = 'transform';
                break;
              }
            }

            // detect if animation on CSS filter
            var filter=['blur', 'brightness', 'grayscale', 'sepia', 'contrast', 'opacity', 'saturate'];
            for( var i = 0; i < filter.length; i++ ) {
              if( effect.type == filter[i] ) {
                context.cssKind = 'filter';
                break;
              }
            }
            // handle some special cases
            if( hoverIn && effect.element == '.nGY2GThumbnail' && ( effect.type == 'scale' || effect.type == 'rotateX') ) {
              this.G.GOM.lastZIndex++;
              this.$getElt(effect.element).css('z-index',this.G.GOM.lastZIndex);
              // setElementOnTop(this.G.$E.base, this.$getElt(effect.element) );
            }

            // animation
            var tweenable = new NGTweenable();
            context.tweenable=tweenable;
            tweenable.tween({
              attachment:   context,
              from:         { 'v': context.animeFrom },
              to:           { 'v': context.animeTo },
              duration:     context.animeDuration,    //parseInt(effect.duration),
              delay:        context.animeDelay,       //parseInt(effect.delay),
              easing:       context.animeEasing,      //'easeOutQuart',
              
              step: function (state, att) {
                if( att.item.$getElt() == null ) {
                  // the thumbnail may be destroyed since the start of the animation
                  att.tweenable.stop(false);
                  // att.tweenable.dispose();
                  return;
                }
                if( att.hoverIn && !att.item.hovered ) {
                  // thumbnail no more hovered
                  att.tweenable.stop(false);
                  // att.tweenable.dispose();
                  return;
                }

                if( att.G.VOM.viewerDisplayed ) {
                  att.tweenable.stop(false);
                  // att.tweenable.dispose();
                  return;
                }
                
                // test if in delay phase
                if( state.v == att.animeFrom ) { return; }
                
                switch( att.cssKind ) {
                  case 'transform':
                    att.item.CSSTransformSet(att.effect.element, att.effect.type, state.v);
                    att.item.CSSTransformApply( att.effect.element );
                    break;
                  case 'filter':
                    att.item.CSSFilterSet(att.effect.element, att.effect.type, state.v);
                    att.item.CSSFilterApply( att.effect.element );
                    break;
                  default:
                    var v=state.v;
                    if( state.v.substring(0,3) == 'rgb(' || state.v.substring(0,5) == 'rgba(' ) {
                      // to remove values after the dot (not supported by RGB/RGBA)
                      v=tinycolor(state.v).toRgbString();
                    }
                    att.item.$getElt( att.effect.element ).css( att.effect.type, v );
                    break;
                }
                if( hoverIn ) {
                  // store value for back animation
                  att.item.eltEffect[att.effect.element][att.effect.type].lastValue = state.v;
                }
              },
              
              finish: function (state, att) {
                if( hoverIn ) {
                  // store value for back animation
                  att.item.eltEffect[att.effect.element][att.effect.type].lastValue = state.v;
                }

                if( att.item.$getElt() == null ) {
                  // the thumbnail may be destroyed since the start of the animation
                  return;
                }
                if( att.hoverIn && !att.item.hovered ) {
                  // thumbnail no more hovered
                  return;
                }

                if( att.G.VOM.viewerDisplayed ) {
                  return;
                }

                switch( att.cssKind ) {
                  case 'transform':
                    att.item.CSSTransformSet(att.effect.element, att.effect.type, att.animeTo);
                    att.item.CSSTransformApply(att.effect.element );
                    break;
                  case 'filter':
                    att.item.CSSFilterSet(att.effect.element, att.effect.type, att.animeTo);
                    att.item.CSSFilterApply(att.effect.element );
                    break;
                  default:
                    att.item.$getElt(att.effect.element).css(att.effect.type, att.animeTo);
                    break;
                }
              }
            });
          };
          
          // set z-index to display element on top of all others
          function setElementOnTop( start, elt ) {
            var highest_index = 0;
            if( start=='' ) { start= '*'; }
            jQuery(start).each(function() {
              var cur = parseInt(jQuery(this).css('z-index'));
              highest_index = cur > highest_index ? cur : highest_index;
            });
            highest_index++;
            jQuery(elt).css('z-index',highest_index);
          }
          

          return NGY2Item;
        })();    
          
      }

      _this.options = jQuery.extend(true, {}, jQuery.nanogallery2.defaultOptions, options);
      // Initialization code
      _this.nG2=null;
      _this.nG2= new nanoGALLERY2();
      _this.nG2.initiateGallery2(_this.e, _this.options );

    };
      
    // PUBLIC EXPOSED METHODS
    _this.test = function() {
      //alert('test');
      // console.dir(_this.nG.G.I.length);
      // console.dir(_this.nG);
      //privateTest();
    }

    
    // Run initializer
    _this.init();
  };
 
  jQuery.nanogallery2.defaultOptions = {
    kind :                        '',
    userID :                      '',
    photoset :                    '',
    album:                        '',
    blackList :                   'scrapbook|profil',
    whiteList :                   '',
    albumList :                   '',
    albumList2 :                  null,
    RTL :                         false,
    poogleplusUseUrlCrossDomain : true,
    flickrSkipOriginal :          true,
    breadcrumbAutoHideTopLevel :  true,
    displayBreadcrumb :           true,
    breadcrumbOnlyCurrentLevel :  true,
    breadcrumbHideIcons :         true,
    theme :                       'nGY2',
    colorScheme :                 'dark',
    colorSchemeViewer :           'dark',
    items :                       null,
    itemsBaseURL :                '',
    thumbnailSelectable :         false,
    dataProvider:                 '',
    dataCharset:                  'Latin',
    allowHTMLinData:              false,
    locationHash :                true,
    slideshowDelay :              3000,
    slideshowAutoStart :          false,

    debugMode: false,

    galleryDisplayMoreStep :      2,
    galleryDisplayMode :          'fullContent',
    galleryL1DisplayMode :        null,
    galleryPaginationMode :       'rectangles',   // 'dots', 'rectangles', 'numbers'
    galleryThumbnailsDisplayDelay :     2000,
    galleryMaxRows :              2,
    galleryL1MaxRows :            null,
    galleryLastRowFull:           false,
    galleryLayoutEngine :         'default',
    paginationSwipe:              true,
    paginationVisiblePages :      10,
    paginationSwipeSensibilityVert : 10,
    galleryFilterTags :           false,    // possible values: false, true, 'title', 'description'
    galleryL1FilterTags :         null,     // possible values: false, true, 'title', 'description'
    galleryMaxItems :             0,        // maximum number of items per album  --> only flickr, google+, nano_photos_provider2
    galleryL1MaxItems :           null,     // maximum number of items per gallery page --> only flickr, google+, nano_photos_provider2
    gallerySorting :              '',
    galleryL1Sorting :            null,
    galleryDisplayTransition :    'none',
    galleryL1DisplayTransition :  null,
    galleryDisplayTransitionDuration :    1000,
    galleryL1DisplayTransitionDuration :  null,
    galleryResizeAnimation :      true,
    galleryRenderDelay :          60,

    thumbnailCrop :               true,
    thumbnailL1Crop :             null,
    thumbnailCropScaleFactor :    1.5,
    thumbnailLevelUp :            false,
    thumbnailAlignment :          'center',
    thumbnailWidth :              300,
    thumbnailL1Width :            null,
    thumbnailHeight :             200,
    thumbnailL1Height :           null,
    thumbnailGutterWidth :        2,
    thumbnailL1GutterWidth :      null,
    thumbnailGutterHeight :       2,
    thumbnailL1GutterHeight :     null,
    thumbnailBorderVertical :     2,
    thumbnailBorderHorizontal :   2,
    thumbnailFeaturedKeyword :    '*featured',
    thumbnailAlbumDisplayImage :  false,
    thumbnailHoverEffect2 :       'toolsAppear',
    thumbnailBuildInit2 :         '',
    thumbnailStacks :             0,
    thumbnailL1Stacks :           null,
    thumbnailStacksTranslateX :   0,
    thumbnailL1StacksTranslateX : null,
    thumbnailStacksTranslateY :   0,
    thumbnailL1StacksTranslateY : null,
    thumbnailStacksTranslateZ :   0,
    thumbnailL1StacksTranslateZ : null,
    thumbnailStacksRotateX :      0,
    thumbnailL1StacksRotateX :    null,
    thumbnailStacksRotateY :      0,
    thumbnailL1StacksRotateY :    null,
    thumbnailStacksRotateZ :      0,
    thumbnailL1StacksRotateZ :    null,
    thumbnailStacksScale :        0,
    thumbnailL1StacksScale :      null,
    thumbnailDisplayOutsideScreen: false,
    thumbnailWaitImageLoaded:     true,
    galleryBuildInit2 :           '',
    portable :                    false,
    
    touchAnimation :              true,
    touchAutoOpenDelay :          0,

    thumbnailLabel : {
      position :                  'overImageOnBottom',
      align:                      'center',
      display :                   true,
      displayDescription :        false,
      titleMaxLength :            0,
      titleMultiLine :            false,
      descriptionMaxLength :      0,
      descriptionMultiLine :      false,
      hideIcons :                 true,
      title :                     ''
    },

    thumbnailToolbarImage :       { topLeft: 'select', topRight : 'featured' },
    thumbnailToolbarAlbum :       { topLeft: 'select', topRight : 'counter' },
    thumbnailDisplayInterval :    15,
    thumbnailL1DisplayInterval :  null,
    thumbnailDisplayTransition :  'fadeIn',
    thumbnailL1DisplayTransition : null,
    thumbnailDisplayTransitionDuration:   240,
    thumbnailL1DisplayTransitionDuration: null,
    thumbnailOpenImage :          true,
    thumbnailOpenOriginal :       false,
    thumbnailGlobalImageTitle :   '',
    thumbnailGlobalAlbumTitle :   '',
    
    viewer :                      'internal',
    viewerFullscreen:             false,
    viewerDisplayLogo :           false,
    imageTransition :             'swipe',
    viewerZoom :                  true,
    viewerImageDisplay :          '',
    openOnStart :                 '',
    viewerHideToolsDelay :        3000,
    viewerToolbar : {
      display :                   true,
      position :                  'bottomOverImage',
      fullWidth :                 true,
      align :                     'center',
      autoMinimize :              0,
      standard :                  'minimizeButton,label',
      minimized :                 'minimizeButton,label,infoButton,shareButton,downloadButton,linkOriginalButton,fullscreenButton'
    },
    viewerTools : {
      topLeft :                   'pageCounter,playPauseButton',
      topRight :                  'zoomButton,closeButton' 
    },
    
    breakpointSizeSM :            480,
    breakpointSizeME :            992,
    breakpointSizeLA :            1200,
    breakpointSizeXL :            1800,
    
    fnThumbnailInit :             null,
    fnThumbnailHoverInit :        null,
    fnThumbnailHover :            null,
    fnThumbnailHoverOut :         null,
    fnThumbnailDisplayEffect :    null,
    fnViewerInfo :                null,
    fnImgToolbarCustInit :        null,
    fnImgToolbarCustDisplay :     null,
    fnImgToolbarCustClick :       null,
    fnProcessData :               null,
    fnThumbnailSelection :        null,
    fnGalleryRenderStart :        null,
    fnGalleryRenderEnd :          null,
    fnGalleryObjectModelBuilt :   null,
    fnGalleryLayoutApplied :      null,
    fnThumbnailClicked :          null,
    fnShoppingCartUpdated :       null,
    fnThumbnailToolCustAction :   null,
    fnThumbnailOpen :             null,
    fnImgDisplayed :              null,

    i18n : {
      'breadcrumbHome' : 'Galleries', 'breadcrumbHome_FR' : 'Galeries',
      'thumbnailImageTitle' : '', 'thumbnailAlbumTitle' : '',
      'thumbnailImageDescription' : '', 'thumbnailAlbumDescription' : '',
      'infoBoxPhoto' : 'Photo', 'infoBoxDate' : 'Date', 'infoBoxAlbum' : 'Album', 'infoBoxDimensions' : 'Dimensions', 'infoBoxFilename' : 'Filename', 'infoBoxFileSize' : 'File size', 'infoBoxCamera' : 'Camera', 'infoBoxFocalLength' : 'Focal length', 'infoBoxExposure' : 'Exposure', 'infoBoxFNumber' : 'F Number', 'infoBoxISO' : 'ISO', 'infoBoxMake' : 'Make', 'infoBoxFlash' : 'Flash', 'infoBoxViews' : 'Views', 'infoBoxComments' : 'Comments'
    },
    icons : {
      // sample for font awesome: <i style="color:#eee;" class="fa fa-search-plus"></i>
      thumbnailAlbum:               '<i class="nGY2Icon icon-folder-empty"></i>',
      thumbnailImage:               '<i class="nGY2Icon icon-picture"></i>',
      breadcrumbAlbum:              '<i class="nGY2Icon icon-folder-empty"></i>',
      breadcrumbHome:               '<i class="nGY2Icon icon-home"></i>',
      breadcrumbSeparator:          '<i class="nGY2Icon icon-left-open"></i>',
      breadcrumbSeparatorRtl:       '<i class="nGY2Icon icon-right-open"></i>',
      navigationFilterSelected:     '<i style="color:#fff;" class="nGY2Icon icon-toggle-on"></i>',
      navigationFilterUnselected:   '<i style="color:#ddd;" class="nGY2Icon icon-toggle-off"></i>',
      navigationFilterSelectedAll:  '<i class="nGY2Icon icon-toggle-on"></i><i class="nGY2Icon icon-ok"></i>',
      thumbnailSelected:            '<i style="color:#bff;" class="nGY2Icon icon-ok-circled"></i>',
      thumbnailUnselected:          '<i style="color:#bff;" class="nGY2Icon icon-circle-empty"></i>',
      thumbnailFeatured:            '<i style="color:#dd5;" class="nGY2Icon icon-star"></i>',
      thumbnailCounter:             '<i class="nGY2Icon icon-picture"></i>',
      thumbnailShare:               '<i class="nGY2Icon icon-ngy2_share2"></i>',
      thumbnailDownload:            '<i class="nGY2Icon icon-ngy2_download2"></i>',
      thumbnailInfo:                '<i class="nGY2Icon icon-ngy2_info2"></i>',
      thumbnailCart:                '<i class="nGY2Icon icon-basket"></i>',
      thumbnailDisplay:             '<i class="nGY2Icon icon-ngy2_zoom_in2"></i>',
      thumbnailCustomTool1:         'T1',
      thumbnailCustomTool2:         'T2',
      thumbnailCustomTool3:         'T3',
      thumbnailCustomTool4:         'T4',
      thumbnailCustomTool5:         'T5',
      thumbnailCustomTool6:         'T6',
      thumbnailCustomTool7:         'T7',
      thumbnailCustomTool8:         'T8',
      thumbnailCustomTool9:         'T9',
      thumbnailCustomTool10:        'T10',
      thumbnailAlbumUp:             '<i style="font-size: 3em;" class="nGY2Icon icon-ngy2_chevron_up2"></i>',
      paginationNext:               '<i class="nGY2Icon icon-right-open"></i>',
      paginationPrevious:           '<i class="nGY2Icon icon-left-open"></i>',
      galleryMoreButton:            '<i class="nGY2Icon icon-picture"></i> &nbsp; <i class="nGY2Icon icon-right-open"></i>',
      buttonClose:                  '<i class="nGY2Icon icon-ngy2_close2"></i>',
      viewerPrevious:               '<i class="nGY2Icon icon-ngy2_chevron-left"></i>',
      viewerNext:                   '<i class="nGY2Icon icon-ngy2_chevron-right"></i>',
      viewerImgPrevious:            '<i class="nGY2Icon icon-ngy2_chevron_left3"></i>',
      viewerImgNext:                '<i class="nGY2Icon icon-ngy2_chevron_right3"></i>',
      viewerDownload:               '<i class="nGY2Icon icon-ngy2_download2"></i>',
      viewerToolbarMin:             '<i class="nGY2Icon icon-ellipsis-vert"></i>',
      viewerToolbarStd:             '<i class="nGY2Icon icon-menu"></i>',
      viewerPlay:                   '<i class="nGY2Icon icon-play"></i>',
      viewerPause:                  '<i class="nGY2Icon icon-pause"></i>',
      viewerFullscreenOn:           '<i class="nGY2Icon icon-resize-full"></i>',
      viewerFullscreenOff:          '<i class="nGY2Icon icon-resize-small"></i>',
      viewerZoomIn:                 '<i class="nGY2Icon icon-ngy2_zoom_in2"></i>',
      viewerZoomOut:                '<i class="nGY2Icon icon-ngy2_zoom_out2"></i>',
      viewerLinkOriginal:           '<i class="nGY2Icon icon-ngy2_external2"></i>',
      viewerInfo:                   '<i class="nGY2Icon icon-ngy2_info2"></i>',
      viewerShare:                  '<i class="nGY2Icon icon-ngy2_share2"></i>',
      user:                         '<i class="nGY2Icon icon-user"></i>',
      location:                     '<i class="nGY2Icon icon-location"></i>',
      config:                       '<i class="nGY2Icon icon-wrench"></i>',
      shareFacebook:                '<i style="color:#3b5998;" class="nGY2Icon icon-facebook-squared"></i>',
      shareTwitter:                 '<i style="color:#00aced;" class="nGY2Icon icon-twitter-squared"></i>',
      shareGooglePlus:              '<i style="color:#dd4b39;" class="nGY2Icon icon-gplus-squared"></i>',
      shareTumblr:                  '<i style="color:#32506d;" class="nGY2Icon icon-tumblr-squared"></i>',
      sharePinterest:               '<i style="color:#cb2027;" class="nGY2Icon icon-pinterest-squared"></i>',
      shareVK:                      '<i style="color:#3b5998;" class="nGY2Icon icon-vkontakte"></i>',
      shareMail:                    '<i style="color:#555;" class="nGY2Icon icon-mail-alt"></i>',
      viewerCustomTool1:            'T1',
      viewerCustomTool2:            'T2',
      viewerCustomTool3:            'T3',
      viewerCustomTool4:            'T4',
      viewerCustomTool5:            'T5',
      viewerCustomTool6:            'T6',
      viewerCustomTool7:            'T7',
      viewerCustomTool8:            'T8',
      viewerCustomTool9:            'T9',
      viewerCustomTool10:           'T10'
    }
  };

  jQuery.fn.nanogallery2 = function (args, option, value) {
    
    if( typeof jQuery(this).data('nanogallery2data') === 'undefined'){
      if( args == 'destroy' ) {
        // command to destroy but no instance yet --> exit
        return;
      }
      
      return this.each( function(){
        (new jQuery.nanogallery2(this, args));
      });
    }
    else {
      // no options -->
      // This function breaks the chain, but provides some API methods

      var nG2=$(this).data('nanogallery2data').nG2;
      switch(args){
        case 'displayItem':
          nG2.DisplayItem(option);
          break;
        case 'search':
          return( nG2.Search(option));
          break;
        case 'search2':
          return nG2.Search2(option, value);
          break;
        case 'search2Execute':
          return nG2.Search2Execute();
          break;
        case 'refresh':
          nG2.Refresh();
          break;
        case 'instance':
          return nG2;
          break;
        case 'data':
          nG2.data= {
            items: nG2.I,
            gallery: nG2.GOM,
            lightbox: nG2.VOM
          };
          return nG2.data;
          break;
        case 'reload':
          nG2.ReloadAlbum();
          return $(this);
          break;
        case 'itemsSelectedGet':
          return nG2.ItemsSelectedGet();
          break;
        case 'itemsSetSelectedValue':
          nG2.ItemsSetSelectedValue(option, value);
          break;
        case 'option':
          if(typeof value === 'undefined'){
            return nG2.Get(option);
          }else{
            nG2.Set(option,value);
            if( option == 'demoViewportWidth' ) {
              // force resize event -> for demo purposes
              $(window).trigger('resize');
            }
          }
          break;
        case 'destroy':
          nG2.Destroy();
          $(this).removeData('nanogallery2data');
          break;
        case 'shoppingCartGet':
          return nG2.shoppingCart;
          break;
        case 'shoppingCartUpdate':
          if( typeof value === 'undefined' || typeof option === 'undefined' ){
            return false;
          }
          var ID=option;
          var cnt=value;
          for( var i=0; i<nG2.shoppingCart.length; i++) {
            if( nG2.shoppingCart[i].ID=ID ) {
              nG2.shoppingCart[i].cnt=cnt;
            }
          }
          if( G.O.fnShoppingCartUpdated !== null ) {
            if( typeof G.O.fnShoppingCartUpdated == 'function' ) {
              G.O.fnShoppingCartUpdated(nG2.shoppingCart);
            }
            else {
              // defined in markup
              window[G.O.fnShoppingCartUpdated](nG2.shoppingCart);
            }
          }
          return nG2.shoppingCart;
          break;
        case 'shoppingCartRemove':
          if( typeof option === 'undefined' ){
            return false;
          }
          var ID=option;
          for( var i=0; i<nG2.shoppingCart.length; i++) {
            if( nG2.shoppingCart[i].ID=ID ) {
              nG2.shoppingCart.splice(i,1);
              break;
            }
          }
          if( G.O.fnShoppingCartUpdated !== null ) {
            if( typeof G.O.fnShoppingCartUpdated == 'function' ) {
              G.O.fnShoppingCartUpdated(nG2.shoppingCart);
            }
            else {
              // defined in markup
              window[G.O.fnShoppingCartUpdated](nG2.shoppingCart);
            }
          }
          return nG2.shoppingCart;
          break;
      }
      return $(this);

    }
  };
  

  // ###############################
  // ##### nanogallery2 script #####
  // ###############################

  /** @function nanoGALLERY2 */
  function nanoGALLERY2() {
    "use strict";

    /**
    * Force reload the current album, if provided by Json
    */
    this.ReloadAlbum = function(){
      if( G.O.kind === '' ) {
        throw 'Not supported for this content source:' + G.O.kind;
      }

      var albumIdx=G.GOM.albumIdx;
      if( albumIdx == -1 ) {
        throw ('Current album not found.');
      }
      
      var albumID = G.I[albumIdx].GetID();

      // unselect everything & remove link to album (=logical delete)
      var l = G.I.length;
      for( var i = 0; i < l ; i++ ) {
        var item = G.I[i];
        if( item.albumID == albumID ) {
          item.selected = false;
        }
      }
      
      G.I[albumIdx].contentIsLoaded = false;
      
      DisplayAlbum('-1', albumID);
    };
    
    /**
     * Set one or several items selected/unselected
     * @param {array} items
     */
    this.ItemsSetSelectedValue = function(items, value){
      var l = items.length;
      for( var j = 0; j < l ; j++) {
        ThumbnailSelectionSet(items[j], value);
      }
    };
    
    /**
     * Returns an array of selected items
     * @returns {Array}
     */
    this.ItemsSelectedGet = function(){
      var selectedItems = [];
      var l = G.I.length;
      for( var i = 0; i < l ; i++ ) {
        if( G.I[i].selected == true ) {
          selectedItems.push(G.I[i]);
        }
      }
      return selectedItems;
    };    
    
    /**
     * Returns the value of an option
     * @param {string} option
     * @returns {nanoGALLERY.G.O}
     */
    this.Get = function(option){
        return G.O[option];
    };

    /**
     * Set a new value for a defined option
     * @param {string} option
     */
    this.Set = function(option, value){
        G.O[option] = value;
        switch( option ) {
          case 'thumbnailSelectable':
            ThumbnailSelectionClear();
            // refresh the displayed gallery
            GalleryRender( G.GOM.albumIdx );
            break;
        }
    };
    
    /**
     * refresh the current gallery
     */
    this.Refresh = function() {
      // refresh the displayed gallery
      GalleryRender( G.GOM.albumIdx );
    };

    /**
     * display one item (image or gallery)
     *   itemID syntax:
     *    - albumID --> display one album
     *    - albumID/imageID --> display one image
    */
    this.DisplayItem = function( itemID ) {
      var IDs=parseIDs( itemID );
      if( IDs.imageID != '0' ) {
        DisplayPhoto( IDs.imageID, IDs.albumID );
      }
      else {
        DisplayAlbum( '-1', IDs.albumID );
      }
    };
    
      
      
    var CountItemsToDisplay = function( gIdx ) {
      if( G.I[gIdx] == undefined ) { return 0; }
      var albumID = G.I[gIdx].GetID();
      var l = G.I.length;
      var cnt = 0;
      for( var idx = 0; idx < l; idx++ ) {
        var item = G.I[idx];
        if( item.isToDisplay(albumID) ) {
          cnt++;
        }
      }
      return cnt;
    } 
    /**
     * Search in the displayed gallery (in thumbnails title)
     */
    this.Search = function( search ) {
      G.GOM.albumSearch = search.toUpperCase();
      var gIdx = G.GOM.albumIdx;
      GalleryRender( G.GOM.albumIdx );
      return CountItemsToDisplay( gIdx );
    };

    /**
     * Search2 in title and tags - set search values
     */
    this.Search2 = function( searchTitle, searchTags ) {
      if( searchTitle != null && searchTitle != undefined ) {
        G.GOM.albumSearch=searchTitle.toUpperCase();
      }
      else {
        G.GOM.albumSearch='';
      }
      
      if( searchTags != null && searchTags != undefined ) {
        G.GOM.albumSearchTags=searchTags.toUpperCase();
      }
      else {
        G.GOM.albumSearchTags = '';
      }
      return CountItemsToDisplay(G.GOM.albumIdx);
    };
    /**
     * Search2 - execute the search on title and tags
     */
    this.Search2Execute = function() {
      var gIdx=G.GOM.albumIdx;
      GalleryRender( G.GOM.albumIdx );
      return CountItemsToDisplay(gIdx);
    };
    
    
    /**
     * Destroy the current gallery
     */
    this.Destroy = function(){
      // alert('destroy');
      // var event = new Event('build');
      if( G.GOM.hammertime != null ) {
        G.GOM.hammertime.destroy();
        G.GOM.hammertime = null;
      }
      // G.GOM.userEvents.RemoveEvtListener();
      // G.GOM.userEvents=null;
      // G.VOM.userEvents.RemoveEvtListener();
      // G.VOM.userEvents=null;
      if( G.VOM.hammertime != null ) {
        G.VOM.hammertime.destroy();
        G.VOM.hammertime = null;
      }
      //ThumbnailHoverReInitAll();  
      
      // color scheme
      $('#ngycs_' + G.baseEltID).remove()
      
      G.GOM.items = [];
      G.GOM.navigationBar.$newContent = null;
      G.$E.base.empty();
      G.$E.base.removeData();

      jQuery(window).off('resize.nanogallery2.'+G.baseEltID);
      jQuery(window).off('scroll.nanogallery2.'+G.baseEltID);
      G.GOM.firstDisplay=false;
    };
    
    
    
    // throttle()
    // author: underscore.js - http://underscorejs.org/docs/underscore.html
    // Returns a function, that, when invoked, will only be triggered at most once during a given window of time.
    // Normally, the throttled function will run as much as it can, without ever going more than once per wait duration;
    // but if you�d like to disable the execution on the leading edge, pass {leading: false}.
    // To disable execution on the trailing edge, ditto.
    var throttle = function(func, wait, options) {
      var context, args, result;
      var timeout = null;
      var previous = 0;
      if (!options) options = {};
      var later = function() {
        previous = options.leading === false ? 0 : new Date().getTime();
        timeout = null;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      };
      return function() {
        var now = new Date().getTime();
        if (!previous && options.leading === false) previous = now;
        var remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0 || remaining > wait) {
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
          previous = now;
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        } else if (!timeout && options.trailing !== false) {
          timeout = setTimeout(later, remaining);
        }
        return result;
      };
    };
    
    
    // DEBOUNCE
    // author: John Hann - http://unscriptable.com/2009/03/20/debouncing-javascript-methods/
    // execAsap - false means executing at the end of the detection period
    var debounce = function (func, threshold, execAsap) {
      var timeout;
      return function debounced () {
          var obj = this, args = arguments;
          function delayed () {
              if (!execAsap)
                  func.apply(obj, args);
              timeout = null; 
          };
   
          if (timeout)
              clearTimeout(timeout);
          else if (execAsap)
              func.apply(obj, args);
          timeout = setTimeout(delayed, threshold || 100); 
      };
    }

    
    /*
    ** Global data for this nanogallery2 instance
    **/
    var G=this;
    G.I =                       [];           // gallery items
    G.Id =                      [];           // gallery items
    G.O =                       null;         // user options
    G.baseEltID =               null;         // ID of the base element
    G.$E = { 
      base:                     null,         // base element
      conTnParent:              null,         // $g_containerThumbnailsParent
      conLoadingB:              null,         // loading bar - nanoGalleryLBarOff
      conConsole:               null,         // console for error messages
      conNavigationBar:         null,         // gallery navigation bar
      conTnBottom:              null         // container on the bottom of the gallery
    };
    G.shoppingCart =            [];
    G.layout = {                              // Layout informations
      internal :                true,
      engine :                  '',
      support :                 { rows: false },
      prerequisite :            { imageSize: false },
      SetEngine: function() {
        if( G.layout.internal ) {
          if( G.tn.settings.getW() == 'auto' || G.tn.settings.getW() == '' ) {
            G.layout.engine='JUSTIFIED';
            G.layout.support.rows=true;
            G.layout.prerequisite.imageSize=true;
            return;
          }
          if( G.tn.settings.getH() == 'auto' || G.tn.settings.getH() == '' ) {
            G.layout.engine='CASCADING';
            G.layout.support.rows=false;
            G.layout.prerequisite.imageSize=true;
            return;
          }
          
          G.layout.engine='GRID';
          G.layout.support.rows=true;
          if( G.tn.opt.Get('crop') === true ) {
            G.layout.prerequisite.imageSize=true;
          }
          else {
            G.layout.prerequisite.imageSize=false;
          }
        }
      }
    };
    G.galleryResizeEventEnabled = false;
    G.galleryMaxRows = { l1: 0, lN: 0,
      Get: function() {
        return G.galleryMaxRows[G.GOM.curNavLevel];
      }
    };
    G.galleryMaxItems = { l1: 0, lN: 0,
      Get: function() {
        return G.galleryMaxItems[G.GOM.curNavLevel];
      }
    };
    G.galleryFilterTags = { l1: 0, lN: 0,
      Get: function() {
        return G.galleryFilterTags[G.GOM.curNavLevel];
      }
    };
    G.galleryDisplayMode = { l1: 'FULLCONTENT', lN: 'FULLCONTENT',
      Get: function() {
        return G.galleryDisplayMode[G.GOM.curNavLevel];
      }
    };
    G.galleryLastRowFull = { l1: false, lN: false,
      Get: function() {
        return G.galleryLastRowFull[G.GOM.curNavLevel];
      }
    };
    G.gallerySorting = { l1: '', lN: '',
      Get: function() {
        return G.gallerySorting[G.GOM.curNavLevel];
      }
    };
    G.galleryDisplayTransition = { l1: 'none', lN: 'none',
      Get: function() {
        return G.galleryDisplayTransition[G.GOM.curNavLevel];
      }
    };
    G.galleryDisplayTransitionDuration = { l1: 500, lN: 500,
      Get: function() {
        return G.galleryDisplayTransitionDuration[G.GOM.curNavLevel];
      }
    };
    G.$currentTouchedThumbnail = null;    
    
    // ##### GENERAL THUMBNAILS PROPERTIES -->
    G.tn = {
      // levell specific options
      opt:  {
        l1: { crop: true, stacks: 0, stacksTranslateX: 0, stacksTranslateY: 0, stacksTranslateZ: 0, stacksRotateX: 0, stacksRotateY: 0, stacksRotateZ: 0, stacksScale: 0, gutterHeight: 0, gutterWidth: 0, displayTransition: 'FADEIN', displayTransitionStartVal: 0, displayTransitionEasing: 'easeOutQuart', displayTransitionDuration: 240, displayInterval: 15 },
        lN: { crop: true, stacks: 0, stacksTranslateX: 0, stacksTranslateY: 0, stacksTranslateZ: 0, stacksRotateX: 0, stacksRotateY: 0, stacksRotateZ: 0, stacksScale: 0, gutterHeight: 0, gutterWidth: 0, displayTransition: 'FADEIN', displayTransitionStartVal: 0, displayTransitionEasing: 'easeOutQuart', displayTransitionDuration: 240, displayInterval: 15 },
        Get: function(opt) {
          return G.tn.opt[G.GOM.curNavLevel][opt];
        }
      },
      scale:                          1,         // image scale depending of the hover effect
      borderWidth:                    0,         // thumbnail container border width
      borderHeight:                   0,         // thumbnail container border height
      labelHeight: {                  // in case label on bottom, otherwise always=0
        l1: 0, lN: 0,
        get: function() {
          return G.tn.labelHeight[G.GOM.curNavLevel];
        }
      },
      defaultSize: {                  // default thumbnail size
                                      // annotation height is not included
        width: {  l1 : { xs:0, sm:0, me:0, la:0, xl:0 }, lN : { xs:0, sm:0, me:0, la:0, xl:0 } },
        height: { l1 : { xs:0, sm:0, me:0, la:0, xl:0 }, lN : { xs:0, sm:0, me:0, la:0, xl:0 } },
        getWidth: function() {
          return G.tn.defaultSize.width[G.GOM.curNavLevel][G.GOM.curWidth];
        },
        getOuterWidth: function() {     // width border included
          return G.tn.defaultSize.width[G.GOM.curNavLevel][G.GOM.curWidth]+G.tn.borderWidth*2;
        },
        getHeight: function() {
          return G.tn.defaultSize.height[G.GOM.curNavLevel][G.GOM.curWidth];
        },
        getOuterHeight: function() {     // height, border included
          return G.tn.defaultSize.height[G.GOM.curNavLevel][G.GOM.curWidth]+G.tn.borderHeight*2;
        }
      },
      settings: {                     // user defined width/height of the image to display depending on the screen size
        width: {  l1 : { xs:0, sm:0, me:0, la:0, xl:0, xsc:'u', smc:'u', mec:'u', lac:'u', xlc:'u' },
                  lN : { xs:0, sm:0, me:0, la:0, xl:0, xsc:'u', smc:'u', mec:'u', lac:'u', xlc:'u' } },
        height: { l1 : { xs:0, sm:0, me:0, la:0, xl:0, xsc:'u', smc:'u', mec:'u', lac:'u', xlc:'u' }, 
                  lN : { xs:0, sm:0, me:0, la:0, xl:0, xsc:'u', smc:'u', mec:'u', lac:'u', xlc:'u' } },
        getH: function() {
          return G.tn.settings.height[G.GOM.curNavLevel][G.GOM.curWidth];
        },
        getW: function() {
          return G.tn.settings.width[G.GOM.curNavLevel][G.GOM.curWidth];
        }
      },
      // thumbnail hover effects
      hoverEffects : {
        std :   [],
        level1: [],
        get: function() {
          if( G.GOM.curNavLevel == 'l1' && G.tn.hoverEffects.level1.length !== 0 ) {
            return G.tn.hoverEffects.level1;
          }
          else {
            return G.tn.hoverEffects.std;
          }
        }
      },
      // thumbnail init
      buildInit : {
        std :   [],
        level1: [],
        get: function() {
          if( G.GOM.curNavLevel == 'l1' && G.tn.buildInit.level1.length !== 0 ) {
            return G.tn.buildInit.level1;
          }
          else {
            return G.tn.buildInit.std;
          }
        }
      },
      // thumbnail toolbars
      toolbar: {
        album :   { topLeft : '', topRight: '', bottomLeft: '', bottomRight: '' },
        image :   { topLeft : '', topRight: '', bottomLeft: '', bottomRight: '' },
        albumUp : { topLeft : '', topRight: '', bottomLeft: '', bottomRight: '' },
        get: function( item ) {
          return G.tn.toolbar[item.kind];
        },
      },
      style: {
        // inline CSS
        l1 : { annotation: '', label: '', title: '', desc: '' },
        lN : { annotation: '', label: '', title: '', desc: '' },
        getTitle : function() {
          return ('style="' + G.tn.style[G.GOM.curNavLevel].title + '"');
        },
        getDesc : function() {
          return ('style="' + G.tn.style[G.GOM.curNavLevel].desc + '"');
        },
        getAnnotation: function() {
          var s='style="' + G.tn.style[G.GOM.curNavLevel].annotation;
          s+= (G.O.RTL ? '"direction:RTL;"' :'');
          s+='"';
          return s;
        },
        getLabel: function() {
          var s='style="'+ G.tn.style[G.GOM.curNavLevel].label + '"';
          return s;
        }
      }
    };
    G.scrollTimeOut =             0;
    G.i18nTranslations =          {'paginationPrevious':'Previous', 'paginationNext':'Next', 'breadcrumbHome':'List of Albums', 'thumbnailImageTitle':'', 'thumbnailAlbumTitle':'', 'thumbnailImageDescription':'', 'thumbnailAlbumDescription':'' };
    G.emptyGif =                  'data:image/gif;base64,R0lGODlhEAAQAIAAAP///////yH5BAEKAAEALAAAAAAQABAAAAIOjI+py+0Po5y02ouzPgUAOw==';
    G.CSStransformName =          FirstSupportedPropertyName(["transform", "msTransform", "MozTransform", "WebkitTransform", "OTransform"]);
    // G.CSSfilterName =          FirstSupportedPropertyName(["filter", "WebkitFilter"]);
    G.CSStransformStyle =         FirstSupportedPropertyName(["transformStyle", "msTransformStyle", "MozTransformStyle", "WebkitTransformStyle", "OTransformStyle"]);
    G.CSSperspective =            FirstSupportedPropertyName(["perspective", "msPerspective", "MozPerspective", "WebkitPerspective", "OPerspective"]);
    G.CSSbackfaceVisibilityName = FirstSupportedPropertyName(["backfaceVisibility", "msBackfaceVisibility", "MozBackfaceVisibility", "WebkitBackfaceVisibility", "OBackfaceVisibility"]);
    G.CSStransitionName =         FirstSupportedPropertyName(["transition", "msTransition", "MozTransition", "WebkitTransition", "OTransition"]);
    G.CSSanimationName =          FirstSupportedPropertyName(["animation", "msAnimation", "MozAnimation", "WebkitAnimation", "OAnimation"]);
    G.GalleryResizeThrottled =    throttle(GalleryResize, 100, {leading: false});
    
    G.blackList =                 null;     // album white list
    G.whiteList =                 null;     // album black list
    G.albumList =                 [];       // album list
    G.albumListHidden =           [];       // for Google Photos -> hidden albums with private key
    G.locationHashLastUsed =      '';
    G.custGlobals =               {};
    G.touchAutoOpenDelayTimerID = 0;
    G.i18nLang =                  '';
    G.timeLastTouchStart =        0;
    G.custGlobals =               {};
    G.markupOrApiProcessed =      false;
    
    //------------------------
    //--- Gallery Object Model
    G.GOM = {
      albumIdx :                  -1, // index (in G.I) of the currently displayed album
      clipArea :                  { top: 0, height: 0 }, // area of the GOM to display on screen
      displayArea :               { width: 0 , height: 0 }, // size of the GOM area (=used area, not available area)
      displayAreaLast :           { width: 0 , height: 0 }, // previous size of the GOM area
      displayedMoreSteps :        0, // current number of displayed steps (moreButton mode)
      items:                      [], // current items of the GOMS
      $imgPreloader:              [],
      itemsDisplayed :            0, // number of currently displayed thumbnails
      firstDisplay :              true,
      navigationBar :             // content of the navigation bar (for breadcrumb and filter tags)
        { displayed:              false,
        $newContent:              '' },
      cache :                     // cached data
        { viewport:               null,
        containerOffset:          null,
        areaWidth:                100         // available area width
        },
      nbSelected :                0, // number of selected items
      pagination :                { currentPage: 0 }, // pagination data
      lastFullRow :               -1, // number of the last row without holes
      lastDisplayedIdx:           -1, // used to display the counter of not displayed items
      displayInterval :           { from: 0, len: 0 },
      userEvents:                 null,
      hammertime:                 null,
      curNavLevel:                'l1',   // current navigation level (l1 or LN)
      curWidth:                   'me',
      albumSearch:                '',     // current search string -> title (used to filter the thumbnails on screen)
      albumSearchTags:            '',     // current search string -> tags
      lastZIndex:                 0,      // used to put a thumbnail on top of all others (for exemple for scale hover effect)
      lastRandomValue:            0
    };
    
    // One GOM item (thumbnail)
    function GTn(index, width, height) {
      this.thumbnailIdx = index;
      this.width =                0;      // thumbnail width
      this.height =               0;      // thumbnail height
      this.top =                  0;      // position: top
      this.left =                 0;      // position: left
      this.row =                  0;      // position: row number
      this.imageWidth =           width;  // image width
      this.imageHeight =          height; // image height
      this.resizedContentWidth =  0;
      this.resizedContentHeight = 0;
      this.displayed =            false;
      this.neverDisplayed =       true;
      this.inDisplayArea =        false;
    }
    
    //------------------------
    //--- Viewer Object Model
    
    G.VOM = {
      viewerDisplayed:            false,  // is the viewer currently displayed
      viewerIsFullscreen:         false,  // viewer in fullscreen mode
      infoDisplayed:              false,  // is the info box displayed
      toolbarsDisplayed:          true,   // the toolbars are displayed
      toolsHide:                  null,
      zoom : {
        posX:                     0,      // position to center zoom in/out
        posY:                     0,
        userFactor:               1,      // user zoom factor (applied to the baseZoom factor)
        isZooming:                false
      },
      padding:                    { H: 0, V: 0 }, // padding for the image
      window:                     { lastWidth: 0, lastHeight: 0 },
      $cont:                      null,   // viewer container
      $viewer:                    null,
      $toolbar:                   null,   // viewerToolbar
      $toolbarTL:                 null,   // viewer toolbar on top left
      $toolbarTR:                 null,   // viewer toolbar on top right
      $content:                   null,   // viewer content
      
      $imgP:                      null,   // previous displayed image
      $imgC:                      null,   // currently displayed image
      $imgN:                      null,   // next image to display
      toolbarMode:                'std',  // current toolbar mode (standard, minimized)
      playSlideshow :             false,  // slide show mode status
      playSlideshowTimerID:       0,      // slideshow mode time
      slideshowDelay:             3000,   // slideshow mode - delay before next image
      albumID:                    -1,
      currItemIdx:                -1,
      viewerImageIsChanged:       false,  // image display is currently modified
      items:                      [],     // current list of images to be managed by the viewer
      NGY2Item: function( n ) {   // returns a NGY2Item
        switch( n ) {
          case -1:   // previous
            var idx=this.IdxPrevious();
            return G.I[this.items[idx].ngy2ItemIdx]
            break;
          case 1:   // next
            var idx=this.IdxNext();
            return G.I[this.items[idx].ngy2ItemIdx]
            break;
          case 0:   // current
          default:
            return G.I[this.items[G.VOM.currItemIdx].ngy2ItemIdx];
            break;
        }
      },
      IdxNext: function() {
        var n=0;
        if( G.VOM.currItemIdx != G.VOM.items.length-1 ) {
          n=G.VOM.currItemIdx+1;
        }
        return n;
      },
      IdxPrevious: function() {
        var n=G.VOM.currItemIdx-1;
        if( G.VOM.currItemIdx == 0 ) {
          n=G.VOM.items.length-1;
        }
        return n;
      },
      userEvents:         null,   // user events management
      hammertime:         null,   // hammer.js manager
      swipePosX:          0,      // current horizontal swip position
      panPosX:            0,      // manual pan position
      panPosY:            0,
      colorSchemeLabel:   '',
      timeImgChanged:     0,
      ImageLoader: {
        // inspired by ROB - http://stackoverflow.com/users/226507/rob
        maxChecks:        1000,
        list:             [],
        intervalHandle :  null,

        loadImage : function (callback, ngitem) {
          var img = new Image ();
          img.src = ngitem.responsiveURL();
          if (img.width && img.height) {
            callback (img.width, img.height, ngitem, 0);
            }
          else {
            var obj = {image: img, url: ngitem.responsiveURL(), ngitem: ngitem, callback: callback, checks: 1};
            var i;
            for (i=0; i < this.list.length; i++)    {
              if (this.list[i] == null)
                break;
              }
            this.list[i] = obj;
            if (!this.intervalHandle)
              this.intervalHandle = setInterval(this.interval, 50);
            }
          },

        // called by setInterval  
        interval : function () {
          var count = 0;
          var list = G.VOM.ImageLoader.list, item;
          for (var i=0; i<list.length; i++) {
            item = list[i];
            if (item != null) {
              if (item.image.width && item.image.height) {
                G.VOM.ImageLoader.list[i] = null;
                item.callback (item.image.width, item.image.height, item.ngitem, item.checks);
                }
              else if (item.checks > G.VOM.ImageLoader.maxChecks) {
                G.VOM.ImageLoader.list[i] = null;
                item.callback (0, 0, item.ngitem, item.checks);
                }
              else {
                count++;
                item.checks++;
                }
              }
            }
          if (count == 0) {
            G.VOM.ImageLoader.list = [];
            clearInterval (G.VOM.ImageLoader.intervalHandle);
            delete G.VOM.ImageLoader.intervalHandle;
            }
          }
        }
    }
    // One VOM item (image)
    function VImg(index) {
      this.$e = null;
      this.ngy2ItemIdx = index;
      this.imageNumber = 0;     
      this.posX = 0;    // to center the element
      this.posY = 0;
    }
    
    
    //------------------------
    //--- popup
    G.popup = {
      isDisplayed:      false,
      $elt:             null,
      close: function() {
        if( this.$elt != null ) {
          var tweenable = new NGTweenable();
          tweenable.tween({
            from:       { opacity:1  },
            to:         { opacity:0 },
            attachment: { t: this },
            easing:     'easeInOutSine',
            duration:   100,
            step: function (state, att) {
              if( att.t.$elt != null ) {
                att.t.$elt.css('opacity',state.opacity);
              }
            },
            finish: function (state, att) {
              if( att.t.$elt != null ) {
                att.t.$elt.remove();
                att.t.$elt=null;
              }
              att.t.isDisplayed=false;
            }
          });
        }
      }
    }
    
    
    // Color schemes - Gallery
    G.colorScheme_dark = {
      navigationBar :         { background: 'none', borderTop: '', borderBottom: '', borderRight: '', borderLeft: '' },
      navigationBreadcrumb :  { background: '#111', color: '#fff', colorHover: '#ccc', borderRadius: '4px' },
      navigationFilter :      { color: '#ddd', background: '#111', colorSelected: '#fff', backgroundSelected: '#111', borderRadius: '4px' },
      thumbnail :             { background: '#444', borderColor: '#000', labelOpacity : 1, labelBackground: 'rgba(34, 34, 34, 0)', titleColor: '#fff', titleBgColor: 'transparent', titleShadow: '', descriptionColor: '#ccc', descriptionBgColor: 'transparent', descriptionShadow: '', stackBackground: '#aaa' },
      thumbnailIcon :         { padding: '5px', color: '#fff' },
      pagination :            { background: '#111', backgroundSelected: '#666', color: '#fff', borderRadius: '4px', shapeBorder: '3px solid #666', shapeColor: '#444', shapeSelectedColor: '#aaa'}
    };

    G.colorScheme_light = {
      navigationBar :         { background: 'none', borderTop: '', borderBottom: '', borderRight: '', borderLeft: '' },
      navigationBreadcrumb :  { background: '#eee', color: '#000', colorHover: '#333', borderRadius: '4px' },
      navigationFilter :      { background: '#eee', color: '#222', colorSelected: '#000', backgroundSelected: '#eee', borderRadius: '4px' },
      thumbnail :             { background: '#444', borderColor: '#000', labelOpacity : 1, labelBackground: 'rgba(34, 34, 34, 0)', titleColor: '#fff', titleBgColor: 'transparent', titleShadow: '', descriptionColor: '#ccc', descriptionBgColor: 'transparent', descriptionShadow: '', stackBackground: '#888' },
      thumbnailIcon :         { padding: '5px', color: '#fff' },
      pagination :            { background: '#eee', backgroundSelected: '#aaa', color: '#000', borderRadius: '4px', shapeBorder: '3px solid #666', shapeColor: '#444', shapeSelectedColor: '#aaa'}
    };

    // Color schemes - lightbox
    G.colorSchemeViewer_dark = {
      background:             '#000',
      imageBorder:            'none',
      imageBoxShadow:         'none',
      barBackground:          'rgba(4, 4, 4, 0.7)',
      barBorder:              '0px solid #111',
      barColor:               '#eee',
      barDescriptionColor:    '#aaa'
    };
    G.colorSchemeViewer_border = {
      background:             'rgba(1, 1, 1, 0.75)',
      imageBorder:            '4px solid #f8f8f8',
      imageBoxShadow:         '#888 0px 0px 20px',
      barBackground:          'rgba(4, 4, 4, 0.7)',
      barBorder:              '0px solid #111',
      barColor:               '#eee',
      barDescriptionColor:    '#aaa'
    };
    G.colorSchemeViewer_light = {
      background:             '#f8f8f8',
      imageBorder:            'none',
      imageBoxShadow:         'none',
      barBackground:          'rgba(4, 4, 4, 0.7)',
      barBorder:              '0px solid #111',
      barColor:               '#eee',
      barDescriptionColor:    '#aaa'
    };

      
    
    // shortcut with G context to NGY2TOOLS
    // var NanoAlert =           NGY2Tools.NanoAlert.bind(G);
    // var NanoConsoleLog =      NGY2Tools.NanoConsoleLog.bind(G);
    var NanoAlert =           NGY2Tools.NanoAlert;
    var NanoConsoleLog =      NGY2Tools.NanoConsoleLog;

    
    /** @function initiateGallery2 */
    this.initiateGallery2 = function( element, params ) {

      // GLOBAL OPTIONS
      G.O =               params;
      // Base element
      G.$E.base =         jQuery(element);
      G.baseEltID =       G.$E.base.attr('id');
      if( G.baseEltID == undefined ) {
        // set a default ID to the root container
        G.baseEltID='my_nanogallery';
        G.$E.base.attr('id', G.baseEltID)
      }
      G.O.$markup =       [];
      DefineVariables();
      SetPolyFills();
      BuildSkeleton();
      SetGlobalEvents();
      
      // check if only one specific album will be used
      var albumToDisplay=G.O.album;
      if( albumToDisplay == '' && G.O.photoset != '' ) {
        albumToDisplay=G.O.photoset;
        G.O.album=G.O.photoset;
      }
      if( albumToDisplay != '' ) {
        G.O.displayBreadcrumb=false;    // no breadcrumb since only 1 album
        if( albumToDisplay.toUpperCase() != 'NONE' ) {
          // open specific album
        
          var p=albumToDisplay.indexOf('&authkey=');
          if( p == -1 ) {
            p=albumToDisplay.indexOf('?authkey=');
          }
          if( p > 0 ) {
            // privat album with authkey
            G.O.locationHash=false;   // disable hash location for hidden/privat albums --> impossible to handle
            var albumID=albumToDisplay.substring(0,p);
            var opt=albumToDisplay.substring(p);
            if( opt.indexOf('Gv1sRg') == -1 ) {
              opt='&authkey=Gv1sRg'+opt.substring(9);
            }
            var newItem=NGY2Item.New( G, '', '', albumID, '-1', 'album' );
            newItem.authkey=opt;
            DisplayAlbum('-1', albumID);
          }
          else {
            if( G.O.kind == "nano_photos_provider2") {
              if( albumToDisplay == decodeURIComponent(albumToDisplay)) {
                // album ID must be encoded
                albumToDisplay=encodeURIComponent(albumToDisplay);
                G.O.album=albumToDisplay;
              }
            }
            var nItm=NGY2Item.New( G, '', '', albumToDisplay, '-1', 'album' );
            DisplayAlbum('-1', albumToDisplay);
          }
          return;
        }
      }
      
      // use full content
      // add base album
      var itm=NGY2Item.New( G, G.i18nTranslations.breadcrumbHome, '', '0', '-1', 'album' );

      processStartOptions();
      

    }


    /** @function processStartOptions */
    function processStartOptions() {

      // open image or album
      // 1. load hidden albums
      // 1. check if location hash set (deep linking)
      // 2. check openOnStart parameter
      // 3. open root album (ID=-1)

      // hidden/private albums are loaded on plugin start
      if( G.albumListHidden.length > 0 ) {
        jQuery.nanogallery2['data_'+G.O.kind](G, 'GetHiddenAlbums', G.albumListHidden, processStartOptionsPart2);
        return;
      }
      
      if( !ProcessLocationHash() ) {
        processStartOptionsPart2();
      }
    }

    /** @function processStartOptionsPart2 */
    function processStartOptionsPart2() {
  
      // Check location hash + start parameters -> determine what to do on start
      // openOnStart parameter
      if( G.O.openOnStart != '' ) {
        var IDs=parseIDs(G.O.openOnStart);
        if( IDs.imageID != '0' ) {
          DisplayPhoto(IDs.imageID, IDs.albumID);
        }
        else {
          DisplayAlbum('-1', IDs.albumID);
        }
      }
      else {
        // open root album (ID = -1)
        DisplayAlbum('-1', 0);
      }
    }
    
    // Parse string to extract albumID and imageID (format albumID/imageID)
    function parseIDs( IDs ) {
      var r={ albumID: '0', imageID: '0' };
      
      var t=IDs.split('/');
      if( t.length > 0 ) {
        r.albumID=t[0];
        if( t.length > 1 ) {
          r.imageID=t[1];
        }
      }
      return r;
    }
    

    /** @function DisplayAlbum */
    function DisplayAlbum( imageID, albumID ) {

      // close viewer if already displayed
      if( G.VOM.viewerDisplayed ) {
        CloseInternalViewer(null);
      }
    
      // set current navigation level (l1 or lN)
      var albumIdx=NGY2Item.GetIdx(G, albumID);
      if( albumIdx == 0 ) {
        G.GOM.curNavLevel='l1';
      }
      else {
        G.GOM.curNavLevel='lN';
      }
      G.galleryResizeEventEnabled=false;

      if( albumIdx == -1 ) {
        NGY2Item.New( G, '', '', albumID, '0', 'album' );    // create empty album
        albumIdx=G.I.length-1;
      }
    
      if( !G.I[albumIdx].contentIsLoaded ) {
        // get content of the album if not already loaded
        AlbumGetContent( albumID, DisplayAlbum, imageID, albumID );
        return;
      }
    
      ThumbnailSelectionClear();
    
      G.GOM.pagination.currentPage=0;
      SetLocationHash( albumID, '' );
      GalleryRender( albumIdx );
    
    }


    //----- manage the bottom area of the gallery -> "pagination" or "more button"
    function GalleryBottomManage() {

      switch( G.galleryDisplayMode.Get() ) {
        case 'PAGINATION':
          if( G.layout.support.rows && G.galleryMaxRows.Get() > 0 ) {
            ManagePagination( G.GOM.albumIdx );
          }
          break;
        case 'MOREBUTTON':
          G.$E.conTnBottom.off('click');
          var nb=G.GOM.items.length-G.GOM.itemsDisplayed;
          if( nb == 0 ) {
            G.$E.conTnBottom.empty();
          }
          else {
            G.$E.conTnBottom.html('<div class="nGY2GalleryMoreButton"><div class="nGY2GalleryMoreButtonAnnotation">+'+nb+' ' + G.O.icons.galleryMoreButton +'</div></div>');
            G.$E.conTnBottom.on('click', function(e) {
              G.GOM.displayedMoreSteps++;
              GalleryResize();
            });
          }
          break;
        case 'FULLCONTENT':
        default:
          break;
      }
    }
    
    
    // add one album/folder to the breadcrumb
    function breadcrumbAdd( albumIdx ) {

      var ic='';
      if( !G.O.breadcrumbHideIcons ) {
        ic=G.O.icons.breadcrumbAlbum;
        if( albumIdx == 0 ) {
          ic=G.O.icons.breadcrumbHome;
        }
      }
      var $newDiv =jQuery('<div class="oneItem">'+ic + G.I[albumIdx].title+'</div>').appendTo(G.GOM.navigationBar.$newContent.find('.nGY2Breadcrumb'));
      if( G.O.breadcrumbOnlyCurrentLevel ) {
        // link to parent folder (only 1 level is displayed in the breadcrumb)
        if( albumIdx == 0 ) {
          // no parent level -> stay on current one
          jQuery($newDiv).data('albumID','0');
        }
        else {
          jQuery($newDiv).data('albumID',G.I[albumIdx].albumID);
        }
      }
      else {
        // link to current folder
        jQuery($newDiv).data('albumID',G.I[albumIdx].GetID());
      }
      $newDiv.click(function() {
        var cAlbumID=jQuery(this).data('albumID');
        DisplayAlbum('-1', cAlbumID);
        return;
      });
    }

    // add one separator to breadcrumb
    function breadcrumbAddSeparator( lastAlbumID ) {
      var $newSep=jQuery('<div class="oneItem">'+(G.O.RTL ? G.O.icons.breadcrumbSeparatorRtl : G.O.icons.breadcrumbSeparator)+'</div>').appendTo(G.GOM.navigationBar.$newContent.find('.nGY2Breadcrumb'));
      jQuery($newSep).data('albumIdx',lastAlbumID);
      $newSep.click(function() {
        var sepAlbumIdx=jQuery(this).data('albumIdx');
        DisplayAlbum('-1', G.I[sepAlbumIdx].GetID());
        return;
      });
    }

    
    
    // Manage the gallery toolbar (breadcrumb + tag filter)
    function GalleryNavigationBar( albumIdx ) {

      // new navigation bar items are not build in the DOM, but in memory
      G.GOM.navigationBar.$newContent=jQuery('<div class="nGY2Navigationbar"></div>');

      //-- manage breadcrumb
      if( G.O.displayBreadcrumb == true && !G.O.thumbnailAlbumDisplayImage) {
        // retrieve new folder level
        var newLevel = 0,
        lstItems=[];
        if( albumIdx != 0 ) {
          var l=G.I.length,
          parentID=0;
          
          lstItems.push(albumIdx);
          var curIdx=albumIdx;
          newLevel++;
          
          while( G.I[curIdx].albumID != 0 && G.I[curIdx].albumID != -1) {
            for(var i=1; i < l; i++ ) {
              if( G.I[i].GetID() == G.I[curIdx].albumID ) {
                curIdx=i;
                lstItems.push(curIdx);
                newLevel++;
                break;
              }
            }
          }
        }
        
        // build breadcrumb
        if( !(G.O.breadcrumbAutoHideTopLevel && newLevel == 0) ) {
          BreadcrumbBuild( lstItems );
        }
      }

      
      //-- manage tag filters
      if( G.galleryFilterTags.Get() != false ) {
        var nTags=G.I[albumIdx].albumTagList.length;
        if( nTags > 0 ) {
          for(var i=0; i < nTags; i++ ) {
            var s=G.I[albumIdx].albumTagList[i];
            var ic=G.O.icons.navigationFilterUnselected;
            var tagClass='Unselected';
            if( jQuery.inArray(s, G.I[albumIdx].albumTagListSel) >= 0 ) {
              tagClass='Selected';
              ic=G.O.icons.navigationFilterSelected;
            }
            var $newTag=jQuery('<div class="nGY2NavigationbarItem nGY2NavFilter'+tagClass+'">'+ic+' '+s+'</div>').appendTo(G.GOM.navigationBar.$newContent);
            $newTag.click(function() {
              var $this=jQuery(this);
              var tag=$this.text().replace(/^\s*|\s*$/, '');  //trim trailing/leading whitespace
              // if( $this.hasClass('oneTagUnselected') ){
              if( $this.hasClass('nGY2NavFilterUnselected') ){
                G.I[albumIdx].albumTagListSel.push(tag);
              }
              else {
                var tidx=jQuery.inArray(tag,G.I[albumIdx].albumTagListSel);
                if( tidx != -1 ) {
                  G.I[albumIdx].albumTagListSel.splice(tidx,1);
                }
              }
              $this.toggleClass('nGY2NavFilters-oneTagUnselected nGY2NavFilters-oneTagSelected');
              DisplayAlbum('-1', G.I[albumIdx].GetID());
            });
          }
          var $newClearFilter=jQuery('<div class="nGY2NavigationbarItem nGY2NavFilterSelectAll">'+G.O.icons.navigationFilterSelectedAll+'</div>').appendTo(G.GOM.navigationBar.$newContent);
          $newClearFilter.click(function() {
            var nTags=G.I[albumIdx].albumTagList.length;
            G.I[albumIdx].albumTagListSel=[];
            for(var i=0; i <nTags; i++ ) {
              var s=G.I[albumIdx].albumTagList[i];
              G.I[albumIdx].albumTagListSel.push(s);
            }
            DisplayAlbum('-1', G.I[albumIdx].GetID());
          });
        }
      }

    }
    
    function BreadcrumbBuild(lstItems) {

      jQuery('<div class="nGY2NavigationbarItem nGY2Breadcrumb"></div>').appendTo(G.GOM.navigationBar.$newContent);
      
      if( G.O.breadcrumbOnlyCurrentLevel ) {
        // display only 1 separator and the current folder level
        if( lstItems.length == 0 ) {
          breadcrumbAdd(0);
        }
        else {
          var last=lstItems.length-1;
          if( lstItems.length == 1 ) {
            breadcrumbAddSeparator(0);    // root level
          }
          else {
            breadcrumbAddSeparator(lstItems[0]);
          }
          breadcrumbAdd(lstItems[0]);
        }
      }
      else {
        // display the full breadcrum (full folder levels including root level)
        breadcrumbAdd(0);
        if( lstItems.length > 0 ) {
          breadcrumbAddSeparator(0);
          for(var i=lstItems.length-1; i>=0 ; i-- ) {
            breadcrumbAdd(lstItems[i]);
            if( i > 0 ) {
              breadcrumbAddSeparator(lstItems[i-1]);
            }
          }
        }
      }
    
    }
    

    // Display pagination
    function ManagePagination( albumIdx ) {

      G.$E.conTnBottom.children().remove();

      if( G.GOM.items.length == 0 ) { return; }   // no thumbnail to display

      // calculate the number of pages
      var nbPages=Math.ceil((G.GOM.items[G.GOM.items.length-1].row+1)/G.galleryMaxRows.Get());

      // only one page -> do not display pagination
      if( nbPages == 1 ) { return; }

      // check if current page still exist (for example after a resize)
      if( G.GOM.pagination.currentPage > (nbPages-1) ) {
        G.GOM.pagination.currentPage=nbPages-1;
      }
      
      GalleryRenderGetInterval();
      // nothing to display --> exit
      if( G.GOM.displayInterval.len == 0 ) { return; }
      
      // display "previous"
      if( G.O.galleryPaginationMode == 'NUMBERS' && G.GOM.pagination.currentPage > 0 ) {
        var $eltPrev=jQuery('<div class="nGY2PaginationPrev">'+G.O.icons.paginationPrevious+'</div>').appendTo(G.$E.conTnBottom);
        $eltPrev.click(function(e) {
          paginationPreviousPage();
        });
      }

      var firstPage=0;
      var lastPage=nbPages;
      if( G.O.galleryPaginationMode != 'NUMBERS' ) {
        // no 'previous'/'next' and no max number of pagination items
        firstPage=0;
      }
      else {
        // display pagination numbers and previous/next
        var vp=G.O.paginationVisiblePages;
        var numberOfPagesToDisplay=G.O.paginationVisiblePages;
        if( numberOfPagesToDisplay >= nbPages ) {
          firstPage=0;
        }
        else {
          // we have more pages than we want to display
          var nbBeforeAfter=0;
          if( isOdd(numberOfPagesToDisplay) ) {
            nbBeforeAfter=(numberOfPagesToDisplay+1)/2;
          }
          else {
            nbBeforeAfter=numberOfPagesToDisplay/2;
          }
          
          if( G.GOM.pagination.currentPage < nbBeforeAfter ) {
            firstPage=0;
            lastPage=numberOfPagesToDisplay-1;
            if( lastPage > nbPages ) {
              lastPage=nbPages-1;
            }
          }
          else {
            firstPage=G.GOM.pagination.currentPage-nbBeforeAfter;
            lastPage=firstPage+numberOfPagesToDisplay;
            if( lastPage > nbPages ) {
              lastPage=nbPages-1;
            }
          }
          
          if( (lastPage - firstPage) < numberOfPagesToDisplay ) {
            firstPage=lastPage-numberOfPagesToDisplay;
            if( firstPage < 0 ) {
              firstPage=0;
            }
          }

        }
      }

      // render pagination items
      for(var i=firstPage; i < lastPage; i++ ) {
        var c='';
        var p='';

        switch( G.O.galleryPaginationMode ) {
          case 'NUMBERS':
            c='nGY2paginationItem';
            p=i+1;
            break;
          case 'DOTS':
            c='nGY2paginationDot';
            break;
          case 'RECTANGLES':
            c='nGY2paginationRectangle';
            break;
        }
        if( i == G.GOM.pagination.currentPage ) {
          c+='CurrentPage';
        }

        var elt$=jQuery('<div class="'+c+'">'+p+'</div>').appendTo(G.$E.conTnBottom);
        elt$.data('pageNumber', i );
        elt$.click(function(e) {
          G.GOM.pagination.currentPage=jQuery(this).data('pageNumber');
          TriggerCustomEvent('pageChanged');
          GalleryDisplayPart1( true );
          GalleryDisplayPart2( true );
        });

      }

      // display "next"
      if( G.O.galleryPaginationMode == 'NUMBERS' && (G.GOM.pagination.currentPage+1) < nbPages ) {
        var $eltNext=jQuery('<div class="nGY2PaginationNext">'+G.O.icons.paginationNext+'</div>').appendTo(G.$E.conTnBottom);
        $eltNext.click(function(e) {
          paginationNextPage();
        });
      }

    }
    function isOdd(num) { return (num % 2) == 1;}
    
    // pagination - next page
    function paginationNextPage() {
      var aIdx=G.GOM.albumIdx,
      n1=0;
      ThumbnailHoverOutAll();
      
      // pagination - max lines per page mode
      if( G.galleryMaxRows.Get() > 0 ) {
        // number of pages
        n1=(G.GOM.items[G.GOM.items.length-1].row+1)/G.galleryMaxRows.Get();
      }
      var n2=Math.ceil(n1);
      var pn=G.GOM.pagination.currentPage;
      if( pn < (n2-1) ) {
        pn++;
      }
      else {
        pn=0;
      }
      
      G.GOM.pagination.currentPage = pn;
      TriggerCustomEvent('pageChanged');

      GalleryDisplayPart1( true );
      GalleryDisplayPart2( true );
    }
    
    // pagination - previous page
    function paginationPreviousPage() {
      // var aIdx=G.$E.conTnBottom.data('galleryIdx'),
      var aIdx=G.GOM.albumIdx,
      n1=0;

      ThumbnailHoverOutAll();
      
      // pagination - max lines per page mode
      if( G.galleryMaxRows.Get() > 0 ) {
        // number of pages
        n1=(G.GOM.items[G.GOM.items.length-1].row+1)/G.galleryMaxRows.Get();
      }
      var n2=Math.ceil(n1);
      
      // var pn=G.$E.conTnBottom.data('currentPageNumber');
      var pn=G.GOM.pagination.currentPage;
      if( pn > 0 ) {
        pn--;
      }
      else {
        pn=n2-1;
      }

      G.GOM.pagination.currentPage = pn;
      TriggerCustomEvent('pageChanged');
      GalleryDisplayPart1( true );
      GalleryDisplayPart2( true );
    }

    // retrieve the from/to intervall for gallery thumbnail render
    function GalleryRenderGetInterval() {
      G.GOM.displayInterval.from=0;
      G.GOM.displayInterval.len=G.I.length;
      
      switch( G.galleryDisplayMode.Get() ) {
        case 'PAGINATION':
          if( G.layout.support.rows ) {
            var nbTn=G.GOM.items.length;
            var firstRow=G.GOM.pagination.currentPage * G.galleryMaxRows.Get();
            var lastRow=firstRow+G.galleryMaxRows.Get();
            var firstTn=-1;
            G.GOM.displayInterval.len=0;
            for( var i=0; i < nbTn ; i++ ) {
              var curTn=G.GOM.items[i];
              if( curTn.row >= firstRow && curTn.row < lastRow ) {
                if( firstTn == -1 ) {
                  G.GOM.displayInterval.from=i;
                  firstTn=i;
                }
                G.GOM.displayInterval.len++;
              }
            }
          }
          break;
        case 'MOREBUTTON':
          if( G.layout.support.rows ) {
            var nbTn=G.GOM.items.length;
            var lastRow=G.O.galleryDisplayMoreStep * (G.GOM.displayedMoreSteps+1);
            G.GOM.displayInterval.len=0;
            for( var i=0; i < nbTn ; i++ ) {
              var curTn=G.GOM.items[i];
              if( curTn.row < lastRow ) {
                G.GOM.displayInterval.len++;
              }
            }
          }
          break;
        case 'ROWS':
          if( G.layout.support.rows ) {
            var nbTn=G.GOM.items.length;
            var lastRow=G.galleryMaxRows.Get();
            if( G.galleryLastRowFull.Get() && G.GOM.lastFullRow != -1 ) {
              if( lastRow > G.GOM.lastFullRow+1) {
                lastRow=G.GOM.lastFullRow+1;
              }
            }
            G.GOM.displayInterval.len=0;
            for( var i=0; i < nbTn ; i++ ) {
              var curTn=G.GOM.items[i];
              if( curTn.row < lastRow ) {
                G.GOM.displayInterval.len++;
              }
            }
          }
          break;
        default:
        case 'FULLCONTENT':
        if( G.layout.support.rows && G.galleryLastRowFull.Get() && G.GOM.lastFullRow != -1 ) {
            var nbTn=G.GOM.items.length;
            var lastRow=G.GOM.lastFullRow+1;
            G.GOM.displayInterval.len=0;
            for( var i=0; i < nbTn ; i++ ) {
              var curTn=G.GOM.items[i];
              if( curTn.row < lastRow ) {
                G.GOM.displayInterval.len++;
              }
            }
          }
          break;
      }
    }
    
    
    // RENDER THE GALLERY
    function GalleryRender( albumIdx ) {

      TriggerCustomEvent('galleryRenderStart');
      if( G.O.fnGalleryRenderStart !== null ) {
        if( typeof G.O.fnGalleryRenderStart == 'function' ) {
          G.O.fnGalleryRenderStart(albumIdx);
        }
        else {
          // defined in markup
          window[G.O.fnGalleryRenderStart](albumIdx);
        }
      }

      G.layout.SetEngine();
      G.galleryResizeEventEnabled=false;
      G.GOM.albumIdx = -1;
      G.GOM.lastDisplayedIdx = -1;

      // pagination
      if( G.$E.conTnBottom !== undefined ) {
        // G.$E.conTnBottom.children().remove();
        G.$E.conTnBottom.empty();
      }

      // navigation toolbar (breadcrumb + tag filters)
      GalleryNavigationBar(albumIdx);
      
      if( G.GOM.firstDisplay ) {
        G.GOM.firstDisplay=false;
        // GalleryRenderPart1( albumIdx );
        setTimeout( function() { GalleryRenderPart1( albumIdx )}, G.O.galleryRenderDelay);
      }
      else {
        var hideNavigationBar=false;
        if( G.GOM.navigationBar.$newContent.children().length == 0 ) {
          hideNavigationBar=true;
        }

        // hide everything
        var tweenable = new NGTweenable();
        tweenable.tween({
          from:         { 'opacity': 1 },
          to:           { 'opacity': 0 },
          duration:     200,
          easing:       'easeInQuart',
          attachment:   { h: hideNavigationBar },
          step:         function (state, att) {
            G.$E.conTnParent.css({'opacity': state.opacity });
            if( att.h ) {
              G.$E.conNavigationBar.css({ 'opacity': state.opacity });
            }
          },
          finish:       function (state, att) {
            G.$E.conTnParent.css({'opacity': 0});
            if( att.h ) {
              G.$E.conNavigationBar.css({ 'opacity': 0, 'display': 'none' });
            }
            // scroll to top of the gallery if needed
            var wp=getViewport();
            var galleryOTop=G.$E.base.offset().top;
            if( galleryOTop < wp.t ) {
              // jQuery('html, body').animate({scrollTop: galleryOTop}, 200);
              jQuery('html, body').animate({scrollTop: galleryOTop}, 500, "linear", function() {
                GalleryRenderPart1( albumIdx );
              });
            }
            else {
              GalleryRenderPart1( albumIdx );
            }
          }
        });
      }
    }


    function GalleryRenderPart1( albumIdx ) {
      // display new navigation bar
      var oldN=G.$E.conNavigationBar.children().length;
      G.$E.conNavigationBar.empty();
      G.GOM.navigationBar.$newContent.children().clone(true,true).appendTo(G.$E.conNavigationBar);
      if( G.$E.conNavigationBar.children().length > 0 && oldN == 0 ) {
        G.$E.conNavigationBar.css({ 'opacity': 0, 'display': 'block' });
        var tweenable = new NGTweenable();
        tweenable.tween({
          from:     { o: 0 },
          to:       { o: 1 },
          duration: 200,
          easing:   'easeInQuart',
          step:     function (state) {
            G.$E.conNavigationBar.css({ 'opacity': state.o });
          },
          finish:   function (state) {
            G.$E.conNavigationBar.css({ 'opacity': 1 });
            // display gallery
            // GalleryRenderPart2( albumIdx );
            setTimeout(function(){ GalleryRenderPart2(albumIdx) }, 60);
          }
        });
      }
      else {
        // display gallery
        // GalleryRenderPart2( albumIdx );
            setTimeout(function(){ GalleryRenderPart2(albumIdx) }, 60);
      }

    }
    
    // Gallery render part 2 -> remove all thumbnails
    function GalleryRenderPart2(albumIdx) {
      G.GOM.lastZIndex = parseInt(G.$E.base.css('z-index'));
      if( isNaN(G.GOM.lastZIndex) ) {
        G.GOM.lastZIndex=0;
      }
      G.$E.conTnParent.css({'opacity': 0 });
      G.$E.conTn.off().empty();
      var l=G.I.length;
      for( var i=0; i < l ; i++ ) {
        // reset each item
        var item=G.I[i];
        item.hovered=false;
        item.$elt=null;
        item.$Elts=[];
        item.eltTransform=[];
        item.eltFilter=[];
        item.width=0;
        item.height=0;
        item.left=0;
        item.top=0;
        item.resizedContentWidth=0;
        item.resizedContentHeight=0;
        item.thumbnailImgRevealed=false;
      }

      if( G.CSStransformName == null ) {
        G.$E.conTn.css('left', '0px' );
      }
      else {
        // G.$E.conTn.css( G.CSStransformName, 'translateX(0px)');
        G.$E.conTn.css( G.CSStransformName, 'none');
      }
      
      setTimeout(function(){ GalleryRenderPart3(albumIdx) }, 60);
      // GalleryRenderPart3(albumIdx);

    }
    
    // Gallery render part 2 -> start building the new gallery
    function GalleryRenderPart3(albumIdx) {
      var d=new Date();      
      
      G.$E.conTnParent.css( 'opacity', 1);

      G.GOM.items = [];
      G.GOM.displayedMoreSteps=0;
      // retrieve annotation height      
      var annotationHeight = 0;
      if( G.O.thumbnailLabel.get('position') == 'onBottom' ) {
        // retrieve height each time because size can change depending on thumbnail's settings
        annotationHeight=ThumbnailGetAnnotationHeight();
        G.tn.labelHeight[G.GOM.curNavLevel]=annotationHeight;
      }
      else {
        G.tn.labelHeight[G.GOM.curNavLevel]=0;
      }
      G.GOM.albumIdx=albumIdx;

      TriggerCustomEvent('galleryRenderEnd');
      if( G.O.fnGalleryRenderEnd !== null ) {
        if( typeof G.O.fnGalleryRenderEnd == 'function' ) {
          G.O.fnGalleryRenderEnd(albumIdx);
        }
        else {
          // defined in markup
          window[G.O.fnGalleryRenderEnd](albumIdx);
        }
      }

      // Step 1: populate GOM
      if( GalleryPopulateGOM() ) {

        // step 2: calculate layout
        GallerySetLayout();

        // step 3: display gallery
        GalleryAppear();
        // GalleryDisplay( false );
        GalleryDisplayPart1( false );
        setTimeout(function(){ GalleryDisplayPart2( false ) }, 60);
      }
      else {
        G.galleryResizeEventEnabled=true;
      }
      
      if( G.O.debugMode ) { console.log('GalleryRenderPart3: '+ (new Date()-d)); }

    }
    
    
    // Resize the gallery
    function GalleryResize() {
      var d=new Date();
      G.galleryResizeEventEnabled=false;
      // G.GOM.cache.areaWidth=G.$E.conTnParent.width();
      if( GallerySetLayout() == false ) {
        G.galleryResizeEventEnabled=true;
        if( G.O.debugMode ) { console.log('GalleryResize1: '+ (new Date()-d)); }
        return;
      }
      if( G.O.debugMode ) { console.log('GalleryResizeSetLayout: '+ (new Date()-d)); }

      GalleryDisplayPart1( false );
      GalleryDisplayPart2( false );

      if( G.O.debugMode ) { console.log('GalleryResizeFull: '+ (new Date()-d)); }
    }
    
    
    
    // copy items (album content) to GOM
    function GalleryPopulateGOM() {
      
      var preloadImages='';
      var imageSizeRequested=false;
      var albumID=G.I[G.GOM.albumIdx].GetID();
      var l=G.I.length;
      var cnt=0;

      for( var idx=0; idx < l; idx++ ) {
        var item=G.I[idx];
        // check album
        if( item.isToDisplay(albumID) ) {
        var w=item.thumbImg().width;
          var h=item.thumbImg().height;
          // if unknown image size and layout is not grid --> we need to retrieve the size of the images
          if( G.layout.prerequisite.imageSize && ( w == 0 || h == 0) ) {
          // if( true ) {
            imageSizeRequested=true;
            preloadImages+='<img src="'+item.thumbImg().src+'" data-idx="'+cnt+'" data-albumidx="'+G.GOM.albumIdx+'">';
          }
          
          // set default size if required
          if( h == 0 ) {
            h=G.tn.defaultSize.getHeight();
          }
          if( w == 0 ) {
            w=G.tn.defaultSize.getWidth();
          }
          var tn=new GTn(idx, w, h);
          G.GOM.items.push(tn);
          cnt++;
        }
      }

      TriggerCustomEvent('galleryObjectModelBuilt');
      if( G.O.fnGalleryObjectModelBuilt !== null ) {
        if( typeof G.O.fnGalleryObjectModelBuilt == 'function' ) {
          G.O.fnGalleryObjectModelBuilt();
        }
        else {
          // defined in markup
          window[G.O.fnGalleryObjectModelBuilt]();
        }
      }
      
      if( imageSizeRequested ) {
        // preload images to retrieve their size and then resize the gallery (=GallerySetLayout()+ GalleryDisplay())
        var $newImg=jQuery(preloadImages);
        var gi_imgLoad = ngimagesLoaded( $newImg );
        $newImg=null;
        gi_imgLoad.on( 'progress', function( instance, image ) {
        
          if( image.isLoaded ) {
            var idx=image.img.getAttribute('data-idx');
            var albumIdx=image.img.getAttribute('data-albumidx');
            if( albumIdx == G.GOM.albumIdx ) {
              // ignore event if not on current album
              var curTn=G.GOM.items[idx];
              curTn.imageWidth=image.img.naturalWidth;
              curTn.imageHeight=image.img.naturalHeight;
              var item=G.I[curTn.thumbnailIdx];
              item.thumbs.width[G.GOM.curNavLevel][G.GOM.curWidth]=curTn.imageWidth;
              item.thumbs.height[G.GOM.curNavLevel][G.GOM.curWidth]=curTn.imageHeight;
 
              if( G.layout.engine == 'GRID' && G.tn.opt.Get('crop') === true && item.$getElt('.nGY2GThumbnailImg') !== null ) {
                // special case (GRID + cropped thumbnails) -> just reposition the image in the thumbnail
                if( item.thumbImg().height > item.thumbImg().width ) {
                  // portrait
                  item.$getElt('.nGY2GThumbnailImg').css({ width: G.tn.settings.getW()+'px' });
                }
                else {
                  // paysage

                  // step 1: adjust height
                  var r2=G.tn.settings.getH()/item.thumbImg().height;
                  
                  var newH= G.tn.settings.getH();
                  var newW= item.thumbImg().width*r2;
                  
                  // step 2: check if width needs to be adjusted
                  if( newW >= G.tn.settings.getW() ) {
                    // no adjustement
                    var d=(item.thumbImg().width*r2-G.tn.settings.getW()) / 2;
                    item.$getElt('.nGY2GThumbnailImg').css({ height: G.tn.settings.getH()+'px',left: d+'px' });
                  }
                  else {
                    // yes, adjust width
                    // after scaling to adjust the height, the width is too narrow => upscale again to fit width
                    var rW=G.tn.settings.getW()/item.thumbImg().width;
                    var w=item.thumbImg().width*rW;
                    item.$getElt('.nGY2GThumbnailImg').css({ width: w+'px' });
                  }
                }
              }

              // resize the gallery
              G.GalleryResizeThrottled();
              
              // set the retrieved size to all levels with same configuration  
              var object=item.thumbs.width.l1;
              for (var property in object) {
                if (object.hasOwnProperty(property)) {
                  if( property != G.GOM.curWidth ) {
                    if( G.tn.settings.width.l1[property] == G.tn.settings.getW() && G.tn.settings.height.l1[property] == G.tn.settings.getH() ) {
                      item.thumbs.width.l1[property]=curTn.imageWidth;
                      item.thumbs.height.l1[property]=curTn.imageHeight;
                    }
                  }
                }
              }
              object=item.thumbs.width.lN;
              for (var property in object) {
                if (object.hasOwnProperty(property)) {
                  if( property != G.GOM.curWidth ) {
                    if( G.tn.settings.width.lN[property] == G.tn.settings.getW() && G.tn.settings.height.lN[property] == G.tn.settings.getH() ) {
                      item.thumbs.width.lN[property]=curTn.imageWidth;
                      item.thumbs.height.lN[property]=curTn.imageHeight;
                    }
                  }
                }
              }
            }
          }
        });
        G.galleryResizeEventEnabled=true;
        return false;
      }
      else {
        return true;
      }
      
    }
    
    //----- Calculate the layout of the thumbnails
    function GallerySetLayout() {
      var r = true;
      // width of the available area
      G.GOM.cache.areaWidth=G.$E.conTnParent.width();
      G.GOM.displayArea={ width:0, height:0 };

      switch( G.layout.engine ) {
        case 'JUSTIFIED':
          r = GallerySetLayoutWidthtAuto();
          break;
        case 'CASCADING':
          r = GallerySetLayoutHeightAuto();
          break;
        case 'GRID':
        default:
          r = GallerySetLayoutGrid();
          break;
      }
      
      TriggerCustomEvent('galleryLayoutApplied');
      if( G.O.fnGalleryLayoutApplied !== null ) {
        if( typeof G.O.fnGalleryLayoutApplied == 'function' ) {
          G.O.fnGalleryLayoutApplied();
        }
        else {
          // defined in markup
          window[G.O.fnGalleryLayoutApplied]();
        }
      }
      return r;

    }
    
    
    //----- CASCADING LAYOUT
    function GallerySetLayoutHeightAuto() {
      var curCol =    0,
      areaWidth=      G.GOM.cache.areaWidth,
      curRow =        0,
      colHeight =     [],
      maxCol =        NbThumbnailsPerRow(areaWidth),
      gutterWidth =   0,
      gutterHeight =  G.tn.opt.Get('gutterHeight');

      var tnWidth =   G.tn.defaultSize.getOuterWidth();
      var nbTn =      G.GOM.items.length;

      if( G.O.thumbnailAlignment == 'justified' ) {
        maxCol=Math.min(maxCol,nbTn);
        gutterWidth=( maxCol == 1 ? 0 : (areaWidth-(maxCol*tnWidth))/(maxCol-1) );
      }
      else {
        gutterWidth=G.tn.opt.Get('gutterWidth');
      }

      curRow=0;
      curCol=0;

      var borderWidth=G.tn.borderWidth*2;
      var borderHeight=G.tn.borderHeight*2;

      G.GOM.lastFullRow=-1;   // feature disabled

      // loop to position the thumbnails
      for( var i=0; i < nbTn ; i++ ) {
        var curTn=G.GOM.items[i];
        if( curTn.imageHeight > 0 && curTn.imageWidth > 0 ) {
          var curPosX=0,
          curPosY=0;
          var imageRatio=curTn.imageHeight/curTn.imageWidth;
          curTn.resizedContentWidth=tnWidth-borderWidth;
          curTn.resizedContentHeight=curTn.resizedContentWidth*imageRatio;

          curTn.height=curTn.resizedContentHeight+borderHeight+G.tn.labelHeight.get();
          curTn.width=tnWidth;
          curTn.row=0;
          
          if( curRow == 0 ) {
            // first row
            curPosX=curCol*(tnWidth+gutterWidth);
            colHeight[curCol]=curTn.height+gutterHeight;
            
            curCol++;
            if( curCol >= maxCol ) {
              curCol=0;
              curRow++;
            }
          }
          else {
            var c=0,
            minColHeight=colHeight[0];
            for( var j=1; j<maxCol; j++) {
              if( (colHeight[j]+5) < minColHeight ) {     // +5 --> threshold
                minColHeight=colHeight[j];
                c=j;
                //break;
              }
            }
            curPosY=colHeight[c];
            curPosX=c*(tnWidth+gutterWidth);
            colHeight[c]=curPosY+curTn.height+gutterHeight;
          }

          var x=curPosX;
          if( G.O.RTL) {
            x=w-curPosX-tnWidth;
          }

          curTn.left=x;
          curTn.top=curPosY;
        }
      }

      G.GOM.displayArea.width=maxCol*(tnWidth+gutterWidth)-gutterWidth;
      return true;
    }
    
    
    //----- JUSTIFIED LAYOUT
    function GallerySetLayoutWidthtAuto() {
      var curWidth=               0,
      areaWidth=                  G.GOM.cache.areaWidth,
      lastPosX=                   0,
      curPosY=                    0,
      rowLastItem=                [],
      rowNum=                     0,
      rowHeight=                  [],
      bNewRow=                    false,
      cnt=                        0,
      gutterWidth=                G.tn.opt.Get('gutterWidth'),
      gutterHeight=               G.tn.opt.Get('gutterHeight');
      // by grief-of-these-days
      var maxRowHeightVertical=   0; // max height of a row with vertical thumbs
      var maxRowHeightHorizontal= 0; // max height of a row with horizontal thumbs
      var rowHasVertical=         false; // current row has vertical thumbs
      var rowHasHorizontal=       false; // current row has horizontal thumbs

      var tnHeight=G.tn.defaultSize.getOuterHeight();
      var borderWidth=G.tn.borderWidth*2;
      var borderHeight=G.tn.borderHeight*2;
      var nbTnInCurrRow=1;
      var nbTn=G.GOM.items.length;

      // first loop --> retrieve each row image height
      for( var i=0; i < nbTn ; i++ ) {
        var curTn=G.GOM.items[i];
        if( curTn.imageWidth > 0 ) {
          var imageRatio=curTn.imageWidth/curTn.imageHeight;
          var imageWidth=Math.floor(tnHeight*imageRatio);

          if( bNewRow ) {
            bNewRow=false;
            rowNum++;
            curWidth=0;
            rowHasVertical=false;
            rowHasHorizontal=false;
            nbTnInCurrRow=1;
          }
          // by grief-of-these-days
          if( curTn.imageHeight > curTn.imageWidth ) {
            rowHasVertical = true;
          }
          else {
            rowHasHorizontal = true;
          }
          
          if( (curWidth + gutterWidth + imageWidth) < (areaWidth - (nbTnInCurrRow*borderWidth)) ) {
            // enough place left in the current row
            curWidth+=imageWidth+gutterWidth;
            rowHeight[rowNum]=tnHeight;
            
            // prevent incomplete row from being heigher than the previous ones.
            // by grief-of-these-days
            var rowHeightLimit=Math.max(rowHasVertical ? maxRowHeightVertical : 0, rowHasHorizontal ? maxRowHeightHorizontal : 0);
            if( rowHeightLimit > 0 ) {
              rowHeight[rowNum]=Math.min(rowHeight[rowNum],rowHeightLimit);
            }
            
            rowLastItem[rowNum]=i;
          }
          else {
            // new row after current item --> we need to adujet the row height to have enough space for the current thumbnail
            curWidth+=gutterWidth+imageWidth;
            var ratio=(areaWidth-nbTnInCurrRow*borderWidth) / curWidth;
            var rH=Math.floor(tnHeight*ratio);
            rowHeight[rowNum]=rH;
            
            // save the max row height for each thumb orientation.
            // by grief-of-these-days
            if( rowHasVertical ) {
              maxRowHeightVertical=Math.max(maxRowHeightVertical,rH);
            }
            if( rowHasHorizontal ) {
              maxRowHeightHorizontal=Math.max(maxRowHeightHorizontal,rH);
            }
            
            rowLastItem[rowNum]=i;
            bNewRow=true;
          }
          cnt++;
          nbTnInCurrRow++;
        }
      }

      rowNum=0;
      curPosY=0;
      lastPosX=0;
      cnt=0;
      
      G.GOM.lastFullRow=0;    // display at leat 1 row (even if not full)
      
      // second loop --> calculate each thumbnail size
      for( var i=0; i < nbTn ; i++ ) {
        var curTn=G.GOM.items[i];
        if( curTn.imageWidth > 0 ) {
          var imageRatio=curTn.imageWidth/curTn.imageHeight;
          var imageWidth=Math.floor(imageRatio*rowHeight[rowNum]); // border is already NOT included

          if( i == rowLastItem[rowNum] ) {
            // row last item --> adjust image width because of rounding problems
            if( rowLastItem.length != (rowNum+1) ) {
              // last item in current row -> use the full remaining width
              imageWidth=areaWidth-lastPosX-borderWidth;
            }
            else {
              // very last item (on the last row)
              if( (lastPosX + gutterWidth + imageWidth + borderWidth ) > areaWidth ) {
                // reduce size if image is wider as the remaining space
                imageWidth=areaWidth-lastPosX-borderWidth;
              }
            }
          }
          
          var rh=parseInt(rowHeight[rowNum]);
          imageWidth=parseInt(imageWidth);

          // thumbnail image size
          curTn.resizedContentWidth=imageWidth;
          curTn.resizedContentHeight=rh;
          // thumbnail position and size
          curTn.width=imageWidth+borderWidth;
          curTn.height=rh+G.tn.labelHeight.get()+borderHeight;
          curTn.row=rowNum;

          curTn.top=curPosY;
          var x=lastPosX;
          if( G.O.RTL) {
            x=areaWidth - lastPosX - curTn.width ;
          }
          curTn.left=x;

          lastPosX+=curTn.width+gutterWidth;

          if( i == rowLastItem[rowNum] ) {
            // start a new row
            curPosY+=curTn.height+gutterHeight;
            G.GOM.lastFullRow=rowNum-1;
            rowNum++;
            lastPosX=0;
          }
          cnt++;
        }
        else {
          return false;
        }
      }
      
      if( false ) {
        var newTop=0;
        if( typeof GOMidx !== 'undefined' ) {
          // gallery hover effect --> experimental / not used
          if( G.GOM.albumIdx != -1 ) {
            var hoveredTn=G.GOM.items[GOMidx];
            var item=G.I[hoveredTn.thumbnailIdx];
            
            // hovered thumbnail
            hoveredTn.width+=40;
            hoveredTn.height+=40;
            // todo : left
            
            for( var i=0; i < nbTn ; i++ ) {
              var curTn=G.GOM.items[i];
              if( curTn.imageWidth > 0 ) {
                if( curTn.row == hoveredTn.row ) {
                  // hovered row
                  newTop=40;
                  if( hoveredTn.thumbnailIdx != curTn.thumbnailIdx ) {
                    // not hovered thumbnail
                    // curTn.resizedContentWidth+=10;
                    // curTn.resizedContentHeight+=20;
                    // curTn.width+=10;
                    curTn.top+=30;
                    curTn.width-=20;
                    curTn.height-=20;
                  }
                }
                else {
                  // not hovered row
                  if( curTn.row == 0 ) {
                    // first row
                  }
                  else {
                    curTn.top+=newTop;
                  }
                }
              }
            }
          }
        }
      }
      
      G.GOM.displayArea.width=areaWidth;
      return true;
    }    
    

    //----- GRID LAYOUT
    function GallerySetLayoutGrid() {
      var curPosX=      0,
      curPosY=          0,   
      areaWidth=        G.GOM.cache.areaWidth,
      gutterWidth=      0,
      gutterHeight=     G.tn.opt.Get('gutterHeight'),
      maxCol=           NbThumbnailsPerRow(areaWidth),
      w=                0,
      cols=             [],
      curCol=           0,
      newAreaWidth =    areaWidth,
      tnWidth=          G.tn.defaultSize.getOuterWidth(),
      tnHeight=         G.tn.defaultSize.getOuterHeight()+G.tn.labelHeight.get();
      var nbTn=         G.GOM.items.length;
      
      // retrieve gutter width
      if( G.O.thumbnailAlignment == 'justified' ) {
        maxCol=Math.min(maxCol,nbTn);
        gutterWidth=(maxCol==1?0:(areaWidth-(maxCol*tnWidth))/(maxCol-1));
      }
      else {
        gutterWidth=G.tn.opt.Get('gutterWidth');
      }

      if( G.O.RTL ) {
        // first loop to retrieve the real used width of the area
        for( var i= 0 ; i < nbTn ; i++ ) {
          if( curPosY != 0 ) {
            break;
          }
          else {
            curPosX=curCol*(tnWidth+gutterWidth);
            cols[curCol]=curPosX;
            w=curPosX;
          }
          
          curCol++;
          if( curCol >= maxCol ){
            curCol=0;
            curPosY+=tnHeight+gutterHeight;
          }
        }
        newAreaWidth=w+tnWidth;
        curPosY=0;
        curCol=0;
      }
      
      G.GOM.lastFullRow=0;    // display at leat 1 row (even if not full)
      var lastPosY=0;
      var row=0;
      for( var i=0; i < nbTn ; i++ ) {
        if( curPosY == 0 ) {
          curPosX=curCol*(tnWidth+gutterWidth)
          cols[curCol]=curPosX;
          w=curPosX + tnWidth;
        }
        else {
          curPosX=cols[curCol];
        }

        var x=curPosX;
        if( G.O.RTL ) {
          x=parseInt(newAreaWidth)-curPosX-tnWidth;
        }
        
        // MANDATORY : set thumbnail position AND size
        var curTn=G.GOM.items[i];
        curTn.top=curPosY;
        curTn.left=x;
        curTn.height=tnHeight;
        curTn.width=tnWidth;
        curTn.row=row;
        lastPosY=curPosY;

        curCol++;
        if( curCol >= maxCol ){
          curCol=0;
          curPosY+=tnHeight+gutterHeight;
          G.GOM.lastFullRow=row;
          row++;
        }
      }
      G.GOM.displayArea.width=w;
      return true;
    }


    //----- Display the thumbnails according to the calculated layout
    function GalleryDisplayPart1( forceTransition ) {
      if( G.CSStransformName == null ) {
        G.$E.conTn.css( 'left' , '0px');
      }
      else {
        G.$E.conTn.css( G.CSStransformName , 'none');
      }
      
      G.GOM.cache.viewport=getViewport();
      G.GOM.cache.areaWidth=G.$E.conTnParent.width();
      
      // var containerOffset=G.$E.conTnParent.offset();
      G.GOM.cache.containerOffset=G.$E.conTnParent.offset();
    }
    
    function GalleryDisplayPart2( forceTransition ) {

      var nbTn=G.GOM.items.length;
      G.GOM.itemsDisplayed=0;
      var threshold = 50;
      var cnt=0;    // counter for delay between each thumbnail display
      

      GalleryRenderGetInterval();
      
      for( var i=0; i < nbTn ; i++ ) {
        var curTn=G.GOM.items[i];
        if( i >= G.GOM.displayInterval.from && cnt < G.GOM.displayInterval.len ) {
          curTn.inDisplayArea=true;
          if( forceTransition ) {
            curTn.neverDisplayed=true;
          }
          G.GOM.itemsDisplayed++;
          cnt++;
        }
        else{
          curTn.inDisplayArea=false;
        }
      }

      // bottom of the gallery (pagination, more button...)
      GalleryBottomManage();

      var tnToDisplay = [];
      var tnToReDisplay = [];
      
      G.GOM.clipArea.top=-1;
      cnt=0;
      var lastTnIdx=-1;
      G.GOM.clipArea.height=0;
      // NOTE: loop always the whole GOM.items --> in case an already displayed thumbnail needs to be removed
      for( var i=0; i < nbTn ; i++ ) {
        var curTn=G.GOM.items[i];
        if( curTn.inDisplayArea ) {
          if( G.GOM.clipArea.top == - 1 ) {
            G.GOM.clipArea.top=curTn.top;
          }
          G.GOM.clipArea.height=Math.max(G.GOM.clipArea.height, curTn.top-G.GOM.clipArea.top+curTn.height);
        
          if( curTn.neverDisplayed ) {
            // thumbnail is not displayed -> check if in viewport to display or not
            var top=G.GOM.cache.containerOffset.top+(curTn.top-G.GOM.clipArea.top);
            // var left=containerOffset.left+curTn.left;
            if( (top+curTn.height) >= (G.GOM.cache.viewport.t-threshold) && top <= (G.GOM.cache.viewport.t+G.GOM.cache.viewport.h+threshold) ) {
              // build thumbnail
              var item=G.I[curTn.thumbnailIdx];
              if( item.$elt == null ) {
                ThumbnailBuild( item, curTn.thumbnailIdx, i, (i+1)==nbTn );
              }
              tnToDisplay.push({idx:i, delay:cnt});
              cnt++;
            }
          }
          else {
            tnToReDisplay.push({idx:i, delay:0});
          }
          // G.GOM.itemsDisplayed++;
          lastTnIdx=i;
        }
        else {
          curTn.displayed=false;
          var item=G.I[curTn.thumbnailIdx];
          if( item.$elt != null ){
            item.$elt.css({ opacity: 0, display: 'none' });
          }
        }
      }

      var areaWidth=G.$E.conTnParent.width();

      // set gallery area really used size
      // if( G.GOM.displayArea.width != G.GOM.displayAreaLast.width || G.GOM.displayArea.height != G.GOM.displayAreaLast.height ) {
      if( G.GOM.displayArea.width != G.GOM.displayAreaLast.width || G.GOM.clipArea.height != G.GOM.displayAreaLast.height ) {
        G.$E.conTn.width(G.GOM.displayArea.width).height(G.GOM.clipArea.height);
        G.GOM.displayAreaLast.width=G.GOM.displayArea.width;
        G.GOM.displayAreaLast.height=G.GOM.clipArea.height;
        // G.GOM.displayAreaLast.height=G.GOM.displayArea.height-G.GOM.clipArea.top;
      }

      if( areaWidth != G.$E.conTnParent.width() ) {
        // gallery area width changed since layout calculation (for example when a scrollbar appeared)
        // so we need re-calculate the layout before displaying the thumbnails
        G.GOM.cache.areaWidth=G.$E.conTnParent.width();
        GallerySetLayout();
        GalleryDisplayPart1( forceTransition );
        GalleryDisplayPart2( forceTransition );
        return;
      }

      // counter of not displayed images (is displayed on the last thumbnail)
      if( G.layout.support.rows ) {
        if( G.galleryDisplayMode.Get() == 'ROWS' || (G.galleryDisplayMode.Get() == 'FULLCONTENT' && G.galleryLastRowFull.Get() && G.GOM.lastFullRow != -1) ){
          if( lastTnIdx < (nbTn-1) ) {
            G.GOM.lastDisplayedIdxNew=lastTnIdx;
          }
          else {
            G.GOM.lastDisplayedIdxNew=-1;
          }
          // remove last displayed counter
          if( G.GOM.lastDisplayedIdx != -1 ) {
            var item=G.I[G.GOM.items[G.GOM.lastDisplayedIdx].thumbnailIdx];
            item.$getElt('.nGY2GThumbnailIconsFullThumbnail').html('');
          }
        }
      }

      
      // batch set position (and display animation) to all thumbnails
      // first display newly built thumbnails
      var nbBuild=tnToDisplay.length;
      for( var i=0; i < nbBuild ; i++ ) {
        // ThumbnailSetPosition(tnToDisplay[i].idx, tnToDisplay[i].delay+10);
        ThumbnailSetPosition(tnToDisplay[i].idx, i);
      }
      // then re-position already displayed thumbnails
      var n=tnToReDisplay.length;
      for( var i=0; i < n ; i++ ) {
        // ThumbnailSetPosition(tnToReDisplay[i].idx, nbBuild+1);
        ThumbnailSetPosition(tnToReDisplay[i].idx, i);
      }

      if( G.tn.opt.Get('displayTransition') == 'NONE' ) {
        G.galleryResizeEventEnabled=true;
        TriggerCustomEvent('galleryDisplayed');
      }
      else {
        setTimeout(function() {
          // change value after the end of the display transistion of the newly built thumbnails
          G.galleryResizeEventEnabled=true;
          // GalleryLastThumbnailSlideImage();  -- EXPERIMENTAL
          TriggerCustomEvent('galleryDisplayed');
        }, nbBuild * G.tn.opt.Get('displayInterval'));
      }
      
    }
    
    
    // Thumbnail: set the new position
    function ThumbnailSetPosition( GOMidx, cnt ) {
      var newTop=   0;
      var curTn=    G.GOM.items[GOMidx];
      var idx=      G.GOM.items[GOMidx].thumbnailIdx;
      var item=     G.I[idx];
    
      if( curTn.neverDisplayed ) {
        // thumbnail is built but has never been displayed (=first display)
        var top=curTn.top-G.GOM.clipArea.top;
        if( G.tn.opt.Get('stacks') > 0 ) {
          // we have stacks -> do not display them here. They will be displayed at the end of the display animation
          item.$elt.last().css({ display: 'block'});
          item.$elt.css({ top: top , left: curTn.left });
        }
        else {
          item.$elt.css({ display: 'block', top: top , left: curTn.left });
        }
        newTop=top;
        
        // display the image of the thumbnail when fully loaded
        if( G.O.thumbnailWaitImageLoaded === true ) {
          var gi_imgLoad = ngimagesLoaded( item.$getElt('.nGY2TnImg') );
          gi_imgLoad.on( 'progress', function( instance, image ) {
            if( image.isLoaded ) {
              var idx=image.img.getAttribute('data-idx');
              var albumIdx=image.img.getAttribute('data-albumidx');
              if( albumIdx == G.GOM.albumIdx ) {
                // ignore event if not on current album
                G.I[idx].ThumbnailImageReveal();
              }
            }
          });
        }
        // display the thumbnail
        ThumbnailAppear(GOMidx, cnt);

        curTn.displayed=true;
        curTn.neverDisplayed=false;
      }
      else {
        var topOld=G.GOM.cache.containerOffset.top+item.top;
        var top=G.GOM.cache.containerOffset.top+(curTn.top-G.GOM.clipArea.top);
        newTop=curTn.top-G.GOM.clipArea.top;
        var vp=G.GOM.cache.viewport;
        if( G.O.thumbnailDisplayOutsideScreen || ( ( (topOld+curTn.height) >= (vp.t-vp.h) && topOld <= (vp.t+vp.h*2) ) ||
              ( (top+curTn.height) >= (vp.t-vp.h) && top <= (vp.t+vp.h*2) ) )  ) {
          // thumbnail positioned in enlarged viewport (viewport + 2 x viewport height)
          if( curTn.displayed ) {
            // thumbnail is displayed
            if( item.top != curTn.top || item.left != curTn.left ) {
              // set position
              if( G.O.galleryResizeAnimation == true ) {
                // with transition
                var tweenable = new NGTweenable();
                tweenable.tween({
                  from:       { top: item.top, left: item.left, height: item.height, width: item.width },
                  to:         { top: newTop, left: curTn.left, height: curTn.height, width: curTn.width },
                  attachment: { $e: item.$elt },
                  duration:   300,
                  delay:      cnt * G.tn.opt.Get('displayInterval'),
                  easing:     'easeOutQuart',
                  step:       function (state, att) {
                    att.$e.css(state);
                  },
                  finish:     function (state, att) {
                    att.$e.css(state);
                    this.dispose();
                  }
                });
              }
              else {
                // set position without transition
                // item.$elt.css({ top: curTn.top , left: curTn.left });
                item.$elt.css({ top: newTop , left: curTn.left });
              }
            }
          }
          else {
            // re-display thumbnail
            curTn.displayed=true;
            // item.$elt.css({ display: 'block', top: curTn.top , left: curTn.left, opacity:1 });
            item.$elt.css({ display: 'block', top: newTop, left: curTn.left, opacity: 1 });
            ThumbnailAppearFinish(item);
          }
        }
        else {
          // undisplay thumbnail if not in viewport+margin --> performance gain
          curTn.displayed=false;
          item.$elt.css({ display: 'none'});
        }
      }
      item.left=curTn.left;
      item.top=newTop;
      
      // set new size if changed
      if( item.width != curTn.width || item.height != curTn.height ) {
        item.$elt.css({ width: curTn.width , height: curTn.height });
        item.width=curTn.width;
        item.height=curTn.height;
        
        // if( curTn.resizedContentWidth > 0 ) {
        // resize also the content (=image)
        if( item.resizedContentWidth != curTn.resizedContentWidth || item.resizedContentHeight != curTn.resizedContentHeight ) {
          if( item.kind == 'albumUp' ) {
            // item.$getElt('.nGY2GThumbnailAlbumUp').css({'height': curTn.resizedContentHeight, 'width': curTn.resizedContentWidth});
          }
          else {
            item.$getElt('.nGY2GThumbnailImg').css({'height': curTn.resizedContentHeight, 'width': curTn.resizedContentWidth});
            item.$getElt('.nGY2GThumbnailImage').css({'height': curTn.resizedContentHeight, 'width': curTn.resizedContentWidth});
          }
          item.resizedContentWidth=curTn.resizedContentWidth;
          item.resizedContentHeight=curTn.resizedContentHeight;
        }
      }
      
      
      // add counter of remaining (not displayed) images 
      if( G.GOM.lastDisplayedIdxNew == GOMidx &&  G.layout.support.rows ) {
        if( (G.galleryDisplayMode.Get() == 'ROWS' && G.galleryMaxRows.Get() > 0) || (G.galleryDisplayMode.Get() == 'FULLCONTENT' && G.galleryLastRowFull.Get() && G.GOM.lastFullRow != -1) ){
          // number of items
          var nb=G.GOM.items.length - GOMidx -1;
          if( item.albumID != '0' && G.O.thumbnailLevelUp ) {
            nb--;
          }
        }
        if( G.O.thumbnailOpenImage && nb > 0 ) {
          item.$getElt('.nGY2GThumbnailIconsFullThumbnail').html('+'+nb);
        }
        G.GOM.lastDisplayedIdx=GOMidx;
      }

    }
    
    // replace image on last thumbnails with not displayed ones (mode ROWS or FULLCONTENT with latsLineFull)
    // TODO - experimental
    function GalleryLastThumbnailSlideImage() {
      G.GOM.thumbnailAutoSlideIdx=G.GOM.lastDisplayedIdx;
      GalleryLastThumbnailSlideImage2();
    }
    
    function GalleryLastThumbnailSlideImage2() {
      
      G.GOM.thumbnailAutoSlideIdx++;
      if( G.GOM.thumbnailAutoSlideIdx >= G.GOM.items.length ) {
        G.GOM.thumbnailAutoSlideIdx=G.GOM.lastDisplayedIdx;
      }
      var idx=      G.GOM.items[G.GOM.lastDisplayedIdx].thumbnailIdx;
      var item=     G.I[idx];
      console.dir(G.GOM.items[G.GOM.thumbnailAutoSlideIdx]);      
      if( item.$getElt('.nGY2TnImg') != null ) {
        console.dir(G.I[G.GOM.items[G.GOM.thumbnailAutoSlideIdx].thumbnailIdx].thumbImg().src);
        item.$getElt('.nGY2TnImg').attr('src',G.I[G.GOM.items[G.GOM.thumbnailAutoSlideIdx].thumbnailIdx].thumbImg().src);
      }
        setTimeout(function(){ GalleryLastThumbnailSlideImage2( false ) }, 3000);
    }
    
    
   
    
    // Compute the height of the annotation part of a thumbnail (title+description, both single line)
    function ThumbnailGetAnnotationHeight() {
      var newElt= [],
      newEltIdx=  0;

      // if( G.O.thumbnailLabel.get('display') == false && G.tn.toolbar.getWidth(item) <= 0 ) {
      if( G.O.thumbnailLabel.get('display') == false  ) {
        return 0;
      }
      
      var desc='';
      if( G.O.thumbnailLabel.get('displayDescription') == true ) {
        desc='aAzZjJ';
      }

      // visibility set to hidden
      newElt[newEltIdx++] = '<div class="nGY2GThumbnail '+G.O.theme+'" style="display:block;visibility:hidden;position:absolute;top:-9999px;left:-9999px;" ><div class="nGY2GThumbnailSub">';
      if( G.O.thumbnailLabel.get('display') == true ) {
        // Labels: title and description
        newElt[newEltIdx++] = '  <div class="nGY2GThumbnailLabel" '+ G.tn.style.getLabel() +'>';
        newElt[newEltIdx++] = '    <div class="nGY2GThumbnailAlbumTitle" '+G.tn.style.getTitle()+'>aAzZjJ</div>';
        newElt[newEltIdx++] = '    <div class="nGY2GThumbnailDescription" '+G.tn.style.getDesc()+'>'+desc+'</div>';
        newElt[newEltIdx++] = '  </div>';
      }
      
      newElt[newEltIdx++]='</div></div>';
    
      var $newDiv = jQuery(newElt.join('')).appendTo(G.$E.conTn);
      var h = $newDiv.find('.nGY2GThumbnailLabel').outerHeight(true);
      $newDiv.remove();

      return h;
    }
    
    function ThumbnailBuildStacks( bgColor ) {
      var ns=G.tn.opt.Get('stacks');
      if( ns == 0 ) { return ''; }
     
      var s='';
      for( var i=0; i<ns; i++ ) {
        s='<div class="nGY2GThumbnailStack " style="display:none;'+bgColor+'"></div>'+s;
      }
      return s;
    }
    
    //----- Build one UP thumbnail (=navigation thumbnail)
    function ThumbnailBuildAlbumpUp( item, idx, GOMidx ) {
      var newElt= [],
      newEltIdx=  0;
      
      var mp='';
      if( G.O.thumbnailOpenImage === false ) {
        mp='cursor:default;'
      }
      
      newElt[newEltIdx++]=ThumbnailBuildStacks('')+'<div class="nGY2GThumbnail" style="display:none;opacity:0;'+mp+'" >';
      newElt[newEltIdx++]='  <div class="nGY2GThumbnailSub">';

      var h=G.tn.defaultSize.getHeight(),
      w=G.tn.defaultSize.getWidth();

      newElt[newEltIdx++]='    <div class="nGY2GThumbnailImage" style="width:'+w+'px;height:'+h+'px;"><img class="nGY2GThumbnailImg" src="'+G.emptyGif+'" alt="" style="max-width:'+w+'px;max-height:'+h+'px;" ></div>';
      // newElt[newEltIdx++]='    <div class="nGY2GThumbnailAlbumUp" style="width:'+w+'px;height:'+h+'px;">'+G.O.icons.thumbnailAlbumUp+'</div>';
      newElt[newEltIdx++]='    <div class="nGY2GThumbnailAlbumUp" >'+G.O.icons.thumbnailAlbumUp+'</div>';
      newElt[newEltIdx++]='  </div>';
      newElt[newEltIdx++]='</div>';
      
      var $newDiv =jQuery(newElt.join('')).appendTo(G.$E.conTn); //.animate({ opacity: 1},1000, 'swing');  //.show('slow'); //.fadeIn('slow').slideDown('slow');
      
      item.$elt=$newDiv;
      $newDiv.data('index',GOMidx);
      item.$getElt('.nGY2GThumbnailImg').data('index',GOMidx);
      
      return;
    }

    
    //----- Build one thumbnail
    function ThumbnailBuild( item, idx, GOMidx, lastOne ) {
      item.eltTransform=  [];
      item.eltFilter=     [];
      item.hoverInitDone= false;
      item.$Elts=         [];

      if( item.kind == 'albumUp' ) {
        ThumbnailBuildAlbumpUp( item, idx, GOMidx);
        return;
      }

      var newElt=[],
      newEltIdx=0;

      var mp='';
      if( G.O.thumbnailOpenImage === false ) {
        mp='cursor:default;'
      }

      
      var src=item.thumbImg().src,
      sTitle=getThumbnailTitle(item),
      sDesc=getTumbnailDescription(item);

      // dominant colorS (blurred preview image)
      var imgBlurred=G.emptyGif;
      if( item.imageDominantColors != null ) {
        imgBlurred=item.imageDominantColors;
      }
      // dominant color -> background color
      var bg=''
      if( item.imageDominantColor != null ) {
        bg='background:'+item.imageDominantColor+';';
      }
      
      var op='opacity:1;';
      if( G.O.thumbnailWaitImageLoaded == true ) {
        op='opacity:0;';
      }

      newElt[newEltIdx++]=ThumbnailBuildStacks(bg)+'<div class="nGY2GThumbnail" style="display:none;opacity:0;'+mp+'"><div class="nGY2GThumbnailSub '+(G.O.thumbnailSelectable && item.selected?"nGY2GThumbnailSubSelected":"")+'">';
      
      // image
      switch( G.layout.engine ) {
        case 'CASCADING':
          // fixed width
          newElt[newEltIdx++]='<div class="nGY2GThumbnailImage" style="width:'+G.tn.settings.getW()+'px;'+bg+'">';
          newElt[newEltIdx++]='  <img class="nGY2GThumbnailImg nGY2TnPreview" src="'+imgBlurred+'" style="max-width:'+G.tn.settings.getW()+'px;">';
          newElt[newEltIdx++]='  <img class="nGY2GThumbnailImg nGY2TnImg" src="'+src+'" alt="'+sTitle+'" style="max-width:'+G.tn.settings.getW()+'px;'+op+'" data-idx="'+idx+'" data-albumidx="'+G.GOM.albumIdx+'">';
          newElt[newEltIdx++]='</div>';
          break;
        case 'JUSTIFIED':
          // fixed height
          newElt[newEltIdx++]='<div class="nGY2GThumbnailImage" style="height:'+G.tn.settings.getH()+'px;'+bg+'">';
          newElt[newEltIdx++]='  <img class="nGY2GThumbnailImg nGY2TnPreview" src="'+imgBlurred+'" >';
          newElt[newEltIdx++]='  <img class="nGY2GThumbnailImg nGY2TnImg" src="'+src+'" alt="'+sTitle+'" style="'+op+'" data-idx="'+idx+'" data-albumidx="'+G.GOM.albumIdx+'">';
          newElt[newEltIdx++]='</div>';
          break;
        default:    // GRID
          // fixed width and height
          var imgSize='max-width:'+G.tn.settings.getW()+'px;max-height:'+G.tn.settings.getH()+'px;'
          var imgBWidth='';          
          
          if( G.tn.opt.Get('crop') == true && item.thumbImg().height > 0 && item.thumbImg().width > 0 ) {
            // crop images => no black border
            if( item.thumbImg().height > item.thumbImg().width ) {
              // portrait
              imgSize='width:'+G.tn.settings.getW()+'px;';
            }
            else {
              // paysage

              // step 1: adjust height
              var r2=G.tn.settings.getH()/item.thumbImg().height;
              
              var newH= G.tn.settings.getH();
              var newW= item.thumbImg().width*r2;
              
              // step 2: check if width needs to be adjusted
              if( newW >= G.tn.settings.getW() ) {
                // no adjustement
                var d=-(item.thumbImg().width*r2-G.tn.settings.getW()) / 2;
                imgSize='height:'+G.tn.settings.getH()+'px;left:'+d+'px;';
                imgBWidth='width:'+item.thumbImg().width+'px;';     // set the width of the blurred preview image
              }
              else {
                // yes, adjust width
                // after scaling to adjust the height, the width is too narrow => upscale again to fit width
                var rW=G.tn.settings.getW()/item.thumbImg().width;
                var w=item.thumbImg().width*rW;
                imgSize='width:'+w+'px;';
              }
            }
          }
          newElt[newEltIdx++]='<div class="nGY2GThumbnailImage" style="width:'+G.tn.settings.getW()+'px;height:'+G.tn.settings.getH()+'px;'+bg+'">';
          newElt[newEltIdx++]='  <img class="nGY2GThumbnailImg nGY2TnPreview" src="'+imgBlurred+'"  style="'+imgSize+imgBWidth+'">';
          newElt[newEltIdx++]='  <img class="nGY2GThumbnailImg nGY2TnImg" src="'+src+'" alt="'+sTitle+'" style="'+imgSize+op+'" data-idx="'+idx+'" data-albumidx="'+G.GOM.albumIdx+'" >';
          newElt[newEltIdx++]='</div>';
          break;
      }

      // layer for user customization purposes
      newElt[newEltIdx++]='<div class="nGY2GThumbnailCustomLayer"></div>';

      // annotation (=area for labels + icons)
      if( G.O.thumbnailLabel.get('display') == true ) {
        // Labels: title and description
        newElt[newEltIdx++]= '  <div class="nGY2GThumbnailLabel" '+ G.tn.style.getLabel(item) +'>';
        if( item.kind == 'album' ) {
          newElt[newEltIdx++]= '    <div class="nGY2GThumbnailTitle nGY2GThumbnailAlbumTitle" ' + G.tn.style.getTitle() + '>' + G.O.icons.thumbnailAlbum + sTitle + '</div>';
        }
        else {
          newElt[newEltIdx++]= '    <div class="nGY2GThumbnailTitle nGY2GThumbnailImageTitle" ' + G.tn.style.getTitle() + '>' + G.O.icons.thumbnailImage + sTitle + '</div>';
        }
        newElt[newEltIdx++]= '    <div class="nGY2GThumbnailDescription" ' + G.tn.style.getDesc() + '>' + sDesc + '</div>';
        newElt[newEltIdx++]= '  </div>';
      }

      // Tool layer
      newElt[newEltIdx++]=ThumbnailBuildTools(item, lastOne);
      
      newElt[newEltIdx++]='</div>';
      newElt[newEltIdx++]='</div>';
      
      var $newDiv =jQuery(newElt.join('')).appendTo(G.$E.conTn);

      item.$elt=$newDiv;
      $newDiv.data('index',GOMidx);
      item.$getElt('.nGY2GThumbnailImg').data('index',GOMidx);

      
      // Custom init function
      if( G.O.fnThumbnailInit !== null ) {
        if( typeof G.O.fnThumbnailInit == 'function' ) {
          G.O.fnThumbnailInit($newDiv, item, GOMidx);
        }
        else {
          // defined in markup
          window[G.O.fnThumbnailInit]($newDiv, item, GOMidx);
        }
      }

      if( item.title != 'image gallery by nanogallery2 [build]' ) {
        ThumbnailOverInit(GOMidx);
      }
      
      return ;
    }

    
    // Thumbnail layer for tools (toolbars and counter)
    function ThumbnailBuildTools( item, lastThumbnail ) {
    
      // toolbars
      var tb=ThumbnailBuildToolbarOne(item, 'topLeft');
      tb+=ThumbnailBuildToolbarOne(item, 'topRight');
      tb+=ThumbnailBuildToolbarOne(item, 'bottomLeft');
      tb+=ThumbnailBuildToolbarOne(item, 'bottomRight');
      
      // counter of not displayed images
      tb+='<div class="nGY2GThumbnailIconsFullThumbnail"></div>';

      return tb;
    
    }
    
    function ThumbnailBuildToolbarOne( item, position ) {
      var toolbar = '';
      var tb =      G.tn.toolbar.get(item);
      var width =   { xs:0, sm:1, me:2, la:3, xl:4 };
      var cnt =     0;
      
      if( tb[position] != '' ) {
        var pos='top:0; right:0; text-align:right;';     // 'topRight' and default
        switch( position ) {
          case 'topLeft':
            pos='top:0; left:0; text-align:left;:';
            break;
          case 'bottomRight':
            pos='bottom:0; right:0; text-align:right;';
            break;
          case 'bottomLeft':
            pos='bottom:0; left:0; text-align:left;';
            break;
        }
        
        toolbar+= '  <ul class="nGY2GThumbnailIcons" style="'+pos+'">';
        
        var icons=tb[position].split(',');
        var nb=icons.length;
        for( var i=0; i<nb; i++ ) {
          var icon=icons[i].replace(/^\s*|\s*$/, '');   //trim trailing/leading whitespace

          var minWidth=icon.substring(0,2).toLowerCase();
          var tIcon=icon;
          var display=true;
          if( /xs|sm|me|la|xl/i.test(minWidth) ) {
            // check visbility (depending on screen width)
            if( width[minWidth] > width[G.GOM.curWidth] ) {
              display=false;
            }
            tIcon=icon.substring(2);
          }
          
          if( display ) {
            var sp=(i+1<nb ? '&nbsp;' :'');
            switch( tIcon ) {
              case 'COUNTER':
                if( item.kind == 'album' ) {
                  toolbar+= '    <li class="nGY2GThumbnailIcon" data-ngy2action="">';
                  toolbar+= '      <div class="nGY2GThumbnailIconImageCounter"></div>';
                  toolbar+= '      <div class="nGY2GThumbnailIconText">'+G.O.icons.thumbnailCounter+Math.max((item.getContentLength(false)),item.numberItems)+sp+'</div>';
                  toolbar+= '    </li>';
                  cnt++;
                }
                break;
              case 'COUNTER2':
                if( item.kind == 'album' ) {
                  toolbar+= '    <li class="nGY2GThumbnailIcon" data-ngy2action="">';
                  toolbar+= '      <div class="nGY2GThumbnailIconTextBadge">'+G.O.icons.thumbnailCounter+Math.max((item.getContentLength(false)),item.numberItems)+sp+'</div>';
                  toolbar+= '    </li>';
                  cnt++;
                }
                break;
              case 'SHARE':
                toolbar+= '    <li class="nGY2GThumbnailIcon" data-ngy2action="'+tIcon+'">';
                toolbar+= '      <div>'+G.O.icons.thumbnailShare+'</div>';
                //toolbar+= '      <div class="nGY2GThumbnailIconText">'+sp+'</div>';
                toolbar+= '    </li>';
                cnt++;
                break;
              case 'DOWNLOAD':
                toolbar+= '    <li class="nGY2GThumbnailIcon" data-ngy2action="'+tIcon+'">';
                toolbar+= '      <div>'+G.O.icons.thumbnailDownload+'</div>';
                toolbar+= '    </li>';
                cnt++;
                break;
              case 'INFO':
                toolbar+= '    <li class="nGY2GThumbnailIcon" data-ngy2action="'+tIcon+'">';
                toolbar+= '      <div>'+G.O.icons.thumbnailInfo+'</div>';
                toolbar+= '    </li>';
                cnt++;
                break;
              case 'CART':
                toolbar+= '    <li class="nGY2GThumbnailIcon" data-ngy2action="'+tIcon+'">';
                toolbar+= '      <div>'+G.O.icons.thumbnailCart+'</div>';
                toolbar+= '    </li>';
                cnt++;
                break;
              case 'DISPLAY':
                toolbar+= '    <li class="nGY2GThumbnailIcon" data-ngy2action="DISPLAY">';
                toolbar+= '      <div class="nGY2GThumbnailIconImageShare">'+G.O.icons.thumbnailDisplay+'</div>';
                toolbar+= '    </li>';
                cnt++;
                break;
              case 'CUSTOM1':
              case 'CUSTOM2':
              case 'CUSTOM3':
              case 'CUSTOM4':
              case 'CUSTOM5':
              case 'CUSTOM6':
              case 'CUSTOM7':
              case 'CUSTOM8':
              case 'CUSTOM9':
              case 'CUSTOM10':
                var cust = tIcon.replace('CUSTOM', '');
                toolbar+= '    <li class="nGY2GThumbnailIcon" data-ngy2action="'+tIcon.toLowerCase()+'">';
                toolbar+= '      <div class="nGY2GThumbnailIconImageShare">'+G.O.icons['thumbnailCustomTool'+cust]+'</div>';
                toolbar+= '    </li>';
                cnt++;
                break;
              case 'FEATURED':
                if( item.featured === true ) {
                  toolbar+= '    <li class="nGY2GThumbnailIcon" data-ngy2action="">';
                  toolbar+= '      <div class="nGY2GThumbnailIconImageFeatured">'+G.O.icons.thumbnailFeatured+'</div>';
                  toolbar+= '    </li>';
                  cnt++;
                }
                break;
              case 'SELECT':
                if( G.O.thumbnailSelectable == true ) {
                  toolbar+= '    <li class="nGY2GThumbnailIcon" data-ngy2action="TOGGLESELECT">';
                  if( item.selected === true ) {
                    toolbar+= '      <div class="nGY2GThumbnailIconImageSelect nGY2ThumbnailSelected">'+G.O.icons.thumbnailSelected+'</div>';
                  }
                  else {
                    toolbar+= '      <div class="nGY2GThumbnailIconImageSelect nGY2ThumbnailUnselected">'+G.O.icons.thumbnailUnselected+'</div>';
                  }
                  toolbar+= '    </li>';
                  cnt++;
                }
                break;
            }
          }
        }
        toolbar+= '  </ul>';
      }
      
      if( cnt > 0 ) {
        return toolbar;
      }
      else {
        return '';
      }
    }
    
    function getThumbnailTitle( item ) {
    
      var sTitle=item.title;
      if( G.O.thumbnailLabel.get('display') == true ) {
        if( sTitle === undefined || sTitle.length == 0 ) { sTitle='&nbsp;'; }

        if( G.i18nTranslations.thumbnailImageTitle != '' ) {
          sTitle=G.i18nTranslations.thumbnailImageTitle;
        }
        if( G.O.thumbnailLabel.get('titleMaxLength') > 3 && sTitle.length > G.O.thumbnailLabel.get('titleMaxLength') ){
          sTitle=sTitle.substring(0,G.O.thumbnailLabel.get('titleMaxLength'))+'...';
        }
      }
      
      return sTitle;
    }

    function getTumbnailDescription( item ) {
      var sDesc='';
      if( G.O.thumbnailLabel.get('displayDescription') == true ) { 
        if( item.kind == 'album' ) {
          if( G.i18nTranslations.thumbnailImageDescription != '' ) {
            sDesc=G.i18nTranslations.thumbnailAlbumDescription;
          }
          else {
            sDesc=item.description;
          }
        }
        else {
          if( G.i18nTranslations.thumbnailImageDescription != '' ) {
            sDesc=G.i18nTranslations.thumbnailImageDescription;
          }
          else {
            sDesc=item.description;
          }
        }
        if( G.O.thumbnailLabel.get('descriptionMaxLength') > 3 && sDesc.length > G.O.thumbnailLabel.get('descriptionMaxLength') ){
          sDesc=sDesc.substring(0,G.O.thumbnailLabel.get('descriptionMaxLength'))+'...';
        }
        if( sDesc.length == 0 ) {
          sDesc='&nbsp;';
        }
      }
      
      return sDesc;
    }

    
    
    // Retrieve the maximum number of thumbnails that fits in one row
    function NbThumbnailsPerRow(areaWidth) {
      var tnW=G.tn.defaultSize.getOuterWidth();
      
      var nbMaxTn=0;
      if( G.O.thumbnailAlignment == 'justified' ) {
        nbMaxTn=Math.floor((areaWidth)/(tnW));
      }
      else {
        nbMaxTn=Math.floor((areaWidth+G.tn.opt.Get('gutterWidth'))/(tnW+G.tn.opt.Get('gutterWidth')));
      }
      
      if(  G.O.maxItemsPerLine >0 && nbMaxTn >  G.O.maxItemsPerLine ) {
        nbMaxTn=G.O.maxItemsPerLine;
      }
      
      if( nbMaxTn < 1 ) { nbMaxTn=1; }
      
      return nbMaxTn
    }
  
    // Thumbnail display animation
    function ThumbnailAppear( n, cnt ) {
      var curTn=G.GOM.items[n];
      var item=G.I[G.GOM.items[n].thumbnailIdx];

    
      if( G.tn.opt.Get('displayTransition') == 'NONE' ) {
        item.$elt.css({ opacity: 1 });
        ThumbnailAppearFinish(item);
      }
      else {
        if( item.$elt == null ) { return; }
        var top=G.GOM.cache.containerOffset.top+(curTn.top-G.GOM.clipArea.top);
        var vp=G.GOM.cache.viewport;
        if( (top+(curTn.top-G.GOM.clipArea.top)) >= (vp.t-50) && top <= (vp.t+vp.h+50) ) {
          // display animation only if in the current viewport
          var delay=cnt*G.tn.opt.Get('displayInterval');
          if( G.tn.opt.Get('displayTransition') == 'CUSTOM' ) {
            if( G.GOM.curNavLevel == 'lN' ) {
              G.O.fnThumbnailDisplayEffect(item.$elt, item, n, delay);
            }
            else {
              G.O.fnThumbnailL1DisplayEffect(item.$elt, item, n, delay);
            }
          }
          else {
            ThumbnailDisplayAnim[G.tn.opt.Get('displayTransition')](item, delay);
          }
          return;
        }
        else {
          item.$elt.css({ opacity: 1 });
          ThumbnailAppearFinish(item);
        }
      }
    }
    
    
    // displays thumbnail stacks at the end of the display animation
    function ThumbnailAppearFinish( item ) {
    
      // add stacks
      var ns=G.tn.opt.Get('stacks');
      if( ns > 0 ) {
        // display stacks
        item.$elt.css({ display: 'block'});
        var o=0.9;
        // set stack opacity
        for( var i=ns-1; i>=0; i-- ) {
          item.$elt.eq(i).css('opacity', o);
          o=o-0.2;
        }

      }
    }
    


    var ThumbnailDisplayAnim = {
      RANDOMSCALE: function( item, delay ) {

        function randomIntFromInterval(min,max) {
          return Math.floor(Math.random()*(max-min+1)+min);
        }
        var scales=[0.95, 1, 1.05, 1.1];
        var zi=[1, 2, 3, 4];
        
        var r=randomIntFromInterval(0,3);
        while( r == G.GOM.lastRandomValue ) {
          r=randomIntFromInterval(0,3);
        }
        G.GOM.lastRandomValue=r;
        var f=scales[r];
        // item.$elt.css({ 'z-index': G.GOM.lastZIndex+zi[r], 'box-shadow': '-1px 2px 5px 1px rgba(0, 0, 0, 0.7)' });
        item.$elt.css({ 'z-index': G.GOM.lastZIndex+zi[r], 'box-shadow': '0px 0px 5px 3px rgba(0,0,0,0.74)' });
        
        var tweenable = new NGTweenable();
        tweenable.tween({
          from:         { scale: 0.5, opacity:0 },
          to:           { scale: f,   opacity:1 },
          attachment:   { $e:item.$elt, item: item, tw: tweenable },
          delay:        delay,
          duration:     G.tn.opt.Get('displayTransitionDuration'),
          easing:       { opacity: 'easeOutQuint', scale: G.tn.opt.Get('displayTransitionEasing') },
          step:         function (state, att) {
            if( att.item.$elt === null ) {  // the thumbnail may have been destroyed since the start of the animation
              att.tw.stop(false);
              return;
            }
            att.$e.css( G.CSStransformName , 'scale('+state.scale+')').css('opacity',state.opacity);
          },
          finish:       function (state, att) {
            if( att.item.$elt === null ) { return; }
            att.$e.css( G.CSStransformName , 'scale('+state.scale+')').css('opacity','');
            //att.$e.css( G.CSStransformName , '').css('opacity', '');
            ThumbnailAppearFinish(att.item);
          }
        });
      },
      
      SCALEUP: function( item, delay ) {
        var f=G.tn.opt.Get('displayTransitionStartVal');
        if( f == 0 ) { f=0.6; }   // default value

        var tweenable = new NGTweenable();
        tweenable.tween({
          from:         { scale: f, opacity: 0 },
          to:           { scale: 1, opacity: 1 },
          attachment:   { $e:item.$elt, item: item, tw: tweenable },
          delay:        delay,
          duration:     G.tn.opt.Get('displayTransitionDuration'),
          easing:       { opacity: 'easeOutQuint', scale: G.tn.opt.Get('displayTransitionEasing') },
          step:         function (state, att) {
            if( att.item.$elt === null ) {  // the thumbnail may have been destroyed since the start of the animation
              att.tw.stop(false);
              return;
            }
            att.$e.css( G.CSStransformName , 'scale('+state.scale+')').css('opacity',state.opacity);
          },
          finish:       function (state, att) {
            if( att.item.$elt === null ) { return; }
            att.$e.css( G.CSStransformName , '').css('opacity', '');
            ThumbnailAppearFinish(att.item);
          }
        });
      },
      
      SCALEDOWN: function( item, delay ) {
        var f=G.tn.opt.Get('displayTransitionStartVal');
        if( f == 0 ) { f=1.3; }   // default value
   
        var tweenable = new NGTweenable();
        tweenable.tween({
          from:         { scale: f, opacity: 0 },
          to:           { scale: 1, opacity: 1 },
          attachment:   { item: item, tw: tweenable },
          delay:        delay,
          duration:     G.tn.opt.Get('displayTransitionDuration'),
          easing:       { opacity: 'easeOutQuint', scale: G.tn.opt.Get('displayTransitionEasing') },
          step:         function (state, att) {
            if( att.item.$elt === null ) {  // the thumbnail may have been destroyed since the start of the animation
              att.tw.stop(false);
              return;
            }
            att.item.$elt.last().css('opacity', state.opacity);
            att.item.CSSTransformSet('.nGY2GThumbnail', 'scale', state.scale);
            att.item.CSSTransformApply('.nGY2GThumbnail');
          },
          finish:       function (state, att) {
            if( att.item.$elt === null ) { return; }
            att.item.$elt.last().css('opacity', '');
            att.item.CSSTransformSet('.nGY2GThumbnail', 'scale', state.scale);
            att.item.CSSTransformApply('.nGY2GThumbnail');
            ThumbnailAppearFinish(att.item);
          }
        });
      },
      
      SLIDEUP: function( item, delay ) {
      var f=G.tn.opt.Get('displayTransitionStartVal');
        if( f == 0 ) { f=50; }   // default value
        var tweenable = new NGTweenable();
        tweenable.tween({
          // from:         { 'opacity': 0, translateY: f, 'scale': 0.8  },
          // to:           { 'opacity': 1, translateY: 0, 'scale': 1 },
          from:         { 'opacity': 0, translateY: f },
          to:           { 'opacity': 1, translateY: 0 },
          attachment:   { item: item, tw: tweenable },
          delay:        delay,
          duration:     G.tn.opt.Get('displayTransitionDuration'),
          easing:       { opacity: 'easeOutQuint', scale: 'easeOutQuart', translateY: G.tn.opt.Get('displayTransitionEasing') },
          step:         function (state, att) {
            if( att.item.$elt === null ) {  // the thumbnail may have been destroyed since the start of the animation
              att.tw.stop(false);
              return;
            }
            att.item.$elt.css('opacity', state.opacity);
            att.item.CSSTransformSet('.nGY2GThumbnail', 'translate', '0px,'+state.translateY+'px');
            // att.item.CSSTransformSet('.nGY2GThumbnail', 'scale', state.scale);
            att.item.CSSTransformApply('.nGY2GThumbnail');
          },
          finish:       function (state, att) {
            if( att.item.$elt === null ) { return; }
            this._step(state, att);
            att.item.$elt.css('opacity', '');
            ThumbnailAppearFinish(att.item);
          }
        });
      }, 
      
      SLIDEDOWN: function( item, delay ) {
        var f=G.tn.opt.Get('displayTransitionStartVal');
        if( f == 0 ) { f=-50; }   // default value
        var tweenable = new NGTweenable();
        tweenable.tween({
          // from:         { opacity: 0, translateY: f, scale: 0.8  },
          // to:           { opacity: 1, translateY: 0, scale: 1 },
          from:         { opacity: 0, translateY: f },
          to:           { opacity: 1, translateY: 0 },
          attachment:   { item: item, tw: tweenable },
          delay:        delay,
          duration:     G.tn.opt.Get('displayTransitionDuration'),
          easing:       { opacity: 'easeOutQuint', scale: 'easeOutQuart', translateY: G.tn.opt.Get('displayTransitionEasing') },
          step:         function (state, att) {
            if( att.item.$elt === null ) {  // the thumbnail may have been destroyed since the start of the animation
              att.tw.stop(false);
              return;
            }
            att.item.$elt.css('opacity', state.opacity);
            att.item.CSSTransformSet('.nGY2GThumbnail', 'translate', '0px,'+state.translateY+'px');
            // att.item.CSSTransformSet('.nGY2GThumbnail', 'scale', state.scale); 
            att.item.CSSTransformApply('.nGY2GThumbnail');
          },
          finish:       function (state, att) {
            if( att.item.$elt === null ) { return; }
            this._step(state, att);
            att.item.$elt.css('opacity', '');
            ThumbnailAppearFinish(att.item);
          }
        });
      },

      FLIPUP: function( item, delay ) {
        var f=G.tn.opt.Get('displayTransitionStartVal');
        if( f == 0 ) { f=100; }   // default value
        var tweenable = new NGTweenable();
        tweenable.tween({
          // from:         { opacity: 0, translateX: f, rotateX: 45, scale: 0.8  },
          // to:           { opacity: 1, translateX: 0, rotateX: 0, scale: 1 },
          from:         { opacity: 0, translateY: f, rotateX: 45 },
          to:           { opacity: 1, translateY: 0, rotateX: 0  },
          attachment:   { item: item, tw: tweenable },
          delay:        delay,
          duration:     G.tn.opt.Get('displayTransitionDuration'),
          easing:       { opacity: 'easeOutQuint', scale: 'easeOutQuart', translateY: G.tn.opt.Get('displayTransitionEasing') },
          step:         function (state, att) {
            if( att.item.$elt === null ) {  // the thumbnail may have been destroyed since the start of the animation
              att.tw.stop(false);
              return;
            }
            att.item.$elt.css('opacity', state.opacity);
            att.item.CSSTransformSet('.nGY2GThumbnail', 'translate', '0px,'+state.translateY+'px');
            att.item.CSSTransformSet('.nGY2GThumbnail', 'rotateX', state.rotateX+'deg');
            // att.item.CSSTransformSet('.nGY2GThumbnail', 'scale', state.scale);
            att.item.CSSTransformApply('.nGY2GThumbnail');
          },
          finish:       function (state, att) {
            if( att.item.$elt === null ) { return; }
            this._step(state, att);
            att.item.$elt.css('opacity', '');
            ThumbnailAppearFinish(att.item);
          }
        });
      },
      FLIPDOWN: function( item, delay ) {
        var f=G.tn.opt.Get('displayTransitionStartVal');
        if( f == 0 ) { f=-100; }   // default value
        var tweenable = new NGTweenable();
        tweenable.tween({
          // from:         { opacity: 0, translateX: f, rotateX: -45, scale: 0.8  },
          // to:           { opacity: 1, translateX: 0, rotateX: 0, scale: 1 },
          from:         { opacity: 0, translateY: f, rotateX: -45 },
          to:           { opacity: 1, translateY: 0, rotateX: 0 },
          attachment:   { item: item, tw: tweenable },
          delay:        delay,
          duration:     G.tn.opt.Get('displayTransitionDuration'),
          easing:       { opacity: 'easeOutQuint', scale:'easeOutQuart', translateY: G.tn.opt.Get('displayTransitionEasing')},
          step:         function (state, att) {
            if( att.item.$elt === null ) {  // the thumbnail may have been destroyed since the start of the animation
              att.tw.stop(false);
              return;
            }
            att.item.$elt.css('opacity', state.opacity);
            att.item.CSSTransformSet('.nGY2GThumbnail', 'translate', '0px,'+state.translateY+'px');
            att.item.CSSTransformSet('.nGY2GThumbnail', 'rotateX', state.rotateX+'deg');
            // att.item.CSSTransformSet('.nGY2GThumbnail', 'scale', state.scale);
            att.item.CSSTransformApply('.nGY2GThumbnail');
          },
          finish:       function (state, att) {
            if( att.item.$elt === null ) { return; }
            this._step(state, att);
            att.item.$elt.css('opacity', '');
            ThumbnailAppearFinish(att.item);
          }
        });
      },
      
      SLIDEUP2: function( item, delay ) {
        var f=G.tn.opt.Get('displayTransitionStartVal');
        if( f == 0 ) { f=100; }   // default value
        var tweenable = new NGTweenable();
        tweenable.tween({
          // from:         { opacity: 0, translateY: f, rotateY: 40, scale: 0.8  },
          // to:           { opacity: 1, translateY: 0, rotateY: 0, scale: 1 },
          from:         { opacity: 0, translateY: f, rotateY: 40 },
          to:           { opacity: 1, translateY: 0, rotateY: 0  },
          attachment:   { item: item, tw: tweenable },
          delay:        delay,
          duration:     G.tn.opt.Get('displayTransitionDuration'),
          easing:       { opacity: 'easeOutQuint', scale:'easeOutQuart', translateY: G.tn.opt.Get('displayTransitionEasing') },
          step:         function (state, att) {
            if( att.item.$elt === null ) {  // the thumbnail may have been destroyed since the start of the animation
              att.tw.stop(false);
              return;
            }
            att.item.$elt.css('opacity', state.opacity);
            att.item.CSSTransformSet('.nGY2GThumbnail', 'translate', '0px,'+state.translateY+'px');
            att.item.CSSTransformSet('.nGY2GThumbnail', 'rotateY', state.rotateY+'deg');
            // att.item.CSSTransformSet('.nGY2GThumbnail', 'scale', state.scale);
            att.item.CSSTransformApply('.nGY2GThumbnail');
          },
          finish:       function (state, att) {
            if( att.item.$elt === null ) { return; }
            this._step(state, att);
            att.item.$elt.css('opacity', '');
            ThumbnailAppearFinish(att.item);
          }
        });
      },
      SLIDEDOWN2: function( item, delay ) {
        var f=G.tn.opt.Get('displayTransitionStartVal');
        if( f == 0 ) { f=-100; }   // default value
        var tweenable = new NGTweenable();
        tweenable.tween({
          // from:         { opacity: 0, translateY: f, rotateY: 40, scale: 0.8  },
          // to:           { opacity: 1, translateY: 0, rotateY: 0, scale: 1 },
          from:         { opacity: 0, translateY: f, rotateY: 40 },
          to:           { opacity: 1, translateY: 0, rotateY: 0  },
          attachment:   { item: item, tw: tweenable },
          delay:        delay,
          duration:     G.tn.opt.Get('displayTransitionDuration'),
          easing:       { opacity: 'easeOutQuint', scale: 'easeOutQuart', translateY: G.tn.opt.Get('displayTransitionEasing') },
          step:         function (state, att) {
            if( att.item.$elt === null ) {  // the thumbnail may have been destroyed since the start of the animation
              att.tw.stop(false);
              return;
            }
            att.item.$elt.css('opacity', state.opacity);
            att.item.CSSTransformSet('.nGY2GThumbnail', 'translate', '0px,'+state.translateY+'px');
            att.item.CSSTransformSet('.nGY2GThumbnail', 'rotateY', state.rotateY+'deg');
            // att.item.CSSTransformSet('.nGY2GThumbnail', 'scale', state.scale);
            att.item.CSSTransformApply('.nGY2GThumbnail');
          },
          finish:       function (state, att) {
            this._step(state, att);
            att.item.$elt.css('opacity', '');
            att.item.CSSTransformApply('.nGY2GThumbnail');
            ThumbnailAppearFinish(att.item);
          }
        });
      },
      SLIDERIGHT: function( item, delay ) {
        var f=G.tn.opt.Get('displayTransitionStartVal');
        if( f == 0 ) { f=-150; }   // default value
        var tweenable = new NGTweenable();
        tweenable.tween({
          from:         { opacity: 0, translateX: f },
          to:           { opacity: 1, translateX: 0 },
          attachment:   { item: item, tw: tweenable },
          delay:        delay,
          duration:     G.tn.opt.Get('displayTransitionDuration'),
          easing:       { opacity: 'easeOutQuint', translateX: G.tn.opt.Get('displayTransitionEasing') },
          step:         function (state, att) {
            if( att.item.$elt === null ) {  // the thumbnail may have been destroyed since the start of the animation
              att.tw.stop(false);
              return;
            }
            att.item.$elt.css('opacity', state.opacity);
            att.item.CSSTransformSet('.nGY2GThumbnail', 'translate', state.translateX+'px,0px');
            // att.item.CSSTransformSet('.nGY2GThumbnail', 'rotateZ', state.rotateZ+'deg');
            att.item.CSSTransformApply('.nGY2GThumbnail');
          },
          finish:       function (state, att) {
            if( att.item.$elt === null ) { return; }
            this._step(state, att);
            att.item.$elt.css('opacity', '');
            ThumbnailAppearFinish(att.item);
          }
        });
      },
      SLIDELEFT: function( item, delay ) {
        var f=G.tn.opt.Get('displayTransitionStartVal');
        if( f == 0 ) { f=150; }   // default value
        var tweenable = new NGTweenable();
        tweenable.tween({
          from:         { opacity: 0, translateX: f },
          to:           { opacity: 1, translateX: 0 },
          attachment:   { item: item, tw: tweenable },
          delay:        delay,
          duration:     G.tn.opt.Get('displayTransitionDuration'),
          easing:       { opacity: 'easeOutQuint', translateX: G.tn.opt.Get('displayTransitionEasing') },
          step:         function (state, att) {
            if( att.item.$elt === null ) {  // the thumbnail may have been destroyed since the start of the animation
              att.tw.stop(false);
              return;
            }
            att.item.$elt.css('opacity', state.opacity);
            att.item.CSSTransformSet('.nGY2GThumbnail', 'translate', state.translateX+'px,0px');
            // att.item.CSSTransformSet('.nGY2GThumbnail', 'rotateZ', state.rotateZ+'deg');
            att.item.CSSTransformApply('.nGY2GThumbnail');
          },
          finish:       function (state, att) {
            if( att.item.$elt === null ) { return; }
            this._step(state, att);
            att.item.$elt.css('opacity', '');
            ThumbnailAppearFinish(att.item);
          }
        });
      },

      FADEIN: function( item, delay ) {
        var tweenable = new NGTweenable();
        tweenable.tween({
          from:         { 'opacity': 0 },
          to:           { 'opacity': 1 },
          attachment:   { $e:item.$elt, item: item, tw: tweenable },
          delay:        delay,
          duration:     G.tn.opt.Get('displayTransitionDuration'),
          easing:       'easeInOutSine',
          step:         function (state, att) {
            if( att.item.$elt === null ) {  // the thumbnail may have been destroyed since the start of the animation
              att.tw.stop(false);
              return;
            }
            att.$e.css(state);
          },
          finish:       function (state, att) {
            if( att.item.$elt === null ) { return; }
            att.$e.css('opacity', '');
            // att.$e.css({'opacity':1 });
            ThumbnailAppearFinish(att.item);
          }
        });
      }
    }
    
    

    // ######################################
    // Gallery display animation
    
    function GalleryAppear() {
      
      
      var d=G.galleryDisplayTransitionDuration.Get();
      switch( G.galleryDisplayTransition.Get() ){
        case 'ROTATEX':
          G.$E.base.css({ perspective: '1000px', 'perspective-origin': '50% 0%' });
          var tweenable = new NGTweenable();
          tweenable.tween({
            from:         { rotate: 50 },
            to:           { rotate: 0  },
            duration:     d,
            easing:       'easeOutCirc',
            step:         function (state, att) {
              G.$E.conTnParent.css( G.CSStransformName , 'rotateX('+state.rotate+'deg)');
            }
          });
          break;
        case 'SLIDEUP':
          G.$E.conTnParent.css({ opacity: 0 });
          var tweenable = new NGTweenable();
          tweenable.tween({
            from:         { y: 200, o: 0 },
            to:           { y: 0,   o: 1 },
            duration:     d,
            easing:       'easeOutCirc',
            step:         function (state, att) {
              // G.$E.conTnParent.css( G.CSStransformName , 'translateY('+state.y+'px)').css('opacity', state.o);
              G.$E.conTnParent.css( G.CSStransformName , 'translate(0px,'+state.y+'px)').css('opacity', state.o);
            }
          });
          break;
        case 'NONE':
        default:
          break;
      }


    }
    
    // ######################################
    // ##### THUMBNAIL HOVER MANAGEMENT #####
    // ######################################

    function ThumbnailOverInit( GOMidx ) {
      // Over init in 2 step:
      // 1) init with thumbnailBuildInit2 parameter
      // 2) init with the hover effect parameter
      
      
      var curTn=G.GOM.items[GOMidx];
      var item=G.I[curTn.thumbnailIdx];

      if( item.$elt == null ) { return; } // zombie
      
      if( G.O.fnThumbnailHoverInit !== null ) {
        if( typeof G.O.fnThumbnailHoverInit == 'function' ) {
          G.O.fnThumbnailHoverInit($e, item, GOMidx);
        }
        else {
          // defined in markup
          window[G.O.fnThumbnailHoverInit]($e, item, GOMidx);
        }
      }

      // build initialization
      var inits=G.tn.buildInit.get();
      for( var j=0; j<inits.length; j++) {
        switch( inits[j].property ) {
          case 'scale':
          case 'rotateX':
          case 'rotateY':
          case 'rotateZ':
          case 'translateX':
          case 'translateY':
          case 'translateZ':
            item.CSSTransformSet(inits[j].element, inits[j].property, inits[j].value);
            item.CSSTransformApply(inits[j].element);
            break;
          case 'blur':
          case 'brightness':
          case 'grayscale':
          case 'sepia':
          case 'contrast':
          case 'opacity':
          case 'saturate':
            item.CSSFilterSet(inits[j].element, inits[j].property, inits[j].value);
            item.CSSFilterApply(inits[j].element);
            break;
          default:
            var $t=item.$getElt(inits[j].element);
            $t.css( inits[j].property, inits[j].value );
            break;
        }
      }
      
      // hover
      var effects=G.tn.hoverEffects.get();
      for( var j=0; j<effects.length; j++) {
        if( effects[j].firstKeyframe === true ) {
          switch( effects[j].type ) {
            case 'scale':
            case 'rotateX':
            case 'rotateY':
            case 'rotateZ':
            case 'translateX':
            case 'translateY':
            case 'translateZ':
              item.CSSTransformSet(effects[j].element, effects[j].type, effects[j].from);
              item.CSSTransformApply(effects[j].element);
              break;
            case 'blur':
            case 'brightness':
            case 'grayscale':
            case 'sepia':
            case 'contrast':
            case 'opacity':
            case 'saturate':
              item.CSSFilterSet(effects[j].element, effects[j].type, effects[j].from);
              item.CSSFilterApply(effects[j].element);
              break;
            default:
              var $t=item.$getElt(effects[j].element);
              $t.css( effects[j].type, effects[j].from );
              break;
              
          }
        }
      }
      item.hoverInitDone=true;
    }

    function ThumbnailHoverReInitAll() {
      if( G.GOM.albumIdx == -1 ) { return; };
      var l=G.GOM.items.length;
      for( var i=0; i < l ; i++ ) {
        ThumbnailOverInit(i);
        // G.GOM.items[i].hovered=false;
        G.I[G.GOM.items[i].thumbnailIdx].hovered=false;
      }
    }


    function ThumbnailHover( GOMidx ) {
      if( G.GOM.albumIdx == -1 || !G.galleryResizeEventEnabled ) { return; };
      var curTn=G.GOM.items[GOMidx];
      var item=G.I[curTn.thumbnailIdx];
      if( item.kind == 'albumUp' ) { return; }

      if( item.$elt == null ) { return; }

      item.hovered=true;

      if( G.O.fnThumbnailHover !== null ) {
        if( typeof G.O.fnThumbnailHover == 'function' ) {
          G.O.fnThumbnailHover(item.$elt, item, GOMidx);
        }
        else {
          // defined in markup
          window[G.O.fnThumbnailHover](item.$elt, item, GOMidx);
        }
      }
      var effects=G.tn.hoverEffects.get();

      try {
        for( var j=0; j<effects.length; j++) {
          if( effects[j].hoverin === true ) {
            //item.animate( effects[j], j*10,  true );
            item.animate( effects[j], 0,  true );
          }
        }
        // effects on whole layout
        // GalleryResize( GOMidx );
      }
      catch (e) { 
        NanoAlert(G, 'error on hover: ' +e.message );
      }

    }

    function ThumbnailHoverOutAll() {
      if( G.GOM.albumIdx == -1 ) { return; };
      var l=G.GOM.items.length;
      for( var i=0; i < l ; i++ ) {
        if( G.GOM.items[i].inDisplayArea ) {
          ThumbnailHoverOut(i);
        }
        else {
          G.I[G.GOM.items[i].thumbnailIdx].hovered
        }
      }
    }

    
    function ThumbnailHoverOut( GOMidx ) {
      if( G.GOM.albumIdx == -1 || !G.galleryResizeEventEnabled ) { return; };
      var curTn=G.GOM.items[GOMidx];
      var item=G.I[curTn.thumbnailIdx];
      if( item.kind == 'albumUp' || !item.hovered ) { return; }
      item.hovered=false;
      if( item.$elt == null ) { return; }

      if( G.O.fnThumbnailHoverOut !== null ) {
        if( typeof G.O.fnThumbnailHoverOut == 'function' ) {
          G.O.fnThumbnailHoverOut(item.$elt, item, GOMidx);
        }
        else {
          // defined in markup
          window[G.O.fnThumbnailHoverOut](item.$elt, item, GOMidx);
        }
      }

      var effects=G.tn.hoverEffects.get();
      try {
        for( var j=0; j<effects.length; j++) {
          if( effects[j].hoverout === true ) {
            // item.animate( effects[j], j*10, false );
            item.animate( effects[j], 0, false );
          }
        }
        // effects on whole layout
        // GalleryResize( );
      }
      catch (e) { 
        NanoAlert(G, 'error on hoverOut: ' +e.message );
      }
      
    }
    

    /** @function DisplayPhoto */
    function DisplayPhoto( imageID, albumID ) {

      if( G.O.debugMode ) { console.log('#DisplayPhoto : '+  albumID +'-'+ imageID); }
      var albumIdx=NGY2Item.GetIdx(G, albumID);
      if( albumIdx == 0 ) {
        G.GOM.curNavLevel='l1';
      }
      else {
        G.GOM.curNavLevel='lN';
      }

      if( albumIdx == -1 ) {
        // get content of album on root level
        if( G.O.kind != '' ) {
          // do not add adlbum if Markup or Javascript data
          NGY2Item.New( G, '', '', albumID, '0', 'album' );    // create empty album
          albumIdx=G.I.length-1;
        }
      }

      var ngy2ItemIdx = NGY2Item.GetIdx(G, imageID);
      if( ngy2ItemIdx == -1 ) {
        // get content of the album
        AlbumGetContent( albumID, DisplayPhoto, imageID, albumID );
        return;
      }
      
      if( G.O.debugMode ) { console.log('#DisplayPhoto : '+  ngy2ItemIdx); }
     
      DisplayPhotoIdx(ngy2ItemIdx);
    
    }


    // BETA -> NOT finished and not used at this time
    // Retrieve the title+description of ONE album
    function albumGetInfo( albumIdx, fnToCall ) {
      var url =   '';
      var kind =  'image';
      
      switch( G.O.kind ) {
        case 'json':
          // TODO
        case 'flickr':
          // TODO
        case 'picasa':
        case 'google':
        case 'google2':
        default:
          url = G.Google.url() + 'user/'+G.O.userID+'/albumid/'+G.I[albumIdx].GetID()+'?alt=json&&max-results=1&fields=title';
          break;
      }

      jQuery.ajaxSetup({ cache: false });
      jQuery.support.cors = true;
      
      var tId = setTimeout( function() {
        // workaround to handle JSONP (cross-domain) errors
        //PreloaderHide();
        NanoAlert(G, 'Could not retrieve AJAX data...');
      }, 60000 );
      jQuery.getJSON(url, function(data, status, xhr) {
        clearTimeout(tId);
        //PreloaderHide();
        
        fnToCall( G.I[albumIdx].GetID() );

      })
      .fail( function(jqxhr, textStatus, error) {
        clearTimeout(tId);
        //PreloaderHide();
        var err = textStatus + ', ' + error;
        NanoAlert('Could not retrieve ajax data: ' + err);
      });      
    
    }

    
    // function AlbumGetContent( albumIdx, fnToCall ) {
    function AlbumGetContent( albumID, fnToCall, fnParam1, fnParam2 ) {
      var url='';
      var kind='image';
      var albumIdx=NGY2Item.GetIdx(G, albumID);
      // var photoIdx=NGY2Item.GetIdx(G, photoID);
      
      switch( G.O.kind ) {
        // MARKUP / API
        case '':
          AlbumGetMarkupOrApi(fnToCall, fnParam1, fnParam2);
          break;
        // JSON, Flickr, Picasa, ...
        default:
          jQuery.nanogallery2['data_'+G.O.kind](G, 'AlbumGetContent', albumID, fnToCall, fnParam1, fnParam2 );
      }
      
    }
    
    
    function AlbumGetMarkupOrApi ( fnToCall, fnParam1, fnParam2 ) {
    
      if( G.markupOrApiProcessed === true ) {
        // already processed (maybe location hash to unknow reference) -> display root album
        DisplayAlbum('-1', 0);
        return;
      }
      
      if( G.O.items !== undefined && G.O.items !== null ) {
        // data defined as an object in an option parameter
        GetContentApiObject();
      }
      else {
        if( G.O.$markup.length > 0 ) {
          // data defined as markup (href elements)
          GetContentMarkup(G.O.$markup);
          G.O.$markup=[]  ;
        }
        else {
          NanoAlert(G, 'error: no image to process.');
          return;
        }
      }
      
      G.markupOrApiProcessed = true;
      if( fnToCall !== null &&  fnToCall !== undefined) {
        fnToCall( fnParam1, fnParam2, null );
      }
    }
    
    function StartsWithProtocol ( path ) {
      path=path.toLowerCase();
      switch( path ) {
        case 'http://':
        case 'https://':
        case 'file://':
          return true;
          break;
      }
      return false;
    }
    
    function GetContentApiObject() {
      var foundAlbumID=false;
      var AlbumPostProcess = NGY2Tools.AlbumPostProcess.bind(G);

      G.I[0].contentIsLoaded=true;

      jQuery.each(G.O.items, function(i,item){
        
        var title='';
        title=GetI18nItem(item,'title');
        if( title === undefined ) { title=''; }
        
        var src='';
        if( item['src'+RetrieveCurWidth().toUpperCase()] !== undefined ) {
          src+=item['src'+RetrieveCurWidth().toUpperCase()];
        }
        else {
          src+=item.src;
        }
        if( !StartsWithProtocol(src) ) {
          src=G.O.itemsBaseURL + src;
        }

        var thumbsrc='';
        if( item.srct !== undefined && item.srct.length>0 ) {
          thumbsrc=item.srct;
        }
        else {
          thumbsrc=src;
        }
        if( !StartsWithProtocol(thumbsrc) ) {
          thumbsrc=G.O.itemsBaseURL + thumbsrc;
        }
        
        var thumbsrcX2='';
        if( item.srct2x !== undefined && item.srct2x.length>0 ) {
          thumbsrcX2=item.srct2x;
        }
        else {
          if( thumbsrc != '' ) {
            thumbsrcX2=thumbsrc;
          }
          else {
            thumbsrcX2=src;
          }
        }
        if( !StartsWithProtocol(thumbsrcX2) ) {
          thumbsrcX2=G.O.itemsBaseURL + thumbsrcX2;
        }

        if( G.O.thumbnailLabel.get('title') != '' ) {
          title=GetImageTitle(src);
        }

        var description='';     //'&nbsp;';
        description=GetI18nItem(item,'description');
        if( description === undefined ) { description=''; }
        //if( toType(item.description) == 'string' ) {
        //  description=item.description;
        //}

        var tags=GetI18nItem(item,'tags');
        if( tags === undefined ) { tags=''; }

        var albumID=0;
        if( item.albumID !== undefined  ) {
          albumID=item.albumID;
          foundAlbumID=true;
        }
        var ID=null;
        if( item.ID !== undefined ) {
          ID=item.ID;
        }
        var kind='image';
        if( item.kind !== undefined && item.kind.length>0 ) {
          kind=item.kind;
        }
        
        var newItem=NGY2Item.New( G, title, description, ID, albumID, kind, tags );

        // image source url
        newItem.src=src;
        
        // dominant colors (needs to be a base64 gif)
        if( item.imageDominantColors !== undefined ) {
          newItem.imageDominantColors=item.imageDominantColors;
        }
        // dominant color (rgb hex)
        if( item.imageDominantColor !== undefined ) {
          newItem.imageDominantColor=item.imageDominantColor;
        }
        
        // dest url
        if( item.destURL !== undefined && item.destURL.length>0 ) {
          newItem.destinationURL=item.destURL;
        }
        
        // download image url
        if( item.downloadURL !== undefined && item.downloadURL.length>0 ) {
          newItem.downloadURL=item.downloadURL;
        }
        
        // thumbnail image size
        var tw=0;
        if( item.imgtWidth !== undefined && item.imgtWidth>0 ) {
          tw=item.imgtWidth;
          //newItem.thumbImgWidth=tw;
        }
        var th=0;
        if( item.imgtHeight !== undefined && item.imgtHeight>0 ) {
          th=item.imgtHeight;
          //newItem.thumbImgHeight=th;
        }

        newItem.thumbs = {
          url:    { l1 : { xs:thumbsrc, sm:thumbsrc, me:thumbsrc, la:thumbsrc, xl:thumbsrc }, lN : { xs:thumbsrc, sm:thumbsrc, me:thumbsrc, la:thumbsrc, xl:thumbsrc } },
          width:  { l1 : { xs:tw, sm:tw, me:tw, la:tw, xl:tw }, lN : { xs:tw, sm:tw, me:tw, la:tw, xl:tw } },
          height: { l1 : { xs:th, sm:th, me:th, la:th, xl:th }, lN : { xs:th, sm:th, me:th, la:th, xl:th } }
        };

        // image size
        if( item.imageWidth !== undefined ) { newItem.imageWidth=item.width; }
        if( item.imageHeight !== undefined ) { newItem.imageHeight=item.height; }
        
        
        // Exif - model
        if( item.exifModel !== undefined ) { newItem.exif.model=item.exifModel; }
        // Exif - flash
        if( item.exifFlash !== undefined ) { newItem.exif.flash=item.exifFlash; }
        // Exif - focallength
        if( item.exifFocalLength !== undefined ) { newItem.exif.focallength=item.exifFocalLength; }
        // Exif - fstop
        if( item.exifFStop !== undefined ) { newItem.exif.fstop=item.exifFStop; }
        // Exif - exposure
        if( item.exifExposure !== undefined ) { newItem.exif.exposure=item.exifExposure; }
        // Exif - time
        if( item.exifIso !== undefined ) { newItem.exif.iso=item.exifIso; }
        // Exif - iso
        if( item.exifTime !== undefined ) { newItem.exif.time=item.exifTime; }
        // Exif - location
        if( item.exifLocation !== undefined ) { newItem.exif.exifLocation=item.exifTime; }
        
        
        // custom data
        if( item.customData !== null ) {
          newItem.customData=cloneJSObject(item.customData);
        }

        newItem.contentIsLoaded=true;
        
        if( G.O.fnProcessData !== null ) {
          if( typeof G.O.fnProcessData == 'function' ) {
            G.O.fnProcessData(newItem, 'api', item);
          }
          else {
            // defined in markup
            window[G.O.fnProcessData](newItem, 'api', item);
          }
        }
        
        AlbumPostProcess(albumID);
      });
      
      if( foundAlbumID ) {
        //G.O.displayBreadcrumb=true;
      }

    }
    
    function GetContentMarkup( $elements ) {
      var foundAlbumID=false;
      var nbTitles=0;
      var AlbumPostProcess = NGY2Tools.AlbumPostProcess.bind(G);
      
      G.I[0].contentIsLoaded=true;

      jQuery.each($elements, function(i, item){

        // create dictionnary with all data attribute name in lowercase (to be case unsensitive)
        var data={
          // some default values
          'data-ngdesc':                  '',         // item description
          'data-ngid':                    null,       // ID
          'data-ngkind':                  'image',    // kind (image, album, albumup)
          'data-ngtags':                  null,       // tags
          'data-ngdest':                  '',         // destination URL
          'data-ngthumbimgwidth':         0,          // thumbnail width
          'data-ngthumbimgheight':        0,          // thumbnail height
          'data-ngimagewidth':            0,          // image width
          'data-ngimageheight':           0,          // image height
          'data-ngimagedominantcolors':   null,       // image dominant colors
          'data-ngimagedominantcolor':    null,       // image dominant colors
          'data-ngexifmodel':             '',         // EXIF data
          'data-ngexifflash':             '',
          'data-ngexiffocallength':       '',
          'data-ngexiffstop':             '',
          'data-ngexifexposure':          '',
          'data-ngexifiso':               '',
          'data-ngexiftime':              '',
          'data-ngexiflocation':          ''
        };
        [].forEach.call( item.attributes, function(attr) {
          data[attr.name.toLowerCase()]=attr.value;
        });

        var thumbsrc='';
        if( data.hasOwnProperty('data-ngthumb') ) {
          thumbsrc=data['data-ngthumb'];
          if( !StartsWithProtocol(thumbsrc) ) {
            thumbsrc=G.O.itemsBaseURL + thumbsrc;
          }
        }
        var thumbsrcX2='';
        if( data.hasOwnProperty('data-ngthumb2x') ) {
          thumbsrcX2=data['data-ngthumb2x'];
          if( !StartsWithProtocol(thumbsrcX2) ) {
            thumbsrcX2=G.O.itemsBaseURL + thumbsrcX2;
          }
        }

        // responsive image source
        var src='',
        st=RetrieveCurWidth().toUpperCase();
        if( data.hasOwnProperty('data-ngsrc'+st) ) {
          src=data['data-ngsrc'+st];
        }
        if( src == '' ) {
          src=data['href'];
        }
        if( !StartsWithProtocol(src) ) {
          src=G.O.itemsBaseURL + src;
        }
        
        //newObj.description=jQuery(item).attr('data-ngdesc');
        var description=data['data-ngdesc'];
        var ID=data['data-ngid'];
        var kind=data['data-ngkind'];
        var tags=data['data-ngtags'];

        var albumID='0';
        if( data.hasOwnProperty('data-ngalbumid') ) {
          albumID=data['data-ngalbumid'];
          foundAlbumID=true;
        }
        
        var title=jQuery(item).text();
        if( !(G.O.thumbnailLabel.get('title') == '' || G.O.thumbnailLabel.get('title') == undefined) ) {
          title=GetImageTitle(src);
        }


        var newItem=NGY2Item.New( G, title, description, ID, albumID, kind, tags );
        if( title != '' ) {
          nbTitles++;
        }

        // image source url
        newItem.src=src;

        // dominant colorS (needs to be a base64 gif)
        newItem.imageDominantColors=data['data-ngimagedominantcolors'];
        // dominant color (rgb hex)
        newItem.imageDominantColor=data['data-ngimagedominantcolors'];

        newItem.destinationURL=data['data-ngdest'];
        newItem.downloadURL=data['data-ngdownloadurl'];

        // thumbnail image size
        var tw=parseInt(data['data-ngthumbimgwidth']);
        var th=parseInt(data['data-ngthumbimgheight']);
        newItem.thumbs = {
          url:    { l1 : { xs:thumbsrc, sm:thumbsrc, me:thumbsrc, la:thumbsrc, xl:thumbsrc }, lN : { xs:thumbsrc, sm:thumbsrc, me:thumbsrc, la:thumbsrc, xl:thumbsrc } },
          width:  { l1 : { xs:tw, sm:tw, me:tw, la:tw, xl:tw }, lN : { xs:tw, sm:tw, me:tw, la:tw, xl:tw } },
          height: { l1 : { xs:th, sm:th, me:th, la:th, xl:th }, lN : { xs:th, sm:th, me:th, la:th, xl:th } }
        };

        // image size
        newItem.imageWidth=parseInt(data['data-ngimagewidth']);
        newItem.imageHeight=parseInt(data['data-ngimageheight']);

        // Exif - model
        newItem.exif.model=data['data-ngexifmodel'];
        // Exif - flash
        newItem.exif.flash=data['data-ngexifflash'];
        // Exif - focallength
        newItem.exif.focallength=data['data-ngexiffocallength'];
        // Exif - fstop
        newItem.exif.fstop=data['data-ngexiffstop'];
        // Exif - exposure
        newItem.exif.exposure=data['data-ngexifexposure'];
        // Exif - iso
        newItem.exif.iso=data['data-ngexifiso'];
        // Exif - time
        newItem.exif.time=data['data-ngexiftime'];
        // Exif - location
        newItem.exif.location=data['data-ngexiflocation'];
        
        newItem.contentIsLoaded=true;

        // custom data
        if( jQuery(item).data('customdata') !== undefined ) {
          newItem.customData=cloneJSObject(jQuery(item).data('customdata'));
        }
        // custom data
        if( jQuery(item).data('ngcustomdata') !== undefined ) {
          newItem.customData=cloneJSObject(jQuery(item).data('ngcustomdata'));
        }

        if( G.O.fnProcessData !== null ) {
          if( typeof G.O.fnProcessData == 'function' ) {
            G.O.fnProcessData(newItem, 'markup', item);
          }
          else {
            // defined in markup
            window[G.O.fnProcessData](newItem, 'markup', item);
          }
        }
        
        AlbumPostProcess(albumID);

      });
      
      if( foundAlbumID ) {
        //G.O.displayBreadcrumb=true;
      }
      
      if( nbTitles == 0 ) {
        G.O.thumbnailLabel.display=false;
      }

    }

    function cloneJSObject( obj ) {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }

      var temp = obj.constructor(); // give temp the original obj's constructor
      for (var key in obj) {
          temp[key] = cloneJSObject(obj[key]);
      }
      return temp;
    }

    
    
    
    // ################################
    // ##### DEFINE VARIABLES     #####
    // ################################

    
    /** @function DefineVariables */
    function DefineVariables() {

      // change 'picasa' to 'google' for compatibility reason
      if( G.O.kind.toUpperCase() == 'PICASA' ) {
        G.O.kind='google2';
      }
      if( G.O.kind.toUpperCase() == 'GOOGLE' ) {
        G.O.kind='google2';
      }
    
      // management of screen width
      G.GOM.curWidth=RetrieveCurWidth();

      // tumbnail toolbar
      jQuery.extend(true, G.tn.toolbar.image, G.O.thumbnailToolbarImage );
      jQuery.extend(true, G.tn.toolbar.album, G.O.thumbnailToolbarAlbum );
      G.tn.toolbar.image.topLeft=G.tn.toolbar.image.topLeft.toUpperCase();
      G.tn.toolbar.album.topLeft=G.tn.toolbar.album.topLeft.toUpperCase();
      G.tn.toolbar.image.topRight=G.tn.toolbar.image.topRight.toUpperCase();
      G.tn.toolbar.album.topRight=G.tn.toolbar.album.topRight.toUpperCase();
      G.tn.toolbar.image.bottomLeft=G.tn.toolbar.image.bottomLeft.toUpperCase();
      G.tn.toolbar.album.bottomLeft=G.tn.toolbar.album.bottomLeft.toUpperCase();
      G.tn.toolbar.image.bottomRight=G.tn.toolbar.image.bottomRight.toUpperCase();
      G.tn.toolbar.album.bottomRight=G.tn.toolbar.album.bottomRight.toUpperCase();

      // thumbnails label - level dependant settings
      G.O.thumbnailLabel.get = function( opt ) {
        if( G.GOM.curNavLevel == 'l1' && G.O.thumbnailL1Label !== undefined && G.O.thumbnailL1Label[opt] !== undefined ) {
          return G.O.thumbnailL1Label[opt];
        }
        else {
          return G.O.thumbnailLabel[opt];
        }
      };
      G.O.thumbnailLabel.set = function( opt, value ) {
        if( G.GOM.curNavLevel == 'l1' && G.O.thumbnailL1Label !== undefined && G.O.thumbnailL1Label[opt] !== undefined ) {
          G.O.thumbnailL1Label[opt]=value;
        }
        else {
          G.O.thumbnailLabel[opt]=value;
        }
      };

      if( G.O.blackList != '' ) { G.blackList=G.O.blackList.toUpperCase().split('|'); }
      if( G.O.whiteList != '' ) { G.whiteList=G.O.whiteList.toUpperCase().split('|'); }

      if( G.O.albumList2 !== undefined && G.O.albumList2 !== null && G.O.albumList2.constructor === Array  ) {
        var l=G.O.albumList2.length;
        for(var i=0; i< l; i++ ) {
          if( G.O.albumList2[i].indexOf('&authkey') !== -1 || G.O.albumList2[i].indexOf('?authkey') !== -1 ) {
            // private Google Photos album
            G.albumListHidden.push(G.O.albumList2[i]);
          }
          else {
            G.albumList.push(G.O.albumList2[i]);
          }
        }
        // G.albumList=G.O.albumList.toUpperCase().split('|');
      }
      if( G.O.albumList2 !== undefined && typeof G.O.albumList2 == 'string'   ) {
        if( G.O.albumList2.indexOf('&authkey') !== -1 ) {
          // private Google Photos album
          G.albumListHidden.push(G.O.albumList2);
        }
        else {
          G.albumList.push(G.O.albumList2);
        }
      }
      if( G.albumListHidden.length > 0 ) {
        G.O.locationHash=false;   // disable hash location for hidden/privat albums --> combination is impossible
      }
      
      
      // thumbnail image crop
      G.tn.opt.lN.crop=G.O.thumbnailCrop;
      G.tn.opt.l1.crop=G.O.thumbnailCrop;
      if( G.O.thumbnailL1Crop != null ) {
        G.tn.opt.l1.crop=G.O.thumbnailL1Crop;
      }



      function ThumbnailOpt( lN, l1, opt) {
        G.tn.opt.lN[opt]=G.O[lN];
        G.tn.opt.l1[opt]=G.O[lN];
        if( toType(G.O[l1]) == 'number' ) {
          G.tn.opt.l1[opt]=G.O[l1];
        }
      }
      // thumbnail stacks
      ThumbnailOpt('thumbnailStacks', 'thumbnailL1Stacks', 'stacks');
      // thumbnail stacks translate X
      ThumbnailOpt('thumbnailStacksTranslateX', 'thumbnailL1StacksTranslateX', 'stacksTranslateX');
      // thumbnail stacks translate Y
      ThumbnailOpt('thumbnailStacksTranslateY', 'thumbnailL1StacksTranslateY', 'stacksTranslateY');
      // thumbnail stacks translate Z
      ThumbnailOpt('thumbnailStacksTranslateZ', 'thumbnailL1StacksTranslateZ', 'stacksTranslateZ');
      // thumbnail stacks rotate X
      ThumbnailOpt('thumbnailStacksRotateX', 'thumbnailL1StacksRotateX', 'stacksRotateX');
      // thumbnail stacks rotate Y
      ThumbnailOpt('thumbnailStacksRotateY', 'thumbnailL1StacksRotateY', 'stacksRotateY');
      // thumbnail stacks rotate Z
      ThumbnailOpt('thumbnailStacksRotateZ', 'thumbnailL1StacksRotateZ', 'stacksRotateZ');
      // thumbnail stacks scale
      ThumbnailOpt('thumbnailStacksScale', 'thumbnailL1StacksScale', 'stacksScale');
      // thumbnail gutter width
      ThumbnailOpt('thumbnailGutterWidth', 'thumbnailL1GutterWidth', 'gutterWidth');
      // thumbnail gutter height
      ThumbnailOpt('thumbnailGutterHeight', 'thumbnailL1GutterHeight', 'gutterHeight');
      
      // gallery display mode
      G.galleryDisplayMode.lN=G.O.galleryDisplayMode.toUpperCase();
      G.galleryDisplayMode.l1=G.O.galleryDisplayMode.toUpperCase();
      if( G.O.galleryL1DisplayMode != null ) {
        G.galleryDisplayMode.l1=G.O.galleryL1DisplayMode.toUpperCase();
      }
      
      // gallery maximum number of lines of thumbnails
      G.galleryMaxRows.lN=G.O.galleryMaxRows;
      G.galleryMaxRows.l1=G.O.galleryMaxRows;
      if( toType(G.O.galleryL1MaxRows) == 'number' ) {
        G.galleryMaxRows.l1=G.O.galleryL1MaxRows;
      }

      // gallery last row full
      G.galleryLastRowFull.lN=G.O.galleryLastRowFull;
      G.galleryLastRowFull.l1=G.O.galleryLastRowFull;
      if( G.O.galleryL1LastRowFull != null ) {
        G.galleryLastRowFull.l1=G.O.galleryL1LastRowFull;
      }
      
      // gallery sorting
      G.gallerySorting.lN=G.O.gallerySorting.toUpperCase();
      G.gallerySorting.l1=G.gallerySorting.lN;
      if( G.O.galleryL1Sorting != null ) {
        G.gallerySorting.l1=G.O.galleryL1Sorting.toUpperCase();
      }
      
      // gallery display transition
      G.galleryDisplayTransition.lN=G.O.galleryDisplayTransition.toUpperCase();
      G.galleryDisplayTransition.l1=G.galleryDisplayTransition.lN;
      if( G.O.galleryL1DisplayTransition != null ) {
        G.galleryDisplayTransition.l1=G.O.galleryL1DisplayTransition.toUpperCase();
      }
      // gallery display transition duration
      G.galleryDisplayTransitionDuration.lN=G.O.galleryDisplayTransitionDuration;
      G.galleryDisplayTransitionDuration.l1=G.galleryDisplayTransitionDuration.lN;
      if( G.O.galleryL1DisplayTransitionDuration != null ) {
        G.galleryDisplayTransitionDuration.l1=G.O.galleryL1DisplayTransitionDuration;
      }
      
      // gallery max items per album (not for inline/api defined items)
      G.galleryMaxItems.lN=G.O.galleryMaxItems;
      G.galleryMaxItems.l1=G.O.galleryMaxItems;
      if( toType(G.O.galleryL1MaxItems) == 'number' ) {
        G.galleryMaxItems.l1=G.O.galleryL1MaxItems;
      }

      // gallery filter tags
      G.galleryFilterTags.lN=G.O.galleryFilterTags;
      G.galleryFilterTags.l1=G.O.galleryFilterTags;
      if( G.O.galleryL1FilterTags != null ) {
        G.galleryFilterTags.l1=G.O.galleryL1FilterTags;
      }
      
      // gallery pagination
      G.O.galleryPaginationMode=G.O.galleryPaginationMode.toUpperCase();

      if( toType(G.O.slideshowDelay) == 'number' && G.O.slideshowDelay >= 2000 ) {
        G.VOM.slideshowDelay=G.O.slideshowDelay;
      }
      else {
        NanoConsoleLog(G, 'Parameter "slideshowDelay" must be an integer >= 2000 ms.');
      }

      // gallery display transition
      if( typeof G.O.thumbnailDisplayTransition == 'boolean' ) {
        if( G.O.thumbnailDisplayTransition === true ) {
          // G.displayTransition.lN='FADEIN';
          G.tn.opt.lN.displayTransition='FADEIN';
          G.tn.opt.l1.displayTransition='FADEIN';
        }
        else {
          G.tn.opt.lN.displayTransition='NONE';
          G.tn.opt.l1.displayTransition='NONE';
        }
      }

      if( G.O.fnThumbnailDisplayEffect !== '' ) {
        // G.O.thumbnailDisplayTransition='CUSTOM';
        G.tn.opt.lN.displayTransition='CUSTOM';
        G.tn.opt.l1.displayTransition='CUSTOM';
      }
      if( G.O.fnThumbnailL1DisplayEffect !== '' ) {
      // if( typeof G.O.fnThumbnailL1DisplayEffect == 'function' ) {
        G.tn.opt.l1.displayTransition='CUSTOM';
      }
      
      // parse thumbnail display transition
      if( typeof G.O.thumbnailDisplayTransition == 'string' ) {
        var st=G.O.thumbnailDisplayTransition.split('_');
        if( st.length == 1 ) {
          G.tn.opt.lN.displayTransition = G.O.thumbnailDisplayTransition.toUpperCase();
          G.tn.opt.l1.displayTransition = G.O.thumbnailDisplayTransition.toUpperCase();
        }
        if( st.length == 2 ) {
          G.tn.opt.lN.displayTransition = st[0].toUpperCase();
          G.tn.opt.l1.displayTransition = st[0].toUpperCase();
          G.tn.opt.lN.displayTransitionStartVal = Number(st[1]);
          G.tn.opt.l1.displayTransitionStartVal = Number(st[1]);
        }
        if( st.length == 3 ) {
          G.tn.opt.lN.displayTransition = st[0].toUpperCase();
          G.tn.opt.l1.displayTransition = st[0].toUpperCase();
          G.tn.opt.lN.displayTransitionStartVal = Number(st[1]);
          G.tn.opt.l1.displayTransitionStartVal = Number(st[1]);
          G.tn.opt.lN.displayTransitionEasing = st[2];
          G.tn.opt.l1.displayTransitionEasing = st[2];
        }
      }
      if( typeof G.O.thumbnailL1DisplayTransition == 'string' ) {
        var st=G.O.thumbnailL1DisplayTransition.split('_');
        if( st.length == 1 ) {
          G.tn.opt.l1.displayTransition = G.O.thumbnailL1DisplayTransition.toUpperCase();
        }
        if( st.length == 2 ) {
          G.tn.opt.l1.displayTransition = st[0].toUpperCase();
          G.tn.opt.l1.displayTransitionStartVal = Number(st[1]);
        }
        if( st.length == 3 ) {
          G.tn.opt.l1.displayTransition = st[0].toUpperCase();
          G.tn.opt.l1.displayTransitionStartVal = Number(st[1]);
          G.tn.opt.l1.displayTransitionEasing = st[2];
        }
      }
      
      // thumbnail display transition duration
      ThumbnailOpt('thumbnailDisplayTransitionDuration', 'thumbnailL1DisplayTransitionDuration', 'displayTransitionDuration');
      // thumbnail display transition interval duration
      ThumbnailOpt('thumbnailDisplayInterval', 'thumbnailL1DisplayInterval', 'displayInterval');

      
      // resolution breakpoints --> convert old syntax to new one
      if( G.O.thumbnailSizeSM !== undefined ) { G.O.breakpointSizeSM=G.O.thumbnailSizeSM; }
      if( G.O.thumbnailSizeME !== undefined ) { G.O.breakpointSizeME=G.O.thumbnailSizeME; }
      if( G.O.thumbnailSizeLA !== undefined ) { G.O.breakpointSizeLA=G.O.thumbnailSizeLA; }
      if( G.O.thumbnailSizeXL !== undefined ) { G.O.breakpointSizeXL=G.O.thumbnailSizeXL; }

      // THUMBNAIL BUILD INIT
      //level 1
      if( G.O.thumbnailL1BuildInit2 !== undefined ) {
      var t1=G.O.thumbnailL1BuildInit2.split('|');
        for( var i=0; i<t1.length; i++ ) {
          var o1=t1[i].trim().split('_');
          if( o1.length == 3 ) {
            var i1=NewTBuildInit();
            i1.element=ThumbnailOverEffectsGetCSSElement(o1[0], '');
            i1.property=o1[1];
            i1.value=o1[2];
            G.tn.buildInit.level1.push(i1);
          }
        }
      }
      //level N
      if( G.O.thumbnailBuildInit2 !== undefined ) {
        var t1=G.O.thumbnailBuildInit2.split('|');
        for( var i=0; i<t1.length; i++ ) {
          var o1=t1[i].trim().split('_');
          if( o1.length == 3 ) {
            var i1=NewTBuildInit();
            i1.element=ThumbnailOverEffectsGetCSSElement(o1[0], '');
            i1.property=o1[1];
            i1.value=o1[2];
            G.tn.buildInit.std.push(i1);
          }
        }
      }

      
      // THUMBNAIL HOVER EFFETCS
      
      // thumbnails hover effects - Level1
      var tL1HE=G.O.thumbnailL1HoverEffect2;
      if( tL1HE !== undefined ) {
        switch( toType(tL1HE) ) {
          case 'string':
            var tmp=tL1HE.split('|');
            for(var i=0; i<tmp.length; i++) {
              var oDef=NewTHoverEffect();
              oDef=ThumbnailHoverEffectExtract( tmp[i].trim(), oDef );
              if(  oDef!= null ) {
                G.tn.hoverEffects.level1.push(oDef);
              }
            }
            break;
          case 'object':
            var oDef=NewTHoverEffect();
            oDef=jQuery.extend(oDef,tL1HE);
            oDef=ThumbnailHoverEffectExtract( oDef.name, oDef );
            if(  oDef!= null ) {
              G.tn.hoverEffects.level1.push(oDef);
            }
            break;
          case 'array':
            for(var i=0; i<tL1HE.length; i++) {
              var oDef=NewTHoverEffect();
              oDef=jQuery.extend(oDef,tL1HE[i]);
              oDef=ThumbnailHoverEffectExtract( oDef.name, oDef );
              if(  oDef!= null ) {
                G.tn.hoverEffects.level1.push(oDef);
              }
            }
            break;
          case 'null':
            break;
          default:
            NanoAlert(G, 'incorrect parameter for "thumbnailL1HoverEffect2".');
        }
      }
      G.tn.hoverEffects.level1=ThumbnailOverEffectsPreset(G.tn.hoverEffects.level1);
  
      // thumbnails hover effects - other levels
      var tHE=G.O.thumbnailHoverEffect2;
      switch( toType(tHE) ) {
        case 'string':
          var tmp=tHE.split('|');
          for(var i=0; i<tmp.length; i++) {
            var oDef=NewTHoverEffect();
            oDef=ThumbnailHoverEffectExtract( tmp[i].trim(), oDef );
            if(  oDef!= null ) {
              G.tn.hoverEffects.std.push(oDef);
            }
          }
          break;
        case 'object':
          var oDef=NewTHoverEffect();
          oDef=jQuery.extend(oDef, tHE);
          oDef=ThumbnailHoverEffectExtract( oDef.name, oDef );
          if(  oDef!= null ) {
            G.tn.hoverEffects.std.push(oDef);
          }
          break;
        case 'array':
          for(var i=0; i<tHE.length; i++) {
            var oDef=NewTHoverEffect();
            oDef=jQuery.extend(oDef,tHE[i]);
            oDef=ThumbnailHoverEffectExtract( oDef.name, oDef );
            if(  oDef!= null ) {
              G.tn.hoverEffects.std.push(oDef);
            }
          }
          break;
        case 'null':
          break;
        default:
          NanoAlert(G, 'incorrect parameter for "thumbnailHoverEffect2".');
      }
      G.tn.hoverEffects.std=ThumbnailOverEffectsPreset(G.tn.hoverEffects.std);

      if( G.tn.hoverEffects.std.length == 0 ) {
        if( G.tn.hoverEffects.level1.length == 0 ) {
          G.O.touchAnimationL1=false;
        }
        G.O.touchAnimation=false;
      }      
      
      
      // thumbnail sizes
      if( G.O.thumbnailHeight == 0 || G.O.thumbnailHeight == ''  ) {
        G.O.thumbnailHeight='auto';
      }
      if( G.O.thumbnailWidth == 0 || G.O.thumbnailWidth == '' ) {
        G.O.thumbnailWidth = 'auto';
      }
      if( G.O.thumbnailL1Height == 0 || G.O.thumbnailL1Height == '' ) {
        G.O.thumbnailL1Height = 'auto';
      }
      if( G.O.thumbnailL1Width == 0 || G.O.thumbnailL1Width == '' ) {
        G.O.thumbnailL1Width = 'auto';
      }

      // RETRIEVE ALL THUMBNAIL SIZES
      function ThumbnailSizes( srcOpt, onlyl1, opt) {
        if( G.O[srcOpt] == null ) { return; }
        
        if( toType(G.O[srcOpt]) == 'number' ) {
          ThumbnailsSetSize( opt, 'l1', G.O[srcOpt], 'u');
          if( !onlyl1 ) {
            ThumbnailsSetSize( opt, 'lN', G.O[srcOpt], 'u');
          }
        }
        else {
          var ws=G.O[srcOpt].split(' ');
          var v='auto';
          if( ws[0].substring(0,4) != 'auto' ) { v=parseInt(ws[0]); }
          var c='u';
          if( ws[0].charAt(ws[0].length - 1) == 'C' ) { c='c'; }
          ThumbnailsSetSize( opt, 'l1', v, c );   // default value for all resolutions and navigation levels
          if( !onlyl1 ) {
            ThumbnailsSetSize( opt, 'lN', v, c );
          }
          for( var i=1; i<ws.length; i++ ) {
            var r=ws[i].substring(0,2).toLowerCase();
            if( /xs|sm|me|la|xl/i.test(r) ) {
              var w=ws[i].substring(2);
              var v='auto';
              if( w.substring(0,4) != 'auto' ) { v=parseInt(w); }
              var c='u';
              if( w.charAt(w.length - 1) == 'C' ) { c='c'; }
              G.tn.settings[opt]['l1'][r]=v;
              G.tn.settings[opt]['l1'][r+'c']=c;
              if( !onlyl1 ) {
                G.tn.settings[opt]['lN'][r]=v;
                G.tn.settings[opt]['lN'][r+'c']=c;
              }
            }
          }
        }
      }
      ThumbnailSizes( 'thumbnailWidth', false, 'width');
      ThumbnailSizes( 'thumbnailL1Width', true, 'width');
      
      ThumbnailSizes( 'thumbnailHeight', false, 'height');
      ThumbnailSizes( 'thumbnailL1Height', true, 'height');

      
      G.O.thumbnailBorderHorizontal=parseInt(G.O.thumbnailBorderHorizontal);
      G.O.thumbnailBorderVertical=parseInt(G.O.thumbnailBorderVertical);
      G.O.thumbnailLabelHeight=parseInt(G.O.thumbnailLabelHeight);

      G.layout.SetEngine();
      
      // init plugins
      switch( G.O.kind ) {
        // MARKUP / API
        case '':
          break;
        // JSON, Flickr, Picasa, ...
        default:
        jQuery.nanogallery2['data_'+G.O.kind](G, 'Init' );
      }

    }

    // HOVER EFFECTS
    function ThumbnailHoverEffectExtract( name, effect) {
      var easings=[ 'easeInQuad', 'easeOutQuad', 'easeInOutQuad', 'easeInCubic', 'easeOutCubic', 'easeInOutCubic', 'easeInQuart', 'easeOutQuart', 'easeInOutQuart', 'easeInQuint', 'easeOutQuint', 'easeInOutQuint', 'easeInSine', 'easeOutSine', 'easeInOutSine', 'easeInExpo', 'easeOutExpo', 'easeInOutExpo', 'easeInCirc', 'easeOutCirc', 'easeInOutCirc', 'easeOutBounce', 'easeInBack', 'easeOutBack', 'easeInOutBack', 'elastic', 'bounce'];
    
    
      var sp=name.split('_');
      if( sp.length >= 4 ) {
        // var oDef=NewTHoverEffect();
        effect.name='';
        effect.type=sp[1];
        effect.from=sp[2];
        effect.to=sp[3];
        if( sp.length >= 5 ) {
          // effect.duration=sp[4];

          for( var n=4; n<sp.length; n++ ) {
            var v=sp[n];
            
            // check if an easing name
            var foundEasing=false;
            for( var e=0; e<easings.length; e++) {
              if( v == easings[e] ) {
                foundEasing=true;
                effect.easing=v;
                break;
              }
            }
            if( foundEasing === true ) {
              continue;
            }
            
            v=v.toUpperCase();
            
            if( v == 'HOVERIN' ) {
              effect.hoverout=false;
              continue;
            }
            if( v == 'HOVEROUT' ) {
              effect.hoverin=false;
              continue;
            }
            
            if( v == 'KEYFRAME' ) {
              effect.firstKeyframe=false;
              continue;
            }
            
            var num = parseInt(v.replace(/[^0-9\.]/g, ''), 10);   // extract a number if on exists

            if( num > 0 ) {
              // the string contains a numbers > 0
              if( v.indexOf('DURATION') >= 0 ) {
                effect.duration=num;
                continue;
              }
              if( v.indexOf('DURATIONBACK') >= 0 ) {
                effect.durationBack=num;
                continue;
              }
              if( v.indexOf('DELAY') >= 0 ) {
                effect.delay=num;
                continue;
              }
              if( v.indexOf('DELAYBACK') >= 0 ) {
                effect.delayBack=num;
                continue;
              }
              
              // no parameter name found -> default is duration
              effect.duration=num;
            }
            

          }
          
          
        }        
        effect.element=ThumbnailOverEffectsGetCSSElement(sp[0], effect.type);
        
      }
      else {
        effect.name=name;
        // NanoAlert(G, 'incorrect parameter for "thumbnailHoverEffect": ' + name);
        // return null;
      }
      return effect;
    }
    
    
    function ThumbnailOverEffectsGetCSSElement( element, property ) {
        var r=element;
        
        switch ( element ) {
          case 'image':
            if( property == 'blur' || property == 'brightness' || property == 'grayscale' || property == 'sepia' || property == 'contrast' || property == 'opacity'|| property == 'saturate' ) {
              r='.nGY2GThumbnailImg';
            }
            else {
              r='.nGY2GThumbnailImage';
            }
            break;
          case 'thumbnail':
            r='.nGY2GThumbnail';
            break;
          case 'label':
            r='.nGY2GThumbnailLabel';
            break;
          case 'title':
            r='.nGY2GThumbnailTitle';
            break;
          case 'description':
            r='.nGY2GThumbnailDescription';
            break;
          case 'tools':
            r='.nGY2GThumbnailIcons';
            break;
          case 'customlayer':
            r='.nGY2GThumbnailCustomLayer';
            break;
        }
        return r;
    }
    
    // convert preset hover effects to new ones (nanogallery2)
    function ThumbnailOverEffectsPreset( effects ) {

      // COMPATIBILITY WITH nanoGALLERY
      // OK:
      //  'borderLighter', 'borderDarker', 'scale120', 'labelAppear', 'labelAppear75', 'labelOpacity50', 'scaleLabelOverImage'
      //  'overScale', 'overScaleOutside', 'descriptionAppear'
      //  'slideUp', 'slideDown', 'slideRight', 'slideLeft'
      //  'imageScale150', 'imageScaleIn80', 'imageScale150Outside', 'imageSlideUp', 'imageSlideDown', 'imageSlideRight', 'imageSlideLeft'
      //  'labelSlideUpTop', 'labelSlideUp', 'labelSlideDown', 'descriptionSlideUp'
      // KO:
      //  'labelSplit4', 'labelSplitVert', 'labelAppearSplit4', 'labelAppearSplitVert' 
      // TODO:
      //  'rotateCornerBL', 'rotateCornerBR', 'imageSplit4', 'imageSplitVert', 'imageRotateCornerBL', 'imageRotateCornerBR', 'imageFlipHorizontal', 'imageFlipVertical'

    
   
      var newEffects=[];
      for( var i=0; i< effects.length; i++ ) {
        switch( effects[i].name.toUpperCase() ) {
          case 'BORDERLIGHTER':
            var color=tinycolor(ColorSchemeGetCurrent().thumbnail.borderColor);
            name='thumbnail_borderColor_'+color.toRgbString()+'_'+color.lighten(50).toRgbString();
            newEffects.push(ThumbnailHoverEffectExtract(name, effects[i]));
            break;
          case 'BORDERDARKER':
            var color=tinycolor(ColorSchemeGetCurrent().thumbnail.borderColor);
            name='thumbnail_borderColor_'+color.toRgbString()+'_'+color.darken(50).toRgbString();
            newEffects.push(ThumbnailHoverEffectExtract(name, effects[i]));
            break;
          case 'SCALE120':
            newEffects.push(ThumbnailHoverEffectExtract('thumbnail_scale_1.00_1.20', effects[i]));
            break;
          case 'LABELAPPEAR':
          case 'LABELAPPEAR75':
            newEffects.push(ThumbnailHoverEffectExtract('label_opacity_0.00_1.00', effects[i]));
            break;
          case 'TOOLSAPPEAR':
            newEffects.push(ThumbnailHoverEffectExtract('tools_opacity_0_1', effects[i]));
            break;
          case 'TOOLSSLIDEDOWN':
            newEffects.push(ThumbnailHoverEffectExtract('tools_translateY_-100%_0%', effects[i]));
            break;
          case 'TOOLSSLIDEUP':
            newEffects.push(ThumbnailHoverEffectExtract('tools_translateY_100%_0%', effects[i]));
            break;
          case 'LABELOPACITY50':
            newEffects.push(ThumbnailHoverEffectExtract('label_opacity_1.00_0.50', effects[i]));
            break;
          case 'SCALELABELOVERIMAGE':
            newEffects.push(ThumbnailHoverEffectExtract('label_scale_0.00_1.00', effects[i]));
            var n=cloneJSObject(effects[i]);
            newEffects.push(ThumbnailHoverEffectExtract('image_scale_1.00_0.00', n));
            break;
          case 'OVERSCALE':
          case 'OVERSCALEOUTSIDE':
            name='label_scale_0_100';
            newEffects.push(ThumbnailHoverEffectExtract('label_scale_2.00_1.00', effects[i]));
            var n=cloneJSObject(effects[i]);
            newEffects.push(ThumbnailHoverEffectExtract('label_opacity_0.00_1.00', n));
            n=cloneJSObject(effects[i]);
            newEffects.push(ThumbnailHoverEffectExtract('image_scale_1.00_0.00', n));
            n=cloneJSObject(effects[i]);
            newEffects.push(ThumbnailHoverEffectExtract('image_opacity_1.00_0.00', n));
            break;
          case 'DESCRIPTIONAPPEAR':
            newEffects.push(ThumbnailHoverEffectExtract('description_opacity_0_1', effects[i]));
            break;
          case 'SLIDERIGHT':
            newEffects.push(ThumbnailHoverEffectExtract('image_translateX_0%_100%', effects[i]));
            newEffects.push(ThumbnailHoverEffectExtract('label_translateX_-100%_0%', cloneJSObject(effects[i])));
            break;
          case 'SLIDELEFT':
            newEffects.push(ThumbnailHoverEffectExtract('image_translateX_0%_-100%', effects[i]));
            newEffects.push(ThumbnailHoverEffectExtract('label_translateX_100%_0%', cloneJSObject(effects[i])));
            break;
          case 'SLIDEUP':
            newEffects.push(ThumbnailHoverEffectExtract('image_translateY_0%_-100%', effects[i]));
            newEffects.push(ThumbnailHoverEffectExtract('label_translateY_100%_0%', cloneJSObject(effects[i])));
            break;
          case 'SLIDEDOWN':
            newEffects.push(ThumbnailHoverEffectExtract('image_translateY_0%_100%', effects[i]));
            newEffects.push(ThumbnailHoverEffectExtract('label_translateY_-100%_0%', cloneJSObject(effects[i])));
            break;
          case 'IMAGESCALE150':
          case 'IMAGESCALE150OUTSIDE':
            newEffects.push(ThumbnailHoverEffectExtract('image_scale_1.00_1.50', effects[i]));
            break;
          case 'IMAGESCALEIN80':
            newEffects.push(ThumbnailHoverEffectExtract('image_scale_1.20_1.00', effects[i]));
            break;
          case 'IMAGESLIDERIGHT':
            newEffects.push(ThumbnailHoverEffectExtract('image_translateX_0%_100%', effects[i]));
            break;
          case 'IMAGESLIDELEFT':
            newEffects.push(ThumbnailHoverEffectExtract('image_translateX_0%_-100%', effects[i]));
            break;
          case 'IMAGESLIDEUP':
            newEffects.push(ThumbnailHoverEffectExtract('image_translateY_0%_-100%', effects[i]));
            break;
          case 'IMAGESLIDEDOWN':
            newEffects.push(ThumbnailHoverEffectExtract('image_translateY_0%_100%', effects[i]));
            break;
          case 'LABELSLIDEUP':
          case 'LABELSLIDEUPTOP':
            newEffects.push(ThumbnailHoverEffectExtract('label_translateY_100%_0%', effects[i]));
            break;
          case 'LABELSLIDEUPDOWN':
            newEffects.push(ThumbnailHoverEffectExtract('label_translateY_0%_100%', effects[i]));
            break;
          case 'DESCRIPTIONSLIDEUP':
            newEffects.push(ThumbnailHoverEffectExtract('description_translateY_110%_0%', effects[i]));
            break;

          case 'IMAGEBLURON':
            newEffects.push(ThumbnailHoverEffectExtract('image_blur_2.00px_0.00px', effects[i]));
            break;
          case 'IMAGEBLUROFF':
            newEffects.push(ThumbnailHoverEffectExtract('image_blur_0.00px_2.00px', effects[i]));
            break;
          case 'IMAGEGRAYON':
            newEffects.push(ThumbnailHoverEffectExtract('image_grayscale_0%_100%', effects[i]));
            break;
          case 'IMAGEGRAYOFF':
            newEffects.push(ThumbnailHoverEffectExtract('image_grayscale_100%_0%', effects[i]));
            break;
          case 'IMAGESEPIAON':
            newEffects.push(ThumbnailHoverEffectExtract('image_sepia_100%_1%', effects[i]));
            break;
          case 'IMAGESEPIAOFF':
            newEffects.push(ThumbnailHoverEffectExtract('image_sepia_1%_100%', effects[i]));
            break;
            
          default:
            newEffects.push(effects[i]);
            break;
        }
      }
      
      return newEffects;
    }

    function cloneJSObject( obj ) {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }

      var temp = obj.constructor(); // give temp the original obj's constructor
      for (var key in obj) {
          temp[key] = cloneJSObject(obj[key]);
      }
      return temp;
    }


    // Thumbnail hover effect definition
    function NewTHoverEffect() {
      var oDef={ 
          name:           '',
          element:        '',               // element class
          type:           '',               
          from:           '',               // start value
          to:             '',               // end value
          hoverin:        true,
          hoverout:       true,
          firstKeyframe:  true,
          delay:          0,
          delayBack:      0,
          duration:       400,
          durationBack:   300,
          easing:         'easeOutQuart',
          easingBack:     'easeOutQuart',
          animParam:      null
        };
      return oDef;
    }

    function NewTBuildInit() {
      // to set CSS properties
      var oDef={ element: '', property: '', value: '' };
      return oDef;
    }

    
    // build a dummy thumbnail to get different sizes and to cache them
    function ThumbnailDefCaches() {
      
        // thumbnail content CSS styles
        // if( G.O.thumbnailLabel.display ) {
        switch( G.O.thumbnailLabel.position ){
          case 'onBottom' :
            G.tn.style.lN.annotation='top:0; position:relative;';
            G.tn.style.l1.annotation='top:0; position:relative;';
            if( G.layout.engine == 'CASCADING' ) {
              // line break --> title and description can be multi-line
              G.tn.style.lN.label='top:auto; bottom:0; position:relative;';
              G.tn.style.l1.label='top:auto; bottom:0; position:relative;';
              if( G.O.thumbnailLabel.titleMultiLine ) {
                G.tn.style.lN.title='white-space:normal;';
                G.tn.style.l1.title='white-space:normal;';
              }
              if( G.O.thumbnailLabel.descriptionMultiLine ) {
                G.tn.style.lN.desc='white-space:normal;';
                G.tn.style.l1.desc='white-space:normal;';
              }
            }
            break;
          case 'overImageOnTop' :
            G.tn.style.lN.annotation='top:0; bottom:0;';
            G.tn.style.l1.annotation='top:0; bottom:0;';
            G.tn.style.l1.label='top:0; position:absolute;';
            G.tn.style.lN.label='top:0; position:absolute;';
            if( G.O.thumbnailLabel.titleMultiLine ) {
              G.tn.style.lN.title='white-space:normal;';
              G.tn.style.l1.title='white-space:normal;';
            }
            if( G.O.thumbnailLabel.descriptionMultiLine ) {
              G.tn.style.lN.desc='white-space:normal;';
              G.tn.style.l1.desc='white-space:normal;';
            }
            break;
          case 'overImageOnMiddle' :
            G.tn.style.lN.annotation='top:0; bottom:0;';
            G.tn.style.lN.label='top:0; bottom:0;';
            G.tn.style.l1.annotation='top:0; bottom:0;';
            G.tn.style.l1.label='top:0; bottom:0;';
            G.tn.style.lN.title='position:absolute; bottom:50%;';
            G.tn.style.l1.title='position:absolute; bottom:50%;';
            G.tn.style.lN.desc='position:absolute; top:50%;';
            G.tn.style.l1.desc='position:absolute; top:50%;';
            if( G.O.thumbnailLabel.titleMultiLine ) {
              G.tn.style.lN.title+='white-space:normal;';
              G.tn.style.l1.title+='white-space:normal;';
            }
            if( G.O.thumbnailLabel.descriptionMultiLine ) {
              G.tn.style.lN.desc+='white-space:normal;';
              G.tn.style.l1.desc+='white-space:normal;';
            }
            break;
          case 'custom' :
            break;
          case 'overImageOnBottom' :
          default :
            G.O.thumbnailLabel.position='overImageOnBottom';
            G.tn.style.lN.annotation='bottom:0;';
            G.tn.style.lN.label='bottom:0; position:absolute;';
            G.tn.style.l1.annotation='bottom:0;';
            G.tn.style.l1.label='bottom:0; position:absolute;';
            if( G.O.thumbnailLabel.titleMultiLine ) {
              G.tn.style.lN.title='white-space:normal;';
              G.tn.style.l1.title='white-space:normal;';
            }
            if( G.O.thumbnailLabel.descriptionMultiLine ) {
              G.tn.style.lN.desc='white-space:normal;';
              G.tn.style.l1.desc='white-space:normal;';
            }
            break;
        }
        switch( G.O.thumbnailLabel.align ) {
          case 'right':
              G.tn.style.l1.label+='text-align:right;';
              G.tn.style.lN.label+='text-align:right;';
            break;
          case 'left':
              G.tn.style.l1.label+='text-align:left;';
              G.tn.style.lN.label+='text-align:left;';
            break;
          default:
              G.tn.style.l1.label+='text-align:center;';
              G.tn.style.lN.label+='text-align:center;';
            break;
        }
        if( G.O.thumbnailLabel.titleFontSize != undefined && G.O.thumbnailLabel.titleFontSize != '' ) {
          G.tn.style.lN.title+='font-size:'+G.O.thumbnailLabel.titleFontSize+';';
          G.tn.style.l1.title+='font-size:'+G.O.thumbnailLabel.titleFontSize+';';
        }
        if( G.O.thumbnailLabel.descriptionFontSize != undefined && G.O.thumbnailLabel.descriptionFontSize != '' ) {
          G.tn.style.lN.desc+='font-size:'+G.O.thumbnailLabel.descriptionFontSize+';';
          G.tn.style.l1.desc+='font-size:'+G.O.thumbnailLabel.descriptionFontSize+';';
        }
        
      // }
      if( G.O.thumbnailL1Label && G.O.thumbnailL1Label.display ) {
        switch( G.O.thumbnailL1Label.position ){
          case 'onBottom' :
            G.tn.style.l1.annotation='top:0; position:relative;';
            if( G.layout.engine == 'CASCADING' ) {
              // line break
              G.tn.style.l1.label='top:auto; bottom:0;';
              if( G.O.thumbnailL1Label.titleMultiLine ) {
                G.tn.style.l1.title='white-space:normal;';
              }
              if( G.O.thumbnailL1Label.descriptionMultiLine ) {
                G.tn.style.l1.desc='white-space:normal;';
              }
            }
            break;
          case 'overImageOnTop' :
            G.tn.style.l1.annotation='top:0; bottom:0;';
            G.tn.style.l1.label='top:0; bottom:0;';
            if( G.O.thumbnailL1Label.titleMultiLine ) {
              G.tn.style.l1.title='white-space:normal;';
            }
            if( G.O.thumbnailL1Label.descriptionMultiLine ) {
              G.tn.style.l1.desc='white-space:normal;';
            }
            break;
          case 'overImageOnMiddle' :
            G.tn.style.l1.annotation='top:0; bottom:0;';
            G.tn.style.l1.label='top:0; bottom:0;';
            G.tn.style.l1.title='position:absolute; bottom:50%;';
            G.tn.style.l1.desc='position:absolute; top:50%;';
            if( G.O.thumbnailL1Label.titleMultiLine ) {
              G.tn.style.l1.title+='white-space:normal;';
            }
            if( G.O.thumbnailL1Label.descriptionMultiLine ) {
              G.tn.style.l1.desc+='white-space:normal;';
            }
            break;
          case 'custom' :
            G.tn.style.l1.annotation='';
            if( G.O.thumbnailL1Label.titleMultiLine ) {
              G.tn.style.l1.title='white-space:normal;';
            }
            if( G.O.thumbnailL1Label.descriptionMultiLine ) {
              G.tn.style.l1.desc='white-space:normal;';
            }
            break;
          case 'overImageOnBottom':
          default :
            G.O.thumbnailL1Label.position='overImageOnBottom';
            G.tn.style.l1.annotation='bottom:0;';
            G.tn.style.l1.label='bottom:0;';
            if( G.O.thumbnailL1Label.titleMultiLine ) {
              G.tn.style.l1.title='white-space:normal;';
            }
            if( G.O.thumbnailL1Label.descriptionMultiLine ) {
              G.tn.style.l1.desc='white-space:normal;';
            }
            break;
        }
        switch( G.O.thumbnailL1Label.align ) {
          case 'right':
              G.tn.style.l1.label+='text-align:right;';
            break;
          case 'left':
              G.tn.style.l1.label+='text-align:left;';
            break;
          default:
              G.tn.style.l1.label+='text-align:center;';
            break;
        }
        if( G.O.thumbnailL1Label.titleFontSize != undefined && G.O.thumbnailL1Label.titleFontSize != '' ) {
          G.tn.style.l1.title+='font-size:'+G.O.thumbnailL1Label.titleFontSize+';';
        }
        if( G.O.thumbnailL1Label.descriptionFontSize != undefined && G.O.thumbnailL1Label.descriptionFontSize != '' ) {
          G.tn.style.l1.desc+='font-size:'+G.O.thumbnailL1Label.titleFontSize+';';
        }
      }
      
      G.tn.borderWidth=G.O.thumbnailBorderHorizontal;
      G.tn.borderHeight=G.O.thumbnailBorderVertical;
      
      
      // Retrieve info for level LN
      // TODO: do this only for grid layout and label onBottom

      // retrieve annotation (label+description) height -> now done on every gallery render for the most accurate value
      // if( G.O.thumbnailLabel.get('position') == 'onBottom' ) {
      //  G.GOM.curNavLevel='lN';
      //  var lh=ThumbnailGetAnnotationHeight()
      //  G.tn.labelHeight.lN= lh;
      //  G.tn.labelHeight.l1= lh;
      //  G.GOM.curNavLevel='l1';
      //}

      // default thumbnail sizes levels l1 and lN
      var lst=['xs','sm','me','la','xl'];
      for( var i=0; i< lst.length; i++ ) {
        var w=G.tn.settings.width['lN'][lst[i]];
        if( w != 'auto' ) {
          G.tn.defaultSize.width['lN'][lst[i]]=w;
          G.tn.defaultSize.width['l1'][lst[i]]=w;
        }
        else {
          var h=G.tn.settings.height['lN'][lst[i]];
          G.tn.defaultSize.width['lN'][lst[i]]=h;      // dynamic width --> set height value as default for the width
          G.tn.defaultSize.width['l1'][lst[i]]=h;      // dynamic width --> set height value as default
        }
      }
      for( var i=0; i< lst.length; i++ ) {
        var h=G.tn.settings.height['lN'][lst[i]];
        if( h != 'auto' ) {
          // grid or justified layout
          G.tn.defaultSize.height['lN'][lst[i]]=h;  //+G.tn.labelHeight.get();
          G.tn.defaultSize.height['l1'][lst[i]]=h;  //+G.tn.labelHeight.get();
        }
        else {
          var w=G.tn.settings.width['lN'][lst[i]];
          G.tn.defaultSize.height['lN'][lst[i]]=w;      // dynamic height --> set width value as default for the height
          G.tn.defaultSize.height['l1'][lst[i]]=w;      // dynamic height --> set width value as default
        }
      }


      // Retrieve info for level L1
      // TODO: do this only for grid layout and label onBottom
      // if( G.O.thumbnailLabel.get('position') == 'onBottom' ) {
      //   G.GOM.curNavLevel='l1';
      //   var lh=ThumbnailGetAnnotationHeight()
      //   // G.tn.labelHeight.l1= $newDiv.find('.nGY2GThumbnailLabel').outerHeight(true);
      //   G.tn.labelHeight.l1= lh;
      // }
      
      
      // default thumbnail sizes levels l1 and lN
      var lst=['xs','sm','me','la','xl'];
      for( var i=0; i< lst.length; i++ ) {
        var w=G.tn.settings.width['l1'][lst[i]];
        if( w != 'auto' ) {
          G.tn.defaultSize.width['l1'][lst[i]]=w;
        }
        else {
          var h=G.tn.settings.height['l1'][lst[i]];
          G.tn.defaultSize.width['l1'][lst[i]]=h;      // dynamic width --> set height value as default
        }
      }
      for( var i=0; i< lst.length; i++ ) {
        var h=G.tn.settings.height['l1'][lst[i]];
        if( h != 'auto' ) {
          // grid or justified layout
          G.tn.defaultSize.height['l1'][lst[i]]=h;  //+G.tn.labelHeight.get();
        }
        else {
          var w=G.tn.settings.width['l1'][lst[i]];
          G.tn.defaultSize.height['l1'][lst[i]]=w;      // dynamic height --> set width value as default
        }
      }
      
    }
    

    // ##### THUMBNAIL SIZE MANAGEMENT
    function ThumbnailsSetSize( dir, level, v, crop ) {
      G.tn.settings[dir][level]['xs']=v;
      G.tn.settings[dir][level]['sm']=v;
      G.tn.settings[dir][level]['me']=v;
      G.tn.settings[dir][level]['la']=v;
      G.tn.settings[dir][level]['xl']=v;
      G.tn.settings[dir][level]['xsc']=crop;
      G.tn.settings[dir][level]['smc']=crop;
      G.tn.settings[dir][level]['mec']=crop;
      G.tn.settings[dir][level]['lac']=crop;
      G.tn.settings[dir][level]['xlc']=crop;
    }


    //
    function ColorSchemeGetCurrent() {
      var cs=null;
      switch(toType(G.O.colorScheme)) {
        case 'object':    // user custom color scheme object 
          cs=G.colorScheme_dark;  // default color scheme
          jQuery.extend(true,cs,G.O.colorScheme);
          break;
        case 'string':    // name of an internal defined color scheme
          switch( G.O.colorScheme ) {
            case 'light':
              cs=G.colorScheme_light;
              break;
            case 'default':
            case 'dark':
            case 'none':
            default:
              cs=G.colorScheme_dark;
          }
          break;
        default:
          cs=G.colorScheme_dark;
      }
      return cs;
    }
    
    // ##### BREADCRUMB/THUMBNAIL COLOR SCHEME #####
    function SetColorScheme() {
      var cs=null;
      var colorSchemeLabel='';
      switch(toType(G.O.colorScheme)) {
        case 'object':    // user custom color scheme object 
          cs=G.colorScheme_dark;  // default color scheme
          jQuery.extend(true,cs,G.O.colorScheme);
          colorSchemeLabel='nanogallery_colorscheme_custom_'+G.baseEltID;
          break;
        case 'string':    // name of an internal defined color scheme
          switch( G.O.colorScheme ) {
            case 'light':
              cs=G.colorScheme_light;
              colorSchemeLabel='nanogallery_colorscheme_light_'+G.baseEltID;
              break;
            case 'default':
            case 'dark':
            case 'none':
            default:
              cs=G.colorScheme_dark;
              colorSchemeLabel='nanogallery_colorscheme_dark_'+G.baseEltID;
          }
          break;
        default:
          NanoAlert(G, 'Error in colorScheme parameter.');
          return;
      }

      //var s1='.nanogallery_theme_'+G.O.theme+' ';
      var s1='.' + colorSchemeLabel + ' ';
    
      // navigation bar
      var s=s1+'.nGY2Navigationbar { background:'+cs.navigationBar.background+'; }'+'\n';
      if( cs.navigationBar.border !== undefined && cs.navigationBar.border !== '' ) { s+=s1+'.nGY2Navigationbar { border:'+cs.navigationBar.border+'; }'+'\n'; }
      if( cs.navigationBar.borderTop !== undefined && cs.navigationBar.borderTop !== '' ) { s+=s1+'.nGY2Navigationbar { border-top:'+cs.navigationBar.borderTop+'; }'+'\n'; }
      if( cs.navigationBar.borderBottom !== undefined && cs.navigationBar.borderBottom !== '' ) { s+=s1+'.nGY2Navigationbar { border-bottom:'+cs.navigationBar.borderBottom+'; }'+'\n'; }
      if( cs.navigationBar.borderRight !== undefined && cs.navigationBar.borderRight !== '' ) { s+=s1+'.nGY2Navigationbar { border-right:'+cs.navigationBar.borderRight+'; }'+'\n'; }
      if( cs.navigationBar.borderLeft !== undefined && cs.navigationBar.borderLeft !== '' ) { s+=s1+'.nGY2Navigationbar { border-left:'+cs.navigationBar.borderLeft+'; }'+'\n'; }
      
      // navigation bar - breadcrumb
      s+=s1+'.nGY2Breadcrumb { background:'+cs.navigationBreadcrumb.background+'; border-radius:'+cs.navigationBreadcrumb.borderRadius+'; }'+'\n';
      s+=s1+'.nGY2Breadcrumb .oneItem  { color:'+cs.navigationBreadcrumb.color+'; }'+'\n';
      s+=s1+'.nGY2Breadcrumb .oneItem:hover { color:'+cs.navigationBreadcrumb.colorHover+'; }'+'\n';

      // navigation bar - tag filter
      s+=s1+'.nGY2NavFilterUnselected { color:'+cs.navigationFilter.color+'; background:'+cs.navigationFilter.background+'; border-radius:'+cs.navigationFilter.borderRadius+'; }'+'\n';
      s+=s1+'.nGY2NavFilterSelected { color:'+cs.navigationFilter.colorSelected+'; background:'+cs.navigationFilter.backgroundSelected+'; border-radius:'+cs.navigationFilter.borderRadius+'; }'+'\n';
      s+=s1+'.nGY2NavFilterSelectAll { color:'+cs.navigationFilter.colorSelected+'; background:'+cs.navigationFilter.background+'; border-radius:'+cs.navigationFilter.borderRadius+'; }'+'\n';
      
      // thumbnails
      s+=s1+'.nGY2GThumbnail { background:'+cs.thumbnail.background+'; border-color:'+cs.thumbnail.borderColor+'; border-top-width:'+G.O.thumbnailBorderVertical+'px; border-right-width:'+G.O.thumbnailBorderHorizontal+'px; border-bottom-width:'+G.O.thumbnailBorderVertical+'px; border-left-width:'+G.O.thumbnailBorderHorizontal+'px;}'+'\n';
      s+=s1+'.nGY2GThumbnailStack { background:'+cs.thumbnail.stackBackground+'; }'+'\n';
      s+=s1+'.nGY2GThumbnailImage { background:'+cs.thumbnail.background+'; }'+'\n';
      s+=s1+'.nGY2GThumbnailAlbumUp { background:'+cs.thumbnail.background+'; color:'+cs.thumbnail.titleColor+'; }'+'\n';
      s+=s1+'.nGY2GThumbnailIconsFullThumbnail { color:'+cs.thumbnail.titleColor+'; }\n';
      s+=s1+'.nGY2GThumbnailLabel { background:'+cs.thumbnail.labelBackground+'; opacity:'+cs.thumbnail.labelOpacity+'; }'+'\n';
      s+=s1+'.nGY2GThumbnailImageTitle  { color:'+cs.thumbnail.titleColor+'; background-color:'+cs.thumbnail.titleBgColor+'; '+(cs.thumbnail.titleShadow =='' ? '': 'Text-Shadow:'+cs.thumbnail.titleShadow+';')+' }'+'\n';
      s+=s1+'.nGY2GThumbnailAlbumTitle { color:'+cs.thumbnail.titleColor+'; background-color:'+cs.thumbnail.titleBgColor+'; '+(cs.thumbnail.titleShadow =='' ? '': 'Text-Shadow:'+cs.thumbnail.titleShadow+';')+' }'+'\n';
      s+=s1+'.nGY2GThumbnailDescription { color:'+cs.thumbnail.descriptionColor+'; backgound-color:'+cs.thumbnail.descriptionBgColor+'; '+(cs.thumbnail.descriptionShadow =='' ? '': 'Text-Shadow:'+cs.thumbnail.descriptionShadow+';')+' }'+'\n';

      // thumbnails - icons
      s+=s1+'.nGY2GThumbnailIcons { padding:'+cs.thumbnailIcon.padding+'; }\n';
      s+=s1+'.nGY2GThumbnailIcon { color:'+cs.thumbnailIcon.color+'; }\n';
      s+=s1+'.nGY2GThumbnailIconTextBadge { background-color:'+cs.thumbnailIcon.color+'; }\n';
      
      // gallery pagination -> dot/rectangle based
      if( G.O.galleryPaginationMode != 'NUMBERS' ) {
        s+=s1+'.nGY2paginationDot { border:'+cs.pagination.shapeBorder+'; background:'+cs.pagination.shapeColor+';}\n';
        s+=s1+'.nGY2paginationDotCurrentPage { border:'+cs.pagination.shapeBorder+'; background:'+cs.pagination.shapeSelectedColor+';}\n';
        s+=s1+'.nGY2paginationRectangle { border:'+cs.pagination.shapeBorder+'; background:'+cs.pagination.shapeColor+';}\n';
        s+=s1+'.nGY2paginationRectangleCurrentPage { border:'+cs.pagination.shapeBorder+'; background:'+cs.pagination.shapeSelectedColor+';}\n';
      } else {
        s+=s1+'.nGY2paginationItem { background:'+cs.pagination.background+'; color:'+cs.pagination.color+'; border-radius:'+cs.pagination.borderRadius+'; }\n';
        s+=s1+'.nGY2paginationItemCurrentPage { background:'+cs.pagination.background+'; color:'+cs.pagination.color+'; border-radius:'+cs.pagination.borderRadius+'; }\n';
        s+=s1+'.nGY2PaginationPrev { background:'+cs.pagination.background+'; color:'+cs.pagination.color+'; border-radius:'+cs.pagination.borderRadius+'; }\n';
        s+=s1+'.nGY2PaginationNext { background:'+cs.pagination.background+'; color:'+cs.pagination.color+'; border-radius:'+cs.pagination.borderRadius+'; }\n';
        s+=s1+'.nGY2paginationItemCurrentPage { background:'+cs.pagination.backgroundSelected+'; }\n';
      }
      
      // gallery more button
      s+=s1+'.nGY2GalleryMoreButtonAnnotation { background:'+cs.thumbnail.background+'; border-color:'+cs.thumbnail.borderColor+'; border-top-width:'+G.O.thumbnailBorderVertical+'px; border-right-width:'+G.O.thumbnailBorderHorizontal+'px; border-bottom-width:'+G.O.thumbnailBorderVertical+'px; border-left-width:'+G.O.thumbnailBorderHorizontal+'px;}\n';
      s+=s1+'.nGY2GalleryMoreButtonAnnotation  { color:'+cs.thumbnail.titleColor+'; '+(cs.thumbnail.titleShadow =='' ? '': 'Text-Shadow:'+cs.thumbnail.titleShadow)+'; }\n';
      
      jQuery('head').append('<style id="ngycs_'+G.baseEltID+'">'+s+'</style>');
      G.$E.base.addClass(colorSchemeLabel);

    };
    
    // ##### VIEWER COLOR SCHEME #####
    function SetColorSchemeViewer( ) {

      if( G.VOM.colorSchemeLabel != '' ) {
        G.VOM.$cont.addClass(G.VOM.colorSchemeLabel);
        return;
      }

      var cs=null;
      switch(toType(G.O.colorSchemeViewer)) {
        case 'object':    // user custom color scheme object 
          cs=G.colorSchemeViewer_dark;
          jQuery.extend(true,cs,G.O.colorSchemeViewer);
          G.VOM.colorSchemeLabel='nanogallery_colorschemeviewer_custom_'+G.baseEltID;
          break;
        case 'string':    // name of an internal defined color scheme
          switch( G.O.colorSchemeViewer ) {
            case 'none':
              return;
              break;
            case 'light':
              cs=G.colorSchemeViewer_light;
              G.VOM.colorSchemeLabel='nanogallery_colorschemeviewer_light_'+G.baseEltID;
              break;
            case 'border':
              cs=G.colorSchemeViewer_border;
              G.VOM.colorSchemeLabel='nanogallery_colorschemeviewer_border_'+G.baseEltID;
              break;
            case 'dark':
            case 'default':
              cs=G.colorSchemeViewer_dark;
              G.VOM.colorSchemeLabel='nanogallery_colorschemeviewer_dark_'+G.baseEltID;
              break;
          }
          break;
        default:
          NanoAlert(G, 'Error in colorSchemeViewer parameter.');
          return;
      }

      var s1 = '.' + G.VOM.colorSchemeLabel + ' ';
      var s = s1+'.nGY2Viewer { background:'+cs.background+'; }'+'\n';
      s += s1+'.nGY2ViewerImage { border:'+cs.imageBorder+'; box-shadow:'+cs.imageBoxShadow+'; }'+'\n';
      s += s1+'.nGY2Viewer .toolbarBackground { background:'+cs.barBackground+'; }'+'\n';
      s += s1+'.nGY2Viewer .toolbar { border:'+cs.barBorder+'; color:'+cs.barColor+'; }'+'\n';
      s += s1+'.nGY2Viewer .toolbar .previousButton:after { color:'+cs.barColor+'; }'+'\n';
      s += s1+'.nGY2Viewer .toolbar .nextButton:after { color:'+cs.barColor+'; }'+'\n';
      s += s1+'.nGY2Viewer .toolbar .closeButton:after { color:'+cs.barColor+'; }'+'\n';
      s += s1+'.nGY2Viewer .toolbar .label .title { color:'+cs.barColor+'; }'+'\n';
      s += s1+'.nGY2Viewer .toolbar .label .description { color:'+cs.barDescriptionColor+'; }'+'\n';
      jQuery('head').append('<style>'+s+'</style>');
      G.VOM.$cont.addClass(G.VOM.colorSchemeLabel);
    };

    /** @function SetPolyFills */
    function SetPolyFills() {

      // POLYFILL FOR BIND function --> for older Safari mobile
      // found on MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind#Compatibility
      if (!Function.prototype.bind) {
        Function.prototype.bind = function (oThis) {
          if (typeof this !== "function") {
            // closest thing possible to the ECMAScript 5
            // internal IsCallable function
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
          }

          var aArgs = Array.prototype.slice.call(arguments, 1), 
              fToBind = this, 
              fNOP = function () {},
              fBound = function () {
                return fToBind.apply(this instanceof fNOP && oThis
                       ? this
                       : oThis,
                       aArgs.concat(Array.prototype.slice.call(arguments)));
              };

          fNOP.prototype = this.prototype;
          fBound.prototype = new fNOP();

          return fBound;
        };
      }

      // requestAnimationFrame polyfill by Erik M�ller. fixes from Paul Irish and Tino Zijdel
      // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
      // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
      // MIT license
      (function() {
        var lastTime = 0;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
          window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
          window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
        }
        if (!window.requestAnimationFrame)
          window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
          };
       
        if (!window.cancelAnimationFrame)
          window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
          };
      }());

      
      // POLYFILL FOR addEventListener/removeEventListener function --> for IE8
      // found on https://gist.github.com/jonathantneal/3748027
      try {
        !window.addEventListener && (function (WindowPrototype, DocumentPrototype, ElementPrototype, addEventListener, removeEventListener, dispatchEvent, registry) {
          WindowPrototype[addEventListener] = DocumentPrototype[addEventListener] = ElementPrototype[addEventListener] = function (type, listener) {
            var target = this;

            registry.unshift([target, type, listener, function (event) {
              event.currentTarget = target;
              event.preventDefault = function () { event.returnValue = false };
              event.stopPropagation = function () { event.cancelBubble = true };
              event.target = event.srcElement || target;

              listener.call(target, event);
            }]);

            this.attachEvent("on" + type, registry[0][3]);
          };

          WindowPrototype[removeEventListener] = DocumentPrototype[removeEventListener] = ElementPrototype[removeEventListener] = function (type, listener) {
            for (var index = 0, register; register = registry[index]; ++index) {
              if (register[0] == this && register[1] == type && register[2] == listener) {
                return this.detachEvent("on" + type, registry.splice(index, 1)[0][3]);
              }
            }
          };

          WindowPrototype[dispatchEvent] = DocumentPrototype[dispatchEvent] = ElementPrototype[dispatchEvent] = function (eventObject) {
            return this.fireEvent("on" + eventObject.type, eventObject);
          };
        })(Window.prototype, HTMLDocument.prototype, Element.prototype, "addEventListener", "removeEventListener", "dispatchEvent", []);
      }
      catch (e) {
        browserNotification();
        return false;
      }
      
      
      // array.removeIf -> removes items from array base on a function's result
      Array.prototype.removeIf = function(callback) {
        var i = this.length;
        while (i--) {
          if (callback(this[i], i)) {
            this.splice(i, 1);
          }
        }
      };      
      
    }
    
    
    function GalleryClicked(e) {
    
      var r=GalleryEventRetrieveElementl(e, false);

      if( r.GOMidx == -1 ) {
        return 'exit';
      }
      
      var idx=G.GOM.items[r.GOMidx].thumbnailIdx;
      switch( r.action ) {
        case 'OPEN':
          ThumbnailOpen(idx, false);
          return 'exit';
          break;
        case 'DISPLAY':
          // used the display icon (ignore if selection mode)
          ThumbnailOpen(idx, true);
          return 'exit';
          break;
        case 'TOGGLESELECT':
          ThumbnailSelectionToggle(idx);
          return 'exit';
          break;
        case 'SHARE':
          PopupShare(idx);
          return 'exit';
          break;
        case 'DOWNLOAD':
          DownloadImage(idx);
          return 'exit';
          break;
        case 'INFO':
          ItemDisplayInfo(G.I[idx]);
          return 'exit';
          break;
        case 'CART':
          AddToCart(idx);
          return 'exit';
          break;
        default:
          // all other actions (custom1..10, or anything else)
          if( G.O.fnThumbnailToolCustAction !== null ) {
            if( typeof G.O.fnThumbnailToolCustAction == 'function' ) {
              G.O.fnThumbnailToolCustAction(r.action, G.I[idx]);
            }
            else {
              // defined in markup
              window[G.O.fnThumbnailToolCustAction](r.action, G.I[idx]);
            }
          }
          break;
      }
    }

    // Download an image
    function DownloadImage(idx) {
      var url=G.I[idx].src;

      if( G.I[idx].downloadURL != undefined && G.I[idx].downloadURL != '' ) {
        url=G.I[idx].downloadURL;
      }
      
      var a = document.createElement('a');
      a.href = url;
      a.download = url.split('.').pop();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);      
      
    }
    
    // add one image to the shopping cart
    function AddToCart( idx ) {
      // increment counter if already in shopping cart
      var found=false;
      for( var i=0; i<G.shoppingCart.length; i++ ) {
        if( G.shoppingCart[i].idx == idx ) {
          G.shoppingCart[i].cnt++;
          if( G.O.fnShoppingCartUpdated !== null ) {
            if( typeof G.O.fnShoppingCartUpdated == 'function' ) {
              G.O.fnShoppingCartUpdated(G.shoppingCart);
            }
            else {
              // defined in markup
              window[G.O.fnShoppingCartUpdated](G.shoppingCart);
            }
          }
          TriggerCustomEvent('shoppingCartUpdated');
          return;
        }
      }
      
      // add to shopping cart
      if( !found) {
        G.shoppingCart.push( { idx:idx, ID:G.I[idx].GetID(), cnt:1} );
        if( G.O.fnShoppingCartUpdated !== null ) {
          if( typeof G.O.fnShoppingCartUpdated == 'function' ) {
            G.O.fnShoppingCartUpdated(G.shoppingCart);
          }
          else {
            // defined in markup
            window[G.O.fnShoppingCartUpdated](G.shoppingCart);
          }
        }
        TriggerCustomEvent('shoppingCartUpdated');
      }
    }
    
    
    function ThumbnailSelectionClear() {
      G.GOM.nbSelected=0;
      var nbTn=G.GOM.items.length;
      for( var i=0; i < nbTn ; i++ ) {
        var item=G.I[G.GOM.items[i].thumbnailIdx];
        if( item.selected ) {
          item.selected=false;
          if( G.O.fnThumbnailSelection !== null ) {
            if( typeof G.O.fnThumbnailSelection == 'function' ) {
              G.O.fnThumbnailSelection(item.$elt, item, G.I);
            }
            else {
              // defined in markup
              window[G.O.fnThumbnailSelection](item.$elt, item, G.I);
            }
          }
        }
        item.selected=false;
      }
    }
    
    function ThumbnailSelectionToggle(idx){
      var item=G.I[idx];
      if( item.selected === true ) {
        ThumbnailSelectionSet(item, false);
        G.GOM.nbSelected--;
        TriggerCustomEvent('itemUnSelected');
      }
      else {
        ThumbnailSelectionSet(item, true);
        G.GOM.nbSelected++;
        TriggerCustomEvent('itemSelected');
      }
    }
    
    
    // this replaces ThumbnailSelection()
    function ThumbnailSelectionSet(item, selected ){
      
      item.selected=selected;
      
      ThumbnailSelectionSetIcon( item );
      
      // called when the selection status of an item changed
      if( G.O.fnThumbnailSelection !== null ) {
        if( typeof G.O.fnThumbnailSelection == 'function' ) {
          G.O.fnThumbnailSelection(item.$elt, item, G.I);
        }
        else {
          // defined in markup
          window[G.O.fnThumbnailSelection](item.$elt, item, G.I);
        }
      }
    
    }
    
    function ThumbnailSelectionSetIcon( item ) {
      if( item.$elt == null ) {
        // thumbnail is not built
        return;
      }
      var $sub=item.$getElt('.nGY2GThumbnailSub');
      var $icon=item.$getElt('.nGY2GThumbnailIconImageSelect');
      if( item.selected === true) {
        $sub.addClass('nGY2GThumbnailSubSelected');
        $icon.addClass('nGY2ThumbnailSelected');
        $icon.removeClass('nGY2ThumbnailUnselected');
        $icon.html(G.O.icons.thumbnailSelected);
      }
      else {
        $sub.removeClass('nGY2GThumbnailSubSelected');
        $icon.removeClass('nGY2ThumbnailSelected');
        $icon.addClass('nGY2ThumbnailUnselected');
        $icon.html(G.O.icons.thumbnailUnselected);
      }
    }
    
    
    // display a modal popup for sharing image/album
    function PopupShare(idx) {
    
      // SEE SAMPLES: https://gist.github.com/chrisjlee/5196139
      // https://github.com/Julienh/Sharrre
    
    
      var item=G.I[idx];

      var currentURL=document.location.protocol +'//'+document.location.hostname + document.location.pathname;
      var newLocationHash='#nanogallery/'+G.baseEltID+'/';
      if( item.kind == 'image' ) {
        newLocationHash+=item.albumID + '/' + item.GetID();
      }
      else {
        newLocationHash+=item.GetID();
      }
    
      var content ='';
      content+='<div class="nGY2PopupOneItem" style="text-align:center;" data-share="facebook">'+G.O.icons.shareFacebook+'</div>';
      content+='<div class="nGY2PopupOneItem" style="text-align:center;" data-share="pinterest">'+G.O.icons.sharePinterest+'</div>';
      content+='<div class="nGY2PopupOneItem" style="text-align:center;" data-share="tumblr">'+G.O.icons.shareTumblr+'</div>';
      content+='<div class="nGY2PopupOneItem" style="text-align:center;" data-share="twitter">'+G.O.icons.shareTwitter+'</div>';
      content+='<div class="nGY2PopupOneItem" style="text-align:center;" data-share="googleplus">'+G.O.icons.shareGooglePlus+'</div>';
      content+='<div class="nGY2PopupOneItem" style="text-align:center;" data-share="vk">'+G.O.icons.shareVK+'</div>';
      content+='<div class="nGY2PopupOneItem" style="text-align:center;" data-share="mail">'+G.O.icons.shareMail+'</div>';
      content+='<div class="nGY2PopupOneItem" style="text-align:center;"></div>';
      content+='<input class="nGY2PopupOneItemText" readonly type="text" value="'+currentURL+newLocationHash+'" style="width:100%;text-align:center;">';
      content+='<br>';

      currentURL=encodeURIComponent(document.location.protocol +'//'+document.location.hostname + document.location.pathname + newLocationHash);

      var currentTitle=item.title;
      var currentTn=item.thumbImg().src;
      
      
      Popup('Share to:', content, 'Center');
      
      G.popup.$elt.find('.nGY2PopupOneItem').on('click', function(e) {
        e.stopPropagation();
        
        var shareURL='';
        var found=true;
        switch(jQuery(this).attr('data-share').toUpperCase()) {
          case 'FACEBOOK':
            // <a name="fb_share" type="button" href="http://www.facebook.com/sharer.php?u={$url}&media={$imgPath}&description={$desc}" class="joinFB">Share Your Advertise</a>
            //window.open("https://www.facebook.com/sharer.php?u="+currentURL,"","height=368,width=600,left=100,top=100,menubar=0");
            shareURL='https://www.facebook.com/sharer.php?u='+currentURL;
            break;
          case 'VK':
            shareURL='http://vk.com/share.php?url='+currentURL;
            break;
          case 'GOOGLEPLUS':
            shareURL="https://plus.google.com/share?url="+currentURL;
            break;
          case 'TWITTER':
            // shareURL="https://twitter.com/share?url="+currentURL+"&text="+currentTitle;
            shareURL='https://twitter.com/intent/tweet?text='+currentTitle+'url='+ currentURL;
            break;
          case 'PINTEREST':
            // shareURL='https://pinterest.com/pin/create/bookmarklet/?media='+currentTn+'&url='+currentURL+'&description='+currentTitle;
            shareURL='https://pinterest.com/pin/create/button/?media='+currentTn+'&url='+currentURL+'&description='+currentTitle;
            break;
          case 'TUMBLR':
            //shareURL='https://www.tumblr.com/widgets/share/tool/preview?caption=<strong>'+currentTitle+'</strong>&tags=nanogallery2&url='+currentURL+'&shareSource=legacy&posttype=photo&content='+currentTn+'&clickthroughUrl='+currentURL;
            shareURL='http://www.tumblr.com/share/link?url='+currentURL+'&name='+currentTitle;
            break;
          case 'MAIL':
            shareURL='mailto:?subject='+currentTitle;+'&body='+ currentURL;
            break;
          default:
            found=false;
            break;
        }
        
        if( found ) {
          window.open(shareURL,"","height=550,width=500,left=100,top=100,menubar=0");          window.open(shareURL,"","height=550,width=500,left=100,top=100,menubar=0");
          G.popup.close();
          // $popup.remove();
        }
        
      });
    }
    
    // build a modal popup
    function Popup(title, content, align) {
      var pp =  '<div class="nGY2Popup" style="opacity:0;"><div class="nGY2PopupContent'+align+'">';
      pp +=     '<div class="nGY2PopupCloseButton">'+G.O.icons.buttonClose+'</div>';
      pp +=     '<div class="nGY2PopupTitle">'+title+'</div>';
      pp +=     content;
      pp +=     '</div></div>';
      
      G.popup.$elt=jQuery(pp).appendTo('body');
      setElementOnTop( G.VOM.$viewer, G.popup.$elt);
      
      G.popup.isDisplayed=true;
      
      var tweenable = new NGTweenable();
      tweenable.tween({
        from:       { opacity:0  },
        to:         { opacity:1 },
        easing:     'easeInOutSine',
        duration:   180,
        step:       function (state, att) {
          G.popup.$elt.css('opacity',state.opacity);
        },
        finish:     function (state, att) {
          G.popup.$elt.css('opacity',1);
        }
      });
      
      G.popup.$elt.find('.nGY2PopupCloseButton').on('click', function(e) {
        e.stopPropagation();
        G.popup.close();
      });
      
    }


    function GalleryMouseEnter(e) {
      if( !G.VOM.viewerDisplayed && G.GOM.albumIdx != -1 ) {
        var r=GalleryEventRetrieveElementl(e, true);
        // if( r.action == 'OPEN' && r.GOMidx != -1 ) {
        if( r.GOMidx != -1 ) {
          var target = e.target || e.srcElement;
          // if( target.getAttribute('class') != 'nGY2GThumbnail' ) { return; }
          ThumbnailHover(r.GOMidx);
        }
      }
    }
    
    function GalleryMouseLeave(e) {
      if( !G.VOM.viewerDisplayed && G.GOM.albumIdx != -1 ) {
        var r=GalleryEventRetrieveElementl(e, true);
        if( r.GOMidx != -1 ) {
          var target = e.target || e.srcElement;
          // if( target.getAttribute('class') != 'nGY2GThumbnail' ) { return; }
          ThumbnailHoverOut(r.GOMidx);
        }
      }
    }
    
    function GalleryEventRetrieveElementl( e, ignoreSubItems ) {
      var r= { action:'NONE', GOMidx:-1 };
      
      if( e == undefined ) {
        return r;
      }
      var target = e.target || e.srcElement;
      while( target != G.$E.conTnParent[0] ) {       // loop element parent up to find the thumbnail element
        if( jQuery(target).hasClass('nGY2GThumbnail') ) {
          if( r.action == 'NONE' ) {
            r.action='OPEN';
          }
          r.GOMidx=jQuery(target).data('index');
          return r;
        }
        // if( !ignoreSubItems && jQuery(target).hasClass('nGY2GThumbnailIcon') ) {
        if( !ignoreSubItems ) {
          var a=jQuery(target).data('ngy2action');
          if( a != '' && a != undefined ) {
            r.action=a;
          }
        }
        if( target.parentNode == null ) {
          return r;
        }
        target = target.parentNode;
      }
      return r;
    }
    

    // Open one thumbnail
    function ThumbnailOpen( idx, ignoreSelected ) {
      var item=G.I[idx];

      if( G.O.fnThumbnailClicked !== null ) {
        if( typeof G.O.fnThumbnailClicked == 'function' ) {
          G.O.fnThumbnailClicked(item.$elt, item);
        }
        else {
          // defined in markup
          window[G.O.fnThumbnailClicked](item.$elt, item);
        }
      }
      
      // open URL
      if( item.destinationURL !== undefined && item.destinationURL.length > 0 ) {
        window.location = item.destinationURL;
        return;
      }

      switch( item.kind ) {
        case 'image':
          if( ignoreSelected === false && G.GOM.nbSelected > 0 ) {
            ThumbnailSelectionToggle(idx);
          }
          else {
            // display image
            DisplayPhotoIdx(idx);
          }
          break;
        case 'album':
          if( ignoreSelected === false && G.GOM.nbSelected > 0 ) {
            ThumbnailSelectionToggle(idx);
          }
          else {
            DisplayAlbum('-1', item.GetID());
          }
          break;
        case 'albumUp':
          var parent=NGY2Item.Get(G, item.albumID);
          DisplayAlbum('-1', parent.albumID);
          break;
      }
    }
    

    // Open link to original image (new window)
    function OpenOriginal( item ) {
      switch( G.O.kind ) {
        case 'flickr':
          var sU='https://www.flickr.com/photos/'+G.O.userID+'/'+item.GetID();
          window.open(sU,'_blank');
          break;
        case 'picasa':
        case 'google':
        case 'google2':
          var sU='https://plus.google.com/photos/'+G.O.userID+'/albums/'+item.albumID+'/'+item.GetID();
          window.open(sU,'_blank');
          break;
        default:
          break;
      }
    }
    
    // Display one photo (with internal or external viewer)
    function DisplayPhotoIdx( ngy2ItemIdx ) {

      if( !G.O.thumbnailOpenImage ) { return; }

      if( G.O.thumbnailOpenOriginal ) {
        // Open link to original image
        OpenOriginal( G.I[ngy2ItemIdx] );
        return;
      }
        
      var items=[];
      
      G.VOM.currItemIdx=0;
      G.VOM.items=[];
      G.VOM.albumID=G.I[ngy2ItemIdx].albumID;
      
      var vimg=new VImg(ngy2ItemIdx);
      G.VOM.items.push(vimg);
      items.push(G.I[ngy2ItemIdx]);
      //TODO -> danger? -> pourquoi reconstruire la liste si d�j� ouvert (back/forward)     
      var l=G.I.length;
      for( var idx=ngy2ItemIdx+1; idx<l ; idx++) {
        var item=G.I[idx];
        if( item.kind == 'image' && item.isToDisplay(G.VOM.albumID) && item.destinationURL == '' ) {
          var vimg=new VImg(idx);
          G.VOM.items.push(vimg);
          items.push(item);
        }
      }
      var last=G.VOM.items.length;
      var cnt=1;
      for( var idx=0; idx<ngy2ItemIdx ; idx++) {
        var item=G.I[idx];
        if( item.kind == 'image' && item.isToDisplay(G.VOM.albumID) && item.destinationURL == '' ) {
          var vimg=new VImg(idx);
          vimg.imageNumber=cnt;
          G.VOM.items.push(vimg);
          items.push(item);
          cnt++;
        }
      }
      for( var i=0; i<last; i++ ) {
        G.VOM.items[i].imageNumber=cnt;
        cnt++;
      }
    
      // opens image with external viewer
      if( G.O.fnThumbnailOpen !== null ) {
        if( typeof G.O.fnThumbnailOpen == 'function' ) {
          G.O.fnThumbnailOpen(items);
        }
        else {
          // defined in markup
          window[G.O.fnThumbnailOpen](items);
        }
        return;
      }
    
      // use internal viewer
      if( !G.VOM.viewerDisplayed ) {
        // build viewer and display
        OpenInternalViewer();
      }
      else {
        // display in current viewer
        // G.VOM.$imgC.css({ opacity:0, left:0, visibility:'hidden' }).attr('src','');
        G.VOM.$imgC.css({ opacity:0 }).attr('src','');
        G.VOM.ImageLoader.loadImage(VieweImgSizeRetrieved, G.VOM.NGY2Item(0));
        G.VOM.$imgC.children().eq(0).attr('src',G.emptyGif).attr('src', G.VOM.NGY2Item(0).responsiveURL());
        // ViewerDisplayDominantColors(G.VOM.NGY2Item(0), G.VOM.$imgC.children());
        DisplayInternalViewer(0, '');
      }
    }
    
    function ViewerDisplayDominantColors(item, $img) {
      // if( item.imageDominantColors != null ) {
        // $img.css({ 'background': "url('data:image/gif;base64,"+item.imageDominantColors+"') no-repeat", 'background-size': '100% 100%'});
      // }
    }

    
    // is callbacked as soon as the size of an image has been retrieved
    function VieweImgSizeRetrieved(w, h, item, n) {
      item.imageWidth = w;
      item.imageHeight = h;

      if( G.VOM.$imgC !== null && G.VOM.$imgC.children().attr('src') == item.responsiveURL() ) {
        G.VOM.$imgC.css('opacity', 1);
        G.VOM.zoom.userFactor=1;
      }
      ViewerImageSetPosAndZoom();

    }
    

    function ViewerZoomStart() {
      if( G.O.viewerZoom && !G.VOM.viewerImageIsChanged ) {
        var item=G.VOM.NGY2Item(0);
        if( item.imageHeight > 0 && item.imageWidth > 0 ) {
          if( G.VOM.zoom.isZooming === false ) {
            // default zoom
            G.VOM.zoom.userFactor=1;
            G.VOM.zoom.isZooming=true;
          }
          return true;
        }
      }
    }
          
    function ViewerZoomIn( zoomIn ) {
      if( zoomIn ) {
        // zoom in
        G.VOM.zoom.userFactor+=0.1;
        ViewerZoomMax();
      }
      else {
        // zoom out
        G.VOM.zoom.userFactor-=0.1;
        ViewerZoomMin();
      }
      ViewerImageSetPosAndZoom();
    }
    
    function ViewerZoomMax() {
      if( G.VOM.zoom.userFactor > 3 ) {
        G.VOM.zoom.userFactor = 3;
      }
    }
    function ViewerZoomMin() {
      if( G.VOM.zoom.userFactor < 0.2 ) {
        G.VOM.zoom.userFactor = 0.2;
      }
    }
    
    
    
    // Set position and size of all 3 image containers
    function ViewerImageSetPosAndZoom() {
    
      if( !G.VOM.zoom.isZooming ) {
        G.VOM.zoom.userFactor=1;
      }
      
      ViewerImageSetPosAndZoomOne( G.VOM.NGY2Item(0), G.VOM.$imgC, true );
      ViewerImageSetPosAndZoomOne( G.VOM.NGY2Item(-1), G.VOM.$imgP, false );
      ViewerImageSetPosAndZoomOne( G.VOM.NGY2Item(1), G.VOM.$imgN, false );
    }
    

    // Set position and size of ONE image container
    function ViewerImageSetPosAndZoomOne(item, $img, isCurrent ) {

      if( item.imageHeight == 0 || item.imageWidth == 0 ) { 
        $img.css('opacity', 0);
        return;
      }

      // part 1: set the image size
      var zoomUserFactor = isCurrent == true ? G.VOM.zoom.userFactor : 1;
      
      // retrieve the base zoom factor (image fill screen)
      var zoomBaseFactorW = (G.VOM.window.lastWidth - G.VOM.padding.V) / (item.imageWidth / window.devicePixelRatio);
      var zoomBaseFactorH = (G.VOM.window.lastHeight - G.VOM.padding.H) / (item.imageHeight / window.devicePixelRatio);
      var zoomBaseFactor = Math.min(zoomBaseFactorW,zoomBaseFactorH);
      if( zoomBaseFactor > 1 && G.O.viewerImageDisplay != 'upscale' ) {
        // no upscale
        zoomBaseFactor=1;
      }
        

      var imageCurrentHeight = (item.imageHeight / window.devicePixelRatio) * zoomUserFactor * zoomBaseFactor;
      var imageCurrentWidth = (item.imageWidth / window.devicePixelRatio) * zoomUserFactor * zoomBaseFactor;
      $img.children().eq(0).css( {'height': imageCurrentHeight });
      $img.children().eq(0).css( {'width': imageCurrentWidth });

      // retrieve posX/Y to center image
      var posX = 0;
      if( imageCurrentWidth > G.VOM.window.lastWidth ) {
        posX = -(imageCurrentWidth-G.VOM.window.lastWidth)/2;
      }
      var posY = 0;
      if( imageCurrentHeight > G.VOM.window.lastHeight ) {
        posY = ( imageCurrentHeight - G.VOM.window.lastHeight ) / 2;
      }
      posY = 0;   // actually, it seems that the image is always centered vertically -> so no need to to anything
      
      // Part 2: set the X/Y position
      if( isCurrent ) {
        if( !G.VOM.zoom.isZooming ) {
          G.VOM.panPosX = 0;
          G.VOM.panPosY = 0;
        }
        G.VOM.zoom.posX = posX;
        G.VOM.zoom.posY = posY;
        ViewerImagePanSetPosition(G.VOM.panPosX, G.VOM.panPosY, $img[0], false);
      }
      // else {
        //$img[0].style[G.CSStransformName]= 'translate3D('+ posX+'px, '+ posY+'px, 0) ';
      // }
      
    }

    // position the image depending on the zoom factor and the pan X/Y position
    function ViewerImagePanSetPosition(posX, posY, img, savePosition ) {

      if( savePosition ) {
        G.VOM.panPosX=posX;
        G.VOM.panPosY=posY;
      }

      posX+=G.VOM.zoom.posX;
      posY+=G.VOM.zoom.posY;
    
      img.style[G.CSStransformName]= 'translate3D('+ posX+'px, '+ posY+'px, 0) ';
    }
    

      // display image with internal viewer
    function OpenInternalViewer(  ) {

      G.VOM.viewerDisplayed=true;
      G.GOM.firstDisplay=false;
      jQuery('body').css({overflow:'hidden'});  //avoid scrollbars

      G.VOM.$cont = jQuery('<div  class="nGY2 nGY2ViewerContainer" style="opacity:1"></div>').appendTo('body');
      
      SetColorSchemeViewer();

      G.VOM.$viewer = jQuery('<div class="nGY2Viewer" style="opacity:0" itemscope itemtype="http://schema.org/ImageObject"></div>').appendTo( G.VOM.$cont );
      G.VOM.$viewer.css({ msTouchAction: 'none', touchAction: 'none' });            // avoid pinch zoom

      G.VOM.currItemIdx=0;
      
      var sImg = '<div class="nGY2ViewerImagePan"><img class="nGY2ViewerImage" src="'+G.VOM.NGY2Item(-1).responsiveURL()+'" alt=" " itemprop="contentURL"></div>';
      sImg += '<div class="nGY2ViewerImagePan"><img class="nGY2ViewerImage" src="'+G.VOM.NGY2Item(0).responsiveURL()+'" alt=" " itemprop="contentURL"></div>';
      sImg += '<div class="nGY2ViewerImagePan"><img class="nGY2ViewerImage" src="'+G.VOM.NGY2Item(1).responsiveURL()+'" alt=" " itemprop="contentURL"></div>';
      var sNav = '';
      if( G.O.icons.viewerImgPrevious != undefined && G.O.icons.viewerImgPrevious != '') {
        sNav += '<div class="nGY2ViewerAreaPrevious ngy2viewerToolAction" data-ngy2action="previous">'+G.O.icons.viewerImgPrevious+'</div>';
      }
      if( G.O.icons.viewerImgNext != undefined && G.O.icons.viewerImgNext != '') {
        sNav += '<div class="nGY2ViewerAreaNext ngy2viewerToolAction" data-ngy2action="next">'+G.O.icons.viewerImgNext+'</div>';
      }
      G.VOM.$content = jQuery('<div class="nGY2ViewerContent">'+sImg+sNav+'</div>').appendTo( G.VOM.$viewer );
      G.VOM.$imgP = G.VOM.$content.find('.nGY2ViewerImagePan').eq(0);
      G.VOM.$imgC = G.VOM.$content.find('.nGY2ViewerImagePan').eq(1);
      G.VOM.$imgN = G.VOM.$content.find('.nGY2ViewerImagePan').eq(2);
      G.VOM.ImageLoader.loadImage( VieweImgSizeRetrieved, G.VOM.NGY2Item(0) );
      G.VOM.ImageLoader.loadImage( VieweImgSizeRetrieved, G.VOM.NGY2Item(-1) );
      G.VOM.ImageLoader.loadImage( VieweImgSizeRetrieved, G.VOM.NGY2Item(1) );
      
      ViewerDisplayDominantColors(G.VOM.NGY2Item(0), G.VOM.$imgC.children());
      ViewerDisplayDominantColors(G.VOM.NGY2Item(-1), G.VOM.$imgP.children());
      ViewerDisplayDominantColors(G.VOM.NGY2Item(1), G.VOM.$imgN.children());

      // makes content unselectable --> avoid image drag effect during 'mouse swipe'
      G.VOM.$cont.find('*').attr('draggable', 'false').attr('unselectable', 'on');
      
      G.VOM.padding.H=parseInt(G.VOM.$content.css("padding-left"))+parseInt(G.VOM.$content.css("padding-right"));
      G.VOM.padding.V=parseInt(G.VOM.$content.css("padding-top"))+parseInt(G.VOM.$content.css("padding-bottom"));
      
      // build image toolbar container
      var vtbBg1='';
      var vtbBg2=' toolbarBackground';
      if( G.O.viewerToolbar.fullWidth ) {
        vtbBg1=' toolbarBackground';
        vtbBg2='';
      }
      var vtbAlign='text-align:center;';
      switch ( G.O.viewerToolbar.align ) {
        case 'left':
          vtbAlign='text-align:left;';
          break;
        case 'right':
          vtbAlign='text-align:right;';
          break;
      }
      var sTB='<div class="toolbarContainer nGEvent'+vtbBg1+'" style="visibility:'+(G.O.viewerToolbar.display ? "visible" : "hidden")+';'+vtbAlign+'"><div class="toolbar nGEvent'+vtbBg2+'">';
      sTB+='</div></div>';
      G.VOM.$toolbar=jQuery(sTB).appendTo(G.VOM.$viewer);

      if( G.VOM.toolbarMode == 'min' || (G.O.viewerToolbar.autoMinimize > 0 && G.O.viewerToolbar.autoMinimize >= getViewport().w) ) {
        ViewerToolbarForVisibilityMin();
      }
      else {
        ViewerToolbarForVisibilityStd();
      }
      
      // top-left toolbar
      if( G.O.viewerTools.topLeft != '' ) {
        var sTopLeft='<div class="nGY2ViewerToolsTopLeft nGEvent"><div class="toolbar nGEvent">';
        var sTL = G.O.viewerTools.topLeft.split(',');
        for( var i=0, sTLL=sTL.length; i<sTLL; i++) {
          sTopLeft+=ToolbarAddElt( sTL[i] );
        }
        sTopLeft+='</div></div>';
        G.VOM.$toolbarTL=jQuery(sTopLeft).appendTo(G.VOM.$viewer);
      }
      // top-right toolbar
      if( G.O.viewerTools.topRight != '' ) {
        var sTopRight='<div class="nGY2ViewerToolsTopRight nGEvent"><div class="toolbar nGEvent">';
        var sTR = G.O.viewerTools.topRight.split(',');
        for( var i=0, sTRL=sTR.length; i<sTRL; i++) {
          sTopRight+=ToolbarAddElt( sTR[i] );
        }
        sTopRight+='</div></div>';
        G.VOM.$toolbarTR=jQuery(sTopRight).appendTo(G.VOM.$viewer);
      }

      // Go to fullscreen mode
      if( ngscreenfull.enabled && G.O.viewerFullscreen ) {
        ngscreenfull.request();
      }

      // set the events handler for toolbars
      ViewerToolsOn();

      // display logo
      if( G.O.viewerDisplayLogo ) {
        G.$E.vwLogo=jQuery('<div class="nGY2 nGY2ViewerLogo"></div>').appendTo(G.VOM.$viewer);
      }

      setElementOnTop('', G.VOM.$viewer);
      ResizeInternalViewer(true);
      G.VOM.timeImgChanged=new Date().getTime();
      
      
      var tweenable = new NGTweenable();
      tweenable.tween({
        from:         { opacity: 0, posY: G.VOM.window.lastHeight*.5 },
        to:           { opacity: 1, posY: 0 },
        delay:        30,
        duration:     500,
        easing:       'easeOutQuart',
        step:         function (state) {
          G.VOM.$viewer.css('opacity', state.opacity);
          G.VOM.$viewer[0].style[G.CSStransformName] = 'translateY('+(state.posY)+'px) ';
        }
      });

      // stop click propagation on image ==> if the user clicks outside of an image, the viewer is closed
      G.VOM.$viewer.find('img').on('click', function (e) {
        e.stopPropagation();
      });
      
      ImageSwipeTranslateX(0);
      DisplayInternalViewer(0, '');

      // viewer gesture handling
      if( G.VOM.hammertime == null ) {
      
        // G.VOM.hammertime =  new NGHammer(G.VOM.$cont[0]);
        G.VOM.hammertime =  new NGHammer.Manager(G.VOM.$cont[0], {
          recognizers: [
            [NGHammer.Pinch, { enable: true }],
            [NGHammer.Pan, { direction: NGHammer.DIRECTION_ALL }]
          ]
        });
     
        // G.VOM.hammertime.get('pan').set({ direction: NGHammer.DIRECTION_ALL });        
        // G.VOM.hammertime.get('pinch').set({ enable: true });        

        G.VOM.hammertime.on('pan', function(ev) {
          if( !G.VOM.viewerDisplayed ) { return; }
          if( G.VOM.zoom.isZooming ) {
            ViewerImagePanSetPosition(G.VOM.panPosX+ev.deltaX, G.VOM.panPosY+ev.deltaY, G.VOM.$imgC[0], false);
            if( G.VOM.toolbarsDisplayed == true ) {
              G.VOM.toolsHide();
            }
          }
          else {
            ImageSwipeTranslateX( ev.deltaX );
          }
        });

        G.VOM.hammertime.on('panend', function(ev) {
          if( !G.VOM.viewerDisplayed ) { return; }
          if( G.VOM.zoom.isZooming ) {
            G.VOM.timeImgChanged=new Date().getTime();
            ViewerImagePanSetPosition(G.VOM.panPosX+ev.deltaX, G.VOM.panPosY+ev.deltaY, G.VOM.$imgC[0], true);
          }
          else {
            // next/previous image
            if( ev.deltaX > 50 ) {
              DisplayPreviousImage();
              return;
            }
            if(  ev.deltaX < -50 ) {
              DisplayNextImage();
              return;
            }
            ImageSwipeTranslateX(0);
          }
        });
        
        if( G.O.viewerZoom ) {
        
          G.VOM.hammertime.add( new NGHammer.Tap({ event: 'doubletap', taps: 2 }) );
          G.VOM.hammertime.add( new NGHammer.Tap({ event: 'singletap' }) );
          G.VOM.hammertime.get('doubletap').recognizeWith('singletap');
          G.VOM.hammertime.get('singletap').requireFailure('doubletap');

          // single tap -> next/previous image
          G.VOM.hammertime.on('singletap', function(ev) {
            if( !G.VOM.viewerDisplayed ) { return; }
            StopPropagationPreventDefault(ev.srcEvent);
            if( G.VOM.toolbarsDisplayed == false ) {
              debounce( ViewerToolsUnHide, 400, false)();
            }
            else {
              if( ev.target.className.indexOf('nGY2ViewerImage') !== -1 ) {
                if( ev.srcEvent.pageX < (jQuery(window).width()/2) ) {
                  DisplayPreviousImage();
                }
                else {
                  DisplayNextImage();
                }
              }
            }
          });
          
          // double tap -> zoom
          G.VOM.hammertime.on('doubletap', function(ev) {
            if( !G.VOM.viewerDisplayed ) { return; }
            StopPropagationPreventDefault(ev.srcEvent);
            
            if( ev.target.className.indexOf('nGY2ViewerImage') !== -1 ) {
              // double tap only one image
              if( G.VOM.zoom.isZooming ) {
                G.VOM.zoom.isZooming=false;
                G.VOM.zoom.userFactor=1;
                ResizeInternalViewer(true);
              }
              else {
                if( ViewerZoomStart() ) {
                  G.VOM.zoom.userFactor=1.5;
                  ViewerImageSetPosAndZoom();
                }
              }
            }
          });
        
          G.VOM.hammertime.on('pinchend', function(ev) {
            ev.srcEvent.stopPropagation();
            ev.srcEvent.preventDefault();  // cancel  mouseenter event
            G.VOM.timeImgChanged=new Date().getTime();
          });
          G.VOM.hammertime.on('pinch', function(ev) {
            ev.srcEvent.stopPropagation();
            ev.srcEvent.preventDefault();  // cancel  mouseenter event
            
            if( ViewerZoomStart() ) {
              G.VOM.zoom.userFactor=ev.scale;
              ViewerZoomMax();
              ViewerZoomMin();
              ViewerImageSetPosAndZoom();   // center image
            }
          });
        }
        else {
          // no zoom -> click/tap on image to go to next/previous one
          G.VOM.hammertime.on('tap', function(ev) {
            if( !G.VOM.viewerDisplayed ) { return; }
            StopPropagationPreventDefault(ev.srcEvent);
            if( G.VOM.toolbarsDisplayed == false  ){
              // display tools on tap if hidden
              debounce( ViewerToolsUnHide, 400, false)();
            }
            else {
              // display next/previous image if tools not hidden
              if( ev.target.className.indexOf('nGY2ViewerImage') !== -1 ) {
                if( ev.srcEvent.pageX < (jQuery(window).width()/2) ) {
                  DisplayPreviousImage();
                }
                else {
                  DisplayNextImage();
                }
              }
            }
            
          });
        }
      }

      
      if( G.O.slideshowAutoStart ) {
        G.VOM.playSlideshow=false;
        SlideshowToggle();
      }
    }
    
    function StopPropagationPreventDefault(e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // Hide toolbars on user inactivity
    function ViewerToolsHide() {
      if( G.VOM.viewerDisplayed ) {
        G.VOM.toolbarsDisplayed=false;
        ViewerToolsOpacity(0);
      }
    }
    
    function ViewerToolsUnHide() {
    if( G.VOM.viewerDisplayed ) {
        G.VOM.toolbarsDisplayed=true;
        ViewerToolsOpacity(1);
        G.VOM.toolsHide();
      }
    }
    
    function ViewerToolsOpacity( op ) {
      G.VOM.$toolbar.css('opacity', op);
      G.VOM.$toolbarTL.css('opacity', op);
      G.VOM.$toolbarTR.css('opacity', op);
      G.VOM.$content.find('.nGY2ViewerAreaNext').css('opacity', op);
      G.VOM.$content.find('.nGY2ViewerAreaPrevious').css('opacity', op);
    }
    
    
    
    function ViewerToolsOn() {
      // removes all events
      G.VOM.$viewer.off("touchstart click", '.ngy2viewerToolAction', ViewerToolsAction); 
      
      // action button
      G.VOM.$viewer.on("touchstart click", '.ngy2viewerToolAction', ViewerToolsAction); 
    }

    // Actions of the buttton/elements
    function ViewerToolsAction(e) {
      // delay to avoid twice handling on smartphone/tablet (both touchstart click events are fired)
      if( (new Date().getTime()) - G.timeLastTouchStart < 300 ) { return; }
      G.timeLastTouchStart=new Date().getTime();
      
      var $this=$(this);
      var ngy2action=$this.data('ngy2action');
      if( ngy2action == undefined ) { return; }
      switch( ngy2action ) {
        case 'next':
          StopPropagationPreventDefault(e);
          DisplayNextImage();
          break;
        case 'previous':
          StopPropagationPreventDefault(e);
          DisplayPreviousImage();
          break;
        case 'playPause':
          e.stopPropagation();
          SlideshowToggle();
          break;
        case 'zoomIn':
          StopPropagationPreventDefault(e);
          if( ViewerZoomStart() ) {
            ViewerZoomIn( true );
          }
          break;
        case 'zoomOut':
          StopPropagationPreventDefault(e);
          if( ViewerZoomStart() ) {
            ViewerZoomIn( false );
          }
          break;
        case 'minimize':
          // toggle toolbar visibility
          StopPropagationPreventDefault(e);
          if( G.VOM.toolbarMode == 'std' ) {
            ViewerToolbarForVisibilityMin();
          }
          else {
            ViewerToolbarForVisibilityStd();
          }
          break;
        case 'fullScreen':
          // Toggle viewer fullscreen mode on/off
          e.stopPropagation();
          if( ngscreenfull.enabled ) {
            ngscreenfull.toggle();
          }
          break;
        case 'info':
          e.stopPropagation();
          ItemDisplayInfo(G.VOM.NGY2Item(0));
          break;
        case 'close':
          StopPropagationPreventDefault(e);
          if( (new Date().getTime()) - G.VOM.timeImgChanged < 400 ) { return; }
          CloseInternalViewer(G.VOM.currItemIdx);
          break;
        case 'download':
          StopPropagationPreventDefault(e);
          DownloadImage(G.VOM.items[G.VOM.currItemIdx].ngy2ItemIdx);
          break;
        case 'share':
          StopPropagationPreventDefault(e);
          PopupShare(G.VOM.items[G.VOM.currItemIdx].ngy2ItemIdx);
          break;
        case 'custom':
          StopPropagationPreventDefault(e);
          PopupShare(G.VOM.items[G.VOM.currItemIdx].ngy2ItemIdx);
          break;
        case 'linkOriginal':
          // $closeB.on( (G.isIOS ? "touchstart" : "click") ,function(e){     // IPAD
          StopPropagationPreventDefault(e);
          OpenOriginal( G.VOM.NGY2Item(0) );
          if( G.O.kind == 'google' || G.O.kind == 'google2') {
            var sU='https://plus.google.com/photos/'+G.O.userID+'/albums/'+G.VOM.NGY2Item(0).albumID+'/'+G.VOM.NGY2Item(0).GetID();
            window.open(sU,'_blank');
          }
          
          if( G.O.kind == 'flickr') {
            var sU='https://www.flickr.com/photos/'+G.O.userID+'/'+G.VOM.NGY2Item(0).GetID();
            window.open(sU,'_blank');
          }
          break;
      }
      
      // custom button
      if( ngy2action.indexOf('custom') == 0  && G.O.fnImgToolbarCustClick !== null ) {
        if( typeof G.O.fnImgToolbarCustClick == 'function' ) {
          G.O.fnImgToolbarCustClick(ngy2action, $this, G.VOM.NGY2Item(0));
        }
        else {
          // defined in markup
          window[G.O.fnImgToolbarCustClick](ngy2action, $this, G.VOM.NGY2Item(0));
        }
      }
    }
     

    // Display photo infos
    function ItemDisplayInfo( item) {

      var content='<div class="nGY2PopupOneItemText">'+item.title+'</div>';
      content+='<div class="nGY2PopupOneItemText">'+item.description+'</div>';
      if( item.author != '' ) {
        content+='<div class="nGY2PopupOneItemText">'+G.O.icons.user+' '+item.author+'</div>';
      }
      if( item.exif.model != '' ) {
        content+='<div class="nGY2PopupOneItemText">'+G.O.icons.config+' '+item.exif.model+'</div>';
      }
      var sexif='';
      sexif += item.exif.flash == '' ? '' : ' &nbsp; '+item.exif.flash;
      sexif += item.exif.focallength == '' ? '' : ' &nbsp; '+item.exif.focallength+'mm';
      sexif += item.exif.fstop == '' ? '' : ' &nbsp; f'+item.exif.fstop;
      sexif += item.exif.exposure == '' ? '' : ' &nbsp; '+item.exif.exposure+'s';
      sexif += item.exif.iso == '' ? '' : ' &nbsp; '+item.exif.iso+' ISO';
      if( item.exif.time != '' ) {
        var date = new Date(parseInt(item.exif.time));
        sexif+= ' &nbsp; '+date.toLocaleDateString();
      }
      content+='<div class="nGY2PopupOneItemText">'+sexif+'</div>';

      if( item.exif.location != '' ) {
        content+='<div class="nGY2PopupOneItemText">'+G.O.icons.location+' <a href="http://maps.google.com/maps?z=12&t=m&q='+encodeURIComponent(item.exif.location)+'" target="_blank">'+item.exif.location+'</a></div>';
        // embed google map in iframe (no api key needed)
        content+='<iframe width="300" height="150" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://maps.google.com/maps?&amp;t=m&amp;q='+encodeURIComponent( item.exif.location ) +'&amp;output=embed"></iframe>';  
      }

      var $popup=Popup(G.O.icons.viewerInfo, content, 'Left');
    
    }
    

    
    function ToolbarAddElt( elt ) {
      var r='',
      e=elt.replace(/^\s+|\s+$/g, '');    // remove trailing/leading whitespace
      switch( e ) {
        case 'minimizeButton':
          var ic=G.O.icons.viewerToolbarMin;
          if( G.VOM.toolbarMode == 'min' ) {
            ic=G.O.icons.viewerToolbarStd;
          }
          r='<div class="ngbt ngy2viewerToolAction minimizeButton nGEvent" data-ngy2action="minimize">'+ic+'</div>';
          break;
        case 'previousButton':
          r='<div class="ngbt ngy2viewerToolAction previousButton nGEvent" data-ngy2action="previous">'+G.O.icons.viewerPrevious+'</div>';
          break;
        case 'pageCounter':
          r='<div class="ngbt ngy2viewerToolAction pageCounter nGEvent"></div>';
          break;
        case 'nextButton':
          r='<div class="ngbt ngy2viewerToolAction nextButton nGEvent" data-ngy2action="next">'+G.O.icons.viewerNext+'</div>';
          break;
        case 'playPauseButton':
          r='<div class="ngbt ngy2viewerToolAction playButton playPauseButton nGEvent" data-ngy2action="playPause">'+G.O.icons.viewerPlay+'</div>';
          break;
        case 'downloadButton':
          r='<div class="ngbt ngy2viewerToolAction downloadButton nGEvent" data-ngy2action="download">'+G.O.icons.viewerDownload+'</div>';
          break;
        case 'zoomButton':
          r='<div class="ngbt ngy2viewerToolAction nGEvent" data-ngy2action="zoomIn">'+G.O.icons.viewerZoomIn+'</div><div class="ngbt ngy2viewerToolAction nGEvent" data-ngy2action="zoomOut">'+G.O.icons.viewerZoomOut+'</div>';
          break;
        case 'fullscreenButton':
          var s=G.O.icons.viewerFullscreenOn;
          if( ngscreenfull.enabled && G.VOM.viewerIsFullscreen ) {
            s=G.O.icons.viewerFullscreenOff;
          }
          r='<div class="ngbt ngy2viewerToolAction setFullscreenButton fullscreenButton nGEvent" data-ngy2action="fullScreen">'+s+'</div>';
          break;
        case 'infoButton':
          // if( typeof G.O.fnViewerInfo == 'function' ) {
            r='<div class="ngbt ngy2viewerToolAction infoButton nGEvent" data-ngy2action="info">'+G.O.icons.viewerInfo+'</div>';
          // }
          break;
        case 'linkOriginalButton':
          if( G.O.kind == 'flickr' || G.O.kind == 'google' || G.O.kind == 'google2' ) {
            r='<div class="ngbt ngy2viewerToolAction linkOriginalButton nGEvent" data-ngy2action="linkOriginal">'+G.O.icons.viewerLinkOriginal+'</div>';
          }
          break;
        case 'closeButton':
          r='<div class="ngbt ngy2viewerToolAction closeButton nGEvent" data-ngy2action="close">'+G.O.icons.buttonClose+'</div>';
          break;
        case 'shareButton':
          r='<div class="ngbt ngy2viewerToolAction nGEvent" data-ngy2action="share">'+G.O.icons.viewerShare+'</div>';
          break;
        case 'label':
          r='<div class="label ngy2viewerToolAction"><div class="title nGEvent" itemprop="name"></div><div class="description nGEvent" itemprop="description"></div></div>';
          break;
        default:
          // custom button
          if( e.indexOf('custom') == 0 ) {
            var t='';
            // content to display from custom script
            if( G.O.fnImgToolbarCustInit !== null ) {
              if( typeof G.O.fnImgToolbarCustInit == 'function' ) {
                G.O.fnImgToolbarCustInit(e);
              }
              else {
                // defined in markup
                window[G.O.fnImgToolbarCustInit](e);
              }
            }
            if( t == undefined || t == '' ) {
              // content from icons
              var n=e.substring(6);
              t=G.O.icons['viewerCustomTool'+n];
            }
            r='<div class="ngbt ngy2viewerToolAction ngy2CustomBtn '+e+' nGEvent" data-ngy2action="'+e+'">' + t + '</div>';
          }
          break;
      }
      return r;
    }
    
    
    // toggle slideshow mode on/off
    function SlideshowToggle(){
      if( G.VOM.playSlideshow ) {
        window.clearTimeout(G.VOM.playSlideshowTimerID);
        G.VOM.playSlideshow=false;
        G.VOM.$viewer.find('.playPauseButton').html(G.O.icons.viewerPlay);
      }
      else {
        G.VOM.playSlideshow=true;
        DisplayNextImage();
        G.VOM.$viewer.find('.playPauseButton').html(G.O.icons.viewerPause);
      }
    }

    function ViewerToolbarForVisibilityStd() {
      G.VOM.toolbarMode='std';
      
      var sTB='';
      var t = G.O.viewerToolbar.standard.split(',');
      for( var i=0, lt=t.length; i<lt; i++) {
        sTB+=ToolbarAddElt( t[i] );
      }
      G.VOM.$toolbar.find('.toolbar').html(sTB);
      ViewerToolbarElementContent();
    }
    
    function ViewerToolbarForVisibilityMin() {
      if( G.O.viewerToolbar.minimized == undefined || G.O.viewerToolbar.minimized == '' ) {
        ViewerToolbarForVisibilityStd();
      }
      else {
        G.VOM.toolbarMode='min';
        var sTB='';
        var t = G.O.viewerToolbar.minimized.split(',');
        for( var i=0, lt=t.length; i<lt; i++) {
          sTB+=ToolbarAddElt( t[i] );
        }
        G.VOM.$toolbar.find('.toolbar').html(sTB);
        ViewerToolbarElementContent();
      }
    }
    
    function ViewerToolbarElementContent() {
    
      var vomIdx=G.VOM.currItemIdx;
      if( vomIdx == null ) { return; }
      
      var item=G.VOM.NGY2Item(0);
    
      // LABEL
      var setTxt=false;
      // set title
      if( item.title !== undefined && item.title != '' ) {
        G.VOM.$viewer.find('.ngy2viewerToolAction').find('.title').html(item.title);
        setTxt=true;
      }
      else {
        G.VOM.$viewer.find('.ngy2viewerToolAction').find('.title').html('');
      }
      // set description
      if( item.description !== undefined && item.description != '' ) {
        G.VOM.$viewer.find('.ngy2viewerToolAction').find('.description').html(item.description);
        setTxt=true;
      }
      else {
        G.VOM.$viewer.find('.ngy2viewerToolAction').find('.description').html('');
      }
      
      if( setTxt ) {
        G.VOM.$viewer.find('.ngy2viewerToolAction').find('.label').show();
      }
      else {
        G.VOM.$viewer.find('.ngy2viewerToolAction').find('.label').hide();
      }
      
      // set page number
      var viewerMaxImages=G.VOM.items.length;
      if( viewerMaxImages > 0 ) {
        G.VOM.$viewer.find('.pageCounter').html((G.VOM.items[vomIdx].imageNumber)+'/'+viewerMaxImages);
      }
      
      // custom elements
      var $cu=G.VOM.$viewer.find('.ngy2CustomBtn');
      if( $cu.length > 0 && G.O.fnImgToolbarCustDisplay !== null ) {
        if( typeof G.O.fnImgToolbarCustDisplay == 'function' ) {
          G.O.fnImgToolbarCustDisplay($cu, item);
        }
        else {
          // defined in markup
          window[G.O.fnImgToolbarCustDisplay]($cu, item);
        }
      }
      
      // set event handlers again
      ViewerToolsOn();
    }
    
    // Scroll the image in the lightbox (left/right)
    function ImageSwipeTranslateX( posX ) {
      G.VOM.swipePosX=posX;
      if( G.CSStransformName == null ) {
        // no pan if CSS transform not supported
        // G.VOM.$imgC.css({ left: posX }); 
      }
      else {
        G.VOM.$imgC[0].style[G.CSStransformName]= 'translate('+posX+'px,0px)';
        if(  G.O.imageTransition == 'swipe' ) {
          G.VOM.$imgP.css({ opacity:1 });
          G.VOM.$imgN.css({ opacity:1 });
          if( posX > 0 ) {
            var dir=G.VOM.window.lastWidth;
            G.VOM.$imgP[0].style[G.CSStransformName] = 'translate('+(-dir+posX)+'px,0px)';
            G.VOM.$imgN[0].style[G.CSStransformName] = 'translate('+(-dir)+'px,0px)';
          }
          else {
            var dir=-G.VOM.window.lastWidth;
            G.VOM.$imgN[0].style[G.CSStransformName] = 'translate('+(-dir+posX)+'px,0px)';
            G.VOM.$imgP[0].style[G.CSStransformName] = 'translate('+(-dir)+'px,0px)';
          }
        }
      }
    }
    
    // Display next image
    function DisplayNextImage() {
      if( G.VOM.viewerImageIsChanged || ((new Date().getTime()) - G.VOM.timeImgChanged < 300) ) { return; }
      
      TriggerCustomEvent('lightboxNextImage');
      DisplayInternalViewer(G.VOM.IdxNext(), 'nextImage');
    };
    
    // Display previous image
    function DisplayPreviousImage() {
      if( G.VOM.viewerImageIsChanged || ((new Date().getTime()) - G.VOM.timeImgChanged < 300) ) { return; }
      if( G.VOM.playSlideshow ) {
        SlideshowToggle();
      }
      
      TriggerCustomEvent('lightboxPreviousImage');
      DisplayInternalViewer(G.VOM.IdxPrevious(), 'previousImage');
    };
    
    // Display image (and run animation)
    function DisplayInternalViewer( newVomIdx, displayType ) {

      G.VOM.$imgC.children().eq(0).unbind('.imagesLoaded');
      if( G.VOM.playSlideshow ) {
        window.clearTimeout(G.VOM.playSlideshowTimerID);
      }
      
      var itemOld=G.VOM.NGY2Item(0);
      var itemNew=G.I[G.VOM.items[newVomIdx].ngy2ItemIdx];
      var $new=(displayType == 'nextImage' ? G.VOM.$imgN : G.VOM.$imgP);
      var $unused=(displayType == 'nextImage' ? G.VOM.$imgP : G.VOM.$imgN);
      $unused[0].style.opacity=0;

      G.VOM.timeImgChanged=new Date().getTime();
      G.VOM.viewerImageIsChanged=true;
      G.VOM.zoom.isZooming=false;
      ResizeInternalViewer(true);
 
      if( G.O.debugMode && console.timeline ) { console.timeline('nanogallery2_viewer'); }

      var vP=getViewport();

      SetLocationHash( itemNew.albumID, itemNew.GetID() );
      
      if( displayType == '' ) {
        // first image --> just appear / no slide animation
        G.VOM.$imgC.css({ opacity:1 });
        if( G.CSStransformName == null ) {
          // no CSS transform support -> no animation
          $new.css({ opacity: 1 });
          DisplayInternalViewerComplete(displayType, newVomIdx);
        }
        else {
          // $new.css({ opacity:0, visibility:'visible'});
          $new.css({ opacity: 0 });
          var tweenable = new NGTweenable();
          tweenable.tween({
            from:         { opacity: 0 },
            to:           { opacity: 1 },
            attachment:   { dT: displayType, item: itemOld },
            easing:       'easeInOutSine',
            delay:        30,
            duration:     400,
            step:         function (state, att) {
              // using scale is not a good idea on Chrome -> image will be blurred
              G.VOM.$content.css('opacity', state.opacity);
              ViewerImageOpacityOn(G.VOM.$imgC, att.item);

            },
            finish:       function (state, att) {
              G.VOM.$content.css('opacity', 1);
              ViewerImageOpacityOn(G.VOM.$imgC, att.item);
              ViewerToolsUnHide();
              DisplayInternalViewerComplete(att.dT, newVomIdx);
            }
          });
        }
      }
      else {
        // animate the image change
        switch( G.O.imageTransition.toUpperCase() ) {
          case 'SWIPE':
            if( G.CSStransformName == null  ) {
              // no CSS transform support -> no animation
              $new.css({ opacity: 1 });
              G.VOM.$imgC.css({ opacity: 1 });
              DisplayInternalViewerComplete(displayType, newVomIdx);
            }
            else {
              var dir=(displayType == 'nextImage' ? - vP.w : vP.w);
              $new[0].style[G.CSStransformName]= 'translate('+(-dir)+'px, 0px) '
              var tweenable = new NGTweenable();
              tweenable.tween({
                from:         { t: G.VOM.swipePosX  },
                to:           { t: (displayType == 'nextImage' ? - vP.w : vP.w) },
                attachment:   { dT:displayType, $e:$new, item: itemOld, itemNew: itemNew, dir:dir },
                delay:        30,
                duration:     300,
                easing:       'easeInOutSine',
                step:         function (state, att) {
                  // current image
                  ViewerImageOpacityOn(G.VOM.$imgC, att.item);
                  G.VOM.$imgC[0].style[G.CSStransformName]= 'translate('+state.t+'px,0px)';
                  // new image
                  ViewerImageOpacityOn(att.$e, att.itemNew);
                  att.$e[0].style[G.CSStransformName]= 'translate('+(-att.dir+state.t)+'px, 0px) ';
                },
                finish:       function (state, att) {
                  // current image
                  ViewerImageOpacityOn(G.VOM.$imgC, att.item);
                  G.VOM.$imgC[0].style[G.CSStransformName]= '';
                  // new image
                  ViewerImageOpacityOn(att.$e, att.itemNew);
                  att.$e[0].style[G.CSStransformName]= '';
                  DisplayInternalViewerComplete(att.dT, newVomIdx);
                }
              });
            }
            break;
            
          case 'SLIDEAPPEAR':
          default:
            if( G.CSStransformName == null  ) {
              // no CSS transform support -> no animation
              $new.css({ opacity: 1 });
              G.VOM.$imgC.css({ opacity:1 });
              DisplayInternalViewerComplete(displayType, newVomIdx);
            }
            else {
              var dir=(displayType == 'nextImage' ? - vP.w : vP.w);
              var tweenable = new NGTweenable();
              tweenable.tween({
                from:         { o: 0, t: G.VOM.swipePosX },
                to:           { o: 1, t: (displayType == 'nextImage' ? - vP.w : vP.w) },
                attachment:   { dT:displayType, $e:$new, item: itemOld, itemNew: itemNew, dir: dir },
                delay:        30,
                duration:     300,
                easing:       'easeInOutSine',
                step:         function (state, att) {
                  // current image - translate
                  ViewerImageOpacityOn(G.VOM.$imgC, att.item);
                  G.VOM.$imgC[0].style[G.CSStransformName]= 'translate('+state.t+'px,0px)';
                  // new image - opacity
                  att.$e.css({ opacity: state.o });
//                  ViewerImageSetSize(att.$e, att.itemNew);
                },
                finish:       function (state, att) {
                  // current image
                  ViewerImageOpacityOn(G.VOM.$imgC, att.item);
                  G.VOM.$imgC[0].style[G.CSStransformName]= '';
                  // new image
                  att.$e.css({ opacity: 1 });
                  DisplayInternalViewerComplete(att.dT, newVomIdx);
                }
              });
            }
            break;
        }
      }
    }
  

    function DisplayInternalViewerComplete( displayType, newVomIdx ) {
      G.VOM.currItemIdx=newVomIdx;

      ViewerToolbarElementContent();
      if( G.O.debugMode && console.timeline ) { console.timelineEnd('nanogallery2_viewer'); }

      if( G.O.fnImgDisplayed !== null ) {
        if( typeof G.O.fnImgDisplayed == 'function' ) {
          G.O.fnImgDisplayed(G.VOM.NGY2Item(0));
        }
        else {
          // defined in markup
          window[G.O.fnImgDisplayed](G.VOM.NGY2Item(0));
        }
      }
      
      G.VOM.swipePosX=0;
      
      G.VOM.$imgC.off("click");
      G.VOM.$imgC.removeClass('imgCurrent');
    
      var $tmp=G.VOM.$imgC;
      switch( displayType ) {
        case 'nextImage':
          G.VOM.$imgC=G.VOM.$imgN;
          G.VOM.$imgN=$tmp;
          break;
        case 'previousImage':
          G.VOM.$imgC=G.VOM.$imgP;
          G.VOM.$imgP=$tmp;
          break;
      }
      G.VOM.$imgC.addClass('imgCurrent');
      if( G.VOM.NGY2Item(0).imageWidth > 0 ) {
        G.VOM.$imgC.css({ opacity: 1 });
      }
      else {
        G.VOM.$imgC.css({ opacity: 0 });
      }
      
      // new next image
      G.VOM.$imgN.css({ opacity: 0 });
      G.VOM.ImageLoader.loadImage(VieweImgSizeRetrieved, G.VOM.NGY2Item(1));
      G.VOM.$imgN.children().eq(0).attr('src', '');
      G.VOM.$imgN.children().eq(0).attr('src',G.emptyGif).attr('src', G.VOM.NGY2Item(1).responsiveURL());
      ViewerDisplayDominantColors(G.VOM.NGY2Item(1), G.VOM.$imgN.children());

      // new previous image
      G.VOM.$imgP.css({ opacity: 0 });
      G.VOM.$imgP.children().eq(0).attr('src', '');
      G.VOM.ImageLoader.loadImage(VieweImgSizeRetrieved, G.VOM.NGY2Item(-1));
      G.VOM.$imgP.children().eq(0).attr('src',G.emptyGif).attr('src',G.VOM.NGY2Item(-1).responsiveURL());
      ViewerDisplayDominantColors(G.VOM.NGY2Item(-1), G.VOM.$imgP.children());


      // slideshow mode - wait until image is loaded to start the delay for next image
      if( G.VOM.playSlideshow ) {
        G.VOM.$imgC.children().eq(0).ngimagesLoaded().always( function( instance ) {
          if( G.VOM.playSlideshow ) {
            // in the meantime the user could have stopped the slideshow
            G.VOM.playSlideshowTimerID=window.setTimeout( function(){DisplayNextImage(); }, G.VOM.slideshowDelay);
          }
        });
      }
      
      // close viewer when user clicks outside of the image
      G.VOM.$imgC.on("click",function(e){
        e.stopPropagation();
        if( (new Date().getTime()) - G.VOM.timeImgChanged < 400 ) { return; }
        StopPropagationPreventDefault(e);
        CloseInternalViewer(G.VOM.currItemIdx);
        return false;
      });

      ResizeInternalViewer();

      G.VOM.viewerImageIsChanged=false;
      TriggerCustomEvent('lightboxImageDisplayed');
      
    }

    // display image only when the size is knowed
    function ViewerImageOpacityOn( $img, item ) {
      if( $img[0].style.opacity == 0 && item.imageWidth != 0 ) {
        // display it when the size is knowed
        // ViewerImageSetSize($img, item);
        ViewerImageSetPosAndZoom();
        $img[0].style.opacity=1;
      }
    }

    
    // Close the internal lightbox
    function CloseInternalViewer( vomIdx ) {

      G.VOM.viewerImageIsChanged=false;

      if( G.VOM.viewerDisplayed ) {

        // set scrollbar visible
        jQuery('body').css({overflow:'visible'});
        
        
        if( G.VOM.playSlideshow ) {
          window.clearTimeout(G.VOM.playSlideshowTimerID);
          G.VOM.playSlideshow=false;
        }

        // G.VOM.userEvents.removeEventListeners();
        // G.VOM.userEvents=null;
        G.VOM.hammertime.destroy();
        G.VOM.hammertime=null;

        if( ngscreenfull.enabled && G.VOM.viewerIsFullscreen ) {
          G.VOM.viewerIsFullscreen=false;
          ngscreenfull.exit();
        }
        
        G.VOM.$cont.hide(0).off().show(0).html('').remove();
        G.VOM.viewerDisplayed=false;

        if( vomIdx != null ) {
          if( G.GOM.albumIdx == -1 ) {
            // album not displayed --> display gallery
            DisplayAlbum( '', G.I[G.VOM.items[vomIdx].ngy2ItemIdx].albumID );
          }
          else {
            GalleryResize();        
            SetLocationHash( G.I[G.VOM.items[vomIdx].ngy2ItemIdx].albumID, '' );
            ThumbnailHoverReInitAll();
          }
        }
        G.VOM.timeImgChanged=new Date().getTime();
      }
    }

    
    // Internal viewer resized -> reposition elements
    function ResizeInternalViewer( forceUpdate ) {
      forceUpdate = typeof forceUpdate !== 'undefined' ? forceUpdate : false;
      
      if( G.VOM.$toolbar === null ) { return; }   // viewer build not finished
      
      
      // window.requestAnimationFrame( function() {    // synchronize with screen
      var windowsW=G.VOM.$viewer.width();
      var windowsH=G.VOM.$viewer.height();
      var $elt=G.VOM.$imgC.children().eq(0);
      if( $elt == null || G.VOM.currItemIdx == -1 ) { return; }
      
      if( !forceUpdate && G.VOM.window.lastWidth == windowsW  && G.VOM.window.lastHeight == windowsH ) { return; }
      
      G.VOM.window.lastWidth=windowsW;
      G.VOM.window.lastHeight=windowsH;

      var vwImgC_H=$elt.height(),
      vwImgC_W=$elt.width(),
      vwImgC_OHt=$elt.outerHeight(true),
      vwImgC_OHf=$elt.outerHeight(false);

      var $tb=G.VOM.$toolbar.find('.toolbar');
      var tb_OHt=$tb.outerHeight(true);

      switch( G.O.viewerToolbar.position ) {
        case 'topOverImage':
          G.VOM.$content.css({height:windowsH, width:windowsW, top:0  });
          G.VOM.$toolbar.css({top: 0, bottom:''});
          break;
        case 'top':
          windowsH-=tb_OHt;
          G.VOM.$content.css({height:windowsH, width:windowsW, top:tb_OHt  });
          G.VOM.$toolbar.css({top: 0});
          break;
        case 'bottomOverImage':
          G.VOM.$content.css({height:windowsH, width:windowsW, bottom:0, top:0  });
          G.VOM.$toolbar.css({bottom: 0});
          break;
        case 'bottom':
        default:
          windowsH-=tb_OHt;
          G.VOM.$content.css({ width:windowsW, top:0, bottom:tb_OHt });
          G.VOM.$toolbar.css({bottom: 0});
          break;
      }

      if( !G.VOM.viewerImageIsChanged && G.VOM.zoom.isZooming ) {
        ViewerImageSetPosAndZoom();
      }
      else {
        G.VOM.zoom.userFactor=1;
        G.VOM.zoom.isZooming=false;
        G.VOM.panPosX=0;
        G.VOM.panPosY=0;
        G.VOM.zoom.posX=0;
        G.VOM.zoom.posY=0;
        G.VOM.$imgC[0].style[G.CSStransformName]= 'translate3D(0,0,0) ';
        ViewerImageSetPosAndZoom();        
      }
    }



    /** @function BuildSkeleton */
    /** Build the gallery structure **/
    function BuildSkeleton() {
    
      // store markup if defined
      var $elements=G.$E.base.children('a');
      if( $elements.length > 0 ) {
        G.O.$markup=$elements;
      }
      G.$E.base.text('');
      G.$E.base.addClass('ngy2_container');
      
      // RTL or LTR
      var sRTL='';
      if( G.O.RTL ) {
        sRTL='style="text-align:right;direction:rtl;"';
      }
    
      // theme
      G.$E.base.addClass(G.O.theme)
      // gallery color scheme
      SetColorScheme();

      // Hide icons (thumbnails and breadcrumb)
      if( G.O.thumbnailLabel.get('hideIcons') ) {
        G.O.icons.thumbnailAlbum='';
        G.O.icons.thumbnailImage='';
      }

      // Navigation bar
      var styleNavigation="";
      if( G.O.navigationFontSize != undefined && G.O.navigationFontSize != '' ) {
        styleNavigation=' style="font-size:'+G.O.navigationFontSize+';"';
      }      
      G.$E.conNavigationBar=jQuery('<div class="nGY2Navigationbar" '+styleNavigation+'></div>').appendTo(G.$E.base);

      // pre-loader
      G.$E.conLoadingB=jQuery('<div class="nanoGalleryLBarOff"><div></div><div></div><div></div><div></div><div></div></div>').appendTo(G.$E.base);

      // gallery
      G.$E.conTnParent=jQuery('<div class="nGY2Gallery"></div>').appendTo(G.$E.base);
      G.$E.conTn=jQuery('<div class="nGY2GallerySub"></div>').appendTo(G.$E.conTnParent);

      // configure gallery
      switch( G.O.thumbnailAlignment ) {
        case 'left':
          G.$E.conTnParent.css({'text-align':'left'});
          // G.$E.conNavBCon.css({'margin-left':0 });
          break;
        case 'right':
          G.$E.conTnParent.css({'text-align':'right'});
          // G.$E.conNavBCon.css({ 'margin-right':0});
          break;
      }
      
      // apply galleryBuildInit2 css settings to the gallery
      if( G.O.galleryBuildInit2 !== undefined ) {
      var t1=G.O.galleryBuildInit2.split('|');
        for( var i=0; i<t1.length; i++ ) {
          var o1=t1[i].split('_');
          if( o1.length == 2 ) {
            G.$E.conTn.css(o1[0], o1[1]);
          }
        }
      }
      
      // configure gallery depending on some thumbnail hover effects
      var effects=G.tn.hoverEffects.std.concat(G.tn.hoverEffects.level1);
      for( var j=0; j<effects.length; j++) {
        switch( effects[j].type ) {
          case 'scale':
          case 'rotateZ':
          case 'rotateX':
          case 'rotateY':
          case 'translateX':
          case 'translateY':
          case 'translateY':
            // handle some special cases
            if( effects[j].element == '.nGY2GThumbnail' ) {
              // allow thumbnail upscale over the gallery's aera
              G.$E.base.css('overflow', 'visible');
              G.$E.base.find('.nGY2GallerySub').css('overflow', 'visible');
              G.$E.conTnParent.css('overflow', 'visible');
            }
            break;
        }
      }
      
      // Gallery bottom container
      G.$E.conTnBottom=jQuery('<div class="nGY2GalleryBottom" '+styleNavigation+'></div>').appendTo(G.$E.conTnParent);
      
      // portable
      if( G.O.portable ) {
        // http://www.picresize.com/
        // http://base64encode.net/base64-image-encoder
        var logo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAWCAYAAAA4oUfxAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAAB3RJTUUH4QMPBwY6mxZgsAAABTFJREFUSMe1ll9oVGcaxn/fd86ZSWbSkEBMiWNdTTfRxiVbXFiU1bjKGqNexlURKys0tHqXpQZ64Sq4FxKqFy4qFSm9kA1FHNhFISgJqFCd6lL/YC7M3jhrJv5JmGSSMzPnzDnfuxdpZtP4b1vaF154P3gPD+/zPC/nVSKiAQOsBj7O5XK/nZiYeEtELH6iUEqFNTU1U9XV1d8AnwNfA1qJCMCfHz169NcjR45UXL16VWWzWQnD0PxU4JZl6draWtXW1iYHDx4sLlmy5C/AZwRB0JVOpyWRSHhACMjPmOHChQuL6XRagiDoUiIyumvXrpq+vr6obduqs7OTjRvbsbSFUgqUgKjyFG5+mlKpVH6LCMYYRAQRQSmF1hqtNd+xijGGVCpFMpkkCALZuXOn19fXN6Gmp6dNc3NzMDo66nR2dnL+/Hm+Ov933PwUAPHKagqei4gBFNs7dxGPx38U/du2bSOZTNLQ0FB6+PChbWez2WI+n3dEhI3tf+Det0N8de0Imz9YQWHa48u/3afjgxbqEpUM/es/uF8W+fijffi+TywWQ0S4fv06t2/fJpfLsXjxYtauXUtTUxNBECAihGFIJBJh1apVXLhwgXw+r7LZbNGeYU7MLD1BEPCLxkWs+HUT+SmPJY0TvPerd6l/J05YcLCGHWzbxrZtHjx4wP79+7l27dr3Jqyurqarq4ujR49i2zYAWmvCMJyVygCiZ7dh9kOtNb5XopD3KBQ8fL9EseBRyHsUCz6zS3Dnzh3WrVtXBq6oqGDBggUA5HI5jh07xo4dOzDmf0ujVBlGAWjmhTGC41hEow6RiI3j2DgRh0jUxonYWJaFGGHPnj2Mj49jWRYHDhzg7t27DA0NMTAwwOrVqwFIJpOcOHECx3Fe6oEXwG3bYux5ltHHz3mSGePpk+c8yczUI+knVFVVcePmDe7fvw9AT08Pvb29NDc3U1dXx4YNG7h8+TItLS1orTl58iT5fL68Ga8En55yWb6iifff/iPD/0iQGfglG3/zJ6a+beHf/3yH6Mjv+P269Vy5cgWlFDU1NXR3dxOGYdlcnudRVVXFvn37MMaQTqcZHh5+Kbg99zHjSodPuj997cqMjY0hItTW1hKPx9FalzW1LIswDFm0aBEAQRDguu6bJ581hOd5GBNiTEgYhuXa8z1EhIaGBgAymQzpdBqlFKVSiTCc6bcsi5s3bwJQWVlJfX39fMO9XHMAy7LQeibn1o7toJSio6MDAN/36e7uxvd9IpEIlmURjUZJpVKcOXMGpRStra0sXbr0peDfo30+LS+4U2uMMaxcuZLdu3dz7tw5+vv7aWtrY+/evdTX13Pr1i1OnTrF5OQkAIcPH8ayrNeCvx51njTGGE6fPk0mk2FwcJBUKkUqlXqh9/jx42zatKnMzJzhBEArpZT+zjGWZSEiBEHwypzVtbKykosXL3Lo0CEaGxvLpovFYqxZs4ZLly6VJQnDEBEpM6C11kopheu6JpFI+Fpr2bJli/zYGBkZkeHhYZmcnHxlz9atW0VrLYlEwndd19ixWOzx5s2b3z579qzp7+/X7e3ttLa2Yox5QaP5MfenEY1G0VoTBAHFYhFjTJlJrTX37t1jYGAAY4zp6OiQWCz2mCAItj979kyWL1/uAwE/7zERLFu2zH/69KkEQbB99ozaOz4+fqy3t7d2cHAwdF1XKaXe6P7/16AiQjwel/Xr1+uenp6Jurq6T4Av1JwD8j3gQ2BVsVh8S72J8x8QIiIVFRVTQAo4CwwB+r93qCLI9wKZ8AAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAxNy0wMy0xNVQwNzowNjo1OC0wNDowMBNQsyUAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMTctMDMtMTVUMDc6MDY6NTgtMDQ6MDBiDQuZAAAAAElFTkSuQmCC';
        G.$E.ngy2i=jQuery('<div class="nGY2PortInfo"><a href="http://nano.gallery" target="_blank" title="nanogallery2 | easy photo gallery for your website" style="font-weight: bold !important;color: #888 !important;font-size: 11px !important;"><img src="'+logo+'" style="height:16px !important;box-shadow: none !important;vertical-align: middle !important;"/> &nbsp; nanogallery2</a></div>').appendTo(G.$E.base);
        
        G.$E.ngy2i.find('a').on({
          mouseenter: function () {
            jQuery(this).attr('style', 'color: #73A623 !important');
          },
          mouseleave: function () {
            jQuery(this).attr('style', 'color: #888 !important');
          }
        });
      }
      
      // Error console
      G.$E.conConsole=jQuery('<div class="nGY2ConsoleParent"></div>').appendTo(G.$E.base);

      // i18n translations
      i18n();

      // cache some thumbnails data (sizes, styles...)
      ThumbnailDefCaches();

      // do special settings depending for some options
      // thumbnail display transition
      switch( G.tn.opt.Get('displayTransition') ) {
        case 'SCALEDOWN':
        case 'RANDOMSCALE':
        default:
          G.$E.base.css('overflow', 'visible');
          G.$E.conTnParent.css('overflow', 'visible');
          G.$E.conTn.css('overflow', 'visible');
          break;
      }
      
    }
    
    function TriggerCustomEvent ( eventName ) {
      // G.$E.base.trigger('pageChanged.nanogallery2', new Event('pageChanged.nanogallery2'));
      var eN = eventName + '.nanogallery2';
      var event=null;
      try {
          event = new Event( eN );
        } catch(e) {
          event = document.createEvent('Event');
          event.initEvent(eN, false, false);
        }
        G.$E.base.trigger(eN, event);
    }
    
    
    /** @function SetGlobalEvents */
    function SetGlobalEvents() {
      // GLOBAL EVENT MANAGEMENT
      
      G.$E.conTnParent.on({
        mouseenter: GalleryMouseEnter,
        mouseleave: GalleryMouseLeave
      }, ".nGY2GThumbnail"); //pass the element as an argument to .on
      
      // G.GOM.hammertime = new NGHammer(G.$E.conTn[0], { touchAction: 'none' });
      G.GOM.hammertime = new NGHammer(G.$E.conTn[0]);
      // G.GOM.hammertime.domEvents = true;
      
      G.GOM.hammertime.on('pan', function(ev) {
        if( G.O.paginationSwipe && G.layout.support.rows && G.galleryDisplayMode.Get() == 'PAGINATION' ) {
          G.$E.conTn.css( G.CSStransformName , 'translate('+(ev.deltaX)+'px,0px)');
        }
      });
      G.GOM.hammertime.on('panend', function(ev) {
        if( G.O.paginationSwipe && G.layout.support.rows && G.galleryDisplayMode.Get() == 'PAGINATION' ) {
          if( Math.abs(ev.deltaY) > 100 ) {
            // user moved vertically -> cancel pagination
            G.$E.conTn.css( G.CSStransformName , 'translate(0px,0px)');
            return;
          }
          if( ev.deltaX > 50 ) {
            paginationPreviousPage();
            return;
          }
          if(  ev.deltaX < -50 ) {
            paginationNextPage();
            return;
          }
          G.$E.conTn.css( G.CSStransformName , 'translate(0px,0px)');
          // pX=0;
        }
      });
      G.GOM.hammertime.on('tap', function(ev) {
        ev.srcEvent.stopPropagation();
        ev.srcEvent.preventDefault();  // cancel  mouseenter event

        if( ev.pointerType == 'mouse') {
          if( GalleryClicked(ev.srcEvent) == 'exit' ) { return; }
        }
        else {
          var r=GalleryEventRetrieveElementl(ev.srcEvent, false);
          if( r.GOMidx == -1 ) { return; }
          if( r.action != 'NONE' && r.action != 'OPEN' ) {
            // toolbar touched --> execute action
            GalleryClicked(ev.srcEvent);
            return;
          }
          if( G.O.touchAutoOpenDelay > 0 ) {
            // one touch scenario
            ThumbnailHoverOutAll();
            ThumbnailHover( r.GOMidx );
            window.clearInterval( G.touchAutoOpenDelayTimerID );
            G.touchAutoOpenDelayTimerID = window.setInterval(function(){
              window.clearInterval( G.touchAutoOpenDelayTimerID );
              ThumbnailOpen( G.GOM.items[r.GOMidx].thumbnailIdx, true );
            }, G.O.touchAutoOpenDelay );
          }
          else {
            // two touch scenario
            if( !G.I[G.GOM.items[r.GOMidx].thumbnailIdx].hovered ) {
              ThumbnailHoverOutAll();
              ThumbnailHover(r.GOMidx);
            }
            else {
              // second touch
              ThumbnailOpen(G.GOM.items[r.GOMidx].thumbnailIdx, true);
            }
          }
        }
      });
      
      
      // browser location hash management
      if( G.O.locationHash ) {
        jQuery(window).bind( 'hashchange', function() {
          ProcessLocationHash();
        });
      }
      
      // Page resize
      jQuery(window).on('resize.nanogallery2.'+G.baseEltID, debounce( ResizeWindowEvent, 100, false) );
      
      // Event page scrolled
      $(window).on('scroll.nanogallery2.'+G.baseEltID,  debounce( OnScrollEvent, 100, false) );
      
      // Debounced function to hide the toolbars on the viewer
      G.VOM.toolsHide=debounce( ViewerToolsHide, G.O.viewerHideToolsDelay, false );
      
      // Keyboard management
      jQuery(document).keyup(function(e) {
        if( G.popup.isDisplayed ) {
          switch( e.keyCode) {
            case 27:    // Esc key
              G.popup.close();
              break;
          }
        }
        else {
          if( G.VOM.viewerDisplayed ) {
            ViewerToolsUnHide();
            switch( e.keyCode) {
              case 27:    // Escape key
                CloseInternalViewer(G.VOM.currItemIdx);
                break;
              case 32:    // SPACE
              case 13:    // ENTER
                SlideshowToggle();
                break;
              case 38:    // UP
              case 39:    // RIGHT
              case 33:    // PAGE UP
                DisplayNextImage();
                break;
              case 40:    // DOWN
              case 37:    // LEFT
              case 34:    // PAGE DOWN
                DisplayPreviousImage();
                break;
              case 35:    // END
              case 36:    // BEGIN
            }
          }
        }
      });
      
      // mouse wheel to zoom in/out the image displayed in the internal lightbox
      jQuery(window).bind('mousewheel wheel', function(e){
        if( G.VOM.viewerDisplayed ) {
          var deltaY = 0;
          e.preventDefault();

          if( ViewerZoomStart() ) {
            if (e.originalEvent.deltaY) { // FireFox 17+ (IE9+, Chrome 31+?)
              deltaY = e.originalEvent.deltaY;
            } else if (e.originalEvent.wheelDelta) {
              deltaY = -e.originalEvent.wheelDelta;
            }
            ViewerZoomIn( deltaY <= 0 ? true : false );
          }
        }
      });
      
      // mouse mouse -> unhide lightbox toolbars
      jQuery(window).bind('mousemove', function(e){
        if( G.VOM.viewerDisplayed ) {
          debounce( ViewerToolsUnHide, 400, false )();
        }
      });
      
      // fullscreen mode on/off --> internal lightbox
      if( ngscreenfull.enabled ) {
        // ngscreenfull.onchange(() => {
        ngscreenfull.onchange( function() {
          if( G.VOM.viewerDisplayed ) {
            if( ngscreenfull.isFullscreen ) {
              G.VOM.viewerIsFullscreen=true;
              G.VOM.$viewer.find('.fullscreenButton').html(G.O.icons.viewerFullscreenOff);
            }
            else {
              G.VOM.viewerIsFullscreen=false;
              G.VOM.$viewer.find('.fullscreenButton').html(G.O.icons.viewerFullscreenOn);
            }
          }
        });
      }

    }
    
    //----- Manage browser location hash (deep linking and browser back/forward)
    function ProcessLocationHash() {

      // standard use case -> location hash processing
      if( !G.O.locationHash ) { return false; }

      var curGal='#nanogallery/'+G.baseEltID+'/',
      newLocationHash=location.hash;
      if( G.O.debugMode ) {
        console.log('------------------------ PROCESS LOCATION HASH');
        console.log('newLocationHash1: ' +newLocationHash);
        console.log('G.locationHashLastUsed: ' +G.locationHashLastUsed);
      }
      
      if( newLocationHash == '' ) {
        // if( G.GOM.lastDisplayedIdx != -1 ) {
        if( G.locationHashLastUsed !== '' ) {
          // back button and no hash --> display first album
          if( G.O.debugMode ) { console.log('display root album'  ); }
          G.locationHashLastUsed='';
          if( G.O.debugMode ) { console.log('new3 G.locationHashLastUsed: '+G.locationHashLastUsed); }
          DisplayAlbum( '', '0');
          return true;
        }
      }

      if( newLocationHash == G.locationHashLastUsed ) { return; }
      
      if( newLocationHash.indexOf(curGal) == 0 ) {
        // item IDs detected
        var IDs=parseIDs( newLocationHash.substring(curGal.length) );
        if( IDs.imageID != '0' ) {
          if( G.O.debugMode ) { console.log('display image: ' + IDs.albumID +'-'+ IDs.imageID ); }
          DisplayPhoto( IDs.imageID, IDs.albumID );
          return true;
        }
        else {
          if( G.O.debugMode ) { console.log('display album: ' + IDs.albumID  ); }
          DisplayAlbum( '-1', IDs.albumID );
          return true;
        }
      }    
      
      return false;
    }

    //---- Set a new browser location hash
    function SetLocationHash(albumID, imageID ) {
      if( !G.O.locationHash ) { return false; }

      if( G.O.debugMode ) {
        console.log('------------------------ SET LOCATION HASH');
      }
      
      if( imageID == '' && (albumID == '-1' || albumID == '0' || G.O.album == albumID ) ) {
        // root album level --> do not set top.location.hash if not already set
        if( location.hash != '' ) {
          // try to clear the hash if set
          if ("pushState" in history) {
            history.pushState("", document.title, window.location.pathname + window.location.search);
          }
          else {
            location.hash='';
          }
        }
        G.locationHashLastUsed='';
        if( G.O.debugMode ) { console.log('new2 G.locationHashLastUsed: '+G.locationHashLastUsed); }
        return;
      }
      
      var newLocationHash='#'+'nanogallery/'+G.baseEltID+'/'+ albumID;
      if( imageID != '' ) {
        newLocationHash+='/'+imageID;
      }

      var lH=location.hash;
      if( G.O.debugMode ) {
        console.log('newLocationHash2: '+newLocationHash);
        console.log('location.hash: '+lH);
      }

      G.locationHashLastUsed=newLocationHash;
      if( G.O.debugMode ) { console.log('new G.locationHashLastUsed: '+G.locationHashLastUsed); }
      
      if(  lH == '' || lH != newLocationHash ) {
        // G.locationHashLastUsed='#'+newLocationHash;
        try {
          top.location.hash=newLocationHash;
        }
        catch(e) {
          // location hash is not supported by current browser --> disable the option
          G.O.locationHash=false;
        }
      }
    }
    
    
    function ResizeWindowEvent() {
      if( G.VOM.viewerDisplayed ) {
        ResizeInternalViewer();
      }
      else {
        if( G.galleryResizeEventEnabled ) {
          var nw=RetrieveCurWidth();
          if( G.GOM.albumIdx != -1 && 
                ( G.tn.settings.getH() != G.tn.settings.height[G.GOM.curNavLevel][nw] || 
                G.tn.settings.getW() != G.tn.settings.width[G.GOM.curNavLevel][nw] ) ) {
            // thumbnail size changed --> render the gallery with the new sizes
            G.GOM.curWidth=nw;
            //G.layout.SetEngine();
            G.GOM.pagination.currentPage=0;
            GalleryRender( G.GOM.albumIdx );
          }
          else {
            GalleryResize();
          }
        }
      }
    }
    
    


    
    function OnScrollEvent() {
      if( G.scrollTimeOut ) {
        clearTimeout(G.scrollTimeOut);
      }
      
      G.scrollTimeOut = setTimeout(function () {
        if( !G.VOM.viewerDisplayed ) {
          if( G.galleryResizeEventEnabled ) {
            GalleryResize();
          }
          return;
        }
      }, 10);
    }

    
    // I18N : define text translations
    function i18n() {

      // browser language
      G.i18nLang = (navigator.language || navigator.userLanguage).toUpperCase();
      if( G.i18nLang === 'UNDEFINED') { G.i18nLang=''; }

      var llang=-('_'+G.i18nLang).length;
      
      if( toType(G.O.i18n) == 'object' ){
      
        for( var key in G.O.i18n ) {
          //var value = G.O.i18n[key];
          var s=key.substr(llang);
          if( s == ('_'+G.i18nLang) ) {
            G.i18nTranslations[key.substr(0,key.length-s.length)]=G.O.i18n[key];
          } 
          else {
            G.i18nTranslations[key]=G.O.i18n[key];
          }
        }
      }
    }

    function GetI18nItem( item, property ) {
      var s='';
      if( G.i18nLang != '' ) {
        if( item[property+'_'+G.i18nLang] !== undefined && item[property+'_'+G.i18nLang].length>0 ) {
          s=item[property+'_'+G.i18nLang];
          return s;
        }
      }
      s=item[property];
      return s;
    }

    
    function RetrieveCurWidth() {
      var vpW= getViewport().w;
      
      if( G.O.breakpointSizeSM > 0 && vpW < G.O.breakpointSizeSM) { return 'xs'; }
      if( G.O.breakpointSizeME > 0 && vpW < G.O.breakpointSizeME) { return 'sm'; }
      if( G.O.breakpointSizeLA > 0 && vpW < G.O.breakpointSizeLA) { return 'me'; }
      if( G.O.breakpointSizeXL > 0 && vpW < G.O.breakpointSizeXL) { return 'la'; }
      
      return 'xl';
    }

    
    /** @function browserNotification */
    function browserNotification() {
      var m='Your browser version is not supported anymore. The image gallery cannot be displayed. <br><br>Please update to a more recent one. Download:<br>';
      m+='&nbsp;&nbsp;&nbsp; <a href="http://www.google.com/chrome/?hl=en-US)">Chrome</a><br>';
      m+='&nbsp;&nbsp;&nbsp; <a href="http://www.mozilla.com/firefox/)">Firefox</a><br>';
      m+='&nbsp;&nbsp;&nbsp; <a href="http://www.microsoft.com/windows/internet-explorer/default.aspx">Internet Explorer</a><br>';
      m+='&nbsp;&nbsp;&nbsp; <a href="http://www.apple.com/safari/download/">Safari</a>';
      NanoAlert(G,  m, false);
    }

    // Original author : John Hrvatin, Lead Program Manager, Internet Explorer - http://blogs.msdn.com/b/ie/archive/2011/10/28/a-best-practice-for-programming-with-vendor-prefixes.aspx
    function FirstSupportedPropertyName(prefixedPropertyNames) {
      var tempDiv = document.createElement("div");
      for (var i = 0; i < prefixedPropertyNames.length; ++i) {
        if (typeof tempDiv.style[prefixedPropertyNames[i]] != 'undefined')
          return prefixedPropertyNames[i];
      }
      return null;
    }

    // #################
    // ##### TOOLS #####
    // #################

    // get viewport coordinates and size
    function getViewport() {
      var $win = jQuery(window);
      return {
        l: $win.scrollLeft(),
        t: $win.scrollTop(),
        w: $win.width(),
        h: $win.height()
      }
    }


    // avoid if possible (performance issue)
    function inViewport( $elt, threshold ) {
      var wp=getViewport(),
      eltOS=$elt.offset(),
      th=$elt.outerHeight(true),
      tw=$elt.outerWidth(true);
      if( eltOS.top >= (wp.t-threshold) 
        && (eltOS.top+th) <= (wp.t+wp.h+threshold)
        && eltOS.left >= (wp.l-threshold) 
        && (eltOS.left+tw) <= (wp.l+wp.w+threshold) ) {
        return true;
      }
      else {
        return false;
      }
    }

    // avoid if possible (performance issue)
    function inViewportVert( $elt, threshold ) {
      var wp=getViewport(),
      eltOS=$elt.offset(),
      th=$elt.outerHeight(true),
      tw=$elt.outerWidth(true);

      if( wp.t == 0 && (eltOS.top) <= (wp.t+wp.h ) ) { return true; }

      if( eltOS.top >= (wp.t) 
        && (eltOS.top+th) <= (wp.t+wp.h-threshold) ) {
          return true;
      }
      else {
        return false;
      }
    }

    // set z-index to display element on top of all others
    function setElementOnTop( start, elt ) {
      var highest_index = 0;
      if( start=='' ) { start= '*'; }
      jQuery(start).each(function() {
        var cur = parseInt(jQuery(this).css('z-index'));
        highest_index = cur > highest_index ? cur : highest_index;
      });
      highest_index++;
      jQuery(elt).css('z-index',highest_index);
    }

    // set z-index to display 2 elements on top of all others
    function set2ElementsOnTop( start, elt1, elt2 ) {
      var highest_index = 0;
      if( start=='' ) { start= '*'; }
      jQuery(start).each(function() {
        var cur = parseInt(jQuery(this).css('z-index'));
        highest_index = cur > highest_index ? cur : highest_index;
      });
      highest_index++;
      jQuery(elt2).css('z-index',highest_index+1);
      jQuery(elt1).css('z-index',highest_index);
    }

    
    // return the real type of the object
    var toType = function( obj ) {
      // by Angus Croll - http://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
      return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
    };
    
  }
  
  
  
// END NANOGALLERY2
}( jQuery ));
  
  
  
//##########################################################################################################################
//##########################################################################################################################
//##########################################################################################################################
//##########################################################################################################################
//##########################################################################################################################

// TinyColor v1.4.1
// https://github.com/bgrins/TinyColor
// 2016-07-07, Brian Grinstead, MIT License
!function(a){function b(a,d){if(a=a?a:"",d=d||{},a instanceof b)return a;if(!(this instanceof b))return new b(a,d);var e=c(a);this._originalInput=a,this._r=e.r,this._g=e.g,this._b=e.b,this._a=e.a,this._roundA=P(100*this._a)/100,this._format=d.format||e.format,this._gradientType=d.gradientType,this._r<1&&(this._r=P(this._r)),this._g<1&&(this._g=P(this._g)),this._b<1&&(this._b=P(this._b)),this._ok=e.ok,this._tc_id=O++}function c(a){var b={r:0,g:0,b:0},c=1,e=null,g=null,i=null,j=!1,k=!1;return"string"==typeof a&&(a=K(a)),"object"==typeof a&&(J(a.r)&&J(a.g)&&J(a.b)?(b=d(a.r,a.g,a.b),j=!0,k="%"===String(a.r).substr(-1)?"prgb":"rgb"):J(a.h)&&J(a.s)&&J(a.v)?(e=G(a.s),g=G(a.v),b=h(a.h,e,g),j=!0,k="hsv"):J(a.h)&&J(a.s)&&J(a.l)&&(e=G(a.s),i=G(a.l),b=f(a.h,e,i),j=!0,k="hsl"),a.hasOwnProperty("a")&&(c=a.a)),c=z(c),{ok:j,format:a.format||k,r:Q(255,R(b.r,0)),g:Q(255,R(b.g,0)),b:Q(255,R(b.b,0)),a:c}}function d(a,b,c){return{r:255*A(a,255),g:255*A(b,255),b:255*A(c,255)}}function e(a,b,c){a=A(a,255),b=A(b,255),c=A(c,255);var d,e,f=R(a,b,c),g=Q(a,b,c),h=(f+g)/2;if(f==g)d=e=0;else{var i=f-g;switch(e=h>.5?i/(2-f-g):i/(f+g),f){case a:d=(b-c)/i+(c>b?6:0);break;case b:d=(c-a)/i+2;break;case c:d=(a-b)/i+4}d/=6}return{h:d,s:e,l:h}}function f(a,b,c){function d(a,b,c){return 0>c&&(c+=1),c>1&&(c-=1),1/6>c?a+6*(b-a)*c:.5>c?b:2/3>c?a+6*(b-a)*(2/3-c):a}var e,f,g;if(a=A(a,360),b=A(b,100),c=A(c,100),0===b)e=f=g=c;else{var h=.5>c?c*(1+b):c+b-c*b,i=2*c-h;e=d(i,h,a+1/3),f=d(i,h,a),g=d(i,h,a-1/3)}return{r:255*e,g:255*f,b:255*g}}function g(a,b,c){a=A(a,255),b=A(b,255),c=A(c,255);var d,e,f=R(a,b,c),g=Q(a,b,c),h=f,i=f-g;if(e=0===f?0:i/f,f==g)d=0;else{switch(f){case a:d=(b-c)/i+(c>b?6:0);break;case b:d=(c-a)/i+2;break;case c:d=(a-b)/i+4}d/=6}return{h:d,s:e,v:h}}function h(b,c,d){b=6*A(b,360),c=A(c,100),d=A(d,100);var e=a.floor(b),f=b-e,g=d*(1-c),h=d*(1-f*c),i=d*(1-(1-f)*c),j=e%6,k=[d,h,g,g,i,d][j],l=[i,d,d,h,g,g][j],m=[g,g,i,d,d,h][j];return{r:255*k,g:255*l,b:255*m}}function i(a,b,c,d){var e=[F(P(a).toString(16)),F(P(b).toString(16)),F(P(c).toString(16))];return d&&e[0].charAt(0)==e[0].charAt(1)&&e[1].charAt(0)==e[1].charAt(1)&&e[2].charAt(0)==e[2].charAt(1)?e[0].charAt(0)+e[1].charAt(0)+e[2].charAt(0):e.join("")}function j(a,b,c,d,e){var f=[F(P(a).toString(16)),F(P(b).toString(16)),F(P(c).toString(16)),F(H(d))];return e&&f[0].charAt(0)==f[0].charAt(1)&&f[1].charAt(0)==f[1].charAt(1)&&f[2].charAt(0)==f[2].charAt(1)&&f[3].charAt(0)==f[3].charAt(1)?f[0].charAt(0)+f[1].charAt(0)+f[2].charAt(0)+f[3].charAt(0):f.join("")}function k(a,b,c,d){var e=[F(H(d)),F(P(a).toString(16)),F(P(b).toString(16)),F(P(c).toString(16))];return e.join("")}function l(a,c){c=0===c?0:c||10;var d=b(a).toHsl();return d.s-=c/100,d.s=B(d.s),b(d)}function m(a,c){c=0===c?0:c||10;var d=b(a).toHsl();return d.s+=c/100,d.s=B(d.s),b(d)}function n(a){return b(a).desaturate(100)}function o(a,c){c=0===c?0:c||10;var d=b(a).toHsl();return d.l+=c/100,d.l=B(d.l),b(d)}function p(a,c){c=0===c?0:c||10;var d=b(a).toRgb();return d.r=R(0,Q(255,d.r-P(255*-(c/100)))),d.g=R(0,Q(255,d.g-P(255*-(c/100)))),d.b=R(0,Q(255,d.b-P(255*-(c/100)))),b(d)}function q(a,c){c=0===c?0:c||10;var d=b(a).toHsl();return d.l-=c/100,d.l=B(d.l),b(d)}function r(a,c){var d=b(a).toHsl(),e=(d.h+c)%360;return d.h=0>e?360+e:e,b(d)}function s(a){var c=b(a).toHsl();return c.h=(c.h+180)%360,b(c)}function t(a){var c=b(a).toHsl(),d=c.h;return[b(a),b({h:(d+120)%360,s:c.s,l:c.l}),b({h:(d+240)%360,s:c.s,l:c.l})]}function u(a){var c=b(a).toHsl(),d=c.h;return[b(a),b({h:(d+90)%360,s:c.s,l:c.l}),b({h:(d+180)%360,s:c.s,l:c.l}),b({h:(d+270)%360,s:c.s,l:c.l})]}function v(a){var c=b(a).toHsl(),d=c.h;return[b(a),b({h:(d+72)%360,s:c.s,l:c.l}),b({h:(d+216)%360,s:c.s,l:c.l})]}function w(a,c,d){c=c||6,d=d||30;var e=b(a).toHsl(),f=360/d,g=[b(a)];for(e.h=(e.h-(f*c>>1)+720)%360;--c;)e.h=(e.h+f)%360,g.push(b(e));return g}function x(a,c){c=c||6;for(var d=b(a).toHsv(),e=d.h,f=d.s,g=d.v,h=[],i=1/c;c--;)h.push(b({h:e,s:f,v:g})),g=(g+i)%1;return h}function y(a){var b={};for(var c in a)a.hasOwnProperty(c)&&(b[a[c]]=c);return b}function z(a){return a=parseFloat(a),(isNaN(a)||0>a||a>1)&&(a=1),a}function A(b,c){D(b)&&(b="100%");var d=E(b);return b=Q(c,R(0,parseFloat(b))),d&&(b=parseInt(b*c,10)/100),a.abs(b-c)<1e-6?1:b%c/parseFloat(c)}function B(a){return Q(1,R(0,a))}function C(a){return parseInt(a,16)}function D(a){return"string"==typeof a&&-1!=a.indexOf(".")&&1===parseFloat(a)}function E(a){return"string"==typeof a&&-1!=a.indexOf("%")}function F(a){return 1==a.length?"0"+a:""+a}function G(a){return 1>=a&&(a=100*a+"%"),a}function H(b){return a.round(255*parseFloat(b)).toString(16)}function I(a){return C(a)/255}function J(a){return!!V.CSS_UNIT.exec(a)}function K(a){a=a.replace(M,"").replace(N,"").toLowerCase();var b=!1;if(T[a])a=T[a],b=!0;else if("transparent"==a)return{r:0,g:0,b:0,a:0,format:"name"};var c;return(c=V.rgb.exec(a))?{r:c[1],g:c[2],b:c[3]}:(c=V.rgba.exec(a))?{r:c[1],g:c[2],b:c[3],a:c[4]}:(c=V.hsl.exec(a))?{h:c[1],s:c[2],l:c[3]}:(c=V.hsla.exec(a))?{h:c[1],s:c[2],l:c[3],a:c[4]}:(c=V.hsv.exec(a))?{h:c[1],s:c[2],v:c[3]}:(c=V.hsva.exec(a))?{h:c[1],s:c[2],v:c[3],a:c[4]}:(c=V.hex8.exec(a))?{r:C(c[1]),g:C(c[2]),b:C(c[3]),a:I(c[4]),format:b?"name":"hex8"}:(c=V.hex6.exec(a))?{r:C(c[1]),g:C(c[2]),b:C(c[3]),format:b?"name":"hex"}:(c=V.hex4.exec(a))?{r:C(c[1]+""+c[1]),g:C(c[2]+""+c[2]),b:C(c[3]+""+c[3]),a:I(c[4]+""+c[4]),format:b?"name":"hex8"}:(c=V.hex3.exec(a))?{r:C(c[1]+""+c[1]),g:C(c[2]+""+c[2]),b:C(c[3]+""+c[3]),format:b?"name":"hex"}:!1}function L(a){var b,c;return a=a||{level:"AA",size:"small"},b=(a.level||"AA").toUpperCase(),c=(a.size||"small").toLowerCase(),"AA"!==b&&"AAA"!==b&&(b="AA"),"small"!==c&&"large"!==c&&(c="small"),{level:b,size:c}}var M=/^\s+/,N=/\s+$/,O=0,P=a.round,Q=a.min,R=a.max,S=a.random;b.prototype={isDark:function(){return this.getBrightness()<128},isLight:function(){return!this.isDark()},isValid:function(){return this._ok},getOriginalInput:function(){return this._originalInput},getFormat:function(){return this._format},getAlpha:function(){return this._a},getBrightness:function(){var a=this.toRgb();return(299*a.r+587*a.g+114*a.b)/1e3},getLuminance:function(){var b,c,d,e,f,g,h=this.toRgb();return b=h.r/255,c=h.g/255,d=h.b/255,e=.03928>=b?b/12.92:a.pow((b+.055)/1.055,2.4),f=.03928>=c?c/12.92:a.pow((c+.055)/1.055,2.4),g=.03928>=d?d/12.92:a.pow((d+.055)/1.055,2.4),.2126*e+.7152*f+.0722*g},setAlpha:function(a){return this._a=z(a),this._roundA=P(100*this._a)/100,this},toHsv:function(){var a=g(this._r,this._g,this._b);return{h:360*a.h,s:a.s,v:a.v,a:this._a}},toHsvString:function(){var a=g(this._r,this._g,this._b),b=P(360*a.h),c=P(100*a.s),d=P(100*a.v);return 1==this._a?"hsv("+b+", "+c+"%, "+d+"%)":"hsva("+b+", "+c+"%, "+d+"%, "+this._roundA+")"},toHsl:function(){var a=e(this._r,this._g,this._b);return{h:360*a.h,s:a.s,l:a.l,a:this._a}},toHslString:function(){var a=e(this._r,this._g,this._b),b=P(360*a.h),c=P(100*a.s),d=P(100*a.l);return 1==this._a?"hsl("+b+", "+c+"%, "+d+"%)":"hsla("+b+", "+c+"%, "+d+"%, "+this._roundA+")"},toHex:function(a){return i(this._r,this._g,this._b,a)},toHexString:function(a){return"#"+this.toHex(a)},toHex8:function(a){return j(this._r,this._g,this._b,this._a,a)},toHex8String:function(a){return"#"+this.toHex8(a)},toRgb:function(){return{r:P(this._r),g:P(this._g),b:P(this._b),a:this._a}},toRgbString:function(){return 1==this._a?"rgb("+P(this._r)+", "+P(this._g)+", "+P(this._b)+")":"rgba("+P(this._r)+", "+P(this._g)+", "+P(this._b)+", "+this._roundA+")"},toPercentageRgb:function(){return{r:P(100*A(this._r,255))+"%",g:P(100*A(this._g,255))+"%",b:P(100*A(this._b,255))+"%",a:this._a}},toPercentageRgbString:function(){return 1==this._a?"rgb("+P(100*A(this._r,255))+"%, "+P(100*A(this._g,255))+"%, "+P(100*A(this._b,255))+"%)":"rgba("+P(100*A(this._r,255))+"%, "+P(100*A(this._g,255))+"%, "+P(100*A(this._b,255))+"%, "+this._roundA+")"},toName:function(){return 0===this._a?"transparent":this._a<1?!1:U[i(this._r,this._g,this._b,!0)]||!1},toFilter:function(a){var c="#"+k(this._r,this._g,this._b,this._a),d=c,e=this._gradientType?"GradientType = 1, ":"";if(a){var f=b(a);d="#"+k(f._r,f._g,f._b,f._a)}return"progid:DXImageTransform.Microsoft.gradient("+e+"startColorstr="+c+",endColorstr="+d+")"},toString:function(a){var b=!!a;a=a||this._format;var c=!1,d=this._a<1&&this._a>=0,e=!b&&d&&("hex"===a||"hex6"===a||"hex3"===a||"hex4"===a||"hex8"===a||"name"===a);return e?"name"===a&&0===this._a?this.toName():this.toRgbString():("rgb"===a&&(c=this.toRgbString()),"prgb"===a&&(c=this.toPercentageRgbString()),("hex"===a||"hex6"===a)&&(c=this.toHexString()),"hex3"===a&&(c=this.toHexString(!0)),"hex4"===a&&(c=this.toHex8String(!0)),"hex8"===a&&(c=this.toHex8String()),"name"===a&&(c=this.toName()),"hsl"===a&&(c=this.toHslString()),"hsv"===a&&(c=this.toHsvString()),c||this.toHexString())},clone:function(){return b(this.toString())},_applyModification:function(a,b){var c=a.apply(null,[this].concat([].slice.call(b)));return this._r=c._r,this._g=c._g,this._b=c._b,this.setAlpha(c._a),this},lighten:function(){return this._applyModification(o,arguments)},brighten:function(){return this._applyModification(p,arguments)},darken:function(){return this._applyModification(q,arguments)},desaturate:function(){return this._applyModification(l,arguments)},saturate:function(){return this._applyModification(m,arguments)},greyscale:function(){return this._applyModification(n,arguments)},spin:function(){return this._applyModification(r,arguments)},_applyCombination:function(a,b){return a.apply(null,[this].concat([].slice.call(b)))},analogous:function(){return this._applyCombination(w,arguments)},complement:function(){return this._applyCombination(s,arguments)},monochromatic:function(){return this._applyCombination(x,arguments)},splitcomplement:function(){return this._applyCombination(v,arguments)},triad:function(){return this._applyCombination(t,arguments)},tetrad:function(){return this._applyCombination(u,arguments)}},b.fromRatio=function(a,c){if("object"==typeof a){var d={};for(var e in a)a.hasOwnProperty(e)&&(d[e]="a"===e?a[e]:G(a[e]));a=d}return b(a,c)},b.equals=function(a,c){return a&&c?b(a).toRgbString()==b(c).toRgbString():!1},b.random=function(){return b.fromRatio({r:S(),g:S(),b:S()})},b.mix=function(a,c,d){d=0===d?0:d||50;var e=b(a).toRgb(),f=b(c).toRgb(),g=d/100,h={r:(f.r-e.r)*g+e.r,g:(f.g-e.g)*g+e.g,b:(f.b-e.b)*g+e.b,a:(f.a-e.a)*g+e.a};return b(h)},b.readability=function(c,d){var e=b(c),f=b(d);return(a.max(e.getLuminance(),f.getLuminance())+.05)/(a.min(e.getLuminance(),f.getLuminance())+.05)},b.isReadable=function(a,c,d){var e,f,g=b.readability(a,c);switch(f=!1,e=L(d),e.level+e.size){case"AAsmall":case"AAAlarge":f=g>=4.5;break;case"AAlarge":f=g>=3;break;case"AAAsmall":f=g>=7}return f},b.mostReadable=function(a,c,d){var e,f,g,h,i=null,j=0;d=d||{},f=d.includeFallbackColors,g=d.level,h=d.size;for(var k=0;k<c.length;k++)e=b.readability(a,c[k]),e>j&&(j=e,i=b(c[k]));return b.isReadable(a,i,{level:g,size:h})||!f?i:(d.includeFallbackColors=!1,b.mostReadable(a,["#fff","#000"],d))};var T=b.names={aliceblue:"f0f8ff",antiquewhite:"faebd7",aqua:"0ff",aquamarine:"7fffd4",azure:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"000",blanchedalmond:"ffebcd",blue:"00f",blueviolet:"8a2be2",brown:"a52a2a",burlywood:"deb887",burntsienna:"ea7e5d",cadetblue:"5f9ea0",chartreuse:"7fff00",chocolate:"d2691e",coral:"ff7f50",cornflowerblue:"6495ed",cornsilk:"fff8dc",crimson:"dc143c",cyan:"0ff",darkblue:"00008b",darkcyan:"008b8b",darkgoldenrod:"b8860b",darkgray:"a9a9a9",darkgreen:"006400",darkgrey:"a9a9a9",darkkhaki:"bdb76b",darkmagenta:"8b008b",darkolivegreen:"556b2f",darkorange:"ff8c00",darkorchid:"9932cc",darkred:"8b0000",darksalmon:"e9967a",darkseagreen:"8fbc8f",darkslateblue:"483d8b",darkslategray:"2f4f4f",darkslategrey:"2f4f4f",darkturquoise:"00ced1",darkviolet:"9400d3",deeppink:"ff1493",deepskyblue:"00bfff",dimgray:"696969",dimgrey:"696969",dodgerblue:"1e90ff",firebrick:"b22222",floralwhite:"fffaf0",forestgreen:"228b22",fuchsia:"f0f",gainsboro:"dcdcdc",ghostwhite:"f8f8ff",gold:"ffd700",goldenrod:"daa520",gray:"808080",green:"008000",greenyellow:"adff2f",grey:"808080",honeydew:"f0fff0",hotpink:"ff69b4",indianred:"cd5c5c",indigo:"4b0082",ivory:"fffff0",khaki:"f0e68c",lavender:"e6e6fa",lavenderblush:"fff0f5",lawngreen:"7cfc00",lemonchiffon:"fffacd",lightblue:"add8e6",lightcoral:"f08080",lightcyan:"e0ffff",lightgoldenrodyellow:"fafad2",lightgray:"d3d3d3",lightgreen:"90ee90",lightgrey:"d3d3d3",lightpink:"ffb6c1",lightsalmon:"ffa07a",lightseagreen:"20b2aa",lightskyblue:"87cefa",lightslategray:"789",lightslategrey:"789",lightsteelblue:"b0c4de",lightyellow:"ffffe0",lime:"0f0",limegreen:"32cd32",linen:"faf0e6",magenta:"f0f",maroon:"800000",mediumaquamarine:"66cdaa",mediumblue:"0000cd",mediumorchid:"ba55d3",mediumpurple:"9370db",mediumseagreen:"3cb371",mediumslateblue:"7b68ee",mediumspringgreen:"00fa9a",mediumturquoise:"48d1cc",mediumvioletred:"c71585",midnightblue:"191970",mintcream:"f5fffa",mistyrose:"ffe4e1",moccasin:"ffe4b5",navajowhite:"ffdead",navy:"000080",oldlace:"fdf5e6",olive:"808000",olivedrab:"6b8e23",orange:"ffa500",orangered:"ff4500",orchid:"da70d6",palegoldenrod:"eee8aa",palegreen:"98fb98",paleturquoise:"afeeee",palevioletred:"db7093",papayawhip:"ffefd5",peachpuff:"ffdab9",peru:"cd853f",pink:"ffc0cb",plum:"dda0dd",powderblue:"b0e0e6",purple:"800080",rebeccapurple:"663399",red:"f00",rosybrown:"bc8f8f",royalblue:"4169e1",saddlebrown:"8b4513",salmon:"fa8072",sandybrown:"f4a460",seagreen:"2e8b57",seashell:"fff5ee",sienna:"a0522d",silver:"c0c0c0",skyblue:"87ceeb",slateblue:"6a5acd",slategray:"708090",slategrey:"708090",snow:"fffafa",springgreen:"00ff7f",steelblue:"4682b4",tan:"d2b48c",teal:"008080",thistle:"d8bfd8",tomato:"ff6347",turquoise:"40e0d0",violet:"ee82ee",wheat:"f5deb3",white:"fff",whitesmoke:"f5f5f5",yellow:"ff0",yellowgreen:"9acd32"},U=b.hexNames=y(T),V=function(){var a="[-\\+]?\\d+%?",b="[-\\+]?\\d*\\.\\d+%?",c="(?:"+b+")|(?:"+a+")",d="[\\s|\\(]+("+c+")[,|\\s]+("+c+")[,|\\s]+("+c+")\\s*\\)?",e="[\\s|\\(]+("+c+")[,|\\s]+("+c+")[,|\\s]+("+c+")[,|\\s]+("+c+")\\s*\\)?";return{CSS_UNIT:new RegExp(c),rgb:new RegExp("rgb"+d),rgba:new RegExp("rgba"+e),hsl:new RegExp("hsl"+d),hsla:new RegExp("hsla"+e),hsv:new RegExp("hsv"+d),hsva:new RegExp("hsva"+e),hex3:/^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,hex6:/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,hex4:/^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,hex8:/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/}}();"undefined"!=typeof module&&module.exports?module.exports=b:"function"==typeof define&&define.amd?define(function(){return b}):window.tinycolor=b}(Math);


//##########################################################################################################################
//##########################################################################################################################
//##########################################################################################################################
//##########################################################################################################################
//##########################################################################################################################

// NGY BUILD:
// replace "imagesLoaded" with "ngimagesLoaded"
// replace "ImagesLoaded" with "ngImagesLoaded"
// replace "EvEmitter" with "ngEvEmitter"
// replace "var $ = window.jQuery" with "var $ = jQuery;"
// 2x (global.ngEvEmitter and window.ngimagesLoaded = f...)ignore package manager and set browser global

/*!
 * imagesLoaded PACKAGED v4.1.1
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */

/**
 * EvEmitter v1.0.3
 * Lil' event emitter
 * MIT License
 */

/* jshint unused: true, undef: true, strict: true */

( function( global, factory ) {
  // universal module definition
  /* jshint strict: false */ /* globals define, module, window */
//  if ( typeof define == 'function' && define.amd ) {
    // AMD - RequireJS
//    define( 'ev-emitter/ev-emitter',factory );
//  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS - Browserify, Webpack
//    module.exports = factory();
//  } else {
    // Browser globals
    global.ngEvEmitter = factory();
//  }

}( typeof window != 'undefined' ? window : this, function() {



function ngEvEmitter() {}

var proto = ngEvEmitter.prototype;

proto.on = function( eventName, listener ) {
  if ( !eventName || !listener ) {
    return;
  }
  // set events hash
  var events = this._events = this._events || {};
  // set listeners array
  var listeners = events[ eventName ] = events[ eventName ] || [];
  // only add once
  if ( listeners.indexOf( listener ) == -1 ) {
    listeners.push( listener );
  }

  return this;
};

proto.once = function( eventName, listener ) {
  if ( !eventName || !listener ) {
    return;
  }
  // add event
  this.on( eventName, listener );
  // set once flag
  // set onceEvents hash
  var onceEvents = this._onceEvents = this._onceEvents || {};
  // set onceListeners object
  var onceListeners = onceEvents[ eventName ] = onceEvents[ eventName ] || {};
  // set flag
  onceListeners[ listener ] = true;

  return this;
};

proto.off = function( eventName, listener ) {
  var listeners = this._events && this._events[ eventName ];
  if ( !listeners || !listeners.length ) {
    return;
  }
  var index = listeners.indexOf( listener );
  if ( index != -1 ) {
    listeners.splice( index, 1 );
  }

  return this;
};

proto.emitEvent = function( eventName, args ) {
  var listeners = this._events && this._events[ eventName ];
  if ( !listeners || !listeners.length ) {
    return;
  }
  var i = 0;
  var listener = listeners[i];
  args = args || [];
  // once stuff
  var onceListeners = this._onceEvents && this._onceEvents[ eventName ];

  while ( listener ) {
    var isOnce = onceListeners && onceListeners[ listener ];
    if ( isOnce ) {
      // remove listener
      // remove before trigger to prevent recursion
      this.off( eventName, listener );
      // unset once flag
      delete onceListeners[ listener ];
    }
    // trigger listener
    listener.apply( this, args );
    // get next listener
    i += isOnce ? 0 : 1;
    listener = listeners[i];
  }

  return this;
};

return ngEvEmitter;

}));

/*!
 * ngimagesLoaded v4.1.1
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */

( function( window, factory ) { 'use strict';
  // universal module definition

  /*global define: false, module: false, require: false */

//  if ( typeof define == 'function' && define.amd ) {
    // AMD
//    define( [
//      'ev-emitter/ev-emitter'
//    ], function( ngEvEmitter ) {
//      return factory( window, ngEvEmitter );
//    });
//  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
//    module.exports = factory(
//      window,
//      require('ev-emitter')
//    );
//  } else {
    // browser global
    window.ngimagesLoaded = factory(
      window,
      window.ngEvEmitter
    );
  //}

})( window,

// --------------------------  factory -------------------------- //

function factory( window, ngEvEmitter ) {



// var $ = window.jQuery;
var $ = jQuery;
var console = window.console;

// -------------------------- helpers -------------------------- //

// extend objects
function extend( a, b ) {
  for ( var prop in b ) {
    a[ prop ] = b[ prop ];
  }
  return a;
}

// turn element or nodeList into an array
function makeArray( obj ) {
  var ary = [];
  if ( Array.isArray( obj ) ) {
    // use object if already an array
    ary = obj;
  } else if ( typeof obj.length == 'number' ) {
    // convert nodeList to array
    for ( var i=0; i < obj.length; i++ ) {
      ary.push( obj[i] );
    }
  } else {
    // array of single index
    ary.push( obj );
  }
  return ary;
}

// -------------------------- ngimagesLoaded -------------------------- //

/**
 * @param {Array, Element, NodeList, String} elem
 * @param {Object or Function} options - if function, use as callback
 * @param {Function} onAlways - callback function
 */
function ngImagesLoaded( elem, options, onAlways ) {
  // coerce ngImagesLoaded() without new, to be new ngImagesLoaded()
  if ( !( this instanceof ngImagesLoaded ) ) {
    return new ngImagesLoaded( elem, options, onAlways );
  }
  // use elem as selector string
  if ( typeof elem == 'string' ) {
    elem = document.querySelectorAll( elem );
  }

  this.elements = makeArray( elem );
  this.options = extend( {}, this.options );

  if ( typeof options == 'function' ) {
    onAlways = options;
  } else {
    extend( this.options, options );
  }

  if ( onAlways ) {
    this.on( 'always', onAlways );
  }

  this.getImages();

  if ( $ ) {
    // add jQuery Deferred object
    this.jqDeferred = new $.Deferred();
  }

  // HACK check async to allow time to bind listeners
  setTimeout( function() {
    this.check();
  }.bind( this ));
}

ngImagesLoaded.prototype = Object.create( ngEvEmitter.prototype );

ngImagesLoaded.prototype.options = {};

ngImagesLoaded.prototype.getImages = function() {
  this.images = [];

  // filter & find items if we have an item selector
  this.elements.forEach( this.addElementImages, this );
};

/**
 * @param {Node} element
 */
ngImagesLoaded.prototype.addElementImages = function( elem ) {
  // filter siblings
  if ( elem.nodeName == 'IMG' ) {
    this.addImage( elem );
  }
  // get background image on element
  if ( this.options.background === true ) {
    this.addElementBackgroundImages( elem );
  }

  // find children
  // no non-element nodes, #143
  var nodeType = elem.nodeType;
  if ( !nodeType || !elementNodeTypes[ nodeType ] ) {
    return;
  }
  var childImgs = elem.querySelectorAll('img');
  // concat childElems to filterFound array
  for ( var i=0; i < childImgs.length; i++ ) {
    var img = childImgs[i];
    this.addImage( img );
  }

  // get child background images
  if ( typeof this.options.background == 'string' ) {
    var children = elem.querySelectorAll( this.options.background );
    for ( i=0; i < children.length; i++ ) {
      var child = children[i];
      this.addElementBackgroundImages( child );
    }
  }
};

var elementNodeTypes = {
  1: true,
  9: true,
  11: true
};

ngImagesLoaded.prototype.addElementBackgroundImages = function( elem ) {
  var style = getComputedStyle( elem );
  if ( !style ) {
    // Firefox returns null if in a hidden iframe https://bugzil.la/548397
    return;
  }
  // get url inside url("...")
  var reURL = /url\((['"])?(.*?)\1\)/gi;
  var matches = reURL.exec( style.backgroundImage );
  while ( matches !== null ) {
    var url = matches && matches[2];
    if ( url ) {
      this.addBackground( url, elem );
    }
    matches = reURL.exec( style.backgroundImage );
  }
};

/**
 * @param {Image} img
 */
ngImagesLoaded.prototype.addImage = function( img ) {
  var loadingImage = new LoadingImage( img );
  this.images.push( loadingImage );
};

ngImagesLoaded.prototype.addBackground = function( url, elem ) {
  var background = new Background( url, elem );
  this.images.push( background );
};

ngImagesLoaded.prototype.check = function() {
  var _this = this;
  this.progressedCount = 0;
  this.hasAnyBroken = false;
  // complete if no images
  if ( !this.images.length ) {
    this.complete();
    return;
  }

  function onProgress( image, elem, message ) {
    // HACK - Chrome triggers event before object properties have changed. #83
    setTimeout( function() {
      _this.progress( image, elem, message );
    });
  }

  this.images.forEach( function( loadingImage ) {
    loadingImage.once( 'progress', onProgress );
    loadingImage.check();
  });
};

ngImagesLoaded.prototype.progress = function( image, elem, message ) {
  this.progressedCount++;
  this.hasAnyBroken = this.hasAnyBroken || !image.isLoaded;
  // progress event
  this.emitEvent( 'progress', [ this, image, elem ] );
  if ( this.jqDeferred && this.jqDeferred.notify ) {
    this.jqDeferred.notify( this, image );
  }
  // check if completed
  if ( this.progressedCount == this.images.length ) {
    this.complete();
  }

  if ( this.options.debug && console ) {
    console.log( 'progress: ' + message, image, elem );
  }
};

ngImagesLoaded.prototype.complete = function() {
  var eventName = this.hasAnyBroken ? 'fail' : 'done';
  this.isComplete = true;
  this.emitEvent( eventName, [ this ] );
  this.emitEvent( 'always', [ this ] );
  if ( this.jqDeferred ) {
    var jqMethod = this.hasAnyBroken ? 'reject' : 'resolve';
    this.jqDeferred[ jqMethod ]( this );
  }
};

// --------------------------  -------------------------- //

function LoadingImage( img ) {
  this.img = img;
}

LoadingImage.prototype = Object.create( ngEvEmitter.prototype );

LoadingImage.prototype.check = function() {
  // If complete is true and browser supports natural sizes,
  // try to check for image status manually.
  var isComplete = this.getIsImageComplete();
  if ( isComplete ) {
    // report based on naturalWidth
    this.confirm( this.img.naturalWidth !== 0, 'naturalWidth' );
    return;
  }

  // If none of the checks above matched, simulate loading on detached element.
  this.proxyImage = new Image();
  this.proxyImage.addEventListener( 'load', this );
  this.proxyImage.addEventListener( 'error', this );
  // bind to image as well for Firefox. #191
  this.img.addEventListener( 'load', this );
  this.img.addEventListener( 'error', this );
  this.proxyImage.src = this.img.src;
};

LoadingImage.prototype.getIsImageComplete = function() {
  return this.img.complete && this.img.naturalWidth !== undefined;
};

LoadingImage.prototype.confirm = function( isLoaded, message ) {
  this.isLoaded = isLoaded;
  this.emitEvent( 'progress', [ this, this.img, message ] );
};

// ----- events ----- //

// trigger specified handler for event type
LoadingImage.prototype.handleEvent = function( event ) {
  var method = 'on' + event.type;
  if ( this[ method ] ) {
    this[ method ]( event );
  }
};

LoadingImage.prototype.onload = function() {
  this.confirm( true, 'onload' );
  this.unbindEvents();
};

LoadingImage.prototype.onerror = function() {
  this.confirm( false, 'onerror' );
  this.unbindEvents();
};

LoadingImage.prototype.unbindEvents = function() {
  this.proxyImage.removeEventListener( 'load', this );
  this.proxyImage.removeEventListener( 'error', this );
  this.img.removeEventListener( 'load', this );
  this.img.removeEventListener( 'error', this );
};

// -------------------------- Background -------------------------- //

function Background( url, element ) {
  this.url = url;
  this.element = element;
  this.img = new Image();
}

// inherit LoadingImage prototype
Background.prototype = Object.create( LoadingImage.prototype );

Background.prototype.check = function() {
  this.img.addEventListener( 'load', this );
  this.img.addEventListener( 'error', this );
  this.img.src = this.url;
  // check if image is already complete
  var isComplete = this.getIsImageComplete();
  if ( isComplete ) {
    this.confirm( this.img.naturalWidth !== 0, 'naturalWidth' );
    this.unbindEvents();
  }
};

Background.prototype.unbindEvents = function() {
  this.img.removeEventListener( 'load', this );
  this.img.removeEventListener( 'error', this );
};

Background.prototype.confirm = function( isLoaded, message ) {
  this.isLoaded = isLoaded;
  this.emitEvent( 'progress', [ this, this.element, message ] );
};

// -------------------------- jQuery -------------------------- //

ngImagesLoaded.makeJQueryPlugin = function( jQuery ) {
  jQuery = jQuery || window.jQuery;
  if ( !jQuery ) {
    return;
  }
  // set local variable
  $ = jQuery;
  // $().ngimagesLoaded()
  $.fn.ngimagesLoaded = function( options, callback ) {
    var instance = new ngImagesLoaded( this, options, callback );
    return instance.jqDeferred.promise( $(this) );
  };
};
// try making plugin
ngImagesLoaded.makeJQueryPlugin();

// --------------------------  -------------------------- //

return ngImagesLoaded;

});



//##########################################################################################################################
//##########################################################################################################################
//##########################################################################################################################
//##########################################################################################################################
//##########################################################################################################################

// screenfull.js
// v3.2.0
// by sindresorhus - https://github.com/sindresorhus
// from: https://github.com/sindresorhus/screenfull.js

// NGY BUILD:
// replace "screenfull" with "ngscreenfull"
// 

(function () {
	'use strict';

	var document = typeof window === 'undefined' ? {} : window.document;
	var isCommonjs = typeof module !== 'undefined' && module.exports;
	var keyboardAllowed = typeof Element !== 'undefined' && 'ALLOW_KEYBOARD_INPUT' in Element;

	var fn = (function () {
		var val;

		var fnMap = [
			[
				'requestFullscreen',
				'exitFullscreen',
				'fullscreenElement',
				'fullscreenEnabled',
				'fullscreenchange',
				'fullscreenerror'
			],
			// New WebKit
			[
				'webkitRequestFullscreen',
				'webkitExitFullscreen',
				'webkitFullscreenElement',
				'webkitFullscreenEnabled',
				'webkitfullscreenchange',
				'webkitfullscreenerror'

			],
			// Old WebKit (Safari 5.1)
			[
				'webkitRequestFullScreen',
				'webkitCancelFullScreen',
				'webkitCurrentFullScreenElement',
				'webkitCancelFullScreen',
				'webkitfullscreenchange',
				'webkitfullscreenerror'

			],
			[
				'mozRequestFullScreen',
				'mozCancelFullScreen',
				'mozFullScreenElement',
				'mozFullScreenEnabled',
				'mozfullscreenchange',
				'mozfullscreenerror'
			],
			[
				'msRequestFullscreen',
				'msExitFullscreen',
				'msFullscreenElement',
				'msFullscreenEnabled',
				'MSFullscreenChange',
				'MSFullscreenError'
			]
		];

		var i = 0;
		var l = fnMap.length;
		var ret = {};

		for (; i < l; i++) {
			val = fnMap[i];
			if (val && val[1] in document) {
				for (i = 0; i < val.length; i++) {
					ret[fnMap[0][i]] = val[i];
				}
				return ret;
			}
		}

		return false;
	})();

	var ngscreenfull = {
		request: function (elem) {
			var request = fn.requestFullscreen;

			elem = elem || document.documentElement;

			// Work around Safari 5.1 bug: reports support for
			// keyboard in fullscreen even though it doesn't.
			// Browser sniffing, since the alternative with
			// setTimeout is even worse.
			if (/5\.1[.\d]* Safari/.test(navigator.userAgent)) {
				elem[request]();
			} else {
				elem[request](keyboardAllowed && Element.ALLOW_KEYBOARD_INPUT);
			}
		},
		exit: function () {
			document[fn.exitFullscreen]();
		},
		toggle: function (elem) {
			if (this.isFullscreen) {
				this.exit();
			} else {
				this.request(elem);
			}
		},
		onchange: function (callback) {
			document.addEventListener(fn.fullscreenchange, callback, false);
		},
		onerror: function (callback) {
			document.addEventListener(fn.fullscreenerror, callback, false);
		},
		raw: fn
	};

	if (!fn) {
		if (isCommonjs) {
			module.exports = false;
		} else {
			window.ngscreenfull = false;
		}

		return;
	}

	Object.defineProperties(ngscreenfull, {
		isFullscreen: {
			get: function () {
				return Boolean(document[fn.fullscreenElement]);
			}
		},
		element: {
			enumerable: true,
			get: function () {
				return document[fn.fullscreenElement];
			}
		},
		enabled: {
			enumerable: true,
			get: function () {
				// Coerce to boolean in case of old WebKit
				return Boolean(document[fn.fullscreenEnabled]);
			}
		}
	});

	if (isCommonjs) {
		module.exports = ngscreenfull;
	} else {
		window.ngscreenfull = ngscreenfull;
	}
})();


  
//##########################################################################################################################
//##########################################################################################################################
//##########################################################################################################################
//##########################################################################################################################
//##########################################################################################################################
  
 /*!
 * Shifty
 * By Jeremy Kahn - jeremyckahn@gmail.com
 */

// NGY BUILD:
// 
// replace "Tweenable" with "NGTweenable"
// replace "define.amd" with "define.amdDISABLED"
/* shifty - v1.5.3 - 2016-11-29 - http://jeremyckahn.github.io/shifty */
;(function () {
  var root = this || Function('return this')();

/**
 * Shifty Core
 * By Jeremy Kahn - jeremyckahn@gmail.com
 */

var NGTweenable = (function () {

  'use strict';

  // Aliases that get defined later in this function
  var formula;

  // CONSTANTS
  var DEFAULT_SCHEDULE_FUNCTION;
  var DEFAULT_EASING = 'linear';
  var DEFAULT_DURATION = 500;
  var UPDATE_TIME = 1000 / 60;

  var _now = Date.now
       ? Date.now
       : function () {return +new Date();};

  var now = typeof SHIFTY_DEBUG_NOW !== 'undefined' ? SHIFTY_DEBUG_NOW : _now;

  if (typeof window !== 'undefined') {
    // requestAnimationFrame() shim by Paul Irish (modified for Shifty)
    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    DEFAULT_SCHEDULE_FUNCTION = window.requestAnimationFrame
       || window.webkitRequestAnimationFrame
       || window.oRequestAnimationFrame
       || window.msRequestAnimationFrame
       || (window.mozCancelRequestAnimationFrame
       && window.mozRequestAnimationFrame)
       || setTimeout;
  } else {
    DEFAULT_SCHEDULE_FUNCTION = setTimeout;
  }

  function noop () {
    // NOOP!
  }

  /**
   * Handy shortcut for doing a for-in loop. This is not a "normal" each
   * function, it is optimized for Shifty.  The iterator function only receives
   * the property name, not the value.
   * @param {Object} obj
   * @param {Function(string)} fn
   * @private
   */
  function each (obj, fn) {
    var key;
    for (key in obj) {
      if (Object.hasOwnProperty.call(obj, key)) {
        fn(key);
      }
    }
  }

  /**
   * Perform a shallow copy of Object properties.
   * @param {Object} targetObject The object to copy into
   * @param {Object} srcObject The object to copy from
   * @return {Object} A reference to the augmented `targetObj` Object
   * @private
   */
  function shallowCopy (targetObj, srcObj) {
    each(srcObj, function (prop) {
      targetObj[prop] = srcObj[prop];
    });

    return targetObj;
  }

  /**
   * Copies each property from src onto target, but only if the property to
   * copy to target is undefined.
   * @param {Object} target Missing properties in this Object are filled in
   * @param {Object} src
   * @private
   */
  function defaults (target, src) {
    each(src, function (prop) {
      if (typeof target[prop] === 'undefined') {
        target[prop] = src[prop];
      }
    });
  }

  /**
   * Calculates the interpolated tween values of an Object for a given
   * timestamp.
   * @param {Number} forPosition The position to compute the state for.
   * @param {Object} currentState Current state properties.
   * @param {Object} originalState: The original state properties the Object is
   * tweening from.
   * @param {Object} targetState: The destination state properties the Object
   * is tweening to.
   * @param {number} duration: The length of the tween in milliseconds.
   * @param {number} timestamp: The UNIX epoch time at which the tween began.
   * @param {Object} easing: This Object's keys must correspond to the keys in
   * targetState.
   * @private
   */
  function tweenProps (forPosition, currentState, originalState, targetState,
    duration, timestamp, easing) {
    var normalizedPosition =
        forPosition < timestamp ? 0 : (forPosition - timestamp) / duration;


    var prop;
    var easingObjectProp;
    var easingFn;
    for (prop in currentState) {
      if (currentState.hasOwnProperty(prop)) {
        easingObjectProp = easing[prop];
        easingFn = typeof easingObjectProp === 'function'
          ? easingObjectProp
          : formula[easingObjectProp];

        currentState[prop] = tweenProp(
          originalState[prop],
          targetState[prop],
          easingFn,
          normalizedPosition
        );
      }
    }

    return currentState;
  }

  /**
   * Tweens a single property.
   * @param {number} start The value that the tween started from.
   * @param {number} end The value that the tween should end at.
   * @param {Function} easingFunc The easing curve to apply to the tween.
   * @param {number} position The normalized position (between 0.0 and 1.0) to
   * calculate the midpoint of 'start' and 'end' against.
   * @return {number} The tweened value.
   * @private
   */
  function tweenProp (start, end, easingFunc, position) {
    return start + (end - start) * easingFunc(position);
  }

  /**
   * Applies a filter to NGTweenable instance.
   * @param {NGTweenable} tweenable The `NGTweenable` instance to call the filter
   * upon.
   * @param {String} filterName The name of the filter to apply.
   * @private
   */
  function applyFilter (tweenable, filterName) {
    var filters = NGTweenable.prototype.filter;
    var args = tweenable._filterArgs;

    each(filters, function (name) {
      if (typeof filters[name][filterName] !== 'undefined') {
        filters[name][filterName].apply(tweenable, args);
      }
    });
  }

  var timeoutHandler_endTime;
  var timeoutHandler_currentTime;
  var timeoutHandler_isEnded;
  var timeoutHandler_offset;
  /**
   * Handles the update logic for one step of a tween.
   * @param {NGTweenable} tweenable
   * @param {number} timestamp
   * @param {number} delay
   * @param {number} duration
   * @param {Object} currentState
   * @param {Object} originalState
   * @param {Object} targetState
   * @param {Object} easing
   * @param {Function(Object, *, number)} step
   * @param {Function(Function,number)}} schedule
   * @param {number=} opt_currentTimeOverride Needed for accurate timestamp in
   * NGTweenable#seek.
   * @private
   */
  function timeoutHandler (tweenable, timestamp, delay, duration, currentState,
    originalState, targetState, easing, step, schedule,
    opt_currentTimeOverride) {

    timeoutHandler_endTime = timestamp + delay + duration;

    timeoutHandler_currentTime =
    Math.min(opt_currentTimeOverride || now(), timeoutHandler_endTime);

    timeoutHandler_isEnded =
      timeoutHandler_currentTime >= timeoutHandler_endTime;

    timeoutHandler_offset = duration - (
      timeoutHandler_endTime - timeoutHandler_currentTime);

    if (tweenable.isPlaying()) {
      if (timeoutHandler_isEnded) {
        step(targetState, tweenable._attachment, timeoutHandler_offset);
        tweenable.stop(true);
      } else {
        tweenable._scheduleId =
          schedule(tweenable._timeoutHandler, UPDATE_TIME);

        applyFilter(tweenable, 'beforeTween');

        // If the animation has not yet reached the start point (e.g., there was
        // delay that has not yet completed), just interpolate the starting
        // position of the tween.
        if (timeoutHandler_currentTime < (timestamp + delay)) {
          tweenProps(1, currentState, originalState, targetState, 1, 1, easing);
        } else {
          tweenProps(timeoutHandler_currentTime, currentState, originalState,
            targetState, duration, timestamp + delay, easing);
        }

        applyFilter(tweenable, 'afterTween');

        step(currentState, tweenable._attachment, timeoutHandler_offset);
      }
    }
  }


  /**
   * Creates a usable easing Object from a string, a function or another easing
   * Object.  If `easing` is an Object, then this function clones it and fills
   * in the missing properties with `"linear"`.
   * @param {Object.<string|Function>} fromTweenParams
   * @param {Object|string|Function} easing
   * @return {Object.<string|Function>}
   * @private
   */
  function composeEasingObject (fromTweenParams, easing) {
    var composedEasing = {};
    var typeofEasing = typeof easing;

    if (typeofEasing === 'string' || typeofEasing === 'function') {
      each(fromTweenParams, function (prop) {
        composedEasing[prop] = easing;
      });
    } else {
      each(fromTweenParams, function (prop) {
        if (!composedEasing[prop]) {
          composedEasing[prop] = easing[prop] || DEFAULT_EASING;
        }
      });
    }

    return composedEasing;
  }

  /**
   * NGTweenable constructor.
   * @class NGTweenable
   * @param {Object=} opt_initialState The values that the initial tween should
   * start at if a `from` object is not provided to `{{#crossLink
   * "NGTweenable/tween:method"}}{{/crossLink}}` or `{{#crossLink
   * "NGTweenable/setConfig:method"}}{{/crossLink}}`.
   * @param {Object=} opt_config Configuration object to be passed to
   * `{{#crossLink "NGTweenable/setConfig:method"}}{{/crossLink}}`.
   * @module NGTweenable
   * @constructor
   */
  function NGTweenable (opt_initialState, opt_config) {
    this._currentState = opt_initialState || {};
    this._configured = false;
    this._scheduleFunction = DEFAULT_SCHEDULE_FUNCTION;

    // To prevent unnecessary calls to setConfig do not set default
    // configuration here.  Only set default configuration immediately before
    // tweening if none has been set.
    if (typeof opt_config !== 'undefined') {
      this.setConfig(opt_config);
    }
  }

  /**
   * Configure and start a tween.
   * @method tween
   * @param {Object=} opt_config Configuration object to be passed to
   * `{{#crossLink "NGTweenable/setConfig:method"}}{{/crossLink}}`.
   * @chainable
   */
  NGTweenable.prototype.tween = function (opt_config) {
    if (this._isTweening) {
      return this;
    }

    // Only set default config if no configuration has been set previously and
    // none is provided now.
    if (opt_config !== undefined || !this._configured) {
      this.setConfig(opt_config);
    }

    this._timestamp = now();
    this._start(this.get(), this._attachment);
    return this.resume();
  };

  /**
   * Configure a tween that will start at some point in the future.
   *
   * @method setConfig
   * @param {Object} config The following values are valid:
   * - __from__ (_Object=_): Starting position.  If omitted, `{{#crossLink
   *   "NGTweenable/get:method"}}get(){{/crossLink}}` is used.
   * - __to__ (_Object=_): Ending position.
   * - __duration__ (_number=_): How many milliseconds to animate for.
   * - __delay__ (_delay=_): How many milliseconds to wait before starting the
   *   tween.
   * - __start__ (_Function(Object, *)_): Function to execute when the tween
   *   begins.  Receives the state of the tween as the first parameter and
   *   `attachment` as the second parameter.
   * - __step__ (_Function(Object, *, number)_): Function to execute on every
   *   tick.  Receives `{{#crossLink
   *   "NGTweenable/get:method"}}get(){{/crossLink}}` as the first parameter,
   *   `attachment` as the second parameter, and the time elapsed since the
   *   start of the tween as the third. This function is not called on the
   *   final step of the animation, but `finish` is.
   * - __finish__ (_Function(Object, *)_): Function to execute upon tween
   *   completion.  Receives the state of the tween as the first parameter and
   *   `attachment` as the second parameter.
   * - __easing__ (_Object.<string|Function>|string|Function=_): Easing curve
   *   name(s) or function(s) to use for the tween.
   * - __attachment__ (_*_): Cached value that is passed to the
   *   `step`/`start`/`finish` methods.
   * @chainable
   */
  NGTweenable.prototype.setConfig = function (config) {
    config = config || {};
    this._configured = true;

    // Attach something to this NGTweenable instance (e.g.: a DOM element, an
    // object, a string, etc.);
    this._attachment = config.attachment;

    // Init the internal state
    this._pausedAtTime = null;
    this._scheduleId = null;
    this._delay = config.delay || 0;
    this._start = config.start || noop;
    this._step = config.step || noop;
    this._finish = config.finish || noop;
    this._duration = config.duration || DEFAULT_DURATION;
    this._currentState = shallowCopy({}, config.from || this.get());
    this._originalState = this.get();
    this._targetState = shallowCopy({}, config.to || this.get());

    var self = this;
    this._timeoutHandler = function () {
      timeoutHandler(self,
        self._timestamp,
        self._delay,
        self._duration,
        self._currentState,
        self._originalState,
        self._targetState,
        self._easing,
        self._step,
        self._scheduleFunction
      );
    };

    // Aliases used below
    var currentState = this._currentState;
    var targetState = this._targetState;

    // Ensure that there is always something to tween to.
    defaults(targetState, currentState);

    this._easing = composeEasingObject(
      currentState, config.easing || DEFAULT_EASING);

    this._filterArgs =
      [currentState, this._originalState, targetState, this._easing];

    applyFilter(this, 'tweenCreated');
    return this;
  };

  /**
   * @method get
   * @return {Object} The current state.
   */
  NGTweenable.prototype.get = function () {
    return shallowCopy({}, this._currentState);
  };

  /**
   * @method set
   * @param {Object} state The current state.
   */
  NGTweenable.prototype.set = function (state) {
    this._currentState = state;
  };

  /**
   * Pause a tween.  Paused tweens can be resumed from the point at which they
   * were paused.  This is different from `{{#crossLink
   * "NGTweenable/stop:method"}}{{/crossLink}}`, as that method
   * causes a tween to start over when it is resumed.
   * @method pause
   * @chainable
   */
  NGTweenable.prototype.pause = function () {
    this._pausedAtTime = now();
    this._isPaused = true;
    return this;
  };

  /**
   * Resume a paused tween.
   * @method resume
   * @chainable
   */
  NGTweenable.prototype.resume = function () {
    if (this._isPaused) {
      this._timestamp += now() - this._pausedAtTime;
    }

    this._isPaused = false;
    this._isTweening = true;

    this._timeoutHandler();

    return this;
  };

  /**
   * Move the state of the animation to a specific point in the tween's
   * timeline.  If the animation is not running, this will cause the `step`
   * handlers to be called.
   * @method seek
   * @param {millisecond} millisecond The millisecond of the animation to seek
   * to.  This must not be less than `0`.
   * @chainable
   */
  NGTweenable.prototype.seek = function (millisecond) {
    millisecond = Math.max(millisecond, 0);
    var currentTime = now();

    if ((this._timestamp + millisecond) === 0) {
      return this;
    }

    this._timestamp = currentTime - millisecond;

    if (!this.isPlaying()) {
      this._isTweening = true;
      this._isPaused = false;

      // If the animation is not running, call timeoutHandler to make sure that
      // any step handlers are run.
      timeoutHandler(this,
        this._timestamp,
        this._delay,
        this._duration,
        this._currentState,
        this._originalState,
        this._targetState,
        this._easing,
        this._step,
        this._scheduleFunction,
        currentTime
      );

      this.pause();
    }

    return this;
  };

  /**
   * Stops and cancels a tween.
   * @param {boolean=} gotoEnd If `false` or omitted, the tween just stops at
   * its current state, and the `finish` handler is not invoked.  If `true`,
   * the tweened object's values are instantly set to the target values, and
   * `finish` is invoked.
   * @method stop
   * @chainable
   */
  NGTweenable.prototype.stop = function (gotoEnd) {
    this._isTweening = false;
    this._isPaused = false;
    this._timeoutHandler = noop;

    (root.cancelAnimationFrame            ||
    root.webkitCancelAnimationFrame     ||
    root.oCancelAnimationFrame          ||
    root.msCancelAnimationFrame         ||
    root.mozCancelRequestAnimationFrame ||
    root.clearTimeout)(this._scheduleId);

    if (gotoEnd) {
      applyFilter(this, 'beforeTween');
      tweenProps(
        1,
        this._currentState,
        this._originalState,
        this._targetState,
        1,
        0,
        this._easing
      );
      applyFilter(this, 'afterTween');
      applyFilter(this, 'afterTweenEnd');
      this._finish.call(this, this._currentState, this._attachment);
    }

    return this;
  };

  /**
   * @method isPlaying
   * @return {boolean} Whether or not a tween is running.
   */
  NGTweenable.prototype.isPlaying = function () {
    return this._isTweening && !this._isPaused;
  };

  /**
   * Set a custom schedule function.
   *
   * If a custom function is not set,
   * [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/window.requestAnimationFrame)
   * is used if available, otherwise
   * [`setTimeout`](https://developer.mozilla.org/en-US/docs/Web/API/Window.setTimeout)
   * is used.
   * @method setScheduleFunction
   * @param {Function(Function,number)} scheduleFunction The function to be
   * used to schedule the next frame to be rendered.
   */
  NGTweenable.prototype.setScheduleFunction = function (scheduleFunction) {
    this._scheduleFunction = scheduleFunction;
  };

  /**
   * `delete` all "own" properties.  Call this when the `NGTweenable` instance
   * is no longer needed to free memory.
   * @method dispose
   */
  NGTweenable.prototype.dispose = function () {
    var prop;
    for (prop in this) {
      if (this.hasOwnProperty(prop)) {
        delete this[prop];
      }
    }
  };

  /**
   * Filters are used for transforming the properties of a tween at various
   * points in a NGTweenable's life cycle.  See the README for more info on this.
   * @private
   */
  NGTweenable.prototype.filter = {};

  /**
   * This object contains all of the tweens available to Shifty.  It is
   * extensible - simply attach properties to the `NGTweenable.prototype.formula`
   * Object following the same format as `linear`.
   *
   * `pos` should be a normalized `number` (between 0 and 1).
   * @property formula
   * @type {Object(function)}
   */
  NGTweenable.prototype.formula = {
    linear: function (pos) {
      return pos;
    }
  };

  formula = NGTweenable.prototype.formula;

  shallowCopy(NGTweenable, {
    'now': now
    ,'each': each
    ,'tweenProps': tweenProps
    ,'tweenProp': tweenProp
    ,'applyFilter': applyFilter
    ,'shallowCopy': shallowCopy
    ,'defaults': defaults
    ,'composeEasingObject': composeEasingObject
  });

  // `root` is provided in the intro/outro files.

  // A hook used for unit testing.
  if (typeof SHIFTY_DEBUG_NOW === 'function') {
    root.timeoutHandler = timeoutHandler;
  }

  // Bootstrap NGTweenable appropriately for the environment.
  if (typeof exports === 'object') {
    // CommonJS
    module.exports = NGTweenable;
  } else if (typeof define === 'function' && define.amdDISABLED) {
    // AMD
    define(function () {return NGTweenable;});
  } else if (typeof root.NGTweenable === 'undefined') {
    // Browser: Make `NGTweenable` globally accessible.
    root.NGTweenable = NGTweenable;
  }

  return NGTweenable;

} ());

/*!
 * All equations are adapted from Thomas Fuchs'
 * [Scripty2](https://github.com/madrobby/scripty2/blob/master/src/effects/transitions/penner.js).
 *
 * Based on Easing Equations (c) 2003 [Robert
 * Penner](http://www.robertpenner.com/), all rights reserved. This work is
 * [subject to terms](http://www.robertpenner.com/easing_terms_of_use.html).
 */

/*!
 *  TERMS OF USE - EASING EQUATIONS
 *  Open source under the BSD License.
 *  Easing Equations (c) 2003 Robert Penner, all rights reserved.
 */

;(function () {

  NGTweenable.shallowCopy(NGTweenable.prototype.formula, {
    easeInQuad: function (pos) {
      return Math.pow(pos, 2);
    },

    easeOutQuad: function (pos) {
      return -(Math.pow((pos - 1), 2) - 1);
    },

    easeInOutQuad: function (pos) {
      if ((pos /= 0.5) < 1) {return 0.5 * Math.pow(pos,2);}
      return -0.5 * ((pos -= 2) * pos - 2);
    },

    easeInCubic: function (pos) {
      return Math.pow(pos, 3);
    },

    easeOutCubic: function (pos) {
      return (Math.pow((pos - 1), 3) + 1);
    },

    easeInOutCubic: function (pos) {
      if ((pos /= 0.5) < 1) {return 0.5 * Math.pow(pos,3);}
      return 0.5 * (Math.pow((pos - 2),3) + 2);
    },

    easeInQuart: function (pos) {
      return Math.pow(pos, 4);
    },

    easeOutQuart: function (pos) {
      return -(Math.pow((pos - 1), 4) - 1);
    },

    easeInOutQuart: function (pos) {
      if ((pos /= 0.5) < 1) {return 0.5 * Math.pow(pos,4);}
      return -0.5 * ((pos -= 2) * Math.pow(pos,3) - 2);
    },

    easeInQuint: function (pos) {
      return Math.pow(pos, 5);
    },

    easeOutQuint: function (pos) {
      return (Math.pow((pos - 1), 5) + 1);
    },

    easeInOutQuint: function (pos) {
      if ((pos /= 0.5) < 1) {return 0.5 * Math.pow(pos,5);}
      return 0.5 * (Math.pow((pos - 2),5) + 2);
    },

    easeInSine: function (pos) {
      return -Math.cos(pos * (Math.PI / 2)) + 1;
    },

    easeOutSine: function (pos) {
      return Math.sin(pos * (Math.PI / 2));
    },

    easeInOutSine: function (pos) {
      return (-0.5 * (Math.cos(Math.PI * pos) - 1));
    },

    easeInExpo: function (pos) {
      return (pos === 0) ? 0 : Math.pow(2, 10 * (pos - 1));
    },

    easeOutExpo: function (pos) {
      return (pos === 1) ? 1 : -Math.pow(2, -10 * pos) + 1;
    },

    easeInOutExpo: function (pos) {
      if (pos === 0) {return 0;}
      if (pos === 1) {return 1;}
      if ((pos /= 0.5) < 1) {return 0.5 * Math.pow(2,10 * (pos - 1));}
      return 0.5 * (-Math.pow(2, -10 * --pos) + 2);
    },

    easeInCirc: function (pos) {
      return -(Math.sqrt(1 - (pos * pos)) - 1);
    },

    easeOutCirc: function (pos) {
      return Math.sqrt(1 - Math.pow((pos - 1), 2));
    },

    easeInOutCirc: function (pos) {
      if ((pos /= 0.5) < 1) {return -0.5 * (Math.sqrt(1 - pos * pos) - 1);}
      return 0.5 * (Math.sqrt(1 - (pos -= 2) * pos) + 1);
    },

    easeOutBounce: function (pos) {
      if ((pos) < (1 / 2.75)) {
        return (7.5625 * pos * pos);
      } else if (pos < (2 / 2.75)) {
        return (7.5625 * (pos -= (1.5 / 2.75)) * pos + 0.75);
      } else if (pos < (2.5 / 2.75)) {
        return (7.5625 * (pos -= (2.25 / 2.75)) * pos + 0.9375);
      } else {
        return (7.5625 * (pos -= (2.625 / 2.75)) * pos + 0.984375);
      }
    },

    easeInBack: function (pos) {
      var s = 1.70158;
      return (pos) * pos * ((s + 1) * pos - s);
    },

    easeOutBack: function (pos) {
      var s = 1.70158;
      return (pos = pos - 1) * pos * ((s + 1) * pos + s) + 1;
    },

    easeInOutBack: function (pos) {
      var s = 1.70158;
      if ((pos /= 0.5) < 1) {
        return 0.5 * (pos * pos * (((s *= (1.525)) + 1) * pos - s));
      }
      return 0.5 * ((pos -= 2) * pos * (((s *= (1.525)) + 1) * pos + s) + 2);
    },

    elastic: function (pos) {
      // jshint maxlen:90
      return -1 * Math.pow(4,-8 * pos) * Math.sin((pos * 6 - 1) * (2 * Math.PI) / 2) + 1;
    },

    swingFromTo: function (pos) {
      var s = 1.70158;
      return ((pos /= 0.5) < 1) ?
          0.5 * (pos * pos * (((s *= (1.525)) + 1) * pos - s)) :
          0.5 * ((pos -= 2) * pos * (((s *= (1.525)) + 1) * pos + s) + 2);
    },

    swingFrom: function (pos) {
      var s = 1.70158;
      return pos * pos * ((s + 1) * pos - s);
    },

    swingTo: function (pos) {
      var s = 1.70158;
      return (pos -= 1) * pos * ((s + 1) * pos + s) + 1;
    },

    bounce: function (pos) {
      if (pos < (1 / 2.75)) {
        return (7.5625 * pos * pos);
      } else if (pos < (2 / 2.75)) {
        return (7.5625 * (pos -= (1.5 / 2.75)) * pos + 0.75);
      } else if (pos < (2.5 / 2.75)) {
        return (7.5625 * (pos -= (2.25 / 2.75)) * pos + 0.9375);
      } else {
        return (7.5625 * (pos -= (2.625 / 2.75)) * pos + 0.984375);
      }
    },

    bouncePast: function (pos) {
      if (pos < (1 / 2.75)) {
        return (7.5625 * pos * pos);
      } else if (pos < (2 / 2.75)) {
        return 2 - (7.5625 * (pos -= (1.5 / 2.75)) * pos + 0.75);
      } else if (pos < (2.5 / 2.75)) {
        return 2 - (7.5625 * (pos -= (2.25 / 2.75)) * pos + 0.9375);
      } else {
        return 2 - (7.5625 * (pos -= (2.625 / 2.75)) * pos + 0.984375);
      }
    },

    easeFromTo: function (pos) {
      if ((pos /= 0.5) < 1) {return 0.5 * Math.pow(pos,4);}
      return -0.5 * ((pos -= 2) * Math.pow(pos,3) - 2);
    },

    easeFrom: function (pos) {
      return Math.pow(pos,4);
    },

    easeTo: function (pos) {
      return Math.pow(pos,0.25);
    }
  });

}());

// jshint maxlen:100
/**
 * The Bezier magic in this file is adapted/copied almost wholesale from
 * [Scripty2](https://github.com/madrobby/scripty2/blob/master/src/effects/transitions/cubic-bezier.js),
 * which was adapted from Apple code (which probably came from
 * [here](http://opensource.apple.com/source/WebCore/WebCore-955.66/platform/graphics/UnitBezier.h)).
 * Special thanks to Apple and Thomas Fuchs for much of this code.
 */

/**
 *  Copyright (c) 2006 Apple Computer, Inc. All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are met:
 *
 *  1. Redistributions of source code must retain the above copyright notice,
 *  this list of conditions and the following disclaimer.
 *
 *  2. Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation
 *  and/or other materials provided with the distribution.
 *
 *  3. Neither the name of the copyright holder(s) nor the names of any
 *  contributors may be used to endorse or promote products derived from
 *  this software without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 *  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 *  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 *  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 *  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 *  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 *  SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 *  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 *  CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
;(function () {
  // port of webkit cubic bezier handling by http://www.netzgesta.de/dev/
  function cubicBezierAtTime(t,p1x,p1y,p2x,p2y,duration) {
    var ax = 0,bx = 0,cx = 0,ay = 0,by = 0,cy = 0;
    function sampleCurveX(t) {
      return ((ax * t + bx) * t + cx) * t;
    }
    function sampleCurveY(t) {
      return ((ay * t + by) * t + cy) * t;
    }
    function sampleCurveDerivativeX(t) {
      return (3.0 * ax * t + 2.0 * bx) * t + cx;
    }
    function solveEpsilon(duration) {
      return 1.0 / (200.0 * duration);
    }
    function solve(x,epsilon) {
      return sampleCurveY(solveCurveX(x, epsilon));
    }
    function fabs(n) {
      if (n >= 0) {
        return n;
      } else {
        return 0 - n;
      }
    }
    function solveCurveX(x, epsilon) {
      var t0,t1,t2,x2,d2,i;
      for (t2 = x, i = 0; i < 8; i++) {
        x2 = sampleCurveX(t2) - x;
        if (fabs(x2) < epsilon) {
          return t2;
        }
        d2 = sampleCurveDerivativeX(t2);
        if (fabs(d2) < 1e-6) {
          break;
        }
        t2 = t2 - x2 / d2;
      }
      t0 = 0.0;
      t1 = 1.0;
      t2 = x;
      if (t2 < t0) {
        return t0;
      }
      if (t2 > t1) {
        return t1;
      }
      while (t0 < t1) {
        x2 = sampleCurveX(t2);
        if (fabs(x2 - x) < epsilon) {
          return t2;
        }
        if (x > x2) {
          t0 = t2;
        }else {
          t1 = t2;
        }
        t2 = (t1 - t0) * 0.5 + t0;
      }
      return t2; // Failure.
    }
    cx = 3.0 * p1x;
    bx = 3.0 * (p2x - p1x) - cx;
    ax = 1.0 - cx - bx;
    cy = 3.0 * p1y;
    by = 3.0 * (p2y - p1y) - cy;
    ay = 1.0 - cy - by;
    return solve(t, solveEpsilon(duration));
  }
  /**
   *  getCubicBezierTransition(x1, y1, x2, y2) -> Function
   *
   *  Generates a transition easing function that is compatible
   *  with WebKit's CSS transitions `-webkit-transition-timing-function`
   *  CSS property.
   *
   *  The W3C has more information about CSS3 transition timing functions:
   *  http://www.w3.org/TR/css3-transitions/#transition-timing-function_tag
   *
   *  @param {number} x1
   *  @param {number} y1
   *  @param {number} x2
   *  @param {number} y2
   *  @return {function}
   *  @private
   */
  function getCubicBezierTransition (x1, y1, x2, y2) {
    return function (pos) {
      return cubicBezierAtTime(pos,x1,y1,x2,y2,1);
    };
  }
  // End ported code

  /**
   * Create a Bezier easing function and attach it to `{{#crossLink
   * "NGTweenable/formula:property"}}NGTweenable#formula{{/crossLink}}`.  This
   * function gives you total control over the easing curve.  Matthew Lein's
   * [Ceaser](http://matthewlein.com/ceaser/) is a useful tool for visualizing
   * the curves you can make with this function.
   * @method setBezierFunction
   * @param {string} name The name of the easing curve.  Overwrites the old
   * easing function on `{{#crossLink
   * "NGTweenable/formula:property"}}NGTweenable#formula{{/crossLink}}` if it
   * exists.
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @return {function} The easing function that was attached to
   * NGTweenable.prototype.formula.
   */
  NGTweenable.setBezierFunction = function (name, x1, y1, x2, y2) {
    var cubicBezierTransition = getCubicBezierTransition(x1, y1, x2, y2);
    cubicBezierTransition.displayName = name;
    cubicBezierTransition.x1 = x1;
    cubicBezierTransition.y1 = y1;
    cubicBezierTransition.x2 = x2;
    cubicBezierTransition.y2 = y2;

    return NGTweenable.prototype.formula[name] = cubicBezierTransition;
  };


  /**
   * `delete` an easing function from `{{#crossLink
   * "NGTweenable/formula:property"}}NGTweenable#formula{{/crossLink}}`.  Be
   * careful with this method, as it `delete`s whatever easing formula matches
   * `name` (which means you can delete standard Shifty easing functions).
   * @method unsetBezierFunction
   * @param {string} name The name of the easing function to delete.
   * @return {function}
   */
  NGTweenable.unsetBezierFunction = function (name) {
    delete NGTweenable.prototype.formula[name];
  };

})();

;(function () {

  function getInterpolatedValues (
    from, current, targetState, position, easing, delay) {
    return NGTweenable.tweenProps(
      position, current, from, targetState, 1, delay, easing);
  }

  // Fake a NGTweenable and patch some internals.  This approach allows us to
  // skip uneccessary processing and object recreation, cutting down on garbage
  // collection pauses.
  var mockNGTweenable = new NGTweenable();
  mockNGTweenable._filterArgs = [];

  /**
   * Compute the midpoint of two Objects.  This method effectively calculates a
   * specific frame of animation that `{{#crossLink
   * "NGTweenable/tween:method"}}{{/crossLink}}` does many times over the course
   * of a full tween.
   *
   *     var interpolatedValues = NGTweenable.interpolate({
   *       width: '100px',
   *       opacity: 0,
   *       color: '#fff'
   *     }, {
   *       width: '200px',
   *       opacity: 1,
   *       color: '#000'
   *     }, 0.5);
   *
   *     console.log(interpolatedValues);
   *     // {opacity: 0.5, width: "150px", color: "rgb(127,127,127)"}
   *
   * @static
   * @method interpolate
   * @param {Object} from The starting values to tween from.
   * @param {Object} targetState The ending values to tween to.
   * @param {number} position The normalized position value (between `0.0` and
   * `1.0`) to interpolate the values between `from` and `to` for.  `from`
   * represents `0` and `to` represents `1`.
   * @param {Object.<string|Function>|string|Function} easing The easing
   * curve(s) to calculate the midpoint against.  You can reference any easing
   * function attached to `NGTweenable.prototype.formula`, or provide the easing
   * function(s) directly.  If omitted, this defaults to "linear".
   * @param {number=} opt_delay Optional delay to pad the beginning of the
   * interpolated tween with.  This increases the range of `position` from (`0`
   * through `1`) to (`0` through `1 + opt_delay`).  So, a delay of `0.5` would
   * increase all valid values of `position` to numbers between `0` and `1.5`.
   * @return {Object}
   */
  NGTweenable.interpolate = function (
    from, targetState, position, easing, opt_delay) {

    var current = NGTweenable.shallowCopy({}, from);
    var delay = opt_delay || 0;
    var easingObject = NGTweenable.composeEasingObject(
      from, easing || 'linear');

    mockNGTweenable.set({});

    // Alias and reuse the _filterArgs array instead of recreating it.
    var filterArgs = mockNGTweenable._filterArgs;
    filterArgs.length = 0;
    filterArgs[0] = current;
    filterArgs[1] = from;
    filterArgs[2] = targetState;
    filterArgs[3] = easingObject;

    // Any defined value transformation must be applied
    NGTweenable.applyFilter(mockNGTweenable, 'tweenCreated');
    NGTweenable.applyFilter(mockNGTweenable, 'beforeTween');

    var interpolatedValues = getInterpolatedValues(
      from, current, targetState, position, easingObject, delay);

    // Transform values back into their original format
    NGTweenable.applyFilter(mockNGTweenable, 'afterTween');

    return interpolatedValues;
  };

}());

/**
 * This module adds string interpolation support to Shifty.
 *
 * The Token extension allows Shifty to tween numbers inside of strings.  Among
 * other things, this allows you to animate CSS properties.  For example, you
 * can do this:
 *
 *     var tweenable = new NGTweenable();
 *     tweenable.tween({
 *       from: { transform: 'translateX(45px)' },
 *       to: { transform: 'translateX(90xp)' }
 *     });
 *
 * `translateX(45)` will be tweened to `translateX(90)`.  To demonstrate:
 *
 *     var tweenable = new NGTweenable();
 *     tweenable.tween({
 *       from: { transform: 'translateX(45px)' },
 *       to: { transform: 'translateX(90px)' },
 *       step: function (state) {
 *         console.log(state.transform);
 *       }
 *     });
 *
 * The above snippet will log something like this in the console:
 *
 *     translateX(60.3px)
 *     ...
 *     translateX(76.05px)
 *     ...
 *     translateX(90px)
 *
 * Another use for this is animating colors:
 *
 *     var tweenable = new NGTweenable();
 *     tweenable.tween({
 *       from: { color: 'rgb(0,255,0)' },
 *       to: { color: 'rgb(255,0,255)' },
 *       step: function (state) {
 *         console.log(state.color);
 *       }
 *     });
 *
 * The above snippet will log something like this:
 *
 *     rgb(84,170,84)
 *     ...
 *     rgb(170,84,170)
 *     ...
 *     rgb(255,0,255)
 *
 * This extension also supports hexadecimal colors, in both long (`#ff00ff`)
 * and short (`#f0f`) forms.  Be aware that hexadecimal input values will be
 * converted into the equivalent RGB output values.  This is done to optimize
 * for performance.
 *
 *     var tweenable = new NGTweenable();
 *     tweenable.tween({
 *       from: { color: '#0f0' },
 *       to: { color: '#f0f' },
 *       step: function (state) {
 *         console.log(state.color);
 *       }
 *     });
 *
 * This snippet will generate the same output as the one before it because
 * equivalent values were supplied (just in hexadecimal form rather than RGB):
 *
 *     rgb(84,170,84)
 *     ...
 *     rgb(170,84,170)
 *     ...
 *     rgb(255,0,255)
 *
 * ## Easing support
 *
 * Easing works somewhat differently in the Token extension.  This is because
 * some CSS properties have multiple values in them, and you might need to
 * tween each value along its own easing curve.  A basic example:
 *
 *     var tweenable = new NGTweenable();
 *     tweenable.tween({
 *       from: { transform: 'translateX(0px) translateY(0px)' },
 *       to: { transform:   'translateX(100px) translateY(100px)' },
 *       easing: { transform: 'easeInQuad' },
 *       step: function (state) {
 *         console.log(state.transform);
 *       }
 *     });
 *
 * The above snippet will create values like this:
 *
 *     translateX(11.56px) translateY(11.56px)
 *     ...
 *     translateX(46.24px) translateY(46.24px)
 *     ...
 *     translateX(100px) translateY(100px)
 *
 * In this case, the values for `translateX` and `translateY` are always the
 * same for each step of the tween, because they have the same start and end
 * points and both use the same easing curve.  We can also tween `translateX`
 * and `translateY` along independent curves:
 *
 *     var tweenable = new NGTweenable();
 *     tweenable.tween({
 *       from: { transform: 'translateX(0px) translateY(0px)' },
 *       to: { transform:   'translateX(100px) translateY(100px)' },
 *       easing: { transform: 'easeInQuad bounce' },
 *       step: function (state) {
 *         console.log(state.transform);
 *       }
 *     });
 *
 * The above snippet will create values like this:
 *
 *     translateX(10.89px) translateY(82.35px)
 *     ...
 *     translateX(44.89px) translateY(86.73px)
 *     ...
 *     translateX(100px) translateY(100px)
 *
 * `translateX` and `translateY` are not in sync anymore, because `easeInQuad`
 * was specified for `translateX` and `bounce` for `translateY`.  Mixing and
 * matching easing curves can make for some interesting motion in your
 * animations.
 *
 * The order of the space-separated easing curves correspond the token values
 * they apply to.  If there are more token values than easing curves listed,
 * the last easing curve listed is used.
 * @submodule NGTweenable.token
 */

// token function is defined above only so that dox-foundation sees it as
// documentation and renders it.  It is never used, and is optimized away at
// build time.

;(function (NGTweenable) {

  /**
   * @typedef {{
   *   formatString: string
   *   chunkNames: Array.<string>
   * }}
   * @private
   */
  var formatManifest;

  // CONSTANTS

  var R_NUMBER_COMPONENT = /(\d|\-|\.)/;
  var R_FORMAT_CHUNKS = /([^\-0-9\.]+)/g;
  var R_UNFORMATTED_VALUES = /[0-9.\-]+/g;
  var R_RGB = new RegExp(
    'rgb\\(' + R_UNFORMATTED_VALUES.source +
    (/,\s*/.source) + R_UNFORMATTED_VALUES.source +
    (/,\s*/.source) + R_UNFORMATTED_VALUES.source + '\\)', 'g');
  var R_RGB_PREFIX = /^.*\(/;
  var R_HEX = /#([0-9]|[a-f]){3,6}/gi;
  var VALUE_PLACEHOLDER = 'VAL';

  // HELPERS

  /**
   * @param {Array.number} rawValues
   * @param {string} prefix
   *
   * @return {Array.<string>}
   * @private
   */
  function getFormatChunksFrom (rawValues, prefix) {
    var accumulator = [];

    var rawValuesLength = rawValues.length;
    var i;

    for (i = 0; i < rawValuesLength; i++) {
      accumulator.push('_' + prefix + '_' + i);
    }

    return accumulator;
  }

  /**
   * @param {string} formattedString
   *
   * @return {string}
   * @private
   */
  function getFormatStringFrom (formattedString) {
    var chunks = formattedString.match(R_FORMAT_CHUNKS);

    if (!chunks) {
      // chunks will be null if there were no tokens to parse in
      // formattedString (for example, if formattedString is '2').  Coerce
      // chunks to be useful here.
      chunks = ['', ''];

      // If there is only one chunk, assume that the string is a number
      // followed by a token...
      // NOTE: This may be an unwise assumption.
    } else if (chunks.length === 1 ||
      // ...or if the string starts with a number component (".", "-", or a
      // digit)...
    formattedString.charAt(0).match(R_NUMBER_COMPONENT)) {
      // ...prepend an empty string here to make sure that the formatted number
      // is properly replaced by VALUE_PLACEHOLDER
      chunks.unshift('');
    }

    return chunks.join(VALUE_PLACEHOLDER);
  }

  /**
   * Convert all hex color values within a string to an rgb string.
   *
   * @param {Object} stateObject
   *
   * @return {Object} The modified obj
   * @private
   */
  function sanitizeObjectForHexProps (stateObject) {
    NGTweenable.each(stateObject, function (prop) {
      var currentProp = stateObject[prop];

      if (typeof currentProp === 'string' && currentProp.match(R_HEX)) {
        stateObject[prop] = sanitizeHexChunksToRGB(currentProp);
      }
    });
  }

  /**
   * @param {string} str
   *
   * @return {string}
   * @private
   */
  function  sanitizeHexChunksToRGB (str) {
    return filterStringChunks(R_HEX, str, convertHexToRGB);
  }

  /**
   * @param {string} hexString
   *
   * @return {string}
   * @private
   */
  function convertHexToRGB (hexString) {
    var rgbArr = hexToRGBArray(hexString);
    return 'rgb(' + rgbArr[0] + ',' + rgbArr[1] + ',' + rgbArr[2] + ')';
  }

  var hexToRGBArray_returnArray = [];
  /**
   * Convert a hexadecimal string to an array with three items, one each for
   * the red, blue, and green decimal values.
   *
   * @param {string} hex A hexadecimal string.
   *
   * @returns {Array.<number>} The converted Array of RGB values if `hex` is a
   * valid string, or an Array of three 0's.
   * @private
   */
  function hexToRGBArray (hex) {

    hex = hex.replace(/#/, '');

    // If the string is a shorthand three digit hex notation, normalize it to
    // the standard six digit notation
    if (hex.length === 3) {
      hex = hex.split('');
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    hexToRGBArray_returnArray[0] = hexToDec(hex.substr(0, 2));
    hexToRGBArray_returnArray[1] = hexToDec(hex.substr(2, 2));
    hexToRGBArray_returnArray[2] = hexToDec(hex.substr(4, 2));

    return hexToRGBArray_returnArray;
  }

  /**
   * Convert a base-16 number to base-10.
   *
   * @param {Number|String} hex The value to convert
   *
   * @returns {Number} The base-10 equivalent of `hex`.
   * @private
   */
  function hexToDec (hex) {
    return parseInt(hex, 16);
  }

  /**
   * Runs a filter operation on all chunks of a string that match a RegExp
   *
   * @param {RegExp} pattern
   * @param {string} unfilteredString
   * @param {function(string)} filter
   *
   * @return {string}
   * @private
   */
  function filterStringChunks (pattern, unfilteredString, filter) {
    var pattenMatches = unfilteredString.match(pattern);
    var filteredString = unfilteredString.replace(pattern, VALUE_PLACEHOLDER);

    if (pattenMatches) {
      var pattenMatchesLength = pattenMatches.length;
      var currentChunk;

      for (var i = 0; i < pattenMatchesLength; i++) {
        currentChunk = pattenMatches.shift();
        filteredString = filteredString.replace(
          VALUE_PLACEHOLDER, filter(currentChunk));
      }
    }

    return filteredString;
  }

  /**
   * Check for floating point values within rgb strings and rounds them.
   *
   * @param {string} formattedString
   *
   * @return {string}
   * @private
   */
  function sanitizeRGBChunks (formattedString) {
    return filterStringChunks(R_RGB, formattedString, sanitizeRGBChunk);
  }

  /**
   * @param {string} rgbChunk
   *
   * @return {string}
   * @private
   */
  function sanitizeRGBChunk (rgbChunk) {
    var numbers = rgbChunk.match(R_UNFORMATTED_VALUES);
    var numbersLength = numbers.length;
    var sanitizedString = rgbChunk.match(R_RGB_PREFIX)[0];

    for (var i = 0; i < numbersLength; i++) {
      sanitizedString += parseInt(numbers[i], 10) + ',';
    }

    sanitizedString = sanitizedString.slice(0, -1) + ')';

    return sanitizedString;
  }

  /**
   * @param {Object} stateObject
   *
   * @return {Object} An Object of formatManifests that correspond to
   * the string properties of stateObject
   * @private
   */
  function getFormatManifests (stateObject) {
    var manifestAccumulator = {};

    NGTweenable.each(stateObject, function (prop) {
      var currentProp = stateObject[prop];

      if (typeof currentProp === 'string') {
        var rawValues = getValuesFrom(currentProp);

        manifestAccumulator[prop] = {
          'formatString': getFormatStringFrom(currentProp)
          ,'chunkNames': getFormatChunksFrom(rawValues, prop)
        };
      }
    });

    return manifestAccumulator;
  }

  /**
   * @param {Object} stateObject
   * @param {Object} formatManifests
   * @private
   */
  function expandFormattedProperties (stateObject, formatManifests) {
    NGTweenable.each(formatManifests, function (prop) {
      var currentProp = stateObject[prop];
      var rawValues = getValuesFrom(currentProp);
      var rawValuesLength = rawValues.length;

      for (var i = 0; i < rawValuesLength; i++) {
        stateObject[formatManifests[prop].chunkNames[i]] = +rawValues[i];
      }

      delete stateObject[prop];
    });
  }

  /**
   * @param {Object} stateObject
   * @param {Object} formatManifests
   * @private
   */
  function collapseFormattedProperties (stateObject, formatManifests) {
    NGTweenable.each(formatManifests, function (prop) {
      var currentProp = stateObject[prop];
      var formatChunks = extractPropertyChunks(
        stateObject, formatManifests[prop].chunkNames);
      var valuesList = getValuesList(
        formatChunks, formatManifests[prop].chunkNames);
      currentProp = getFormattedValues(
        formatManifests[prop].formatString, valuesList);
      stateObject[prop] = sanitizeRGBChunks(currentProp);
    });
  }

  /**
   * @param {Object} stateObject
   * @param {Array.<string>} chunkNames
   *
   * @return {Object} The extracted value chunks.
   * @private
   */
  function extractPropertyChunks (stateObject, chunkNames) {
    var extractedValues = {};
    var currentChunkName, chunkNamesLength = chunkNames.length;

    for (var i = 0; i < chunkNamesLength; i++) {
      currentChunkName = chunkNames[i];
      extractedValues[currentChunkName] = stateObject[currentChunkName];
      delete stateObject[currentChunkName];
    }

    return extractedValues;
  }

  var getValuesList_accumulator = [];
  /**
   * @param {Object} stateObject
   * @param {Array.<string>} chunkNames
   *
   * @return {Array.<number>}
   * @private
   */
  function getValuesList (stateObject, chunkNames) {
    getValuesList_accumulator.length = 0;
    var chunkNamesLength = chunkNames.length;

    for (var i = 0; i < chunkNamesLength; i++) {
      getValuesList_accumulator.push(stateObject[chunkNames[i]]);
    }

    return getValuesList_accumulator;
  }

  /**
   * @param {string} formatString
   * @param {Array.<number>} rawValues
   *
   * @return {string}
   * @private
   */
  function getFormattedValues (formatString, rawValues) {
    var formattedValueString = formatString;
    var rawValuesLength = rawValues.length;

    for (var i = 0; i < rawValuesLength; i++) {
      formattedValueString = formattedValueString.replace(
        VALUE_PLACEHOLDER, +rawValues[i].toFixed(4));
    }

    return formattedValueString;
  }

  /**
   * Note: It's the duty of the caller to convert the Array elements of the
   * return value into numbers.  This is a performance optimization.
   *
   * @param {string} formattedString
   *
   * @return {Array.<string>|null}
   * @private
   */
  function getValuesFrom (formattedString) {
    return formattedString.match(R_UNFORMATTED_VALUES);
  }

  /**
   * @param {Object} easingObject
   * @param {Object} tokenData
   * @private
   */
  function expandEasingObject (easingObject, tokenData) {
    NGTweenable.each(tokenData, function (prop) {
      var currentProp = tokenData[prop];
      var chunkNames = currentProp.chunkNames;
      var chunkLength = chunkNames.length;

      var easing = easingObject[prop];
      var i;

      if (typeof easing === 'string') {
        var easingChunks = easing.split(' ');
        var lastEasingChunk = easingChunks[easingChunks.length - 1];

        for (i = 0; i < chunkLength; i++) {
          easingObject[chunkNames[i]] = easingChunks[i] || lastEasingChunk;
        }

      } else {
        for (i = 0; i < chunkLength; i++) {
          easingObject[chunkNames[i]] = easing;
        }
      }

      delete easingObject[prop];
    });
  }

  /**
   * @param {Object} easingObject
   * @param {Object} tokenData
   * @private
   */
  function collapseEasingObject (easingObject, tokenData) {
    NGTweenable.each(tokenData, function (prop) {
      var currentProp = tokenData[prop];
      var chunkNames = currentProp.chunkNames;
      var chunkLength = chunkNames.length;

      var firstEasing = easingObject[chunkNames[0]];
      var typeofEasings = typeof firstEasing;

      if (typeofEasings === 'string') {
        var composedEasingString = '';

        for (var i = 0; i < chunkLength; i++) {
          composedEasingString += ' ' + easingObject[chunkNames[i]];
          delete easingObject[chunkNames[i]];
        }

        easingObject[prop] = composedEasingString.substr(1);
      } else {
        easingObject[prop] = firstEasing;
      }
    });
  }

  NGTweenable.prototype.filter.token = {
    'tweenCreated': function (currentState, fromState, toState, easingObject) {
      sanitizeObjectForHexProps(currentState);
      sanitizeObjectForHexProps(fromState);
      sanitizeObjectForHexProps(toState);
      this._tokenData = getFormatManifests(currentState);
    },

    'beforeTween': function (currentState, fromState, toState, easingObject) {
      expandEasingObject(easingObject, this._tokenData);
      expandFormattedProperties(currentState, this._tokenData);
      expandFormattedProperties(fromState, this._tokenData);
      expandFormattedProperties(toState, this._tokenData);
    },

    'afterTween': function (currentState, fromState, toState, easingObject) {
      collapseFormattedProperties(currentState, this._tokenData);
      collapseFormattedProperties(fromState, this._tokenData);
      collapseFormattedProperties(toState, this._tokenData);
      collapseEasingObject(easingObject, this._tokenData);
    }
  };

} (NGTweenable));

}).call(null);

//##########################################################################################################################
//##########################################################################################################################
//##########################################################################################################################
//##########################################################################################################################
//##########################################################################################################################

// HAMMER.JS

// NGY BUILD:
// replace "Hammer" with "NGHammer" (case sensitive)
// replace "var SUPPORT_POINTER_EVENTS = prefixed(window, 'PointerEvent') !== undefined;" with "var SUPPORT_POINTER_EVENTS = false;"



/*! NGHammer.JS - v2.0.7 - 2016-04-22
 * http://hammerjs.github.io/
 *
 * Copyright (c) 2016 Jorik Tangelder;
 * Licensed under the MIT license */
(function(window, document, exportName, undefined) {
  'use strict';

var VENDOR_PREFIXES = ['', 'webkit', 'Moz', 'MS', 'ms', 'o'];
var TEST_ELEMENT = document.createElement('div');

var TYPE_FUNCTION = 'function';

var round = Math.round;
var abs = Math.abs;
var now = Date.now;

/**
 * set a timeout with a given scope
 * @param {Function} fn
 * @param {Number} timeout
 * @param {Object} context
 * @returns {number}
 */
function setTimeoutContext(fn, timeout, context) {
    return setTimeout(bindFn(fn, context), timeout);
}

/**
 * if the argument is an array, we want to execute the fn on each entry
 * if it aint an array we don't want to do a thing.
 * this is used by all the methods that accept a single and array argument.
 * @param {*|Array} arg
 * @param {String} fn
 * @param {Object} [context]
 * @returns {Boolean}
 */
function invokeArrayArg(arg, fn, context) {
    if (Array.isArray(arg)) {
        each(arg, context[fn], context);
        return true;
    }
    return false;
}

/**
 * walk objects and arrays
 * @param {Object} obj
 * @param {Function} iterator
 * @param {Object} context
 */
function each(obj, iterator, context) {
    var i;

    if (!obj) {
        return;
    }

    if (obj.forEach) {
        obj.forEach(iterator, context);
    } else if (obj.length !== undefined) {
        i = 0;
        while (i < obj.length) {
            iterator.call(context, obj[i], i, obj);
            i++;
        }
    } else {
        for (i in obj) {
            obj.hasOwnProperty(i) && iterator.call(context, obj[i], i, obj);
        }
    }
}

/**
 * wrap a method with a deprecation warning and stack trace
 * @param {Function} method
 * @param {String} name
 * @param {String} message
 * @returns {Function} A new function wrapping the supplied method.
 */
function deprecate(method, name, message) {
    var deprecationMessage = 'DEPRECATED METHOD: ' + name + '\n' + message + ' AT \n';
    return function() {
        var e = new Error('get-stack-trace');
        var stack = e && e.stack ? e.stack.replace(/^[^\(]+?[\n$]/gm, '')
            .replace(/^\s+at\s+/gm, '')
            .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@') : 'Unknown Stack Trace';

        var log = window.console && (window.console.warn || window.console.log);
        if (log) {
            log.call(window.console, deprecationMessage, stack);
        }
        return method.apply(this, arguments);
    };
}

/**
 * extend object.
 * means that properties in dest will be overwritten by the ones in src.
 * @param {Object} target
 * @param {...Object} objects_to_assign
 * @returns {Object} target
 */
var assign;
if (typeof Object.assign !== 'function') {
    assign = function assign(target) {
        if (target === undefined || target === null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }

        var output = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var source = arguments[index];
            if (source !== undefined && source !== null) {
                for (var nextKey in source) {
                    if (source.hasOwnProperty(nextKey)) {
                        output[nextKey] = source[nextKey];
                    }
                }
            }
        }
        return output;
    };
} else {
    assign = Object.assign;
}

/**
 * extend object.
 * means that properties in dest will be overwritten by the ones in src.
 * @param {Object} dest
 * @param {Object} src
 * @param {Boolean} [merge=false]
 * @returns {Object} dest
 */
var extend = deprecate(function extend(dest, src, merge) {
    var keys = Object.keys(src);
    var i = 0;
    while (i < keys.length) {
        if (!merge || (merge && dest[keys[i]] === undefined)) {
            dest[keys[i]] = src[keys[i]];
        }
        i++;
    }
    return dest;
}, 'extend', 'Use `assign`.');

/**
 * merge the values from src in the dest.
 * means that properties that exist in dest will not be overwritten by src
 * @param {Object} dest
 * @param {Object} src
 * @returns {Object} dest
 */
var merge = deprecate(function merge(dest, src) {
    return extend(dest, src, true);
}, 'merge', 'Use `assign`.');

/**
 * simple class inheritance
 * @param {Function} child
 * @param {Function} base
 * @param {Object} [properties]
 */
function inherit(child, base, properties) {
    var baseP = base.prototype,
        childP;

    childP = child.prototype = Object.create(baseP);
    childP.constructor = child;
    childP._super = baseP;

    if (properties) {
        assign(childP, properties);
    }
}

/**
 * simple function bind
 * @param {Function} fn
 * @param {Object} context
 * @returns {Function}
 */
function bindFn(fn, context) {
    return function boundFn() {
        return fn.apply(context, arguments);
    };
}

/**
 * let a boolean value also be a function that must return a boolean
 * this first item in args will be used as the context
 * @param {Boolean|Function} val
 * @param {Array} [args]
 * @returns {Boolean}
 */
function boolOrFn(val, args) {
    if (typeof val == TYPE_FUNCTION) {
        return val.apply(args ? args[0] || undefined : undefined, args);
    }
    return val;
}

/**
 * use the val2 when val1 is undefined
 * @param {*} val1
 * @param {*} val2
 * @returns {*}
 */
function ifUndefined(val1, val2) {
    return (val1 === undefined) ? val2 : val1;
}

/**
 * addEventListener with multiple events at once
 * @param {EventTarget} target
 * @param {String} types
 * @param {Function} handler
 */
function addEventListeners(target, types, handler) {
    each(splitStr(types), function(type) {
        target.addEventListener(type, handler, false);
    });
}

/**
 * removeEventListener with multiple events at once
 * @param {EventTarget} target
 * @param {String} types
 * @param {Function} handler
 */
function removeEventListeners(target, types, handler) {
    each(splitStr(types), function(type) {
        target.removeEventListener(type, handler, false);
    });
}

/**
 * find if a node is in the given parent
 * @method hasParent
 * @param {HTMLElement} node
 * @param {HTMLElement} parent
 * @return {Boolean} found
 */
function hasParent(node, parent) {
    while (node) {
        if (node == parent) {
            return true;
        }
        node = node.parentNode;
    }
    return false;
}

/**
 * small indexOf wrapper
 * @param {String} str
 * @param {String} find
 * @returns {Boolean} found
 */
function inStr(str, find) {
    return str.indexOf(find) > -1;
}

/**
 * split string on whitespace
 * @param {String} str
 * @returns {Array} words
 */
function splitStr(str) {
    return str.trim().split(/\s+/g);
}

/**
 * find if a array contains the object using indexOf or a simple polyFill
 * @param {Array} src
 * @param {String} find
 * @param {String} [findByKey]
 * @return {Boolean|Number} false when not found, or the index
 */
function inArray(src, find, findByKey) {
    if (src.indexOf && !findByKey) {
        return src.indexOf(find);
    } else {
        var i = 0;
        while (i < src.length) {
            if ((findByKey && src[i][findByKey] == find) || (!findByKey && src[i] === find)) {
                return i;
            }
            i++;
        }
        return -1;
    }
}

/**
 * convert array-like objects to real arrays
 * @param {Object} obj
 * @returns {Array}
 */
function toArray(obj) {
    return Array.prototype.slice.call(obj, 0);
}

/**
 * unique array with objects based on a key (like 'id') or just by the array's value
 * @param {Array} src [{id:1},{id:2},{id:1}]
 * @param {String} [key]
 * @param {Boolean} [sort=False]
 * @returns {Array} [{id:1},{id:2}]
 */
function uniqueArray(src, key, sort) {
    var results = [];
    var values = [];
    var i = 0;

    while (i < src.length) {
        var val = key ? src[i][key] : src[i];
        if (inArray(values, val) < 0) {
            results.push(src[i]);
        }
        values[i] = val;
        i++;
    }

    if (sort) {
        if (!key) {
            results = results.sort();
        } else {
            results = results.sort(function sortUniqueArray(a, b) {
                return a[key] > b[key];
            });
        }
    }

    return results;
}

/**
 * get the prefixed property
 * @param {Object} obj
 * @param {String} property
 * @returns {String|Undefined} prefixed
 */
function prefixed(obj, property) {
    var prefix, prop;
    var camelProp = property[0].toUpperCase() + property.slice(1);

    var i = 0;
    while (i < VENDOR_PREFIXES.length) {
        prefix = VENDOR_PREFIXES[i];
        prop = (prefix) ? prefix + camelProp : property;

        if (prop in obj) {
            return prop;
        }
        i++;
    }
    return undefined;
}

/**
 * get a unique id
 * @returns {number} uniqueId
 */
var _uniqueId = 1;
function uniqueId() {
    return _uniqueId++;
}

/**
 * get the window object of an element
 * @param {HTMLElement} element
 * @returns {DocumentView|Window}
 */
function getWindowForElement(element) {
    var doc = element.ownerDocument || element;
    return (doc.defaultView || doc.parentWindow || window);
}

var MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i;

var SUPPORT_TOUCH = ('ontouchstart' in window);
// var SUPPORT_POINTER_EVENTS = prefixed(window, 'PointerEvent') !== undefined;
var SUPPORT_POINTER_EVENTS = false;
var SUPPORT_ONLY_TOUCH = SUPPORT_TOUCH && MOBILE_REGEX.test(navigator.userAgent);

var INPUT_TYPE_TOUCH = 'touch';
var INPUT_TYPE_PEN = 'pen';
var INPUT_TYPE_MOUSE = 'mouse';
var INPUT_TYPE_KINECT = 'kinect';

var COMPUTE_INTERVAL = 25;

var INPUT_START = 1;
var INPUT_MOVE = 2;
var INPUT_END = 4;
var INPUT_CANCEL = 8;

var DIRECTION_NONE = 1;
var DIRECTION_LEFT = 2;
var DIRECTION_RIGHT = 4;
var DIRECTION_UP = 8;
var DIRECTION_DOWN = 16;

var DIRECTION_HORIZONTAL = DIRECTION_LEFT | DIRECTION_RIGHT;
var DIRECTION_VERTICAL = DIRECTION_UP | DIRECTION_DOWN;
var DIRECTION_ALL = DIRECTION_HORIZONTAL | DIRECTION_VERTICAL;

var PROPS_XY = ['x', 'y'];
var PROPS_CLIENT_XY = ['clientX', 'clientY'];

/**
 * create new input type manager
 * @param {Manager} manager
 * @param {Function} callback
 * @returns {Input}
 * @constructor
 */
function Input(manager, callback) {
    var self = this;
    this.manager = manager;
    this.callback = callback;
    this.element = manager.element;
    this.target = manager.options.inputTarget;

    // smaller wrapper around the handler, for the scope and the enabled state of the manager,
    // so when disabled the input events are completely bypassed.
    this.domHandler = function(ev) {
        if (boolOrFn(manager.options.enable, [manager])) {
            self.handler(ev);
        }
    };

    this.init();

}

Input.prototype = {
    /**
     * should handle the inputEvent data and trigger the callback
     * @virtual
     */
    handler: function() { },

    /**
     * bind the events
     */
    init: function() {
        this.evEl && addEventListeners(this.element, this.evEl, this.domHandler);
        this.evTarget && addEventListeners(this.target, this.evTarget, this.domHandler);
        this.evWin && addEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
    },

    /**
     * unbind the events
     */
    destroy: function() {
        this.evEl && removeEventListeners(this.element, this.evEl, this.domHandler);
        this.evTarget && removeEventListeners(this.target, this.evTarget, this.domHandler);
        this.evWin && removeEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
    }
};

/**
 * create new input type manager
 * called by the Manager constructor
 * @param {NGHammer} manager
 * @returns {Input}
 */
function createInputInstance(manager) {
    var Type;
    var inputClass = manager.options.inputClass;

    if (inputClass) {
        Type = inputClass;
    } else if (SUPPORT_POINTER_EVENTS) {
        Type = PointerEventInput;
    } else if (SUPPORT_ONLY_TOUCH) {
        Type = TouchInput;
    } else if (!SUPPORT_TOUCH) {
        Type = MouseInput;
    } else {
        Type = TouchMouseInput;
    }
    return new (Type)(manager, inputHandler);
}

/**
 * handle input events
 * @param {Manager} manager
 * @param {String} eventType
 * @param {Object} input
 */
function inputHandler(manager, eventType, input) {
    var pointersLen = input.pointers.length;
    var changedPointersLen = input.changedPointers.length;
    var isFirst = (eventType & INPUT_START && (pointersLen - changedPointersLen === 0));
    var isFinal = (eventType & (INPUT_END | INPUT_CANCEL) && (pointersLen - changedPointersLen === 0));

    input.isFirst = !!isFirst;
    input.isFinal = !!isFinal;

    if (isFirst) {
        manager.session = {};
    }

    // source event is the normalized value of the domEvents
    // like 'touchstart, mouseup, pointerdown'
    input.eventType = eventType;

    // compute scale, rotation etc
    computeInputData(manager, input);

    // emit secret event
    manager.emit('hammer.input', input);

    manager.recognize(input);
    manager.session.prevInput = input;
}

/**
 * extend the data with some usable properties like scale, rotate, velocity etc
 * @param {Object} manager
 * @param {Object} input
 */
function computeInputData(manager, input) {
    var session = manager.session;
    var pointers = input.pointers;
    var pointersLength = pointers.length;

    // store the first input to calculate the distance and direction
    if (!session.firstInput) {
        session.firstInput = simpleCloneInputData(input);
    }

    // to compute scale and rotation we need to store the multiple touches
    if (pointersLength > 1 && !session.firstMultiple) {
        session.firstMultiple = simpleCloneInputData(input);
    } else if (pointersLength === 1) {
        session.firstMultiple = false;
    }

    var firstInput = session.firstInput;
    var firstMultiple = session.firstMultiple;
    var offsetCenter = firstMultiple ? firstMultiple.center : firstInput.center;

    var center = input.center = getCenter(pointers);
    input.timeStamp = now();
    input.deltaTime = input.timeStamp - firstInput.timeStamp;

    input.angle = getAngle(offsetCenter, center);
    input.distance = getDistance(offsetCenter, center);

    computeDeltaXY(session, input);
    input.offsetDirection = getDirection(input.deltaX, input.deltaY);

    var overallVelocity = getVelocity(input.deltaTime, input.deltaX, input.deltaY);
    input.overallVelocityX = overallVelocity.x;
    input.overallVelocityY = overallVelocity.y;
    input.overallVelocity = (abs(overallVelocity.x) > abs(overallVelocity.y)) ? overallVelocity.x : overallVelocity.y;

    input.scale = firstMultiple ? getScale(firstMultiple.pointers, pointers) : 1;
    input.rotation = firstMultiple ? getRotation(firstMultiple.pointers, pointers) : 0;

    input.maxPointers = !session.prevInput ? input.pointers.length : ((input.pointers.length >
        session.prevInput.maxPointers) ? input.pointers.length : session.prevInput.maxPointers);

    computeIntervalInputData(session, input);

    // find the correct target
    var target = manager.element;
    if (hasParent(input.srcEvent.target, target)) {
        target = input.srcEvent.target;
    }
    input.target = target;
}

function computeDeltaXY(session, input) {
    var center = input.center;
    var offset = session.offsetDelta || {};
    var prevDelta = session.prevDelta || {};
    var prevInput = session.prevInput || {};

    if (input.eventType === INPUT_START || prevInput.eventType === INPUT_END) {
        prevDelta = session.prevDelta = {
            x: prevInput.deltaX || 0,
            y: prevInput.deltaY || 0
        };

        offset = session.offsetDelta = {
            x: center.x,
            y: center.y
        };
    }

    input.deltaX = prevDelta.x + (center.x - offset.x);
    input.deltaY = prevDelta.y + (center.y - offset.y);
}

/**
 * velocity is calculated every x ms
 * @param {Object} session
 * @param {Object} input
 */
function computeIntervalInputData(session, input) {
    var last = session.lastInterval || input,
        deltaTime = input.timeStamp - last.timeStamp,
        velocity, velocityX, velocityY, direction;

    if (input.eventType != INPUT_CANCEL && (deltaTime > COMPUTE_INTERVAL || last.velocity === undefined)) {
        var deltaX = input.deltaX - last.deltaX;
        var deltaY = input.deltaY - last.deltaY;

        var v = getVelocity(deltaTime, deltaX, deltaY);
        velocityX = v.x;
        velocityY = v.y;
        velocity = (abs(v.x) > abs(v.y)) ? v.x : v.y;
        direction = getDirection(deltaX, deltaY);

        session.lastInterval = input;
    } else {
        // use latest velocity info if it doesn't overtake a minimum period
        velocity = last.velocity;
        velocityX = last.velocityX;
        velocityY = last.velocityY;
        direction = last.direction;
    }

    input.velocity = velocity;
    input.velocityX = velocityX;
    input.velocityY = velocityY;
    input.direction = direction;
}

/**
 * create a simple clone from the input used for storage of firstInput and firstMultiple
 * @param {Object} input
 * @returns {Object} clonedInputData
 */
function simpleCloneInputData(input) {
    // make a simple copy of the pointers because we will get a reference if we don't
    // we only need clientXY for the calculations
    var pointers = [];
    var i = 0;
    while (i < input.pointers.length) {
        pointers[i] = {
            clientX: round(input.pointers[i].clientX),
            clientY: round(input.pointers[i].clientY)
        };
        i++;
    }

    return {
        timeStamp: now(),
        pointers: pointers,
        center: getCenter(pointers),
        deltaX: input.deltaX,
        deltaY: input.deltaY
    };
}

/**
 * get the center of all the pointers
 * @param {Array} pointers
 * @return {Object} center contains `x` and `y` properties
 */
function getCenter(pointers) {
    var pointersLength = pointers.length;

    // no need to loop when only one touch
    if (pointersLength === 1) {
        return {
            x: round(pointers[0].clientX),
            y: round(pointers[0].clientY)
        };
    }

    var x = 0, y = 0, i = 0;
    while (i < pointersLength) {
        x += pointers[i].clientX;
        y += pointers[i].clientY;
        i++;
    }

    return {
        x: round(x / pointersLength),
        y: round(y / pointersLength)
    };
}

/**
 * calculate the velocity between two points. unit is in px per ms.
 * @param {Number} deltaTime
 * @param {Number} x
 * @param {Number} y
 * @return {Object} velocity `x` and `y`
 */
function getVelocity(deltaTime, x, y) {
    return {
        x: x / deltaTime || 0,
        y: y / deltaTime || 0
    };
}

/**
 * get the direction between two points
 * @param {Number} x
 * @param {Number} y
 * @return {Number} direction
 */
function getDirection(x, y) {
    if (x === y) {
        return DIRECTION_NONE;
    }

    if (abs(x) >= abs(y)) {
        return x < 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
    }
    return y < 0 ? DIRECTION_UP : DIRECTION_DOWN;
}

/**
 * calculate the absolute distance between two points
 * @param {Object} p1 {x, y}
 * @param {Object} p2 {x, y}
 * @param {Array} [props] containing x and y keys
 * @return {Number} distance
 */
function getDistance(p1, p2, props) {
    if (!props) {
        props = PROPS_XY;
    }
    var x = p2[props[0]] - p1[props[0]],
        y = p2[props[1]] - p1[props[1]];

    return Math.sqrt((x * x) + (y * y));
}

/**
 * calculate the angle between two coordinates
 * @param {Object} p1
 * @param {Object} p2
 * @param {Array} [props] containing x and y keys
 * @return {Number} angle
 */
function getAngle(p1, p2, props) {
    if (!props) {
        props = PROPS_XY;
    }
    var x = p2[props[0]] - p1[props[0]],
        y = p2[props[1]] - p1[props[1]];
    return Math.atan2(y, x) * 180 / Math.PI;
}

/**
 * calculate the rotation degrees between two pointersets
 * @param {Array} start array of pointers
 * @param {Array} end array of pointers
 * @return {Number} rotation
 */
function getRotation(start, end) {
    return getAngle(end[1], end[0], PROPS_CLIENT_XY) + getAngle(start[1], start[0], PROPS_CLIENT_XY);
}

/**
 * calculate the scale factor between two pointersets
 * no scale is 1, and goes down to 0 when pinched together, and bigger when pinched out
 * @param {Array} start array of pointers
 * @param {Array} end array of pointers
 * @return {Number} scale
 */
function getScale(start, end) {
    return getDistance(end[0], end[1], PROPS_CLIENT_XY) / getDistance(start[0], start[1], PROPS_CLIENT_XY);
}

var MOUSE_INPUT_MAP = {
    mousedown: INPUT_START,
    mousemove: INPUT_MOVE,
    mouseup: INPUT_END
};

var MOUSE_ELEMENT_EVENTS = 'mousedown';
var MOUSE_WINDOW_EVENTS = 'mousemove mouseup';

/**
 * Mouse events input
 * @constructor
 * @extends Input
 */
function MouseInput() {
    this.evEl = MOUSE_ELEMENT_EVENTS;
    this.evWin = MOUSE_WINDOW_EVENTS;

    this.pressed = false; // mousedown state

    Input.apply(this, arguments);
}

inherit(MouseInput, Input, {
    /**
     * handle mouse events
     * @param {Object} ev
     */
    handler: function MEhandler(ev) {
        var eventType = MOUSE_INPUT_MAP[ev.type];

        // on start we want to have the left mouse button down
        if (eventType & INPUT_START && ev.button === 0) {
            this.pressed = true;
        }

        if (eventType & INPUT_MOVE && ev.which !== 1) {
            eventType = INPUT_END;
        }

        // mouse must be down
        if (!this.pressed) {
            return;
        }

        if (eventType & INPUT_END) {
            this.pressed = false;
        }

        this.callback(this.manager, eventType, {
            pointers: [ev],
            changedPointers: [ev],
            pointerType: INPUT_TYPE_MOUSE,
            srcEvent: ev
        });
    }
});

var POINTER_INPUT_MAP = {
    pointerdown: INPUT_START,
    pointermove: INPUT_MOVE,
    pointerup: INPUT_END,
    pointercancel: INPUT_CANCEL,
    pointerout: INPUT_CANCEL
};

// in IE10 the pointer types is defined as an enum
var IE10_POINTER_TYPE_ENUM = {
    2: INPUT_TYPE_TOUCH,
    3: INPUT_TYPE_PEN,
    4: INPUT_TYPE_MOUSE,
    5: INPUT_TYPE_KINECT // see https://twitter.com/jacobrossi/status/480596438489890816
};

var POINTER_ELEMENT_EVENTS = 'pointerdown';
var POINTER_WINDOW_EVENTS = 'pointermove pointerup pointercancel';

// IE10 has prefixed support, and case-sensitive
if (window.MSPointerEvent && !window.PointerEvent) {
    POINTER_ELEMENT_EVENTS = 'MSPointerDown';
    POINTER_WINDOW_EVENTS = 'MSPointerMove MSPointerUp MSPointerCancel';
}

/**
 * Pointer events input
 * @constructor
 * @extends Input
 */
function PointerEventInput() {
    this.evEl = POINTER_ELEMENT_EVENTS;
    this.evWin = POINTER_WINDOW_EVENTS;

    Input.apply(this, arguments);

    this.store = (this.manager.session.pointerEvents = []);
}

inherit(PointerEventInput, Input, {
    /**
     * handle mouse events
     * @param {Object} ev
     */
    handler: function PEhandler(ev) {
        var store = this.store;
        var removePointer = false;

        var eventTypeNormalized = ev.type.toLowerCase().replace('ms', '');
        var eventType = POINTER_INPUT_MAP[eventTypeNormalized];
        var pointerType = IE10_POINTER_TYPE_ENUM[ev.pointerType] || ev.pointerType;

        var isTouch = (pointerType == INPUT_TYPE_TOUCH);

        // get index of the event in the store
        var storeIndex = inArray(store, ev.pointerId, 'pointerId');

        // start and mouse must be down
        if (eventType & INPUT_START && (ev.button === 0 || isTouch)) {
            if (storeIndex < 0) {
                store.push(ev);
                storeIndex = store.length - 1;
            }
        } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
            removePointer = true;
        }

        // it not found, so the pointer hasn't been down (so it's probably a hover)
        if (storeIndex < 0) {
            return;
        }

        // update the event in the store
        store[storeIndex] = ev;

        this.callback(this.manager, eventType, {
            pointers: store,
            changedPointers: [ev],
            pointerType: pointerType,
            srcEvent: ev
        });

        if (removePointer) {
            // remove from the store
            store.splice(storeIndex, 1);
        }
    }
});

var SINGLE_TOUCH_INPUT_MAP = {
    touchstart: INPUT_START,
    touchmove: INPUT_MOVE,
    touchend: INPUT_END,
    touchcancel: INPUT_CANCEL
};

var SINGLE_TOUCH_TARGET_EVENTS = 'touchstart';
var SINGLE_TOUCH_WINDOW_EVENTS = 'touchstart touchmove touchend touchcancel';

/**
 * Touch events input
 * @constructor
 * @extends Input
 */
function SingleTouchInput() {
    this.evTarget = SINGLE_TOUCH_TARGET_EVENTS;
    this.evWin = SINGLE_TOUCH_WINDOW_EVENTS;
    this.started = false;

    Input.apply(this, arguments);
}

inherit(SingleTouchInput, Input, {
    handler: function TEhandler(ev) {
        var type = SINGLE_TOUCH_INPUT_MAP[ev.type];

        // should we handle the touch events?
        if (type === INPUT_START) {
            this.started = true;
        }

        if (!this.started) {
            return;
        }

        var touches = normalizeSingleTouches.call(this, ev, type);

        // when done, reset the started state
        if (type & (INPUT_END | INPUT_CANCEL) && touches[0].length - touches[1].length === 0) {
            this.started = false;
        }

        this.callback(this.manager, type, {
            pointers: touches[0],
            changedPointers: touches[1],
            pointerType: INPUT_TYPE_TOUCH,
            srcEvent: ev
        });
    }
});

/**
 * @this {TouchInput}
 * @param {Object} ev
 * @param {Number} type flag
 * @returns {undefined|Array} [all, changed]
 */
function normalizeSingleTouches(ev, type) {
    var all = toArray(ev.touches);
    var changed = toArray(ev.changedTouches);

    if (type & (INPUT_END | INPUT_CANCEL)) {
        all = uniqueArray(all.concat(changed), 'identifier', true);
    }

    return [all, changed];
}

var TOUCH_INPUT_MAP = {
    touchstart: INPUT_START,
    touchmove: INPUT_MOVE,
    touchend: INPUT_END,
    touchcancel: INPUT_CANCEL
};

var TOUCH_TARGET_EVENTS = 'touchstart touchmove touchend touchcancel';

/**
 * Multi-user touch events input
 * @constructor
 * @extends Input
 */
function TouchInput() {
    this.evTarget = TOUCH_TARGET_EVENTS;
    this.targetIds = {};

    Input.apply(this, arguments);
}

inherit(TouchInput, Input, {
    handler: function MTEhandler(ev) {
        var type = TOUCH_INPUT_MAP[ev.type];
        var touches = getTouches.call(this, ev, type);
        if (!touches) {
            return;
        }

        this.callback(this.manager, type, {
            pointers: touches[0],
            changedPointers: touches[1],
            pointerType: INPUT_TYPE_TOUCH,
            srcEvent: ev
        });
    }
});

/**
 * @this {TouchInput}
 * @param {Object} ev
 * @param {Number} type flag
 * @returns {undefined|Array} [all, changed]
 */
function getTouches(ev, type) {
    var allTouches = toArray(ev.touches);
    var targetIds = this.targetIds;

    // when there is only one touch, the process can be simplified
    if (type & (INPUT_START | INPUT_MOVE) && allTouches.length === 1) {
        targetIds[allTouches[0].identifier] = true;
        return [allTouches, allTouches];
    }

    var i,
        targetTouches,
        changedTouches = toArray(ev.changedTouches),
        changedTargetTouches = [],
        target = this.target;

    // get target touches from touches
    targetTouches = allTouches.filter(function(touch) {
        return hasParent(touch.target, target);
    });

    // collect touches
    if (type === INPUT_START) {
        i = 0;
        while (i < targetTouches.length) {
            targetIds[targetTouches[i].identifier] = true;
            i++;
        }
    }

    // filter changed touches to only contain touches that exist in the collected target ids
    i = 0;
    while (i < changedTouches.length) {
        if (targetIds[changedTouches[i].identifier]) {
            changedTargetTouches.push(changedTouches[i]);
        }

        // cleanup removed touches
        if (type & (INPUT_END | INPUT_CANCEL)) {
            delete targetIds[changedTouches[i].identifier];
        }
        i++;
    }

    if (!changedTargetTouches.length) {
        return;
    }

    return [
        // merge targetTouches with changedTargetTouches so it contains ALL touches, including 'end' and 'cancel'
        uniqueArray(targetTouches.concat(changedTargetTouches), 'identifier', true),
        changedTargetTouches
    ];
}

/**
 * Combined touch and mouse input
 *
 * Touch has a higher priority then mouse, and while touching no mouse events are allowed.
 * This because touch devices also emit mouse events while doing a touch.
 *
 * @constructor
 * @extends Input
 */

var DEDUP_TIMEOUT = 2500;
var DEDUP_DISTANCE = 25;

function TouchMouseInput() {
    Input.apply(this, arguments);

    var handler = bindFn(this.handler, this);
    this.touch = new TouchInput(this.manager, handler);
    this.mouse = new MouseInput(this.manager, handler);

    this.primaryTouch = null;
    this.lastTouches = [];
}

inherit(TouchMouseInput, Input, {
    /**
     * handle mouse and touch events
     * @param {NGHammer} manager
     * @param {String} inputEvent
     * @param {Object} inputData
     */
    handler: function TMEhandler(manager, inputEvent, inputData) {
        var isTouch = (inputData.pointerType == INPUT_TYPE_TOUCH),
            isMouse = (inputData.pointerType == INPUT_TYPE_MOUSE);

        if (isMouse && inputData.sourceCapabilities && inputData.sourceCapabilities.firesTouchEvents) {
            return;
        }

        // when we're in a touch event, record touches to  de-dupe synthetic mouse event
        if (isTouch) {
            recordTouches.call(this, inputEvent, inputData);
        } else if (isMouse && isSyntheticEvent.call(this, inputData)) {
            return;
        }

        this.callback(manager, inputEvent, inputData);
    },

    /**
     * remove the event listeners
     */
    destroy: function destroy() {
        this.touch.destroy();
        this.mouse.destroy();
    }
});

function recordTouches(eventType, eventData) {
    if (eventType & INPUT_START) {
        this.primaryTouch = eventData.changedPointers[0].identifier;
        setLastTouch.call(this, eventData);
    } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
        setLastTouch.call(this, eventData);
    }
}

function setLastTouch(eventData) {
    var touch = eventData.changedPointers[0];

    if (touch.identifier === this.primaryTouch) {
        var lastTouch = {x: touch.clientX, y: touch.clientY};
        this.lastTouches.push(lastTouch);
        var lts = this.lastTouches;
        var removeLastTouch = function() {
            var i = lts.indexOf(lastTouch);
            if (i > -1) {
                lts.splice(i, 1);
            }
        };
        setTimeout(removeLastTouch, DEDUP_TIMEOUT);
    }
}

function isSyntheticEvent(eventData) {
    var x = eventData.srcEvent.clientX, y = eventData.srcEvent.clientY;
    for (var i = 0; i < this.lastTouches.length; i++) {
        var t = this.lastTouches[i];
        var dx = Math.abs(x - t.x), dy = Math.abs(y - t.y);
        if (dx <= DEDUP_DISTANCE && dy <= DEDUP_DISTANCE) {
            return true;
        }
    }
    return false;
}

var PREFIXED_TOUCH_ACTION = prefixed(TEST_ELEMENT.style, 'touchAction');
var NATIVE_TOUCH_ACTION = PREFIXED_TOUCH_ACTION !== undefined;

// magical touchAction value
var TOUCH_ACTION_COMPUTE = 'compute';
var TOUCH_ACTION_AUTO = 'auto';
var TOUCH_ACTION_MANIPULATION = 'manipulation'; // not implemented
var TOUCH_ACTION_NONE = 'none';
var TOUCH_ACTION_PAN_X = 'pan-x';
var TOUCH_ACTION_PAN_Y = 'pan-y';
var TOUCH_ACTION_MAP = getTouchActionProps();

/**
 * Touch Action
 * sets the touchAction property or uses the js alternative
 * @param {Manager} manager
 * @param {String} value
 * @constructor
 */
function TouchAction(manager, value) {
    this.manager = manager;
    this.set(value);
}

TouchAction.prototype = {
    /**
     * set the touchAction value on the element or enable the polyfill
     * @param {String} value
     */
    set: function(value) {
        // find out the touch-action by the event handlers
        if (value == TOUCH_ACTION_COMPUTE) {
            value = this.compute();
        }

        if (NATIVE_TOUCH_ACTION && this.manager.element.style && TOUCH_ACTION_MAP[value]) {
            this.manager.element.style[PREFIXED_TOUCH_ACTION] = value;
        }
        this.actions = value.toLowerCase().trim();
    },

    /**
     * just re-set the touchAction value
     */
    update: function() {
        this.set(this.manager.options.touchAction);
    },

    /**
     * compute the value for the touchAction property based on the recognizer's settings
     * @returns {String} value
     */
    compute: function() {
        var actions = [];
        each(this.manager.recognizers, function(recognizer) {
            if (boolOrFn(recognizer.options.enable, [recognizer])) {
                actions = actions.concat(recognizer.getTouchAction());
            }
        });
        return cleanTouchActions(actions.join(' '));
    },

    /**
     * this method is called on each input cycle and provides the preventing of the browser behavior
     * @param {Object} input
     */
    preventDefaults: function(input) {
        var srcEvent = input.srcEvent;
        var direction = input.offsetDirection;

        // if the touch action did prevented once this session
        if (this.manager.session.prevented) {
            srcEvent.preventDefault();
            return;
        }

        var actions = this.actions;
        var hasNone = inStr(actions, TOUCH_ACTION_NONE) && !TOUCH_ACTION_MAP[TOUCH_ACTION_NONE];
        var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y) && !TOUCH_ACTION_MAP[TOUCH_ACTION_PAN_Y];
        var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X) && !TOUCH_ACTION_MAP[TOUCH_ACTION_PAN_X];

        if (hasNone) {
            //do not prevent defaults if this is a tap gesture

            var isTapPointer = input.pointers.length === 1;
            var isTapMovement = input.distance < 2;
            var isTapTouchTime = input.deltaTime < 250;

            if (isTapPointer && isTapMovement && isTapTouchTime) {
                return;
            }
        }

        if (hasPanX && hasPanY) {
            // `pan-x pan-y` means browser handles all scrolling/panning, do not prevent
            return;
        }

        if (hasNone ||
            (hasPanY && direction & DIRECTION_HORIZONTAL) ||
            (hasPanX && direction & DIRECTION_VERTICAL)) {
            return this.preventSrc(srcEvent);
        }
    },

    /**
     * call preventDefault to prevent the browser's default behavior (scrolling in most cases)
     * @param {Object} srcEvent
     */
    preventSrc: function(srcEvent) {
        this.manager.session.prevented = true;
        srcEvent.preventDefault();
    }
};

/**
 * when the touchActions are collected they are not a valid value, so we need to clean things up. *
 * @param {String} actions
 * @returns {*}
 */
function cleanTouchActions(actions) {
    // none
    if (inStr(actions, TOUCH_ACTION_NONE)) {
        return TOUCH_ACTION_NONE;
    }

    var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X);
    var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y);

    // if both pan-x and pan-y are set (different recognizers
    // for different directions, e.g. horizontal pan but vertical swipe?)
    // we need none (as otherwise with pan-x pan-y combined none of these
    // recognizers will work, since the browser would handle all panning
    if (hasPanX && hasPanY) {
        return TOUCH_ACTION_NONE;
    }

    // pan-x OR pan-y
    if (hasPanX || hasPanY) {
        return hasPanX ? TOUCH_ACTION_PAN_X : TOUCH_ACTION_PAN_Y;
    }

    // manipulation
    if (inStr(actions, TOUCH_ACTION_MANIPULATION)) {
        return TOUCH_ACTION_MANIPULATION;
    }

    return TOUCH_ACTION_AUTO;
}

function getTouchActionProps() {
    if (!NATIVE_TOUCH_ACTION) {
        return false;
    }
    var touchMap = {};
    var cssSupports = window.CSS && window.CSS.supports;
    ['auto', 'manipulation', 'pan-y', 'pan-x', 'pan-x pan-y', 'none'].forEach(function(val) {

        // If css.supports is not supported but there is native touch-action assume it supports
        // all values. This is the case for IE 10 and 11.
        touchMap[val] = cssSupports ? window.CSS.supports('touch-action', val) : true;
    });
    return touchMap;
}

/**
 * Recognizer flow explained; *
 * All recognizers have the initial state of POSSIBLE when a input session starts.
 * The definition of a input session is from the first input until the last input, with all it's movement in it. *
 * Example session for mouse-input: mousedown -> mousemove -> mouseup
 *
 * On each recognizing cycle (see Manager.recognize) the .recognize() method is executed
 * which determines with state it should be.
 *
 * If the recognizer has the state FAILED, CANCELLED or RECOGNIZED (equals ENDED), it is reset to
 * POSSIBLE to give it another change on the next cycle.
 *
 *               Possible
 *                  |
 *            +-----+---------------+
 *            |                     |
 *      +-----+-----+               |
 *      |           |               |
 *   Failed      Cancelled          |
 *                          +-------+------+
 *                          |              |
 *                      Recognized       Began
 *                                         |
 *                                      Changed
 *                                         |
 *                                  Ended/Recognized
 */
var STATE_POSSIBLE = 1;
var STATE_BEGAN = 2;
var STATE_CHANGED = 4;
var STATE_ENDED = 8;
var STATE_RECOGNIZED = STATE_ENDED;
var STATE_CANCELLED = 16;
var STATE_FAILED = 32;

/**
 * Recognizer
 * Every recognizer needs to extend from this class.
 * @constructor
 * @param {Object} options
 */
function Recognizer(options) {
    this.options = assign({}, this.defaults, options || {});

    this.id = uniqueId();

    this.manager = null;

    // default is enable true
    this.options.enable = ifUndefined(this.options.enable, true);

    this.state = STATE_POSSIBLE;

    this.simultaneous = {};
    this.requireFail = [];
}

Recognizer.prototype = {
    /**
     * @virtual
     * @type {Object}
     */
    defaults: {},

    /**
     * set options
     * @param {Object} options
     * @return {Recognizer}
     */
    set: function(options) {
        assign(this.options, options);

        // also update the touchAction, in case something changed about the directions/enabled state
        this.manager && this.manager.touchAction.update();
        return this;
    },

    /**
     * recognize simultaneous with an other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    recognizeWith: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'recognizeWith', this)) {
            return this;
        }

        var simultaneous = this.simultaneous;
        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        if (!simultaneous[otherRecognizer.id]) {
            simultaneous[otherRecognizer.id] = otherRecognizer;
            otherRecognizer.recognizeWith(this);
        }
        return this;
    },

    /**
     * drop the simultaneous link. it doesnt remove the link on the other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    dropRecognizeWith: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'dropRecognizeWith', this)) {
            return this;
        }

        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        delete this.simultaneous[otherRecognizer.id];
        return this;
    },

    /**
     * recognizer can only run when an other is failing
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    requireFailure: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'requireFailure', this)) {
            return this;
        }

        var requireFail = this.requireFail;
        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        if (inArray(requireFail, otherRecognizer) === -1) {
            requireFail.push(otherRecognizer);
            otherRecognizer.requireFailure(this);
        }
        return this;
    },

    /**
     * drop the requireFailure link. it does not remove the link on the other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    dropRequireFailure: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'dropRequireFailure', this)) {
            return this;
        }

        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        var index = inArray(this.requireFail, otherRecognizer);
        if (index > -1) {
            this.requireFail.splice(index, 1);
        }
        return this;
    },

    /**
     * has require failures boolean
     * @returns {boolean}
     */
    hasRequireFailures: function() {
        return this.requireFail.length > 0;
    },

    /**
     * if the recognizer can recognize simultaneous with an other recognizer
     * @param {Recognizer} otherRecognizer
     * @returns {Boolean}
     */
    canRecognizeWith: function(otherRecognizer) {
        return !!this.simultaneous[otherRecognizer.id];
    },

    /**
     * You should use `tryEmit` instead of `emit` directly to check
     * that all the needed recognizers has failed before emitting.
     * @param {Object} input
     */
    emit: function(input) {
        var self = this;
        var state = this.state;

        function emit(event) {
            self.manager.emit(event, input);
        }

        // 'panstart' and 'panmove'
        if (state < STATE_ENDED) {
            emit(self.options.event + stateStr(state));
        }

        emit(self.options.event); // simple 'eventName' events

        if (input.additionalEvent) { // additional event(panleft, panright, pinchin, pinchout...)
            emit(input.additionalEvent);
        }

        // panend and pancancel
        if (state >= STATE_ENDED) {
            emit(self.options.event + stateStr(state));
        }
    },

    /**
     * Check that all the require failure recognizers has failed,
     * if true, it emits a gesture event,
     * otherwise, setup the state to FAILED.
     * @param {Object} input
     */
    tryEmit: function(input) {
        if (this.canEmit()) {
            return this.emit(input);
        }
        // it's failing anyway
        this.state = STATE_FAILED;
    },

    /**
     * can we emit?
     * @returns {boolean}
     */
    canEmit: function() {
        var i = 0;
        while (i < this.requireFail.length) {
            if (!(this.requireFail[i].state & (STATE_FAILED | STATE_POSSIBLE))) {
                return false;
            }
            i++;
        }
        return true;
    },

    /**
     * update the recognizer
     * @param {Object} inputData
     */
    recognize: function(inputData) {
        // make a new copy of the inputData
        // so we can change the inputData without messing up the other recognizers
        var inputDataClone = assign({}, inputData);

        // is is enabled and allow recognizing?
        if (!boolOrFn(this.options.enable, [this, inputDataClone])) {
            this.reset();
            this.state = STATE_FAILED;
            return;
        }

        // reset when we've reached the end
        if (this.state & (STATE_RECOGNIZED | STATE_CANCELLED | STATE_FAILED)) {
            this.state = STATE_POSSIBLE;
        }

        this.state = this.process(inputDataClone);

        // the recognizer has recognized a gesture
        // so trigger an event
        if (this.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED | STATE_CANCELLED)) {
            this.tryEmit(inputDataClone);
        }
    },

    /**
     * return the state of the recognizer
     * the actual recognizing happens in this method
     * @virtual
     * @param {Object} inputData
     * @returns {Const} STATE
     */
    process: function(inputData) { }, // jshint ignore:line

    /**
     * return the preferred touch-action
     * @virtual
     * @returns {Array}
     */
    getTouchAction: function() { },

    /**
     * called when the gesture isn't allowed to recognize
     * like when another is being recognized or it is disabled
     * @virtual
     */
    reset: function() { }
};

/**
 * get a usable string, used as event postfix
 * @param {Const} state
 * @returns {String} state
 */
function stateStr(state) {
    if (state & STATE_CANCELLED) {
        return 'cancel';
    } else if (state & STATE_ENDED) {
        return 'end';
    } else if (state & STATE_CHANGED) {
        return 'move';
    } else if (state & STATE_BEGAN) {
        return 'start';
    }
    return '';
}

/**
 * direction cons to string
 * @param {Const} direction
 * @returns {String}
 */
function directionStr(direction) {
    if (direction == DIRECTION_DOWN) {
        return 'down';
    } else if (direction == DIRECTION_UP) {
        return 'up';
    } else if (direction == DIRECTION_LEFT) {
        return 'left';
    } else if (direction == DIRECTION_RIGHT) {
        return 'right';
    }
    return '';
}

/**
 * get a recognizer by name if it is bound to a manager
 * @param {Recognizer|String} otherRecognizer
 * @param {Recognizer} recognizer
 * @returns {Recognizer}
 */
function getRecognizerByNameIfManager(otherRecognizer, recognizer) {
    var manager = recognizer.manager;
    if (manager) {
        return manager.get(otherRecognizer);
    }
    return otherRecognizer;
}

/**
 * This recognizer is just used as a base for the simple attribute recognizers.
 * @constructor
 * @extends Recognizer
 */
function AttrRecognizer() {
    Recognizer.apply(this, arguments);
}

inherit(AttrRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof AttrRecognizer
     */
    defaults: {
        /**
         * @type {Number}
         * @default 1
         */
        pointers: 1
    },

    /**
     * Used to check if it the recognizer receives valid input, like input.distance > 10.
     * @memberof AttrRecognizer
     * @param {Object} input
     * @returns {Boolean} recognized
     */
    attrTest: function(input) {
        var optionPointers = this.options.pointers;
        return optionPointers === 0 || input.pointers.length === optionPointers;
    },

    /**
     * Process the input and return the state for the recognizer
     * @memberof AttrRecognizer
     * @param {Object} input
     * @returns {*} State
     */
    process: function(input) {
        var state = this.state;
        var eventType = input.eventType;

        var isRecognized = state & (STATE_BEGAN | STATE_CHANGED);
        var isValid = this.attrTest(input);

        // on cancel input and we've recognized before, return STATE_CANCELLED
        if (isRecognized && (eventType & INPUT_CANCEL || !isValid)) {
            return state | STATE_CANCELLED;
        } else if (isRecognized || isValid) {
            if (eventType & INPUT_END) {
                return state | STATE_ENDED;
            } else if (!(state & STATE_BEGAN)) {
                return STATE_BEGAN;
            }
            return state | STATE_CHANGED;
        }
        return STATE_FAILED;
    }
});

/**
 * Pan
 * Recognized when the pointer is down and moved in the allowed direction.
 * @constructor
 * @extends AttrRecognizer
 */
function PanRecognizer() {
    AttrRecognizer.apply(this, arguments);

    this.pX = null;
    this.pY = null;
}

inherit(PanRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof PanRecognizer
     */
    defaults: {
        event: 'pan',
        threshold: 10,
        pointers: 1,
        direction: DIRECTION_ALL
    },

    getTouchAction: function() {
        var direction = this.options.direction;
        var actions = [];
        if (direction & DIRECTION_HORIZONTAL) {
            actions.push(TOUCH_ACTION_PAN_Y);
        }
        if (direction & DIRECTION_VERTICAL) {
            actions.push(TOUCH_ACTION_PAN_X);
        }
        return actions;
    },

    directionTest: function(input) {
        var options = this.options;
        var hasMoved = true;
        var distance = input.distance;
        var direction = input.direction;
        var x = input.deltaX;
        var y = input.deltaY;

        // lock to axis?
        if (!(direction & options.direction)) {
            if (options.direction & DIRECTION_HORIZONTAL) {
                direction = (x === 0) ? DIRECTION_NONE : (x < 0) ? DIRECTION_LEFT : DIRECTION_RIGHT;
                hasMoved = x != this.pX;
                distance = Math.abs(input.deltaX);
            } else {
                direction = (y === 0) ? DIRECTION_NONE : (y < 0) ? DIRECTION_UP : DIRECTION_DOWN;
                hasMoved = y != this.pY;
                distance = Math.abs(input.deltaY);
            }
        }
        input.direction = direction;
        return hasMoved && distance > options.threshold && direction & options.direction;
    },

    attrTest: function(input) {
        return AttrRecognizer.prototype.attrTest.call(this, input) &&
            (this.state & STATE_BEGAN || (!(this.state & STATE_BEGAN) && this.directionTest(input)));
    },

    emit: function(input) {

        this.pX = input.deltaX;
        this.pY = input.deltaY;

        var direction = directionStr(input.direction);

        if (direction) {
            input.additionalEvent = this.options.event + direction;
        }
        this._super.emit.call(this, input);
    }
});

/**
 * Pinch
 * Recognized when two or more pointers are moving toward (zoom-in) or away from each other (zoom-out).
 * @constructor
 * @extends AttrRecognizer
 */
function PinchRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(PinchRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof PinchRecognizer
     */
    defaults: {
        event: 'pinch',
        threshold: 0,
        pointers: 2
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_NONE];
    },

    attrTest: function(input) {
        return this._super.attrTest.call(this, input) &&
            (Math.abs(input.scale - 1) > this.options.threshold || this.state & STATE_BEGAN);
    },

    emit: function(input) {
        if (input.scale !== 1) {
            var inOut = input.scale < 1 ? 'in' : 'out';
            input.additionalEvent = this.options.event + inOut;
        }
        this._super.emit.call(this, input);
    }
});

/**
 * Press
 * Recognized when the pointer is down for x ms without any movement.
 * @constructor
 * @extends Recognizer
 */
function PressRecognizer() {
    Recognizer.apply(this, arguments);

    this._timer = null;
    this._input = null;
}

inherit(PressRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof PressRecognizer
     */
    defaults: {
        event: 'press',
        pointers: 1,
        time: 251, // minimal time of the pointer to be pressed
        threshold: 9 // a minimal movement is ok, but keep it low
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_AUTO];
    },

    process: function(input) {
        var options = this.options;
        var validPointers = input.pointers.length === options.pointers;
        var validMovement = input.distance < options.threshold;
        var validTime = input.deltaTime > options.time;

        this._input = input;

        // we only allow little movement
        // and we've reached an end event, so a tap is possible
        if (!validMovement || !validPointers || (input.eventType & (INPUT_END | INPUT_CANCEL) && !validTime)) {
            this.reset();
        } else if (input.eventType & INPUT_START) {
            this.reset();
            this._timer = setTimeoutContext(function() {
                this.state = STATE_RECOGNIZED;
                this.tryEmit();
            }, options.time, this);
        } else if (input.eventType & INPUT_END) {
            return STATE_RECOGNIZED;
        }
        return STATE_FAILED;
    },

    reset: function() {
        clearTimeout(this._timer);
    },

    emit: function(input) {
        if (this.state !== STATE_RECOGNIZED) {
            return;
        }

        if (input && (input.eventType & INPUT_END)) {
            this.manager.emit(this.options.event + 'up', input);
        } else {
            this._input.timeStamp = now();
            this.manager.emit(this.options.event, this._input);
        }
    }
});

/**
 * Rotate
 * Recognized when two or more pointer are moving in a circular motion.
 * @constructor
 * @extends AttrRecognizer
 */
function RotateRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(RotateRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof RotateRecognizer
     */
    defaults: {
        event: 'rotate',
        threshold: 0,
        pointers: 2
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_NONE];
    },

    attrTest: function(input) {
        return this._super.attrTest.call(this, input) &&
            (Math.abs(input.rotation) > this.options.threshold || this.state & STATE_BEGAN);
    }
});

/**
 * Swipe
 * Recognized when the pointer is moving fast (velocity), with enough distance in the allowed direction.
 * @constructor
 * @extends AttrRecognizer
 */
function SwipeRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(SwipeRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof SwipeRecognizer
     */
    defaults: {
        event: 'swipe',
        threshold: 10,
        velocity: 0.3,
        direction: DIRECTION_HORIZONTAL | DIRECTION_VERTICAL,
        pointers: 1
    },

    getTouchAction: function() {
        return PanRecognizer.prototype.getTouchAction.call(this);
    },

    attrTest: function(input) {
        var direction = this.options.direction;
        var velocity;

        if (direction & (DIRECTION_HORIZONTAL | DIRECTION_VERTICAL)) {
            velocity = input.overallVelocity;
        } else if (direction & DIRECTION_HORIZONTAL) {
            velocity = input.overallVelocityX;
        } else if (direction & DIRECTION_VERTICAL) {
            velocity = input.overallVelocityY;
        }

        return this._super.attrTest.call(this, input) &&
            direction & input.offsetDirection &&
            input.distance > this.options.threshold &&
            input.maxPointers == this.options.pointers &&
            abs(velocity) > this.options.velocity && input.eventType & INPUT_END;
    },

    emit: function(input) {
        var direction = directionStr(input.offsetDirection);
        if (direction) {
            this.manager.emit(this.options.event + direction, input);
        }

        this.manager.emit(this.options.event, input);
    }
});

/**
 * A tap is ecognized when the pointer is doing a small tap/click. Multiple taps are recognized if they occur
 * between the given interval and position. The delay option can be used to recognize multi-taps without firing
 * a single tap.
 *
 * The eventData from the emitted event contains the property `tapCount`, which contains the amount of
 * multi-taps being recognized.
 * @constructor
 * @extends Recognizer
 */
function TapRecognizer() {
    Recognizer.apply(this, arguments);

    // previous time and center,
    // used for tap counting
    this.pTime = false;
    this.pCenter = false;

    this._timer = null;
    this._input = null;
    this.count = 0;
}

inherit(TapRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof PinchRecognizer
     */
    defaults: {
        event: 'tap',
        pointers: 1,
        taps: 1,
        interval: 300, // max time between the multi-tap taps
        time: 250, // max time of the pointer to be down (like finger on the screen)
        threshold: 9, // a minimal movement is ok, but keep it low
        posThreshold: 10 // a multi-tap can be a bit off the initial position
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_MANIPULATION];
    },

    process: function(input) {
        var options = this.options;

        var validPointers = input.pointers.length === options.pointers;
        var validMovement = input.distance < options.threshold;
        var validTouchTime = input.deltaTime < options.time;

        this.reset();

        if ((input.eventType & INPUT_START) && (this.count === 0)) {
            return this.failTimeout();
        }

        // we only allow little movement
        // and we've reached an end event, so a tap is possible
        if (validMovement && validTouchTime && validPointers) {
            if (input.eventType != INPUT_END) {
                return this.failTimeout();
            }

            var validInterval = this.pTime ? (input.timeStamp - this.pTime < options.interval) : true;
            var validMultiTap = !this.pCenter || getDistance(this.pCenter, input.center) < options.posThreshold;

            this.pTime = input.timeStamp;
            this.pCenter = input.center;

            if (!validMultiTap || !validInterval) {
                this.count = 1;
            } else {
                this.count += 1;
            }

            this._input = input;

            // if tap count matches we have recognized it,
            // else it has began recognizing...
            var tapCount = this.count % options.taps;
            if (tapCount === 0) {
                // no failing requirements, immediately trigger the tap event
                // or wait as long as the multitap interval to trigger
                if (!this.hasRequireFailures()) {
                    return STATE_RECOGNIZED;
                } else {
                    this._timer = setTimeoutContext(function() {
                        this.state = STATE_RECOGNIZED;
                        this.tryEmit();
                    }, options.interval, this);
                    return STATE_BEGAN;
                }
            }
        }
        return STATE_FAILED;
    },

    failTimeout: function() {
        this._timer = setTimeoutContext(function() {
            this.state = STATE_FAILED;
        }, this.options.interval, this);
        return STATE_FAILED;
    },

    reset: function() {
        clearTimeout(this._timer);
    },

    emit: function() {
        if (this.state == STATE_RECOGNIZED) {
            this._input.tapCount = this.count;
            this.manager.emit(this.options.event, this._input);
        }
    }
});

/**
 * Simple way to create a manager with a default set of recognizers.
 * @param {HTMLElement} element
 * @param {Object} [options]
 * @constructor
 */
function NGHammer(element, options) {
    options = options || {};
    options.recognizers = ifUndefined(options.recognizers, NGHammer.defaults.preset);
    return new Manager(element, options);
}

/**
 * @const {string}
 */
NGHammer.VERSION = '2.0.7';

/**
 * default settings
 * @namespace
 */
NGHammer.defaults = {
    /**
     * set if DOM events are being triggered.
     * But this is slower and unused by simple implementations, so disabled by default.
     * @type {Boolean}
     * @default false
     */
    domEvents: false,

    /**
     * The value for the touchAction property/fallback.
     * When set to `compute` it will magically set the correct value based on the added recognizers.
     * @type {String}
     * @default compute
     */
    touchAction: TOUCH_ACTION_COMPUTE,

    /**
     * @type {Boolean}
     * @default true
     */
    enable: true,

    /**
     * EXPERIMENTAL FEATURE -- can be removed/changed
     * Change the parent input target element.
     * If Null, then it is being set the to main element.
     * @type {Null|EventTarget}
     * @default null
     */
    inputTarget: null,

    /**
     * force an input class
     * @type {Null|Function}
     * @default null
     */
    inputClass: null,

    /**
     * Default recognizer setup when calling `NGHammer()`
     * When creating a new Manager these will be skipped.
     * @type {Array}
     */
    preset: [
        // RecognizerClass, options, [recognizeWith, ...], [requireFailure, ...]
        [RotateRecognizer, {enable: false}],
        [PinchRecognizer, {enable: false}, ['rotate']],
        [SwipeRecognizer, {direction: DIRECTION_HORIZONTAL}],
        [PanRecognizer, {direction: DIRECTION_HORIZONTAL}, ['swipe']],
        [TapRecognizer],
        [TapRecognizer, {event: 'doubletap', taps: 2}, ['tap']],
        [PressRecognizer]
    ],

    /**
     * Some CSS properties can be used to improve the working of NGHammer.
     * Add them to this method and they will be set when creating a new Manager.
     * @namespace
     */
    cssProps: {
        /**
         * Disables text selection to improve the dragging gesture. Mainly for desktop browsers.
         * @type {String}
         * @default 'none'
         */
        userSelect: 'none',

        /**
         * Disable the Windows Phone grippers when pressing an element.
         * @type {String}
         * @default 'none'
         */
        touchSelect: 'none',

        /**
         * Disables the default callout shown when you touch and hold a touch target.
         * On iOS, when you touch and hold a touch target such as a link, Safari displays
         * a callout containing information about the link. This property allows you to disable that callout.
         * @type {String}
         * @default 'none'
         */
        touchCallout: 'none',

        /**
         * Specifies whether zooming is enabled. Used by IE10>
         * @type {String}
         * @default 'none'
         */
        contentZooming: 'none',

        /**
         * Specifies that an entire element should be draggable instead of its contents. Mainly for desktop browsers.
         * @type {String}
         * @default 'none'
         */
        userDrag: 'none',

        /**
         * Overrides the highlight color shown when the user taps a link or a JavaScript
         * clickable element in iOS. This property obeys the alpha value, if specified.
         * @type {String}
         * @default 'rgba(0,0,0,0)'
         */
        tapHighlightColor: 'rgba(0,0,0,0)'
    }
};

var STOP = 1;
var FORCED_STOP = 2;

/**
 * Manager
 * @param {HTMLElement} element
 * @param {Object} [options]
 * @constructor
 */
function Manager(element, options) {
    this.options = assign({}, NGHammer.defaults, options || {});

    this.options.inputTarget = this.options.inputTarget || element;

    this.handlers = {};
    this.session = {};
    this.recognizers = [];
    this.oldCssProps = {};

    this.element = element;
    this.input = createInputInstance(this);
    this.touchAction = new TouchAction(this, this.options.touchAction);

    toggleCssProps(this, true);

    each(this.options.recognizers, function(item) {
        var recognizer = this.add(new (item[0])(item[1]));
        item[2] && recognizer.recognizeWith(item[2]);
        item[3] && recognizer.requireFailure(item[3]);
    }, this);
}

Manager.prototype = {
    /**
     * set options
     * @param {Object} options
     * @returns {Manager}
     */
    set: function(options) {
        assign(this.options, options);

        // Options that need a little more setup
        if (options.touchAction) {
            this.touchAction.update();
        }
        if (options.inputTarget) {
            // Clean up existing event listeners and reinitialize
            this.input.destroy();
            this.input.target = options.inputTarget;
            this.input.init();
        }
        return this;
    },

    /**
     * stop recognizing for this session.
     * This session will be discarded, when a new [input]start event is fired.
     * When forced, the recognizer cycle is stopped immediately.
     * @param {Boolean} [force]
     */
    stop: function(force) {
        this.session.stopped = force ? FORCED_STOP : STOP;
    },

    /**
     * run the recognizers!
     * called by the inputHandler function on every movement of the pointers (touches)
     * it walks through all the recognizers and tries to detect the gesture that is being made
     * @param {Object} inputData
     */
    recognize: function(inputData) {
        var session = this.session;
        if (session.stopped) {
            return;
        }

        // run the touch-action polyfill
        this.touchAction.preventDefaults(inputData);

        var recognizer;
        var recognizers = this.recognizers;

        // this holds the recognizer that is being recognized.
        // so the recognizer's state needs to be BEGAN, CHANGED, ENDED or RECOGNIZED
        // if no recognizer is detecting a thing, it is set to `null`
        var curRecognizer = session.curRecognizer;

        // reset when the last recognizer is recognized
        // or when we're in a new session
        if (!curRecognizer || (curRecognizer && curRecognizer.state & STATE_RECOGNIZED)) {
            curRecognizer = session.curRecognizer = null;
        }

        var i = 0;
        while (i < recognizers.length) {
            recognizer = recognizers[i];

            // find out if we are allowed try to recognize the input for this one.
            // 1.   allow if the session is NOT forced stopped (see the .stop() method)
            // 2.   allow if we still haven't recognized a gesture in this session, or the this recognizer is the one
            //      that is being recognized.
            // 3.   allow if the recognizer is allowed to run simultaneous with the current recognized recognizer.
            //      this can be setup with the `recognizeWith()` method on the recognizer.
            if (session.stopped !== FORCED_STOP && ( // 1
                    !curRecognizer || recognizer == curRecognizer || // 2
                    recognizer.canRecognizeWith(curRecognizer))) { // 3
                recognizer.recognize(inputData);
            } else {
                recognizer.reset();
            }

            // if the recognizer has been recognizing the input as a valid gesture, we want to store this one as the
            // current active recognizer. but only if we don't already have an active recognizer
            if (!curRecognizer && recognizer.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED)) {
                curRecognizer = session.curRecognizer = recognizer;
            }
            i++;
        }
    },

    /**
     * get a recognizer by its event name.
     * @param {Recognizer|String} recognizer
     * @returns {Recognizer|Null}
     */
    get: function(recognizer) {
        if (recognizer instanceof Recognizer) {
            return recognizer;
        }

        var recognizers = this.recognizers;
        for (var i = 0; i < recognizers.length; i++) {
            if (recognizers[i].options.event == recognizer) {
                return recognizers[i];
            }
        }
        return null;
    },

    /**
     * add a recognizer to the manager
     * existing recognizers with the same event name will be removed
     * @param {Recognizer} recognizer
     * @returns {Recognizer|Manager}
     */
    add: function(recognizer) {
        if (invokeArrayArg(recognizer, 'add', this)) {
            return this;
        }

        // remove existing
        var existing = this.get(recognizer.options.event);
        if (existing) {
            this.remove(existing);
        }

        this.recognizers.push(recognizer);
        recognizer.manager = this;

        this.touchAction.update();
        return recognizer;
    },

    /**
     * remove a recognizer by name or instance
     * @param {Recognizer|String} recognizer
     * @returns {Manager}
     */
    remove: function(recognizer) {
        if (invokeArrayArg(recognizer, 'remove', this)) {
            return this;
        }

        recognizer = this.get(recognizer);

        // let's make sure this recognizer exists
        if (recognizer) {
            var recognizers = this.recognizers;
            var index = inArray(recognizers, recognizer);

            if (index !== -1) {
                recognizers.splice(index, 1);
                this.touchAction.update();
            }
        }

        return this;
    },

    /**
     * bind event
     * @param {String} events
     * @param {Function} handler
     * @returns {EventEmitter} this
     */
    on: function(events, handler) {
        if (events === undefined) {
            return;
        }
        if (handler === undefined) {
            return;
        }

        var handlers = this.handlers;
        each(splitStr(events), function(event) {
            handlers[event] = handlers[event] || [];
            handlers[event].push(handler);
        });
        return this;
    },

    /**
     * unbind event, leave emit blank to remove all handlers
     * @param {String} events
     * @param {Function} [handler]
     * @returns {EventEmitter} this
     */
    off: function(events, handler) {
        if (events === undefined) {
            return;
        }

        var handlers = this.handlers;
        each(splitStr(events), function(event) {
            if (!handler) {
                delete handlers[event];
            } else {
                handlers[event] && handlers[event].splice(inArray(handlers[event], handler), 1);
            }
        });
        return this;
    },

    /**
     * emit event to the listeners
     * @param {String} event
     * @param {Object} data
     */
    emit: function(event, data) {
        // we also want to trigger dom events
        if (this.options.domEvents) {
            triggerDomEvent(event, data);
        }

        // no handlers, so skip it all
        var handlers = this.handlers[event] && this.handlers[event].slice();
        if (!handlers || !handlers.length) {
            return;
        }

        data.type = event;
        data.preventDefault = function() {
            data.srcEvent.preventDefault();
        };

        var i = 0;
        while (i < handlers.length) {
            handlers[i](data);
            i++;
        }
    },

    /**
     * destroy the manager and unbinds all events
     * it doesn't unbind dom events, that is the user own responsibility
     */
    destroy: function() {
        this.element && toggleCssProps(this, false);

        this.handlers = {};
        this.session = {};
        this.input.destroy();
        this.element = null;
    }
};

/**
 * add/remove the css properties as defined in manager.options.cssProps
 * @param {Manager} manager
 * @param {Boolean} add
 */
function toggleCssProps(manager, add) {
    var element = manager.element;
    if (!element.style) {
        return;
    }
    var prop;
    each(manager.options.cssProps, function(value, name) {
        prop = prefixed(element.style, name);
        if (add) {
            manager.oldCssProps[prop] = element.style[prop];
            element.style[prop] = value;
        } else {
            element.style[prop] = manager.oldCssProps[prop] || '';
        }
    });
    if (!add) {
        manager.oldCssProps = {};
    }
}

/**
 * trigger dom event
 * @param {String} event
 * @param {Object} data
 */
function triggerDomEvent(event, data) {
    var gestureEvent = document.createEvent('Event');
    gestureEvent.initEvent(event, true, true);
    gestureEvent.gesture = data;
    data.target.dispatchEvent(gestureEvent);
}

assign(NGHammer, {
    INPUT_START: INPUT_START,
    INPUT_MOVE: INPUT_MOVE,
    INPUT_END: INPUT_END,
    INPUT_CANCEL: INPUT_CANCEL,

    STATE_POSSIBLE: STATE_POSSIBLE,
    STATE_BEGAN: STATE_BEGAN,
    STATE_CHANGED: STATE_CHANGED,
    STATE_ENDED: STATE_ENDED,
    STATE_RECOGNIZED: STATE_RECOGNIZED,
    STATE_CANCELLED: STATE_CANCELLED,
    STATE_FAILED: STATE_FAILED,

    DIRECTION_NONE: DIRECTION_NONE,
    DIRECTION_LEFT: DIRECTION_LEFT,
    DIRECTION_RIGHT: DIRECTION_RIGHT,
    DIRECTION_UP: DIRECTION_UP,
    DIRECTION_DOWN: DIRECTION_DOWN,
    DIRECTION_HORIZONTAL: DIRECTION_HORIZONTAL,
    DIRECTION_VERTICAL: DIRECTION_VERTICAL,
    DIRECTION_ALL: DIRECTION_ALL,

    Manager: Manager,
    Input: Input,
    TouchAction: TouchAction,

    TouchInput: TouchInput,
    MouseInput: MouseInput,
    PointerEventInput: PointerEventInput,
    TouchMouseInput: TouchMouseInput,
    SingleTouchInput: SingleTouchInput,

    Recognizer: Recognizer,
    AttrRecognizer: AttrRecognizer,
    Tap: TapRecognizer,
    Pan: PanRecognizer,
    Swipe: SwipeRecognizer,
    Pinch: PinchRecognizer,
    Rotate: RotateRecognizer,
    Press: PressRecognizer,

    on: addEventListeners,
    off: removeEventListeners,
    each: each,
    merge: merge,
    extend: extend,
    assign: assign,
    inherit: inherit,
    bindFn: bindFn,
    prefixed: prefixed
});

// this prevents errors when NGHammer is loaded in the presence of an AMD
//  style loader but by script tag, not by the loader.
var freeGlobal = (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {})); // jshint ignore:line
freeGlobal.NGHammer = NGHammer;

if (typeof define === 'function' && define.amd) {
    define(function() {
        return NGHammer;
    });
} else if (typeof module != 'undefined' && module.exports) {
    module.exports = NGHammer;
} else {
    window[exportName] = NGHammer;
}

})(window, document, 'NGHammer');




//##########################################################################################################################
//##########################################################################################################################
//##########################################################################################################################
//##########################################################################################################################
//##########################################################################################################################

// nanogallery2 auto start whithout javascript call
(function(){
  'use strict';
  jQuery(document).ready(function () {
  
    // var t=document.querySelectorAll('[data-nanogallery2-portable]');
    // if( t.length > 0 ) {
      // portable mode
      // var link = document.createElement('link');
      // link.setAttribute("rel", "stylesheet");
      // link.setAttribute("type", "text/css");
      // link.onload = function(){
        // for( var i=0; i < t.length; i++ ) {
          // jQuery(t[i]).nanogallery2(jQuery(t[i]).data('nanogallery2-portable'));
        // }
      // }
      // link.setAttribute("href", '//nano.gallery/css/nanogallery2.css');
      // document.getElementsByTagName("head")[0].appendChild(link);
    // }
    // else {
      // standard mode
      var t=document.querySelectorAll('[data-nanogallery2]');
      for( var i=0; i < t.length; i++ ) {
        jQuery(t[i]).nanogallery2(jQuery(t[i]).data('nanogallery2'));
      }
    // }
    
  });
}).call(null);


/**!
 * @preserve nanogallery2 - NANOPHOTOSPROVIDER2 data provider
 * Homepage: http://nanogallery2.nanostudio.org
 * Sources:  https://github.com/nanostudio-org/nanogallery2
 *
 * License:  GPLv3 and commercial licence
 * 
*/
 
// ########################################################
// ##### nanogallery2 - module NANOPHOTOSPROVIDER2    #####
// ########################################################


;(function ($) {
  
  jQuery.nanogallery2.data_nano_photos_provider2 = function (instance, fnName){
    var G=instance;      // current nanogallery2 instance
    
    /** @function AlbumGetContent */
    var AlbumGetContent = function(albumID, fnToCall, fnParam1, fnParam2) {

      var albumIdx = NGY2Item.GetIdx(G, albumID);

      // title is identical to ID (only for albums)
      if( instance.I[albumIdx].title == '' ) {
        instance.I[albumIdx].title = JsonConvertCharset(albumID);
      }

      // Build the URL
      var url = G.O.dataProvider + '?albumID='+albumID;             // which album
      // all thumbnails sizes (for responsive display)
      url += '&wxs=' + G.tn.settings.width[G.GOM.curNavLevel].xs;
      url += '&hxs=' + G.tn.settings.height[G.GOM.curNavLevel].xs;
      url += '&wsm=' + G.tn.settings.width[G.GOM.curNavLevel].sm;
      url += '&hsm=' + G.tn.settings.height[G.GOM.curNavLevel].sm;
      url += '&wme=' + G.tn.settings.width[G.GOM.curNavLevel].me;
      url += '&hme=' + G.tn.settings.height[G.GOM.curNavLevel].me;
      url += '&wla=' + G.tn.settings.width[G.GOM.curNavLevel].la;
      url += '&hla=' + G.tn.settings.height[G.GOM.curNavLevel].la;
      url += '&wxl=' + G.tn.settings.width[G.GOM.curNavLevel].xl;
      url += '&hxl=' + G.tn.settings.height[G.GOM.curNavLevel].xl;
      
      PreloaderDisplay( true );
      jQuery.ajaxSetup({ cache: false });
      jQuery.support.cors = true;
      try {
        
        var tId = setTimeout( function() {
          // workaround to handle JSONP (cross-domain) errors
          PreloaderDisplay(false);
          NanoAlert('Could not retrieve nanoPhotosProvider2 data (timeout).');
        }, 60000 );

        if( G.O.debugMode ) { console.log('nanoPhotosProvider2 URL: ' + url); }
        
        jQuery.getJSON(url, function(data, status, xhr) {
          clearTimeout( tId );
          PreloaderDisplay( false );
          
          JsonParseData(albumIdx, data);
          
          if( data.nano_status == 'ok' ) {
            AlbumPostProcess( albumID );
            if( fnToCall !== null &&  fnToCall !== undefined) {
              fnToCall( fnParam1, fnParam2, null );
            }
          }
          else {
            NanoAlert(G, 'Could not retrieve nanoPhotosProvider2 data. Error: ' + data.nano_status + ' - ' + data.nano_message);
          }
        })
        .fail( function(jqxhr, textStatus, error) {
          clearTimeout( tId );
          PreloaderDisplay( false );

          var k=''
          for(var key in jqxhr) {
            k+= key + '=' + jqxhr[key] +'<br>';
          }
          var err = textStatus + ', ' + error + ' ' + k + '<br><br>URL:'+url;
          NanoAlert(G, 'Could not retrieve nanoPhotosProvider2 data. Error: ' + err);

        });    
      
      }
      catch(e) {
        NanoAlert(G, 'Could not retrieve nanoPhotosProvider2 data. Error: ' + e);
      }
    }

    
    function JsonConvertCharset( str ) {
      
      return decodeURIComponent(str);


      // Pb %C3%A9 --> %E9
      // in UTF-8: \u00e9=\xe9 (e9 = hex value)
      switch( G.O.dataCharset.toUpperCase() ) {
        case 'UTF-8':     // Apache Windows
          return decodeURI(str);      // do not use decodeURIComponent (would convert slash also)
          break;
        case 'Latin':     // Apache Linux
        default :
          return escape(str);
          break;
      }
    }

    function JsonParseData(albumIdx, data) {
      if( G.O.debugMode ) { 
        console.log('nanoPhotosProvider2 parse data:');
        console.dir(data);    
      }

      var foundAlbumID = false;
      var nb = 0;

      // loop each item
      jQuery.each( data.album_content, function( i, item ){
      
        // base URL where the images are stored
        var baseURL = G.O.dataProvider.substring(0, G.O.dataProvider.indexOf('nano_photos_provider2.php'));
        
        // image URL
        var src = baseURL + JsonConvertCharset( item.src );

        // item title
        var title = item.title;

        // item description ( '_' are replaced with ' ' )
        var description = item.description.split('_').join(' ');

        // item kind ('album' or 'image')
        var kind = 'image';
        if( item.kind !== undefined && item.kind.length > 0 ) {
          kind = item.kind;
        }

        // item ID
        var ID=item.ID;

        var filterAlbum = false;
        if( kind == 'album' ) {
          // check if 
          if( !FilterAlbumName(title, ID) ) { filterAlbum = true; }
        }

        if( kind == 'image' || (kind == 'album' && FilterAlbumName(title, ID)) ) {
          var albumID = 0;
          if( item.albumID !== undefined  ) {
            albumID = item.albumID;
            foundAlbumID = true;
          }

          var tags = (item.tags === undefined) ? '' : item.tags;
          
          var newItem=NGY2Item.New( G, title.split('_').join(' ') , description, ID, albumID, kind, tags );
          newItem.src=src;

          // dominant colorS as a gif
          if( item.dcGIF !== undefined ) {
            newItem.imageDominantColors='data:image/gif;base64,'+item.dcGIF;
          }
          // dominant color as hex rgb value
          if( item.dc !== undefined && item.dc !== '' ) {
            newItem.imageDominantColor=item.dc;
          }
          
          if( kind == 'album' ) {
            // number of items in album
            newItem.numberItems = item.cnt;
          }
          else {
            // image size
            newItem.imageWidth = item.imgWidth;
            newItem.imageHeight = item.imgHeight;
          }
          
          // item download URL
          if( item.originalURL != '' ) {
            newItem.downloadURL = baseURL+JsonConvertCharset(item.originalURL);
          }

	      // custom data
	      if( item.customData !== null ) {
		      newItem.customData=item.customData;
	      }
          
          // retrieve responsive thumbnails urls and sizes
          var cnl = G.GOM.curNavLevel;      // current navigation level ('L1' or 'LN');
          var l=['xs', 'sm', 'me', 'la', 'xl'];
          for( var n = 0; n < l.length; n++ ) {
            newItem.thumbs.url[cnl][l[n]]     = baseURL + JsonConvertCharset(item.t_url[n]);
            newItem.thumbs.width[cnl][l[n]]   = parseInt(item.t_width[n]);
            newItem.thumbs.height[cnl][l[n]]  = parseInt(item.t_height[n]);
          }
         
          // post-process callback
          if( typeof G.O.fnProcessData == 'function' ) {
            G.O.fnProcessData(newItem, G.O.dataProvider, data);
          }
          
        }
      });

      G.I[albumIdx].contentIsLoaded = true;   // album's content is ready
console.log(G.I);
    }    
    

    // -----------
    // Initialize 
    function Init() {

    }
    

    // shortcuts to NGY2Tools functions (with context)
    var PreloaderDisplay = NGY2Tools.PreloaderDisplay.bind(G);
    // var NanoAlert = NGY2Tools.NanoAlert.bind(G);
    var NanoAlert = NGY2Tools.NanoAlert;
    var GetImageTitleFromURL = NGY2Tools.GetImageTitleFromURL.bind(G);
    var FilterAlbumName = NGY2Tools.FilterAlbumName.bind(G);
    var AlbumPostProcess = NGY2Tools.AlbumPostProcess.bind(G);
 
    switch( fnName ){
      case 'GetHiddenAlbums':
        break;
      case 'AlbumGetContent':
        var albumID = arguments[2],
        callback = arguments[3],
        cbParam1 = arguments[4],
        cbParam2 = arguments[5];
        AlbumGetContent(albumID, callback, cbParam1, cbParam2);
        break;
      case 'Init':
        Init();
        break;
      case '':
        break;
      case '':
        break;
    }

  };
  
// END NANOPHOTOSPROVIDER DATA SOURCE FOR NANOGALLERY2
}( jQuery ));
  
  
  
  
  
/**!
 * @preserve nanogallery2 - GOOGLE PHOTOS data provider
 * Homepage: http://nanogallery2.nanostudio.org
 * Sources:  https://github.com/nanostudio-org/nanogallery2
 *
 * License:  GPLv3 and commercial licence
 * 
*/
 
// ###################################################
// ##### nanogallery2 - module for GOOGLE PHOTOS #####
// ##### requires nanogp                         #####
// ###################################################


;(function ($) {
  
  jQuery.nanogallery2.data_google2 = function (instance, fnName){
    var G=instance;      // current nanogallery2 instance

    // ### Picasa/Google+
    // square format : 32, 48, 64, 72, 104, 144, 150, 160 (cropped)
    // details: https://developers.google.com/picasa-web/docs/2.0/reference
    Google = {
      url: function() {
        // return ( G.O.picasaUseUrlCrossDomain ? 'https://photos.googleapis.com/data/feed/api/' : 'https://picasaweb.google.com/data/feed/api/');
        return ( 'https://photos.googleapis.com/data/feed/api/' );
      },
      thumbSize: 64,
      thumbAvailableSizes : new Array(32, 48, 64, 72, 94, 104, 110, 128, 144, 150, 160, 200, 220, 288, 320, 400, 512, 576, 640, 720, 800, 912, 1024, 1152, 1280, 1440, 1600),
      thumbAvailableSizesCropped : ' 32 48 64 72 104 144 150 160 '
    };
    
    
    /** @function AlbumGetContent */
    var AlbumGetContent = function(albumID, fnToCall, fnParam1, fnParam2) {


      var url= Google.url() + 'user/'+G.O.userID;
      var kind= 'image';
      var albumIdx=NGY2Item.GetIdx(G, albumID);

      var maxResults='';
      if( G.galleryMaxItems.Get() > 0 ) {
        maxResults='&max-results='+G.galleryMaxItems.Get();
      }
      
      var gat='';   // global authorization (using the Builder)
      if( typeof ngy2_pwa_at !== 'undefined' ) {
        gat=ngy2_pwa_at;
      }
      
      if( albumID == 0 ) {
      // if( G.I[albumIdx].GetID() == 0 ) {
        // retrieve the list of albums
        if( gat != '' ) {
          // in builder
          url += '?alt=json&v=3&kind=album&thumbsize='+G.picasa.thumbSizes+maxResults+'&rnd=' + (new Date().getTime()) + '&access_token=' + gat;
        }
        else {
          if( G.O.google2URL == undefined || G.O.google2URL == '' ) {
            // old Picasa access method (for content before 09/02/2017)
            url += '?alt=json&v=3&kind=album&thumbsize='+G.picasa.thumbSizes+maxResults+'&rnd=' + (new Date().getTime());
          }
          else {
            // nanogp
            url=G.O.google2URL + '?nguserid='+G.O.userID+'&alt=json&v=3&kind=album&thumbsize='+G.picasa.thumbSizes+maxResults+'&rnd=' + (new Date().getTime());
          }
        }
        kind='album';
      }
      else {
        // retrieve the content of one album (=photos)
        var auth='';
        if( G.I[albumIdx].authkey != '' ) {
          // private album
          auth=G.I[albumIdx].authkey;
        }
        if( gat != '' ) {
          // in builder
          url += '/albumid/'+albumID+'?alt=json&kind=photo&thumbsize='+G.picasa.thumbSizes+maxResults+auth+'&imgmax=d&access_token=' + gat;
        }
        else {
          if( G.O.google2URL == undefined || G.O.google2URL == '' ) {
            // old Picasa access method (for content before 09/02/2017)
            url += '/albumid/'+albumID+'?alt=json&v=3&kind=photo&thumbsize='+G.picasa.thumbSizes+maxResults+'&rnd=' + (new Date().getTime());
          }
          else {
            // nanogp
            url=G.O.google2URL + '?nguserid='+G.O.userID+'&ngalbumid='+albumID+'&alt=json&v=3&kind=photo&thumbsize='+G.picasa.thumbSizes+maxResults+auth+'&imgmax=d';
          }
        }
      }

      if( G.O.debugMode ) { console.log('Google Photos URL: ' + url); }
      
      PreloaderDisplay(true);
      jQuery.ajaxSetup({ cache: false });
      jQuery.support.cors = true;
      try {
        
        var tId = setTimeout( function() {
          // workaround to handle JSONP (cross-domain) errors
          PreloaderDisplay(false);
          NanoAlert('Could not retrieve AJAX data...');
        }, 60000 );

        var GI_getJSONfinished = function(data){
          clearTimeout(tId);
          PreloaderDisplay(false);
          GoogleParseData( albumIdx, kind, data );
          AlbumPostProcess(albumID);
          if( fnToCall !== null &&  fnToCall !== undefined) {
            fnToCall( fnParam1, fnParam2, null );
          }
        };

        var gi_data_loaded = null;
        // load more than 1000 data (contributor: Giovanni Chiodi)
        var GI_loadJSON = function(url,start_index){
          // console.log(url + '&start-index=' + start_index + '&callback=?');
          jQuery.getJSON( url + '&start-index=' + start_index + '&callback=?', function(data) {
          
            if( data.nano_status == 'error' ) {
              clearTimeout(tId);
              PreloaderDisplay(false);
              NanoAlert(G, "Could not retrieve Google data. Error: " + data.nano_message);
              return;
            }
          
            if (gi_data_loaded===null) {
              gi_data_loaded = data;
            }
            else {
              gi_data_loaded.feed.entry=gi_data_loaded.feed.entry.concat(data.feed.entry);
            }

            var cnt=data.feed.openSearch$startIndex.$t+data.feed.openSearch$itemsPerPage.$t;
            var numItems=0;
            if( kind == 'image' ) {
              // retrieve the number of images from one album
              if( data.feed.gphoto$numphotos === undefined ) {
                numItems=data.feed.openSearch$totalResults.$t;
              }
              else {
                numItems=data.feed.gphoto$numphotos.$t;
              }
            }
            else {
              // retrieve the number of images from a list of albums
              numItems=data.feed.openSearch$totalResults.$t;
            }
            
            // if (data.feed.openSearch$startIndex.$t+data.feed.openSearch$itemsPerPage.$t>=data.feed.openSearch$totalResults.$t){
            if( cnt >= numItems || cnt >= G.galleryMaxItems.Get() ) {
              //ok finito
              GI_getJSONfinished(gi_data_loaded);
            }
            else {
              //ce ne sono ancora da caricare
              //altra chiamata per il rimanente
              GI_loadJSON(url, cnt);
            }
          })
          .fail( function(jqxhr, textStatus, error) {
            clearTimeout(tId);
            PreloaderDisplay(false);

            var k=''
            for(var key in jqxhr) {
              k+= key + '=' + jqxhr[key] +'<br>';
            }
            var err = textStatus + ', ' + error + ' ' + k + '<br><br>URL:'+url;
            NanoAlert(G, "Could not retrieve Google data. Error: " + err);

          });
          
        };

        GI_loadJSON(url,1);
      }
      catch(e) {
        NanoAlert(G, "Could not retrieve Google data. Error: " + e);
      }
    }

    
    // -----------
    // Retrieve items from a Google Photos (ex Picasa) data stream
    // items can be images or albums
    function GoogleParseData(albumIdx, kind, data) {

      if( G.O.debugMode ) { 
        console.log('Google Photos data:');
        console.dir(data);    
      }

      var albumID=G.I[albumIdx].GetID();

      if( G.I[albumIdx].title == '' ) {
        // set title of the album (=> root level not loaded at this time)
        G.I[albumIdx].title=data.feed.title.$t;
      }
      
      // iterate and parse each item
      jQuery.each(data.feed.entry, function(i,data){

        // Get the title 
        var imgUrl=data.media$group.media$content[0].url;
        var itemTitle = data.title.$t;

        
        // Get the description
        var filename='';
        var itemDescription = data.media$group.media$description.$t;
        if( kind == 'image') {
          // if image, the title contains the image filename -> replace with content of description
          filename=itemTitle;
          if( itemDescription != '' ) {
            itemTitle=itemDescription;
            itemDescription='';
          }
          if( G.O.thumbnailLabel.get('title') != '' ) {
            // use filename for the title (extract from URL)
            itemTitle=GetImageTitleFromURL(unescape(unescape(unescape(unescape(imgUrl)))));
          }
        }
        
        var itemID = data.gphoto$id.$t;
        if( !(kind == 'album' && !FilterAlbumName(itemTitle, itemID)) ) {

          var newItem=NGY2Item.New( G, itemTitle, itemDescription, itemID, albumID, kind, '' );
          // set the image src
          var src='';
          if( kind == 'image' ) {
            src=imgUrl;
            if( !G.O.viewerZoom && G.O.viewerZoom != undefined ) {
              var s=imgUrl.substring(0, imgUrl.lastIndexOf('/'));
              s=s.substring(0, s.lastIndexOf('/')) + '/';
              if( window.screen.width >  window.screen.height ) {
                src=s+'w'+window.screen.width+'/'+filename;
              }
              else {
                src=s+'h'+window.screen.height+'/'+filename;
              }
            }
            newItem.src=src;    // image's URL

            // image size
            if( data.gphoto$width !== undefined ) {
              newItem.imageWidth=parseInt(data.gphoto$width.$t);
            }
            if( data.gphoto$height !== undefined ) {
              newItem.imageHeight=parseInt(data.gphoto$height.$t);
            }

            if( data.media$group != null && data.media$group.media$credit != null && data.media$group.media$credit.length > 0 ) {
              newItem.author=data.media$group.media$credit[0].$t;
            }

            
            // exif data
            if( data.exif$tags !== undefined ) {
              if( data.exif$tags.exif$exposure != undefined ) {
                newItem.exif.exposure= data.exif$tags.exif$exposure.$t;
              }
              if( data.exif$tags.exif$flash != undefined ) {
                if( data.exif$tags.exif$flash.$t == 'true' ) {
                  newItem.exif.flash= 'flash';
                }
              }
              if( data.exif$tags.exif$focallength != undefined ) {
                newItem.exif.focallength= data.exif$tags.exif$focallength.$t;
              }
              if( data.exif$tags.exif$fstop != undefined ) {
                newItem.exif.fstop= data.exif$tags.exif$fstop.$t;
              }
              if( data.exif$tags.exif$iso != undefined ) {
                newItem.exif.iso= data.exif$tags.exif$iso.$t;
              }
              if( data.exif$tags.exif$model != undefined ) {
                newItem.exif.model= data.exif$tags.exif$model.$t;
              }
              
              // geo location
              if( data.gphoto$location != undefined ) {
                newItem.exif.location= data.gphoto$location;
              }
            }
          }
          else {
            newItem.author=data.author[0].name.$t;
            newItem.numberItems=data.gphoto$numphotos.$t;
          }

          // set the URL of the thumbnails images
          newItem.thumbs=GoogleThumbSetSizes('l1', 0, newItem.thumbs, data, kind );
          newItem.thumbs=GoogleThumbSetSizes('lN', 5, newItem.thumbs, data, kind );
          
          if( typeof G.O.fnProcessData == 'function' ) {
            G.O.fnProcessData(newItem, 'google2', data);
          }
        }
      });

      G.I[albumIdx].contentIsLoaded=true;   // album's content is ready
    }
  
    
    
    /** @function GetHiddenAlbums */
    var GetHiddenAlbums = function( hiddenAlbums, callback ){
      var lstAlbums = [].concat( hiddenAlbums );
      for( var i=0; i< lstAlbums.length; i++ ) {
        AlbumAuthkeyGetInfoQueue(lstAlbums[i], callback);
      }
      // dequeue sequentially
      jQuery(document).dequeue('GoogleAlbumWithAuthkey');
    }

    // Google+ - retrieves private album
    // The first image is used as the cover image (=album thumbnail)
    function AlbumAuthkeyGetInfoQueue( albumIDwithAuthkey, callback ) {
      jQuery(document).queue('GoogleAlbumWithAuthkey', function() {

      var p=albumIDwithAuthkey.indexOf('&authkey=');
        if( p == -1 ) {
          p=albumIDwithAuthkey.indexOf('?authkey=');
        }
        var albumID=albumIDwithAuthkey.substring(0,p);

        var opt=albumIDwithAuthkey.substring(p);
        if( opt.indexOf('Gv1sRg') == -1 ) {
          opt='&authkey=Gv1sRg'+opt.substring(9);
        }
        var url = Google.url() + 'user/'+G.O.userID+'/albumid/'+albumID+'?alt=json&kind=photo'+opt+'&max-results=1&thumbsize='+G.picasa.thumbSizes+'&imgmax=d';
        
        PreloaderDisplay(true);

        jQuery.ajaxSetup({ cache: false });
        jQuery.support.cors = true;
        
        var tId = setTimeout( function() {
          // workaround to handle JSONP (cross-domain) errors
          PreloaderDisplay(false);
          NanoAlert(G, 'Could not retrieve AJAX data...');
        }, 60000 );
        jQuery.getJSON(url, function(data, status, xhr) {
          clearTimeout(tId);
          PreloaderDisplay(false);
          
          var albumTitle=data.feed.title.$t;
          var source = data.feed.entry[0];

          var newItem=NGY2Item.New( G, albumTitle, '', albumID, '0', 'album', '' );
          
          newItem.authkey=opt;
          
          //Get and set the URLs of the thumbnail
          newItem.thumbs=GoogleThumbSetSizes('l1', 0, newItem.thumbs, source, 'album' );
          newItem.thumbs=GoogleThumbSetSizes('lN', 5, newItem.thumbs, source, 'album' );
   
          if( typeof G.O.fnProcessData == 'function' ) {
            G.O.fnProcessData(newItem, 'google', source);
          }
//          G.I[1].contentIsLoaded=true;
          newItem.numberItems=data.feed.gphoto$numphotos.$t;

          // dequeue to process the next google+/picasa private album
          if( jQuery(document).queue('GoogleAlbumWithAuthkey').length > 0 ) {
            jQuery(document).dequeue('GoogleAlbumWithAuthkey');
          }
          else {
            callback();
          }

        })
        .fail( function(jqxhr, textStatus, error) {
          clearTimeout(tId);
          PreloaderDisplay(false);
          NanoAlert(G, "Could not retrieve ajax data (google): " + textStatus + ', ' + error);
          jQuery(document).dequeue('GoogleAlbumWithAuthkey');
        });      
      });      

    }

    // -----------
    // Set thumbnail sizes (width and height) and URLs (for all resolutions (xs, sm, me, la, xl) and levels (l1, lN)
    function GoogleThumbSetSizes(level, startI, tn, data, kind ) {
      var sizes=['xs','sm','me','la','xl'];
      
      for(var i=0; i<sizes.length; i++ ) {
        tn.url[level][sizes[i]]=data.media$group.media$thumbnail[startI+i].url;
        if( kind == 'image' ) {
          tn.width[level][sizes[i]]=data.media$group.media$thumbnail[startI+i].width;
          tn.height[level][sizes[i]]=data.media$group.media$thumbnail[startI+i].height;

          var gw=data.media$group.media$thumbnail[startI+i].width;
          var gh=data.media$group.media$thumbnail[startI+i].height;
          if( G.tn.settings.width[level][sizes[i]] == 'auto' ) {
            if( gh < G.tn.settings.height[level][sizes[i]] ) {
              // calculate new h/w and change URL
              var ratio=gw/gh;
              tn.width[level][sizes[i]]=gw*ratio;
              tn.height[level][sizes[i]]=gh*ratio;
              var url=tn.url[level][sizes[i]].substring(0, tn.url[level][sizes[i]].lastIndexOf('/'));
              url=url.substring(0, url.lastIndexOf('/')) + '/';
              tn.url[level][sizes[i]]=url+'h'+G.tn.settings.height[level][sizes[i]]+'/';
            }
          }
          if( G.tn.settings.height[level][sizes[i]] == 'auto' ) {
            if( gw < G.tn.settings.width[level][sizes[i]] ) {
              // calculate new h/w and change URL
              var ratio=gh/gw;
              tn.height[level][sizes[i]]=gh*ratio;
              tn.width[level][sizes[i]]=gw*ratio;
              var url=tn.url[level][sizes[i]].substring(0, tn.url[level][sizes[i]].lastIndexOf('/'));
              url=url.substring(0, url.lastIndexOf('/')) + '/';
              tn.url[level][sizes[i]]=url+'w'+G.tn.settings.width[level][sizes[i]]+'/';
            }
          }
        }
        else {
          // albums
          // the Google API returns incorrect height/width values
          if( G.tn.settings.width[level][sizes[i]] != 'auto' ) {
//            tn.width[level][sizes[i]]=data.media$group.media$thumbnail[startI+i].width;
          }
          else {
            var url=tn.url[level][sizes[i]].substring(0, tn.url[level][sizes[i]].lastIndexOf('/'));
            url=url.substring(0, url.lastIndexOf('/')) + '/';
            tn.url[level][sizes[i]]=url+'h'+G.tn.settings.height[level][sizes[i]]+'/';
          }
          
          if( G.tn.settings.height[level][sizes[i]] != 'auto' ) { 
//            tn.height[level][sizes[i]]=data.media$group.media$thumbnail[startI+i].height;
          }
          else {
              var url=tn.url[level][sizes[i]].substring(0, tn.url[level][sizes[i]].lastIndexOf('/'));
              url=url.substring(0, url.lastIndexOf('/')) + '/';
              tn.url[level][sizes[i]]=url+'w'+G.tn.settings.width[level][sizes[i]]+'/';
          }
        }
      }
      return tn;
    }


    // -----------
    // Initialize thumbnail sizes
    function Init() {
      G.picasa = {
        // cache value in instance to avoid regeneration on each need
        thumbSizes:''
      };

      var sfL1=1;
      if( G.tn.opt.l1.crop === true ) {
        sfL1=G.O.thumbnailCropScaleFactor;
      }
      var sfLN=1;
      if( G.tn.opt.lN.crop === true ) {
        sfLN=G.O.thumbnailCropScaleFactor;
      }

      G.picasa.thumbSizes=GoogleAddOneThumbSize(G.picasa.thumbSizes, G.tn.settings.width.l1.xs*sfL1, G.tn.settings.height.l1.xs*sfL1, G.tn.settings.width.l1.xsc, G.tn.settings.height.l1.xsc );
      G.picasa.thumbSizes=GoogleAddOneThumbSize(G.picasa.thumbSizes, G.tn.settings.width.l1.sm*sfL1, G.tn.settings.height.l1.sm*sfL1, G.tn.settings.width.l1.smc, G.tn.settings.height.l1.smc );
      G.picasa.thumbSizes=GoogleAddOneThumbSize(G.picasa.thumbSizes, G.tn.settings.width.l1.me*sfL1, G.tn.settings.height.l1.me*sfL1, G.tn.settings.width.l1.mec, G.tn.settings.height.l1.mec );
      G.picasa.thumbSizes=GoogleAddOneThumbSize(G.picasa.thumbSizes, G.tn.settings.width.l1.la*sfL1, G.tn.settings.height.l1.la*sfL1, G.tn.settings.width.l1.lac, G.tn.settings.height.l1.lac );
      G.picasa.thumbSizes=GoogleAddOneThumbSize(G.picasa.thumbSizes, G.tn.settings.width.l1.xl*sfL1, G.tn.settings.height.l1.xl*sfL1, G.tn.settings.width.l1.xlc, G.tn.settings.height.l1.xlc );
      G.picasa.thumbSizes=GoogleAddOneThumbSize(G.picasa.thumbSizes, G.tn.settings.width.lN.xs*sfLN, G.tn.settings.height.lN.xs*sfLN, G.tn.settings.width.lN.xsc, G.tn.settings.height.lN.xsc );
      G.picasa.thumbSizes=GoogleAddOneThumbSize(G.picasa.thumbSizes, G.tn.settings.width.lN.sm*sfLN, G.tn.settings.height.lN.sm*sfLN, G.tn.settings.width.lN.smc, G.tn.settings.height.lN.smc );
      G.picasa.thumbSizes=GoogleAddOneThumbSize(G.picasa.thumbSizes, G.tn.settings.width.lN.me*sfLN, G.tn.settings.height.lN.me*sfLN, G.tn.settings.width.lN.mec, G.tn.settings.height.lN.mec );
      G.picasa.thumbSizes=GoogleAddOneThumbSize(G.picasa.thumbSizes, G.tn.settings.width.lN.la*sfLN, G.tn.settings.height.lN.la*sfLN, G.tn.settings.width.lN.lac, G.tn.settings.height.lN.lac );
      G.picasa.thumbSizes=GoogleAddOneThumbSize(G.picasa.thumbSizes, G.tn.settings.width.lN.xl*sfLN, G.tn.settings.height.lN.xl*sfLN, G.tn.settings.width.lN.xlc, G.tn.settings.height.lN.xlc );
    }
    
    function GoogleAddOneThumbSize(thumbSizes, v1, v2, c1, c2 ) {
      var v = Math.ceil( v2 * G.tn.scale ) + c2;
      // if( v1 == 'auto' ) {
      if( isNaN(v1) ) {
        v = Math.ceil( v2 * G.tn.scale ) + c2;
      }
      // else if( v2 == 'auto' ) {
      else if( isNaN(v2) ) {
          v = Math.ceil( v1 * G.tn.scale ) + c1;
        }
        else if( v1 > v2 ) {
          v = Math.ceil( v1 * G.tn.scale ) + c1;
        }
        
      if( thumbSizes.length > 0 ) {
        thumbSizes += ',';
      }
      thumbSizes += v;
      return thumbSizes;
    }


    // shortcuts to NGY2Tools functions (with context)
    var PreloaderDisplay = NGY2Tools.PreloaderDisplay.bind(G);
    // var NanoAlert = NGY2Tools.NanoAlert.bind(G);
    var NanoAlert = NGY2Tools.NanoAlert;
    var GetImageTitleFromURL = NGY2Tools.GetImageTitleFromURL.bind(G);
    var FilterAlbumName = NGY2Tools.FilterAlbumName.bind(G);
    var AlbumPostProcess = NGY2Tools.AlbumPostProcess.bind(G);
 
    switch( fnName ){
      case 'GetHiddenAlbums':
        var hiddenAlbums = arguments[2],
        callback = arguments[3];
        GetHiddenAlbums(hiddenAlbums, callback);
        break;
      case 'AlbumGetContent':
        var albumID = arguments[2],
        callback = arguments[3],
        cbParam1 = arguments[4],
        cbParam2 = arguments[5];
        AlbumGetContent(albumID, callback, cbParam1, cbParam2);
        break;
      case 'Init':
        Init();
        break;
      case '':
        break;
      case '':
        break;
    }

  };
  
// END GOOGLE DATA SOURCE FOR NANOGALLERY2
}( jQuery ));
  
  
  
  
  
/**!
 * @preserve nanogallery2 - FLICKR data provider
 * Homepage: http://nanogallery2.nanostudio.org
 * Sources:  https://github.com/nanostudio-org/nanogallery2
 *
 * License:  GPLv3 and commercial licence
 * 
*/
 
// ############################################
// ##### nanogallery2 - module for FLICKR #####
// ############################################


;(function ($) {
  
  jQuery.nanogallery2.data_flickr = function (instance, fnName){
    var G = instance;      // current nanogallery2 instance

    // ### Flickr
    // Details: http://www.flickr.com/services/api/misc.urls.html
    var Flickr = {
      url: function() {
        // Flickr API Going SSL-Only on June 27th, 2014
        return 'https://api.flickr.com/services/rest/';
      },
      thumbSize:'               sq',
      thumbAvailableSizes :     new Array(75, 100, 150, 240, 500, 640),
      thumbAvailableSizesStr :  new Array('sq', 't', 'q', 's', 'm', 'z'),
      photoSize :               '0',
      photoAvailableSizes :     new Array(75, 100, 150, 240, 500, 640, 1024, 1024, 1600, 2048, 10000),
      photoAvailableSizesStr :  new Array('sq', 't', 'q', 's', 'm', 'z', 'b', 'l', 'h', 'k', 'o'),
      ApiKey :                  "2f0e634b471fdb47446abcb9c5afebdc"
    };
    
    
    /** @function AlbumGetContent */
    var AlbumGetContent = function(albumID, fnToCall, fnParam1, fnParam2) {

      var albumIdx = NGY2Item.GetIdx(G, albumID);
      var url = '';
      var kind = 'image';
        // photos
        if( G.O.photoset.toUpperCase() == 'NONE' || G.O.album.toUpperCase() == 'NONE' ) {
          // get photos from full photostream
          url = Flickr.url() + "?&method=flickr.people.getPublicPhotos&api_key=" + Flickr.ApiKey + "&user_id="+G.O.userID+"&extras=description,views,tags,url_o,url_sq,url_t,url_q,url_s,url_m,url_z,url_b,url_h,url_k&per_page=500&format=json";
        }
        else
          if( G.I[albumIdx].GetID() == 0 ) {
          // retrieve the list of albums
          url = Flickr.url() + "?&method=flickr.photosets.getList&api_key=" + Flickr.ApiKey + "&user_id="+G.O.userID+"&per_page=500&primary_photo_extras=tags,url_o,url_sq,url_t,url_q,url_s,url_m,url_l,url_z,url_b,url_h,url_k&format=json";
          kind='album';
        }
          else {
            // photos from one specific photoset
            url = Flickr.url() + "?&method=flickr.photosets.getPhotos&api_key=" + Flickr.ApiKey + "&photoset_id="+G.I[albumIdx].GetID()+"&extras=description,views,tags,url_o,url_sq,url_t,url_q,url_s,url_m,url_l,url_z,url_b,url_h,url_k&format=json";
          }

      if( G.O.debugMode ) { console.log('Flickr URL: ' + url); }
          
      PreloaderDisplay(true);
      jQuery.ajaxSetup({ cache: false });
      jQuery.support.cors = true;
      
      var tId = setTimeout( function() {
        // workaround to handle JSONP (cross-domain) errors
        PreloaderDisplay(false);
        NanoAlert(G, 'Could not retrieve AJAX data...');
      }, 60000 );
      
      var sourceData=[];

      // Process the downloaded data
      var FlickrGetDone = function() {
        clearTimeout(tId);
        PreloaderDisplay(false);
        
        if( kind == 'album' ) {
          FlickrParsePhotoSets(albumIdx, albumID, sourceData);
        }
        else {
          FlickrParsePhotos(albumIdx, albumID, sourceData);
        }
        
        AlbumPostProcess(albumID);
        if( fnToCall !== null &&  fnToCall !== undefined) {
          fnToCall( fnParam1, fnParam2, null );
        }
      }
      
      // download one page of data (=500 entries)
      var FlickrGetOnePage = function( url, page ) {
        jQuery.getJSON( url + '&page=' + page + '&jsoncallback=?', function(data, status, xhr) {

          var pages=0;
          if( kind == 'album' ) {
            if( data.stat !== undefined && data.stat === 'fail' ) {
              NanoAlert(G, "Could not retrieve Flickr album list: " + data.message + " (code: "+data.code+").");
              return false;
            }
            sourceData=sourceData.concat(data.photosets.photoset);
            pages=data.photosets.pages;
          }
          else {
            if( G.O.photoset.toUpperCase() == 'NONE' || G.O.album.toUpperCase() == 'NONE' ) {
              // content of full photoset
              sourceData=sourceData.concat(data.photos.photo);
              pages=data.photos.pages;
            }
            else {
              // content of one album
              if( data.stat !== undefined && data.stat === 'fail' ) {
                NanoAlert(G, "Could not retrieve Flickr album: " + data.message + " (code: "+data.code+").");
                return false;
              }
              if( G.I[albumIdx].title == '' ) {
                G.I[albumIdx].title=data.photoset.title;
              }
              sourceData=sourceData.concat(data.photoset.photo);
              pages=data.photoset.pages;
            }
            
          }
          
          if( pages > page ) {
            FlickrGetOnePage(url, page+1);
          }
          else {
            FlickrGetDone();
          }
        })
        .fail( function(jqxhr, textStatus, error) {
          clearTimeout(tId);
          PreloaderDisplay(false);
          NanoAlert(G, "Could not retrieve Flickr ajax data: " + textStatus + ', ' + error);
        });

      }
      
      FlickrGetOnePage(url, 1);
      
    }


    
    // -----------
    // Retrieve items for one Flickr photoset
    function FlickrParsePhotos( albumIdx, albumID, source ) {

      if( G.O.debugMode ) { 
        console.log('Flickr parse photos:');
        console.dir(source);    
      }
      
      jQuery.each(source, function(i,item){

        var itemID = item.id;

        // get the title
        var itemTitle = item.title;
        if( G.O.thumbnailLabel.get('title') != '' ) {
          itemTitle=GetImageTitleFromURL(imgUrl);
        }

        // get the description
        var itemDescription=item.description._content;
        
        // retrieve the image size with highest ravailable esolution
        var imgUrl=item.url_sq;  //fallback size
        var imgW=75, imgH=75;
        var start=Flickr.photoAvailableSizesStr.length-1;
        if( G.O.flickrSkipOriginal ) { start--; }
        for(var i = start; i>=0 ; i-- ) {
          if( item['url_'+Flickr.photoAvailableSizesStr[i]] != undefined ) {
            imgUrl=item['url_'+Flickr.photoAvailableSizesStr[i]];
            imgW=parseInt(item['width_'+Flickr.photoAvailableSizesStr[i]]);
            imgH=parseInt(item['height_'+Flickr.photoAvailableSizesStr[i]]);
            break;
          }
        }

        var sizes = {};
        for (var p in item) {
          if( p.indexOf('height_') == 0 || p.indexOf('width_') == 0 || p.indexOf('url_') == 0 ) {
            sizes[p]=item[p];
          }
        }
        
        // tags
        var tags = item.tags !== undefined ? item.tags : '';

        // create item
        var newItem=NGY2Item.New( G, itemTitle, itemDescription, itemID, albumID, 'image', tags );

        // add image
        newItem.src=imgUrl;
        newItem.imageWidth=imgW;
        newItem.imageHeight=imgH;

        // add thumbnails
        var tn = {
          url:    { l1 : { xs:'', sm:'', me:'', la:'', xl:'' }, lN : { xs:'', sm:'', me:'', la:'', xl:'' } },
          width:  { l1 : { xs:0, sm:0, me:0, la:0, xl:0 }, lN : { xs:0, sm:0, me:0, la:0, xl:0 } },
          height: { l1 : { xs:0, sm:0, me:0, la:0, xl:0 }, lN : { xs:0, sm:0, me:0, la:0, xl:0 } }
        };
        tn=FlickrRetrieveImages(tn, item, 'l1' );
        tn=FlickrRetrieveImages(tn, item, 'lN' );
        newItem.thumbs=tn;

      });
      G.I[albumIdx].contentIsLoaded=true;
      
    }    


    
    // -----------
    // Retrieve the list of Flickr photosets
    function FlickrParsePhotoSets( albumIdx, albumID, source ) {

      if( G.O.debugMode ) { 
        console.log('Flickr parse list of albums:');
        console.dir(source);    
      }

      jQuery.each(source, function(i,item){
        //Get the title
        var itemTitle = item.title._content;

        if( FilterAlbumName(itemTitle, item.id) ) {
          var itemID=item.id;
          //Get the description
          var itemDescription = item.description._content != undefined ? item.description._content : '';

          var sizes = {};
          for (var p in item.primary_photo_extras) {
            sizes[p]=item.primary_photo_extras[p];
          }
          var tags='';
          if( item.primary_photo_extras !== undefined ) {
            if( item.primary_photo_extras.tags !== undefined ) {
              tags=item.primary_photo_extras.tags;
            }
          }
        
          var newItem=NGY2Item.New( G, itemTitle, itemDescription, itemID, albumID, 'album', tags );
          newItem.numberItems=item.photos;
          newItem.thumbSizes=sizes;
          
          var tn = {
            url:    { l1 : { xs:'', sm:'', me:'', la:'', xl:'' }, lN : { xs:'', sm:'', me:'', la:'', xl:'' } },
            width:  { l1 : { xs:0, sm:0, me:0, la:0, xl:0 }, lN : { xs:0, sm:0, me:0, la:0, xl:0 } },
            height: { l1 : { xs:0, sm:0, me:0, la:0, xl:0 }, lN : { xs:0, sm:0, me:0, la:0, xl:0 } }
          };
          tn=FlickrRetrieveImages(tn, item.primary_photo_extras, 'l1' );
          tn=FlickrRetrieveImages(tn, item.primary_photo_extras, 'lN' );
          newItem.thumbs=tn;
          
        }
      });
      
      G.I[albumIdx].contentIsLoaded=true;
    }

    function FlickrRetrieveImages(tn, item, level ) {

      var sf=1;
      if( G.tn.opt[level].crop === true ) {
        sf=G.O.thumbnailCropScaleFactor;
      }
    
    
      var sizes=['xs','sm','me','la','xl'];
      for(var i=0; i<sizes.length; i++ ) {
        if( G.tn.settings.width[level][sizes[i]] == 'auto' || G.tn.settings.width[level][sizes[i]] == '' ) {
          var sdir='height_';
          var tsize=Math.ceil(G.tn.settings.height[level][sizes[i]]*G.tn.scale*sf);
          var one=FlickrRetrieveOneImage(sdir, tsize, item );
          tn.url[level][sizes[i]]=one.url;
          tn.width[level][sizes[i]]=one.width;
          tn.height[level][sizes[i]]=one.height;
        }
        else 
          if( G.tn.settings.height[level][sizes[i]] == 'auto' || G.tn.settings.height[level][sizes[i]] == '' ) {
            var sdir='width_';
            var tsize=Math.ceil(G.tn.settings.width[level][sizes[i]]*G.tn.scale*sf);
            var one=FlickrRetrieveOneImage(sdir, tsize, item );
            tn.url[level][sizes[i]]=one.url;
            tn.width[level][sizes[i]]=one.width;
            tn.height[level][sizes[i]]=one.height;
          }
          else {
            var sdir='height_';
            var tsize=Math.ceil(G.tn.settings.height[level][sizes[i]]*G.tn.scale*sf);
            if( G.tn.settings.width[level][sizes[i]] > G.tn.settings.height[level][sizes[i]] ) {
              sdir='width_';
              tsize=Math.ceil(G.tn.settings.width[level][sizes[i]]*G.tn.scale*sf);
            }
            var one=FlickrRetrieveOneImage(sdir, tsize, item );
            tn.url[level][sizes[i]]=one.url;
            tn.width[level][sizes[i]]=one.width;
            tn.height[level][sizes[i]]=one.height;
          }
      }
      return tn;
    }
    
    function FlickrRetrieveOneImage(sdir, tsize, item ) {
      var one={ url: '', width: 0, height: 0 };
      var tnIndex=0;
      for(var j=0; j < Flickr.thumbAvailableSizes.length; j++ ) {
        var size=item[sdir+Flickr.photoAvailableSizesStr[j]];
        if( size != undefined ) {
          tnIndex=j;
          if( size >= tsize ) {
            break;
          }
        }
      }
      var fSize=Flickr.photoAvailableSizesStr[tnIndex];
      one.url = item['url_'+fSize];
      one.width = parseInt(item['width_'+fSize]);
      one.height = parseInt(item['height_'+fSize]);
      return one;
    }    

    
    /** @function GetHiddenAlbums */
    var GetHiddenAlbums = function( hiddenAlbums, callback ){
      // not supported -> doesn't exit in Flickr
      callback();     
    }

    // -----------
    // Initialize thumbnail sizes
    function Init() {
      return;
    }


    // shortcuts to NGY2Tools functions (with context)
    var PreloaderDisplay = NGY2Tools.PreloaderDisplay.bind(G);
    var NanoAlert = NGY2Tools.NanoAlert;
    var GetImageTitleFromURL = NGY2Tools.GetImageTitleFromURL.bind(G);
    var FilterAlbumName = NGY2Tools.FilterAlbumName.bind(G);
    var AlbumPostProcess = NGY2Tools.AlbumPostProcess.bind(G);

    // Flickr image sizes
    // var sizeImageMax=Math.max(window.screen.width, window.screen.height);
    // if( window.devicePixelRatio != undefined ) {
    //  if( window.devicePixelRatio > 1 ) {
    //    sizeImageMax=sizeImageMax*window.devicePixelRatio;
    //  }
    //}
    // if( !G.O.flickrSkipOriginal ) {
    //  Flickr.photoAvailableSizes.push(10000);
    //  Flickr.photoAvailableSizesStr.push('o');
    //}
    // for( i=0; i<Flickr.photoAvailableSizes.length; i++) {
    //  Flickr.photoSize=i; //Flickr.photoAvailableSizesStr[i];
    //  if( sizeImageMax <= Flickr.photoAvailableSizes[i] ) {
    //    break;
    //  }
    //}

    switch( fnName ){
      case 'GetHiddenAlbums':
        var hiddenAlbums = arguments[2],
        callback = arguments[3];
        GetHiddenAlbums(hiddenAlbums, callback);
        break;
      case 'AlbumGetContent':
        var albumID = arguments[2],
        callback = arguments[3],
        cbParam1 = arguments[4],
        cbParam2 = arguments[5];
        AlbumGetContent(albumID, callback, cbParam1, cbParam2);
        break;
      case 'Init':
        Init();
        break;
      case '':
        break;
      case '':
        break;
    }

  };
  
// END FLICKR DATA SOURCE FOR NANOGALLERY2
}( jQuery ));
  
  
  
