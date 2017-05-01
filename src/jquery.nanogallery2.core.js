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
 *  - webfont generated with http://fontello.com - based on Font Awesome Copyright (C) 2012 by Dave Gandy (http://fortawesome.github.com/Font-Awesome/)
 *  - ICO online converter: https://iconverticons.com/online/
 */

/*

v1.n.alpha - do not use
- new: ImagesLoaded now in version 4.1.1
- fixed: old Picasa albums not retrieved (for data before 09/02/2017)
- new: thumbnailDisplayTransition 'slideUp' and 'slideDown': distance can be defined (example: 'slideUp_200')
- new: thumbnailDisplayTransition 'flipDown' (and 'flipDown_N'), 'flipUp (and 'flipUp_N'), 'slideUp2' (and 'slideUp2_N'), 'slideDown2' (and 'slideDown2_N'), 'slideRight' (and 'slideRight_N'), 'slideLeft' (and 'slideLeft_N')
- new: fnThumbnailL1DisplayEffect, thumbnailL1DisplayTransition, thumbnailL1DisplayTransitionDuration, thumbnailL1DisplayInterval
- new: share to VK.com
- fixed: share to Google+
- fixed: #37 Error using custom colors for colorSchemeViewer breaks nanoGallery2

TODO:
- locationHash on false -> remove share?

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
    _this.$e = jQuery(elt);
    _this.e = elt;

    // Add a reverse reference to the DOM object
    _this.$e.data('nanogallery2data', _this);

    _this.init = function () {
  
      // define these global objects only once per HTML page
      if (typeof window.NGY2Item === 'undefined') {
  
        window.NGY2Tools = (function () {

          function NGY2Tools() {
            var nextId = 1;                   // private static --> all instances
          }

          //+ Jonas Raoni Soares Silva
          //@ http://jsfromhell.com/array/shuffle [v1.0]
          NGY2Tools.AreaShuffle = function (o) {
            for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
            return o;
          };

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

          
          /** @function GetImageTitleFromURL() */
          /* retrieve filemane */
          NGY2Tools.GetImageTitleFromURL = function(imageSRC) {
            if( this.O.thumbnailLabel.get('title') == '%filename' ) {
              return (imageSRC.split('/').pop()).replace('_',' ');
            }
            
            if( this.O.thumbnailLabel.get('title') == '%filenameNoExt' ) {
              var s=imageSRC.split('/').pop();
              return (s.split('.').shift()).replace('_',' ');
            }
            return imageSRC;
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
              if( instance.O.thumbnailLevelUp && album.getContentLength(false) == 0) {
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
            if( instance.galleryFilterTags.Get() != false ) {
              if( instance.galleryFilterTags.Get() == true ) {
                if( tags != '' && tags != undefined ) {
                  // use set tags
                  item.setTags(tags.split(' '));
                }
              }
              else {
                // extract tags starting with # (in title)
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
            }
            
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
              tnImg.src=this.G.emptyGif;
              tnImg.url=this.G.emptyGif;
              return tnImg;
            }
            tnImg.src=this.thumbs.url[this.G.GOM.curNavLevel][this.G.GOM.curWidth];
            tnImg.width=this.thumbs.width[this.G.GOM.curNavLevel][this.G.GOM.curWidth];
            tnImg.height=this.thumbs.height[this.G.GOM.curNavLevel][this.G.GOM.curWidth];
            return tnImg;
          };
          
          //--- Set tags to items and add these tags to the album
          NGY2Item.prototype.setTags = function( tags ) {              
          if( tags.length > 0 ) {
              this.tags=tags;
              var lstTags=this.album().albumTagList;
              for( var i=0; i<tags.length; i++ ) {
                var tfound=false;
                for( var j=0; j<lstTags.length; j++ ) {
                  if( tags[i].toUpperCase() == lstTags[j].toUpperCase() ) {
                    tfound=true;
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
              var found=false;
              var lstTags=this.album().albumTagListSel;
              for( var i=0; i<this.tags.length; i++ ) {
                for( var j=0; j<lstTags.length; j++ ) {
                  if( this.tags[i].toUpperCase() == lstTags[j].toUpperCase() ) {
                    found=true;
                    break;
                  }
                }
              }
              return found;
            }
            else
              return true;
          };
          
          //--- returns the number of items of the current album
          //--- count using tags filter
          NGY2Item.prototype.getContentLength = function( filterTags ) {
            if( filterTags == false || this.albumTagList.length == 0 || this.G.galleryFilterTags.Get() == false ) {
              return this.contentLength;
            }
            else {
              var l=this.G.I.length;
              var cnt=0;
              var albumID=this.GetID();
              for( var idx=0; idx<l; idx++ ) {
                var item=this.G.I[idx];
                if( item.albumID == albumID && item.checkTagFilter() && item.isSearchFound() ) {
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
          
          
          // In case of thumbnails with stacks - apply a percent to a value which include a unit
          function ValueApplyPercent( str, percent ) {
            str=String(str);
            if( str === '0' || percent == 1 ) { return str; }
            var n=Number(str.replace(/[a-zA-Z]/g, ''));
            var ar= str.match(/([^\-0-9\.]+)/g);
            var a='';
            if( ar != null && ar.length > 0 ) {
              a=ar.join();
            }
             
            if( isNaN(n) || n == 0 ) {
              return str;
            }

            n=n*percent;
            return n+a;
          } 
          
          //--- 2D/3D css transform - apply the cached value to element
          NGY2Item.prototype.CSSTransformApply = function ( eltClass ) {
            var obj=this.eltTransform[eltClass];

            if( eltClass == '.nGY2GThumbnail' ) {
              // thumbnail
              var nbStacks=obj.$elt.length-1;
              var pTranslateX=1;
              var pTranslateY=1;
              var pTranslateZ=1;
              var pRotateX=1;
              var pRotateY=1;
              var pRotateZ=1;
              var pScale=1;
              for( var n=nbStacks; n>=0; n-- ) {
                // units must be given with
                var v = 'translateX('+ValueApplyPercent(obj.translateX,pTranslateX)+') translateY('+ValueApplyPercent(obj.translateY,pTranslateY)+') translateZ('+ValueApplyPercent(obj.translateZ,pTranslateZ)+') scale('+ValueApplyPercent(obj.scale,pScale)+')';
                if( !(this.G.IE <= 9) && !this.G.isGingerbread ) {
                  v += ' rotateX('+ValueApplyPercent(obj.rotateX,pRotateX)+') rotateY('+ValueApplyPercent(obj.rotateY,pRotateY)+') rotateZ('+ValueApplyPercent(obj.rotateZ,pRotateZ)+')';
                }
                else {
                  v += ' rotate('+ValueApplyPercent(obj.rotateZ,pRotateZ)+')';
                }
                obj.$elt[n].style[this.G.CSStransformName]= v;
                
                if( nbStacks > 0 ) {
                  // apply a percent to the stack elements
                  pTranslateX-=this.G.tn.opt.Get('stacksTranslateX');
                  pTranslateY-=this.G.tn.opt.Get('stacksTranslateY');
                  pTranslateZ-=this.G.tn.opt.Get('stacksTranslateZ');
                  pRotateX-=this.G.tn.opt.Get('stacksRotateX');
                  pRotateY-=this.G.tn.opt.Get('stacksRotateY');
                  pRotateZ-=this.G.tn.opt.Get('stacksRotateZ');
                  pScale-=this.G.tn.opt.Get('stacksScale');
                }
              }
            }
            else {
              // thumbnail sub element
              if( obj.$elt[0] != undefined ) {
                // units must be given with
                var v = 'translateX('+obj.translateX+') translateY('+obj.translateY+') translateZ('+obj.translateY+') scale('+obj.scale+')';
                if( !(this.G.IE <= 9) && !this.G.isGingerbread ) {
                  v += ' rotateX('+obj.rotateX+') rotateY('+obj.rotateY+') rotateZ('+obj.rotateZ+')';
                }
                else {
                  v += ' rotate('+obj.rotateZ+')';
                }
                obj.$elt[0].style[this.G.CSStransformName]= v;
              }
            }
          };

          //--- 2D/3D css transform - set a value in cache
          NGY2Item.prototype.CSSTransformSet = function ( eltClass, transform, value ) {
            if( this.eltTransform[eltClass] == undefined ) {
              this.eltTransform[eltClass]={ translateX: 0, translateY: 0, translateZ: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1 };
              this.eltTransform[eltClass].$elt=this.$getElt(eltClass);
            }
            this.eltTransform[eltClass][transform]=value;
          };

          //--- CSS Filters - apply the cached value to element
          NGY2Item.prototype.CSSFilterApply = function ( eltClass ) {
            var obj=this.eltFilter[eltClass];
            var v = 'blur('+obj.blur+') brightness('+obj.brightness+') grayscale('+obj.grayscale+') sepia('+obj.sepia+') contrast('+obj.contrast+') opacity('+obj.opacity+') saturate('+obj.saturate+')';
            if( obj.$elt != null && obj.$elt[0] != undefined ) {
              obj.$elt[0].style.WebkitFilter= v;
              obj.$elt[0].style.filter= v;
            }
          };

          //--- CSS Filters - set a value in cache
          NGY2Item.prototype.CSSFilterSet = function ( eltClass, filter, value ) {
            if( this.eltFilter[eltClass] == undefined ) {
              this.eltFilter[eltClass]={ blur:0, brightness:'100%', grayscale:'0%', sepia:'0%', contrast:'100%', opacity:'100%', saturate:'100%' };
              this.eltFilter[eltClass].$elt=this.$getElt(eltClass);
            }
            this.eltFilter[eltClass][filter]=value;
          };

          //--- thumbnail hover animation
          NGY2Item.prototype.animate = function ( effect, delay, hoverIn ) {
            if( this.$getElt() == null  ) { return; }

            var context={};
            context.G=this.G;
            context.item=this;
            context.effect=effect;
            context.hoverIn=hoverIn;
            context.cssKind='';
            if( hoverIn ) {
              // HOVER IN
              
              if( this.eltEffect[effect.element] == undefined ) {
                this.eltEffect[effect.element]=[];
              }
              if( this.eltEffect[effect.element][effect.type] == undefined ) {
                this.eltEffect[effect.element][effect.type]= { initialValue: 0, lastValue: 0 };
              }
              if( effect.firstKeyframe ) {
                // store initial and current value -> for use in the back animation
                this.eltEffect[effect.element][effect.type]= { initialValue: effect.from, lastValue: effect.from};
              }
              
              context.animeFrom=effect.from;
              context.animeTo=effect.to;
              context.animeDuration=parseInt(effect.duration);
              context.animeDelay=30+parseInt(effect.delay+delay);  // 30ms is a default delay to avoid conflict with other initializations
              context.animeEasing=effect.easing;
            }
            else {
              // HOVER OUT
              if( effect.firstKeyframe ) {
                context.animeFrom=this.eltEffect[effect.element][effect.type].lastValue;
                context.animeTo=this.eltEffect[effect.element][effect.type].initialValue;
                // context.animeTo=effect.from;
              }
              else {
                // context.animeFrom=effect.from;
                context.animeFrom=this.eltEffect[effect.element][effect.type].lastValue;
                context.animeTo=this.eltEffect[effect.element][effect.type].initialValue;
                // context.animeTo=effect.to;
                
              }
              
              context.animeDuration=parseInt(effect.durationBack);
              context.animeDelay=30+parseInt(effect.delayBack+delay);   // 30ms is a default delay to avoid conflict with other initializations
              context.animeEasing=effect.easingBack;
            }

            // detect if animation on CSS transform
            var transform=['translateX', 'translateY', 'translateZ', 'scale', 'rotateX', 'rotateY', 'rotateZ'];
            for( var i=0; i<transform.length; i++ ) {
              if( effect.type == transform[i] ) {
                context.cssKind='transform';
                break;
              }
            }

            // detect if animation on CSS filter
            var filter=['blur', 'brightness', 'grayscale', 'sepia', 'contrast', 'opacity', 'saturate'];
            for( var i=0; i<filter.length; i++ ) {
              if( effect.type == filter[i] ) {
                context.cssKind='filter';
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
                    att.item.CSSTransformApply(att.effect.element );
                    break;
                  case 'filter':
                    att.item.CSSFilterSet(att.effect.element, att.effect.type, state.v);
                    att.item.CSSFilterApply(att.effect.element );
                    break;
                  default:
                    var v=state.v;
                    if( state.v.substring(0,3) == 'rgb(' || state.v.substring(0,5) == 'rgba(' ) {
                      // to remove values after the dot (not supported by RGB/RGBA)
                      v=tinycolor(state.v).toRgbString();
                    }
                    att.item.$getElt(att.effect.element).css(att.effect.type, v);
                    break;
                }
                if( hoverIn ) {
                  // store value for back animation
                  att.item.eltEffect[att.effect.element][att.effect.type].lastValue= state.v;
                }
              },
              
              finish: function (state, att) {
                if( hoverIn ) {
                  // store value for back animation
                  att.item.eltEffect[att.effect.element][att.effect.type].lastValue= state.v;
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
    jsonCharset:                  'Latin',
    jsonProvider:                 '',
    allowHTMLinData:              false,
    locationHash :                true,
    slideshowDelay :              3000,
    slideshowAutoStart :          false,

    debugMode: false,

    galleryDisplayMoreStep :      2,
    galleryDisplayMode :          'fullContent',
    galleryL1DisplayMode :        null,
    galleryPaginationMode :       'rectangles',   // 'dots', 'rectangles', 'numbers'
    galleryMaxRows :              2,
    galleryL1MaxRows :            null,
    galleryLastRowFull:           false,
    galleryLayoutEngine :         'default',
    paginationSwipe:              true,
    paginationVisiblePages :      10,
    paginationSwipeSensibilityVert : 10,
    galleryFilterTags :           false,    // possible values: false, true, 'title', 'description'
    galleryL1FilterTags :         null,     // possible values: false, true, 'title', 'description'
    galleryMaxItems :             0,        // maximum number of items per album  --> only flickr, google+, nanophotosprovider
    galleryL1MaxItems :           null,     // maximum number of items per gallery page --> only flickr, google+, nanophotosprovider
    gallerySorting :              '',
    galleryL1Sorting :            null,
    galleryResizeAnimation :      true,

    thumbnailCrop :               true,
    thumbnailCropScaleFactor :    1.5,
    thumbnailLevelUp :            false,
    thumbnailAlignment :          'center',
    thumbnailWidth :              300,
    thumbnailHeight :             200,
    thumbnailGutterWidth :        2,
    thumbnailGutterHeight :       2,
    thumbnailBorderVertical :     2,
    thumbnailBorderHorizontal :   2,
    thumbnailFeaturedKeyword :    '*featured',
    thumbnailAlbumDisplayImage :  false,
    thumbnailHoverEffect2 :       'toolsAppear',
    thumbnailBuildInit2 :         '',
    thumbnailStacks :             0,
    thumbnailStacksTranslateX :   0,
    thumbnailStacksTranslateY :   0,
    thumbnailStacksTranslateZ :   0,
    thumbnailStacksRotateX :      0,
    thumbnailStacksRotateY :      0,
    thumbnailStacksRotateZ :      0,
    thumbnailStacksScale :        0,
    thumbnailDisplayOutsideScreen: false,
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
    thumbnailDisplayTransition :  'fadeIn',
    thumbnailDisplayTransitionDuration: 240,
    thumbnailOpenImage :          true,
    thumbnailOpenOriginal :       false,
    thumbnailGlobalImageTitle :   '',
    thumbnailGlobalAlbumTitle :   '',
    
    viewer :                      'internal',
    viewerFullscreen:             false,
    viewerDisplayLogo :           false,
    imageTransition :             'swipe',
    viewerZoom :                  true,
    openOnStart :                 '',
    viewerToolbar : {
      display :                   true,
      position :                  'bottomOverImage',
      fullWidth :                 true,
      align :                     'center',
      autoMinimize :              0,
      standard :                  'minimizeButton,label',
      minimized :                 'minimizeButton,label,infoButton,downloadButton,linkOriginalButton,fullscreenButton'
    },
    viewerTools : {
      topLeft :                   'pageCounter,playPauseButton',
      topRight :                  'zoomButton,shareButton,closeButton' 
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
      navigationFilterUnselected:   '<i style="color:#aaa;" class="nGY2Icon icon-toggle-off"></i>',
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
        case 'search':
          nG2.Search(option);
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
          if(typeof nG2.O.fnShoppingCartUpdated === 'function'){
            nG2.O.fnShoppingCartUpdated(nG2.shoppingCart);
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
          if(typeof nG2.O.fn   === 'function'){
            nG2.O.fnShoppingCartUpdated(nG2.shoppingCart);
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
      
      var albumID=G.I[albumIdx].GetID();

      // unselect everything & remove link to album (=logical delete)
      var l=G.I.length;
      for( var i=0; i < l ; i++ ) {
        var item=G.I[i];
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
      var l=items.length;
      for( var j=0; j<l ; j++) {
        ThumbnailSelectionSet(items[j], value);
      }
    };
    
    /**
     * Returns an array of selected items
     * @returns {Array}
     */
    this.ItemsSelectedGet = function(){
      var selectedItems=[];
      var l=G.I.length;
      for( var i=0; i < l ; i++ ) {
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
     * Search in the displayed gallery (in thumbnails title)
     */
    this.Search = function( search) {
      G.GOM.albumSearch=search.toUpperCase();
      GalleryRender( G.GOM.albumIdx );
    };
    
    /**
     * Destroy the current gallery
     */
    this.Destroy = function(){
      // alert('destroy');
      // var event = new Event('build');
      if( G.GOM.hammertime != null ) {
        G.GOM.hammertime.destroy();
        G.GOM.hammertime=null;
      }
      // G.GOM.userEvents.RemoveEvtListener();
      // G.GOM.userEvents=null;
      // G.VOM.userEvents.RemoveEvtListener();
      // G.VOM.userEvents=null;
      if( G.VOM.hammertime != null ) {
        G.VOM.hammertime.destroy();
        G.VOM.hammertime=null;
      }
      //ThumbnailHoverReInitAll();  
      
      // color scheme
      $('#ngycs_'+G.baseEltID).remove()
      
      G.GOM.items=[];
      G.GOM.navigationBar.$newContent=null;
      G.$E.base.empty();
      G.$E.base.removeData();

      jQuery(window).off('resize.nanogallery2.'+G.baseEltID);
      jQuery(window).off('scroll.nanogallery2.'+G.baseEltID);
      
      
    };
    
    
    
    // throttle()
    // author: underscore.js - http://underscorejs.org/docs/underscore.html
    // Returns a function, that, when invoked, will only be triggered at most once during a given window of time.
    // Normally, the throttled function will run as much as it can, without ever going more than once per wait duration;
    // but if youd like to disable the execution on the leading edge, pass {leading: false}.
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

    /*
    ** Global data for this nanoGALLERY instance
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
        l1:0, lN:0,
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
    G.supportFullscreenAPI =      false;
    G.i18nLang =                  '';
    G.timeLastTouchStart =        0;
    G.custGlobals =               {};
    
    //------------------------
    //--- Gallery Object Model
    G.GOM = {
      albumIdx :                  -1, // index (in G.I) of the currently displayed album
      clipArea :                  { top:0, height: 0 }, // area of the GOM to display on screen
      displayArea :               { width: 0 , height: 0 }, // size of the GOM area
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
        containerOffset:          null },
      nbSelected :                0, // number of selected items
      pagination :                { currentPage: 0 }, // pagination data
      lastFullRow :               -1, // number of the last row without holes
      lastDisplayedIdx:           -1, // used to display the counter of not displayed items
      displayInterval :           { from: 0, len: 0 },
      userEvents:                 null,
      hammertime:                 null,
      curNavLevel:                'l1',   // current navigation level (l1 or LN)
      curWidth:                   'me',
      albumSearch:                '',     // current search string (used to filter the thumbnails on screen)
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
      currentZoom:                1,
      isZooming:                  false,
      padding:                    { H:0, V:0 }, // padding for the image
      window:                     { lastWidth:0, lastHeight:0 },
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
      Item: function(idx) {
        return G.I[this.items[idx].imageIdx];
      },
      userEvents:                 null,   // user events management
      hammertime:                 null,
      swipePosX:                  0,
      panPosX:                    0,      // manual pan position
      panPosY:                    0,
      zoomPosX:                   0,      // position to center zoom in/out
      zoomPosY:                   0,
      colorSchemeLabel:           '',
      timeImgChanged:             0
    }
    // One VOM item (image)
    function VImg(index) {
      this.imageIdx = index;
      this.imageNumber = 0;
    }
    
    //------------------------
    //--- popup
    G.popup = {
      isDisplayed:  false,
      $elt:         null,
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
      navigationBreadcrumb :  { background: '#111', color: '#fff', colorHover: '#ccc', borderRadius: '6px' },
      navigationFilter :      { color: '#ddd', background: '#111', colorSelected: '#fff', backgroundSelected: '#111', borderRadius: '6px' },
      thumbnail :             { background: '#000', borderColor: '#000', labelOpacity : 1, labelBackground: 'rgba(34, 34, 34, 0)', titleColor: '#fff', titleBgColor: 'transparent', titleShadow: '', descriptionColor: '#ccc', descriptionBgColor: 'transparent', descriptionShadow: '', stackBackground: '#aaa' },
      thumbnailIcon :         { padding: '5px', color: '#fff' },
      pagination :            { background: '#111', backgroundSelected: '#666', color: '#fff', borderRadius: '4px', shapeBorder: '3px solid #666', shapeColor: '#444', shapeSelectedColor: '#aaa'}
    };

    G.colorScheme_light = {
      navigationBar :         { background: 'none', borderTop: '', borderBottom: '', borderRight: '', borderLeft: '' },
      navigationBreadcrumb :  { background: '#eee', color: '#000', colorHover: '#333', borderRadius: '6px' },
      navigationFilter :      { background: '#eee', color: '#222', colorSelected: '#000', backgroundSelected: '#eee', borderRadius: '6px' },
      thumbnail :             { background: '#000', borderColor: '#000', labelOpacity : 1, labelBackground: 'rgba(34, 34, 34, 0)', titleColor: '#fff', titleBgColor: 'transparent', titleShadow: '', descriptionColor: '#ccc', descriptionBgColor: 'transparent', descriptionShadow: '', stackBackground: '#888' },
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
      var r={ albumID:'0', imageID:'0' };
      
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
          for(var i=0; i <nTags; i++ ) {
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
          GalleryDisplay( true );
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

      GalleryDisplay( true );
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
      GalleryDisplay( true );
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
      if( typeof G.O.fnGalleryRenderStart == 'function' ) {
        G.O.fnGalleryRenderStart(albumIdx);
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

      // scroll to top of the gallery if needed
      var wp=getViewport();
      var galleryOTop=G.$E.base.offset().top;
      if( galleryOTop < wp.t ) {
        jQuery('html, body').animate({scrollTop: galleryOTop}, 200);
      }

      // navigation toolbar (breadcrumb + tag filters)
      GalleryNavigationBar(albumIdx);
      
      if( G.GOM.firstDisplay ) {
        G.GOM.firstDisplay=false;
        GalleryRenderPart1( albumIdx );
      }
      else {
        var hideNavigationBar=false;
        if( G.GOM.navigationBar.$newContent.children().length == 0 ) {
          hideNavigationBar=true;
        }

        // hide everything
        var tweenable = new NGTweenable();
        tweenable.tween({
          from: { 'opacity': 1 },
          to: { 'opacity': 0 },
          duration: 200,
          easing: 'easeInQuart',
          attachment: { h: hideNavigationBar },
          step: function (state, att) {
            G.$E.conTnParent.css({'opacity': state.opacity });
            if( att.h ) {
              G.$E.conNavigationBar.css({ 'opacity': state.opacity });
            }
          },
          finish: function (state, att) {
            G.$E.conTnParent.css({'opacity': 0});
            if( att.h ) {
              G.$E.conNavigationBar.css({ 'opacity': 0, 'display': 'none' });
            }
            GalleryRenderPart1( albumIdx );
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
          from:     { 'opacity': 0 },
          to:       { 'opacity': 1 },
          duration: 200,
          easing:   'easeInQuart',
          step: function (state, att) {
            G.$E.conNavigationBar.css({ 'opacity': state.opacity });
          },
          finish: function (state, att) {
            G.$E.conNavigationBar.css({ 'opacity': 1 });
          }
        });
      }

      // display gallery
      GalleryRenderPart2( albumIdx );
    }
    
    // Gallery render part 2 -> remove all thumbnails
    function GalleryRenderPart2(albumIdx) {
      G.GOM.lastZIndex = parseInt(G.$E.base.css('z-index'));
      if( isNaN(G.GOM.lastZIndex) ) {
        G.GOM.lastZIndex=0;
      }
      G.$E.conTnParent.css({'opacity': 0 });
      // G.$E.conTn.hide(0).off().show(0).html('');
      // G.$E.conTn.off().html('');
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
      }

      G.$E.conTn.css( G.CSStransformName , 'translateX('+0+'px)');
      G.$E.conTnParent.css({ left: 0, opacity: 1 });

      GalleryRenderPart3(albumIdx);

    }
    
    // Gallery render part 2 -> start building the new gallery
    function GalleryRenderPart3(albumIdx) {
      var d=new Date();      
      
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
      if( typeof G.O.fnGalleryRenderEnd == 'function' ) {
        G.O.fnGalleryRenderEnd(albumIdx);
      }
      
      // Step 1: populate GOM
      if( GalleryPopulateGOM() ) {
      
        // step 2: calculate layout
        GallerySetLayout();

        // step 3: display gallery
        GalleryDisplay( false );
        G.galleryResizeEventEnabled=true;
      }
      else {
        G.galleryResizeEventEnabled=true;
      }
      
      if( G.O.debugMode ) {
        console.log('GalleryRenderPart3: '+ (new Date()-d));
      }

    }
    
    
    // Resize the gallery
    function GalleryResize( GOMidx ) {
      var d=new Date();
      G.galleryResizeEventEnabled=false;
      if( GallerySetLayout( GOMidx ) == false ) {
        G.galleryResizeEventEnabled=true;
        if( G.O.debugMode ) {
          console.log('GalleryResize1: '+ (new Date()-d));
        }
        return;
      }
      if( G.O.debugMode ) {
        console.log('GalleryResizeSetLayout: '+ (new Date()-d));
      }

      GalleryDisplay( false );

      // G.galleryResizeEventEnabled=true;
      if( G.O.debugMode ) {
        console.log('GalleryResizeFull: '+ (new Date()-d));
      }
    }
    
    
    
    // copy items (album content) to GOM
    function GalleryPopulateGOM() {
      // G.galleryResizeEventEnabled=false;
      
      var preloadImages='';
      var imageSizeRequested=false;
      //var nbTn=G.GOM.items.length;
      var albumID=G.I[G.GOM.albumIdx].GetID();
      var l=G.I.length;
      var cnt=0;

      for( var idx=0; idx<l; idx++ ) {
        var item=G.I[idx];
        // check album
        if( item.albumID == albumID && item.checkTagFilter() && item.isSearchFound() ) {
        var w=item.thumbImg().width;
          var h=item.thumbImg().height;
          // if unknown image size and layout is not grid --> we need to retrieve the size of the images
          if( G.layout.prerequisite.imageSize && ( w == 0 || h == 0) ) {
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

      // G.$E.base.trigger('galleryObjectModelBuilt.nanogallery2', new Event('galleryObjectModelBuilt.nanogallery2'));
      TriggerCustomEvent('galleryObjectModelBuilt');
      if( typeof G.O.fnGalleryObjectModelBuilt == 'function' ) {
        G.O.fnGalleryObjectModelBuilt();
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
    function GallerySetLayout( GOMidx ) {
      var r = true;
      // available area width
      var areaWidth=G.$E.conTnParent.width();
      G.GOM.displayArea={ width:0, height:0 };

      switch( G.layout.engine ) {
        case 'JUSTIFIED':
          r= GallerySetLayoutWidthtAuto( areaWidth, GOMidx );
          break;
        case 'CASCADING':
          r= GallerySetLayoutHeightAuto( areaWidth, GOMidx );
          break;
        case 'GRID':
        default:
          r= GallerySetLayoutGrid( areaWidth, GOMidx );
          break;
      }
      
      TriggerCustomEvent('galleryLayoutApplied');
      if( typeof G.O.fnGalleryLayoutApplied == 'function' ) {
        G.O.fnGalleryLayoutApplied();
      }
      return r;

    }
    
    
    //----- CASCADING LAYOUT
    function GallerySetLayoutHeightAuto( areaWidth, GOMidx ) {
      var areaW=G.$E.conTnParent.width(),
      curCol=0,
      curRow=0,
      colHeight=[],
      maxCol=NbThumbnailsPerRow(areaWidth),      //parseInt(areaW/G.tn.defaultFullWidth);
      gutterWidth=0,
      gutterHeight=G.tn.opt.Get('gutterHeight');

      var tnWidth=G.tn.defaultSize.getOuterWidth();
      var nbTn=G.GOM.items.length;

      if( G.O.thumbnailAlignment == 'justified' ) {
        maxCol=Math.min(maxCol,nbTn);
        gutterWidth=(maxCol==1?0:(areaWidth-(maxCol*tnWidth))/(maxCol-1));
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
    function GallerySetLayoutWidthtAuto( areaWidth, GOMidx ) {
      var curWidth=               0,
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
      
      var newTop=0;
      if( typeof GOMidx !== 'undefined' ) {
        // gallery hover effect
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
      
      G.GOM.displayArea.width=areaWidth;
      return true;
    }    
    

    //----- GRID LAYOUT
    function GallerySetLayoutGrid( areaWidth ) {
      var curPosX=      0,
      curPosY=          0,   
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
        for( var i=0; i < nbTn ; i++ ) {
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
    function GalleryDisplay( forceTransition ) {

      G.$E.conTn.css( G.CSStransformName , 'translateX('+0+'px)');

      var nbTn=G.GOM.items.length;
      G.GOM.itemsDisplayed=0;
      var threshold = 50;
      var cnt=0;    // counter for delay between each thumbnail display
      
      var vp=getViewport();
      G.GOM.cache.viewport=vp;

      var containerOffset=G.$E.conTnParent.offset();
      G.GOM.cache.containerOffset=containerOffset;

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
            var top=containerOffset.top+(curTn.top-G.GOM.clipArea.top);
            // var left=containerOffset.left+curTn.left;
            if( (top+curTn.height) >= (vp.t-threshold) && top <= (vp.t+vp.h+threshold) ) {
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
        GallerySetLayout();
        GalleryDisplay( forceTransition );
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
      }
      else {
        setTimeout(function() {
          // change value after the end of the display transistion of the newly built thumbnails
          G.galleryResizeEventEnabled=true;
        }, nbBuild * G.tn.opt.Get('displayInterval'));
      }
      
      // G.$E.base.trigger('galleryDisplayed.nanogallery2', new Event('galleryDisplayed.nanogallery2'));
      TriggerCustomEvent('galleryDisplayed');
    }
    
    
    // Thumbnail: set the new position
    function ThumbnailSetPosition( GOMidx, cnt ) {
      var newTop= 0;
      var curTn=  G.GOM.items[GOMidx];
      var idx=    G.GOM.items[GOMidx].thumbnailIdx;
      var item=   G.I[idx];
    
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
                  step:   function (state, att) {
                    att.$e.css(state);
                  },
                  finish: function (state, att) {
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
      newElt[newEltIdx++]='<div class="nGY2GThumbnail '+G.O.theme+'" style="display:block;visibility:hidden;position:absolute;top:-9999px;left:-9999px;" ><div class="nGY2GThumbnailSub">';
      if( G.O.thumbnailLabel.get('display') == true ) {
        // Labels: title and description
        newElt[newEltIdx++]= '  <div class="nGY2GThumbnailLabel" '+ G.tn.style.getLabel() +'>';
        newElt[newEltIdx++]= '    <div class="nGY2GThumbnailAlbumTitle" '+G.tn.style.getTitle()+'>aAzZjJ</div>';
        newElt[newEltIdx++]= '    <div class="nGY2GThumbnailDescription" '+G.tn.style.getDesc()+'>'+desc+'</div>';
        newElt[newEltIdx++]= '  </div>';
      }
      
      newElt[newEltIdx++]='</div></div>';
    
      // var $newDiv =jQuery(newElt.join('')).appendTo('body');
      var $newDiv =jQuery(newElt.join('')).appendTo(G.$E.conTn);
      var h=$newDiv.find('.nGY2GThumbnailLabel').outerHeight(true);
      $newDiv.remove();

      return h;
    }
    
    function ThumbnailBuildStacks () {
      var ns=G.tn.opt.Get('stacks');
      if( ns == 0 ) {
        return '';
      }
     
      var s='';
      for( var i=0; i<ns; i++ ) {
        s='<div class="nGY2GThumbnailStack " style="display:none;"></div>'+s;
      }
      return s;
    }
    
    //----- Build one UP thumbnail (=navigation thumbnail)
    function ThumbnailBuildAlbumpUp( item, idx, GOMidx ) {
      var newElt= [],
      newEltIdx=  0;
      
      newElt[newEltIdx++]=ThumbnailBuildStacks()+'<div class="nGY2GThumbnail" style="display:none;opacity:0;" >';
      newElt[newEltIdx++]='  <div class="nGY2GThumbnailSub">';

      var h=G.tn.defaultSize.getHeight(),
      w=G.tn.defaultSize.getWidth();

      newElt[newEltIdx++]='    <div class="nGY2GThumbnailImage" style="width:'+w+'px;height:'+h+'px;"><img class="nGY2GThumbnailImg" src="'+G.emptyGif+'" alt="" style="max-width:'+w+'px;max-height:'+h+'px;" ></div>';
      newElt[newEltIdx++]='    <div class="nGY2GThumbnailAlbumUp" style="width:'+w+'px;height:'+h+'px;">'+G.O.icons.thumbnailAlbumUp+'</div>';
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

      newElt[newEltIdx++]=ThumbnailBuildStacks()+'<div class="nGY2GThumbnail" style="display:none;opacity:0;"><div class="nGY2GThumbnailSub '+(G.O.thumbnailSelectable && item.selected?"nGY2GThumbnailSubSelected":"")+'">';
      
      var src=item.thumbImg().src,
      sTitle=getThumbnailTitle(item),
      sDesc=getTumbnailDescription(item);
      
      // image
      switch( G.layout.engine ) {
        case 'CASCADING':
          newElt[newEltIdx++]='<div class="nGY2GThumbnailImage" style="width:'+G.tn.settings.getW()+'px;"><img class="nGY2GThumbnailImg" src="'+src+'" alt="'+sTitle+'" style="max-width:'+G.tn.settings.getW()+'px;"></div>';
          break;
        case 'JUSTIFIED':
          newElt[newEltIdx++]='<div class="nGY2GThumbnailImage" style="height:'+G.tn.settings.getH()+'px;"><img class="nGY2GThumbnailImg" src="'+src+'" alt="'+sTitle+'" ></div>';
          break;
        default:    // GRID
          var imgSize='max-width:'+G.tn.settings.getW()+'px;max-height:'+G.tn.settings.getH()+'px;'
          // crop images => no black border
          if( G.tn.opt.Get('crop') == true && item.thumbImg().height > 0 && item.thumbImg().width > 0 ) {
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
          newElt[newEltIdx++]='<div class="nGY2GThumbnailImage" style="width:'+G.tn.settings.getW()+'px;height:'+G.tn.settings.getH()+'px;"><img class="nGY2GThumbnailImg" src="'+src+'" alt="'+sTitle+'" style="'+imgSize+'" ></div>';
          break;
      }

      // layer for user customization purposes
      newElt[newEltIdx++]='<div class="nGY2GThumbnailCustomLayer"></div>';

      // annotation (=area for labels + icons)
      if( G.O.thumbnailLabel.get('display') == true ) {
        // Labels: title and description
        newElt[newEltIdx++]= '  <div class="nGY2GThumbnailLabel" '+ G.tn.style.getLabel(item) +'>';
        if( item.kind == 'album' ) {
          newElt[newEltIdx++]= '    <div class="nGY2GThumbnailTitle nGY2GThumbnailAlbumTitle" '+G.tn.style.getTitle()+'>'+G.O.icons.thumbnailAlbum + sTitle+'</div>';
        }
        else {
          newElt[newEltIdx++]= '    <div class="nGY2GThumbnailTitle nGY2GThumbnailImageTitle" '+G.tn.style.getTitle()+'>'+G.O.icons.thumbnailImage + sTitle+'</div>';
        }
        newElt[newEltIdx++]= '    <div class="nGY2GThumbnailDescription" '+G.tn.style.getDesc()+'>'+sDesc+'</div>';
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
      if( typeof G.O.fnThumbnailInit == 'function' ) { 
        G.O.fnThumbnailInit($newDiv, item, GOMidx);
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
      var toolbar='';
      var tb=G.tn.toolbar.get(item);
      var width={ xs:0, sm:1, me:2, la:3, xl:4 };
      var cnt=0;
      
      if( tb[position] != '' ) {
        var pos='';
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
          case 'topRight':
          default:
            pos='top:0; right:0; text-align:right;';
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

    
    
    // Retrieve the maximum number of thumbnails in one row
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
console.dir(cnt);          
console.dir(delay);          
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
    
    
    // display thumbnail stacks at the end of the display animation
    function ThumbnailAppearFinish( item ) {
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
          from:         { scale: 0.5, opacity:0  },
          to:           { scale: f, opacity:1 },
          attachment:   { $e:item.$elt, item: item },
          delay:        delay,
          duration:     G.tn.opt.Get('displayTransitionDuration'),
          easing:       { opacity: 'easeOutQuint', scale: G.tn.opt.Get('displayTransitionEasing') },
          step: function (state, att) {
            att.$e.css( G.CSStransformName , 'scale('+state.scale+')').css('opacity',state.opacity);
          },
          finish: function (state, att) {
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
          from:         { scale: f, opacity:0  },
          to:           { scale: 1, opacity:1 },
          attachment:   { $e:item.$elt, item: item },
          delay:        delay,
          duration:     G.tn.opt.Get('displayTransitionDuration'),
          easing:       { opacity: 'easeOutQuint', scale: G.tn.opt.Get('displayTransitionEasing') },
          step: function (state, att) {
            att.$e.css( G.CSStransformName , 'scale('+state.scale+')').css('opacity',state.opacity);
          },
          finish: function (state, att) {
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
          from:         { 'scale': f, 'opacity':0  },
          to:           { 'scale': 1, 'opacity':1 },
          attachment:   { item: item },
          delay:        delay,
          duration:     G.tn.opt.Get('displayTransitionDuration'),
          easing:       { opacity: 'easeOutQuint', scale: G.tn.opt.Get('displayTransitionEasing') },
          step: function (state, att) {
            att.item.$elt.last().css('opacity', state.opacity);
            att.item.CSSTransformSet('.nGY2GThumbnail', 'scale', state.scale);
            att.item.CSSTransformApply('.nGY2GThumbnail');
          },
          finish: function (state, att) {
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
          from:         { 'opacity': 0, translateY: f, 'scale': 0.8  },
          to:           { 'opacity': 1, translateY: 0, 'scale': 1 },
          attachment:   { item: item },
          delay:        delay,
          duration:     G.tn.opt.Get('displayTransitionDuration'),
          easing:       { opacity: 'easeOutQuint', scale:'easeOutQuart', translateY:'easeOutQuart'},
          step: function (state, att) {
            att.item.$elt.css('opacity', state.opacity);
            att.item.CSSTransformSet('.nGY2GThumbnail', 'translateY', state.translateY+'px');
            att.item.CSSTransformSet('.nGY2GThumbnail', 'scale', state.scale);
            att.item.CSSTransformApply('.nGY2GThumbnail');
          },
          finish: function (state, att) {
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
          from:         { opacity: 0, translateY: f, scale: 0.8  },
          to:           { opacity: 1, translateY: 0, scale: 1 },
          attachment:   { item: item },
          delay:        delay,
          duration:     G.tn.opt.Get('displayTransitionDuration'),
          easing:       { opacity: 'easeOutQuint', scale:'easeOutQuart', translateY:'easeOutQuart'},
          step: function (state, att) {
            att.item.$elt.css('opacity', state.opacity);
            att.item.CSSTransformSet('.nGY2GThumbnail', 'translateY', state.translateY+'px');
            att.item.CSSTransformSet('.nGY2GThumbnail', 'scale', state.scale);
            att.item.CSSTransformApply('.nGY2GThumbnail');
          },
          finish: function (state, att) {
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
          from:         { opacity: 0, translateX: f, rotateX: 45, scale: 0.8  },
          to:           { opacity: 1, translateX: 0, rotateX: 0, scale: 1 },
          attachment:   { item: item },
          delay:        delay,
          duration:     G.tn.opt.Get('displayTransitionDuration'),
          easing:       { opacity: 'easeOutQuint', scale:'easeOutQuart', translateX:'easeOutQuart'},
          step: function (state, att) {
            att.item.$elt.css('opacity', state.opacity);
            att.item.CSSTransformSet('.nGY2GThumbnail', 'translateY', state.translateX+'px');
            att.item.CSSTransformSet('.nGY2GThumbnail', 'rotateX', state.rotateX+'deg');
            att.item.CSSTransformSet('.nGY2GThumbnail', 'scale', state.scale);
            att.item.CSSTransformApply('.nGY2GThumbnail');
          },
          finish: function (state, att) {
            this._step(state, att);
            att.item.$elt.css('opacity', '');
            ThumbnailAppearFinish(att.item);
          }
        });
      },
      FLIPDOWN: function( item, delay ) {
        var f=G.tn.opt.Get('displayTransitionStartVal');
        if( f == 0 ) { f=100; }   // default value
        var tweenable = new NGTweenable();
        tweenable.tween({
          from:         { opacity: 0, translateX: f, rotateX: 60, scale: 0.8  },
          to:           { opacity: 1, translateX: 0, rotateX: 0, scale: 1 },
          attachment:   { item: item },
          delay:        delay,
          duration:     G.tn.opt.Get('displayTransitionDuration'),
          easing:       { opacity: 'easeOutQuint', scale:'easeOutQuart', translateX:'easeOutQuart'},
          step: function (state, att) {
            att.item.$elt.css('opacity', state.opacity);
            att.item.CSSTransformSet('.nGY2GThumbnail', 'translateY', state.translateX+'px');
            att.item.CSSTransformSet('.nGY2GThumbnail', 'rotateX', state.rotateX+'deg');
            att.item.CSSTransformSet('.nGY2GThumbnail', 'scale', state.scale);
            att.item.CSSTransformApply('.nGY2GThumbnail');
          },
          finish: function (state, att) {
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
          from:         { opacity: 0, translateY: f, rotateY: 40, scale: 0.8  },
          to:           { opacity: 1, translateY: 0, rotateY: 0, scale: 1 },
          attachment:   { item: item },
          delay:        delay,
          duration:     G.tn.opt.Get('displayTransitionDuration'),
          easing:       { opacity: 'easeOutQuint', scale:'easeOutQuart', translateX:'easeOutQuart'},
          step: function (state, att) {
            att.item.$elt.css('opacity', state.opacity);
            att.item.CSSTransformSet('.nGY2GThumbnail', 'translateY', state.translateY+'px');
            att.item.CSSTransformSet('.nGY2GThumbnail', 'rotateY', state.rotateY+'deg');
            att.item.CSSTransformSet('.nGY2GThumbnail', 'scale', state.scale);
            att.item.CSSTransformApply('.nGY2GThumbnail');
          },
          finish: function (state, att) {
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
          from:         { opacity: 0, translateY: f, rotateY: 40, scale: 0.8  },
          to:           { opacity: 1, translateY: 0, rotateY: 0, scale: 1 },
          attachment:   { item: item },
          delay:        delay,
          duration:     G.tn.opt.Get('displayTransitionDuration'),
          easing:       { opacity: 'easeOutQuint', scale:'easeOutQuart', translateY:'easeOutQuart'},
          step: function (state, att) {
            att.item.$elt.css('opacity', state.opacity);
            att.item.CSSTransformSet('.nGY2GThumbnail', 'translateY', state.translateY+'px');
            att.item.CSSTransformSet('.nGY2GThumbnail', 'rotateY', state.rotateY+'deg');
            att.item.CSSTransformSet('.nGY2GThumbnail', 'scale', state.scale);
            att.item.CSSTransformApply('.nGY2GThumbnail');
          },
          finish: function (state, att) {
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
          from:         { opacity: 0, translateX: f, rotateZ: 10 },
          to:           { opacity: 1, translateX: 0, rotateZ: 0 },
          attachment:   { item: item },
          delay:        delay,
          duration:     G.tn.opt.Get('displayTransitionDuration'),
          easing:       { opacity: 'easeOutQuint', translateX:'easeOutQuart', rotateZ:'easeOutQuart'},
          step: function (state, att) {
            att.item.$elt.css('opacity', state.opacity);
            att.item.CSSTransformSet('.nGY2GThumbnail', 'translateX', state.translateX+'px');
            att.item.CSSTransformSet('.nGY2GThumbnail', 'rotateZ', state.rotateZ+'deg');
            att.item.CSSTransformApply('.nGY2GThumbnail');
          },
          finish: function (state, att) {
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
          from:         { opacity: 0, translateX: f, rotateZ: -10 },
          to:           { opacity: 1, translateX: 0, rotateZ: 0 },
          attachment:   { item: item },
          delay:        delay,
          duration:     G.tn.opt.Get('displayTransitionDuration'),
          easing:       { opacity: 'easeOutQuint', translateX:'easeOutQuart', rotateZ:'easeOutQuart'},
          step: function (state, att) {
            att.item.$elt.css('opacity', state.opacity);
            att.item.CSSTransformSet('.nGY2GThumbnail', 'translateX', state.translateX+'px');
            att.item.CSSTransformSet('.nGY2GThumbnail', 'rotateZ', state.rotateZ+'deg');
            att.item.CSSTransformApply('.nGY2GThumbnail');
          },
          finish: function (state, att) {
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
          attachment:   { $e:item.$elt, item: item },
          delay:        delay,
          duration:     G.tn.opt.Get('displayTransitionDuration'),
          easing:       'easeInOutSine',
          step: function (state, att) {
            att.$e.css(state);
          },
          finish: function (state, att) {
            att.$e.css('opacity', '');
            // att.$e.css({'opacity':1 });
            ThumbnailAppearFinish(att.item);
          }
        });
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
      
      if( typeof G.O.fnThumbnailHoverInit == 'function' ) {
        // G.O.fnThumbnailHoverInit($e, item, ExposedObjects() );
        G.O.fnThumbnailHoverInit($e, item, GOMidx );
      }

      // build init
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
      }
    }


    function ThumbnailHover( GOMidx ) {
      if( G.GOM.albumIdx == -1 || !G.galleryResizeEventEnabled ) { return; };
      var curTn=G.GOM.items[GOMidx];
      var item=G.I[curTn.thumbnailIdx];
      if( item.kind == 'albumUp' ) { return; }

      if( item.$elt == null ) { return; }

      item.hovered=true;

      if( typeof G.O.fnThumbnailHover == 'function' ) { 
        // G.O.fnThumbnailHover($e, item, ExposedObjects());
        G.O.fnThumbnailHover(item.$elt, item, GOMidx);
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
          G.GOM.items[i].hovered=false;
        }
      }
    }

    
    function ThumbnailHoverOut( GOMidx ) {
      if( G.GOM.albumIdx == -1 || !G.galleryResizeEventEnabled ) { return; };
      var curTn=G.GOM.items[GOMidx];
      var item=G.I[curTn.thumbnailIdx];
      if( item.kind == 'albumUp' || !item.hovered ) { return; }
      if( item.$elt == null ) { return; }

      item.hovered=false;

      if( typeof G.O.fnThumbnailHoverOut == 'function' ) { 
        // G.O.fnThumbnailHoverOut($e, item, ExposedObjects());
        G.O.fnThumbnailHoverOut(item.$elt, item, GOMidx);
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
console.log('#DisplayPhoto : '+  albumID +'-'+ imageID);
      var albumIdx=NGY2Item.GetIdx(G, albumID);
      // if( albumIdx == 0 || albumIdx == -1 ) {
      if( albumIdx == 0 ) {
        G.GOM.curNavLevel='l1';
      }
      else {
        G.GOM.curNavLevel='lN';
      }
      
      if( albumIdx == -1 ) {
        // get content of album on root level
        NGY2Item.New( G, '', '', albumID, '0', 'album' );    // create empty album
        // AlbumGetContent( '0', DisplayPhoto, imageID, albumID );
        // return;
        albumIdx=G.I.length-1;
      }

      var imageIdx = NGY2Item.GetIdx(G, imageID);
      if( imageIdx == -1 ) {
        // get content of the album
        AlbumGetContent( albumID, DisplayPhoto, imageID, albumID );
        return;
      }
console.log('#DisplayPhoto : '+  imageIdx);
     
      DisplayPhotoIdx(imageIdx);
    
    }


    // BETA -> NOT finished
    // Retrieve the title+description of ONE album
    function albumGetInfo( albumIdx, fnToCall ) {
      var url='';
      var kind='image';
      //var albumIdx=NGY2Item.GetIdx(G, ID);
      
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
          url: { l1 : { xs:thumbsrc, sm:thumbsrc, me:thumbsrc, la:thumbsrc, xl:thumbsrc }, lN : { xs:thumbsrc, sm:thumbsrc, me:thumbsrc, la:thumbsrc, xl:thumbsrc } },
          width: { l1 : { xs:tw, sm:tw, me:tw, la:tw, xl:tw }, lN : { xs:tw, sm:tw, me:tw, la:tw, xl:tw } },
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
        
        if( typeof G.O.fnProcessData == 'function' ) {
          G.O.fnProcessData(newItem, 'api', item);
        }
      });
      
      if( foundAlbumID ) {
        //G.O.displayBreadcrumb=true;
      }

    }
    
    function GetContentMarkup( $elements ) {
      var foundAlbumID=false;
      var nbTitles=0;
      
      G.I[0].contentIsLoaded=true;

      jQuery.each($elements, function(i, item){

        // create dictionnary with all data attribute name in lowercase (to be case unsensitive)
        var data={
          // some default values
          'data-ngdesc':            '',         // item description
          'data-ngid':              null,       // ID
          'data-ngkind':            'image',    // kind (image, album, albumup)
          'data-ngtags':            null,       // tags
          'data-ngdest':            '',         // destination URL
          'data-ngthumbimgwidth':   0,          // thumbnail width
          'data-ngthumbimgheight':  0,          // thumbnail height
          'data-ngimagewidth':      0,          // image width
          'data-ngimageheight':     0,          // image height
          'data-ngexifmodel':       '',         // EXIF data
          'data-ngexifflash':       '',
          'data-ngexiffocallength': '',
          'data-ngexiffstop':       '',
          'data-ngexifexposure':    '',
          'data-ngexifiso':         '',
          'data-ngexiftime':        '',
          'data-ngexiflocation':    ''
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
        
        newItem.destinationURL=data['data-ngdest'];
        newItem.downloadURL=data['data-ngdownloadurl'];

        // thumbnail image size
        var tw=parseInt(data['data-ngthumbimgwidth']);
        var th=parseInt(data['data-ngthumbimgheight']);
        newItem.thumbs = {
          url: { l1 : { xs:thumbsrc, sm:thumbsrc, me:thumbsrc, la:thumbsrc, xl:thumbsrc }, lN : { xs:thumbsrc, sm:thumbsrc, me:thumbsrc, la:thumbsrc, xl:thumbsrc } },
          width: { l1 : { xs:tw, sm:tw, me:tw, la:tw, xl:tw }, lN : { xs:tw, sm:tw, me:tw, la:tw, xl:tw } },
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

        if( typeof G.O.fnProcessData == 'function' ) {
          G.O.fnProcessData(newItem, 'markup', item);
        }        
        
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
//TODO --> following must be moved to G.tn
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
      if( typeof G.O.thumbnailCrop == 'boolean' ) {
        G.tn.opt.lN.crop=G.O.thumbnailCrop;
        G.tn.opt.l1.crop=G.O.thumbnailCrop;
      }
      if( G.O.thumbnailL1Crop !== undefined &&  G.O.thumbnailL1Crop != null && G.O.thumbnailL1Crop != '' ) {
        G.tn.opt.l1.crop=G.O.thumbnailL1Crop;
      }

      // thumbnail stacks
      if( toType(G.O.thumbnailStacks) == 'number' && G.O.thumbnailStacks > 0 ) {
        G.tn.opt.lN.stacks=G.O.thumbnailStacks;
        G.tn.opt.l1.stacks=G.O.thumbnailStacks;
      }
      if( toType(G.O.thumbnailL1Stacks) == 'number' && G.O.thumbnailL1Stacks > 0 ) {
        G.tn.opt.l1.stacks=G.O.thumbnailL1Stacks;
      }
      // thumbnail stacks translate X
      if( toType(G.O.thumbnailStacksTranslateX) == 'number' ) {
        G.tn.opt.lN.stacksTranslateX=G.O.thumbnailStacksTranslateX;
        G.tn.opt.l1.stacksTranslateX=G.O.thumbnailStacksTranslateX;
      }
      if( toType(G.O.thumbnailL1StacksTranslateX) == 'number' ) {
        G.tn.opt.l1.stacksTranslateX=G.O.thumbnailL1StacksTranslateX;
      }
      // thumbnail stacks translate Y
      if( toType(G.O.thumbnailStacksTranslateY) == 'number' ) {
        G.tn.opt.lN.stacksTranslateY=G.O.thumbnailStacksTranslateY;
        G.tn.opt.l1.stacksTranslateY=G.O.thumbnailStacksTranslateY;
      }
      if( toType(G.O.thumbnailL1StacksTranslateY) == 'number'  ) {
        G.tn.opt.l1.stacksTranslateY=G.O.thumbnailL1StacksTranslateY;
      }
      // thumbnail stacks translate Z
      if( toType(G.O.thumbnailStacksTranslateZ) == 'number' ) {
        G.tn.opt.lN.stacksTranslateZ=G.O.thumbnailStacksTranslateZ;
        G.tn.opt.l1.stacksTranslateZ=G.O.thumbnailStacksTranslateZ;
      }
      if( toType(G.O.thumbnailL1StacksTranslateZ) == 'number'  ) {
        G.tn.opt.l1.stacksTranslateZ=G.O.thumbnailL1StacksTranslateZ;
      }
      // thumbnail stacks rotate X
      if( toType(G.O.thumbnailStacksRotateX) == 'number'  ) {
        G.tn.opt.lN.stacksRotateX=G.O.thumbnailStacksRotateX;
        G.tn.opt.l1.stacksRotateX=G.O.thumbnailStacksRotateX;
      }
      if( toType(G.O.thumbnailL1StacksRotateX) == 'number' ) {
        G.tn.opt.l1.stacksRotateX=G.O.thumbnailL1StacksRotateX;
      }
      // thumbnail stacks rotate Y
      if( toType(G.O.thumbnailStacksRotateY) == 'number' ) {
        G.tn.opt.lN.stacksRotateY=G.O.thumbnailStacksRotateY;
        G.tn.opt.l1.stacksRotateY=G.O.thumbnailStacksRotateY;
      }
      if( toType(G.O.thumbnailL1StacksRotateY) == 'number' ) {
        G.tn.opt.l1.stacksRotateY=G.O.thumbnailL1StacksRotateY;
      }
      // thumbnail stacks rotate Z
      if( toType(G.O.thumbnailStacksRotateZ) == 'number' ) {
        G.tn.opt.lN.stacksRotateZ=G.O.thumbnailStacksRotateZ;
        G.tn.opt.l1.stacksRotateZ=G.O.thumbnailStacksRotateZ;
      }
      if( toType(G.O.thumbnailL1StacksRotateZ) == 'number' ) {
        G.tn.opt.l1.stacksRotateZ=G.O.thumbnailL1StacksRotateZ;
      }
      // thumbnail stacks scale
      if( toType(G.O.thumbnailStacksScale) == 'number' ) {
        G.tn.opt.lN.stacksScale=G.O.thumbnailStacksScale;
        G.tn.opt.l1.stacksScale=G.O.thumbnailStacksScale;
      }
      if( toType(G.O.thumbnailL1StacksScale) == 'number' ) {
        G.tn.opt.l1.stacksScale=G.O.thumbnailL1StacksScale;
      }
      
      // thumbnail gutter width
      if( toType(G.O.thumbnailGutterWidth) == 'number' && G.O.thumbnailGutterWidth > 0 ) {
        G.tn.opt.lN.gutterWidth=G.O.thumbnailGutterWidth;
        G.tn.opt.l1.gutterWidth=G.O.thumbnailGutterWidth;
      }
      if( toType(G.O.thumbnailL1GutterWidth) == 'number' && G.O.thumbnailL1GutterWidth > 0 ) {
        G.tn.opt.l1.gutterWidth=G.O.thumbnailL1GutterWidth;
      }
      
      // thumbnail gutter height
      if( toType(G.O.thumbnailGutterHeight) == 'number' && G.O.thumbnailGutterHeight > 0 ) {
        G.tn.opt.lN.gutterHeight=G.O.thumbnailGutterHeight;
        G.tn.opt.l1.gutterHeight=G.O.thumbnailGutterHeight;
      }
      if( toType(G.O.thumbnailL1GutterHeight) == 'number' && G.O.thumbnailL1GutterHeight > 0 ) {
        G.tn.opt.l1.gutterHeight=G.O.thumbnailL1GutterHeight;
      }
      
      // gallery display mode
      if( G.O.galleryDisplayMode !== undefined && G.O.galleryDisplayMode != '' ) {
        G.galleryDisplayMode.lN=G.O.galleryDisplayMode.toUpperCase();
        G.galleryDisplayMode.l1=G.O.galleryDisplayMode.toUpperCase();
      }
      if( G.O.galleryL1DisplayMode !== undefined &&  G.O.galleryL1DisplayMode != null && G.O.galleryL1DisplayMode != '' ) {
        G.galleryDisplayMode.l1=G.O.galleryL1DisplayMode.toUpperCase();
      }
      
      // gallery maximum number of lines of thumbnails
      if( toType(G.O.galleryMaxRows) == 'number' && G.O.galleryMaxRows >= 0 ) {
        G.galleryMaxRows.lN=G.O.galleryMaxRows;
        G.galleryMaxRows.l1=G.O.galleryMaxRows;
      }
      else {
        NanoConsoleLog(G, 'Parameter "galleryMaxRows" must be an integer.');
      }
      if( toType(G.O.galleryL1MaxRows) == 'number' && G.O.galleryL1MaxRows >= 0 ) {
        G.galleryMaxRows.l1=G.O.galleryL1MaxRows;
      }

      // gallery last row full
      if( G.O.galleryLastRowFull !== undefined && G.O.galleryLastRowFull != null ) {
        G.galleryLastRowFull.lN=G.O.galleryLastRowFull;
        G.galleryLastRowFull.l1=G.O.galleryLastRowFull;
      }
      if( G.O.galleryL1LastRowFull !== undefined && G.O.galleryL1LastRowFull != null ) {
        G.galleryLastRowFull.l1=G.O.galleryL1LastRowFull;
      }
      
      // gallery sorting
      if( G.O.gallerySorting !== undefined && G.O.gallerySorting != null ) {
        G.gallerySorting.lN=G.O.gallerySorting.toUpperCase();
        G.gallerySorting.l1=G.gallerySorting.lN;
      }
      if( G.O.galleryL1Sorting !== undefined && G.O.galleryL1Sorting != null ) {
        G.gallerySorting.l1=G.O.galleryL1Sorting.toUpperCase();
      }
      
      // gallery max items per album (not for inline/api defined items)
      if( toType(G.O.galleryMaxItems) == 'number' && G.O.galleryMaxItems >= 0 ) {
        G.galleryMaxItems.lN=G.O.galleryMaxItems;
        G.galleryMaxItems.l1=G.O.galleryMaxItems;
      }
      if( toType(G.O.galleryL1MaxItems) == 'number' && G.O.galleryL1MaxItems >= 0 ) {
        G.galleryMaxItems.l1=G.O.galleryL1MaxItems;
      }

      // gallery filter tags
      G.galleryFilterTags.lN=G.O.galleryFilterTags;
      G.galleryFilterTags.l1=G.O.galleryFilterTags;
      if( G.O.galleryL1FilterTags != null && G.O.galleryL1FilterTags != undefined ) {
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

      // thumbnail display interval
      if( toType(G.O.thumbnailDisplayInterval) == 'number' && G.O.thumbnailDisplayInterval >= 0 ) {
        G.tn.opt.lN.displayInterval=G.O.thumbnailDisplayInterval;
        G.tn.opt.l1.displayInterval=G.O.thumbnailDisplayInterval;
      }
      else {
        NanoConsoleLog(G, 'Parameter "thumbnailDisplayInterval" must be an integer.');
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

      if( typeof G.O.fnThumbnailDisplayEffect == 'function' ) {
        // G.O.thumbnailDisplayTransition='CUSTOM';
        G.tn.opt.lN.displayTransition='CUSTOM';
        G.tn.opt.l1.displayTransition='CUSTOM';
      }
      if( typeof G.O.fnThumbnailL1DisplayEffect == 'function' ) {
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
      if( G.O.thumbnailDisplayTransitionDuration !== undefined && G.O.thumbnailDisplayTransitionDuration != null ) {
        G.tn.opt.lN.displayTransitionDuration=G.O.thumbnailDisplayTransitionDuration;
        G.tn.opt.l1.displayTransitionDuration=G.O.thumbnailDisplayTransitionDuration;
      }
      if( G.O.thumbnailL1DisplayTransitionDuration !== undefined && G.O.thumbnailL1DisplayTransitionDuration != null ) {
        G.tn.opt.l1.displayTransitionDuration=G.O.thumbnailL1DisplayTransitionDuration;
      }
      // thumbnail display transition interval duration
      if( G.O.thumbnailDisplayInterval !== undefined && G.O.thumbnailDisplayInterval != null ) {
        G.tn.opt.lN.displayInterval=G.O.thumbnailDisplayInterval;
        G.tn.opt.l1.displayInterval=G.O.thumbnailDisplayInterval;
      }
      if( G.O.thumbnailL1DisplayInterval !== undefined && G.O.thumbnailL1DisplayInterval != null ) {
        G.tn.opt.l1.displayInterval=G.O.thumbnailL1DisplayInterval;
      }

      
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
          var o1=t1[i].split('_');
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
          var o1=t1[i].split('_');
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
      if( toType(G.O.thumbnailWidth) == 'number' ) {
        ThumbnailsSetSize( 'width', 'l1', G.O.thumbnailWidth, 'u');
        ThumbnailsSetSize( 'width', 'lN', G.O.thumbnailWidth, 'u');
      }
      else {
        var ws=G.O.thumbnailWidth.split(' ');
        var v='auto';
        if( ws[0].substring(0,4) != 'auto' ) { v=parseInt(ws[0]); }
        var c='u';
        if( ws[0].charAt(ws[0].length - 1) == 'C' ) { c='c'; }
        ThumbnailsSetSize( 'width', 'l1', v, c );   // default value for all resolutions and navigation levels
        ThumbnailsSetSize( 'width', 'lN', v, c );
        for( var i=1; i<ws.length; i++ ) {
          var r=ws[i].substring(0,2).toLowerCase();
          if( /xs|sm|me|la|xl/i.test(r) ) {
            var w=ws[i].substring(2);
            var v='auto';
            if( w.substring(0,4) != 'auto' ) { v=parseInt(w); }
            var c='u';
            if( w.charAt(w.length - 1) == 'C' ) { c='c'; }
            G.tn.settings.width['l1'][r]=v;
            G.tn.settings.width['lN'][r]=v;
            G.tn.settings.width['l1'][r+'c']=c;
            G.tn.settings.width['lN'][r+'c']=c;
          }
        }
      }
      if( G.O.thumbnailL1Width != undefined ) {
        if( toType(G.O.thumbnailL1Width) == 'number' ) {
          ThumbnailsSetSize( 'width', 'l1', G.O.thumbnailL1Width, 'u');
        }
        else {
          var ws=G.O.thumbnailL1Width.split(' ');
          var v='auto';
          if( ws[0].substring(0,4) != 'auto' ) { v=parseInt(ws[0]); }
          var c='u';
          if( ws[0].charAt(ws[0].length - 1) == 'C' ) { c='c'; }
          ThumbnailsSetSize( 'width', 'l1', v, c );
          for( var i=1; i<ws.length; i++ ) {
            var r=ws[i].substring(0,2).toLowerCase();
            if( /xs|sm|me|la|xl/i.test(r) ) {
              var w=ws[i].substring(2);
              var v='auto';
              if( w.substring(0,4) != 'auto' ) { v=parseInt(w); }
              var c='u';
              if( w.charAt(w.length - 1) == 'C' ) { c='c'; }
              G.tn.settings.width['l1'][r]=v;
              G.tn.settings.width['l1'][r+'c']=c;
            }
          }
        }
      }

      if( toType(G.O.thumbnailHeight) == 'number' ) {
        ThumbnailsSetSize( 'height', 'l1', G.O.thumbnailHeight, 'u');
        ThumbnailsSetSize( 'height', 'lN', G.O.thumbnailHeight, 'u');
      }
      else {
        var ws=G.O.thumbnailHeight.split(' ');
        var v='auto';
        if( ws[0].substring(0,4) != 'auto' ) { v=parseInt(ws[0]); }
        var c='u';
        if( ws[0].charAt(ws[0].length - 1) == 'C' ) { c='c'; }
        ThumbnailsSetSize( 'height', 'l1', v, c );   // default value for all resolutions and navigation levels
        ThumbnailsSetSize( 'height', 'lN', v, c );
        for( var i=1; i<ws.length; i++ ) {
          var r=ws[i].substring(0,2).toLowerCase();
          if( /xs|sm|me|la|xl/i.test(r) ) {
            var w=ws[i].substring(2);
            var v='auto';
            if( w.substring(0,4) != 'auto' ) { v=parseInt(w); }
            var c='u';
            if( w.charAt(w.length - 1) == 'C' ) { c='c'; }
            G.tn.settings.height['l1'][r]=v;
            G.tn.settings.height['lN'][r]=v;
            G.tn.settings.height['l1'][r+'c']=c;
            G.tn.settings.height['lN'][r+'c']=c;
          }
        }
      }
      if( G.O.thumbnailL1Height != undefined ) {
        if( toType(G.O.thumbnailL1Height) == 'number' ) {
          ThumbnailsSetSize( 'height', 'l1', G.O.thumbnailL1Height, 'u');
        }
        else {
          var ws=G.O.thumbnailL1Height.split(' ');
          var v='auto';
          if( ws[0].substring(0,4) != 'auto' ) { v=parseInt(ws[0]); }
          var c='u';
          if( ws[0].charAt(ws[0].length - 1) == 'C' ) { c='c'; }
          ThumbnailsSetSize( 'height', 'l1', v, c );
          for( var i=1; i<ws.length; i++ ) {
            var r=ws[i].substring(0,2).toLowerCase();
            if( /xs|sm|me|la|xl/i.test(r) ) {
              var w=ws[i].substring(2);
              var v='auto';
              if( w.substring(0,4) != 'auto' ) { v=parseInt(w); }
              var c='u';
              if( w.charAt(w.length - 1) == 'C' ) { c='c'; }
              G.tn.settings.height['l1'][r]=v;
              G.tn.settings.height['l1'][r+'c']=c;
            }
          }
        }
      }
      
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

      // COMPATIBILITY WITH NANOGALLERY1
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

      var s1='.' + G.VOM.colorSchemeLabel + ' ';
      var s=s1+'.nGY2Viewer { background:'+cs.background+'; }'+'\n';
      s+=s1+'.nGY2ViewerImage { border:'+cs.imageBorder+'; box-shadow:'+cs.imageBoxShadow+'; }'+'\n';
      s+=s1+'.nGY2Viewer .toolbarBackground { background:'+cs.barBackground+'; }'+'\n';
      s+=s1+'.nGY2Viewer .toolbar { border:'+cs.barBorder+'; color:'+cs.barColor+'; }'+'\n';
      s+=s1+'.nGY2Viewer .toolbar .previousButton:after { color:'+cs.barColor+'; }'+'\n';
      s+=s1+'.nGY2Viewer .toolbar .nextButton:after { color:'+cs.barColor+'; }'+'\n';
      s+=s1+'.nGY2Viewer .toolbar .closeButton:after { color:'+cs.barColor+'; }'+'\n';
      s+=s1+'.nGY2Viewer .toolbar .label .title { color:'+cs.barColor+'; }'+'\n';
      s+=s1+'.nGY2Viewer .toolbar .label .description { color:'+cs.barDescriptionColor+'; }'+'\n';
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

      // requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
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
          if(typeof G.O.fnThumbnailToolCustAction === 'function'){
            G.O.fnThumbnailToolCustAction(r.action, G.I[idx]);
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
          if(typeof G.O.fnShoppingCartUpdated === 'function'){
            G.O.fnShoppingCartUpdated(G.shoppingCart);
          }
          // G.$E.base.trigger('shoppingCartUpdated.nanogallery2', new Event('shoppingCartUpdated.nanogallery2'));
          TriggerCustomEvent('shoppingCartUpdated');
          return;
        }
      }
      
      // add to shopping cart
      if( !found) {
        G.shoppingCart.push( { idx:idx, ID:G.I[idx].GetID(), cnt:1} );
        if(typeof G.O.fnShoppingCartUpdated === 'function'){
          G.O.fnShoppingCartUpdated(G.shoppingCart);
        }
        // G.$E.base.trigger('shoppingCartUpdated.nanogallery2', new Event('shoppingCartUpdated.nanogallery2'));
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
          if(typeof G.O.fnThumbnailSelection === 'function'){
            // called when the selection status of an item changed
            G.O.fnThumbnailSelection(item.$elt, item, G.I);
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
      
      if(typeof G.O.fnThumbnailSelection === 'function'){
        // called when the selection status of an item changed
        G.O.fnThumbnailSelection(item.$elt, item, G.I);
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
      var pp='<div class="nGY2Popup" style="opacity:0;"><div class="nGY2PopupContent'+align+'">';
      pp+='<div class="nGY2PopupCloseButton">'+G.O.icons.buttonClose+'</div>';
      pp+='<div class="nGY2PopupTitle">'+title+'</div>';
      pp+=content;
      pp+='</div></div>';
      
      G.popup.$elt=jQuery(pp).appendTo('body');
      setElementOnTop( G.VOM.$viewer, G.popup.$elt);
      
      G.popup.isDisplayed=true;
      
      var tweenable = new NGTweenable();
      tweenable.tween({
        from:       { opacity:0  },
        to:         { opacity:1 },
        easing: 'easeInOutSine',
        duration: 180,
        step: function (state, att) {
          G.popup.$elt.css('opacity',state.opacity);
        },
        finish: function (state, att) {
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

      if( typeof G.O.fnThumbnailClicked === 'function' ){
        if( !G.O.fnThumbnailClicked(item.$elt, item) ) { return; }
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
        case 'json':
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
    function DisplayPhotoIdx( imageIdx ) {

      if( !G.O.thumbnailOpenImage ) { return; }

      if( G.O.thumbnailOpenOriginal ) {
        // Open link to original image
        OpenOriginal( G.I[imageIdx] );
        return;
      }
        
      var items=[];
      
      // G.VOM.currItemIdx=imageIdx;
      G.VOM.currItemIdx=0;
      G.VOM.items=[];
      G.VOM.albumID=G.I[imageIdx].albumID;
      
      var vimg=new VImg(imageIdx);
      G.VOM.items.push(vimg);
      items.push(G.I[imageIdx]);
//TODO -> danger -> pourquoi reconstruire la liste si déjà ouvert (back/forward)     
      var l=G.I.length;
      for( var idx=imageIdx+1; idx<l ; idx++) {
        var item=G.I[idx];
        if( item.kind == 'image' && item.albumID == G.VOM.albumID && item.checkTagFilter() && item.isSearchFound() && item.destinationURL == '' ) {
          var vimg=new VImg(idx);
          G.VOM.items.push(vimg);
          items.push(item);
        }
      }
      var last=G.VOM.items.length;
      var cnt=1;
      for( var idx=0; idx<imageIdx ; idx++) {
        var item=G.I[idx];
        if( item.kind == 'image' && item.albumID == G.VOM.albumID && item.checkTagFilter() && item.isSearchFound() && item.destinationURL == '' ) {
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
    
      if( typeof G.O.fnThumbnailOpen == 'function' ) { 
        // opens image with external viewer
        G.O.fnThumbnailOpen(items);
        return;
      }
    
      if( !G.VOM.viewerDisplayed ) {
        // build and display
        OpenInternalViewer(0);
      }
      else {
        // display
        // DisplayInternalViewer(imageIdx, '');
        G.VOM.$imgC.css({ opacity:0, left:0, visibility:'hidden' }).attr('src','');
        G.VOM.$imgC.children().eq(0).attr('src',G.emptyGif).attr('src',G.VOM.Item(0).responsiveURL());
        DisplayInternalViewer(0, '');
      }
    }

    // display image with internal viewer
    function OpenInternalViewer( vomIdx ) {

      G.VOM.viewerDisplayed=true;
      jQuery('body').css({overflow:'hidden'});  //avoid scrollbars

      G.VOM.$cont=jQuery('<div  class="nGY2 nGY2ViewerContainer" style="opacity:1"></div>').appendTo('body');
      
      SetColorSchemeViewer();

      G.VOM.$viewer=jQuery('<div class="nGY2Viewer" itemscope itemtype="http://schema.org/ImageObject"></div>').appendTo(G.VOM.$cont);

// avoid pinch zoom
G.VOM.$viewer.css({msTouchAction:'none', touchAction:'none'});      
// TODO -> check if still required?

      
      var sImg='',
      l=G.I.length;
      sImg+='<div class="nGY2ViewerImagePan"><img class="nGY2ViewerImage" src="'+G.VOM.Item(GetPreviousImageIdx(vomIdx)).responsiveURL()+'" alt=" " itemprop="contentURL"></div>';
      sImg+='<div class="nGY2ViewerImagePan"><img class="nGY2ViewerImage" src="'+G.VOM.Item(vomIdx).responsiveURL()+'" alt=" " itemprop="contentURL"></div>';
      sImg+='<div class="nGY2ViewerImagePan"><img class="nGY2ViewerImage" src="'+G.VOM.Item(GetNextImageIdx(vomIdx)).responsiveURL()+'" alt=" " itemprop="contentURL"></div>';
      var sNav='';
      if( G.O.icons.viewerImgPrevious != undefined && G.O.icons.viewerImgPrevious != '') {
        sNav+='<div class="nGY2ViewerAreaPrevious ngy2viewerToolAction" data-ngy2action="previous">'+G.O.icons.viewerImgPrevious+'</div>';
      }
      if( G.O.icons.viewerImgNext != undefined && G.O.icons.viewerImgNext != '') {
        sNav+='<div class="nGY2ViewerAreaNext ngy2viewerToolAction" data-ngy2action="next">'+G.O.icons.viewerImgNext+'</div>';
      }
      G.VOM.$content=jQuery('<div class="nGY2ViewerContent">'+sImg+sNav+'</div>').appendTo(G.VOM.$viewer);
      G.VOM.$imgP=G.VOM.$content.find('.nGY2ViewerImagePan').eq(0);
      G.VOM.$imgC=G.VOM.$content.find('.nGY2ViewerImagePan').eq(1);
      G.VOM.$imgN=G.VOM.$content.find('.nGY2ViewerImagePan').eq(2);
      
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
      if( G.supportFullscreenAPI ) {
        if( G.O.viewerFullscreen ) {
          G.VOM.viewerIsFullscreen=true;
          G.VOM.$viewer.find('.ngy2viewerToolAction').find('.fullscreenButton').html(G.O.icons.viewerFullscreenOn);
          ngscreenfull.request();
        }
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

      // stop click propagation on image ==> if the user clicks outside of an image, the viewer is closed
      G.VOM.$viewer.find('img').on('click', function (e) {
        e.stopPropagation();
      });
      
      ImageSwipeTranslateX(G.VOM.swipePosX);
      DisplayInternalViewer(vomIdx, '');

      // viewer gesture handling
      if( G.VOM.hammertime == null ) {
      
        G.VOM.hammertime =  new NGHammer(G.VOM.$cont[0]);
     
        G.VOM.hammertime.get('pan').set({ direction: NGHammer.DIRECTION_ALL });        
        G.VOM.hammertime.get('pinch').set({ enable: true });        

        G.VOM.hammertime.on('pan', function(ev) {
          if( !G.VOM.viewerDisplayed ) { return; }
          if( G.VOM.isZooming ) {
            ViewerImageSetPosition(G.VOM.panPosX+ev.deltaX, G.VOM.panPosY+ev.deltaY, false);
          }
          else {
            ImageSwipeTranslateX( ev.deltaX );
          }
        });

        G.VOM.hammertime.on('panend', function(ev) {
          if( !G.VOM.viewerDisplayed ) { return; }
          if( G.VOM.isZooming ) {
            G.VOM.timeImgChanged=new Date().getTime();
            ViewerImageSetPosition(G.VOM.panPosX+ev.deltaX, G.VOM.panPosY+ev.deltaY, true);
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
          // double tap event only if zoom-feature is activated
          G.VOM.hammertime.on('doubletap', function(ev) {
            if( !G.VOM.viewerDisplayed ) { return; }
            ev.srcEvent.stopPropagation();
            ev.srcEvent.preventDefault();
            
            if( ev.target.className.indexOf('nGY2ViewerImage') !== -1 ) {
              // double tap only one image
              if( G.VOM.isZooming ) {
                G.VOM.isZooming=false;
                G.VOM.currentZoom=1;
                ResizeInternalViewer(true);
              }
              else {
                G.VOM.currentZoom=1.^5;
                if( ViewerZoomStart() ) {
                  ViewerZoomIn(true);
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
              G.VOM.currentZoom=ev.scale;
              if( G.VOM.currentZoom > 2 ) {
                G.VOM.currentZoom=2;
              }
              if( G.VOM.currentZoom < 0.2 ) {
                G.VOM.currentZoom=0.2;
              }

              // center image
              ViewerZoomApply();
            }
          });
        }
      }

      
      if( G.O.slideshowAutoStart ) {
        G.VOM.playSlideshow=false;
        SlideshowToggle();
      }
    }

    function ViewerToolsOn() {
      // removes all events
      G.VOM.$viewer.off("touchstart click", '.ngy2viewerToolAction', ViewerToolsAction); 
      
      // action button
      G.VOM.$viewer.on("touchstart click", '.ngy2viewerToolAction', ViewerToolsAction); 
    }

      // Actions of the buttton/elements
      function ViewerToolsAction(e) {
        var $this=$(this);
        var ngy2action=$this.data('ngy2action');
        switch( ngy2action ) {
          case 'next':
            e.stopPropagation();
            e.preventDefault();
            DisplayNextImage();
            break;
          case 'previous':
            e.stopPropagation();
            e.preventDefault();
            DisplayPreviousImage();
            break;
          case 'playPause':
            e.stopPropagation();
            SlideshowToggle();
            break;
          case 'zoomIn':
            e.stopPropagation();
            e.preventDefault();
            if( ViewerZoomStart() ) {
              ViewerZoomIn( true );
            }
            break;
          case 'zoomOut':
            e.stopPropagation();
            e.preventDefault();
            if( ViewerZoomStart() ) {
              ViewerZoomIn( false );
            }
            break;
          case 'minimize':
            // toggle toolbar visibility
            e.stopPropagation();
            e.preventDefault();
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
            if( G.supportFullscreenAPI ) {
              if( ngscreenfull.enabled ) {
                ngscreenfull.toggle();
                if( G.VOM.viewerIsFullscreen ) {
                  G.VOM.viewerIsFullscreen=false;
                  G.VOM.$viewer.find('.fullscreenButton').html(G.O.icons.viewerFullscreenOff);
                }
                else {
                  G.VOM.viewerIsFullscreen=true;
                  G.VOM.$viewer.find('.fullscreenButton').html(G.O.icons.viewerFullscreenOn);
                }
              }
            }
            break;
          case 'info':
            e.stopPropagation();
            // if( typeof G.O.fnViewerInfo == 'function' ) {
              // G.O.fnViewerInfo(G.VOM.Item(G.VOM.currItemIdx), ExposedObjects());
            // }
            ItemDisplayInfo(G.VOM.Item(G.VOM.currItemIdx));
            break;
          case 'close':
            e.stopPropagation();
            e.preventDefault();
            if( (new Date().getTime()) - G.VOM.timeImgChanged < 400 ) { return; }
            CloseInternalViewer(G.VOM.currItemIdx);
            break;
          case 'download':
            e.stopPropagation();
            e.preventDefault();
            DownloadImage(G.VOM.items[G.VOM.currItemIdx].imageIdx);
            break;
          case 'share':
            e.stopPropagation();
            e.preventDefault();
            PopupShare(G.VOM.items[G.VOM.currItemIdx].imageIdx);
            break;
          case 'custom':
            e.stopPropagation();
            e.preventDefault();
            PopupShare(G.VOM.items[G.VOM.currItemIdx].imageIdx);
            break;
          case 'linkOriginal':
            // $closeB.on( (G.isIOS ? "touchstart" : "click") ,function(e){     // IPAD
            e.stopPropagation();
            e.preventDefault();
            OpenOriginal( G.VOM.Item(G.VOM.currItemIdx) );
            if( G.O.kind == 'google' || G.O.kind == 'google2') {
              var sU='https://plus.google.com/photos/'+G.O.userID+'/albums/'+G.VOM.Item(G.VOM.currItemIdx).albumID+'/'+G.VOM.Item(G.VOM.currItemIdx).GetID();
              window.open(sU,'_blank');
            }
            
            if( G.O.kind == 'flickr') {
              var sU='https://www.flickr.com/photos/'+G.O.userID+'/'+G.VOM.Item(G.VOM.currItemIdx).GetID();
              window.open(sU,'_blank');
            }
            break;
        }
        
        // custom button
        if( ngy2action.indexOf('custom') == 0  && typeof G.O.fnImgToolbarCustClick == 'function') {
          // var n=ngy2action.substring(6);
          G.O.fnImgToolbarCustClick(ngy2action, $this, G.VOM.Item(G.VOM.currItemIdx));
        }
        
      }
      


    
    // Display photo infos
    //function ViewerInfoSet() {
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
      if( item.exif.flash != '' ) {
        sexif+= ' &nbsp; '+item.exif.flash;
      }
      if( item.exif.focallength != '' ) {
        sexif+= ' &nbsp; '+item.exif.focallength+'mm';
      }
      if( item.exif.fstop != '' ) {
        sexif+= ' &nbsp; f'+item.exif.fstop;
      }
      if( item.exif.exposure != '' ) {
        sexif+= ' &nbsp; '+item.exif.exposure+'s';
      }
      if( item.exif.iso != '' ) {
        sexif+= ' &nbsp; '+item.exif.iso+' ISO';
      }
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
          if( G.supportFullscreenAPI ) {
            r='<div class="ngbt ngy2viewerToolAction setFullscreenButton fullscreenButton nGEvent" data-ngy2action="fullScreen">'+G.O.icons.viewerFullscreenOn+'</div>';
          }
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
            if( typeof G.O.fnImgToolbarCustInit == 'function' ) {
              // content to display from custom script
              t=G.O.fnImgToolbarCustInit(e);
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
    
    function ViewerZoomStart() {
      if( G.O.viewerZoom && !G.VOM.viewerImageIsChanged ) {
      var item=G.VOM.Item(G.VOM.currItemIdx);
        if( item.imageHeight > 0 && item.imageWidth > 0 ) {
          if( G.VOM.isZooming === false ) {
            // default zoom
            var h=G.VOM.$viewer.height()-G.VOM.padding.H;
            G.VOM.currentZoom=h/item.imageHeight;
            G.VOM.isZooming=true;
          }
          return true;
        }
      }
    }
          
    function ViewerZoomIn( zoomIn ) {
      if( zoomIn ) {
        // zoom in
        G.VOM.currentZoom+=0.1;
        if( G.VOM.currentZoom > 2 ) {
          G.VOM.currentZoom=2;
        }
      }
      else {
        // zoom out
        G.VOM.currentZoom-=0.1;
        if( G.VOM.currentZoom < 0.2 ) {
          G.VOM.currentZoom=0.2;
        }
      }
      ViewerZoomApply();
    }


    function ViewerZoomApply() {
          
      // var curZ=G.VOM.currentZoom;
        var item=G.VOM.Item(G.VOM.currItemIdx);
        // if( item.imageHeight > 0 && item.imageWidth > 0 ) {

      
      var imageCurrentHeight=(item.imageHeight/window.devicePixelRatio) * G.VOM.currentZoom;
      var imageCurrentWidth=(item.imageWidth/window.devicePixelRatio) * G.VOM.currentZoom;
      G.VOM.$imgC.children().eq(0).css( {'height': imageCurrentHeight, 'max-height': 'none' });
      G.VOM.$imgC.children().eq(0).css( {'width': imageCurrentWidth, 'max-width': 'none' });

      // center image
      var posX=0;
      if( imageCurrentWidth > G.VOM.window.lastWidth ) {
        posX=-(imageCurrentWidth-G.VOM.window.lastWidth)/2;
      }
      var h=G.VOM.$viewer.height()-G.VOM.padding.H;
      var posY=0;
      if( imageCurrentHeight > G.VOM.window.lastHeight ) {
        posY=(imageCurrentHeight-G.VOM.window.lastHeight)/2;
      }
      posY=0;   // actually it seems that the image is always centered vertically -> so no need to to anything
      G.VOM.zoomPosX=posX;
      G.VOM.zoomPosY=posY;

      ResizeInternalViewer(true);
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
      
      var item=G.VOM.Item(vomIdx);
    
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
      if( $cu.length > 0 && typeof G.O.fnImgToolbarCustDisplay == 'function' ) {
        G.O.fnImgToolbarCustDisplay( $cu, item);
      }
      
      // set event handlers again
      ViewerToolsOn();
    }
    
    // Scroll the image in the lightbox (left/right)
    function ImageSwipeTranslateX( posX ) {
      G.VOM.swipePosX=posX;
      if( G.CSStransformName == null ) {
        G.VOM.$imgC.css({ left: posX }); 
      }
      else {
        G.VOM.$imgC[0].style[G.CSStransformName]= 'translateX('+posX+'px)';
        if(  G.O.imageTransition == 'swipe' ) {
          if( posX > 0 ) {
            var $new=G.VOM.$imgP;
            // var dir=getViewport().w;
            var dir=G.VOM.$viewer.width();
            G.VOM.$imgP.css({visibility:'visible', left:0, opacity:1});
            G.VOM.$imgP[0].style[G.CSStransformName]= 'translateX('+(-dir+posX)+'px) '
            G.VOM.$imgN[0].style[G.CSStransformName]= 'translateX('+(-dir)+'px) '
          }
          else {
            var $new=G.VOM.$imgN;
            // var dir=-getViewport().w;
            var dir=-G.VOM.$viewer.width();
            G.VOM.$imgN.css({visibility:'visible', left:0, opacity:1});
            G.VOM.$imgN[0].style[G.CSStransformName]= 'translateX('+(-dir+posX)+'px) '
            G.VOM.$imgP[0].style[G.CSStransformName]= 'translateX('+(-dir)+'px) '
          }
        }
      }
    }
    
    // Display next image
    function DisplayNextImage() {
      if( G.VOM.viewerImageIsChanged ) { return; }
      if( (new Date().getTime()) - G.VOM.timeImgChanged < 300 ) { return; }
      
      TriggerCustomEvent('lightboxNextImage');
      DisplayInternalViewer(GetNextImageIdx(G.VOM.currItemIdx), 'nextImage');
    };
    
    // Display previous image
    function DisplayPreviousImage() {
      if( G.VOM.viewerImageIsChanged ) { return; }
      if( (new Date().getTime()) - G.VOM.timeImgChanged < 300 ) { return; }
      if( G.VOM.playSlideshow ) {
        SlideshowToggle();
      }
      
      TriggerCustomEvent('lightboxPreviousImage');
      DisplayInternalViewer(GetPreviousImageIdx(G.VOM.currItemIdx), 'previousImage');
    };
    
    // Display image (and run animation)
    function DisplayInternalViewer( vomIdx, displayType ) {
      
      G.VOM.$imgC.children().eq(0).unbind('.imagesLoaded');
      if( G.VOM.playSlideshow ) {
        window.clearTimeout(G.VOM.playSlideshowTimerID);
      }

      G.VOM.timeImgChanged=new Date().getTime();
      G.VOM.viewerImageIsChanged=true;
      G.VOM.isZooming=false;
      ResizeInternalViewer(true);
 
      var displayNext=true;

      SetLocationHash( G.VOM.Item(vomIdx).albumID, G.VOM.Item(vomIdx).GetID() );
      
      
      if( G.O.debugMode && console.timeline ) {
        console.timeline('nanogallery2_viewer');
      }

      G.VOM.currItemIdx=vomIdx;
      var vP=getViewport();
      
      if( displayType == '' ) {
        // first image --> just appear / no slide animation
        G.VOM.$imgC.css({ opacity:1, left:0, visibility: 'visible'});
        var tweenable = new NGTweenable();
        tweenable.tween({
          from:       { scale: 0.8, opacity:0  },
          to:         { scale: 1, opacity:1 },
          attachment: { idx:vomIdx, dT:displayType },
          easing: 'easeInOutSine',
          duration: 400,
          step: function (state, att) {
            G.VOM.$content.css( G.CSStransformName , 'scale('+state.scale+')').css('opacity',state.opacity);
          },
          finish: function (state, att) {
            G.VOM.$content.css( G.CSStransformName , '').css('opacity',1);
            DisplayInternalViewerComplete(att.idx, att.dT);
          }
        });
      }
      else {
        // animate the image change
        switch( G.O.imageTransition ) {
          case 'fade':
            var $new=(displayType == 'nextImage' ? G.VOM.$imgN : G.VOM.$imgP);
            $new.css({ opacity:0, left:0, visibility:'visible'});
            var tweenable = new NGTweenable();
            tweenable.tween({
              from: { o: 0  },
              to: { o: 1 },
              easing: 'easeInOutSine',
              attachment: { idx:vomIdx, dT:displayType, $e:$new },
              duration: 300,
              step: function (state, att) {
                G.VOM.$imgC.css({ opacity: 1-state.o }); 
                att.$e.css({ opacity: state.o });
              },
              finish: function (state, att) {
                G.VOM.$imgC.css({ opacity: 0 });
                att.$e.css({ opacity: 1 });
                DisplayInternalViewerComplete(att.idx, att.dT);
              }
            });
            break;
            
          case 'slideBETA':
            var $new=(displayType == 'nextImage' ? G.VOM.$imgN : G.VOM.$imgP);
            $new.css({ opacity:1, left:0, visibility:'visible'});
            if( G.CSStransformName == null ) {
              // animate LEFT
              jQuery.when(
                G.VOM.$imgC.animate({ left: (displayType == 'nextImage' ? -getViewport().w : getViewport().w)+'px', opacity: 0 }, 500), 
                $new.animate({ opacity: 1 }, 300)
              ).done(function () {
                DisplayInternalViewerComplete(vomIdx, displayType);
              });
            }
            else {
              // animate TRANSLATEX
              var dir=(displayType == 'nextImage' ? - getViewport().w : getViewport().w);
              $new[0].style[G.CSStransformName]= 'translateX('+(-dir)+'px) '
              var from = {v: G.VOM.swipePosX };
              var to = {v: (displayType == 'nextImage' ? - getViewport().w : getViewport().w)};
              jQuery(from).animate(to, { duration:500, step: function(currentValue) {
                  G.VOM.$imgC[0].style[G.CSStransformName]= 'translateX('+currentValue+'px)';
                  G.VOM.$imgC.css({ opacity: (1-Math.abs(currentValue/dir)) });
                  $new[0].style[G.CSStransformName]= 'translateX('+(-dir+currentValue)+'px) '
                }, complete: function() {
                  G.VOM.$imgC[0].style[G.CSStransformName]= '';
                  G.VOM.$imgC.css({ opacity:0 });
                  DisplayInternalViewerComplete(vomIdx, displayType);
                }
              });
            }
            break;

          case 'swipe':
            var $new=(displayType == 'nextImage' ? G.VOM.$imgN : G.VOM.$imgP);
            // if( G.CSStransformName == null || ( G.isIOS && G.IOSversion < 6 ) ) {
            if( G.CSStransformName == null  ) {
              // animate LEFT
              $new.css({ opacity:0, left:0, visibility:'visible'});
              jQuery.when(
                G.VOM.$imgC.animate({ left: ((displayType == 'nextImage' ? -getViewport().w : getViewport().w)*2)+'px' }, 500), 
                $new.animate({ opacity: 1 }, 300)
              ).done(function () {
                DisplayInternalViewerComplete(vomIdx, displayType);
              });
            }
            else {
              // animate using TRANSLATEX
              var dir=(displayType == 'nextImage' ? - vP.w : vP.w);
              $new.css({ opacity:1, left:0, visibility:'visible'});
              $new[0].style[G.CSStransformName]= 'translateX('+(-dir)+'px) '
              var tweenable = new NGTweenable();
              tweenable.tween({
                from: { t: G.VOM.swipePosX  },
                to: { t: (displayType == 'nextImage' ? - vP.w : vP.w) },
                attachment: { idx:vomIdx, dT:displayType, $e:$new, dir:dir },
                duration: 300,
                easing: 'easeInOutSine',
                step: function (state, att) {
                  G.VOM.$imgC[0].style[G.CSStransformName]= 'translateX('+state.t+'px)';
                  att.$e[0].style[G.CSStransformName]= 'translateX('+(-att.dir+state.t)+'px) ';
                },
                finish: function (state, att) {
                  G.VOM.$imgC[0].style[G.CSStransformName]= '';
                  att.$e[0].style[G.CSStransformName]= '';
                  DisplayInternalViewerComplete(att.idx, att.dT);
                }
              });
            }
            break;
            
          case 'slideAppear':
          default:
            var dir= getViewport().w+'px';
            var $new=G.VOM.$imgP;
            if( displayType == 'nextImage' ) {
              dir='-'+dir;
              $new=G.VOM.$imgN;
            }
            $new.css({ opacity:0, left:0, visibility:'visible'});
            jQuery.when(
              G.VOM.$imgC.animate({ left: dir, opacity: 0 }, 500), 
              $new.animate({ opacity: 1 }, 300)
            ).done(function () {
              ImageSwipeTranslateX(0);
              DisplayInternalViewerComplete(vomIdx, displayType);
            });
            break;
        }
      }
    }
  

    function DisplayInternalViewerComplete( vomIdx, displayType ) {
      ViewerToolbarElementContent();
      if( G.O.debugMode && console.timeline ) {
        console.timelineEnd('nanogallery2_viewer');
      }

      if( typeof G.O.fnImgDisplayed === 'function'){
        if( !G.O.fnImgDisplayed(G.VOM.Item(vomIdx).$elt, G.VOM.Item(vomIdx)) ) { return; }
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
      
      G.VOM.$imgN.css({ opacity:0, left:0, visibility:'hidden' }).attr('src','');
      G.VOM.$imgN.children().eq(0).attr('src',G.emptyGif).attr('src',G.VOM.Item(GetNextImageIdx(vomIdx)).responsiveURL());
      G.VOM.$imgP.css({ opacity:0, left:0, visibility:'hidden'}).attr('src','');
      G.VOM.$imgP.children().eq(0).attr('src',G.emptyGif).attr('src',G.VOM.Item(GetPreviousImageIdx(vomIdx)).responsiveURL());

      // slideshow mode - wait until image is loaded to start the delay for next image
      var item=G.VOM.Item(G.VOM.currItemIdx);
      if( G.VOM.playSlideshow || item.imageHeight == 0 || item.imageWidth == 0) {
        
        G.VOM.$imgC.children().eq(0).ngimagesLoaded().always( function( instance ) {
          
          if( item.imageWidth == 0 ) {
            item.imageWidth=G.VOM.$imgC.children().eq(0).prop('naturalWidth');
          }
          if( item.imageHeight == 0 ) {
            item.imageHeight=G.VOM.$imgC.children().eq(0).prop('naturalHeight');
          }

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
        e.stopPropagation();
        e.preventDefault();
        CloseInternalViewer(vomIdx);
        return false;
      });

      ResizeInternalViewer();

      // TODO: following code does not work
      //jQuery(G.containerViewerContent).item.$getElt('img').on('resize', function(){ 
      //  ResizeInternalViewer('.imgCurrent');
      //  console.log('resized');
      //});

      G.VOM.viewerImageIsChanged=false;
      TriggerCustomEvent('lightboxImageDisplayed');
      
    }
    

    function GetNextImageIdx( vomIdx ) {
    
      if( vomIdx == G.VOM.items.length-1 ) {
        return 0;
      }
      else {
        return vomIdx+1;
      }
    
    }

    function GetPreviousImageIdx( vomIdx ) {
    
      if( vomIdx == 0 ) {
        return G.VOM.items.length-1;
      }
      else {
        return vomIdx-1;
      }
    }

    // Close the internal lightbox
    function CloseInternalViewer( vomIdx ) {

      if( G.VOM.viewerImageIsChanged ) {
        G.VOM.$content.find('*').stop(true,true);
        //return;
      }
      G.VOM.viewerImageIsChanged=false;

      if( G.VOM.viewerDisplayed ) {

        ScrollbarSetVisible();        
        
        if( G.VOM.playSlideshow ) {
          window.clearTimeout(G.VOM.playSlideshowTimerID);
          G.VOM.playSlideshow=false;
        }

        // G.VOM.userEvents.removeEventListeners();
        // G.VOM.userEvents=null;
        G.VOM.hammertime.destroy();
        G.VOM.hammertime=null;

        if( G.supportFullscreenAPI ) {
          if( G.VOM.viewerIsFullscreen ) {
            G.VOM.viewerIsFullscreen=false;
            ngscreenfull.exit();
          }
        }
        
        G.VOM.$cont.hide(0).off().show(0).html('').remove();
        G.VOM.viewerDisplayed=false;

        if( vomIdx != null ) {
          if( G.GOM.albumIdx == -1 ) {
            // album not displayed --> display gallery
            DisplayAlbum( '', G.VOM.Item(vomIdx).albumID );
          }
          else {
            SetLocationHash( G.VOM.Item(vomIdx).albumID, '' );
            ThumbnailHoverReInitAll();
          }
        }
        G.VOM.timeImgChanged=new Date().getTime();
      }
    }
    
    
    function ScrollbarSetVisible() {
      //jQuery('body').css({overflow:'initial'});
     jQuery('body').css({overflow:'visible'});
    }
    

    function ResizeInternalViewer( forceUpdate ) {
      forceUpdate = typeof forceUpdate !== 'undefined' ? forceUpdate : false;
      
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

      if( !G.VOM.viewerImageIsChanged && G.VOM.isZooming ) {
        ViewerImageSetPosition(G.VOM.panPosX, G.VOM.panPosY, false);
      }
      else {
        G.VOM.isZooming=false;
        G.VOM.panPosX=0;
        G.VOM.panPosY=0;
        G.VOM.zoomPosX=0;
        G.VOM.zoomPosY=0;
        G.VOM.$imgC[0].style[G.CSStransformName]= 'translate3D(0,0,0) ';

        
        var maxW=windowsW-G.VOM.padding.H;
        var item=G.VOM.Item(G.VOM.currItemIdx);
        if( item.imageWidth > 0 &&  window.devicePixelRatio > 1 ) {
          var w=item.imageWidth/window.devicePixelRatio;
          if( maxW > w ) {
            maxW=w;
          }
        }
        
        // G.VOM.$content.find('img').css({'max-width':(windowsW-G.VOM.padding.H), 'max-height':(windowsH-G.VOM.padding.V), 'height':'auto', 'width':'auto' });
        G.VOM.$content.find('img').css({'max-width':(maxW), 'max-height':(windowsH-G.VOM.padding.V), 'height':'auto', 'width':'auto' });
      }
      
    }
    
    // position the image depending on the zoom factor and the pan X/Y position
    function ViewerImageSetPosition(posX, posY, savePosition ) {

      if( savePosition ) {
        G.VOM.panPosX=posX;
        G.VOM.panPosY=posY;
      }

      posX+=G.VOM.zoomPosX;
      posY+=G.VOM.zoomPosY;
    
      G.VOM.$imgC[0].style[G.CSStransformName]= 'translate3D('+ posX+'px, '+ posY+'px, 0) ';
    }

    

    function ImageGetSize( item ) {
    }
    
    function ImageGetSize2( item ) {
      // inspired by code from Dmitry Semenov
        var counter = 0,
				img = item.img[0],
        
				mfpSetInterval = function(delay) {

					if(_imgInterval) {
						clearInterval(_imgInterval);
					}
					// decelerating interval that checks for size of an image
					_imgInterval = setInterval(function() {
						if(img.naturalWidth > 0) {
							mfp._onImageHasSize(item);
							return;
						}

						if(counter > 200) {
							clearInterval(_imgInterval);
						}

						counter++;
						if(counter === 3) {
							mfpSetInterval(10);
						} else if(counter === 40) {
							mfpSetInterval(50);
						} else if(counter === 100) {
							mfpSetInterval(500);
						}
					}, delay);
				};

        mfpSetInterval(1);
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

      // fullscreen API support
      if( document.fullscreenEnabled || document.webkitFullscreenEnabled || document.msFullscreenEnabled || document.mozFullScreenEnabled) {
        G.supportFullscreenAPI=true;
      } else {
        NGY2Tools.NanoConsoleLog(G, 'Your browser does not support the fullscreen API. Fullscreen button will not be displayed.');
      }

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
          G.$E.conTn.css( G.CSStransformName , 'translateX('+(ev.deltaX)+'px)');
        }
      });
      G.GOM.hammertime.on('panend', function(ev) {
        // console.log(ev);
        if( G.O.paginationSwipe && G.layout.support.rows && G.galleryDisplayMode.Get() == 'PAGINATION' ) {
          if( Math.abs(ev.deltaY) > 100 ) {
            // user moved vertically -> cancel pagination
            G.$E.conTn.css( G.CSStransformName , 'translateX(0px)');
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
          G.$E.conTn.css( G.CSStransformName , 'translateX(0px)');
          // pX=0;
        }
      });
      G.GOM.hammertime.on('tap', function(ev) {
        // console.log(ev);
        ev.srcEvent.stopPropagation();
        ev.srcEvent.preventDefault();  // cancel  mouseenter event

        // OpenTouchedThumbnail(ev.target);
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
          // console.log(r);
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
              // first touch
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
          ProcessLocationHash(true);
        });
      }
      
      // Page resize
      jQuery(window).on('resize.nanogallery2.'+G.baseEltID, debounce( ResizeWindowEvent, 100, false) );
      
      // Event page scrolled
      $(window).on('scroll.nanogallery2.'+G.baseEltID,  debounce( OnScrollEvent, 100, false) );
      
      
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
            switch( e.keyCode) {
              case 27:    // Esc key
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
      
      
      jQuery(window).bind('mousewheel wheel', function(e){
        if( G.VOM.viewerDisplayed ) {
        // console.log( e.originalEvent.wheelDelta + ' - ' + e.originalEvent.detail);
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

    }
    
    //----- Manage browser location hash (deep linking and browser back/forward)
    function ProcessLocationHash() {

      // standard use case -> location hash processing
      if( !G.O.locationHash ) { return false; }

      var curGal='#nanogallery/'+G.baseEltID+'/',
      newLocationHash=location.hash;
console.log('newLocationHash1: ' +newLocationHash);
console.log('G.locationHashLastUsed: ' +G.locationHashLastUsed);
      
      if( newLocationHash == '' ) {
        if( G.GOM.lastDisplayedIdx != -1 ) {
          // back button and no hash --> display first album
          G.locationHashLastUsed='';
          DisplayAlbum( '', '0');
          return true;
        }
      }

      if( newLocationHash == G.locationHashLastUsed ) { return; }
      
      if( newLocationHash.indexOf(curGal) == 0 ) {
        // item IDs detected
        var IDs=parseIDs( newLocationHash.substring(curGal.length) );
        if( IDs.imageID != '0' ) {
console.log('display: ' + IDs.albumID +'-'+ IDs.imageID );
          DisplayPhoto( IDs.imageID, IDs.albumID );
          return true;
        }
        else {
          DisplayAlbum( '-1', IDs.albumID );
          return true;
        }
      }    
      
      return false;
    }

    //---- Set a new browser location hash
    function SetLocationHash(albumID, imageID ) {
      if( !G.O.locationHash ) { return false; }

      if( albumID == '-1' || albumID == '0' ) {
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
        return;
      }
      
      var newLocationHash='#'+'nanogallery/'+G.baseEltID+'/'+ albumID;
      if( imageID != '' ) {
        newLocationHash+='/'+imageID;
      }

      var lH=location.hash;
console.log('newLocationHash2: '+newLocationHash);
console.log('lH: '+lH);
      if(  lH == '' || lH != newLocationHash ) {
        // G.locationHashLastUsed='#'+newLocationHash;
        G.locationHashLastUsed=newLocationHash;
        console.log('new G.locationHashLastUsed: '+G.locationHashLastUsed);
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

    
    function OnScrollEvent() {
      if( G.scrollTimeOut ) {
        clearTimeout(G.scrollTimeOut);
      }
      
      G.scrollTimeOut = setTimeout(function () {
      
        //console.log('OnScrollEvent');
      
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
  if ( typeof define == 'function' && define.amd ) {
    // AMD - RequireJS
    define( 'ev-emitter/ev-emitter',factory );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS - Browserify, Webpack
    module.exports = factory();
  } else {
    // Browser globals
    global.ngEvEmitter = factory();
  }

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

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( [
      'ev-emitter/ev-emitter'
    ], function( ngEvEmitter ) {
      return factory( window, ngEvEmitter );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('ev-emitter')
    );
  } else {
    // browser global
    window.ngimagesLoaded = factory(
      window,
      window.ngEvEmitter
    );
  }

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
// v1.1.0
// by sindresorhus - https://github.com/sindresorhus
// from: https://github.com/sindresorhus/screenfull.js

// NGY BUILD:
// replace "screenfull" with "ngscreenfull"
// 

(function () {
	'use strict';

	var isCommonjs = typeof module !== 'undefined' && module.exports;
	var keyboardAllowed = typeof Element !== 'undefined' && 'ALLOW_KEYBOARD_INPUT' in Element;

	var fn = (function () {
		var val;
		var valLength;

		var fnMap = [
			[
				'requestFullscreen',
				'exitFullscreen',
				'fullscreenElement',
				'fullscreenEnabled',
				'fullscreenchange',
				'fullscreenerror'
			],
			// new WebKit
			[
				'webkitRequestFullscreen',
				'webkitExitFullscreen',
				'webkitFullscreenElement',
				'webkitFullscreenEnabled',
				'webkitfullscreenchange',
				'webkitfullscreenerror'

			],
			// old WebKit (Safari 5.1)
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
				for (i = 0, valLength = val.length; i < valLength; i++) {
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
			if (/5\.1[\.\d]* Safari/.test(navigator.userAgent)) {
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
/*! shifty - v1.5.0 - 2015-05-31 - http://jeremyckahn.github.io/shifty */
(function(){var t=this,n=function(){"use strict";function n(){}function e(t,n){var e;for(e in t)Object.hasOwnProperty.call(t,e)&&n(e)}function i(t,n){return e(n,function(e){t[e]=n[e]}),t}function r(t,n){e(n,function(e){t[e]===void 0&&(t[e]=n[e])})}function o(t,n,e,i,r,o,u){var s,c,h,p=o>t?0:(t-o)/r;for(s in n)n.hasOwnProperty(s)&&(c=u[s],h="function"==typeof c?c:f[c],n[s]=a(e[s],i[s],h,p));return n}function a(t,n,e,i){return t+(n-t)*e(i)}function u(t,n){var i=h.prototype.filter,r=t._filterArgs;e(i,function(e){i[e][n]!==void 0&&i[e][n].apply(t,r)})}function s(t,n,e,i,r,a,s,c,h,f,p){g=n+e+i,y=Math.min(p||d(),g),v=y>=g,M=i-(g-y),t.isPlaying()&&!v?(t._scheduleId=f(t._timeoutHandler,m),u(t,"beforeTween"),n+e>y?o(1,r,a,s,1,1,c):o(y,r,a,s,i,n+e,c),u(t,"afterTween"),h(r,t._attachment,M)):t.isPlaying()&&v&&(h(s,t._attachment,M),t.stop(!0))}function c(t,n){var i={},r=typeof n;return"string"===r||"function"===r?e(t,function(t){i[t]=n}):e(t,function(t){i[t]||(i[t]=n[t]||l)}),i}function h(t,n){this._currentState=t||{},this._configured=!1,this._scheduleFunction=p,n!==void 0&&this.setConfig(n)}var f,p,l="linear",_=500,m=1e3/60,w=Date.now?Date.now:function(){return+new Date},d="undefined"!=typeof SHIFTY_DEBUG_NOW?SHIFTY_DEBUG_NOW:w;p="undefined"!=typeof window?window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||window.mozCancelRequestAnimationFrame&&window.mozRequestAnimationFrame||setTimeout:setTimeout;var g,y,v,M;return h.prototype.tween=function(t){return this._isTweening?this:(void 0===t&&this._configured||this.setConfig(t),this._timestamp=d(),this._start(this.get(),this._attachment),this.resume())},h.prototype.setConfig=function(t){t=t||{},this._configured=!0,this._attachment=t.attachment,this._pausedAtTime=null,this._scheduleId=null,this._delay=t.delay||0,this._start=t.start||n,this._step=t.step||n,this._finish=t.finish||n,this._duration=t.duration||_,this._currentState=i({},t.from)||this.get(),this._originalState=this.get(),this._targetState=i({},t.to)||this.get();var e=this;this._timeoutHandler=function(){s(e,e._timestamp,e._delay,e._duration,e._currentState,e._originalState,e._targetState,e._easing,e._step,e._scheduleFunction)};var o=this._currentState,a=this._targetState;return r(a,o),this._easing=c(o,t.easing||l),this._filterArgs=[o,this._originalState,a,this._easing],u(this,"tweenCreated"),this},h.prototype.get=function(){return i({},this._currentState)},h.prototype.set=function(t){this._currentState=t},h.prototype.pause=function(){return this._pausedAtTime=d(),this._isPaused=!0,this},h.prototype.resume=function(){return this._isPaused&&(this._timestamp+=d()-this._pausedAtTime),this._isPaused=!1,this._isTweening=!0,this._timeoutHandler(),this},h.prototype.seek=function(t){t=Math.max(t,0);var n=d();return 0===this._timestamp+t?this:(this._timestamp=n-t,this.isPlaying()||(this._isTweening=!0,this._isPaused=!1,s(this,this._timestamp,this._delay,this._duration,this._currentState,this._originalState,this._targetState,this._easing,this._step,this._scheduleFunction,n),this.pause()),this)},h.prototype.stop=function(e){return this._isTweening=!1,this._isPaused=!1,this._timeoutHandler=n,(t.cancelAnimationFrame||t.webkitCancelAnimationFrame||t.oCancelAnimationFrame||t.msCancelAnimationFrame||t.mozCancelRequestAnimationFrame||t.clearTimeout)(this._scheduleId),e&&(u(this,"beforeTween"),o(1,this._currentState,this._originalState,this._targetState,1,0,this._easing),u(this,"afterTween"),u(this,"afterTweenEnd"),this._finish.call(this,this._currentState,this._attachment)),this},h.prototype.isPlaying=function(){return this._isTweening&&!this._isPaused},h.prototype.setScheduleFunction=function(t){this._scheduleFunction=t},h.prototype.dispose=function(){var t;for(t in this)this.hasOwnProperty(t)&&delete this[t]},h.prototype.filter={},h.prototype.formula={linear:function(t){return t}},f=h.prototype.formula,i(h,{now:d,each:e,tweenProps:o,tweenProp:a,applyFilter:u,shallowCopy:i,defaults:r,composeEasingObject:c}),"function"==typeof SHIFTY_DEBUG_NOW&&(t.timeoutHandler=s),"object"==typeof exports?module.exports=h:"function"==typeof define&&define.amdDISABLED?define(function(){return h}):t.NGTweenable===void 0&&(t.NGTweenable=h),h}();(function(){n.shallowCopy(n.prototype.formula,{easeInQuad:function(t){return Math.pow(t,2)},easeOutQuad:function(t){return-(Math.pow(t-1,2)-1)},easeInOutQuad:function(t){return 1>(t/=.5)?.5*Math.pow(t,2):-.5*((t-=2)*t-2)},easeInCubic:function(t){return Math.pow(t,3)},easeOutCubic:function(t){return Math.pow(t-1,3)+1},easeInOutCubic:function(t){return 1>(t/=.5)?.5*Math.pow(t,3):.5*(Math.pow(t-2,3)+2)},easeInQuart:function(t){return Math.pow(t,4)},easeOutQuart:function(t){return-(Math.pow(t-1,4)-1)},easeInOutQuart:function(t){return 1>(t/=.5)?.5*Math.pow(t,4):-.5*((t-=2)*Math.pow(t,3)-2)},easeInQuint:function(t){return Math.pow(t,5)},easeOutQuint:function(t){return Math.pow(t-1,5)+1},easeInOutQuint:function(t){return 1>(t/=.5)?.5*Math.pow(t,5):.5*(Math.pow(t-2,5)+2)},easeInSine:function(t){return-Math.cos(t*(Math.PI/2))+1},easeOutSine:function(t){return Math.sin(t*(Math.PI/2))},easeInOutSine:function(t){return-.5*(Math.cos(Math.PI*t)-1)},easeInExpo:function(t){return 0===t?0:Math.pow(2,10*(t-1))},easeOutExpo:function(t){return 1===t?1:-Math.pow(2,-10*t)+1},easeInOutExpo:function(t){return 0===t?0:1===t?1:1>(t/=.5)?.5*Math.pow(2,10*(t-1)):.5*(-Math.pow(2,-10*--t)+2)},easeInCirc:function(t){return-(Math.sqrt(1-t*t)-1)},easeOutCirc:function(t){return Math.sqrt(1-Math.pow(t-1,2))},easeInOutCirc:function(t){return 1>(t/=.5)?-.5*(Math.sqrt(1-t*t)-1):.5*(Math.sqrt(1-(t-=2)*t)+1)},easeOutBounce:function(t){return 1/2.75>t?7.5625*t*t:2/2.75>t?7.5625*(t-=1.5/2.75)*t+.75:2.5/2.75>t?7.5625*(t-=2.25/2.75)*t+.9375:7.5625*(t-=2.625/2.75)*t+.984375},easeInBack:function(t){var n=1.70158;return t*t*((n+1)*t-n)},easeOutBack:function(t){var n=1.70158;return(t-=1)*t*((n+1)*t+n)+1},easeInOutBack:function(t){var n=1.70158;return 1>(t/=.5)?.5*t*t*(((n*=1.525)+1)*t-n):.5*((t-=2)*t*(((n*=1.525)+1)*t+n)+2)},elastic:function(t){return-1*Math.pow(4,-8*t)*Math.sin((6*t-1)*2*Math.PI/2)+1},swingFromTo:function(t){var n=1.70158;return 1>(t/=.5)?.5*t*t*(((n*=1.525)+1)*t-n):.5*((t-=2)*t*(((n*=1.525)+1)*t+n)+2)},swingFrom:function(t){var n=1.70158;return t*t*((n+1)*t-n)},swingTo:function(t){var n=1.70158;return(t-=1)*t*((n+1)*t+n)+1},bounce:function(t){return 1/2.75>t?7.5625*t*t:2/2.75>t?7.5625*(t-=1.5/2.75)*t+.75:2.5/2.75>t?7.5625*(t-=2.25/2.75)*t+.9375:7.5625*(t-=2.625/2.75)*t+.984375},bouncePast:function(t){return 1/2.75>t?7.5625*t*t:2/2.75>t?2-(7.5625*(t-=1.5/2.75)*t+.75):2.5/2.75>t?2-(7.5625*(t-=2.25/2.75)*t+.9375):2-(7.5625*(t-=2.625/2.75)*t+.984375)},easeFromTo:function(t){return 1>(t/=.5)?.5*Math.pow(t,4):-.5*((t-=2)*Math.pow(t,3)-2)},easeFrom:function(t){return Math.pow(t,4)},easeTo:function(t){return Math.pow(t,.25)}})})(),function(){function t(t,n,e,i,r,o){function a(t){return((l*t+_)*t+m)*t}function u(t){return((w*t+d)*t+g)*t}function s(t){return(3*l*t+2*_)*t+m}function c(t){return 1/(200*t)}function h(t,n){return u(p(t,n))}function f(t){return t>=0?t:0-t}function p(t,n){var e,i,r,o,u,c;for(r=t,c=0;8>c;c++){if(o=a(r)-t,n>f(o))return r;if(u=s(r),1e-6>f(u))break;r-=o/u}if(e=0,i=1,r=t,e>r)return e;if(r>i)return i;for(;i>e;){if(o=a(r),n>f(o-t))return r;t>o?e=r:i=r,r=.5*(i-e)+e}return r}var l=0,_=0,m=0,w=0,d=0,g=0;return m=3*n,_=3*(i-n)-m,l=1-m-_,g=3*e,d=3*(r-e)-g,w=1-g-d,h(t,c(o))}function e(n,e,i,r){return function(o){return t(o,n,e,i,r,1)}}n.setBezierFunction=function(t,i,r,o,a){var u=e(i,r,o,a);return u.displayName=t,u.x1=i,u.y1=r,u.x2=o,u.y2=a,n.prototype.formula[t]=u},n.unsetBezierFunction=function(t){delete n.prototype.formula[t]}}(),function(){function t(t,e,i,r,o,a){return n.tweenProps(r,e,t,i,1,a,o)}var e=new n;e._filterArgs=[],n.interpolate=function(i,r,o,a,u){var s=n.shallowCopy({},i),c=u||0,h=n.composeEasingObject(i,a||"linear");e.set({});var f=e._filterArgs;f.length=0,f[0]=s,f[1]=i,f[2]=r,f[3]=h,n.applyFilter(e,"tweenCreated"),n.applyFilter(e,"beforeTween");var p=t(i,s,r,o,h,c);return n.applyFilter(e,"afterTween"),p}}(),function(t){function n(t,n){var e,i=[],r=t.length;for(e=0;r>e;e++)i.push("_"+n+"_"+e);return i}function e(t){var n=t.match(M);return n?(1===n.length||t[0].match(v))&&n.unshift(""):n=["",""],n.join(O)}function i(n){t.each(n,function(t){var e=n[t];"string"==typeof e&&e.match(S)&&(n[t]=r(e))})}function r(t){return s(S,t,o)}function o(t){var n=a(t);return"rgb("+n[0]+","+n[1]+","+n[2]+")"}function a(t){return t=t.replace(/#/,""),3===t.length&&(t=t.split(""),t=t[0]+t[0]+t[1]+t[1]+t[2]+t[2]),b[0]=u(t.substr(0,2)),b[1]=u(t.substr(2,2)),b[2]=u(t.substr(4,2)),b}function u(t){return parseInt(t,16)}function s(t,n,e){var i=n.match(t),r=n.replace(t,O);if(i)for(var o,a=i.length,u=0;a>u;u++)o=i.shift(),r=r.replace(O,e(o));return r}function c(t){return s(T,t,h)}function h(t){for(var n=t.match(F),e=n.length,i=t.match(I)[0],r=0;e>r;r++)i+=parseInt(n[r],10)+",";return i=i.slice(0,-1)+")"}function f(i){var r={};return t.each(i,function(t){var o=i[t];if("string"==typeof o){var a=d(o);r[t]={formatString:e(o),chunkNames:n(a,t)}}}),r}function p(n,e){t.each(e,function(t){for(var i=n[t],r=d(i),o=r.length,a=0;o>a;a++)n[e[t].chunkNames[a]]=+r[a];delete n[t]})}function l(n,e){t.each(e,function(t){var i=n[t],r=_(n,e[t].chunkNames),o=m(r,e[t].chunkNames);i=w(e[t].formatString,o),n[t]=c(i)})}function _(t,n){for(var e,i={},r=n.length,o=0;r>o;o++)e=n[o],i[e]=t[e],delete t[e];return i}function m(t,n){k.length=0;for(var e=n.length,i=0;e>i;i++)k.push(t[n[i]]);return k}function w(t,n){for(var e=t,i=n.length,r=0;i>r;r++)e=e.replace(O,+n[r].toFixed(4));return e}function d(t){return t.match(F)}function g(n,e){t.each(e,function(t){var i,r=e[t],o=r.chunkNames,a=o.length,u=n[t];if("string"==typeof u){var s=u.split(" "),c=s[s.length-1];for(i=0;a>i;i++)n[o[i]]=s[i]||c}else for(i=0;a>i;i++)n[o[i]]=u;delete n[t]})}function y(n,e){t.each(e,function(t){var i=e[t],r=i.chunkNames,o=r.length,a=n[r[0]],u=typeof a;if("string"===u){for(var s="",c=0;o>c;c++)s+=" "+n[r[c]],delete n[r[c]];n[t]=s.substr(1)}else n[t]=a})}var v=/(\d|\-|\.)/,M=/([^\-0-9\.]+)/g,F=/[0-9.\-]+/g,T=RegExp("rgb\\("+F.source+/,\s*/.source+F.source+/,\s*/.source+F.source+"\\)","g"),I=/^.*\(/,S=/#([0-9]|[a-f]){3,6}/gi,O="VAL",b=[],k=[];t.prototype.filter.token={tweenCreated:function(t,n,e){i(t),i(n),i(e),this._tokenData=f(t)},beforeTween:function(t,n,e,i){g(i,this._tokenData),p(t,this._tokenData),p(n,this._tokenData),p(e,this._tokenData)},afterTween:function(t,n,e,i){l(t,this._tokenData),l(n,this._tokenData),l(e,this._tokenData),y(i,this._tokenData)}}}(n)}).call(null);


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

