/* nanogallery2 - v3.0.5 - 2021-01-06 - https://nanogallery2.nanostudio.org */
/*!
 * @preserve nanogallery2 - javascript photo / video gallery and lightbox
 * Homepage: http://nanogallery2.nanostudio.org
 * Sources:  https://github.com/nanostudio-org/nanogallery2
 *
 * License:  GPLv3 and commercial licence
 * 
 * Requirements:
 *  - jQuery (http://www.jquery.com) - version >= 1.7.1
 *
 * Embeded components:
 *  - shifty (https://github.com/jeremyckahn/shifty)
 *  - imagesloaded (https://github.com/desandro/imagesloaded)
 *  - hammer.js (http://hammerjs.github.io/)
 *  - screenfull.js (https://github.com/sindresorhus/screenfull.js)
 * Tools:
 *  - webfont generated with http://fontello.com - mainly based on Font Awesome Copyright (C) 2012 by Dave Gandy (http://fontawesome.io/)
 *  - ICO online converter: https://iconverticons.com/online/
 */ 


 
// ###########################################
// ##### nanogallery2 as a JQUERY PLUGIN #####
// ###########################################



// Expose plugin as an AMD module if AMD loader is present:
(function (factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // define('nanogallery2', ['jquery'], factory);
        define(['jquery'], factory);
    } else if (typeof exports === 'object' && typeof require === 'function') {
        // Browserify
        factory(require('jquery'));
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {
// ;(function ($) {
  "use strict";

  //##### TOOLS/HELPERS ####

  // Convert color to RGB/RGBA
  function ColorHelperToRGB( color ) {
    var obj = document.getElementById('ngyColorHelperToRGB');
    if (obj === null) {
      obj = document.createElement('div');
      obj.id = "ngyColorHelperToRGB";
      obj.style.cssText = 'display: none; color:' + color + ';';
      document.body.appendChild(obj);
    }
    
    var rgb = getComputedStyle(obj).color;

    // to get HEX value:
    // var rgb = getComputedStyle(obj).color.match(/\d+/g);
    // var r = parseInt(rgb[0]).toString(16);
    // var g = parseInt(rgb[1]).toString(16);
    // var b = parseInt(rgb[2]).toString(16);
    // var hex = '#' + r + g + b;

    return rgb;
  }

  
  // ##### helper for color handling
  // - normalise RGB/RGBA/HEX format
  // - lighten/darken color
  // Inspired by:          
  // https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
  // http://www.pimptrizkit.com/?t=20%20Shades
  function ShadeBlendConvert (p, from, to) {
    var rgba='';
    if( from.toUpperCase().substring(0,5) == 'RGBA(' ) {
      rgba='a';
      from='rgb('+from.substring(5);
    }

    if(typeof(p)!="number"||p<-1||p>1||typeof(from)!="string"||(from[0]!='r'&&from[0]!='#')||(typeof(to)!="string"&&typeof(to)!="undefined"))return null;
    //if(!this.sbcRip)this.sbcRip=function(d){
    function sbcRip(d){
      var l=d.length,RGB=new Object();
      if(l>9){
        d=d.split(",");
        if(d.length<3||d.length>4)return null;
        RGB[0]=i(d[0].slice(4)),RGB[1]=i(d[1]),RGB[2]=i(d[2]),RGB[3]=d[3]?parseFloat(d[3]):-1;
      }else{
        if(l==8||l==6||l<4)return null;
        if(l<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(l>4?d[4]+""+d[4]:"");
        d=i(d.slice(1),16),RGB[0]=d>>16&255,RGB[1]=d>>8&255,RGB[2]=d&255,RGB[3]=l==9||l==5?r(((d>>24&255)/255)*10000)/10000:-1;
      }
      return RGB;
    }
    var i=parseInt,r=Math.round,h=from.length>9,h=typeof(to)=="string"?to.length>9?true:to=="c"?!h:false:h,b=p<0,p=b?p*-1:p,to=to&&to!="c"?to:b?"#000000":"#FFFFFF",f=sbcRip(from),t=sbcRip(to);
    if(!f||!t)return null;
    if(h)return "rgb"+rgba+"("+r((t[0]-f[0])*p+f[0])+","+r((t[1]-f[1])*p+f[1])+","+r((t[2]-f[2])*p+f[2])+(f[3]<0&&t[3]<0?")":","+(f[3]>-1&&t[3]>-1?r(((t[3]-f[3])*p+f[3])*10000)/10000:t[3]<0?f[3]:t[3])+")");
    else return "#"+(0x100000000+(f[3]>-1&&t[3]>-1?r(((t[3]-f[3])*p+f[3])*255):t[3]>-1?r(t[3]*255):f[3]>-1?r(f[3]*255):255)*0x1000000+r((t[0]-f[0])*p+f[0])*0x10000+r((t[1]-f[1])*p+f[1])*0x100+r((t[2]-f[2])*p+f[2])).toString(16).slice(f[3]>-1||t[3]>-1?1:3);
  }
  
  
  // ##### clone a javascript object
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


  // Check if element is in viewport
  // avoid if possible (performance issue)
  /*
  function inViewport( $elt, threshold ) {
    var wp = getViewport(),
    eltOS = $elt.offset(),
    th = $elt.outerHeight(true),
    tw = $elt.outerWidth(true);
    if( eltOS.top >= (wp.t - threshold) 
      && (eltOS.top + th) <= (wp.t + wp.h + threshold)
      && eltOS.left >= (wp.l - threshold) 
      && (eltOS.left + tw) <= (wp.l + wp.w + threshold) ) {
      return true;
    }
    else {
      return false;
    }
  }
  */


  // Check if whole element is in ViewPort
  // avoid if possible (performance issue)
  function inViewportVert( $elt, threshold ) {
    var wp = getViewport(),
    eltOS = $elt.offset(),
    th = $elt.outerHeight(true);
    //var tw=$elt.outerWidth(true);

    if( wp.t == 0 && (eltOS.top) <= (wp.t + wp.h ) ) { return true; }

    if( eltOS.top >= wp.t && (eltOS.top + th) <= (wp.t + wp.h - threshold) ) {
        return true;
    }
    else {
      return false;
    }
  }
  // Check if top of the element is in ViewPort
  function topInViewportVert( $elt, threshold ) {
    var wp = getViewport(),
    eltOS = $elt.offset();

    if( eltOS.top >= wp.t && eltOS.top <= (wp.t + wp.h - threshold) ) {
        return true;
    }
    else {
      return false;
    }
  }


  // set z-index to display 2 elements on top of all others
  // function set2ElementsOnTop( start, elt1, elt2 ) {
    // var highest_index = 0;
    // if( start=='' ) { start= '*'; }
    // jQuery(start).each(function() {
      // var cur = parseInt(jQuery(this).css('z-index'));
      // highest_index = cur > highest_index ? cur : highest_index;
    // });
    // highest_index++;
    // jQuery(elt2).css('z-index',highest_index+1);
    // jQuery(elt1).css('z-index',highest_index);
  // }

  // set z-index to display element on top of all others
  function setElementOnTop( start, elt ) {
    var highest_index = 0;
    if( start == '' ) { start = '*'; }
    jQuery(start).each(function() {
      var cur = parseInt(jQuery(this).css('z-index'));
      highest_index = cur > highest_index ? cur : highest_index;
    });
    highest_index++;
    jQuery(elt).css('z-index',highest_index);
  }
  
  // return the real type of the object
  var toType = function( obj ) {
    // by Angus Croll - http://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
  };    
    

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

          // check album name - albumList/blockList/allowList
          NGY2Tools.FilterAlbumName = function( title, ID ) {
            var s = title.toUpperCase();
            if( this.albumList.length > 0 ) {
              for( var j=0; j < this.albumList.length; j++) {
                if( s === this.albumList[j].toUpperCase() || ID === this.albumList[j] ) {
                  return true;
                }
              }
            }
            else {
              var found = false;
              if( this.allowList !== null ) {
                //allowList : authorize only album cointaining one of the specified keyword in the title
                for( var j = 0; j < this.allowList.length; j++) {
                  if( s.indexOf(this.allowList[j]) !== -1 ) {
                    found = true;
                  }
                }
                if( !found ) { return false; }
              }


              if( this.blockList !== null ) {
                //blockList : ignore album cointaining one of the specified keyword in the title
                for( var j = 0; j < this.blockList.length; j++) {
                  if( s.indexOf(this.blockList[j]) !== -1 ) { 
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
              context.$E.conConsole.css({visibility: 'visible', minHeight: '100px'});
              if( verbose == false ) {
                context.$E.conConsole.append('<p>' + msg + '</p>');
              }
              else {
                context.$E.conConsole.append('<p>nanogallery2: '+ msg + ' [' + context.baseEltID + ']</p>');
              }
            }
          };
          
  
          /** @function NanoConsoleLog */
          /* write message to the browser console */
          NGY2Tools.NanoConsoleLog = function(context, msg) {
            if (window.console) { console.log('nanogallery2: ' + msg + ' [' + context.baseEltID + ']'); }
            // debugger;
          };
          

          /** @function PreloaderDisplay() */
          /* Display/hide preloader */
          NGY2Tools.PreloaderDisplay = function(display) {
            if( display === true ) {
              // loading bar at the top of the gallery
              this.$E.conLoadingB.removeClass('nanoGalleryLBarOff').addClass('nanoGalleryLBar');
              // spinner over album thumbnail
              if( this.GOM.albumIdxLoading != undefined && this.GOM.albumIdxLoading != -1 ) {
                let item = this.I[this.GOM.albumIdxLoading];
                item.$Elts['.nGY2TnImg'].addClass('nGY2GThumbnailLoaderDisplayed');
              }
            }
            else {
              // loading bar at the top of the gallery
              this.$E.conLoadingB.removeClass('nanoGalleryLBar').addClass('nanoGalleryLBarOff');
              // spinner over album thumbnail
              if( this.GOM.albumIdxLoading != undefined && this.GOM.albumIdxLoading != -1 ) {
                let item = this.I[this.GOM.albumIdxLoading];
                item.$Elts['.nGY2TnImg'].removeClass('nGY2GThumbnailLoaderDisplayed');
              }
            }
          };

          // Scrambles the elements of an array
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
          
            var sortOrder = this.gallerySorting[this.GOM.curNavLevel];
            var maxItems = this.galleryMaxItems[this.GOM.curNavLevel];

            if( sortOrder != '' || maxItems > 0 ) {
            
              // copy album's items to a new array
              var currentAlbum = this.I.filter( function( obj ) {
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
                currentAlbum.splice(maxItems - 1, currentAlbum.length-maxItems );
              }
              
              // remove the albums's items from the global items array
              this.I.ngy2removeIf( function( obj ) {
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
            this.mediaKind =            'img';    // 'img', 'iframe', 'video'
            this.mediaMarkup =          '';
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
            this.left =                 0;        // store position to animate from old to new
            this.top =                  0;
            this.width =                0;        // store size to avoid setting width/height if not required
            this.height =               0;
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
            this.mediaNumber =          0;        // media number in the album
            this.mediaCounter =         0;        // number of medias in an album
            this.eltTransform =         [];       // store the CSS transformations
            this.eltFilter =            [];       // store the CSS filters
            this.eltEffect =            [];       // store data about hover effects animations
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
            this.exif = { exposure: '', flash: '', focallength: '', fstop: '', iso: '', model: '', time: '', location: ''};
            this.deleted =              false;    // item is deleted -> do not display anymore
            this.rotationAngle =        0;        // image display rotation angle
          }

          // public static
          
          NGY2Item.Get = function( instance, ID ) {
            var l = instance.I.length;
            for( var i = 0; i < l; i++ ) {
              if( instance.I[i].GetID() == ID ) {
                return instance.I[i];
              }
            }
            return null;
          };
            
          NGY2Item.GetIdx = function( instance, ID ) {
            var l = instance.I.length;
            for( var i = 0; i < l; i++ ) {
              if( instance.I[i].GetID() == ID ) {
                return i;
              }
            }
            return -1;
          };
          
          // create new item (image, album or albumUp)
          NGY2Item.New = function( instance, title, description, ID, albumID, kind, tags ) {
            var album = NGY2Item.Get( instance, albumID );
            
            // title translation
            if( instance.O.titleTranslationMap !== null ) {
              let obj = instance.O.titleTranslationMap.find(o => o.title === title);
              if( obj !== undefined ) {
                title = obj.replace;
              }
            }
            
            
            if( albumID != -1 && albumID != 0 && title !='image gallery by nanogallery2 [build]'  ) {
              if( instance.O.thumbnailLevelUp && album.getContentLength(false) == 0 && instance.O.album == '' ) {
                // add navigation thumbnail (album up)
                let item = new NGY2Item('0');
                instance.I.push( item );
                album.contentLength += 1;
                item.title = 'UP';
                item.albumID = albumID;
                item.kind = 'albumUp';
                item.G = instance;

                jQuery.extend( true, item.thumbs.width, instance.tn.defaultSize.width);
                jQuery.extend( true, item.thumbs.height, instance.tn.defaultSize.height);
              }
            }
            
            var item = NGY2Item.Get(instance, ID);
            if( item === null ){
              // create a new item (otherwise, just update the existing one)
              item = new NGY2Item(ID);
              instance.I.push(item);
              if( albumID != -1 && title !='image gallery by nanogallery2 [build]' ) {
                album.contentLength+=1;
              }
            }
            item.G = instance;

            item.albumID = albumID;
            item.kind = kind;
            if( kind == 'image' ) {
              album.mediaCounter += 1;
              item.mediaNumber = album.mediaCounter;
            }

            // check keyword to find features images/albums
            var kw = instance.O.thumbnailFeaturedKeyword;
            if( kw != '' ) {
              // check if item featured based on a keyword in the title or in the description
              kw = kw.toUpperCase();
              var p = title.toUpperCase().indexOf(kw);
              if( p > -1) {
                item.featured = true;
                // remove keyword case unsensitive
                title = title.substring(0, p) + title.substring(p+kw.length, title.length);
              }
              p = description.toUpperCase().indexOf(kw);
              if( p > -1) {
                item.featured=true;
                // remove keyword case unsensitive
                description=description.substring(0, p) + description.substring(p + kw.length, description.length);
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
              if( typeof instance.galleryFilterTags.Get() == 'string' ) {
                switch( instance.galleryFilterTags.Get().toUpperCase() ) {
                  case 'TITLE': {
                      let re = /(?:^|\W)#(\w+)(?!\w)/g, match, matches = [];
                      // let tags = "";
                      while (match = re.exec(title)) {
                        matches.push(match[1].replace(/^\s*|\s*$/, ''));   //trim trailing/leading whitespace
                      }
                      item.setTags(matches);  //tags;
                      title = title.split('#').join('');   //replaceall
                      break;
                    }
                  case 'DESCRIPTION': {
                      let re = /(?:^|\W)#(\w+)(?!\w)/g, match2, matches2 = [];
                      // let tags = "";
                      while (match2 = re.exec(description)) {
                        matches2.push(match2[1].replace(/^\s*|\s*$/, ''));   //trim trailing/leading whitespace
                      }
                      item.setTags(matches2);  //tags;
                      description = description.split('#').join('');   //replaceall
                      break;
                    }
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
            item.title = escapeHtml(instance, title);
            item.description = escapeHtml(instance, description);
            return item;
          };
          
          
          // removes logically current item
          NGY2Item.prototype.delete = function( ) {
            this.deleted = true;
            
            // update content length of parent album
            this.G.I[NGY2Item.GetIdx(this.G, this.albumID)].contentLength--;
            this.G.I[NGY2Item.GetIdx(this.G, this.albumID)].numberItems--;
            
            // check if in GOM and removes it
            var nbTn = this.G.GOM.items.length;
            var ID = this.GetID();
            var foundIdx = -1;
            var foundGOMidx = -1;
            for( var i = 0; i < nbTn ; i++ ) {
              var curTn = this.G.GOM.items[i];
              var item=this.G.I[curTn.thumbnailIdx];
              if( item.GetID() == ID ) {
                // FOUND
                if( !curTn.neverDisplayed ) {
                  foundIdx = curTn.thumbnailIdx;
                  foundGOMidx = i;
                }
              }
              else {
                if( foundIdx != -1 ) {
                  if( !curTn.neverDisplayed ) {
                    // update index value
                    item.$getElt('.nGY2GThumbnail').data('index', i-1);
                    item.$getElt('.nGY2GThumbnailImg').data('index', i-1);
                  }
                }
              }
            }
            if( foundIdx != -1 ) {
              // delete item in GOM and delete thumbnail
              var G = this.G;
              if( this.selected == true ) {
                this.selected = false;
                G.GOM.nbSelected--;    // update the global counter
              }
              if( G.I[foundIdx].$elt !== null ) {
                G.I[foundIdx].$elt.remove();      // delete thumbnail DOM object
              }
              G.GOM.items.splice(foundGOMidx, 1);   // delete in GOM
              if( G.GOM.lastDisplayedIdx != -1 ) {
                G.GOM.lastDisplayedIdx -= 1;
              }
            }
            
            // TODO: update media-number of the other item in the same album
          }

          NGY2Item.prototype.addToGOM = function( ) {
            // retrieve index
            var ID = this.GetID();
            var l = this.G.I.length;
            for( var idx = 0; idx < l; idx++ ) {
              var item = this.G.I[idx];
              if( item.GetID() == ID ) {
                var w = item.thumbImg().width;
                var h = item.thumbImg().height;
                // set default size if required
                if( h == 0 ) {
                  h = this.G.tn.defaultSize.getHeight();
                }
                if( w == 0 ) {
                  w = this.G.tn.defaultSize.getWidth();
                }
                // add to GOM -> will be displayed on next refresh/resize
                var tn = new this.G.GOM.GTn(idx, w, h);
                this.G.GOM.items.push(tn);
                break;
              }
            }
            
          }
          
          
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
          
          // remove one element (in DOM and in cache)
          NGY2Item.prototype.removeElt = function( elt ) {
            if( this.$elt == null ) { return; }
            if( this.$Elts[elt] == undefined) { return; }
            this.$Elts[elt].remove();
            var index = this.$Elts.indexOf(elt);
            this.$Elts.splice(index, 1);
          };

          //--- returns the album containing the item
          NGY2Item.prototype.album = function() {
            return this.G.I[NGY2Item.GetIdx(this.G, this.albumID)];
          };
          
          //--- viewer - transition can be disabled per media kind - returns true if current media supports transition (swipe)
          NGY2Item.prototype.mediaTransition = function( ) {
            if( this.G.O.viewerTransitionMediaKind.indexOf( this.mediaKind ) > -1 ) {
              return true;
            }
            return false;
          };

          //--- set one image (url and size)
          NGY2Item.prototype.imageSet = function( src, w, h ) {
            this.src = src;
            this.width = w;
            this.height = h;
          };
          
          //--- set one thumbnail (url and size) - screenSize and level are optional
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
            var tnImg = { src: '', width: 0, height: 0 };

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
                  // this.album().albumTagListSel.push(tags[i])
                }
              }
            }
          };
          
          //--- check if 1 of current item's tags is selected (tag filter)
          NGY2Item.prototype.checkTagFilter = function() {
            if( this.G.galleryFilterTags.Get() != false && this.album().albumTagList.length > 0 ) {
              if( this.G.O.thumbnailLevelUp && this.kind == 'albumUp' ) {
                return true;
              }
              var found = false;
              var lstTags = this.album().albumTagListSel;
              if( lstTags.length == 0 ) {       
                // no tag is selected -> display all items
                return true;
              }
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
          
          //--- set the URL of the media to display in the viewer
          //--- markup is defined for images
          NGY2Item.prototype.setMediaURL = function( url, mediaKind ) {
            this.src = url;
            this.mediaKind = mediaKind;
            if( mediaKind == 'img' ) {
              this.mediaMarkup = '<img class="nGY2ViewerMedia" src="' + url + '" alt=" " itemprop="contentURL" draggable="false">';
            }
          };
          
          
          //--- check if current item should be displayed
          NGY2Item.prototype.isToDisplay = function( albumID ) {
            return this.albumID == albumID && this.checkTagFilter() && this.isSearchFound() && this.isSearchTagFound() && this.deleted == false;
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
              this.thumbnailImgRevealed = true;
              new NGTweenable().tween({
                from:         { opacity: 0 },
                to:           { opacity: 1 },
                attachment:   { item: this },
                delay:        30,
                duration:     400,
                easing:       'easeOutQuart',
                step:         function (state, att) {
                  var $e=att.item.$getElt('.nGY2TnImg');
                  if( $e != null ) {
                    $e.css( state );
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
          
          //--- 2D/3D CSS transform - apply the cached value to element
          NGY2Item.prototype.CSSTransformApply = function ( eltClass ) {
            var obj = this.eltTransform[eltClass];

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
                var v = 'translateX(' + ValueApplyPercent(obj.translateX,pTranslateX) + ') translateY(' + ValueApplyPercent(obj.translateY,pTranslateY) + ') translateZ(' + ValueApplyPercent(obj.translateZ,pTranslateZ) + ') scale(' + ValueApplyPercent(obj.scale,pScale) + ') translate(' + ValueApplyPercent(obj.translate,pTranslate) + ')';
                if( !(this.G.IE <= 9) && !this.G.isGingerbread ) {
                  v += ' rotateX(' + ValueApplyPercent(obj.rotateX,pRotateX) + ') rotateY(' + ValueApplyPercent(obj.rotateY,pRotateY) + ') rotateZ(' + ValueApplyPercent(obj.rotateZ,pRotateZ) + ') rotate(' + ValueApplyPercent(obj.rotate,pRotate) + ')';
                }
                else {
                  v += ' rotate(' + ValueApplyPercent(obj.rotateZ,pRotateZ) + ')';
                }
                obj.$elt[n].style[this.G.CSStransformName] = v;
                
                if( nbStacks > 0 ) {
                  // apply a percent to the stack elements
                  pTranslateX -= this.G.tn.opt.Get('stacksTranslateX');
                  pTranslateY -= this.G.tn.opt.Get('stacksTranslateY');
                  pTranslateZ -= this.G.tn.opt.Get('stacksTranslateZ');
                  pRotateX    -= this.G.tn.opt.Get('stacksRotateX');
                  pRotateY    -= this.G.tn.opt.Get('stacksRotateY');
                  pRotateZ    -= this.G.tn.opt.Get('stacksRotateZ');
                  pScale      -= this.G.tn.opt.Get('stacksScale');
                }
              }
            }
            else {
              // thumbnail sub element
              if( obj.$elt != null ) {
                for( var n = 0; n < obj.$elt.length; n++ ) {
                  if( obj.$elt[n] != undefined ) {
                    // units must be given with
                    var v = 'translateX(' + obj.translateX + ') translateY(' + obj.translateY + ') translateZ(' + obj.translateZ + ') scale(' + obj.scale + ') translate(' + obj.translate + ')';
                    if( !(this.G.IE <= 9) && !this.G.isGingerbread ) {
                      v += ' rotateX(' + obj.rotateX + ') rotateY(' + obj.rotateY + ') rotateZ(' + obj.rotateZ + ') rotate(' + obj.rotate + ')';
                    }
                    else {
                      v += ' rotate(' + obj.rotateZ + ')';
                    }
                    obj.$elt[n].style[this.G.CSStransformName] = v;
                    }
                }
              }
            }
          };

          //--- 2D/3D CSS transform - set a value in cache
          NGY2Item.prototype.CSSTransformSet = function ( eltClass, transform, value, forceRefresh ) {
            if( this.eltTransform[eltClass] == undefined ) {
              this.eltTransform[eltClass] = { translateX: 0, translateY: 0, translateZ: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1, translate: '0px,0px', rotate: 0 };
              this.eltTransform[eltClass].$elt = this.$getElt(eltClass);
            }
            this.eltTransform[eltClass][transform] = value;
            if( forceRefresh === true ) {
              this.eltTransform[eltClass].$elt = this.$getElt(eltClass, true);
            }
          };

          //--- CSS Filters - apply the cached value to element
          NGY2Item.prototype.CSSFilterApply = function ( eltClass ) {
            var obj = this.eltFilter[eltClass];
            var v = 'blur(' + obj.blur + ') brightness(' + obj.brightness + ') grayscale(' + obj.grayscale + ') sepia(' + obj.sepia + ') contrast(' + obj.contrast + ') opacity(' + obj.opacity + ') saturate(' + obj.saturate + ')';
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
          NGY2Item.prototype.CSSFilterSet = function ( eltClass, filter, value, forceRefresh ) {
            if( this.eltFilter[eltClass] == undefined ) {
              this.eltFilter[eltClass] = { blur: 0, brightness: '100%', grayscale: '0%', sepia: '0%', contrast: '100%', opacity: '100%', saturate: '100%' };
              this.eltFilter[eltClass].$elt = this.$getElt(eltClass);
            }
            this.eltFilter[eltClass][filter] = value;
            if( forceRefresh === true ) {
              this.eltTransform[eltClass].$elt = this.$getElt(eltClass, true);
            }
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
              context.animeDelay = 30 + parseInt(effect.delay + delay);  // 30ms is a default delay to avoid conflict with other initializations
              context.animeEasing = effect.easing;
            }
            else {
              // HOVER OUT
              // if( effect.firstKeyframe ) {
                context.animeFrom = this.eltEffect[effect.element][effect.type].lastValue;
                context.animeTo = this.eltEffect[effect.element][effect.type].initialValue;
                // context.animeTo=effect.from;
              // }
              // else {
                // // context.animeFrom=effect.from;
                // context.animeFrom = this.eltEffect[effect.element][effect.type].lastValue;
                // context.animeTo = this.eltEffect[effect.element][effect.type].initialValue;
                // //context.animeTo=effect.to;
                
              // }
              
              context.animeDuration = parseInt(effect.durationBack);
              context.animeDelay = 30 + parseInt(effect.delayBack + delay);   // 30ms is a default delay to avoid conflict with other initializations
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
              this.$getElt(effect.element).css('z-index', this.G.GOM.lastZIndex);
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
                    // window.ng_draf( function() {
                      att.item.CSSTransformSet(att.effect.element, att.effect.type, state.v);
                      att.item.CSSTransformApply( att.effect.element );
                    // });
                    break;
                  case 'filter':
                    // window.ng_draf( function() {
                      att.item.CSSFilterSet(att.effect.element, att.effect.type, state.v);
                      att.item.CSSFilterApply( att.effect.element );
                    // });
                    break;
                  default:
                    var v=state.v;
                    if( state.v.substring(0,4) == 'rgb(' || state.v.substring(0,5) == 'rgba(' ) {
                      // to remove values after the dot (not supported by RGB/RGBA)
                      // v=ngtinycolor(state.v).toRgbString();
                      v = ShadeBlendConvert(0, v);
                    }
                    // window.ng_draf( function() {
                      att.item.$getElt( att.effect.element ).css( att.effect.type, v );
                    // });
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

                // window.ng_draf( function() {
                  switch( att.cssKind ) {
                    case 'transform':
                      att.item.CSSTransformSet(att.effect.element, att.effect.type, att.animeTo);
                      att.item.CSSTransformApply(att.effect.element);
                      break;
                    case 'filter':
                      att.item.CSSFilterSet(att.effect.element, att.effect.type, att.animeTo);
                      att.item.CSSFilterApply(att.effect.element);
                      break;
                    default:
                      att.item.$getElt(att.effect.element).css(att.effect.type, att.animeTo);
                      break;
                  }
                // });
              }
            });
          };

          return NGY2Item;
        })();
          
      }

      _this.options = jQuery.extend(true, {}, jQuery.nanogallery2.defaultOptions, options);
      // Initialization code
      _this.nG2 = null;
      _this.nG2 = new nanoGALLERY2();
      _this.nG2.initiateGallery2(_this.e, _this.options );

    };
      
    // PUBLIC EXPOSED METHODS
    _this.test = function() {
      //alert('test');
      // console.dir(_this.nG.G.I.length);
      // console.dir(_this.nG);
      // debugger;
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
    blockList :                   'scrapbook|profil|auto backup',
    tagBlockList:                 '',
    allowList :                   '',
    albumList :                   '',
    albumList2 :                  null,
    RTL :                         false,
    flickrSkipOriginal :          true,
    flickrAPIKey:                 '',
    breadcrumbAutoHideTopLevel :  true,
    displayBreadcrumb :           true,
    breadcrumbOnlyCurrentLevel :  true,
    breadcrumbHideIcons :         true,
    theme :                       'nGY2',
    galleryTheme :                'dark',
    viewerTheme :                 'dark',
    items :                       null,
    itemsBaseURL :                '',
    thumbnailSelectable :         false,
    dataProvider:                 '',
    allowHTMLinData:              false,
    locationHash :                true,
    slideshowDelay :              3000,
    slideshowAutoStart :          false,

    debugMode:                    false,

    titleTranslationMap:          null,
    galleryDisplayMoreStep :      2,
    galleryDisplayMode :          'fullContent',
    galleryL1DisplayMode :        null,
    galleryPaginationMode :       'rectangles',   // 'dots', 'rectangles', 'numbers'
    galleryPaginationTopButtons : true,
    galleryMaxRows :              2,
    galleryL1MaxRows :            null,
    galleryLastRowFull:           false,
    galleryL1LastRowFull:         null,
    galleryLayoutEngine :         'default',
    paginationSwipe:              true,
    paginationVisiblePages :      10,
    galleryFilterTags :           false,    // possible values: false, true, 'title', 'description'
    galleryL1FilterTags :         null,     // possible values: false, true, 'title', 'description'
    galleryFilterTagsMode :       'single',
    galleryL1FilterTagsMode :     null,
    galleryMaxItems :             0,        // maximum number of items per album  --> only flickr, google2, nano_photos_provider2
    galleryL1MaxItems :           null,     // maximum number of items per gallery page --> only flickr, google2, nano_photos_provider2
    gallerySorting :              '',
    galleryL1Sorting :            null,
    galleryDisplayTransition :    'none',
    galleryL1DisplayTransition :  null,
    galleryDisplayTransitionDuration :    1000,
    galleryL1DisplayTransitionDuration :  null,
    galleryResizeAnimation :      false,
    galleryRenderDelay :          10,

    thumbnailCrop :               true,
    thumbnailL1Crop :             null,
    thumbnailCropScaleFactor :    1.5,
    thumbnailLevelUp :            false,
    thumbnailAlignment :          'fillWidth',
    thumbnailWidth :              300,
    thumbnailL1Width :            null,
    thumbnailHeight :             200,
    thumbnailL1Height :           null,
    thumbnailBaseGridHeight :     0,
    thumbnailL1BaseGridHeight :   null,
    thumbnailGutterWidth :        2,
    thumbnailL1GutterWidth :      null,
    thumbnailGutterHeight :       2,
    thumbnailL1GutterHeight :     null,
    thumbnailBorderVertical :     2,
    thumbnailL1BorderVertical :   null,
    thumbnailBorderHorizontal :   2,
    thumbnailL1BorderHorizontal : null,
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
    thumbnailDisplayOutsideScreen: true,
    thumbnailWaitImageLoaded:     true,
    thumbnailSliderDelay:         2000,
    galleryBuildInit2 :           '',
    portable :                    false,
    eventsDebounceDelay:          10,
    
    touchAnimation :              false,
    touchAnimationL1 :            undefined,
    touchAutoOpenDelay :          0,

    thumbnailLabel : {
      position :                  'overImage',
      align:                      'center',
      valign:                     'bottom',
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
    thumbnailToolbarAlbum :       { topLeft: 'select', topRight : 'counter'  },
    thumbnailDisplayOrder :       '',
    thumbnailL1DisplayOrder :     null,
    thumbnailDisplayInterval :    15,
    thumbnailL1DisplayInterval :  null,
    thumbnailDisplayTransition :  'fadeIn',
    thumbnailL1DisplayTransition : null,
    thumbnailDisplayTransitionEasing :  'easeOutQuart',
    thumbnailL1DisplayTransitionEasing : null,
    thumbnailDisplayTransitionDuration:   240,
    thumbnailL1DisplayTransitionDuration: null,
    thumbnailOpenInLightox :      true,
    thumbnailOpenOriginal :       false,
    
    lightboxStandalone:						false,
		viewer :                      'internal',
    viewerFullscreen:             false,
    imageTransition :             'swipe2',
    viewerTransitionMediaKind :   'img',
    viewerZoom :                  true,
    viewerImageDisplay :          '',
    openOnStart :                 '',
    viewerHideToolsDelay :        4000,
    viewerToolbar : {
      display :                   false,
      position :                  'bottom',
      fullWidth :                 false,
      align :                     'center',
      autoMinimize :              0,
      standard :                  'minimizeButton,label',
      minimized :                 'minimizeButton,label,infoButton,shareButton,fullscreenButton'
    },
    viewerTools : {
      topLeft :                   'pageCounter,playPauseButton',
      topRight :                  'rotateLeft,rotateRight,fullscreenButton,closeButton' 
    },
		viewerGallery:								'bottomOverMedia',
		viewerGalleryTWidth:					40,
		viewerGalleryTHeight:  				40,
    
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
    fnPopupMediaInfo :            null,

    i18n : {
      'breadcrumbHome' : 'Galleries', 'breadcrumbHome_FR' : 'Galeries',
      'thumbnailImageTitle' : '', 'thumbnailAlbumTitle' : '',
      'thumbnailImageDescription' : '', 'thumbnailAlbumDescription' : '',
      'infoBoxPhoto' : 'Photo', 'infoBoxDate' : 'Date', 'infoBoxAlbum' : 'Album', 'infoBoxDimensions' : 'Dimensions', 'infoBoxFilename' : 'Filename', 'infoBoxFileSize' : 'File size', 'infoBoxCamera' : 'Camera', 'infoBoxFocalLength' : 'Focal length', 'infoBoxExposure' : 'Exposure', 'infoBoxFNumber' : 'F Number', 'infoBoxISO' : 'ISO', 'infoBoxMake' : 'Make', 'infoBoxFlash' : 'Flash', 'infoBoxViews' : 'Views', 'infoBoxComments' : 'Comments'
    },
    icons : {
      // example for font awesome: <i style="color:#eee;" class="fa fa-search-plus"></i>
      thumbnailAlbum:               '<i class="nGY2Icon-folder-empty"></i>',
      thumbnailImage:               '<i class="nGY2Icon-picture"></i>',
      breadcrumbAlbum:              '<i class="nGY2Icon-folder-empty"></i>',
      breadcrumbHome:               '<i class="nGY2Icon-home"></i>',
      breadcrumbSeparator:          '<i class="nGY2Icon-left-open"></i>',
      breadcrumbSeparatorRtl:       '<i class="nGY2Icon-right-open"></i>',
      navigationFilterSelected:     '<i style="color:#fff;" class="nGY2Icon-ok"></i>',
      navigationFilterUnselected:   '<i style="color:#ddd;opacity:0.3;" class="nGY2Icon-circle-empty"></i>',
      navigationFilterSelectedAll:  '<i class="nGY2Icon-ccw"></i>',
      navigationPaginationPrevious: '<i class="nGY2Icon-ngy2_chevron-left"></i>',
      navigationPaginationNext:     '<i class="nGY2Icon-ngy2_chevron-right"></i>',
      thumbnailSelected:            '<i style="color:#bff;" class="nGY2Icon-ok-circled"></i>',
      thumbnailUnselected:          '<i style="color:#bff;" class="nGY2Icon-circle-empty"></i>',
      thumbnailFeatured:            '<i style="color:#dd5;" class="nGY2Icon-star"></i>',
      thumbnailCounter:             '<i class="nGY2Icon-picture"></i>',
      thumbnailShare:               '<i class="nGY2Icon-ngy2_share2"></i>',
      thumbnailDownload:            '<i class="nGY2Icon-ngy2_download2"></i>',
      thumbnailInfo:                '<i class="nGY2Icon-ngy2_info2"></i>',
      thumbnailShoppingcart:        '<i class="nGY2Icon-basket"></i>',
      thumbnailDisplay:             '<i class="nGY2Icon-resize-full"></i>',
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
      thumbnailAlbumUp:             '<i style="font-size: 3em;" class="nGY2Icon-ngy2_chevron_up2"></i>',
      paginationNext:               '<i class="nGY2Icon-right-open"></i>',
      paginationPrevious:           '<i class="nGY2Icon-left-open"></i>',
      galleryMoreButton:            '<i class="nGY2Icon-picture"></i> &nbsp; <i class="nGY2Icon-right-open"></i>',
      buttonClose:                  '<i class="nGY2Icon-ngy2_close2"></i>',
      viewerPrevious:               '<i class="nGY2Icon-ngy2_chevron-left"></i>',
      viewerNext:                   '<i class="nGY2Icon-ngy2_chevron-right"></i>',
      viewerImgPrevious:            '<i class="nGY2Icon-ngy2_chevron_left3"></i>',
      viewerImgNext:                '<i class="nGY2Icon-ngy2_chevron_right3"></i>',
      viewerDownload:               '<i class="nGY2Icon-ngy2_download2"></i>',
      viewerToolbarMin:             '<i class="nGY2Icon-ellipsis-vert"></i>',
      viewerToolbarStd:             '<i class="nGY2Icon-menu"></i>',
      viewerPlay:                   '<i class="nGY2Icon-play"></i>',
      viewerPause:                  '<i class="nGY2Icon-pause"></i>',
      viewerFullscreenOn:           '<i class="nGY2Icon-resize-full"></i>',
      viewerFullscreenOff:          '<i class="nGY2Icon-resize-small"></i>',
      viewerZoomIn:                 '<i class="nGY2Icon-ngy2_zoom_in2"></i>',
      viewerZoomOut:                '<i class="nGY2Icon-ngy2_zoom_out2"></i>',
      viewerLinkOriginal:           '<i class="nGY2Icon-ngy2_external2"></i>',
      viewerInfo:                   '<i class="nGY2Icon-ngy2_info2"></i>',
      viewerShare:                  '<i class="nGY2Icon-ngy2_share2"></i>',
      viewerRotateLeft:             '<i class="nGY2Icon-ccw"></i>',
      viewerRotateRight:            '<i class="nGY2Icon-cw"></i>',
      viewerShoppingcart:           '<i class="nGY2Icon-basket"></i>',
      user:                         '<i class="nGY2Icon-user"></i>',
      location:                     '<i class="nGY2Icon-location"></i>',
      picture:                     '<i class="nGY2Icon-picture"></i>',
      config:                       '<i class="nGY2Icon-wrench"></i>',
      shareFacebook:                '<i style="color:#3b5998;" class="nGY2Icon-facebook-squared"></i>',
      shareTwitter:                 '<i style="color:#00aced;" class="nGY2Icon-twitter-squared"></i>',
      // shareGooglePlus:              '<i style="color:#dd4b39;" class="nGY2Icon-gplus-squared"></i>',
      shareTumblr:                  '<i style="color:#32506d;" class="nGY2Icon-tumblr-squared"></i>',
      sharePinterest:               '<i style="color:#cb2027;" class="nGY2Icon-pinterest-squared"></i>',
      shareVK:                      '<i style="color:#3b5998;" class="nGY2Icon-vkontakte"></i>',
      shareMail:                    '<i style="color:#555;" class="nGY2Icon-mail-alt"></i>',
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
      var nG2 = $(this).data('nanogallery2data').nG2;

			// Lightbox standalone
      // (Another click on an already opened media)
			if( args !== undefined && args.lightboxStandalone === true ) {
        // items exist already (G.I is populated) -> just open the lightbox again
        nG2.LightboxReOpen();
				return;
			}
			
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

        case 'resize':
          nG2.Resize();
          break;
          
        case 'instance':
          return nG2;
          break;
          
        case 'data':
          nG2.data= {
            items: nG2.I,
            gallery: nG2.GOM,
            lightbox: nG2.VOM,
						shoppingcart: nG2.shoppingCart
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
          // returns the content of the shoppingcart
          return nG2.shoppingCart;
          break;
          
        case 'shoppingCartUpdate':
          // parameters :
          //  - option = item's ID
          //  - value = new quantity
			
          if( typeof value === 'undefined' || typeof option === 'undefined' ){
            return false;
          }
          
          var item_ID = option;
          var new_qty = value;

          for( var i=0; i < nG2.shoppingCart.length; i++) {
            if( nG2.shoppingCart[i].ID == item_ID ) {
              
              // updates counter
              nG2.shoppingCart[i].qty = new_qty;
              
              let item = nG2.I[nG2.shoppingCart[i].idx];

              // updates thumbnail
              nG2.ThumbnailToolbarOneCartUpdate( item );
              
              if( new_qty == 0 ) {
                // removes item from shoppingcart
                nG2.shoppingCart.splice(i, 1);
              }
              
              var fu = nG2.O.fnShoppingCartUpdated;
              if( fu !== null ) {
                typeof fu == 'function' ? fu(nG2.shoppingCart, item, 'api') : window[fu](nG2.shoppingCart, item, 'api');
              }

              break;
            }
          }
         
          return nG2.shoppingCart;
          break;
          
        case 'shoppingCartRemove':
          // parameters :
          //  - option = item's ID
          if( typeof option === 'undefined' ){
            return false;
          }
          var ID = option;
          for( var i=0; i < nG2.shoppingCart.length; i++) {
            if( nG2.shoppingCart[i].ID == ID ) {
              
              var item = nG2.I[nG2.shoppingCart[i].idx];

              // updates thumbnail
              nG2.shoppingCart[i].qty = 0;
              nG2.ThumbnailToolbarOneCartUpdate( item );
              
              // removes item from shoppingcart
              nG2.shoppingCart.splice(i, 1);
              
              
              var fu = nG2.O.fnShoppingCartUpdated;
              if( fu !== null ) {
                typeof fu == 'function' ? fu(nG2.shoppingCart, item, 'api') : window[fu](nG2.shoppingCart, item, 'api');
              }

              break;
            }
          }
          
          return nG2.shoppingCart;
          break;
         
        case 'closeViewer':
          nG2.CloseViewer();
          break;
        case 'minimizeToolbar':
          nG2.MinimizeToolbar();
          break;
        case 'maximizeToolbar':
          nG2.MaximizeToolbar();
          break;
        case 'paginationPreviousPage':
          nG2.PaginationPreviousPage();
          break;
        case 'paginationNextPage':
          nG2.paginationNextPage();
          break;
        case 'paginationGotoPage':
          nG2.PaginationGotoPage( option );
          break;
        case 'paginationCountPages':
          nG2.PaginationCountPages();
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
    this.LightboxReOpen = function(){
        LightboxStandaloneDisplay();
    }

    /**
    * Force reload the current album, if provided by Json
    */
    this.ReloadAlbum = function(){
      if( G.O.kind === '' ) {
        throw 'Not supported for this content source:' + G.O.kind;
      }

      var albumIdx = G.GOM.albumIdx;
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
     * Refresh the current gallery
     */
    this.Refresh = function() {
      // Refresh the displayed gallery
      GalleryRender( G.GOM.albumIdx );
    };
    /**
     * Resize the current gallery
     */
    this.Resize = function() {
      // resize the displayed gallery
      GalleryResize();
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
    
    this.ThumbnailToolbarOneCartUpdate = function ( item ) {
      ThumbnailBuildToolbarOneCartUpdate( item );
    }
    
      
      
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
      if( searchTitle != undefined && searchTitle != null  ) {
        G.GOM.albumSearch = searchTitle.toUpperCase().trim();
      }
      else {
        G.GOM.albumSearch = '';
      }
      
      if( searchTags != null && searchTags != undefined ) {
        G.GOM.albumSearchTags = searchTags.toUpperCase().trim();
      }
      else {
        G.GOM.albumSearchTags = '';
      }
      return CountItemsToDisplay( G.GOM.albumIdx );
    };
    
    /**
     * Search2 - execute the search on title and tags
     */
    this.Search2Execute = function() {
      var gIdx = G.GOM.albumIdx;
      GalleryRender( G.GOM.albumIdx );
      return CountItemsToDisplay( gIdx );
    };
    
    
    /**
     * Destroy the current gallery
     */
    this.Destroy = function(){

      if( G.GOM.hammertime != null ) {
        G.GOM.hammertime.destroy();
        G.GOM.hammertime = null;
      }

      if( G.VOM.hammertime != null ) {
        G.VOM.hammertime.destroy();
        G.VOM.hammertime = null;
      }
      
      // color scheme
      $('#ngycs_' + G.baseEltID).remove()
      
      G.GOM.items = [];
      NGY2Item.New( G, G.i18nTranslations.breadcrumbHome, '', '0', '-1', 'album' );
      G.GOM.navigationBar.$newContent = null;
      G.$E.base.empty();
      G.$E.base.removeData();
      if( G.O.locationHash ) {
        jQuery(window).off('hashchange.nanogallery2.' + G.baseEltID);
      }

      jQuery(window).off('resize.nanogallery2.' + G.baseEltID);
      jQuery(window).off('orientationChange.nanogallery2.' + G.baseEltID);
      jQuery(window).off('scroll.nanogallery2.' + G.baseEltID);
			if( G.$E.scrollableParent !== null ) {
				G.$E.scrollableParent.off('scroll.nanogallery2.' + G.baseEltID);
			}
      G.GOM.firstDisplay = true;
    };
    
    /**
     * CloseViewer - close the media viewer
     */
    this.CloseViewer = function() {
      LightboxClose(null);
      return false;
    };
    
    /**
     * MinimizeToolbar - display the minimized lightbox main toolbar
     */
    this.MinimizeToolbar = function() {
      ViewerToolbarForVisibilityMin();
      return false;
    };
    
    /**
     * MaximizeToolbar - display the maximized/standard lightbox main toolbar
     */
    this.MaximizeToolbar = function() {
      ViewerToolbarForVisibilityStd();
      return false;
    };
    
    /**
     * PaginationPreviousPage - gallery paginate to previous page
     */
    this.PaginationPreviousPage = function() {
      paginationPreviousPage();
      return false;
    };
    
    
    /**
     * PaginationNextPage - gallery paginate to next page
     */
    this.PaginationNextPage = function() {
      paginationNextPage();
      return false;
    };
    
    
    /**
     * PaginationGotoPage - gallery paginate to specific page
     */
    this.PaginationGotoPage = function( page ) {
      // var aIdx = G.$E.conPagin.data('galleryIdx');
      if( page > 1 ) { page--; }
      G.GOM.pagination.currentPage = page;

      // scroll to top of gallery if not displayed
      G.GOM.ScrollToTop();

      GalleryDisplayPart1();
      GalleryDisplayPart2( true );
      return false;
    };

    /**
     * PaginationCountPages - gallery pagination - returns the number of pages
     */
    this.PaginationCountPages = function() {
      if( G.GOM.items.length == 0 ) { return 0; }   // no thumbnail to display

      var nbPages = Math.ceil((G.GOM.items[G.GOM.items.length - 1].row + 1) / G.galleryMaxRows.Get());
      return nbPages;
    };
    
    /**
     * PaginationCountPages - gallery pagination - returns the number of pages
     */

    
    
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
              // clearRequestTimeout(timeout);
          else if (execAsap)
              func.apply(obj, args);
          timeout = setTimeout(delayed, threshold || 100); 
          // timeout = requestTimeout(delayed, threshold || 100); 
      };
    }
    

    // Double requestAnimationFrame
    window.ng_draf = function (cb) {
      return requestAnimationFrame(function() {
        window.requestAnimationFrame(cb)
      })
    }    
    
    // REQUESTTIMEOUT - replace SETTIMEOUT - https://gist.github.com/joelambert/1002116
    /**
     * Behaves the same as setTimeout except uses requestAnimationFrame() where possible for better performance
     * @param {function} fn The callback function
     * @param {int} delay The delay in milliseconds
     */

    window.requestTimeout = function(fn, delay) {
      if( !window.requestAnimationFrame      	&& 
        !window.webkitRequestAnimationFrame && 
        !(window.mozRequestAnimationFrame && window.mozCancelRequestAnimationFrame) && // Firefox 5 ships without cancel support
        !window.oRequestAnimationFrame      && 
        !window.msRequestAnimationFrame)
          return window.setTimeout(fn, delay);
          
      var start = new Date().getTime(),
        handle = new Object();
        
      function loop(){
        var current = new Date().getTime(),
          delta = current - start;
          // delta = delay;
  
        delta >= delay ? fn.call() : handle.value = requestAnimFrame(loop);
      };
      
      handle.value = requestAnimFrame(loop);
      return handle;
    };

    
    // requestAnimationFrame() shim by Paul Irish
    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    window.requestAnimFrame = (function() {
      return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1000 / 60);
          };
    })();    
    
    
    // CLEARREQUESTTIMEOUT - to replace CLEARTIMEOUT - https://gist.github.com/joelambert/1002116
    /**
     * Behaves the same as clearTimeout except uses cancelRequestAnimationFrame() where possible for better performance
     * @param {int|object} fn The callback function
     */
    window.clearRequestTimeout = function(handle) {
        window.cancelAnimationFrame ? window.cancelAnimationFrame(handle.value) :
        window.webkitCancelAnimationFrame ? window.webkitCancelAnimationFrame(handle.value) :
        window.webkitCancelRequestAnimationFrame ? window.webkitCancelRequestAnimationFrame(handle.value) : /* Support for legacy API */
        window.mozCancelRequestAnimationFrame ? window.mozCancelRequestAnimationFrame(handle.value) :
        window.oCancelRequestAnimationFrame	? window.oCancelRequestAnimationFrame(handle.value) :
        window.msCancelRequestAnimationFrame ? window.msCancelRequestAnimationFrame(handle.value) :
        clearTimeout(handle);
    };    
    
    
    
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
      conTnBottom:              null,         // container on the bottom of the gallery
			scrollableParent:					null					// first scrollable parent container
    };
    G.shoppingCart =            [];
    G.layout = {                              // Layout informations
      internal :                true,
      engine :                  '',
      support :                 { rows: false },
      prerequisite :            { imageSize: false },
      SetEngine: function() {

      if( G.layout.internal ) {
          if( G.tn.settings.width[G.GOM.curNavLevel][G.GOM.curWidth] == 'auto' || G.tn.settings.width[G.GOM.curNavLevel][G.GOM.curWidth] == '' ) {
            // do not use getH() / getW() here!
            G.layout.engine = 'JUSTIFIED';
            G.layout.support.rows = true;
            G.layout.prerequisite.imageSize = true;
            return;
          }
          if( G.tn.settings.height[G.GOM.curNavLevel][G.GOM.curWidth] == 'auto' || G.tn.settings.height[G.GOM.curNavLevel][G.GOM.curWidth] == '' ) {
            // do not use getH() / getW() here!
            G.layout.engine = 'CASCADING';
            G.layout.support.rows = false;
            G.layout.prerequisite.imageSize = true;
            return;
          }

          if( G.tn.settings.getMosaic() != null ) {
            G.layout.engine = 'MOSAIC';
            G.layout.support.rows = true;
            G.layout.prerequisite.imageSize = false;
            return;
          }

          G.layout.engine = 'GRID';
          G.layout.support.rows=true;
          // if( G.tn.opt.Get('crop') === true ) {
            // G.layout.prerequisite.imageSize = true;
          // }
          // else {
            G.layout.prerequisite.imageSize = false;
          // }
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
    G.galleryFilterTagsMode = { l1: 0, lN: 0,
      Get: function() {
        return G.galleryFilterTagsMode[G.GOM.curNavLevel];
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
        l1: { crop: true, stacks: 0, stacksTranslateX: 0, stacksTranslateY: 0, stacksTranslateZ: 0, stacksRotateX: 0, stacksRotateY: 0, stacksRotateZ: 0, stacksScale: 0, borderHorizontal: 0, borderVertical: 0, baseGridHeight: 0, displayTransition: 'FADEIN', displayTransitionStartVal: 0, displayTransitionEasing: 'easeOutQuart', displayTransitionDuration: 240, displayInterval: 15 },
        lN: { crop: true, stacks: 0, stacksTranslateX: 0, stacksTranslateY: 0, stacksTranslateZ: 0, stacksRotateX: 0, stacksRotateY: 0, stacksRotateZ: 0, stacksScale: 0, borderHorizontal: 0, borderVertical: 0, baseGridHeight: 0, displayTransition: 'FADEIN', displayTransitionStartVal: 0, displayTransitionEasing: 'easeOutQuart', displayTransitionDuration: 240, displayInterval: 15 },
        Get: function(opt) {
          return G.tn.opt[G.GOM.curNavLevel][opt];
        }
      },
      scale:                          1,         // image scale depending of the hover effect
      labelHeight: {                  // in case label on bottom, otherwise always=0
        l1: 0, lN: 0,
        get: function() {
          return G.tn.labelHeight[G.GOM.curNavLevel];
        }
      },
      defaultSize: {                  // default thumbnail size
                                      // label height is not included
        width: {  l1 : { xs:0, sm:0, me:0, la:0, xl:0 }, lN : { xs:0, sm:0, me:0, la:0, xl:0 } },
        height: { l1 : { xs:0, sm:0, me:0, la:0, xl:0 }, lN : { xs:0, sm:0, me:0, la:0, xl:0 } },
        getWidth: function() {
          return G.tn.defaultSize.width[G.GOM.curNavLevel][G.GOM.curWidth];
        },
        getOuterWidth: function() {     // width including border
      G.tn.borderWidth = G.tn.opt.Get('borderHorizontal');
      G.tn.borderHeight = G.tn.opt.Get('borderVertical');
          var w = G.tn.defaultSize.width[G.GOM.curNavLevel][G.GOM.curWidth] + G.tn.opt.Get('borderHorizontal') * 2;
          if( G.O.thumbnailLabel.get('position') == 'right' || G.O.thumbnailLabel.get('position') == 'left' ) {
            w += G.tn.defaultSize.width[G.GOM.curNavLevel][G.GOM.curWidth];
          }
          return w;
        },
        getHeight: function() {
          return G.tn.defaultSize.height[G.GOM.curNavLevel][G.GOM.curWidth];
        },
        getOuterHeight: function() {     // height, border included
          return G.tn.defaultSize.height[G.GOM.curNavLevel][G.GOM.curWidth]+G.tn.opt.Get('borderVertical')*2;
        }
      },
      settings: {                     // user defined width/height of the image to display depending on the screen size
        width: {  l1 : { xs:0, sm:0, me:0, la:0, xl:0, xsc:'u', smc:'u', mec:'u', lac:'u', xlc:'u' },
                  lN : { xs:0, sm:0, me:0, la:0, xl:0, xsc:'u', smc:'u', mec:'u', lac:'u', xlc:'u' } },
        height: { l1 : { xs:0, sm:0, me:0, la:0, xl:0, xsc:'u', smc:'u', mec:'u', lac:'u', xlc:'u' }, 
                  lN : { xs:0, sm:0, me:0, la:0, xl:0, xsc:'u', smc:'u', mec:'u', lac:'u', xlc:'u' } },
        getH: function(l, w) {
          var cl = (l == undefined ? G.GOM.curNavLevel : l);
          var cw = (w == undefined ? G.GOM.curWidth : w);
          if( G.layout.engine == 'MOSAIC' ) {
          return this.height[cl][cw] * this.mosaic[cl+'Factor']['h'][cw];
          }
          else {
            return this.height[cl][cw];
          }
        },
        getW: function(l, w) {
          var cl = (l == undefined ? G.GOM.curNavLevel : l);
          var cw = (w == undefined ? G.GOM.curWidth : w);
          if( G.layout.engine == 'MOSAIC' ) {
            return this.width[cl][cw] * this.mosaic[cl+'Factor']['w'][cw];
          }
          else {
            return this.width[cl][cw];
            // return G.tn.settings.width[G.GOM.curNavLevel][G.GOM.curWidth];
          }
        },
        mosaic: { l1 : { xs: null, sm: null, me: null, la: null, xl: null },
                  lN : { xs: null, sm: null, me: null, la: null, xl: null },
                  l1Factor : { h :{ xs: 1, sm: 1, me: 1, la: 1, xl: 1 }, w :{ xs: 1, sm: 1, me: 1, la: 1, xl: 1 }},
                  lNFactor : { h :{ xs: 1, sm: 1, me: 1, la: 1, xl: 1 }, w :{ xs: 1, sm: 1, me: 1, la: 1, xl: 1 }}
                  },
				getMosaic: function() {
          return this.mosaic[G.GOM.curNavLevel][G.GOM.curWidth];
        },
        mosaicCalcFactor: function(l, w) {
            // retrieve max size multiplicator
            var maxW = 1;
            var maxH = 1;
            for( var n = 0; n < G.tn.settings.mosaic[l][w].length; n++ ) {
              maxW = Math.max(maxW, this.mosaic[l][w][n]['w']);
              maxH = Math.max(maxH, this.mosaic[l][w][n]['h']);
            }
            this.mosaic[l + 'Factor']['h'][w] = maxH;
            this.mosaic[l + 'Factor']['w'][w] = maxW;
        },
        gutterHeight: { l1 : { xs:0, sm:0, me:0, la:0, xl:0 }, lN : { xs:0, sm:0, me:0, la:0, xl:0 } },
        gutterWidth:  { l1 : { xs:0, sm:0, me:0, la:0, xl:0 }, lN : { xs:0, sm:0, me:0, la:0, xl:0 } },
        GetResponsive: function( setting ) {
          return this[setting][G.GOM.curNavLevel][G.GOM.curWidth];
        }
      },
      // thumbnail hover effects
      hoverEffects : {
        std :   [],
        level1: [],
        get: function() {
          if( G.GOM.curNavLevel == 'l1' && this.level1.length !== 0 ) {
            return this.level1;
          }
          else {
            return this.std;
          }
        }
      },
      // thumbnail init
      buildInit : {
        std :   [],
        level1: [],
        get: function() {
          if( G.GOM.curNavLevel == 'l1' && this.level1.length !== 0 ) {
            return this.level1;
          }
          else {
            return this.std;
          }
        }
      },
      // thumbnail toolbars
      toolbar: {
        album :   { topLeft : '', topRight: '', bottomLeft: '', bottomRight: '' },
        image :   { topLeft : '', topRight: '', bottomLeft: '', bottomRight: '' },
        albumUp : { topLeft : '', topRight: '', bottomLeft: '', bottomRight: '' },
        get: function( item ) {
          return this[item.kind];
        },
      },
      style: {
        // inline CSS
        l1 : { label: '', title: '', desc: '' },
        lN : { label: '', title: '', desc: '' },
        getTitle : function() {
          return ('style="' + this[G.GOM.curNavLevel].title + '"');
        },
        getDesc : function() {
          return ('style="' + this[G.GOM.curNavLevel].desc + '"');
        },
        getLabel: function() {
          var s='style="'+ this[G.GOM.curNavLevel].label;
          s+= (G.O.RTL ? '"direction:RTL;"' :'');
          s+='"';
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
    G.GalleryResizeThrottled =    throttle(GalleryResize, 15, {leading: false});
    
    G.blockList =                 null;     // album names - block list
    G.allowList =                 null;     // album names - allow list
    G.albumList =                 [];       // album list
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
      displayedMoreSteps :        0,  // current number of displayed steps (moreButton mode)
      items:                      [], // current items of the GOMS
      $imgPreloader:              [],
      thumbnails2Display:         [],
      itemsDisplayed :            0, // number of currently displayed thumbnails
      firstDisplay :              true,
      firstDisplayTime :          0,      // in conjunction with galleryRenderDelay
      navigationBar : {           // content of the navigation bar (for breadcrumb, filter tags and next/previous pagination)
        displayed:                false,
        $newContent:              ''
      },
      cache : {                   // cached data
        viewport:                 null,
        containerOffset:          null,
        areaWidth:                100         // available area width
      },
      nbSelected :                0,        // number of selected items
      pagination :                { currentPage: 0 }, // pagination data
      panThreshold:               60,       // threshold value (in pixels) to block horizontal pan/swipe
      panYOnly:                   false,    // threshold value reach -> definitively block horizontal pan until end of pan
      lastFullRow :               -1,       // number of the last row without holes
      lastDisplayedIdx:           -1,       // used to display the counter of not displayed items
      displayInterval :           { from: 0, len: 0 },
      hammertime:                 null,
      curNavLevel:                'l1',   // current navigation level (l1 or LN)
      curWidth:                   'me',
      albumSearch:                '',     // current search string -> title (used to filter the thumbnails on screen)
      albumSearchTags:            '',     // current search string -> tags
      lastZIndex:                 0,      // used to put a thumbnail on top of all others (for exemple for scale hover effect)
      lastRandomValue:            0,
      slider : {                          // slider on last thumbnail
        hostIdx:                  -1,       // idx of the thumbnail hosting the slider
        hostItem:                 null,     // item hosting the slider
        currentIdx:               0,        // idx of the current displayed item
        nextIdx:                  0,        // idx of the next item to display in the slider
        timerID:                  0,
        tween:                    null      // tranistion tween instance
      },
      NGY2Item: function( idx ) {   // returns a NGY2Item or null if it does not exist
        if( G.GOM.items[idx] == undefined || G.GOM.items[idx] == null ) { return null; }
        var i = G.GOM.items[idx].thumbnailIdx;
        return G.I[i];
      },
      // One GOM item (thumbnail)
      // function GTn(index, width, height) {
      GTn: function(index, width, height) {
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
      },
      // Position the top of the gallery to make it visible, if not displayed
      ScrollToTop: function() {

        if( G.GOM.firstDisplay ) {      
          // do no scroll to top on first display
          return;
        }
        
        if( G.$E.scrollableParent === null && !topInViewportVert(G.$E.base, 20) ) {
          // $('html, body').animate({scrollTop: G.$E.base.offset().top}, 200);
          G.$E.base.get(0).scrollIntoView();
        }
        
        if( G.$E.scrollableParent !== null ) {
          // gallery in a scrollable container: check if we have to scroll up so that the top of the gallery is visible
          // vertical position of the scrollbar
          var scrollTop = G.$E.scrollableParent.scrollTop();
          // top of the gallery relative to the top of the scrollable container
          var dist = Math.abs(G.$E.scrollableParent.offset().top - G.$E.base.offset().top - scrollTop);
          if( scrollTop > dist ) {
            window.ng_draf( function() {
              // we need a little delay before setting the new scrollbar (but why?....)
               G.$E.scrollableParent.scrollTop(dist);
            });
          }
        }
      }
    };
    
    
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
      $viewer:                    null,
      $toolbar:                   null,   // viewerToolbar
      $toolbarTL:                 null,   // viewer toolbar on top left
      $toolbarTR:                 null,   // viewer toolbar on top right
      
      toolbarMode:                'std',  // current toolbar mode (standard, minimized)
      playSlideshow :             false,  // slide show mode status
      playSlideshowTimerID:       0,      // slideshow mode time
      slideshowDelay:             3000,   // slideshow mode - delay before next image
      albumID:                    -1,
      viewerMediaIsChanged:       false,  // media display is currently modified
      items:                      [],     // current list of images to be managed by the viewer

      panMode:                    'off',  // if panning, which element -> media, gallery, or zoom - if not -> off

      $baseCont:                  null,   // lightbox container
      $content:                   null,   // pointer to the 3 media in the viewer
      content: {
        previous : {
            vIdx: -1,
            $media: null,
            NGY2Item: function() {
              return G.I[ G.VOM.items[G.VOM.content.previous.vIdx].ngy2ItemIdx ];
            }
        },
        current : {
            vIdx: -1,
            $media: null,
            NGY2Item: function() {
              return G.I[ G.VOM.items[G.VOM.content.current.vIdx].ngy2ItemIdx ];
            }
        },
        next : {
            vIdx: -1,
            $media: null,
            NGY2Item: function() {
              return G.I[ G.VOM.items[G.VOM.content.next.vIdx].ngy2ItemIdx ];
            }
        }
      },
      IdxNext: function() {
        var n = 0;
        // if( G.VOM.currItemIdx <= (G.VOM.items.length-1) ) {
        if( G.VOM.content.current.vIdx < (G.VOM.items.length-1) ) {
          n = G.VOM.content.current.vIdx + 1;
        }
        return n;
      },
      IdxPrevious: function() {
        var n = G.VOM.content.current.vIdx - 1;
        if( G.VOM.content.current.vIdx == 0 ) {
          n = G.VOM.items.length - 1;
        }
        return n;
      },
			
			gallery: {
        $elt: null,             // Base container
        $tmbCont: null,         // Thumbnail container
				gwidth: 0,              // thumbnail container width (all thumbnails)
        vwidth: 0,              // visible width of the gallery (just for the visible thumbnails)
				oneTmbWidth: 0,
				firstDisplay: true,
				posX: 0,
				SetThumbnailActive() {
					if( G.O.viewerGallery == 'none' ) { return; }
					this.$tmbCont.children().removeClass('activeVThumbnail');
					this.$tmbCont.children().eq( G.VOM.content.current.vIdx ).addClass('activeVThumbnail');
					this.firstDisplay = false;
				},
				Resize: function() {
					if( G.O.viewerGallery == 'none' ) { return; }

					if( !this.firstDisplay ) {
						var viewerW = G.VOM.$viewer.width();
						
						// Center base element 
						var maxTmb = Math.trunc(viewerW / this.oneTmbWidth);      // max thumbnail that can be displayed
            this.vwidth = maxTmb * this.oneTmbWidth;
						this.$elt.css({ width: this.vwidth, left: (viewerW - this.vwidth)/2 });
            
						// Set the position the thumbnails container (if there's no enough space for all thumbnails)
						if( G.VOM.items.length >= maxTmb ) {
							var tmbPos = this.oneTmbWidth * G.VOM.content.current.vIdx;    // left position of the selected thumbnail
              
              if( (tmbPos + this.posX) < this.vwidth ) {
                  if( tmbPos + this.posX < 0 ) {
                    this.posX = -tmbPos;
                  }
              }
              else {
                if( tmbPos + this.posX >= this.vwidth ) {
                  this.posX = this.vwidth - (tmbPos + this.oneTmbWidth)
                }
              }
						}
						
            this.PanGallery(0);
					}
          else {
            // first display of the gallery -> opacity transition
            new NGTweenable().tween({
              from:         { opacity: 0 },
              to:           { opacity: 1 },
              easing:       'easeInOutSine',
              duration:     1000,
              step:         function (state) {
                // G.VOM.gallery.$elt.css( state );
              },
              finish:       function (state) {
                // G.VOM.gallery.$elt.css({ opacity: 1});
              }
            });

          }
				},
        PanGallery: function( panX ){
          
          // all thumbnails are visible -> center the base element
          if( this.gwidth < G.VOM.$viewer.width() ) {       // this.oneTmbWidth
            this.posX = (G.VOM.$viewer.width() - this.gwidth) / 2;   
            panX = 0;   // block pan
          }
          
          // if( this.posX > (this.vwidth - this.oneTmbWidth) ) {
          if( this.posX > (this.vwidth - this.oneTmbWidth) ) {
            // gallery is outside of the screen, right side
            this.posX = this.vwidth - this.oneTmbWidth;
          }
          if( (this.posX+this.gwidth) < this.oneTmbWidth ) {
            // gallery is outside of the screen, left side
            this.posX = -this.gwidth + this.oneTmbWidth;
          }
          
          this.$tmbCont.css( G.CSStransformName , 'translateX(' + (this.posX + panX) + 'px)');
        },
        PanGalleryEnd: function( velocity ) {      // velocity = pixels/millisecond

          var d = velocity * 100;         // distance 
          new NGTweenable().tween({
            from:         { pan: G.VOM.gallery.posX },
            to:           { pan: G.VOM.gallery.posX + d },
            easing:       'easeOutQuad',
            duration:     500,
            step:         function (state) {
              G.VOM.gallery.posX = state.pan;
              G.VOM.gallery.PanGallery( 0 );
            }
          });
        }
				
			},
      hammertime:         null,   // hammer.js manager
      swipePosX:          0,      // current horizontal swip position
      panPosX:            0,      // position for manual pan
      panPosY:            0,
      panThreshold:       60,     // threshold value (in pixels) to block vertical pan
      panXOnly:           false,  // threshold value reach -> definitively block vertical pan until end of pan
      singletapTime:			0,
			viewerTheme:        '',
      timeImgChanged:     0,
      ImageLoader: {
        // fires a callback when image size is know (during download)
        // inspired by ROB - http://stackoverflow.com/users/226507/rob
        maxChecks:        1000,
        list:             [],
        intervalHandle :  null,

        loadImage : function (callback, ngitem) {
          if( ngitem.mediaKind != 'img' ) { return; }     // ignore - only for images
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
    function VImg( index ) {
      this.$e = null;
      this.ngy2ItemIdx = index;
      this.mediaNumber = G.VOM.items.length + 1;     
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
    // Gradient generator: https://www.grabient.com/
    G.galleryTheme_dark = {
      navigationBar :         { background: 'none', borderTop: '', borderBottom: '', borderRight: '', borderLeft: '' },
      navigationBreadcrumb :  { background: '#111', color: '#fff', colorHover: '#ccc', borderRadius: '4px' },
      navigationFilter :      { color: '#ddd', background: '#111', colorSelected: '#fff', backgroundSelected: '#111', borderRadius: '4px' },
      navigationPagination :  { background: '#111', color: '#fff', colorHover: '#ccc', borderRadius: '4px' },
      thumbnail :             { background: '#444', backgroundImage: 'linear-gradient(315deg, #111 0%, #445 90%)', borderColor: '#000', borderRadius: '0px', labelOpacity : 1, labelBackground: 'rgba(34, 34, 34, 0)', titleColor: '#fff', titleBgColor: 'transparent', titleShadow: '', descriptionColor: '#ccc', descriptionBgColor: 'transparent', descriptionShadow: '', stackBackground: '#aaa' },
      thumbnailIcon :         { padding: '5px', color: '#fff', shadow:'' },
      pagination :            { background: '#181818', backgroundSelected: '#666', color: '#fff', borderRadius: '2px', shapeBorder: '3px solid #666', shapeColor: '#444', shapeSelectedColor: '#aaa'}
    };

    G.galleryTheme_light = {
      navigationBar :         { background: 'none', borderTop: '', borderBottom: '', borderRight: '', borderLeft: '' },
      navigationBreadcrumb :  { background: '#eee', color: '#000', colorHover: '#333', borderRadius: '4px' },
      navigationFilter :      { background: '#eee', color: '#222', colorSelected: '#000', backgroundSelected: '#eee', borderRadius: '4px' },
      navigationPagination :  { background: '#eee', color: '#000', colorHover: '#333', borderRadius: '4px' },
      thumbnail :             { background: '#444', backgroundImage: 'linear-gradient(315deg, #111 0%, #445 90%)', borderColor: '#000', labelOpacity : 1, labelBackground: 'rgba(34, 34, 34, 0)', titleColor: '#fff', titleBgColor: 'transparent', titleShadow: '', descriptionColor: '#ccc', descriptionBgColor: 'transparent', descriptionShadow: '', stackBackground: '#888' },
      thumbnailIcon :         { padding: '5px', color: '#fff' },
      pagination :            { background: '#eee', backgroundSelected: '#aaa', color: '#000', borderRadius: '2px', shapeBorder: '3px solid #666', shapeColor: '#444', shapeSelectedColor: '#aaa'}
    };

    // Color schemes - lightbox
    G.viewerTheme_dark = {
      background:             '#000',
      barBackground:          'rgba(4, 4, 4, 0.2)',
      barBorder:              '0px solid #111',
      barColor:               '#fff',
      barDescriptionColor:    '#ccc'
    };
    G.viewerTheme_light = {
      background:             '#f8f8f8',
      barBackground:          'rgba(4, 4, 4, 0.7)',
      barBorder:              '0px solid #111',
      barColor:               '#fff',
      barDescriptionColor:    '#ccc'
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
        var base_id = 'my_nanogallery';
        var c = '';
        var f = true;
        while( f ) {
          if (document.getElementById(base_id + c)) {
            // ID already exists
            if( c == '' ) {
              c = 1;
            }
            else {
              c++;
            }
          }
          else {
            f = false;
            G.baseEltID = 'my_nanogallery' + c;
          }
        }
        G.$E.base.attr('id', G.baseEltID)
      }
      G.O.$markup =       [];
      
      DefineVariables();
      SetPolyFills();
      BuildSkeleton();
      G.GOM.firstDisplayTime = Date.now();
      
      SetGlobalEvents();

      // check if only one specific album will be used
      if( !G.O.lightboxStandalone ) {
				var albumToDisplay = G.O.album;
				if( albumToDisplay == '' && G.O.photoset != '' ) {
					albumToDisplay = G.O.photoset;
					G.O.album = G.O.photoset;
				}
				if( albumToDisplay != '' ) {
					G.O.displayBreadcrumb = false;    // no breadcrumb since only 1 album
					if( albumToDisplay.toUpperCase() != 'NONE' ) {
						// open a public album
						if( G.O.kind == "nano_photos_provider2") {
							if( albumToDisplay == decodeURIComponent(albumToDisplay)) {
								// album ID must be encoded
								albumToDisplay = encodeURIComponent(albumToDisplay);
								G.O.album = albumToDisplay;
							}
						}
						NGY2Item.New( G, '', '', albumToDisplay, '-1', 'album' );
						if( !ProcessLocationHash() ) {
							DisplayAlbum('-1', albumToDisplay);
						}
						return;
					}
				}
      }
     
      // use full content
      // add base album
      NGY2Item.New( G, G.i18nTranslations.breadcrumbHome, '', '0', '-1', 'album' );

      processStartOptions();

    }


    /** @function processStartOptions */
    function processStartOptions() {
      // open image or album
      // 1. load hidden albums
      // 2. check if location hash set (deep linking)
      // 3. check openOnStart parameter
      // 4. open root album (ID=-1)

      // hidden/private albums are loaded on plugin start (Picasa) --> no more available in Google Photos
      // if( G.albumListHidden.length > 0 ) {
      //  jQuery.nanogallery2['data_'+G.O.kind](G, 'GetHiddenAlbums', G.albumListHidden, processStartOptionsPart2);
      //  return;
      //}
      
      if( !ProcessLocationHash() ) {
        processStartOptionsPart2();
      }
    }

    /** @function processStartOptionsPart2 */
    function processStartOptionsPart2() {
  
      // Check location hash + start parameters -> determine what to do on start
      if( G.O.lightboxStandalone ) {
        LightboxStandaloneFindContent();
			}
			else {
				// openOnStart parameter
				if( G.O.openOnStart != '' ) {
					var IDs = parseIDs(G.O.openOnStart);
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
    }
    
    
    // Lightbox standaone -> retrieve the items to display
    // Each item needs at least a thumbnail image and a big image
    // ONLY IMAGES SUPPORTED
    function LightboxStandaloneFindContent() {

      G.GOM.curNavLevel = 'l1';

      if( G.O.items == null ) {
        // retrieve all element having "data-nanogallery2-lightbox" and from the same group if defined
        var elts = jQuery('[data-nanogallery2-Lightbox');
        // element group
        var g = G.$E.base[0].dataset.nanogallery2Lgroup;

        GetContentMarkup( elts, g );
      }
      else {
        // Content defined in the starting parameters
        GetContentApiObject();
      }
      
      LightboxStandaloneDisplay();
        
    }
    
    
    // Populate G.VOM.items + open the lightbox
    function LightboxStandaloneDisplay() {

      G.VOM.items = [];
      G.VOM.albumID = '0';
      G.GOM.curNavLevel = 'l1';
      var vcnt = 0;

      var elt = G.$E.base[0].attributes;
      var thumbsrc = '';
      // src attribute (img element)
      if( elt.hasOwnProperty('src') ) {
        thumbsrc = elt['src'].nodeValue;
      }
      // data-ngthumb attribute
      if( thumbsrc == '' && elt.hasOwnProperty('data-ngthumb') ) {
        thumbsrc = elt['data-ngthumb'].nodeValue;
      }
      
      var displayIdx = undefined;
      for( var idx = 0; idx < G.I.length; idx++ ) {
        if( G.I[idx].kind == 'image' ) {
          var vimg = new VImg(idx);
          G.VOM.items.push(vimg);

          if( G.I[idx].thumbImg().src == thumbsrc ) {
            // same thumbnail URL
            displayIdx = vcnt;
          }
          vcnt++;
        }
        
      }
      if( G.VOM.items.length > 0 ) {
        LightboxOpen( displayIdx );
      }
      else {
        NanoConsoleLog(G, 'No content for Lightbox standalone.');
      }
    }
   
    
    
    // Parse string to extract albumID and imageID (format albumID/imageID)
    function parseIDs( IDs ) {
      var r = { albumID: '0', imageID: '0' };
      
      var t = IDs.split('/');
      if( t.length > 0 ) {
        r.albumID = t[0];
        if( t.length > 1 ) {
          r.imageID = t[1];
        }
      }
      return r;
    }
    

    /** @function DisplayAlbum */
    function DisplayAlbum( imageID, albumID ) {
      // close viewer if already displayed
      if( G.VOM.viewerDisplayed ) {
        LightboxClose(null);
      }
    
      // set current navigation level (l1 or lN)
      var albumIdx = NGY2Item.GetIdx(G, albumID);
      G.GOM.curNavLevel = 'lN';
      if( albumIdx == 0 ) {
        G.GOM.curNavLevel = 'l1';
      }
      G.layout.SetEngine();
      G.galleryResizeEventEnabled = false;

      if( albumIdx == -1 ) {
        NGY2Item.New( G, '', '', albumID, '0', 'album' );    // create empty album
        albumIdx = G.I.length - 1;
      }
    
      if( !G.I[albumIdx].contentIsLoaded ) {
        // get content of the album if not already loaded
        AlbumGetContent( albumID, DisplayAlbum, imageID, albumID );
        return;
      }
    
      ThumbnailSelectionClear();
    
      G.GOM.pagination.currentPage = 0;
      SetLocationHash( albumID, '' );
      GalleryRender( albumIdx );
    
    }


    //----- manage the bottom area of the gallery -> "pagination" or "more button"
    function GalleryBottomManage() {

      switch( G.galleryDisplayMode.Get() ) {
        case 'PAGINATION':
          if( G.layout.support.rows && G.galleryMaxRows.Get() > 0 ) {
            ManagePagination();
          }
          break;
        case 'MOREBUTTON':
          G.$E.conTnBottom.off('click');
          var nb = G.GOM.items.length-G.GOM.itemsDisplayed;
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
        var cAlbumID = jQuery(this).data('albumID');
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

    
    
    // Manage the gallery toolbar (breadcrumb + tag filter + pagination next/previous)
    function GalleryNavigationBar( albumIdx ) {

      // Title + background image
      // var bgImage='';
      // var l=G.I.length;
      // var albumID = G.I[albumIdx].GetID();
      // for( var idx=0; idx<l ; idx++) {
        // var item=G.I[idx];
        // if( item.kind == 'image' && item.isToDisplay(albumID) ) {
          // bgImage='<div id="pipo" class="pipo" style="height: 150px; width:100%; background-image: url("' + item.responsiveURL() + '"); background-size: cover; background-position: center center; filter:blur(2px)">pipo</div>';
          // break;
        // }
      // }

      //console.log(bgImage);
    
      // new navigation bar items are not build in the DOM, but in memory
      G.GOM.navigationBar.$newContent=jQuery('<div class="nGY2Navigationbar"></div>');
      //G.GOM.navigationBar.$newContent = jQuery(bgImage );
      //console.log(G.GOM.navigationBar.$newContent);

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

      
      //-- manage and build tag filters
      if( G.galleryFilterTags.Get() != false ) {
        var nTags = G.I[albumIdx].albumTagList.length;
        if( nTags > 0 ) {
          for(var i = 0; i < nTags; i++ ) {
            var s = G.I[albumIdx].albumTagList[i];
            var ic = G.O.icons.navigationFilterUnselected;
            var tagClass = 'Unselected';
            if( jQuery.inArray(s, G.I[albumIdx].albumTagListSel) >= 0 ) {
              tagClass = 'Selected';
              ic = G.O.icons.navigationFilterSelected;
            }
            
            var $newTag = jQuery('<div class="nGY2NavigationbarItem nGY2NavFilter' + tagClass + '">'+ ic +' '+ s +'</div>').appendTo(G.GOM.navigationBar.$newContent);

            $newTag.click(function() {
  
              var $this = jQuery(this);
              var tag = $this.text().replace(/^\s*|\s*$/, '');  //trim trailing/leading whitespace
  
              if( G.galleryFilterTagsMode.Get() == 'single' ) {
                // single TAG selection
                G.I[albumIdx].albumTagListSel = [];
                G.I[albumIdx].albumTagListSel.push(tag);
              }
              else {
                // multiple selection of TAGS
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
              }
              
              DisplayAlbum('-1', G.I[albumIdx].GetID());
            });
          }
          
          // clear/reset TAGS selection
          var $newClearFilter=jQuery('<div class="nGY2NavigationbarItem nGY2NavFilterSelectAll">'+ G.O.icons.navigationFilterSelectedAll +'</div>').appendTo(G.GOM.navigationBar.$newContent);
          $newClearFilter.click(function() {
            // var nTags = G.I[albumIdx].albumTagList.length;
            G.I[albumIdx].albumTagListSel = [];
            // for(var i = 0; i < nTags; i++ ) {
            //  var s = G.I[albumIdx].albumTagList[i];
            //  G.I[albumIdx].albumTagListSel.push(s);
            // }
            DisplayAlbum('-1', G.I[albumIdx].GetID());
          });
        }
      }
      
      // --- Gallery pagination next/previous
      if( G.galleryDisplayMode.Get() == "PAGINATION" && G.O.galleryPaginationTopButtons ) {
          if( G.layout.support.rows && G.galleryMaxRows.Get() > 0 ) {
            // ManagePagination( G.GOM.albumIdx );
            var $newTagPrev = jQuery('<div class="nGY2NavigationbarItem nGY2NavPagination">'+G.O.icons.navigationPaginationPrevious+'</div>').appendTo(G.GOM.navigationBar.$newContent);
            $newTagPrev.click(function() {
              paginationPreviousPage();
            });
            var $newTagNext = jQuery('<div class="nGY2NavigationbarItem nGY2NavPagination">'+G.O.icons.navigationPaginationNext+'</div>').appendTo(G.GOM.navigationBar.$newContent);
            $newTagNext.click(function() {
              paginationNextPage();
            });
          }
      }

    }
    
    function BreadcrumbBuild(lstItems) {

      // console.log(G.GOM.navigationBar.$newContent);
      jQuery('<div class="nGY2NavigationbarItem nGY2Breadcrumb"></div>').appendTo(G.GOM.navigationBar.$newContent);
      // console.log(G.GOM.navigationBar.$newContent);
      
      if( G.O.breadcrumbOnlyCurrentLevel ) {
        // display only 1 separator and the current folder level
        if( lstItems.length == 0 ) {
          breadcrumbAdd(0);
        }
        else {
          // var last=lstItems.length-1;
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
    

    // Display gallery pagination
    function ManagePagination() {

      G.$E.conTnBottom.css('opacity', 0);
      G.$E.conTnBottom.children().remove();

      if( G.GOM.items.length == 0 ) { return; }   // no thumbnail to display

      // calculate the number of pages
      var nbPages = Math.ceil((G.GOM.items[G.GOM.items.length - 1].row + 1)/G.galleryMaxRows.Get());

      // only one page -> do not display pagination
      if( nbPages == 1 ) { return; }

      // check if current page still exists (for example after a resize)
      if( G.GOM.pagination.currentPage > (nbPages-1) ) {
        G.GOM.pagination.currentPage = nbPages-1;
      }
      
      GalleryRenderGetInterval();
      // nothing to display --> exit
      if( G.GOM.displayInterval.len == 0 ) { return; }
      
      // display "previous"
      if( G.O.galleryPaginationMode == 'NUMBERS' && G.GOM.pagination.currentPage > 0 ) {
        var $eltPrev = jQuery('<div class="nGY2PaginationPrev">'+G.O.icons.paginationPrevious+'</div>').appendTo(G.$E.conTnBottom);
        $eltPrev.click(function(e) {
          paginationPreviousPage();
        });
      }

      var firstPage = 0;
      var lastPage = nbPages;
      if( G.O.galleryPaginationMode != 'NUMBERS' ) {
        // no 'previous'/'next' and no max number of pagination items
        firstPage = 0;
      }
      else {
        // display pagination numbers and previous/next
        // var vp = G.O.paginationVisiblePages;
        var numberOfPagesToDisplay = G.O.paginationVisiblePages;
        if( numberOfPagesToDisplay >= nbPages ) {
          firstPage = 0;
        }
        else {
          // we have more pages than we want to display
          var nbBeforeAfter = 0;
          if( isOdd(numberOfPagesToDisplay) ) {
            nbBeforeAfter = (numberOfPagesToDisplay + 1) / 2;
          }
          else {
            nbBeforeAfter = numberOfPagesToDisplay / 2;
          }
          
          if( G.GOM.pagination.currentPage < nbBeforeAfter ) {
            firstPage = 0;
            lastPage = numberOfPagesToDisplay - 1;
            if( lastPage > nbPages ) {
              lastPage = nbPages - 1;
            }
          }
          else {
            firstPage = G.GOM.pagination.currentPage - nbBeforeAfter;
            lastPage = firstPage + numberOfPagesToDisplay;
            if( lastPage > nbPages ) {
              lastPage = nbPages - 1;
            }
          }
          
          if( (lastPage - firstPage) < numberOfPagesToDisplay ) {
            firstPage = lastPage - numberOfPagesToDisplay;
            if( firstPage < 0 ) {
              firstPage = 0;
            }
          }

        }
      }

      // render pagination items
      for(var i = firstPage; i < lastPage; i++ ) {
        var c = '';
        var p = '';

        switch( G.O.galleryPaginationMode ) {
          case 'NUMBERS':
            c = 'nGY2paginationItem';
            p = i + 1;
            break;
          case 'DOTS':
            c = 'nGY2paginationDot';
            break;
          case 'RECTANGLES':
            c = 'nGY2paginationRectangle';
            break;
        }
        if( i == G.GOM.pagination.currentPage ) {
          c += 'CurrentPage';
        }

        var elt$ = jQuery('<div class="' + c + '">' + p + '</div>').appendTo(G.$E.conTnBottom);
        elt$.data('pageNumber', i );
        elt$.click( function(e) {
          G.GOM.pagination.currentPage = jQuery(this).data('pageNumber');
          TriggerCustomEvent('pageChanged');

          // scroll to top of gallery if not displayed
          G.GOM.ScrollToTop();
 
          GalleryDisplayPart1();
          GalleryDisplayPart2( true );
        });

      }

      // display "next"
      if( G.O.galleryPaginationMode == 'NUMBERS' && (G.GOM.pagination.currentPage + 1) < nbPages ) {
        var $eltNext = jQuery('<div class="nGY2PaginationNext">' + G.O.icons.paginationNext + '</div>').appendTo(G.$E.conTnBottom);
        $eltNext.click( function(e) {
          paginationNextPage();
        });
      }

      G.$E.conTnBottom.css('opacity', 1);

    }
    function isOdd(num) { return (num % 2) == 1;}
    
    // pagination - next page
    function paginationNextPage() {
      // var aIdx = G.GOM.albumIdx;
      var n1 = 0;
      ThumbnailHoverOutAll();
      
      // pagination - max lines per page mode
      if( G.galleryMaxRows.Get() > 0 ) {
        // number of pages
        n1 = (G.GOM.items[G.GOM.items.length - 1].row + 1) / G.galleryMaxRows.Get();
      }
      var n2 = Math.ceil(n1);
      var pn = G.GOM.pagination.currentPage;
      if( pn < (n2-1) ) {
        pn++;
      }
      else {
        pn = 0;
      }
      
      G.GOM.pagination.currentPage = pn;
      TriggerCustomEvent('pageChanged');

      // scroll to top of gallery if not displayed
      G.GOM.ScrollToTop();

      GalleryDisplayPart1();
      GalleryDisplayPart2( true );
    }
    
    // pagination - previous page
    function paginationPreviousPage() {
      // var aIdx=G.$E.conTnBottom.data('galleryIdx'),
      // var aIdx = G.GOM.albumIdx;
      var n1 = 0;

      ThumbnailHoverOutAll();
      
      // pagination - max lines per page mode
      if( G.galleryMaxRows.Get() > 0 ) {
        // number of pages
        n1 = (G.GOM.items[G.GOM.items.length - 1].row + 1) / G.galleryMaxRows.Get();
      }
      var n2 = Math.ceil(n1);
      
      // var pn=G.$E.conTnBottom.data('currentPageNumber');
      var pn = G.GOM.pagination.currentPage;
      if( pn > 0 ) {
        pn--;
      }
      else {
        pn = n2 - 1;
      }

      G.GOM.pagination.currentPage = pn;
      TriggerCustomEvent('pageChanged');

      // scroll to top of gallery if not displayed
      G.GOM.ScrollToTop();

      GalleryDisplayPart1();
      GalleryDisplayPart2( true );
    }

    // retrieve the from/to intervall for gallery thumbnail render
    function GalleryRenderGetInterval() {
      G.GOM.displayInterval.from = 0;
      G.GOM.displayInterval.len = G.I.length;
      
      switch( G.galleryDisplayMode.Get() ) {
        case 'PAGINATION':
          if( G.layout.support.rows ) {
            let nbTn = G.GOM.items.length;
            var firstRow = G.GOM.pagination.currentPage * G.galleryMaxRows.Get();
            var lastRow = firstRow + G.galleryMaxRows.Get();
            var firstTn = -1;
            G.GOM.displayInterval.len = 0;
            for( var i = 0; i < nbTn ; i++ ) {
              let curTn = G.GOM.items[i];
              if( curTn.row >= firstRow && curTn.row < lastRow ) {
                if( firstTn == -1 ) {
                  G.GOM.displayInterval.from = i;
                  firstTn = i;
                }
                G.GOM.displayInterval.len++;
              }
            }
          }
          break;
        case 'MOREBUTTON':
          if( G.layout.support.rows ) {
            let nbTn = G.GOM.items.length;
            let lastRow = G.O.galleryDisplayMoreStep * (G.GOM.displayedMoreSteps+1);
            G.GOM.displayInterval.len = 0;
            for( var i = 0; i < nbTn ; i++ ) {
              let curTn = G.GOM.items[i];
              if( curTn.row < lastRow ) {
                G.GOM.displayInterval.len++;
              }
            }
          }
          break;
        case 'ROWS':
          if( G.layout.support.rows ) {
            let nbTn = G.GOM.items.length;
            let lastRow = G.galleryMaxRows.Get();
            if( G.galleryLastRowFull.Get() && G.GOM.lastFullRow != -1 ) {
              if( lastRow > (G.GOM.lastFullRow + 1) ) {
                lastRow = G.GOM.lastFullRow + 1;
              }
            }
            G.GOM.displayInterval.len = 0;
            for( var i = 0; i < nbTn ; i++ ) {
              let curTn = G.GOM.items[i];
              if( curTn.row < lastRow ) {
                G.GOM.displayInterval.len++;
              }
            }
          }
          break;
        default:
        case 'FULLCONTENT':
        if( G.layout.support.rows && G.galleryLastRowFull.Get() && G.GOM.lastFullRow != -1 ) {
            let nbTn = G.GOM.items.length;
            let lastRow = G.GOM.lastFullRow + 1;
            G.GOM.displayInterval.len = 0;
            for( var i = 0; i < nbTn ; i++ ) {
              let curTn = G.GOM.items[i];
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
      clearTimeout(G.GOM.slider.timerID);
      G.GOM.slider.hostIdx = -1;      // disabled slider on thumbnail
      
      var fu=G.O.fnGalleryRenderStart;
      if( fu !== null ) {
        // typeof fu == 'function' ? fu(albumIdx) : window[fu](albumIdx);
        typeof fu == 'function' ? fu( G.I[G.GOM.albumIdx] ) : window[fu]( G.I[G.GOM.albumIdx] );
      }

      G.layout.SetEngine();
      G.galleryResizeEventEnabled = false;
      G.GOM.albumIdx = -1;
      G.GOM.lastDisplayedIdx = -1;

      // pagination
      if( G.$E.conTnBottom !== undefined ) {
        // G.$E.conTnBottom.children().remove();
        G.$E.conTnBottom.empty();
      }

      // navigation toolbar (breadcrumb + tag filters + pagination next/previous)
      GalleryNavigationBar(albumIdx);
      
      if( G.GOM.firstDisplay ) {
				// first gallery display
        G.GOM.firstDisplay = false;
        var d = Date.now()-G.GOM.firstDisplayTime;
        if( d < G.O.galleryRenderDelay ) {
					// display after defined delay
          // setTimeout( function() { GalleryRenderPart1( albumIdx )}, G.O.galleryRenderDelay-d );
          requestTimeout( function() { GalleryRenderPart1( albumIdx )}, G.O.galleryRenderDelay-d );
        }
        else {
          GalleryRenderPart1( albumIdx );
        }
        G.O.galleryRenderDelay = 0;
        
      }
      else {
        var hideNavigationBar = false;
        if( G.GOM.navigationBar.$newContent.children().length == 0 ) {
          hideNavigationBar = true;
        }

        // hide everything
        var tweenable = new NGTweenable();
        tweenable.tween({
          from:         { 'opacity': 1 },
          to:           { 'opacity': 0 },
          duration:     300,
          easing:       'easeInQuart',
          attachment:   { h: hideNavigationBar },
          step:         function (state, att) {
            G.$E.conTnParent.css({'opacity': state.opacity });
            if( att.h ) {
              G.$E.conNavigationBar.css({ 'opacity': state.opacity });
            }
          },
          finish:       function (state, att) {
            if( att.h ) {
              G.$E.conNavigationBar.css({ 'opacity': 0, 'display': 'none' });
            }
            // scroll to top of the gallery if needed

            G.GOM.ScrollToTop();

            GalleryRenderPart1( albumIdx );
          }
        });
      }
    }


    function GalleryRenderPart1( albumIdx ) {
      // display new navigation bar
      var oldN = G.$E.conNavigationBar.children().length;
      G.$E.conNavigationBar.empty();
      G.GOM.navigationBar.$newContent.children().clone(true,true).appendTo(G.$E.conNavigationBar);
      // G.GOM.navigationBar.$newContent.appendTo(G.$E.conNavigationBar);
      if( G.$E.conNavigationBar.children().length > 0 && oldN == 0 ) {
        G.$E.conNavigationBar.css({ 'opacity': 0, 'display': 'block' });
        var tweenable = new NGTweenable();
        tweenable.tween({
          from:     { opacity: 0 },
          to:       { opacity: 1 },
          duration: 200,
          easing:   'easeInQuart',
          step:     function (state) {
            // window.ng_draf( function() {
              G.$E.conNavigationBar.css( state );
            // });
          },
          finish:   function (state) {
            // window.ng_draf( function() {
              G.$E.conNavigationBar.css({ 'opacity': 1 });
              // display gallery
              // GalleryRenderPart2( albumIdx );
              // setTimeout(function(){ GalleryRenderPart2(albumIdx) }, 60);
              requestTimeout(function(){ GalleryRenderPart2(albumIdx) }, 20);
            // });
          }
        });
      }
      else {
        requestTimeout(function(){ GalleryRenderPart2(albumIdx) }, 20);
      }

    }
    
    // Gallery render part 2 -> remove all existing thumbnails
    function GalleryRenderPart2(albumIdx) {

			G.GOM.lastZIndex = parseInt(G.$E.base.css('z-index'));
      if( isNaN(G.GOM.lastZIndex) ) {
        G.GOM.lastZIndex=0;
      }
      G.$E.conTnParent.css({ 'opacity': 0 });
      G.$E.conTn.off().empty();
      var l = G.I.length;
      for( var i = 0; i < l ; i++ ) {
        // reset each item
        var item = G.I[i];
        item.hovered = false;
        item.$elt = null;
        item.$Elts = [];
        item.eltTransform = [];
        item.eltFilter = [];
        item.width = 0;
        item.height = 0;
        item.left = 0;
        item.top = 0;
        item.resizedContentWidth = 0;
        item.resizedContentHeight = 0;
        item.thumbnailImgRevealed = false;
      }

      if( G.CSStransformName == null ) {
        G.$E.conTn.css('left', '0px');
      }
      else {
        // G.$E.conTn.css( G.CSStransformName, 'translateX(0px)');
        G.$E.conTn.css( G.CSStransformName, 'none');
      }
      
      // setTimeout(function(){ GalleryRenderPart3(albumIdx) }, 60);
      requestTimeout(function(){ GalleryRenderPart3(albumIdx) }, 20);
      // GalleryRenderPart3(albumIdx);

    }
    
    // Gallery render part 3 -> start building the new gallery
    function GalleryRenderPart3(albumIdx) {
      var d = new Date();      
      
      G.$E.conTnParent.css( 'opacity', 1);

      G.GOM.items = [];
      G.GOM.displayedMoreSteps = 0;
      // retrieve label height      
      if( G.O.thumbnailLabel.get('position') == 'onBottom' ) {
        // retrieve height each time because size can change depending on thumbnail's settings
        G.tn.labelHeight[G.GOM.curNavLevel] = ThumbnailGetLabelHeight();
      }
      else {
        G.tn.labelHeight[G.GOM.curNavLevel] = 0;
      }
      G.GOM.albumIdx=albumIdx;

      TriggerCustomEvent('galleryRenderEnd');
      var fu=G.O.fnGalleryRenderEnd;
      if( fu !== null ) {
        // typeof fu == 'function' ? fu(albumIdx) : window[fu](albumIdx);
        typeof fu == 'function' ? fu(G.I[G.GOM.albumIdx] ) : window[fu](G.I[G.GOM.albumIdx] );
      }

      // Step 1: populate GOM
      if( GalleryPopulateGOM() ) {
        // step 2: calculate layout
        GallerySetLayout();

        // step 3: display whole gallery 
        GalleryAppear();
        
        // step 4: display thumbnails
        GalleryDisplayPart1();
        requestTimeout(function(){ GalleryDisplayPart2( false ) }, 20);
      }
      else {
        // 
        G.galleryResizeEventEnabled = true;
      }
      
      if( G.O.debugMode ) { console.log('GalleryRenderPart3: '+ (new Date()-d)); }

    }
    
    
    // Resize the gallery
    function GalleryResize() {
      var d = new Date();
      G.galleryResizeEventEnabled = false;
      // G.GOM.cache.areaWidth=G.$E.conTnParent.width();
      if( GallerySetLayout() == false ) {
        G.galleryResizeEventEnabled = true;
        if( G.O.debugMode ) { console.log('GalleryResize1: '+ (new Date()-d)); }
        return;
      }
      if( G.O.debugMode ) { console.log('GalleryResizeSetLayout: '+ (new Date()-d)); }

      GalleryDisplayPart1();
      GalleryDisplayPart2( false );

      if( G.O.debugMode ) { console.log('GalleryResizeFull: '+ (new Date()-d)); }
    }
    
    
    
    // copy items (album content) to GOM
		// returns:
		//		true: thumbnail image size is needed for the layout, but not set -> retrieve the sizes and display gallery
    function GalleryPopulateGOM() {
      
      var preloadImages = '';
      var albumID = G.I[G.GOM.albumIdx].GetID();
      var l = G.I.length;
      var cnt = 0;

      for( var idx = 0; idx < l; idx++ ) {
        var item = G.I[idx];
        // check album
        if( item.isToDisplay(albumID) ) {
          var w = item.thumbImg().width;
          var h = item.thumbImg().height;
          // if unknown image size and layout is not grid --> we need to retrieve the size of the images
          if( G.layout.prerequisite.imageSize && ( w == 0 || h == 0) ) {
            preloadImages += '<img src="'+item.thumbImg().src+'" data-idx="'+cnt+'" data-albumidx="'+G.GOM.albumIdx+'">';
          }
          
          // set default size if required
          if( h == 0 ) {
            h = G.tn.defaultSize.getHeight();
          }
          if( w == 0 ) {
            w = G.tn.defaultSize.getWidth();
          }
          var tn = new G.GOM.GTn(idx, w, h);
          G.GOM.items.push(tn);
          cnt++;
        }
      }

      TriggerCustomEvent('galleryObjectModelBuilt');
      var fu = G.O.fnGalleryObjectModelBuilt;
      if( fu !== null ) {
        typeof fu == 'function' ? fu() : window[fu]();
      }

      if( preloadImages != '' ) {
        // preload images to retrieve their size and then resize the gallery (=GallerySetLayout()+ GalleryDisplay())
        var $newImg = jQuery(preloadImages);
        var gi_imgLoad = ngimagesLoaded( $newImg );
        $newImg = null;
        gi_imgLoad.on( 'progress', function( instance, image ) {
        
          if( image.isLoaded ) {
            var idx = image.img.getAttribute('data-idx');
            var albumIdx = image.img.getAttribute('data-albumidx');
            if( albumIdx == G.GOM.albumIdx ) {
              // ignore event if not on current album
              var curTn = G.GOM.items[idx];
              curTn.imageWidth = image.img.naturalWidth;
              curTn.imageHeight = image.img.naturalHeight;
              var item = G.I[curTn.thumbnailIdx];
              item.thumbs.width[G.GOM.curNavLevel][G.GOM.curWidth] = curTn.imageWidth;
              item.thumbs.height[G.GOM.curNavLevel][G.GOM.curWidth] = curTn.imageHeight;
 
              // resize the gallery
              G.GalleryResizeThrottled();
              
              // set the retrieved size to all levels with same configuration  
              var object = item.thumbs.width.l1;
              for (let property in object) {
                if (object.hasOwnProperty(property)) {
                  if( property != G.GOM.curWidth ) {
                    if( G.tn.settings.width.l1[property] == G.tn.settings.getW() && G.tn.settings.height.l1[property] == G.tn.settings.getH() ) {
                      item.thumbs.width.l1[property] = curTn.imageWidth;
                      item.thumbs.height.l1[property] = curTn.imageHeight;
                    }
                  }
                }
              }
              object = item.thumbs.width.lN;
              for (let property in object) {
                if (object.hasOwnProperty(property)) {
                  if( property != G.GOM.curWidth ) {
                    if( G.tn.settings.width.lN[property] == G.tn.settings.getW() && G.tn.settings.height.lN[property] == G.tn.settings.getH() ) {
                      item.thumbs.width.lN[property] = curTn.imageWidth;
                      item.thumbs.height.lN[property] = curTn.imageHeight;
                    }
                  }
                }
              }
            }
          }
        });
        G.galleryResizeEventEnabled = true;
        return false;
      }
      else {
        return true;
      }
      
    }
    
    //----- Calculate the layout of the thumbnails for the full gallery
    function GallerySetLayout() {
      var r = true;
      // width of the available area
      G.GOM.cache.areaWidth = G.$E.conTnParent.width();
      G.GOM.displayArea = { width:0, height:0 };

      switch( G.layout.engine ) {
        case 'JUSTIFIED':
          r = GallerySetLayoutWidthtAuto();
          break;
        case 'CASCADING':
          r = GallerySetLayoutHeightAuto();
          break;
        case 'MOSAIC':
          r = GallerySetLayoutMosaic();
          break;
        case 'GRID':
        default:
          r = GallerySetLayoutGrid();
          break;
      }
      
      TriggerCustomEvent('galleryLayoutApplied');
      var fu = G.O.fnGalleryLayoutApplied;
      if( fu !== null ) {
        typeof fu == 'function' ? fu() : window[fu]();
      }
      return r;

    }
    
    
    //----- CASCADING LAYOUT
    function GallerySetLayoutHeightAuto() {
      var curCol =      0,
      areaWidth =       G.GOM.cache.areaWidth,
      curRow =          0,
      colHeight =       [],
      maxCol =          NbThumbnailsPerRow(areaWidth),
      gutterWidth =     0,
      gutterHeight =    G.tn.settings.GetResponsive('gutterHeight');
      var w =           0;
      var scaleFactor = 1;
      var tnWidth =     G.tn.defaultSize.getOuterWidth();
      var nbTn =        G.GOM.items.length;
      var curPosY = 0;

      if( G.O.thumbnailAlignment == 'justified' ) {
        maxCol = Math.min(maxCol, nbTn);
        gutterWidth = ( maxCol == 1 ? 0 : (areaWidth - (maxCol * tnWidth) ) / (maxCol - 1) );
      }
      else {
        gutterWidth = G.tn.settings.GetResponsive('gutterWidth');
      }


      var borderWidth = G.tn.opt.Get('borderHorizontal') * 2;
      var borderHeight = G.tn.opt.Get('borderVertical') * 2;

      G.GOM.lastFullRow=-1;   // feature disabled

      // Retrieve the real used width of the area (the evaluation is based on the content of the first line)
      if( G.O.thumbnailAlignment == 'fillWidth' ) {
        // fillWidth --> evaluate scale factor and number of columns
        var totalGutterWidth = (maxCol - 1) * gutterWidth;
        scaleFactor = (areaWidth - totalGutterWidth) / (maxCol * tnWidth);
        if( scaleFactor > 1 ) {
          maxCol++; // add one column and re-evaluate the scale factor
        }
        totalGutterWidth = (maxCol - 1) * gutterWidth;
        scaleFactor = Math.min( (areaWidth - totalGutterWidth) / (maxCol*tnWidth), 1);   // no upscale
      }

      
      tnWidth = Math.round( tnWidth * scaleFactor);
      var contentWidth = tnWidth - borderWidth;

      // loop to position the thumbnails, and set their size
      var baseHeight = Math.round( G.tn.opt.Get('baseGridHeight') * scaleFactor );
      for( var i = 0; i < nbTn ; i++ ) {
        var curTn = G.GOM.items[i];
        if( curTn.deleted == true ) { break; }    // item is logically deleted
        if( curTn.imageHeight > 0 && curTn.imageWidth > 0 ) {
          var curPosX = 0,
          curPosY = 0;
          var imageRatio = curTn.imageHeight / curTn.imageWidth;
          // curTn.resizedContentWidth = tnWidth - borderWidth;
          curTn.resizedContentWidth = contentWidth;
          curTn.resizedContentHeight = curTn.resizedContentWidth * imageRatio;
          if( baseHeight > 0 ) {
            // grid based vertical position
            var t = Math.max( Math.trunc(curTn.resizedContentHeight/baseHeight), 1) ;
            curTn.resizedContentHeight = baseHeight * t + ((t-1)*(borderHeight+gutterHeight));
          }
          
          curTn.height = curTn.resizedContentHeight + borderHeight + G.tn.labelHeight.get();
          curTn.width = tnWidth;
          curTn.row = 0;
          
          if( curRow == 0 ) {
            // first row
            curPosX = curCol * (tnWidth + gutterWidth);
            colHeight[curCol] = curTn.height + gutterHeight;
            
            curCol++;
            if( curCol >= maxCol ) {
              curCol = 0;
              curRow++;
            }
          }
          else {
            var c=0,
            minColHeight=colHeight[0];
            for( var j = 1; j < maxCol; j++) {
              if( (colHeight[j] + 5) < minColHeight ) {     // +5 --> threshold
                minColHeight = colHeight[j];
                c = j;
                //break;
              }
            }
            curPosY = colHeight[c];
            curPosX = c * (tnWidth + gutterWidth);
            colHeight[c] = curPosY + curTn.height + gutterHeight;
          }

          var x = curPosX;
          if( G.O.RTL) {
            x= w - curPosX - tnWidth;
          }

          curTn.left = x;
          curTn.top = curPosY;
        }
      }

      G.GOM.displayArea.width= maxCol * (tnWidth + gutterWidth) - gutterWidth;
      return true;
    }
    
    
    //----- JUSTIFIED LAYOUT
    function GallerySetLayoutWidthtAuto() {
      var curWidth =               0,
      areaWidth =                  G.GOM.cache.areaWidth,
      lastPosX =                   0,
      curPosY =                    0,
      rowLastItem =                [],
      rowNum =                     0,
      rowHeight =                  [],
      bNewRow =                    false,
      cnt =                        0,
      gutterWidth =                G.tn.settings.GetResponsive('gutterWidth'),
      gutterHeight =               G.tn.settings.GetResponsive('gutterHeight');
      // by grief-of-these-days
      var maxRowHeightVertical =   0; // max height of a row with vertical thumbs
      var maxRowHeightHorizontal = 0; // max height of a row with horizontal thumbs
      var rowHasVertical =         false; // current row has vertical thumbs
      var rowHasHorizontal =       false; // current row has horizontal thumbs

      var tnHeight = G.tn.defaultSize.getOuterHeight();
      var borderWidth = G.tn.opt.Get('borderHorizontal') * 2;
      var borderHeight = G.tn.opt.Get('borderVertical') * 2;
      var nbTnInCurrRow = 1;
      var nbTn = G.GOM.items.length;

      // first loop --> retrieve each row image height
      for( var i = 0; i < nbTn ; i++ ) {
        let curTn = G.GOM.items[i];
        if( curTn.deleted == true ) { break; }    // item is logically deleted
        if( curTn.imageWidth > 0 ) {
          let imageRatio = curTn.imageWidth / curTn.imageHeight;
          let imageWidth = Math.floor( tnHeight * imageRatio );

          if( bNewRow ) {
            bNewRow = false;
            rowNum++;
            curWidth = 0;
            rowHasVertical = false;
            rowHasHorizontal = false;
            nbTnInCurrRow = 1;
          }
          // by grief-of-these-days
          if( curTn.imageHeight > curTn.imageWidth ) {
            rowHasVertical = true;
          }
          else {
            rowHasHorizontal = true;
          }
          
          if( (curWidth + gutterWidth + imageWidth) < (areaWidth - (nbTnInCurrRow * borderWidth)) ) {
            // enough place left in the current row
            curWidth += imageWidth + gutterWidth;
            rowHeight[rowNum] = tnHeight;
            
            // prevent incomplete row from being heigher than the previous ones.
            // by grief-of-these-days
            var rowHeightLimit = Math.max(rowHasVertical ? maxRowHeightVertical : 0, rowHasHorizontal ? maxRowHeightHorizontal : 0);
            if( rowHeightLimit > 0 ) {
              rowHeight[rowNum] = Math.min(rowHeight[rowNum], rowHeightLimit);
            }
            
            rowLastItem[rowNum] = i;
          }
          else {
            // new row after current item --> we need to adujet the row height to have enough space for the current thumbnail
            curWidth += gutterWidth+imageWidth;
            let ratio = (areaWidth - nbTnInCurrRow * borderWidth) / curWidth;
            let rH = Math.floor(tnHeight * ratio);
            rowHeight[rowNum] = rH;
            
            // save the max row height for each thumb orientation.
            // by grief-of-these-days
            if( rowHasVertical ) {
              maxRowHeightVertical = Math.max( maxRowHeightVertical, rH );
            }
            if( rowHasHorizontal ) {
              maxRowHeightHorizontal = Math.max( maxRowHeightHorizontal, rH );
            }
            
            rowLastItem[rowNum] = i;
            bNewRow = true;
          }
          cnt++;
          nbTnInCurrRow++;
        }
      }

      rowNum = 0;
      curPosY = 0;
      lastPosX = 0;
      cnt = 0;
      
      G.GOM.lastFullRow = 0;    // display at leat 1 row (even if not full)
      
      // second loop --> calculate each thumbnail size
      for( var i = 0; i < nbTn ; i++ ) {
        let curTn = G.GOM.items[i];
        if( curTn.imageWidth > 0 ) {
          let imageRatio = curTn.imageWidth / curTn.imageHeight;
          let imageWidth = Math.floor( imageRatio * rowHeight[rowNum] ); // border is already NOT included

          if( i == rowLastItem[rowNum] ) {
            // row last item --> adjust image width because of rounding problems
            if( rowLastItem.length != (rowNum+1) ) {
              // last item in current row -> use the full remaining width
              imageWidth = areaWidth - lastPosX - borderWidth;
            }
            else {
              // very last item (on the last row)
              if( (lastPosX + gutterWidth + imageWidth + borderWidth ) > areaWidth ) {
                // reduce size if image is wider as the remaining space
                imageWidth = areaWidth - lastPosX - borderWidth;
              }
            }
          }
          
          let rh = parseInt( rowHeight[rowNum] );
          imageWidth = parseInt( imageWidth );

          // thumbnail image size
          curTn.resizedContentWidth = imageWidth;
          curTn.resizedContentHeight = rh;
          // thumbnail position and size
          curTn.width = imageWidth + borderWidth;
          curTn.height= rh + G.tn.labelHeight.get() + borderHeight;
          curTn.row = rowNum;

          curTn.top = curPosY;
          let x = lastPosX;
          if( G.O.RTL) {
            x = areaWidth - lastPosX - curTn.width ;
          }
          curTn.left = x;

          lastPosX += curTn.width + gutterWidth;

          if( i == rowLastItem[rowNum] ) {
            // start a new row
            curPosY += curTn.height + gutterHeight;
            G.GOM.lastFullRow = rowNum - 1;
            rowNum++;
            lastPosX = 0;
          }
          cnt++;
        }
        else {
          return false;
        }
      }
      
      // hover effect on gallery (vs on thumbnail) --> experimental / not used
      if( false ) {
        var newTop = 0;
        if( typeof GOMidx !== 'undefined' ) {
          if( G.GOM.albumIdx != -1 ) {
            var hoveredTn = G.GOM.items[GOMidx];
            
            // hovered thumbnail
            hoveredTn.width += 40;
            hoveredTn.height += 40;
            
            for( var i = 0; i < nbTn ; i++ ) {
              var curTn = G.GOM.items[i];
              if( curTn.imageWidth > 0 ) {
                if( curTn.row == hoveredTn.row ) {
                  // hovered row
                  newTop = 40;
                  if( hoveredTn.thumbnailIdx != curTn.thumbnailIdx ) {
                    // not hovered thumbnail
                    curTn.top += 30;
                    curTn.width -= 20;
                    curTn.height -= 20;
                  }
                }
                else {
                  // not hovered row
                  if( curTn.row == 0 ) {
                    // first row
                  }
                  else {
                    curTn.top += newTop;
                  }
                }
              }
            }
          }
        }
      }
      
      G.GOM.displayArea.width = areaWidth;
      return true;
    }    
    

    //----- MOSAIC LAYOUT
    // Grid using a user defined pattern layout
    // With this layout, a pattern definition is handeld a row
    function GallerySetLayoutMosaic() {
      var areaWidth =     G.GOM.cache.areaWidth;
      var gutterHeight =  G.tn.settings.GetResponsive('gutterHeight');
      var gutterWidth =   G.tn.settings.GetResponsive('gutterWidth');
      var borderWidth =   G.tn.opt.Get('borderHorizontal') * 2;
      var borderHeight =  G.tn.opt.Get('borderVertical') * 2;

      var nbTn = G.GOM.items.length;
      var row = 0;
      var h = 0;
      var n = 0;
      
      
      // first loop: evaluate the gallery width based on the first row
      var nbCols = 0;
      var maxW = 0;
      let mosaicPattern = G.tn.settings.getMosaic();
      for( var i = 0; i < nbTn ; i++ ) {
        let curPatternElt = mosaicPattern[n];

        var cLeft = (curPatternElt.c - 1) * G.tn.defaultSize.getOuterWidth() + (curPatternElt.c - 1) * gutterWidth;
        var cWidth = curPatternElt.w * G.tn.defaultSize.getOuterWidth() + (curPatternElt.w - 1) * gutterWidth;
        
        maxW = Math.max(maxW, cLeft + cWidth );
        
        nbCols = Math.max(nbCols, (curPatternElt.c - 1) + curPatternElt.w );

        n++;
        if( n >= mosaicPattern.length ) {
          // end of pattern
          break;
        }
      }
      var totalGutterWidth = (nbCols - 1) * gutterWidth;
      var scaleFactor = Math.min( (areaWidth - totalGutterWidth ) / ( maxW - totalGutterWidth ), 1);
      
      // second loop: position all the thumbnails based on the layout pattern
      row = 0;
      n = 0;
      // let mosaicPattern = G.tn.settings.getMosaic();
      for( var i = 0; i < nbTn ; i++ ) {
        let curTn = G.GOM.items[i];
        let curPatternElt = mosaicPattern[n];
        
        curTn.top = Math.round((curPatternElt.r - 1) * G.tn.defaultSize.getOuterHeight()*scaleFactor) + (curPatternElt.r - 1) * gutterHeight + row * h + (G.tn.labelHeight.get()*(curPatternElt.r-1)) ;
        if( row > 0 ) {
          curTn.top += gutterHeight;
        }

        curTn.left = (curPatternElt.c - 1) * Math.round(G.tn.defaultSize.getOuterWidth()*scaleFactor) + (curPatternElt.c - 1) * gutterWidth;

        curTn.height = Math.round(curPatternElt.h * G.tn.defaultSize.getOuterHeight() * scaleFactor) + (curPatternElt.h - 1) * gutterHeight + (G.tn.labelHeight.get() * curPatternElt.h);
        curTn.resizedContentHeight = curTn.height - G.tn.labelHeight.get() - borderHeight;

        curTn.width = Math.round(curPatternElt.w * G.tn.defaultSize.getOuterWidth()*scaleFactor) + (curPatternElt.w - 1) * gutterWidth;
        curTn.resizedContentWidth = curTn.width - borderWidth ;

        curTn.row = row;
        if( row == 0 ) {
          h=Math.max(h, curTn.top + curTn.height);
        }

        n++;
        if( n >= mosaicPattern.length ) {
          // end pattern -> new line
          n = 0;
          row++;
        }
      }
      
      G.GOM.displayArea.width = (maxW - totalGutterWidth) * scaleFactor + totalGutterWidth;
      return true;
    }
    
    
    
    // --- GRID LAYOUT
    function GallerySetLayoutGrid() {
      var curPosX=      0,
      curPosY=          0,   
      areaWidth=        G.GOM.cache.areaWidth,
      gutterWidth=      0,
      gutterHeight=     G.tn.settings.GetResponsive('gutterHeight'),
      maxCol=           NbThumbnailsPerRow(areaWidth),
      w=                0,
      cols=             [],
      curCol=           0,
      newAreaWidth =    areaWidth,
      tnWidth=          G.tn.defaultSize.getOuterWidth();
      var scaleFactor = 1;
      var nbTn=         G.GOM.items.length;
      var borderWidth   = G.tn.opt.Get('borderHorizontal') * 2;
      var borderHeight  = G.tn.opt.Get('borderVertical') * 2;
      
      // retrieve gutter width
      if( G.O.thumbnailAlignment == 'justified' ) {
        maxCol = Math.min( maxCol, nbTn);
        gutterWidth = (maxCol==1 ? 0 : (areaWidth-(maxCol*tnWidth))/(maxCol-1));
      }
      else {
        gutterWidth = G.tn.settings.GetResponsive('gutterWidth');
      }

      // first loop to retrieve the real used width of the area (the evaluation is based on the content of the first line)
      // Retrieve the real used width of the area (the evaluation is based on the content of the first line)
      if( G.O.RTL || G.O.thumbnailAlignment == 'fillWidth' ) {
        // scaled --> evaluate scale factor and number of columns
        var totalGutterWidth = (maxCol-1) * gutterWidth;
        scaleFactor = (areaWidth - totalGutterWidth) / (maxCol*tnWidth);
        if( scaleFactor > 1 ) {
          maxCol++; // add one column and re-evaluate the scale factor
        }
        totalGutterWidth = (maxCol-1) * gutterWidth;
        scaleFactor = Math.min( (areaWidth - totalGutterWidth) / (maxCol*tnWidth), 1);   // no upscale
        newAreaWidth = (maxCol*tnWidth) + totalGutterWidth;
      }

      
      G.GOM.lastFullRow = 0 ;    // display at leat 1 row (even if not full)
      // var lastPosY = 0;
      var row = 0;
      
      tnWidth = Math.round(tnWidth * scaleFactor);
      var contentWidth = tnWidth - borderWidth;
      var tnHeight = Math.round(G.tn.defaultSize.getOuterHeight() * scaleFactor) + G.tn.labelHeight.get();
      var contentHeight = Math.round( G.tn.defaultSize.getOuterHeight() * scaleFactor) - borderHeight;
      
      // loop to position and to set size of all thumbnails
      for( var i = 0; i < nbTn ; i++ ) {
        if( curPosY == 0 ) {
          curPosX = curCol * (tnWidth + gutterWidth)
          cols[curCol] = curPosX;
          w = curPosX + tnWidth;
        }
        else {
          curPosX = cols[curCol];
        }

        var x = curPosX;
        if( G.O.RTL ) {
          x = parseInt(newAreaWidth) - curPosX - tnWidth;
        }
        
        // MANDATORY : set thumbnail position AND size
        var curTn=G.GOM.items[i];
        curTn.top = curPosY;
        curTn.left = x;
        curTn.height = tnHeight;
        curTn.width = tnWidth;
        // image size
        if( G.O.thumbnailAlignment == 'fillWidth' ) {
          curTn.resizedContentWidth = contentWidth;
          curTn.resizedContentHeight = contentHeight;
        }
        curTn.row = row;
        // lastPosY = curPosY;

        curCol++;
        if( curCol >= maxCol ){
          // new line
          curCol = 0;
          curPosY += tnHeight + gutterHeight;
          G.GOM.lastFullRow = row;
          row++;
        }
      }
      G.GOM.displayArea.width = w;

      return true;
    }




    //----- Display the thumbnails according to the calculated layout
    function GalleryDisplayPart1() {
      if( G.CSStransformName == null ) {
        G.$E.conTn.css( 'left' , '0px');
      }
      else {
        G.$E.conTn.css( G.CSStransformName , 'none');
      }
      // CacheViewport();
    }
    
    function CacheViewport() {
      G.GOM.cache.viewport = getViewport();
      // G.GOM.cache.areaWidth = G.$E.conTnParent.width();
      G.GOM.cache.areaWidth = G.$E.base.width();
			
			// position of the gallery container
			// we use the position of the loadingbar because :
			//    - the gallery may be wrong positioned due to one display animation currently running
			//    - the loadingbar is never animated and positioned just before the gallery container
      //G.GOM.cache.containerOffset = G.$E.conTnParent.offset();
      if( !G.O.lightboxStandalone ) {
        G.GOM.cache.containerOffset = G.$E.conLoadingB.offset();
      }
    }


    
    function GalleryDisplayPart2( forceTransition ) {
      CacheViewport();

      var nbTn = G.GOM.items.length;
      G.GOM.itemsDisplayed = 0;
      var threshold = 50;
      var cnt = 0;    // counter for delay between each thumbnail display
      

      GalleryRenderGetInterval();
      
      for( var i = 0; i < nbTn ; i++ ) {
        let curTn = G.GOM.items[i];
        if( i >= G.GOM.displayInterval.from && cnt < G.GOM.displayInterval.len ) {
          curTn.inDisplayArea = true;
          if( forceTransition ) {
            curTn.neverDisplayed = true;
          }
          G.GOM.itemsDisplayed++;
          cnt++;
        }
        else{
          curTn.inDisplayArea = false;
        }
      }

      // bottom of the gallery (pagination, more button...)
      GalleryBottomManage();

      var tnToDisplay = [];
      var tnToReDisplay = [];
      
      CacheViewport();
      G.GOM.clipArea.top = -1;
      cnt = 0 ;
      var lastTnIdx = -1;
      G.GOM.clipArea.height = 0;
      // NOTE: loop always the whole GOM.items --> in case an already displayed thumbnail needs to be removed
      for( var i = 0; i < nbTn ; i++ ) {
        let curTn = G.GOM.items[i];
        if( curTn.inDisplayArea ) {
          if( G.GOM.clipArea.top == -1 ) {
            G.GOM.clipArea.top = curTn.top;
          }
          if( (curTn.top - G.GOM.clipArea.top) <= -1 ) {
            // with mosaic layout, the first thumbnail may not give the top position
            G.GOM.clipArea.top = curTn.top;
          }

          G.GOM.clipArea.height = Math.max( G.GOM.clipArea.height, curTn.top-G.GOM.clipArea.top + curTn.height);
        
          if( curTn.neverDisplayed ) {
						// thumbnail is not displayed -> check if in viewport to display or not
            var top = G.GOM.cache.containerOffset.top + (curTn.top - G.GOM.clipArea.top);
            // var left=containerOffset.left+curTn.left;
            if( (top + curTn.height) >= (G.GOM.cache.viewport.t - threshold) && top <= (G.GOM.cache.viewport.t + G.GOM.cache.viewport.h + threshold) ) {
              // build thumbnail
              let item = G.I[curTn.thumbnailIdx];
              if( item.$elt == null ) {
                // ThumbnailBuild( item, curTn.thumbnailIdx, i, (i+1) == nbTn );
                ThumbnailBuild( item, curTn.thumbnailIdx, i );
              }
              tnToDisplay.push({idx:i, delay:cnt, top: curTn.top, left: curTn.left});
              cnt++;
            }
          }
          else {
            tnToReDisplay.push({idx: i, delay: 0, top: curTn.top, left: curTn.left});
          }
          // G.GOM.itemsDisplayed++;
          lastTnIdx = i;
        }
        else {
          curTn.displayed = false;
          let item = G.I[curTn.thumbnailIdx];
          if( item.$elt != null ){
            item.$elt.css({ opacity: 0, display: 'none' });
          }
        }
      }

      var areaWidth = G.$E.conTnParent.width();

      // set gallery area really used size
      // if( G.GOM.displayArea.width != G.GOM.displayAreaLast.width || G.GOM.displayArea.height != G.GOM.displayAreaLast.height ) {
      if( G.GOM.displayArea.width != G.GOM.displayAreaLast.width || G.GOM.clipArea.height != G.GOM.displayAreaLast.height ) {
        G.$E.conTn.width( G.GOM.displayArea.width ).height( G.GOM.clipArea.height );
        G.GOM.displayAreaLast.width = G.GOM.displayArea.width;
        G.GOM.displayAreaLast.height = G.GOM.clipArea.height;
        // G.GOM.displayAreaLast.height=G.GOM.displayArea.height-G.GOM.clipArea.top;
      }

      if( areaWidth != G.$E.conTnParent.width() ) {
        // gallery area width changed since layout calculation (for example when a scrollbar appeared)
        // so we need re-calculate the layout before displaying the thumbnails
        G.GOM.cache.areaWidth = G.$E.conTnParent.width();
        GallerySetLayout();
        GalleryDisplayPart1();
        GalleryDisplayPart2( forceTransition );
        return;
      }

      // counter of not displayed images (is displayed on the last thumbnail)
      if( G.layout.support.rows ) {
        if( G.galleryDisplayMode.Get() == 'ROWS' || (G.galleryDisplayMode.Get() == 'FULLCONTENT' && G.galleryLastRowFull.Get() && G.GOM.lastFullRow != -1) ){
          if( lastTnIdx < (nbTn - 1) ) {
            G.GOM.lastDisplayedIdxNew = lastTnIdx;
          }
          else {
            G.GOM.lastDisplayedIdxNew =- 1;
          }
          // remove last displayed counter
          if( G.GOM.lastDisplayedIdx != -1 ) {
            let item = G.I[G.GOM.items[G.GOM.lastDisplayedIdx].thumbnailIdx];
            item.$getElt('.nGY2GThumbnailIconsFullThumbnail').html('');
          }
        }
      }

      
      // batch set position (and display animation) to all thumbnails
      // first display newly built thumbnails
      
      G.GOM.thumbnails2Display=[];
      
      var duration = ThumbnailPreparePosition( tnToDisplay );
      ThumbnailPreparePosition( tnToReDisplay );

      ThumbnailDisplayAnimBatch();

      if( G.tn.opt.Get('displayTransition') == 'NONE' ) {
        G.galleryResizeEventEnabled = true;
        // GalleryThumbnailSliderBuildAndStart();  // image slider on last displayed thumbnail
        TriggerCustomEvent('galleryDisplayed');
      }
      else {
        // setTimeout(function() {
        requestTimeout( function() {
          // change value after the end of the display transistion of the newly built thumbnails
          G.galleryResizeEventEnabled = true;
          // GalleryThumbnailSliderBuildAndStart();  // image slider on last displayed thumbnail
          TriggerCustomEvent('galleryDisplayed');
        // }, nbBuild * G.tn.opt.Get('displayInterval'));
        }, duration * G.tn.opt.Get('displayInterval'));
      }
      
    }
    
    
    function ThumbnailPreparePosition( lstThumb ) {

      var nbBuild = lstThumb.length;
      if( nbBuild == 0 ) { return 0; }
    
      
      var displayOrder = G.tn.opt.Get('displayOrder');
      
			if( displayOrder == 'random' ) {
				NGY2Tools.AreaShuffle( lstThumb );
			}
      else {
        if( displayOrder == 'rowByRow' && !( G.layout.engine == 'JUSTIFIED' || G.layout.engine == 'GRID' )) {
          displayOrder = '';
        }
        if( (displayOrder == 'colFromRight' || displayOrder == 'colFromLeft' ) && !(G.layout.engine == 'CASCADING' || G.layout.engine == 'GRID' )) {
          displayOrder = '';
        }
      }
     
        
      // DISPLAY COLUMN BY COLUMN
      if( displayOrder == 'colFromRight' || displayOrder == 'colFromLeft' ) {
        var tab = [];
        var cols = [];
        for( var i = 0; i < nbBuild ; i++ ) {
          if( tab[lstThumb[i].left] == undefined ) {
            tab[lstThumb[i].left] = [];
            cols.push( lstThumb[i].left );
          }
          tab[lstThumb[i].left].push( lstThumb[i].idx )
        }
        if( displayOrder == 'colFromRight' ) {
          cols = cols.reverse();
        }
        for( var i = 0; i < cols.length; i++ ) {
          var col = cols[i];
          for( var j = 0; j < tab[col].length; j++ ) {
            ThumbnailSetPosition( tab[col][j], i);
          }
        }
        return(i);
      }
        
        
      // STANDARD DISPLAY OR ROW BY ROW
      var d = 0;
      var top = lstThumb[0].top;
      for( var i = 0; i < nbBuild ; i++ ) {
        // ThumbnailSetPosition(tnToDisplay[i].idx, tnToDisplay[i].delay+10);
        // ThumbnailSetPosition(tnToDisplay[i].idx, i);

        if( displayOrder == 'rowByRow' ) {
          // DISPLAY ROW BY ROW
          if( lstThumb[i].top > top ) {
            d++;
            top = lstThumb[i].top;
          }
        }
        else {
          d++;
        }
        ThumbnailSetPosition(lstThumb[i].idx, d);
      }
      return(d);
      
    }
    
    // Thumbnail: set the new position
    function ThumbnailSetPosition( GOMidx, cnt ) {
      var newTop=   0;
      var curTn=    G.GOM.items[GOMidx];
      var idx=      G.GOM.items[GOMidx].thumbnailIdx;
      var item=     G.I[idx];
    
      if( curTn.neverDisplayed ) {
        // thumbnail is built but has never been displayed (=first display)
        var top = curTn.top - G.GOM.clipArea.top;
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
          var gi_imgLoad = ngimagesLoaded( item.$getElt('.nGY2TnImg2') );
          gi_imgLoad.on( 'progress', function( instance, image ) {
            if( image.isLoaded ) {
              var albumIdx = image.img.getAttribute('data-albumidx');
              if( albumIdx == G.GOM.albumIdx ) {
                // ignore event if not on current album
                var idx = image.img.getAttribute('data-idx');
                G.I[idx].ThumbnailImageReveal();
              }
            }
          });
        }
        // display the thumbnail
        ThumbnailAppear(GOMidx, cnt);

        curTn.displayed = true;
        curTn.neverDisplayed = false;
      }
      else {
        var topOld = G.GOM.cache.containerOffset.top + item.top;
        var top = G.GOM.cache.containerOffset.top + (curTn.top - G.GOM.clipArea.top);
        newTop = curTn.top - G.GOM.clipArea.top;
        var vp = G.GOM.cache.viewport;
        if( G.O.thumbnailDisplayOutsideScreen || ( ( (topOld + curTn.height) >= (vp.t - vp.h) && topOld <= (vp.t + vp.h * 4) ) ||
              ( (top + curTn.height) >= (vp.t - vp.h) && top <= (vp.t + vp.h * 4) ) )  ) {
          // thumbnail positioned in enlarged viewport (viewport + 4 x viewport height) (v1.5: changed from 2 to 4)
          if( curTn.displayed ) {
            // thumbnail is displayed
            if( item.top != curTn.top || item.left != curTn.left ) {
              // set position
              if( G.O.galleryResizeAnimation == true ) {
                // with transition
                var tweenable = new NGTweenable();
                tweenable.tween({
                  from:       { top: item.top, left: item.left,  height: item.height,  width: item.width },
                  to:         { top: newTop,   left: curTn.left, height: curTn.height, width: curTn.width },
                  attachment: { $e: item.$elt },
                  duration:   100,
                  delay:      cnt * G.tn.opt.Get('displayInterval') / 5,
                  // easing:     'easeInOutQuad',
                  easing:     'easeOutQuart',
                  step:       function (state, att) {
                    // window.ng_draf( function() {
                      att.$e.css(state);
                    // });
                  },
                  finish:     function (state, att) {
                    var _this=this;
                    // window.ng_draf( function() {
                      _this.dispose();
                    // });
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
            curTn.displayed = true;
            // item.$elt.css({ display: 'block', top: curTn.top , left: curTn.left, opacity:1 });
            item.$elt.css({ display: 'block', top: newTop, left: curTn.left, opacity: 1 });
            ThumbnailAppearFinish(item);
          }
        }
        else {
          // undisplay thumbnail if not in viewport+margin --> performance gain
          curTn.displayed = false;
          item.$elt.css({ display: 'none'});
        }
      }
      item.left = curTn.left;
      item.top = newTop;
      
      // set new size if changed
      if( item.width != curTn.width || item.height != curTn.height ) {
        item.$elt.css({ width: curTn.width , height: curTn.height });
        item.width = curTn.width;
        item.height = curTn.height;
        
        // if( curTn.resizedContentWidth > 0 ) {
        // resize also the content (=image)
        if( item.resizedContentWidth != curTn.resizedContentWidth || item.resizedContentHeight != curTn.resizedContentHeight ) {
          if( item.kind == 'albumUp' ) {
            // item.$getElt('.nGY2GThumbnailAlbumUp').css({'height': curTn.resizedContentHeight, 'width': curTn.resizedContentWidth});
          }
          else {
            item.$getElt('.nGY2GThumbnailImage').css({'height': curTn.resizedContentHeight, 'width': curTn.resizedContentWidth});

            if( G.layout.engine == 'JUSTIFIED'  ) {
              item.$getElt('.nGY2GThumbnailImg').css({'height': curTn.resizedContentHeight, 'width': curTn.resizedContentWidth});
            }
          }
          item.resizedContentWidth = curTn.resizedContentWidth;
          item.resizedContentHeight = curTn.resizedContentHeight;
        }
      }
      
      
      // add counter of remaining (not displayed) images 
      if( G.GOM.lastDisplayedIdxNew == GOMidx &&  G.layout.support.rows ) {
        if( (G.galleryDisplayMode.Get() == 'ROWS' && G.galleryMaxRows.Get() > 0) || (G.galleryDisplayMode.Get() == 'FULLCONTENT' && G.galleryLastRowFull.Get() && G.GOM.lastFullRow != -1) ){
          // number of items
          var nb = G.GOM.items.length - GOMidx - 1;
          if( item.albumID != '0' && G.O.thumbnailLevelUp ) {
            nb--;
          }

          if( nb > 0 ) {
            // display counter
            if( G.O.thumbnailOpenInLightox || G.O.thumbnailSliderDelay > 0  ) {
              item.$getElt('.nGY2GThumbnailIconsFullThumbnail').html( '+' + nb);
            }

            // if( G.layout.engine == 'GRID' && G.GOM.slider.hostItem != G.GOM.NGY2Item(GOMidx) ) {
            // image slider on last displayed thumbnail
            if( G.O.thumbnailLabel.get('position') != 'right' && G.O.thumbnailLabel.get('position') != 'left' ) {
              if( G.GOM.slider.hostItem != G.GOM.NGY2Item(GOMidx) ) {

                // set current slider back to initial content
                GalleryThumbnailSliderSetContent( G.GOM.slider.hostItem );
                // new slider
                G.GOM.slider.hostIdx = GOMidx;
                G.GOM.slider.hostItem = G.GOM.NGY2Item(GOMidx);
                G.GOM.slider.nextIdx = GOMidx;
                G.GOM.slider.currentIdx = GOMidx;
                GalleryThumbnailSliderBuildAndStart();  // image slider on last displayed thumbnail
                // GalleryThumbnailSliderSetNextContent();
              }
            }
          }
          else {
            // reset slider content to initial content because all thumbnails are displayed
            GalleryThumbnailSliderSetContent( G.GOM.slider.hostItem );
            G.GOM.slider.hostIdx = -1;
          }
          
          G.GOM.lastDisplayedIdx = GOMidx;
        }
      }

    }
    
    // ---------------------
    // replace image on last thumbnails with not displayed ones (mode ROWS or FULLCONTENT with galleryLastRowFull enabled)
    // function GalleryLastThumbnailSlideImage() {
    function GalleryThumbnailSliderBuildAndStart() {

      if( G.O.thumbnailSliderDelay == 0 || G.GOM.slider.hostIdx == -1 ) {
        return;
      }
      clearTimeout(G.GOM.slider.timerID);
      
      var item = G.GOM.slider.hostItem;

      // dupplicate image layer -> for the next image
      if( item.$getElt('.nGY2TnImgNext').length == 0 ) {
        item.$getElt('.nGY2TnImg').clone().removeClass('nGY2TnImg').addClass('nGY2TnImgNext').insertAfter(item.$getElt('.nGY2TnImg'));
        item.$getElt('.nGY2TnImgBack').clone().removeClass('nGY2TnImgBack').addClass('nGY2TnImgBackNext').insertAfter(item.$getElt('.nGY2TnImg', true));
        item.$getElt('.nGY2GThumbnailImage', true); // important -> refresh the cache
        item.$getElt('.nGY2GThumbnailImg', true);   // important -> refresh the cache
      }

      item.CSSTransformSet('.nGY2TnImgNext', 'translateX', '100%', true);
      item.CSSTransformApply( '.nGY2TnImgNext' );
      item.CSSTransformSet('.nGY2TnImgBackNext', 'translateX', '100%', true);
      item.CSSTransformApply( '.nGY2TnImgBackNext' );

      GalleryThumbnailSliderSetNextContent();
      
      // clearTimeout(G.GOM.slider.timerID);
      // G.GOM.slider.timerID = setTimeout(function(){ GalleryThumbnailSliderStartTransition() }, G.O.thumbnailSliderDelay);
      G.GOM.slider.timerID = requestTimeout(function(){ GalleryThumbnailSliderStartTransition() }, G.O.thumbnailSliderDelay);
    }

    
    function GalleryThumbnailSliderSetNextContent() {

      G.GOM.slider.nextIdx++;
      if( G.GOM.slider.nextIdx >= G.GOM.items.length ) {
        G.GOM.slider.nextIdx = G.GOM.slider.hostIdx;
      }
      
      // new image
      var newItem = G.GOM.NGY2Item(G.GOM.slider.nextIdx);
      // var imgBlurred = G.emptyGif;
      var bgImg = "url('" + G.emptyGif + "')";
      if( newItem.imageDominantColors != null ) {
        // imgBlurred = newItem.imageDominantColors;
        bgImg = "url('" + newItem.imageDominantColors + "')";
      }
      G.GOM.slider.hostItem.$getElt('.nGY2TnImgBackNext', true).css({'background-image': bgImg, opacity: 1 });
      G.GOM.slider.hostItem.$getElt('.nGY2TnImgNext', true).css({ 'background-image': "url('" + newItem.thumbImg().src + "')", opacity: 1 });
      G.GOM.slider.hostItem.$getElt('.nGY2TnImgNext .nGY2GThumbnailImg', true).attr('src', newItem.thumbImg().src );
      

    }
    
    // thumbnail slider - transition from one image to the next one
    function GalleryThumbnailSliderStartTransition() {
      
      if( G.GOM.slider.hostItem.$getElt() != null ) {

        // slider transition
        var tweenable = new NGTweenable();
        G.GOM.slider.tween = tweenable;
        tweenable.tween({
          from:         { 'left': 100 },
          to:           { 'left': 0 },
          duration:     800,
          delay:        0,
          // easing:       'easeInOutQuad',
          easing:       'easeOutQuart',
          
          step: function (state) {
            if( G.GOM.slider.hostItem.$getElt() == null ) {
              // the thumbnail may have been destroyed since the start of the animation
              G.GOM.slider.tween.stop(false);
              return;
            }

            // window.ng_draf( function() {
              // slide current content
              G.GOM.slider.hostItem.CSSTransformSet('.nGY2TnImgBack', 'translateX', -(100 - state.left) + '%');
              G.GOM.slider.hostItem.CSSTransformApply( '.nGY2TnImgBack' );
              G.GOM.slider.hostItem.CSSTransformSet('.nGY2TnImg', 'translateX', -(100 - state.left) + '%');
              G.GOM.slider.hostItem.CSSTransformApply( '.nGY2TnImg' );

              // slide new content
              G.GOM.slider.hostItem.CSSTransformSet('.nGY2TnImgBackNext', 'translateX', state.left + '%');
              G.GOM.slider.hostItem.CSSTransformApply( '.nGY2TnImgBackNext' );
              G.GOM.slider.hostItem.CSSTransformSet('.nGY2TnImgNext', 'translateX', state.left + '%');
              G.GOM.slider.hostItem.CSSTransformApply( '.nGY2TnImgNext' );
            // });

            
          },
          finish: function (state) {
            if( G.GOM.slider.hostItem.$getElt() == null ) {
              // the thumbnail may be destroyed since the start of the animation
              return;
            }
           
            if( G.GOM.NGY2Item(G.GOM.slider.nextIdx) == null ) { return; } // item does not exist anymore
            
            // window.ng_draf( function() {
              // set new content as current content
              GalleryThumbnailSliderSetContent( G.GOM.NGY2Item(G.GOM.slider.nextIdx) );
              G.GOM.slider.currentIdx = G.GOM.slider.nextIdx;
              GalleryThumbnailSliderSetNextContent();
              
              clearTimeout(G.GOM.slider.timerID);
              // G.GOM.slider.timerID=setTimeout(function(){ GalleryThumbnailSliderStartTransition() }, G.O.thumbnailSliderDelay);
              G.GOM.slider.timerID = requestTimeout(function(){ GalleryThumbnailSliderStartTransition() }, G.O.thumbnailSliderDelay);
            // });
          }
        });
      }
    }
    
    // set main content of the thumbnail hosting the slider
    // hide the elements for the next content of the slider
    function GalleryThumbnailSliderSetContent( ngy2itemContent ) {
        if( G.GOM.slider.hostIdx == -1 ) { return; }
        
        if( G.GOM.slider.tween != null ) {
          if( G.GOM.slider.tween._isTweening  == true ) {
            G.GOM.slider.tween.stop(false);
          }
        }

        var bgImg = "url('" + G.emptyGif + "')";
        if( ngy2itemContent.imageDominantColors != null ) {
          bgImg = "url('" + ngy2itemContent.imageDominantColors + "')";
        }
        G.GOM.slider.hostItem.$getElt('.nGY2TnImgBack').css('background-image', bgImg);
        G.GOM.slider.hostItem.$getElt('.nGY2TnImg').css('background-image', "url('" + ngy2itemContent.thumbImg().src + "')" );
        G.GOM.slider.hostItem.$getElt('.nGY2TnImg .nGY2GThumbnailImg').attr('src', ngy2itemContent.thumbImg().src );
        
        G.GOM.slider.hostItem.CSSTransformSet('.nGY2TnImgBack', 'translateX', '0');
        G.GOM.slider.hostItem.CSSTransformApply( '.nGY2TnImgBack' );
        G.GOM.slider.hostItem.CSSTransformSet('.nGY2TnImg', 'translateX', '0');
        G.GOM.slider.hostItem.CSSTransformApply( '.nGY2TnImg' );

        // place the containers for the next image slider outside of the thumbnail (=hidden)
        G.GOM.slider.hostItem.CSSTransformSet('.nGY2TnImgBackNext', 'translateX', '100%', true);
        G.GOM.slider.hostItem.CSSTransformApply( '.nGY2TnImgBackNext' );
        G.GOM.slider.hostItem.CSSTransformSet('.nGY2TnImgNext', 'translateX', '100%', true);
        G.GOM.slider.hostItem.CSSTransformApply( '.nGY2TnImgNext' );

        // set new title and description
        if( G.O.thumbnailLabel.get('display') == true ) {
          var icons = G.O.icons.thumbnailAlbum;
          if( ngy2itemContent.kind != 'album' ) {
            icons = G.O.icons.thumbnailImage;
          }
          G.GOM.slider.hostItem.$getElt('.nGY2GThumbnailTitle').html(icons + getThumbnailTitle(ngy2itemContent));
          G.GOM.slider.hostItem.$getElt('.nGY2GThumbnailDescription').html(icons + getTumbnailDescription(ngy2itemContent));
        }
      }
    
   
    
    // Compute the height of the label part of a thumbnail (title+description, both single line)
    function ThumbnailGetLabelHeight() {
      var newElt = [],
      newEltIdx =  0;

      // if( G.O.thumbnailLabel.get('display') == false && G.tn.toolbar.getWidth(item) <= 0 ) {
      if( G.O.thumbnailLabel.get('display') == false  ) {
        return 0;
      }
      
      // var desc='';
      // if( G.O.thumbnailLabel.get('displayDescription') == true ) {
        // desc = 'aAzZjJ';
      // }

      // visibility set to hidden
      newElt[newEltIdx++] = '<div class="nGY2GThumbnail ' + G.O.theme + '" style="display:block;visibility:hidden;position:absolute;top:-9999px;left:-9999px;" ><div class="nGY2GThumbnailSub">';
      if( G.O.thumbnailLabel.get('display') == true ) {
        // Labels: title and description
        newElt[newEltIdx++] = '  <div class="nGY2GThumbnailLabel" '+ G.tn.style.getLabel() +'>';
        newElt[newEltIdx++] = '    <div class="nGY2GThumbnailAlbumTitle" '+G.tn.style.getTitle()+'>aAzZjJ</div>';
        if( G.O.thumbnailLabel.get('displayDescription') == true ) {
          newElt[newEltIdx++] = '    <div class="nGY2GThumbnailDescription" '+G.tn.style.getDesc()+'>'+'aAzZjJ'+'</div>';
        }
        newElt[newEltIdx++] = '  </div>';
      }
      
      newElt[newEltIdx++] = '</div></div>';
    
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
    function ThumbnailBuildAlbumpUp( item, GOMidx ) {
    // function ThumbnailBuildAlbumpUp( item, idx, GOMidx ) {
      var newElt = [],
      newEltIdx = 0;
      
      var mp = '';
      if( G.O.thumbnailOpenInLightox === false ) {
        mp = 'cursor:default;'
      }
      
      newElt[newEltIdx++] = ThumbnailBuildStacks('') + '<div class="nGY2GThumbnail" style="display:none;opacity:0;' + mp + '" >';
      newElt[newEltIdx++] = '  <div class="nGY2GThumbnailSub">';

      var h=G.tn.defaultSize.getHeight(),
      w=G.tn.defaultSize.getWidth();

      newElt[newEltIdx++] = '    <div class="nGY2GThumbnailImage" style="width:'+w+'px;height:'+h+'px;"><img class="nGY2GThumbnailImg" src="'+G.emptyGif+'" alt="" style="max-width:'+w+'px;max-height:'+h+'px;" ></div>';
      // newElt[newEltIdx++] = '    <div class="nGY2GThumbnailAlbumUp" style="width:'+w+'px;height:'+h+'px;">'+G.O.icons.thumbnailAlbumUp+'</div>';
      newElt[newEltIdx++] = '    <div class="nGY2GThumbnailAlbumUp" >'+G.O.icons.thumbnailAlbumUp+'</div>';
      newElt[newEltIdx++] = '  </div>';
      newElt[newEltIdx++] = '</div>';
      
      var $newDiv = jQuery(newElt.join('')).appendTo(G.$E.conTn); //.animate({ opacity: 1},1000, 'swing');  //.show('slow'); //.fadeIn('slow').slideDown('slow');
      
      item.$elt = $newDiv;
      $newDiv.data('index', GOMidx);
      item.$getElt('.nGY2GThumbnailImg').data('index', GOMidx);
      
      return;
    }

    
    //----- Build one thumbnail
    function ThumbnailBuild( item, idx, GOMidx ) {
    // function ThumbnailBuild( item, idx, GOMidx, lastOne ) {
      item.eltTransform =  [];
      item.eltFilter =     [];
      item.hoverInitDone = false;
      item.$Elts =         [];

      if( item.kind == 'albumUp' ) {
        ThumbnailBuildAlbumpUp( item, GOMidx);
        return;
      }

      var newElt = [],
      newEltIdx = 0;

      var mp = '';
      if( G.O.thumbnailOpenInLightox === false ) {
        mp = 'cursor:default;'
      }

      // var src = encodeURI(item.thumbImg().src),
     
      var src = (item.thumbImg().src).replace(/'/g, "%27"),   // replace single quote with %27
      sTitle = getThumbnailTitle(item);

      // image background -> visible during image download
      var bg = '';
      var bgImg = "background-image: url('" + G.emptyGif + "');";
      if( item.imageDominantColors != null ) {
        // dominant colorS (blurred preview image)
        bgImg = "background-image: url('" + item.imageDominantColors + "');";
      }
      else {
        // dominant color -> background color
        if( item.imageDominantColor != null ) {
          bg = 'background-color:' + item.imageDominantColor + ';';
        }
        else {
          bgImg = '';
        }
      }

      var op = 'opacity:1;';
      if( G.O.thumbnailWaitImageLoaded == true ) {
        op = 'opacity:0;';
      }

      // ##### thumbnail containers  (with stacks)
      newElt[newEltIdx++] = ThumbnailBuildStacks(bg) + '<div class="nGY2GThumbnail nGY2GThumbnail_'+G.GOM.curNavLevel+'" style="display:none;opacity:0;' + mp + '"><div class="nGY2GThumbnailSub ' + ( G.O.thumbnailSelectable && item.selected ? "nGY2GThumbnailSubSelected" : "" ) + '">';

      
      // image size
      var w = G.tn.settings.getW();
      var h = G.tn.settings.getH();
      if( G.tn.settings.getMosaic() !== null ) {
        // mosaic layout -> 
        w = G.GOM.items[GOMidx].width;
        h = G.GOM.items[GOMidx].height;
      }

      var bgSize = 'contain';
      if( G.tn.opt.Get('crop') ) {
        bgSize = 'cover';             // thumbnail image will be cropped to fit in the thumbnail (no black border)
      }
      
      // ##### layer for image background (color, dominant color, blurred preview)
      var s1 = "position: absolute; top: 0px; left: 0px; width:" + w + "px; height:" + h + "px;"+ bg + bgImg + " background-position: center center;  background-repeat: no-repeat; background-size:" + bgSize + "; overflow: hidden;";
      newElt[newEltIdx++]='<div class="nGY2GThumbnailImage nGY2TnImgBack" style="' + s1 + '"></div>';
      
      // #### layer for image 
      // for url in CSS: single backslashes are replaced by double backslashes
      var s2 = op + "position: absolute; top: 0px; left: 0px; width:" + w + "px; height:" + h + "px; background-image: url('" + src.replace(/\\/g, '\\\\') + "'); background-position: center center; background-repeat: no-repeat; background-size:" + bgSize + "; overflow: hidden;";
      newElt[newEltIdx++]='<div class="nGY2GThumbnailImage nGY2TnImg" style="' + s2 + '">';
      newElt[newEltIdx++]='  <img class="nGY2GThumbnailImg nGY2TnImg2" src="' + src + '" alt="' + sTitle + '" style="opacity:0;" data-idx="' + idx + '" data-albumidx="' + G.GOM.albumIdx + '" >';
      newElt[newEltIdx++]='</div>';
      
      // ##### layer for user customization purposes
      newElt[newEltIdx++]='<div class="nGY2GThumbnailCustomLayer"></div>';

      // ##### layer for labels (title + description and their icons)
      if( G.O.thumbnailLabel.get('display') == true ) {
        // Labels: title and description
        newElt[newEltIdx++]= '  <div class="nGY2GThumbnailLabel" '+ G.tn.style.getLabel(item) + '>';
        if( item.kind == 'album' ) {
          // album kind
          newElt[newEltIdx++]= '    <div class="nGY2GThumbnailTitle nGY2GThumbnailAlbumTitle" ' + G.tn.style.getTitle() + '>' + G.O.icons.thumbnailAlbum + sTitle + '</div>';
        }
        else {
          // image/media kind
          newElt[newEltIdx++]= '    <div class="nGY2GThumbnailTitle nGY2GThumbnailImageTitle" ' + G.tn.style.getTitle() + '>' + G.O.icons.thumbnailImage + sTitle + '</div>';
        }
        newElt[newEltIdx++]= '    <div class="nGY2GThumbnailDescription" ' + G.tn.style.getDesc() + '>' + getTumbnailDescription(item) + '</div>';
        newElt[newEltIdx++]= '  </div>';
      }

      // ##### layer for tools
      // newElt[newEltIdx++] = ThumbnailBuildTools(item, lastOne);
      newElt[newEltIdx++] = ThumbnailBuildTools(item);
      
      // close containers
      newElt[newEltIdx++]='</div></div>';
      
      var $newDiv =jQuery(newElt.join('')).appendTo(G.$E.conTn);

      item.$elt=$newDiv;
      $newDiv.data('index',GOMidx);
      item.$getElt('.nGY2GThumbnailImg').data('index',GOMidx);
      
      // Custom init function
      var fu=G.O.fnThumbnailInit;
      if( fu !== null ) {
        typeof fu == 'function' ? fu($newDiv, item, GOMidx) : window[fu]($newDiv, item, GOMidx);
      }

      if( item.title != 'image gallery by nanogallery2 [build]' ) {
        ThumbnailOverInit(GOMidx);
      }
      
      return ;
    }

    
    // Thumbnail layer for tools (toolbars and counter)
    function ThumbnailBuildTools( item ) {
    
      // toolbars
      var tb = ThumbnailBuildToolbarOne(item, 'topLeft') + ThumbnailBuildToolbarOne(item, 'topRight') + ThumbnailBuildToolbarOne(item, 'bottomLeft') + ThumbnailBuildToolbarOne(item, 'bottomRight');
      
      // counter of not displayed images
      tb += '<div class="nGY2GThumbnailIconsFullThumbnail"></div>';

      return tb;
    }
    
    function ThumbnailBuildToolbarOne( item, position ) {
      var toolbar = '';
      var tb =      G.tn.toolbar.get(item);
      var width =   { xs:0, sm:1, me:2, la:3, xl:4 };
      var cnt =     0;
      
      if( tb[position] != '' ) {
        var pos='top: 0; right: 0; text-align: right;';     // 'topRight' and default
        switch( position ) {
          case 'topLeft':
            pos = 'top: 0; left: 0; text-align: left;';
            break;
          case 'bottomRight':
            pos = 'bottom: 0; right: 0; text-align: right;';
            break;
          case 'bottomLeft':
            pos = 'bottom: 0; left: 0; text-align: left;';
            break;
        }
        
        toolbar += '  <ul class="nGY2GThumbnailIcons" style="' + pos + '">';
        
        var icons = tb[position].split(',');
        var nb = icons.length;
        for( var i = 0; i < nb; i++ ) {
          var icon = icons[i].replace(/^\s*|\s*$/, '');   //trim trailing/leading whitespace

          var minWidth = icon.substring(0,2).toLowerCase();
          var tIcon = icon;
          var display = true;
          if( /xs|sm|me|la|xl/i.test(minWidth) ) {
            // check visbility (depending on screen width)
            if( width[minWidth] > width[G.GOM.curWidth] ) {
              display = false;
            }
            tIcon = icon.substring(2);
          }
          
          if( display ) {
            var sp=(i+1<nb ? '&nbsp;' :'');
            switch( tIcon ) {
              case 'COUNTER':
                if( item.kind == 'album' ) {
                  toolbar += '    <li class="nGY2GThumbnailIcon" data-ngy2action="">';
                  toolbar += '      <div class="nGY2GThumbnailIconImageCounter"></div>';
                  toolbar += '      <div class="nGY2GThumbnailIconText">' + G.O.icons.thumbnailCounter+Math.max((item.getContentLength(false)),item.numberItems) + sp + '</div>';
                  toolbar += '    </li>';
                  cnt++;
                }
                break;
              case 'COUNTER2':
                if( item.kind == 'album' ) {
                  toolbar += '    <li class="nGY2GThumbnailIcon" data-ngy2action="">';
                  toolbar += '      <div class="nGY2GThumbnailIconTextBadge">' + G.O.icons.thumbnailCounter+Math.max((item.getContentLength(false)),item.numberItems) + sp + '</div>';
                  toolbar += '    </li>';
                  cnt++;
                }
                break;
              case 'SHARE':
                toolbar += '    <li class="nGY2GThumbnailIcon" data-ngy2action="' + tIcon + '">';
                toolbar += '      <div>' + G.O.icons.thumbnailShare + '</div>';
                toolbar += '    </li>';
                cnt++;
                break;
              case 'DOWNLOAD':
                toolbar += '    <li class="nGY2GThumbnailIcon" data-ngy2action="' + tIcon + '">';
                toolbar += '      <div>' + G.O.icons.thumbnailDownload + '</div>';
                toolbar += '    </li>';
                cnt++;
                break;
              case 'INFO':
                toolbar += '    <li class="nGY2GThumbnailIcon" data-ngy2action="' + tIcon + '">';
                toolbar += '      <div>' + G.O.icons.thumbnailInfo + '</div>';
                toolbar += '    </li>';
                cnt++;
                break;
              case 'SHOPPINGCART':
                toolbar += '    <li class="nGY2GThumbnailIcon" data-ngy2action="' + tIcon + '">';
                // toolbar += '      <div>' + G.O.icons.thumbnailShoppingcart + '</div>';
                toolbar += ThumbnailBuildToolbarOneCart( item );
                
                toolbar += '    </li>';
                cnt++;
                break;
              case 'DISPLAY':
                toolbar += '    <li class="nGY2GThumbnailIcon" data-ngy2action="DISPLAY">';
                toolbar += '      <div class="nGY2GThumbnailIconImageShare">' + G.O.icons.thumbnailDisplay + '</div>';
                toolbar += '    </li>';
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
                toolbar += '    <li class="nGY2GThumbnailIcon" data-ngy2action="' + tIcon.toLowerCase() + '">';
                toolbar += '      <div class="nGY2GThumbnailIconImageShare">' + G.O.icons['thumbnailCustomTool' + cust] + '</div>';
                toolbar += '    </li>';
                cnt++;
                break;
              case 'FEATURED':
                if( item.featured === true ) {
                  toolbar += '    <li class="nGY2GThumbnailIcon" data-ngy2action="">';
                  toolbar += '      <div class="nGY2GThumbnailIconImageFeatured">' + G.O.icons.thumbnailFeatured + '</div>';
                  toolbar += '    </li>';
                  cnt++;
                }
                break;
              case 'SELECT':
                if( G.O.thumbnailSelectable == true ) {
                  toolbar += '    <li class="nGY2GThumbnailIcon" data-ngy2action="TOGGLESELECT">';
                  if( item.selected === true ) {
                    toolbar += '      <div class="nGY2GThumbnailIconImageSelect nGY2ThumbnailSelected">' + G.O.icons.thumbnailSelected + '</div>';
                  }
                  else {
                    toolbar += '      <div class="nGY2GThumbnailIconImageSelect nGY2ThumbnailUnselected">' + G.O.icons.thumbnailUnselected + '</div>';
                  }
                  toolbar += '    </li>';
                  cnt++;
                }
                break;
            }
          }
        }
        toolbar += '  </ul>';
      }
      
      if( cnt > 0 ) {
        return toolbar;
      }
      else {
        return '';
      }
    }
    
    // CART ICON AND COUNTER
    function ThumbnailBuildToolbarOneCart( item ) {
      var q = 0;
      
      var id = item.GetID()
      for( var i=0; i<G.shoppingCart.length; i++ ) {
        if( G.I[G.shoppingCart[i].idx].GetID() == id ) {
          q = G.shoppingCart[i].qty;
        }
      }
      if( q == 0 ) {
        q = '';
      }

      return '      <div>' + G.O.icons.thumbnailShoppingcart + q + '</div>';
    }
    function ThumbnailBuildToolbarOneCartUpdate( item ) {
      var $e = item.$elt;

      if( $e != null ) {
        var $q = $e.find('*[data-ngy2action="SHOPPINGCART"]');
        if( $q !== undefined ) {
          $q.html( ThumbnailBuildToolbarOneCart( item ) );
        }
      }
    }
    
    function getThumbnailTitle( item ) {
    
      var sTitle = item.title;
      if( G.O.thumbnailLabel.get('display') == true ) {
        if( sTitle === undefined || sTitle.length == 0 ) { sTitle = '&nbsp;'; }

        if( G.i18nTranslations.thumbnailImageTitle != '' ) {
          sTitle = G.i18nTranslations.thumbnailImageTitle;
        }
        var ml = G.O.thumbnailLabel.get('titleMaxLength');
        if( ml > 3 && sTitle.length > ml ){
          sTitle = sTitle.substring(0, ml) + '...';
        }
      }
      
      return sTitle;
    }

    function getTumbnailDescription( item ) {
      var sDesc = '';
      if( G.O.thumbnailLabel.get('displayDescription') == true ) { 
        if( item.kind == 'album' ) {
          if( G.i18nTranslations.thumbnailImageDescription != '' ) {
            sDesc = G.i18nTranslations.thumbnailAlbumDescription;
          }
          else {
            sDesc = item.description;
          }
        }
        else {
          if( G.i18nTranslations.thumbnailImageDescription != '' ) {
            sDesc = G.i18nTranslations.thumbnailImageDescription;
          }
          else {
            sDesc = item.description;
          }
        }
        var ml = G.O.thumbnailLabel.get('descriptionMaxLength');
        if( ml > 3 && sDesc.length > ml ){
          sDesc = sDesc.substring(0, ml) + '...';
        }
        if( sDesc.length == 0 ) {
          sDesc = '&nbsp;';
        }
      }
      
      return sDesc;
    }

    
    
    // Retrieve the maximum number of thumbnails that fits in one row
    function NbThumbnailsPerRow( areaWidth ) {
      var tnW = G.tn.defaultSize.getOuterWidth();
      
      var nbMaxTn = 0;
      if( G.O.thumbnailAlignment == 'justified' ) {
        nbMaxTn = Math.floor((areaWidth)/(tnW));
      }
      else {
        nbMaxTn = Math.floor((areaWidth + G.tn.settings.GetResponsive('gutterWidth'))/(tnW + G.tn.settings.GetResponsive('gutterWidth')));
      }
      
      if(  G.O.maxItemsPerLine >0 && nbMaxTn >  G.O.maxItemsPerLine ) {
        nbMaxTn = G.O.maxItemsPerLine;
      }
      
      if( nbMaxTn < 1 ) { nbMaxTn = 1; }
      
      return nbMaxTn
    }
  
    // Thumbnail display animation
    function ThumbnailAppear( n, cnt ) {
      var curTn = G.GOM.items[n];
      var item = G.I[curTn.thumbnailIdx];

    
      if( G.tn.opt.Get('displayTransition') == 'NONE' ) {
        item.$elt.css({ opacity: 1 });
        ThumbnailAppearFinish( item );
      }
      else {
        if( item.$elt == null ) { return; }
        var top = G.GOM.cache.containerOffset.top + ( curTn.top - G.GOM.clipArea.top );
        var vp = G.GOM.cache.viewport;
        if( (top + (curTn.top - G.GOM.clipArea.top)) >= (vp.t - 50) && top <= (vp.t + vp.h + 50) ) {
          // display animation only if in the current viewport
          var delay = cnt * G.tn.opt.Get('displayInterval');
          if( G.tn.opt.Get('displayTransition') == 'CUSTOM' ) {
            if( G.GOM.curNavLevel == 'lN' ) {
              G.O.fnThumbnailDisplayEffect(item.$elt, item, n, delay);
            }
            else {
              G.O.fnThumbnailL1DisplayEffect(item.$elt, item, n, delay);
            }
          }
          else {
            G.GOM.thumbnails2Display.push({itm: item, d: delay});
            // ThumbnailDisplayAnim2(item, delay);
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
      var ns = G.tn.opt.Get('stacks');
      if( ns > 0 ) {
        // display stacks
        item.$elt.css({ display: 'block'});
        var o = 0.9;
        // set stack opacity
        for( var i = ns-1; i>=0; i-- ) {
          item.$elt.eq(i).css('opacity', o);
          o = o - 0.2;
        }

      }
    }
    

    function ThumbnailDisplayAnim2( item, delay ) {
      function randomIntFromInterval(min,max) {
        return Math.floor(Math.random()*(max-min+1)+min);
      }
      var oFrom = {};
      var oTo = {};
    
      switch (G.tn.opt.Get('displayTransition')) {
        case 'RANDOMSCALE': {
            var scales = [0.95, 1, 1.05, 1.1];
            var zi = [1, 2, 3, 4];
            
            var r = randomIntFromInterval(0,3);
            while( r == G.GOM.lastRandomValue ) {
              r = randomIntFromInterval(0,3);
            }
            G.GOM.lastRandomValue = r;
            let f = scales[r];
            // item.$elt.css({ 'z-index': G.GOM.lastZIndex+zi[r], 'box-shadow': '-1px 2px 5px 1px rgba(0, 0, 0, 0.7)' });
            item.$elt.css({ 'z-index': G.GOM.lastZIndex+zi[r], 'box-shadow': '0px 0px 5px 3px rgba(0,0,0,0.74)' });
            
            oFrom = { scale: 0.5, opacity:0 };
            oTo =   { scale: f,   opacity:1 };
            break;
          }

        case 'SCALEUP': {
            let f = G.tn.opt.Get('displayTransitionStartVal');
            if( f == 0 ) { f = 0.6; }   // default value
            oFrom = { scale: f, opacity: 0 };
            oTo =   { scale: 1, opacity: 1 };
            break;
          }

        case 'SCALEDOWN': {
            let f = G.tn.opt.Get('displayTransitionStartVal');
            if( f == 0 ) { f=1.3; }   // default value
            oFrom = { scale: f, opacity: 0 };
            oTo =   { scale: 1, opacity: 1 };
            break;
          }
        case 'SLIDEUP': {
            let f = G.tn.opt.Get('displayTransitionStartVal');
            if( f == 0 ) { f=50; }   // default value
            oFrom = { opacity: 0, translateY: f };
            oTo =   { opacity: 1, translateY: 0 };
            break;
          }
        case 'SLIDEDOWN': {
            let f=G.tn.opt.Get('displayTransitionStartVal');
            if( f == 0 ) { f=-50; }   // default value
            oFrom = { opacity: 0, translateY: f };
            oTo =   { opacity: 1, translateY: 0 };
            break;
          }
        case 'FLIPUP': {
            let f=G.tn.opt.Get('displayTransitionStartVal');
            if( f == 0 ) { f=100; }   // default value
            oFrom = { opacity: 0, translateY: f, rotateX: 45 };
            oTo =   { opacity: 1, translateY: 0, rotateX: 0  };
            break;
          }
        case 'FLIPDOWN': {
            let f=G.tn.opt.Get('displayTransitionStartVal');
            if( f == 0 ) { f=-100; }   // default value
            oFrom = { opacity: 0, translateY: f, rotateX: -45 };
            oTo =   { opacity: 1, translateY: 0, rotateX: 0 };
            break;
          }
        case 'SLIDEUP2': {
            let f = G.tn.opt.Get('displayTransitionStartVal');
            if( f == 0 ) { f=100; }   // default value
            oFrom = { opacity: 0, translateY: f, rotateY: 40 };
            oTo =   { opacity: 1, translateY: 0, rotateY: 0  };
            break;
          }
        case 'IMAGESLIDEUP': {
            // let f = G.tn.opt.Get('displayTransitionStartVal');
            // if( f == 0 ) { f=100; }   // default value
            oFrom = { opacity: 0, top: '100%' };
            oTo =   { opacity: 1, top: '0%'  };
            break;
          }
        case 'SLIDEDOWN2': {
            let f=G.tn.opt.Get('displayTransitionStartVal');
            if( f == 0 ) { f=-100; }   // default value
            oFrom = { opacity: 0, translateY: f, rotateY: 40 };
            oTo =   { opacity: 1, translateY: 0, rotateY: 0  };
            break;
          }
        case 'SLIDERIGHT': {
            let f=G.tn.opt.Get('displayTransitionStartVal');
            if( f == 0 ) { f=-150; }   // default value
            oFrom = { opacity: 0, translateX: f };
            oTo =   { opacity: 1, translateX: 0 };
            break;
          }
        case 'SLIDELEFT': {
            let f=G.tn.opt.Get('displayTransitionStartVal');
            if( f == 0 ) { f=150; }   // default value
            oFrom = { opacity: 0, translateX: f };
            oTo =   { opacity: 1, translateX: 0 };
            break;
          }
        case 'FADEIN':
          oFrom = { opacity: 0 };
          oTo =   { opacity: 1 };
          break;
          
          
      }
    
      var tweenable = new NGTweenable();
      tweenable.tween({
        from:         oFrom,
        to:           oTo,
        attachment:   { $e:item.$elt, item: item, tw: tweenable },
        delay:        delay,
        duration:     G.tn.opt.Get('displayTransitionDuration'),
        easing:       G.tn.opt.Get('displayTransitionEasing'),
        step:         function (state, att) {
          window.requestAnimationFrame( function() {
            if( att.item.$elt === null ) {  // the thumbnail may have been destroyed since the start of the animation
              att.tw.stop(false);
              return;
            }
            switch (G.tn.opt.Get('displayTransition')) {
              case 'RANDOMSCALE':
                att.$e.css( G.CSStransformName , 'scale(' + state.scale + ')').css('opacity', state.opacity);
                break;
              case 'SCALEUP':
                att.$e.css( G.CSStransformName , 'scale('+state.scale+')').css('opacity',state.opacity);
                break;
              case 'SCALEDOWN':
                att.item.$elt.last().css('opacity', state.opacity);
                att.item.CSSTransformSet('.nGY2GThumbnail', 'scale', state.scale);
                att.item.CSSTransformApply('.nGY2GThumbnail');
                break;
              case 'SLIDEUP':
                att.item.$elt.css('opacity', state.opacity);
                att.item.CSSTransformSet('.nGY2GThumbnail', 'translate', '0px, '+state.translateY + 'px');
                att.item.CSSTransformApply('.nGY2GThumbnail');
                break;
              case 'SLIDEDOWN':
                att.item.$elt.css('opacity', state.opacity);
                att.item.CSSTransformSet('.nGY2GThumbnail', 'translate', '0px,'+state.translateY+'px');
                att.item.CSSTransformApply('.nGY2GThumbnail');
                break;
              case 'FLIPUP':
                att.item.CSSTransformSet('.nGY2GThumbnail', 'translate', '0px,'+state.translateY+'px');
                att.item.CSSTransformSet('.nGY2GThumbnail', 'rotateX', state.rotateX+'deg');
                att.item.$elt.css('opacity', state.opacity);
                att.item.CSSTransformApply('.nGY2GThumbnail');
                break;
              case 'FLIPDOWN':
                att.item.$elt.css('opacity', state.opacity);
                att.item.CSSTransformSet('.nGY2GThumbnail', 'translate', '0px,' + state.translateY + 'px');
                att.item.CSSTransformSet('.nGY2GThumbnail', 'rotateX', state.rotateX + 'deg');
                att.item.CSSTransformApply('.nGY2GThumbnail');
                break;
              case 'SLIDEUP2':
                att.item.$elt.css('opacity', state.opacity);
                att.item.CSSTransformSet('.nGY2GThumbnail', 'translate', '0px,' + state.translateY + 'px');
                att.item.CSSTransformSet('.nGY2GThumbnail', 'rotateY', state.rotateY + 'deg');
                att.item.CSSTransformApply('.nGY2GThumbnail');
                break;
              case 'IMAGESLIDEUP':
                att.item.$elt.css('opacity', state.opacity);
								att.item.$Elts['.nGY2GThumbnailImage'].css('top', state.top);
                break;
              case 'SLIDEDOWN2':
                att.item.$elt.css('opacity', state.opacity);
                att.item.CSSTransformSet('.nGY2GThumbnail', 'translate', '0px, ' + state.translateY + 'px');
                att.item.CSSTransformSet('.nGY2GThumbnail', 'rotateY', state.rotateY + 'deg');
                att.item.CSSTransformApply('.nGY2GThumbnail');
                break;
              case 'SLIDERIGHT':
                att.item.$elt.css('opacity', state.opacity);
                att.item.CSSTransformSet('.nGY2GThumbnail', 'translate', state.translateX + 'px, 0px');
                att.item.CSSTransformApply('.nGY2GThumbnail');
                break;
              case 'SLIDELEFT':
                att.item.CSSTransformSet('.nGY2GThumbnail', 'translate', state.translateX + 'px, 0px');
                att.item.$elt.css('opacity', state.opacity);
                att.item.CSSTransformApply('.nGY2GThumbnail');
                break;
              case 'FADEIN':
                att.$e.css(state);
                break;
            }
          });
          // att.$e.css( G.CSStransformName , 'scale('+state.scale+')').css('opacity',state.opacity);
        },
        finish:       function (state, att) {
          window.requestAnimationFrame( function() {
            if( att.item.$elt === null ) { return; }
            
            switch (G.tn.opt.Get('displayTransition')) {
              case 'RANDOMSCALE':
                att.$e.css( G.CSStransformName , 'scale('+state.scale+')').css('opacity', '');
                break;
              case 'SCALEUP':
                att.$e.css( G.CSStransformName , '').css('opacity', '');
                break;
              case 'SCALEDOWN':
                att.item.$elt.last().css('opacity', '');
                att.item.CSSTransformSet('.nGY2GThumbnail', 'scale', state.scale);
                att.item.CSSTransformApply('.nGY2GThumbnail');
                break;
              case 'IMAGESLIDEUP':
                att.item.$elt.css('opacity', '');
								att.item.$Elts['.nGY2GThumbnailImage'].css('top', 0);
                break;
              case 'SLIDEDOWN2':
                att.item.$elt.css('opacity', '');
                att.item.CSSTransformApply('.nGY2GThumbnail');
                break;
							default :
								// case 'SLIDEUP':
								// case 'SLIDEDOWN':
								// case 'FLIPUP':
								// case 'FLIPDOWN':
								// case 'SLIDEUP2':
								// case 'SLIDERIGHT':
								// case 'SLIDELEFT':
								// case 'FADEIN':
                att.item.$elt.css('opacity', '');
            }
            ThumbnailAppearFinish(att.item);
          });

        }
      });
    
    }
    
    // batch display thumbnails with animation
    function ThumbnailDisplayAnimBatch() {
      
      G.GOM.thumbnails2Display.forEach( function(one) {
        ThumbnailDisplayAnim2(one.itm, one.d);
      });
      G.GOM.thumbnails2Display=[];
    }
    
    

    // ######################################
    // Gallery display animation
    function GalleryAppear() {
      
      var d=G.galleryDisplayTransitionDuration.Get();
      switch( G.galleryDisplayTransition.Get() ){
        case 'ROTATEX':
          G.$E.base.css({ perspective: '1000px', 'perspective-origin': '50% 0%' });
          new NGTweenable().tween({
            from:         { r: 50 },
            to:           { r: 0  },
            attachment:   { orgIdx: G.GOM.albumIdx },
            duration:     d,
            easing:       'easeOutCirc',
            step:         function (state, att) {
              if( att.orgIdx == G.GOM.albumIdx ) {
                // window.ng_draf( function() {
                  G.$E.conTnParent.css( G.CSStransformName , 'rotateX(' + state.r + 'deg)');
                // });
              }
            }
          });
          break;
        case 'SLIDEUP':
          G.$E.conTnParent.css({ opacity: 0 });
          new NGTweenable().tween({
            from:         { y: 200, o: 0 },
            to:           { y: 0,   o: 1 },
            attachment:   { orgIdx: G.GOM.albumIdx },
            duration:     d,
            easing:       'easeOutCirc',
            step:         function (state, att) {
              if( att.orgIdx == G.GOM.albumIdx ) {
                // window.ng_draf( function() {
                  G.$E.conTnParent.css( G.CSStransformName , 'translate( 0px, '+state.y + 'px)').css('opacity', state.o);
                // });
              }
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
      
      
      var curTn = G.GOM.items[GOMidx];
      var item = G.I[curTn.thumbnailIdx];

      if( item.$elt == null ) { return; } // zombie
      
      var fu = G.O.fnThumbnailHoverInit;
      if( fu !== null ) {
        typeof fu == 'function' ? fu($e, item, GOMidx) : window[fu]($e, item, GOMidx);
      }

      // build initialization
      var inits = G.tn.buildInit.get();
      for( var j = 0; j < inits.length; j++) {
        switch( inits[j].property ) {
          // CSS Transform
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
          // CSS filter
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
      var effects = G.tn.hoverEffects.get();
      for( var j = 0; j < effects.length; j++) {
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
              var $t = item.$getElt(effects[j].element);
              $t.css( effects[j].type, effects[j].from );
              break;
              
          }
        }
      }
      item.hoverInitDone=true;
    }

    function ThumbnailHoverReInitAll() {
      if( G.GOM.albumIdx == -1 ) { return; };
      var l = G.GOM.items.length;
      for( var i = 0; i < l ; i++ ) {
        ThumbnailOverInit(i);
        // G.GOM.items[i].hovered=false;
        G.I[G.GOM.items[i].thumbnailIdx].hovered = false;
      }
    }


    function ThumbnailHover( GOMidx ) {
      if( G.GOM.albumIdx == -1 || !G.galleryResizeEventEnabled ) { return; };
      if( G.GOM.slider.hostIdx == GOMidx ) {
        // slider hosted on thumbnail -> no hover effect
        return;
      }
      var curTn = G.GOM.items[GOMidx];
      var item = G.I[curTn.thumbnailIdx];
      if( item.kind == 'albumUp' || item.$elt == null ) { return; }

      item.hovered = true;

      var fu = G.O.fnThumbnailHover;
      if( fu !== null ) {
        typeof fu == 'function' ? fu(item.$elt, item, GOMidx) : window[fu](item.$elt, item, GOMidx);
      }
      var effects = G.tn.hoverEffects.get();

      try {
        for( var j = 0; j < effects.length; j++) {
          if( effects[j].hoverin === true ) {
            //item.animate( effects[j], j*10,  true );
            item.animate( effects[j], 0,  true );
          }
        }
        // effects on whole layout
        // GalleryResize( GOMidx );
      }
      catch (e) { 
        NanoAlert(G, 'error on hover: ' + e.message );
      }

    }

    function ThumbnailHoverOutAll() {
      if( G.GOM.albumIdx == -1 ) { return; };
      var l = G.GOM.items.length;
      for( var i = 0; i < l ; i++ ) {
        if( G.GOM.items[i].inDisplayArea ) {
          ThumbnailHoverOut(i);
        }
        else {
          G.I[G.GOM.items[i].thumbnailIdx].hovered = false;
        }
      }
    }

    
    function ThumbnailHoverOut( GOMidx ) {
      if( G.GOM.albumIdx == -1 || !G.galleryResizeEventEnabled ) { return; }

      if( G.GOM.slider.hostIdx == GOMidx ) {
        // slider on thumbnail -> no hover effect
        return;
      }

      var curTn = G.GOM.items[GOMidx];
      var item = G.I[curTn.thumbnailIdx];
      if( item.kind == 'albumUp' || !item.hovered ) { return; }
      item.hovered = false;
      if( item.$elt == null ) { return; }

      var fu = G.O.fnThumbnailHoverOut;
      if( fu !== null ) {
        typeof fu == 'function' ? fu(item.$elt, item, GOMidx) : window[fu](item.$elt, item, GOMidx);
      }

      var effects = G.tn.hoverEffects.get();
      try {
        for( var j = 0; j < effects.length; j++) {
          if( effects[j].hoverout === true ) {
            // item.animate( effects[j], j*10, false );
            item.animate( effects[j], 0, false );
          }
        }
        // effects on whole layout
        // GalleryResize( );
      }
      catch (e) { 
        NanoAlert(G, 'error on hoverOut: ' + e.message );
      }
      
    }
    

    /** @function DisplayPhoto */
    function DisplayPhoto( imageID, albumID ) {

      if( G.O.debugMode ) { console.log('#DisplayPhoto : '+  albumID +'-'+ imageID); }
      var albumIdx = NGY2Item.GetIdx(G, albumID);
      if( albumIdx == 0 ) {
        G.GOM.curNavLevel = 'l1';
      }
      else {
        G.GOM.curNavLevel = 'lN';
      }

      if( albumIdx == -1 ) {
        // get content of album on root level
        if( G.O.kind != '' ) {
          // do not add album if Markup or Javascript data
          NGY2Item.New( G, '', '', albumID, '0', 'album' );    // create empty album
          // albumIdx = G.I.length - 1;
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
   
    // function AlbumGetContent( albumIdx, fnToCall ) {
    function AlbumGetContent( albumID, fnToCall, fnParam1, fnParam2 ) {
      // var url='';
      // var kind='image';
      // var albumIdx=NGY2Item.GetIdx(G, albumID);
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
    
    var mediaList = {
      youtube : {
        getID: function( url ) {
          // https://stackoverflow.com/questions/10591547/how-to-get-youtube-video-id-from-url
          var s = url.match( /(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/ );
          return s != null ? s[1] : null;
        },
        thumbUrl: function( id ) {
          return 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg';
        },
        url: function( id ) {
          return 'https://www.youtube.com/embed/' + id;
        },
        markup: function( id ) {
          // return '<iframe class="nGY2ViewerMedia" src="https://www.youtube.com/embed/' + id + '?rel=0" frameborder="0" gesture="media" allowfullscreen></iframe>';
          return '<iframe class="nGY2ViewerMedia" src="https://www.youtube.com/embed/' + id + '?rel=0" frameborder="0" allow="autoplay" allowfullscreen></iframe>';
        },
        kind: 'iframe'
      },
      vimeo : {
        getID: function( url ) {
          // https://stackoverflow.com/questions/2916544/parsing-a-vimeo-id-using-javascript
          // var s = url.match( /^.*(vimeo\.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/ );
          var s = url.match( /(http|https)?:\/\/(www\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|)(\d+)(?:|\/\?)/ );
          return s != null ? s[4] : null;
        },
        url: function( id ) {
          return 'https://player.vimeo.com/video/' + id;
        },
        markup: function( id ) {
          // return '<iframe class="nGY2ViewerMedia" src="https://player.vimeo.com/video/' + id + '?rel=0" frameborder="0" gesture="media" allowfullscreen></iframe>';
          // return '<iframe class="nGY2ViewerMedia" src="https://player.vimeo.com/video/' + id + '?rel=0" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>';
          return '<iframe class="nGY2ViewerMedia" src="https://player.vimeo.com/video/' + id + '" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>';
        },
        kind: 'iframe'
      },
      dailymotion : {
        getID: function( url ) {
          // https://stackoverflow.com/questions/12387389/how-to-parse-dailymotion-video-url-in-javascript
          var m = url.match(/^.+dailymotion.com\/(video|hub)\/([^_]+)[^#]*(#video=([^_&]+))?/);
          if (m !== null) {
              if(m[4] !== undefined) {
                  return m[4];
              }
              return m[2];
          }
          return null;
        },
        thumbUrl: function( id ) {
          return 'https://www.dailymotion.com/thumbnail/video/' + id;
        },
        url: function( id ) {
          return 'https://www.dailymotion.com/embed/video/' + id;
        },
        markup: function( id ) {
          // return '<iframe class="nGY2ViewerMedia" src="https://www.dailymotion.com/embed/video/' + id + '?rel=0" frameborder="0" gesture="media" allowfullscreen></iframe>';
          return '<iframe class="nGY2ViewerMedia" src="https://www.dailymotion.com/embed/video/' + id + '?rel=0" frameborder="0" allow="autoplay" allowfullscreen></iframe>';
        },
        kind: 'iframe'
      },
      selfhosted : {
				// SELF-HOSTED VIDEOS
        getID: function( url ) {
          // In order to leave things as is, I used ID to identify the extension
          // https://stackoverflow.com/questions/6997262/how-to-pull-url-file-extension-out-of-url-string-using-javascript
          // Make sure the method used for verifying the extension matches the kind of url your selfhosted video has
          var extension = url.split('.').pop().toLowerCase();

          // supported extensions
          var s = ( extension === 'mp4' || extension === 'webm' || extension === 'ogv' || extension === '3gp' ) ? extension : null ;
          return s;
        },
        markup: function( url ) {
          // return '<video controls class="nGY2ViewerMedia"><source src="${id.src}" type="video/${id.type}" preload="auto">Your browser does not support the video tag (HTML 5).</video>';
          var extension = url.split('.').pop();
          return '<video controls class="nGY2ViewerMedia"><source src="'+ url +'" type="video/'+ extension +'" preload="auto">Your browser does not support the video tag (HTML 5).</video>';
        },
        kind: 'video',
        selfhosted : true
      }
    };
        
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
          GetContentMarkup( G.O.$markup );
          G.O.$markup=[]  ;
        }
        else {
          NanoConsoleLog(G, 'error: no media to process.');
          return;
        }
      }
      
      G.markupOrApiProcessed = true;
      if( fnToCall !== null &&  fnToCall !== undefined) {
        fnToCall( fnParam1, fnParam2, null );
      }
    }
    
    function StartsWithProtocol ( path ) {
      if( path == undefined ) { return false; }
      // if( path == null ) { return false; }
      
      var pattern = /^((http|https|ftp|ftps|file):\/\/)/;
      if( !pattern.test(path) ) {
        // not a full URL
        return false;
      }
      return true;
    }
    
    function GetContentApiObject() {
      var foundAlbumID=false;
      var nbTitles = 0;
      var AlbumPostProcess = NGY2Tools.AlbumPostProcess.bind(G);

      G.I[0].contentIsLoaded = true;

      jQuery.each(G.O.items, function(i,item){
        
        var title = '';
        title = GetI18nItem(item, 'title');
        if( title === undefined ) { title=''; }
        
        var src='';
        if( item['src'+RetrieveCurWidth().toUpperCase()] !== undefined ) {
          src = item['src'+RetrieveCurWidth().toUpperCase()];
        }
        else {
          src = item.src;
        }
        if( !StartsWithProtocol(src) ) {
          src = G.O.itemsBaseURL + src;
        }

        var thumbsrc = '';
        if( item.srct !== undefined && item.srct.length > 0 ) {
          thumbsrc = item.srct;
          if( !StartsWithProtocol(thumbsrc) ) {
            thumbsrc = G.O.itemsBaseURL + thumbsrc;
          }
        }
        else {
          thumbsrc = src;
        }
        
        if( G.O.thumbnailLabel.get('title') != '' ) {
          title = GetImageTitle(src);
        }

        var description='';     //'&nbsp;';
        description=GetI18nItem(item,'description');
        if( description === undefined ) { description=''; }
        //if( toType(item.description) == 'string' ) {
        //  description=item.description;
        //}

        var tags = GetI18nItem(item, 'tags');
        if( tags === undefined ) { tags=''; }

        var albumID = 0;
        if( item.albumID !== undefined  ) {
          albumID=item.albumID;
          foundAlbumID = true;
        }
        var ID = null;
        if( item.ID !== undefined ) {
          ID = item.ID;
        }
        var kind = 'image';
        if( item.kind !== undefined && item.kind.length > 0 ) {
          kind = item.kind;
        }
        
        var newItem=NGY2Item.New( G, title, description, ID, albumID, kind, tags );
        if( title != '' ) {
          nbTitles++;
        }
        
        // media source url - img is the default media kind
        newItem.setMediaURL( src, 'img');

        // manage media kinds other than IMG
        jQuery.each(mediaList, function ( n, media ) {
          var id = media.getID(src);
          if( id != null ) {
            if( thumbsrc == src && typeof media.thumbUrl == 'function' ) {
              thumbsrc = media.thumbUrl(id);  
            }
            if( typeof media.url == 'function' ) { src = media.url(id);  }
            newItem.mediaKind = media.kind;
            newItem.mediaMarkup = ( media.selfhosted ) ? media.markup( src ) : media.markup(id);
            return false;
          }
        });

        // image size
        if( item.imageWidth !== undefined ) { newItem.imageWidth = item.width; }
        if( item.imageHeight !== undefined ) { newItem.imageHeight = item.height; }

        // THUMBNAILS
        
        // thumbnail image size
        var tw = item.imgtWidth !== undefined ? item.imgtWidth : 0;
        var th = item.imgtHeight !== undefined ? item.imgtHeight : 0;

        // default thumbnail URL and size
        newItem.thumbs = {
          url:    { l1 : { xs: thumbsrc, sm: thumbsrc, me: thumbsrc, la: thumbsrc, xl: thumbsrc }, lN : { xs: thumbsrc, sm: thumbsrc, me: thumbsrc, la: thumbsrc, xl: thumbsrc } },
          width:  { l1 : { xs: tw, sm: tw, me: tw, la: tw, xl: tw }, lN : { xs: tw, sm: tw, me: tw, la: tw, xl: tw } },
          height: { l1 : { xs: th, sm: th, me: th, la: th, xl: th }, lN : { xs: th, sm: th, me: th, la: th, xl: th } }
        };
        
        // default media type -> IMG
        if( newItem.mediaKind == 'img' ) {
        
          // responsive thumbnails URL and size
          var lst=['xs', 'sm', 'me', 'la', 'xl'];
          for( var i=0; i< lst.length; i++ ) {
            // url
            var turl = item['srct' + lst[i].toUpperCase()];
            if( turl !== undefined ) {
              if( !StartsWithProtocol(turl) ) {
                turl = G.O.itemsBaseURL + turl;
              }
              newItem.url.l1[lst[i]] = turl;
              newItem.url.lN[lst[i]] = turl;
            }
            // width
            var tw = item['imgt' + lst[i].toUpperCase() + 'Width'];
            if( tw != undefined ) {
              newItem.width.l1[lst[i]] = parseInt(tw);
              newItem.width.lN[lst[i]] = parseInt(tw);
            }
            // height
            var th = item['imgt' + lst[i].toUpperCase() + 'Height'];
            if( th != undefined ) {
              newItem.height.l1[lst[i]] = parseInt(th);
              newItem.height.lN[lst[i]] = parseInt(th);
            }
          }
        }
        
        // dominant colors (needs to be a base64 gif)
        if( item.imageDominantColors !== undefined ) {
          newItem.imageDominantColors = item.imageDominantColors;
        }
        // dominant color (rgb hex)
        if( item.imageDominantColor !== undefined ) {
          newItem.imageDominantColor = item.imageDominantColor;
        }
        
        // dest url
        if( item.destURL !== undefined && item.destURL.length>0 ) {
          newItem.destinationURL = item.destURL;
        }
        
        // download image url
        if( item.downloadURL !== undefined && item.downloadURL.length>0 ) {
          newItem.downloadURL = item.downloadURL;
        }
        
        // EXIF DATA
        // Exif - model
        if( item.exifModel !== undefined ) { newItem.exif.model = item.exifModel; }
        // Exif - flash
        if( item.exifFlash !== undefined ) { newItem.exif.flash = item.exifFlash; }
        // Exif - focallength
        if( item.exifFocalLength !== undefined ) { newItem.exif.focallength = item.exifFocalLength; }
        // Exif - fstop
        if( item.exifFStop !== undefined ) { newItem.exif.fstop = item.exifFStop; }
        // Exif - exposure
        if( item.exifExposure !== undefined ) { newItem.exif.exposure = item.exifExposure; }
        // Exif - time
        if( item.exifIso !== undefined ) { newItem.exif.iso = item.exifIso; }
        // Exif - iso
        if( item.exifTime !== undefined ) { newItem.exif.time = item.exifTime; }
        // Exif - location
        if( item.exifLocation !== undefined ) { newItem.exif.location  = item.exifLocation; }
        
        
        // custom data
        if( item.customData !== null ) {
          newItem.customData = cloneJSObject( item.customData );
        }

        newItem.contentIsLoaded = true;
        
        var fu = G.O.fnProcessData;
        if( fu !== null ) {
          typeof fu == 'function' ? fu(newItem, 'api', item) : window[fu](newItem, 'api', item);
        }
        
        AlbumPostProcess(albumID);
      });
      
      // if( foundAlbumID ) { G.O.displayBreadcrumb=true; }
      if( nbTitles == 0 ) { G.O.thumbnailLabel.display=false; }

    }
    

    // Returns the text of the DOM element (without children)
    // Because jQuery().text() returns the text of all children
    function ElementGetText( element ) {
      
      var text = '';
      if( element.childNodes[0] !== undefined ) {
        if( element.childNodes[0].nodeValue !== null && element.childNodes[0].nodeValue !== undefined ) {
          text = element.childNodes[0].nodeValue.trim();
        }
      }
      return text;
    }
    
    // Extract items from the jQuery elements
    function GetContentMarkup( $elements, group ) {
      var foundAlbumID = false;
      var nbTitles = 0;
      var AlbumPostProcess = NGY2Tools.AlbumPostProcess.bind(G);
      var GetImageTitleFromURL = NGY2Tools.GetImageTitleFromURL.bind(G);

      G.I[0].contentIsLoaded = true;

      jQuery.each($elements, function(i, item){

        // compare to group defined on the element that has been clicked (lightbox standalone)
        if( item.dataset.nanogallery2Lgroup != group ) { return; }

        // ignore element <SCRIPT>
        if( item.nodeName == 'SCRIPT' ) { return; }

        // create dictionnary with all data attribute name in lowercase (to be case unsensitive)
        var data = {
          // all possible data attributes with some default values
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
          'data-ngexiflocation':          '',
          'data-ngsrc':    					      '',
					'alt':													''
        };

        // Extract data attributes from main item
        [].forEach.call( item.attributes, function(attr) {
          data[attr.name.toLowerCase()] = attr.value.trim();
        });

        var title = ElementGetText(item);
				if( title == '' && data.alt != '') {
					// no title -> check ALT attribute of main element
					title = data['alt'];
				}
        
        // Complete with data attributes from all children
        jQuery.each($(item).children(), function(i, sub_item){
          
          // title may be set on a child element
          if( title == '' ) {
            title = ElementGetText(sub_item);
          }
          
          [].forEach.call( sub_item.attributes, function(attr) {
            data[attr.name.toLowerCase()] = attr.value.trim();
          });

					if( title == '' && data.alt != '') {
						// no title -> check ALT attribute of sub element
						title = data['alt'];
					}

				});

				// BIG IMAGE URL
        // responsive image URL
        var src = '',
        st = RetrieveCurWidth().toUpperCase();
        if( data.hasOwnProperty('data-ngsrc'+st) ) {
          src = data['data-ngsrc'+st];
        }
				// image URL from data-ngsrc attribute 
        // if( src == '' ) {
          // src = data['data-ngsrc'];
        // }
				// image URL from href attribute (a element)
        // if( src == '' ) {
          // src = data['href'];
        // }
        src = src || data['data-ngsrc'] || data['href'];
        if( src !== undefined && !StartsWithProtocol(src) ) {          // do not add the base URL if src starts with a protocol (http, https...)
          src = G.O.itemsBaseURL + src;
        }

        // THUMBNAIL IMAGE
        var thumbsrc = '';
				// src attribute (img element)
        if( data.hasOwnProperty('src') ) {
          thumbsrc = data['src'];
        }
				// data-ngthumb attribute
				if( thumbsrc == '' && data.hasOwnProperty('data-ngthumb') ) {
          thumbsrc = data['data-ngthumb'];
        }
        if( thumbsrc == '' ) {
          thumbsrc = src;       // no thumbnail image URL -> use big image URL
        }
				if( thumbsrc !== undefined && !StartsWithProtocol(thumbsrc) ) {
					thumbsrc = G.O.itemsBaseURL + thumbsrc;
				}

        // ignore if no media URL at all
        if( src === undefined && thumbsrc === undefined ) { return; }
        
        //newObj.description=jQuery(item).attr('data-ngdesc');
        var description = data['data-ngdesc'];
        var ID = data['id'] || data['data-ngid'];
        // if( ID == undefined ) {
          // ID = data['data-ngid'];
        // }
        var kind = data['data-ngkind'];
        var tags = data['data-ngtags'];

        var albumID = '0';
        if( data.hasOwnProperty('data-ngalbumid') ) {
          albumID = data['data-ngalbumid'];
          foundAlbumID = true;
        }

        // var title = jQuery(item).text();
        var title_from_url = GetImageTitleFromURL( src );
        if( title_from_url != '' ) {
          title = title_from_url;
        }

        var newItem = NGY2Item.New( G, title, description, ID, albumID, kind, tags );
        if( title != '' ) {
          nbTitles++;
        }

        // media source url - img is the default media kind
        newItem.setMediaURL( src, 'img');

        // manage media kinds other than IMG
        // newItem.mediaKind = 'img';
        jQuery.each(mediaList, function ( n, media ) {
          var id = media.getID(src);
          if( id != null ) {
            if( thumbsrc == src && typeof media.thumbUrl == 'function' ) {
              thumbsrc = media.thumbUrl(id);  
            }
            if( typeof media.url == 'function' ) { src = media.url(id);  }
            newItem.mediaKind = media.kind;
            newItem.mediaMarkup = ( media.selfhosted ) ? media.markup( src ) : media.markup(id);
            return false;
          }
        });
        
        
        // Big image size
        newItem.imageWidth = parseInt( data['data-ngimagewidth'] );
        newItem.imageHeight = parseInt( data['data-ngimageheight'] );
        
        // default thumbnail image URL and size
        var tw = parseInt(data['data-ngthumbimgwidth']);
        var th = parseInt(data['data-ngthumbimgheight']);
        newItem.thumbs = {
          url:    { l1 : { xs: thumbsrc, sm: thumbsrc, me: thumbsrc, la: thumbsrc, xl: thumbsrc }, lN : { xs: thumbsrc, sm: thumbsrc, me: thumbsrc, la: thumbsrc, xl: thumbsrc } },
          width:  { l1 : { xs: tw, sm: tw, me: tw, la: tw, xl: tw }, lN : { xs: tw, sm: tw, me: tw, la: tw, xl: tw } },
          height: { l1 : { xs: th, sm: th, me: th, la: th, xl: th }, lN : { xs: th, sm: th, me: th, la: th, xl: th } }
        };

        // Media type -> IMG
        if( newItem.mediaKind == 'img' ) {
        
          // responsive thumbnails URL and size
          var lst = ['xs', 'sm', 'me', 'la', 'xl'];
          for( var i = 0; i < lst.length; i++ ) {
            // url
            if( data.hasOwnProperty('data-ngthumb' + lst[i]) ) {
              var turl=data['data-ngthumb' + lst[i]];
              if( !StartsWithProtocol(turl) ) {
                turl = G.O.itemsBaseURL + turl;
              }
              newItem.url.l1[lst[i]] = turl;
              newItem.url.lN[lst[i]] = turl;
            }

            // width
            if( data.hasOwnProperty('data-ngthumb' + lst[i] + 'width') ) {
              var tw=parseInt(data['data-ngthumb' + lst[i] + 'width']);
              newItem.width.l1[lst[i]] = tw;
              newItem.width.lN[lst[i]] = tw;
            }
            // height
            if( data.hasOwnProperty('data-ngthumb' + lst[i] + 'height') ) {
              var th=parseInt('data-ngthumb' + lst[i] + 'height');
              newItem.height.l1[lst[i]] = th;
              newItem.height.lN[lst[i]] = th;
            }
          }
        }
        
        
        // dominant colorS (needs to be a base64 gif)
        newItem.imageDominantColors = data['data-ngimagedominantcolors'];
        // dominant color (rgb hex)
        newItem.imageDominantColor = data['data-ngimagedominantcolors'];

        newItem.destinationURL = data['data-ngdest'];
        newItem.downloadURL = data['data-ngdownloadurl'];

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
        
        newItem.contentIsLoaded = true;

        // custom data
        if( jQuery(item).data('customdata') !== undefined ) {
          newItem.customData = cloneJSObject(jQuery(item).data('customdata'));
        }
        // custom data
        if( jQuery(item).data('ngcustomdata') !== undefined ) {
          newItem.customData = cloneJSObject(jQuery(item).data('ngcustomdata'));
        }

        var fu=G.O.fnProcessData;
        if( fu !== null ) {
          typeof fu == 'function' ? fu(newItem, 'markup', item) : window[fu](newItem, 'markup', item);
        }
        
        AlbumPostProcess(albumID);

      });
      
      // if( foundAlbumID ) { G.O.displayBreadcrumb=true; }
      if( nbTitles == 0 ) { G.O.thumbnailLabel.display = false; }
			
    }

    
    // ################################
    // ##### DEFINE VARIABLES     #####
    // ################################

    
    /** @function DefineVariables */
    function DefineVariables() {
    
      // change 'picasa' to 'google' for compatibility reason
      if( G.O.kind.toUpperCase() == 'PICASA'  || G.O.kind.toUpperCase() == 'GOOGLE') {
        G.O.kind='google2';
      }
    
      // management of screen width
      G.GOM.cache.viewport = getViewport();
      G.GOM.curWidth = RetrieveCurWidth();
      
      // tumbnail toolbar
      jQuery.extend(true, G.tn.toolbar.image, G.O.thumbnailToolbarImage );
      jQuery.extend(true, G.tn.toolbar.album, G.O.thumbnailToolbarAlbum );
      var t = ['image', 'album'];
      var pos= ['topLeft', 'topRight', 'bottomLeft', 'bottomRight']
      for( var i=0; i < t.length ; i++ ) {
        for( var j=0; j < pos.length ; j++ ) {
          G.tn.toolbar[t[i]][pos[j]] = G.tn.toolbar[t[i]][pos[j]].toUpperCase();
        }
      }

      // convert label settings
      if( G.O.thumbnailLabel.position == 'overImageOnBottom' ) {
        G.O.thumbnailLabel.valign = 'bottom';
        G.O.thumbnailLabel.position = 'overImage';
      }
      if( G.O.thumbnailLabel.position == 'overImageOnMiddle' ) {
        G.O.thumbnailLabel.valign = 'middle';
        G.O.thumbnailLabel.position = 'overImage';
      }
      if( G.O.thumbnailLabel.position == 'overImageOnTop' ) {
        G.O.thumbnailLabel.valign = 'top';
        G.O.thumbnailLabel.position = 'overImage';
      }
      if( G.O.thumbnailL1Label !== undefined && G.O.thumbnailL1Label.position !== undefined ) {
        if( G.O.thumbnailL1Label.position == 'overImageOnBottom' ) {
          G.O.thumbnailL1Label.valign = 'bottom';
          G.O.thumbnailL1Label.position = 'overImage';
        }
        if( G.O.thumbnailL1Label.position == 'overImageOnMiddle' ) {
          G.O.thumbnailL1Label.valign = 'middle';
          G.O.thumbnailL1Label.position = 'overImage';
        }
        if( G.O.thumbnailL1Label.position == 'overImageOnTop' ) {
          G.O.thumbnailL1Label.valign = 'top';
          G.O.thumbnailL1Label.position = 'overImage';
        }
      }

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

      if( G.O.blockList != '' ) { G.blockList = G.O.blockList.toUpperCase().split('|'); }
      if( G.O.allowList != '' ) { G.allowList = G.O.allowList.toUpperCase().split('|'); }

      if( G.O.albumList2 !== undefined && G.O.albumList2 !== null && G.O.albumList2.constructor === Array  ) {
        var l=G.O.albumList2.length;
        for(var i=0; i< l; i++ ) {
          G.albumList.push(G.O.albumList2[i]);
        }
        // G.albumList=G.O.albumList.toUpperCase().split('|');
      }
      if( G.O.albumList2 !== undefined && typeof G.O.albumList2 == 'string'   ) {
        G.albumList.push(G.O.albumList2);
      }
      
      
      // thumbnail image crop
      G.tn.opt.lN.crop = G.O.thumbnailCrop;
      G.tn.opt.l1.crop = G.O.thumbnailL1Crop != null ? G.O.thumbnailL1Crop : G.O.thumbnailCrop;


      function ThumbnailOpt( lN, l1, opt) {
        G.tn.opt.lN[opt] = G.O[lN];
        G.tn.opt.l1[opt] = G.O[lN];
        if( toType(G.O[l1]) == 'number' ) {
          G.tn.opt.l1[opt] = G.O[l1];
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
      // ThumbnailOpt('thumbnailGutterWidth', 'thumbnailL1GutterWidth', 'gutterWidth');
      // thumbnail gutter height
      // ThumbnailOpt('thumbnailGutterHeight', 'thumbnailL1GutterHeight', 'gutterHeight');
      // thumbnail border horizontal
      ThumbnailOpt('thumbnailBorderHorizontal', 'thumbnailL1BorderHorizontal', 'borderHorizontal');
      // thumbnail border vertical
      ThumbnailOpt('thumbnailBorderVertical', 'thumbnailL1BorderVertical', 'borderVertical');
      // thumbnail grid base height (for cascading layout)
      ThumbnailOpt('thumbnailBaseGridHeight', 'thumbnailL1BaseGridHeight', 'baseGridHeight');
      
      
      // Set same value to all widths
      function ResponsiveSetSize( setting, level, v ) {
        G.tn.settings[setting][level]['xs'] = v;
        G.tn.settings[setting][level]['sm'] = v;
        G.tn.settings[setting][level]['me'] = v;
        G.tn.settings[setting][level]['la'] = v;
        G.tn.settings[setting][level]['xl'] = v;
      }

      // Get and evaluate responsive values from one option
      // Responsive is with syntax: n XSn1 SMn2 MEn3 LAn4 XLn5 (where n is the default value)
      // Value 'auto' is accepted for all options, but is handeld only for thumbnail width/height
      function ResponsiveOption( option, setting, level ) {
        var v = G.O[option];

        if( v === undefined || v === null ) { return; }
        
        // if( toType(v) == 'number' ) {
        if( toType(v) == 'number' || v.indexOf(' ') == -1 ) {
          // set value for all widths
          var vn = 'auto';                              
          if( v != 'auto' ) { vn = parseInt(v); }
          ResponsiveSetSize( setting, level, vn );
        }
        else {
          var sp = v.split(' ');
          if( sp.length > 0 && +sp[0] === +sp[0] ) {          // check if sp[0] is a number
            // first value is the default size for all widths
            var vn = 'auto';
            if( sp[0] != 'auto' ) { vn = parseInt(sp[0]); }
            ResponsiveSetSize( setting, level, vn );
          }
          for( var i = 1; i < sp.length; i++ ) {
            if( /^xs|sm|me|la|xl/i.test( sp[i] ) ) {        // regex: i ignores the case and ^ means "starts with"
              var wi = sp[i].substring(0, 2).toLowerCase();
              var va = sp[i].substring(2);
              var vn = 'auto';
              if( va != 'auto' ) { vn = parseInt(va); }
              G.tn.settings[setting][level][wi] = vn;
            }
          }
        }
      }
      
      ResponsiveOption('thumbnailGutterWidth', 'gutterWidth', 'lN');
      ResponsiveOption('thumbnailGutterWidth', 'gutterWidth', 'l1');        // set default values for first level
      ResponsiveOption('thumbnailL1GutterWidth', 'gutterWidth', 'l1');
      ResponsiveOption('thumbnailGutterHeight', 'gutterHeight', 'lN');
      ResponsiveOption('thumbnailGutterHeight', 'gutterHeight', 'l1');      // set default values for first level
      ResponsiveOption('thumbnailL1GutterHeight', 'gutterHeight', 'l1');
      
      // gallery display mode
      G.galleryDisplayMode.lN = G.O.galleryDisplayMode.toUpperCase();
      G.galleryDisplayMode.l1 = G.O.galleryL1DisplayMode != null ? G.O.galleryL1DisplayMode.toUpperCase() : G.O.galleryDisplayMode.toUpperCase();
      
      // gallery maximum number of lines of thumbnails
      G.galleryMaxRows.lN = G.O.galleryMaxRows;
      G.galleryMaxRows.l1 = toType(G.O.galleryL1MaxRows) == 'number' ? G.O.galleryL1MaxRows : G.O.galleryMaxRows;

      // gallery last row full
      G.galleryLastRowFull.lN = G.O.galleryLastRowFull;
      G.galleryLastRowFull.l1 = G.O.galleryL1LastRowFull != null ? G.O.galleryL1LastRowFull : G.O.galleryLastRowFull;
      
      // gallery sorting
      G.gallerySorting.lN = G.O.gallerySorting.toUpperCase();
      G.gallerySorting.l1 = G.O.galleryL1Sorting != null ? G.O.galleryL1Sorting.toUpperCase() : G.gallerySorting.lN;
      
      // gallery display transition
      G.galleryDisplayTransition.lN = G.O.galleryDisplayTransition.toUpperCase();
      G.galleryDisplayTransition.l1 = G.O.galleryL1DisplayTransition != null ? G.O.galleryL1DisplayTransition.toUpperCase() : G.galleryDisplayTransition.lN;

      // gallery display transition duration
      G.galleryDisplayTransitionDuration.lN = G.O.galleryDisplayTransitionDuration;
      G.galleryDisplayTransitionDuration.l1 = G.O.galleryL1DisplayTransitionDuration != null ? G.O.galleryL1DisplayTransitionDuration : G.galleryDisplayTransitionDuration.lN;
      
      // gallery max items per album (not for inline/api defined items)
      G.galleryMaxItems.lN = G.O.galleryMaxItems;
      G.galleryMaxItems.l1 = toType(G.O.galleryL1MaxItems) == 'number' ? G.O.galleryL1MaxItems : G.O.galleryMaxItems;

      // gallery filter tags
      G.galleryFilterTags.lN = G.O.galleryFilterTags;
      G.galleryFilterTags.l1 = G.O.galleryL1FilterTags != null ? G.O.galleryL1FilterTags : G.O.galleryFilterTags;

      // gallery filter tags mode
      G.galleryFilterTagsMode.lN = G.O.galleryFilterTagsMode;
      G.galleryFilterTagsMode.l1 = G.O.galleryL1FilterTagsMode != null ? G.O.galleryL1FilterTagsMode : G.O.galleryFilterTagsMode;
      
      // gallery pagination
      G.O.galleryPaginationMode = G.O.galleryPaginationMode.toUpperCase();

      if( toType(G.O.slideshowDelay) == 'number' && G.O.slideshowDelay >= 2000 ) {
        G.VOM.slideshowDelay = G.O.slideshowDelay;
      }
      else {
        NanoConsoleLog(G, 'Parameter "slideshowDelay" must be an integer >= 2000 ms.');
      }

      // gallery display transition
      if( typeof G.O.thumbnailDisplayTransition == 'boolean' ) {
        if( G.O.thumbnailDisplayTransition === true ) {
          G.tn.opt.lN.displayTransition = 'FADEIN';
          G.tn.opt.l1.displayTransition = 'FADEIN';
        }
        else {
          G.tn.opt.lN.displayTransition = 'NONE';
          G.tn.opt.l1.displayTransition = 'NONE';
        }
      }

      if( G.O.fnThumbnailDisplayEffect !== '' ) {
        G.tn.opt.lN.displayTransition = 'CUSTOM';
        G.tn.opt.l1.displayTransition = 'CUSTOM';
      }
      if( G.O.fnThumbnailL1DisplayEffect !== '' ) {
        G.tn.opt.l1.displayTransition = 'CUSTOM';
      }
      

      // thumbnail display transition easing
			// set default easing
      ThumbnailOpt('thumbnailDisplayTransitionEasing', 'thumbnailL1DisplayTransitionEasing', 'displayTransitionEasing');
      // parse thumbnail display transition
      function thumbnailDisplayTransitionParse( cfg, level ) {
        if( typeof cfg == 'string' ) {
          var st=cfg.split('_');
          if( st.length == 1 ) {
            G.tn.opt[level]['displayTransition'] = cfg.toUpperCase();
          }
          if( st.length == 2 ) {
            G.tn.opt[level]['displayTransition'] = st[0].toUpperCase();
            G.tn.opt[level]['displayTransitionStartVal'] = Number(st[1]);
          }
          if( st.length == 3 ) {
            G.tn.opt[level]['displayTransition'] = st[0].toUpperCase();
            G.tn.opt[level]['displayTransitionStartVal'] = Number(st[1]);
            G.tn.opt[level]['displayTransitionEasing'] = st[2];
          }
        }
      }
      thumbnailDisplayTransitionParse( G.O.thumbnailDisplayTransition, 'lN');
      thumbnailDisplayTransitionParse( G.O.thumbnailDisplayTransition, 'l1');
      thumbnailDisplayTransitionParse( G.O.thumbnailL1DisplayTransition, 'l1');

      
      // thumbnail display transition duration
      ThumbnailOpt('thumbnailDisplayTransitionDuration', 'thumbnailL1DisplayTransitionDuration', 'displayTransitionDuration');
      // thumbnail display transition interval duration
      ThumbnailOpt('thumbnailDisplayInterval', 'thumbnailL1DisplayInterval', 'displayInterval');
      // thumbnail display order
      ThumbnailOpt('thumbnailDisplayOrder', 'thumbnailL1DisplayOrder', 'displayOrder');

      
      // resolution breakpoints --> convert old syntax to new one
      if( G.O.thumbnailSizeSM !== undefined ) { G.O.breakpointSizeSM = G.O.thumbnailSizeSM; }
      if( G.O.thumbnailSizeME !== undefined ) { G.O.breakpointSizeME = G.O.thumbnailSizeME; }
      if( G.O.thumbnailSizeLA !== undefined ) { G.O.breakpointSizeLA = G.O.thumbnailSizeLA; }
      if( G.O.thumbnailSizeXL !== undefined ) { G.O.breakpointSizeXL = G.O.thumbnailSizeXL; }

      // THUMBNAIL BUILD INIT
      //level 1
      if( G.O.thumbnailL1BuildInit2 !== undefined ) {
        var t1 = G.O.thumbnailL1BuildInit2.split('|');
        for( var i = 0; i < t1.length; i++ ) {
          var o1 = t1[i].trim().split('_');
          if( o1.length == 3 ) {
            var i1 = NewTBuildInit();
            i1.element = ThumbnailOverEffectsGetCSSElement(o1[0], '');
            i1.property = o1[1];
            i1.value = o1[2];
            G.tn.buildInit.level1.push(i1);
          }
        }
      }
      //level N
      if( G.O.thumbnailBuildInit2 !== undefined ) {
        var t1 = G.O.thumbnailBuildInit2.split('|');
        for( var i = 0; i < t1.length; i++ ) {
          var o1 = t1[i].trim().split('_');
          if( o1.length == 3 ) {
            var i1 = NewTBuildInit();
            i1.element = ThumbnailOverEffectsGetCSSElement(o1[0], '');
            i1.property = o1[1];
            i1.value = o1[2];
            G.tn.buildInit.std.push(i1);
          }
        }
      }

      
      // THUMBNAIL HOVER EFFETCS
      
      // thumbnails hover effects - Level1
      var tL1HE = G.O.thumbnailL1HoverEffect2;
      if( tL1HE !== undefined ) {
        switch( toType(tL1HE) ) {
          case 'string': {
              let tmp = tL1HE.split('|');
              for(var i = 0; i < tmp.length; i++) {
                let oDef = NewTHoverEffect();
                oDef = ThumbnailHoverEffectExtract( tmp[i].trim(), oDef );
                if(  oDef != null ) {
                  G.tn.hoverEffects.level1.push(oDef);
                }
              }
              break;
            }
          case 'object': {
              let oDef = NewTHoverEffect();
              oDef = jQuery.extend(oDef,tL1HE);
              oDef = ThumbnailHoverEffectExtract( oDef.name, oDef );
              if(  oDef != null ) {
                G.tn.hoverEffects.level1.push(oDef);
              }
              break;
            }
          case 'array': {
              for(var i = 0; i < tL1HE.length; i++) {
                let oDef = NewTHoverEffect();
                oDef = jQuery.extend(oDef,tL1HE[i]);
                oDef = ThumbnailHoverEffectExtract( oDef.name, oDef );
                if(  oDef != null ) {
                  G.tn.hoverEffects.level1.push(oDef);
                }
              }
              break;
            }
          case 'null':
            break;
          default:
            NanoAlert(G, 'incorrect parameter for "thumbnailL1HoverEffect2".');
        }
      }
      G.tn.hoverEffects.level1 = ThumbnailOverEffectsPreset(G.tn.hoverEffects.level1);
  
      // thumbnails hover effects - other levels
      var tHE = G.O.thumbnailHoverEffect2;
      switch( toType(tHE) ) {
        case 'string': {
            let tmp = tHE.split('|');
            for(var i = 0; i < tmp.length; i++) {
              let oDef = NewTHoverEffect();
              oDef = ThumbnailHoverEffectExtract( tmp[i].trim(), oDef );
              if(  oDef != null ) {
                G.tn.hoverEffects.std.push(oDef);
              }
            }
            break;
          }
        case 'object': {
            let oDef = NewTHoverEffect();
            oDef = jQuery.extend(oDef, tHE);
            oDef = ThumbnailHoverEffectExtract( oDef.name, oDef );
            if(  oDef != null ) {
              G.tn.hoverEffects.std.push(oDef);
            }
            break;
          }
        case 'array': {
            for(var i = 0; i < tHE.length; i++) {
              let oDef = NewTHoverEffect();
              oDef = jQuery.extend(oDef,tHE[i]);
              oDef = ThumbnailHoverEffectExtract( oDef.name, oDef );
              if(  oDef!= null ) {
                G.tn.hoverEffects.std.push(oDef);
              }
            }
            break;
          }
        case 'null':
          break;
        default:
          NanoAlert(G, 'incorrect parameter for "thumbnailHoverEffect2".');
      }
      G.tn.hoverEffects.std = ThumbnailOverEffectsPreset(G.tn.hoverEffects.std);

      
      if( G.O.touchAnimationL1 == undefined ) {
        G.O.touchAnimationL1 = G.O.touchAnimation;
      }
      
      // disable thumbnail touch animation when no hover effect defined
      if( G.tn.hoverEffects.std.length == 0 ) {
        if( G.tn.hoverEffects.level1.length == 0 ) {
          G.O.touchAnimationL1 = false;
        }
        G.O.touchAnimation = false;
      }      
      
      
      // thumbnail sizes
      if( G.O.thumbnailHeight == 0 || G.O.thumbnailHeight == ''  ) { G.O.thumbnailHeight = 'auto'; }
      if( G.O.thumbnailWidth == 0 || G.O.thumbnailWidth == '' ) { G.O.thumbnailWidth = 'auto'; }
      if( G.O.thumbnailL1Height == 0 || G.O.thumbnailL1Height == '' ) { G.O.thumbnailL1Height = 'auto'; }
      if( G.O.thumbnailL1Width == 0 || G.O.thumbnailL1Width == '' ) { G.O.thumbnailL1Width = 'auto'; }

      // RETRIEVE ALL THUMBNAIL SIZES
      // ThumbnailSizes( 'thumbnailWidth', false, 'width');
      // ThumbnailSizes( 'thumbnailL1Width', true, 'width');
      // ThumbnailSizes( 'thumbnailHeight', false, 'height');
      // ThumbnailSizes( 'thumbnailL1Height', true, 'height');
      ResponsiveOption('thumbnailWidth', 'width', 'lN');
      ResponsiveOption('thumbnailWidth', 'width', 'l1');
      ResponsiveOption('thumbnailL1Width', 'width', 'l1');
      ResponsiveOption('thumbnailHeight', 'height', 'lN');
      ResponsiveOption('thumbnailHeight', 'height', 'l1');
      ResponsiveOption('thumbnailL1Height', 'height', 'l1');

      
      G.O.thumbnailLabelHeight = parseInt(G.O.thumbnailLabelHeight);

      
      // retrieve all mosaic layout patterns
      // default pattern
      if( G.O.galleryMosaic != undefined ) {
        // clone object
        G.tn.settings.mosaic.l1.xs = JSON.parse(JSON.stringify(G.O.galleryMosaic));
        G.tn.settings.mosaic.l1.sm = JSON.parse(JSON.stringify(G.O.galleryMosaic));
        G.tn.settings.mosaic.l1.me = JSON.parse(JSON.stringify(G.O.galleryMosaic));
        G.tn.settings.mosaic.l1.la = JSON.parse(JSON.stringify(G.O.galleryMosaic));
        G.tn.settings.mosaic.l1.xl = JSON.parse(JSON.stringify(G.O.galleryMosaic));
        G.tn.settings.mosaic.lN.xs = JSON.parse(JSON.stringify(G.O.galleryMosaic));
        G.tn.settings.mosaic.lN.sm = JSON.parse(JSON.stringify(G.O.galleryMosaic));
        G.tn.settings.mosaic.lN.me = JSON.parse(JSON.stringify(G.O.galleryMosaic));
        G.tn.settings.mosaic.lN.la = JSON.parse(JSON.stringify(G.O.galleryMosaic));
        G.tn.settings.mosaic.lN.xl = JSON.parse(JSON.stringify(G.O.galleryMosaic));
        G.tn.settings.mosaicCalcFactor('l1', 'xs');
        G.tn.settings.mosaicCalcFactor('l1', 'sm');
        G.tn.settings.mosaicCalcFactor('l1', 'me');
        G.tn.settings.mosaicCalcFactor('l1', 'la');
        G.tn.settings.mosaicCalcFactor('l1', 'xl');
        G.tn.settings.mosaicCalcFactor('lN', 'xs');
        G.tn.settings.mosaicCalcFactor('lN', 'sm');
        G.tn.settings.mosaicCalcFactor('lN', 'me');
        G.tn.settings.mosaicCalcFactor('lN', 'la');
        G.tn.settings.mosaicCalcFactor('lN', 'xl');
      }
      if( G.O.galleryL1Mosaic != undefined ) {
        // default L1 pattern
        G.tn.settings.mosaic.l1.xs = JSON.parse(JSON.stringify(G.O.galleryL1Mosaic));
        G.tn.settings.mosaic.l1.sm = JSON.parse(JSON.stringify(G.O.galleryL1Mosaic));
        G.tn.settings.mosaic.l1.me = JSON.parse(JSON.stringify(G.O.galleryL1Mosaic));
        G.tn.settings.mosaic.l1.la = JSON.parse(JSON.stringify(G.O.galleryL1Mosaic));
        G.tn.settings.mosaic.l1.xl = JSON.parse(JSON.stringify(G.O.galleryL1Mosaic));
        G.tn.settings.mosaicCalcFactor('l1', 'xs');
        G.tn.settings.mosaicCalcFactor('l1', 'sm');
        G.tn.settings.mosaicCalcFactor('l1', 'me');
        G.tn.settings.mosaicCalcFactor('l1', 'la');
        G.tn.settings.mosaicCalcFactor('l1', 'xl');
      }

			var lst=['xs','sm','me','la','xl'];
			// retrieve responsive mosaic definition for levels l1 & lN
      for( var w = 0; w < lst.length; w++ ) {
				if( G.O['galleryMosaic' + lst[w].toUpperCase()] != undefined ) {
          G.tn.settings.mosaic.lN[lst[w]] = JSON.parse(JSON.stringify( G.O['galleryMosaic' + lst[w].toUpperCase()] ));
          G.tn.settings.mosaic.l1[lst[w]] = JSON.parse(JSON.stringify( G.O['galleryMosaic' + lst[w].toUpperCase()] ));
          G.tn.settings.mosaicCalcFactor('lN',lst[w]);
          G.tn.settings.mosaicCalcFactor('l1', lst[w]);
        }
      }
			// retrieve responsive mosaic definition for level l1
      for( var w = 0; w < lst.length; w++ ) {
				if( G.O['galleryL1Mosaic' + lst[w].toUpperCase()] != undefined ) {
          G.tn.settings.mosaic.l1[lst[w]] = JSON.parse(JSON.stringify( G.O['galleryL1Mosaic' + lst[w].toUpperCase()] ));
          G.tn.settings.mosaicCalcFactor('l1', lst[w]);
        }
      }
      
      G.O.imageTransition = G.O.imageTransition.toUpperCase();

      G.layout.SetEngine();
      
      // init plugins
      switch( G.O.kind ) {
        // MARKUP / API
        case '':
          break;
        // JSON, Flickr, Picasa, ...
        default:
        jQuery.nanogallery2['data_' + G.O.kind](G, 'Init' );
      }

    }

    // HOVER EFFECTS
    function ThumbnailHoverEffectExtract( name, effect) {
      var easings = [ 'easeInQuad', 'easeOutQuad', 'easeInOutQuad', 'easeInCubic', 'easeOutCubic', 'easeInOutCubic', 'easeInQuart', 'easeOutQuart', 'easeInOutQuart', 'easeInQuint', 'easeOutQuint', 'easeInOutQuint', 'easeInSine', 'easeOutSine', 'easeInOutSine', 'easeInExpo', 'easeOutExpo', 'easeInOutExpo', 'easeInCirc', 'easeOutCirc', 'easeInOutCirc', 'easeOutBounce', 'easeInBack', 'easeOutBack', 'easeInOutBack', 'elastic', 'bounce'];
    
      var sp = name.split('_');
      if( sp.length >= 4 ) {
        // var oDef=NewTHoverEffect();
        effect.name = '';
        effect.type = sp[1];
        effect.from = sp[2];
        effect.to = sp[3];
        if( sp.length >= 5 ) {
          // effect.duration=sp[4];

          for( var n = 4; n < sp.length; n++ ) {
            var v = sp[n];
            
            // check if an easing name
            var foundEasing = false;
            for( var e = 0; e < easings.length; e++) {
              if( v == easings[e] ) {
                foundEasing = true;
                effect.easing = v;
                break;
              }
            }
            if( foundEasing === true ) {
              continue;
            }
            
            v = v.toUpperCase();
            
            if( v == 'HOVERIN' ) {
              effect.hoverout = false;
              continue;
            }
            if( v == 'HOVEROUT' ) {
              effect.hoverin = false;
              continue;
            }
            
            if( v == 'KEYFRAME' ) {
              effect.firstKeyframe = false;
              continue;
            }
            
            var num = parseInt(v.replace(/[^0-9\.]/g, ''), 10);   // extract a number if one exists

            if( num > 0 ) {
              // the string contains a numbers > 0
              if( v.indexOf('DURATION') >= 0 ) {
                effect.duration = num;
                continue;
              }
              if( v.indexOf('DURATIONBACK') >= 0 ) {
                effect.durationBack = num;
                continue;
              }
              if( v.indexOf('DELAY') >= 0 ) {
                effect.delay = num;
                continue;
              }
              if( v.indexOf('DELAYBACK') >= 0 ) {
                effect.delayBack = num;
                continue;
              }
              
              // no parameter name found -> default is duration
              effect.duration = num;
            }
          }
        }        
        effect.element = ThumbnailOverEffectsGetCSSElement(sp[0], effect.type);
        
      }
      else {
        effect.name = name;
        // NanoAlert(G, 'incorrect parameter for "thumbnailHoverEffect": ' + name);
        // return null;
      }
      return effect;
    }
    
    
    function ThumbnailOverEffectsGetCSSElement( element, property ) {
        
         var elts = {
          'image':        '.nGY2GThumbnailImage',
          'thumbnail':    '.nGY2GThumbnail',
          'label':        '.nGY2GThumbnailLabel',
          'title':        '.nGY2GThumbnailTitle',
          'description':  '.nGY2GThumbnailDescription',
          'tools':        '.nGY2GThumbnailIcons',
          'customlayer':  '.nGY2GThumbnailCustomLayer',
          'default':      'nGY2GThumbnailImage'
        };
        return (elts[element] || elts['default']);
        

    }
    
    // convert preset hover effects (nanoGALLERY) to new ones (nanogallery2)
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
          case 'BORDERLIGHTER': {
              let rgb = ColorHelperToRGB(GalleryThemeGetCurrent().thumbnail.borderColor);
              let name = 'thumbnail_borderColor_'+rgb+'_'+ShadeBlendConvert(0.5, rgb );
              newEffects.push(ThumbnailHoverEffectExtract(name, effects[i]));
              break;
            }
          case 'BORDERDARKER': {
              let rgb = ColorHelperToRGB(GalleryThemeGetCurrent().thumbnail.borderColor);
              let name = 'thumbnail_borderColor_'+rgb+'_'+ShadeBlendConvert(-0.5, rgb );
              newEffects.push(ThumbnailHoverEffectExtract(name, effects[i]));
              break;
            }
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
          case 'LABELSLIDEUPTOP':
          case 'LABELSLIDEUP':
            newEffects.push(ThumbnailHoverEffectExtract('label_translateY_100%_0%', effects[i]));
            newEffects.push(ThumbnailHoverEffectExtract('label_translateY_100%_0%', effects[i]));
            break;
          case 'LABELSLIDEDOWN':
            newEffects.push(ThumbnailHoverEffectExtract('label_translateY_-100%_0%', effects[i]));
            break;
          case 'SCALELABELOVERIMAGE':
            newEffects.push(ThumbnailHoverEffectExtract('label_scale_0.00_1.00', effects[i]));
            var n = cloneJSObject(effects[i]);
            newEffects.push(ThumbnailHoverEffectExtract('image_scale_1.00_0.00', n));
            break;
          case 'OVERSCALE':
          case 'OVERSCALEOUTSIDE':
            //var name = 'label_scale_0_100';
            newEffects.push(ThumbnailHoverEffectExtract('label_scale_2.00_1.00', effects[i]));
            var n = cloneJSObject(effects[i]);
            newEffects.push(ThumbnailHoverEffectExtract('label_opacity_0.00_1.00', n));
            n = cloneJSObject(effects[i]);
            newEffects.push(ThumbnailHoverEffectExtract('image_scale_1.00_0.00', n));
            n = cloneJSObject(effects[i]);
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

    
    function ThumbnailStyle( cfg, level) {

      switch( cfg.position ){
        case 'onBottom' :
          G.tn.style[level]['label'] = 'bottom:0; ';
          break;
        case 'right' :
          switch( cfg.valign ) {
              case 'top':
                G.tn.style[level]['label'] = 'top:0; position:absolute; left: 50%;';
                break;
              case 'middle':
                G.tn.style[level]['label'] = 'top:0; bottom:0; left: 50%;';
                G.tn.style[level]['title'] = 'position:absolute; bottom:50%;';
                G.tn.style[level]['desc'] = 'position:absolute; top:50%;';
                break;
              case 'bottom':
              default:
                G.tn.style[level].label = 'bottom:0; position:absolute; left: 50%;';
                G.tn.style[level].title = 'position:absolute;bottom:0;';
                break;
          }
          break;
        case 'custom':
          break;
        default:
        case 'overImage' :
          switch( cfg.valign ) {
              case 'top':
                G.tn.style[level]['label'] = 'top:0; position:absolute;';
                break;
              case 'middle':
                G.tn.style[level]['label'] = 'top:0; bottom:0;';
                G.tn.style[level]['title'] = 'position:absolute; bottom:50%;';
                G.tn.style[level]['desc'] = 'position:absolute; top:50%;';
                break;
              case 'bottom':
              default:
                // G.O.thumbnailLabel.position = 'overImageOnBottom';
                G.tn.style[level].label = 'bottom:0; position:absolute;';
                break;
          }
        
        // case 'overImageOnTop' :
          // G.tn.style[level]['label'] = 'top:0; position:absolute;';
          // break;
        // case 'overImageOnMiddle' :
          // G.tn.style[level]['label'] = 'top:0; bottom:0;';
          // G.tn.style[level]['title'] = 'position:absolute; bottom:50%;';
          // G.tn.style[level]['desc'] = 'position:absolute; top:50%;';
          // break;
        // case 'right' :
        // case 'custom' :
          // break;
        // case 'overImageOnBottom' :
        // default :
          // G.O.thumbnailLabel.position = 'overImageOnBottom';
          // G.tn.style[level].label = 'bottom:0; position:absolute;';
          // break;
      }
      
      // if( G.layout.engine != 'CASCADING' ) {
      if( cfg.position != 'onBottom' ) {
        // multi-line
        if( cfg.titleMultiLine ) {
          G.tn.style[level]['title'] += 'white-space:normal;';
        }
        if( cfg.descriptionMultiLine ) {
          G.tn.style[level]['desc'] += 'white-space:normal;';
        }
      }
      
      // horizontal alignement
      switch( cfg.align ) {
        case 'right':
            G.tn.style[level].label += 'text-align:right;';
          break;
        case 'left':
            G.tn.style[level].label += 'text-align:left;';
          break;
        default:
            G.tn.style[level].label += 'text-align:center;';
          break;
      }
      
      
      if( cfg.titleFontSize != undefined && cfg.titleFontSize != '' ) {
        G.tn.style[level].title += 'font-size:' + cfg.titleFontSize + ';';
      }
      if( cfg.descriptionFontSize != undefined && cfg.descriptionFontSize != '' ) {
        G.tn.style[level].desc += 'font-size:' + cfg.descriptionFontSize + ';';
      }
      
      if( cfg.displayDescription == false ) {
        G.tn.style[level].desc += 'display:none;';
      }
    }

    
    // cache some thumbnail settings
    function ThumbnailDefCaches() {
      // thumbnail content CSS styles

      // settings for level L1 and LN
      ThumbnailStyle( G.O.thumbnailLabel, 'lN');
      if( G.O.thumbnailL1Label !== undefined ) {
        ThumbnailStyle( G.O.thumbnailL1Label, 'l1');
      }
      else {
        ThumbnailStyle( G.O.thumbnailLabel, 'l1');
      }

      if( G.O.thumbnailL1Label && G.O.thumbnailL1Label.display ) {
        // settings for level L1
        ThumbnailStyle( G.O.thumbnailL1Label, 'l1');
      }
      

      // default thumbnail sizes levels l1 and lN
      var lst=['xs','sm','me','la','xl'];
      for( var i = 0; i < lst.length; i++ ) {
        var w = G.tn.settings.width.lN[lst[i]];
        if( w != 'auto' ) {
          G.tn.defaultSize.width.lN[lst[i]] = w;
          G.tn.defaultSize.width.l1[lst[i]] = w;
        }
        else {
          var h = G.tn.settings.height.lN[lst[i]];
          G.tn.defaultSize.width.lN[lst[i]] = h;      // dynamic width --> set height value as default for the width
          G.tn.defaultSize.width.l1[lst[i]] = h;      // dynamic width --> set height value as default
        }
      }
      for( var i = 0; i < lst.length; i++ ) {
        var h = G.tn.settings.height.lN[lst[i]];
        if( h != 'auto' ) {
          // grid or justified layout
          G.tn.defaultSize.height.lN[lst[i]] = h;  //+G.tn.labelHeight.get();
          G.tn.defaultSize.height.l1[lst[i]] = h;  //+G.tn.labelHeight.get();
        }
        else {
          var w = G.tn.settings.width.lN[lst[i]];
          G.tn.defaultSize.height.lN[lst[i]] = w;      // dynamic height --> set width value as default for the height
          G.tn.defaultSize.height.l1[lst[i]] = w;      // dynamic height --> set width value as default
        }
      }

      // default thumbnail sizes levels l1
      for( var i = 0; i < lst.length; i++ ) {
        var w = G.tn.settings.width.l1[lst[i]];
        if( w != 'auto' ) {
          G.tn.defaultSize.width.l1[lst[i]] = w;
        }
        else {
          var h = G.tn.settings.height.l1[lst[i]];
          G.tn.defaultSize.width.l1[lst[i]] = h;      // dynamic width --> set height value as default
        }
      }
      for( var i = 0; i < lst.length; i++ ) {
        var h = G.tn.settings.height.l1[lst[i]];
        if( h != 'auto' ) {
          // grid or justified layout
          G.tn.defaultSize.height.l1[lst[i]] = h;  //+G.tn.labelHeight.get();
        }
        else {
          var w = G.tn.settings.width.l1[lst[i]];
          G.tn.defaultSize.height.l1[lst[i]]= w ;      // dynamic height --> set width value as default
        }
      }
      
    }
    

    //
    function GalleryThemeGetCurrent() {

      var cs=null;
      switch(toType(G.O.galleryTheme)) {
        case 'object':    // user custom color scheme object 
          cs = G.galleryTheme_dark;  // default color scheme
          jQuery.extend(true,cs,G.O.galleryTheme);
          break;
        case 'string':    // name of an internal defined color scheme
          switch( G.O.galleryTheme ) {
            case 'light':
              cs = G.galleryTheme_light;
              break;
            case 'default':
            case 'dark':
            case 'none':
            default:
              cs = G.galleryTheme_dark;
          }
          break;
        default:
          cs = G.galleryTheme_dark;
      }
      return cs;
    }
    
    // ##### BREADCRUMB/THUMBNAIL COLOR SCHEME #####
    function SetGalleryTheme() {
    
      if( typeof G.O.colorScheme  !== 'undefined' ) {
        G.O.galleryTheme = G.O.colorScheme;
      }

      var cs = null;
      var galleryTheme = '';
      switch(toType(G.O.galleryTheme)) {
        case 'object':    // user custom color scheme object 
          cs = G.galleryTheme_dark;  // default color scheme
          jQuery.extend(true,cs,G.O.galleryTheme);
          galleryTheme='nanogallery_gallerytheme_custom_' + G.baseEltID;
          break;
        case 'string':    // name of an internal defined color scheme
          switch( G.O.galleryTheme ) {
            case 'light':
              cs = G.galleryTheme_light;
              galleryTheme='nanogallery_gallerytheme_light_' + G.baseEltID;
              break;
            case 'default':
            case 'dark':
            case 'none':
            default:
              cs = G.galleryTheme_dark;
              galleryTheme='nanogallery_gallerytheme_dark_' + G.baseEltID;
          }
          break;
        default:
          NanoAlert(G, 'Error in galleryTheme parameter.');
          return;
      }

      //var s1='.nanogallery_theme_'+G.O.theme+' ';
      var s1='.' + galleryTheme + ' ';
    
      // navigation bar
      var c = cs.navigationBar;
      var s=s1+'.nGY2Navigationbar { background:'+c.background+'; }'+'\n';
      if( c.border !== undefined && c.border !== '' ) { s+=s1+'.nGY2Navigationbar { border:'+c.border+'; }'+'\n'; }
      if( c.borderTop !== undefined && c.borderTop !== '' ) { s+=s1+'.nGY2Navigationbar { border-top:'+c.borderTop+'; }'+'\n'; }
      if( c.borderBottom !== undefined && c.borderBottom !== '' ) { s+=s1+'.nGY2Navigationbar { border-bottom:'+c.borderBottom+'; }'+'\n'; }
      if( c.borderRight !== undefined && c.borderRight !== '' ) { s+=s1+'.nGY2Navigationbar { border-right:'+c.borderRight+'; }'+'\n'; }
      if( c.borderLeft !== undefined && c.borderLeft !== '' ) { s+=s1+'.nGY2Navigationbar { border-left:'+c.borderLeft+'; }'+'\n'; }
      
      // navigation bar - breadcrumb
      var c = cs.navigationBreadcrumb;
      s+=s1+'.nGY2Breadcrumb { background:'+c.background+'; border-radius:'+c.borderRadius+'; }'+'\n';
      s+=s1+'.nGY2Breadcrumb .oneItem  { color:'+c.color+'; }'+'\n';
      s+=s1+'.nGY2Breadcrumb .oneItem:hover { color:'+c.colorHover+'; }'+'\n';

      // navigation bar - tag filter
      var c = cs.navigationFilter;
      s+=s1+'.nGY2NavFilterUnselected { color:'+c.color+'; background:'+c.background+'; border-radius:'+c.borderRadius+'; }'+'\n';
      s+=s1+'.nGY2NavFilterSelected { color:'+c.colorSelected+'; background:'+c.backgroundSelected+'; border-radius:'+c.borderRadius+'; }'+'\n';
      s+=s1+'.nGY2NavFilterSelectAll { color:'+c.colorSelected+'; background:'+c.background+'; border-radius:'+c.borderRadius+'; }'+'\n';

      // navigation bar - pagination next/previous
      var c = cs.navigationPagination;
      s+=s1+'.nGY2NavPagination { color:'+c.color+'; background:'+c.background+'; border-radius:'+c.borderRadius+'; }'+'\n';
      s+=s1+'.nGY2NavPagination:hover { color:'+c.colorHover+'; }'+'\n';
      
      // thumbnails
      var c = cs.thumbnail;
      // s+=s1+'.nGY2GThumbnail { border-radius: '+c.borderRadius+'; background:'+c.background+'; border-color:'+c.borderColor+'; border-top-width:'+G.tn.opt.Get('borderVertical')+'px; border-right-width:'+G.tn.opt.Get('borderHorizontal')+'px; border-bottom-width:'+G.tn.opt.Get('borderVertical')+'px; border-left-width:'+G.tn.opt.Get('borderHorizontal')+'px;}'+'\n';
      s+=s1+'.nGY2GThumbnail { border-radius: '+c.borderRadius+'; background:'+c.background+'; border-color:'+c.borderColor+'; }'+'\n';
      s+=s1+'.nGY2GThumbnail_l1 { border-top-width:'+G.tn.opt.l1.borderVertical+'px; border-right-width:'+G.tn.opt.l1.borderHorizontal+'px; border-bottom-width:'+G.tn.opt.l1.borderVertical+'px; border-left-width:'+G.tn.opt.l1.borderHorizontal+'px;}'+'\n';
      s+=s1+'.nGY2GThumbnail_lN { border-top-width:'+G.tn.opt.lN.borderVertical+'px; border-right-width:'+G.tn.opt.lN.borderHorizontal+'px; border-bottom-width:'+G.tn.opt.lN.borderVertical+'px; border-left-width:'+G.tn.opt.lN.borderHorizontal+'px;}'+'\n';
      s+=s1+'.nGY2GThumbnailStack { background:'+c.stackBackground+'; }'+'\n';
      // s+=s1+'.nGY2GThumbnailImage { background:'+cs.thumbnail.background+'; background-image:'+cs.thumbnail.backgroundImage+'; }'+'\n';
      s+=s1+'.nGY2TnImgBack { background:'+c.background+'; background-image:'+c.backgroundImage+'; }'+'\n';
      s+=s1+'.nGY2GThumbnailAlbumUp { background:'+c.background+'; background-image:'+c.backgroundImage+'; color:'+cs.thumbnail.titleColor+'; }'+'\n';
      s+=s1+'.nGY2GThumbnailIconsFullThumbnail { color:'+c.titleColor+'; }\n';
      s+=s1+'.nGY2GThumbnailLabel { background:'+c.labelBackground+'; opacity:'+c.labelOpacity+'; }'+'\n';
      s+=s1+'.nGY2GThumbnailImageTitle  { color:'+c.titleColor+'; background-color:'+c.titleBgColor+'; '+(c.titleShadow =='' ? '': 'Text-Shadow:'+c.titleShadow+';')+' }'+'\n';
      s+=s1+'.nGY2GThumbnailAlbumTitle { color:'+c.titleColor+'; background-color:'+c.titleBgColor+'; '+(c.titleShadow =='' ? '': 'Text-Shadow:'+c.titleShadow+';')+' }'+'\n';
      s+=s1+'.nGY2GThumbnailDescription { color:'+c.descriptionColor+'; background-color:'+c.descriptionBgColor+'; '+(c.descriptionShadow =='' ? '': 'Text-Shadow:'+c.descriptionShadow+';')+' }'+'\n';

      // thumbnails - icons
      var c = cs.thumbnailIcon;
      s+=s1+'.nGY2GThumbnailIcons { padding:'+c.padding+'; }\n';
      s+=s1+'.nGY2GThumbnailIcon { color:'+c.color+'; '+(c.shadow =='' ? '': 'Text-Shadow:'+c.shadow+';')+' }\n';
      s+=s1+'.nGY2GThumbnailIconTextBadge { background-color:'+c.color+'; }\n';
      
      // gallery pagination -> dot/rectangle based
      var c = cs.pagination;
      if( G.O.galleryPaginationMode != 'NUMBERS' ) {
        s+=s1+'.nGY2paginationDot { border:'+c.shapeBorder+'; background:'+c.shapeColor+';}\n';
        s+=s1+'.nGY2paginationDotCurrentPage { border:'+c.shapeBorder+'; background:'+c.shapeSelectedColor+';}\n';
        s+=s1+'.nGY2paginationRectangle { border:'+c.shapeBorder+'; background:'+c.shapeColor+';}\n';
        s+=s1+'.nGY2paginationRectangleCurrentPage { border:'+c.shapeBorder+'; background:'+c.shapeSelectedColor+';}\n';
      } else {
        s+=s1+'.nGY2paginationItem { background:'+c.background+'; color:'+c.color+'; border-radius:'+c.borderRadius+'; }\n';
        s+=s1+'.nGY2paginationItemCurrentPage { background:'+c.background+'; color:'+c.color+'; border-radius:'+c.borderRadius+'; }\n';
        s+=s1+'.nGY2PaginationPrev { background:'+c.background+'; color:'+c.color+'; border-radius:'+c.borderRadius+'; }\n';
        s+=s1+'.nGY2PaginationNext { background:'+c.background+'; color:'+c.color+'; border-radius:'+c.borderRadius+'; }\n';
        s+=s1+'.nGY2paginationItemCurrentPage { background:'+c.backgroundSelected+'; }\n';
      }
      
      // gallery more button
      var c = cs.thumbnail;
      // s+=s1+'.nGY2GalleryMoreButtonAnnotation { background:'+c.background+'; border-color:'+c.borderColor+'; border-top-width:'+G.O.thumbnailBorderVertical+'px; border-right-width:'+G.O.thumbnailBorderHorizontal+'px; border-bottom-width:'+G.O.thumbnailBorderVertical+'px; border-left-width:'+G.O.thumbnailBorderHorizontal+'px;}\n';
      s+=s1+'.nGY2GalleryMoreButtonAnnotation { background:'+c.background+'; border-color:'+c.borderColor+'; border-top-width: 1px; border-right-width: 1px; border-bottom-width: 1px; border-left-width: 1px;}\n';
      s+=s1+'.nGY2GalleryMoreButtonAnnotation  { color:'+c.titleColor+'; '+(c.titleShadow =='' ? '': 'Text-Shadow:'+c.titleShadow)+'; }\n';
      
      jQuery('head').append('<style id="ngycs_'+G.baseEltID+'">'+s+'</style>');
      G.$E.base.addClass(galleryTheme);

    };
    
    // ##### VIEWER COLOR SCHEME #####
    function SetViewerTheme( ) {

      if( G.VOM.viewerTheme != '' ) {
        G.VOM.$baseCont.addClass(G.VOM.viewerTheme);
        return;
      }

      if( typeof G.O.colorSchemeViewer  !== 'undefined' ) {
        G.O.viewerTheme = G.O.colorSchemeViewer;
      }

      var cs=null;
      switch(toType(G.O.viewerTheme)) {
        case 'object':    // user custom color scheme object 
          cs = G.viewerTheme_dark;
          jQuery.extend(true, cs, G.O.viewerTheme);
          G.VOM.viewerTheme = 'nanogallery_viewertheme_custom_' + G.baseEltID;
          break;
        case 'string':    // name of an internal defined color scheme
          switch( G.O.viewerTheme ) {
            case 'none':
              return;
              break;
            case 'light':
              cs = G.viewerTheme_light;
              G.VOM.viewerTheme = 'nanogallery_viewertheme_light_' + G.baseEltID;
              break;
            case 'dark':
            case 'default':
              cs = G.viewerTheme_dark;
              G.VOM.viewerTheme = 'nanogallery_viewertheme_dark_' + G.baseEltID;
              break;
          }
          break;
        default:
          NanoAlert(G, 'Error in viewerTheme parameter.');
          return;
      }

      var s1 = '.' + G.VOM.viewerTheme + ' ';
      var s = s1 + '.nGY2Viewer { background:' + cs.background + '; }'+'\n';
      s += s1 + '.nGY2Viewer .toolbarBackground { background:' + cs.barBackground + '; }'+'\n';
      s += s1 + '.nGY2Viewer .toolbar { border:' + cs.barBorder + '; color:' + cs.barColor + '; }'+'\n';
      s += s1 + '.nGY2Viewer .toolbar .previousButton:after { color:' + cs.barColor + '; }'+'\n';
      s += s1 + '.nGY2Viewer .toolbar .nextButton:after { color:' + cs.barColor + '; }'+'\n';
      s += s1 + '.nGY2Viewer .toolbar .closeButton:after { color:' + cs.barColor + '; }'+'\n';
      s += s1 + '.nGY2Viewer .toolbar .label .title { color:' + cs.barColor + '; }'+'\n';
      s += s1 + '.nGY2Viewer .toolbar .label .description { color:' + cs.barDescriptionColor + '; }'+'\n';
      jQuery('head').append('<style>' + s + '</style>');
      G.VOM.$baseCont.addClass(G.VOM.viewerTheme);
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
      
      // array.ngy2removeIf -> removes items from array base on a function's result
      Array.prototype.ngy2removeIf = function(callback) {
        var i = this.length;
        while (i--) {
          if (callback(this[i], i)) {
            this.splice(i, 1);
          }
        }
      };  

      // IE11 for startsWith 
      // thanks to @lichtamberg - https://github.com/lichtamberg
      if (!String.prototype.startsWith) {
        String.prototype.startsWith = function(searchString, position) {
          position = position || 0;
          return this.indexOf(searchString, position) === position;
        };
      }
      
    }
    
    
    // Gallery clicked or toolbar touched -> retrieve & execute action
    function GalleryClicked(e) {
    
      var r = GalleryEventRetrieveElementl(e, false);

      if( r.GOMidx == -1 ) { return 'exit'; }
      
      var idx = G.GOM.items[r.GOMidx].thumbnailIdx;
      if( G.GOM.slider.hostIdx == r.GOMidx ) {
        idx = G.GOM.items[G.GOM.slider.currentIdx].thumbnailIdx;
      }
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
        case 'SHOPPINGCART':
          AddToCart(idx, 'gallery');
          return 'exit';
          break;
        default:
          // all other actions (custom1..10, or anything else)
          var fu = G.O.fnThumbnailToolCustAction;
          if( fu !== null ) {
            typeof fu == 'function' ? fu(r.action, G.I[idx]) : window[fu](r.action, G.I[idx]);
          }
          break;
      }
    }

    // Download an image
    function DownloadImage(idx) {
      if( G.I[idx].mediaKind != 'img' ) { return; }

      
      var url = G.I[idx].src;

      if( G.I[idx].downloadURL != undefined && G.I[idx].downloadURL != '' ) {
        url = G.I[idx].downloadURL;
      }
      
      var a = document.createElement('a');
      a.href = url;
      // a.download = url.split('.').pop();
      a.download = url.split('/').pop();
      a.target = '_blank';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);      
      
    }
    
    // add one image to the shopping cart
    function AddToCart( idx, source ) {
      // increment quantity if already in shopping cart
      var found=false;
      for( var i=0; i<G.shoppingCart.length; i++ ) {
        if( G.shoppingCart[i].idx == idx ) {
          G.shoppingCart[i].qty++;
          ThumbnailBuildToolbarOneCartUpdate( G.I[idx] );
          
          var fu = G.O.fnShoppingCartUpdated;
          if( fu !== null ) {
            typeof fu == 'function' ? fu(G.shoppingCart, G.I[idx], source) : window[fu](G.shoppingCart, G.I[idx], source);
          }
          TriggerCustomEvent('shoppingCartUpdated');
          return;
        }
      }
      
      // add to shopping cart
      if( !found) {
        G.shoppingCart.push( { idx:idx, ID:G.I[idx].GetID(), qty:1} );
        ThumbnailBuildToolbarOneCartUpdate(G.I[idx]);

        var fu=G.O.fnShoppingCartUpdated;
        if( fu !== null ) {
          typeof fu == 'function' ? fu(G.shoppingCart, G.I[idx], source) : window[fu](G.shoppingCart, G.I[idx], source);
        }
        TriggerCustomEvent('shoppingCartUpdated');
      }
    }
    

    // All thumbnails are set to unselected
    function ThumbnailSelectionClear() {
      G.GOM.nbSelected = 0;
      for( var i = 0, nbTn = G.GOM.items.length; i < nbTn ; i++ ) {
        var item = G .I[G.GOM.items[i].thumbnailIdx];
        if( item.selected ) {
          item.selected = false;
          var fu = G.O.fnThumbnailSelection;
          if( fu !== null ) {
            typeof fu == 'function' ? fu(item.$elt, item, G.I) : window[fu](item.$elt, item, G.I);
          }
        }
        item.selected = false;
      }
    }
    
    function ThumbnailSelectionToggle( idx ){
      var item = G.I[idx];
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
      
      item.selected = selected;
      
      ThumbnailSelectionSetIcon( item );
      
      // called when the selection status of an item changed
      var fu=G.O.fnThumbnailSelection;
      if( fu !== null ) {
        typeof fu == 'function' ? fu(item.$elt, item, G.I) : window[fu](item.$elt, item, G.I);
      }
    
    }
    
    function ThumbnailSelectionSetIcon( item ) {
      if( item.$elt == null ) {
        // thumbnail is not built
        return;
      }
      var $sub = item.$getElt('.nGY2GThumbnail');
      var $icon = item.$getElt('.nGY2GThumbnailIconImageSelect');
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

      var currentURL=document.location.protocol + '//' + document.location.hostname + document.location.pathname;
      var newLocationHash = '#nanogallery/' + G.baseEltID + '/';
      if( item.kind == 'image' ) {
        newLocationHash += item.albumID + '/' + item.GetID();
      }
      else {
        newLocationHash += item.GetID();
      }
    
      var content = '<br><br>';
      content += '<div class="nGY2PopupOneItem" style="text-align:center;" data-share="facebook">'   + G.O.icons.shareFacebook +   '</div>';
      content += '<div class="nGY2PopupOneItem" style="text-align:center;" data-share="pinterest">'  + G.O.icons.sharePinterest +  '</div>';
      content += '<div class="nGY2PopupOneItem" style="text-align:center;" data-share="tumblr">'     + G.O.icons.shareTumblr +     '</div>';
      content += '<div class="nGY2PopupOneItem" style="text-align:center;" data-share="twitter">'    + G.O.icons.shareTwitter +    '</div>';
      // content += '<div class="nGY2PopupOneItem" style="text-align:center;" data-share="googleplus">' + G.O.icons.shareGooglePlus + '</div>';
      content += '<div class="nGY2PopupOneItem" style="text-align:center;" data-share="vk">'         + G.O.icons.shareVK +         '</div>';
      content += '<div class="nGY2PopupOneItem" style="text-align:center;" data-share="mail">'       + G.O.icons.shareMail +       '</div>';
      content += '<div class="nGY2PopupOneItem" style="text-align:center;"></div>';
      content += '<input class="nGY2PopupOneItemText" readonly type="text" value="' + currentURL+newLocationHash + '" style="width:100%;text-align:center;">';
      content += '<br>';

      currentURL = encodeURIComponent(document.location.protocol + '//' + document.location.hostname + document.location.pathname + newLocationHash);

      var currentTitle = item.title;
      var currentTn = item.thumbImg().src;
      
      
      Popup('nanogallery2 - share to:', content, 'Center');
      
      G.popup.$elt.find('.nGY2PopupOneItem').on('click', function(e) {
        e.stopPropagation();
        
        var shareURL = '';
        var found = true;
        switch(jQuery(this).attr('data-share').toUpperCase()) {
          case 'FACEBOOK':
            // <a name="fb_share" type="button" href="http://www.facebook.com/sharer.php?u={$url}&media={$imgPath}&description={$desc}" class="joinFB">Share Your Advertise</a>
            //window.open("https://www.facebook.com/sharer.php?u="+currentURL,"","height=368,width=600,left=100,top=100,menubar=0");
            shareURL = 'https://www.facebook.com/sharer.php?u=' + currentURL;
            break;
          case 'VK':
            shareURL = 'http://vk.com/share.php?url=' + currentURL;
            break;
          case 'GOOGLEPLUS':
            shareURL = "https://plus.google.com/share?url=" + currentURL;
            break;
          case 'TWITTER':
            // shareURL="https://twitter.com/share?url="+currentURL+"&text="+currentTitle;
            shareURL = 'https://twitter.com/intent/tweet?text=' + currentTitle + 'url=' + currentURL;
            break;
          case 'PINTEREST':
            // shareURL='https://pinterest.com/pin/create/bookmarklet/?media='+currentTn+'&url='+currentURL+'&description='+currentTitle;
            shareURL = 'https://pinterest.com/pin/create/button/?media=' + currentTn + '&url=' + currentURL + '&description=' + currentTitle;
            break;
          case 'TUMBLR':
            //shareURL='https://www.tumblr.com/widgets/share/tool/preview?caption=<strong>'+currentTitle+'</strong>&tags=nanogallery2&url='+currentURL+'&shareSource=legacy&posttype=photo&content='+currentTn+'&clickthroughUrl='+currentURL;
            shareURL = 'http://www.tumblr.com/share/link?url=' + currentURL + '&name=' + currentTitle;
            break;
          case 'MAIL':
            shareURL = 'mailto:?subject=' + currentTitle + '&body=' + currentURL;
            break;
          default:
            found = false;
            break;
        }
        
        if( found ) {
          window.open(shareURL, "" , "height=550,width=500,left=100,top=100,menubar=0" );
          G.popup.close();
          // $popup.remove();
        }
        
      });
    }
    
    // build a modal popup
    function Popup(title, content, align) {
      var pp =  '<div class="nGY2Popup" style="opacity:0;"><div class="nGY2PopupContent' + align + '">';
      pp    +=  '<div class="nGY2PopupCloseButton" style="font-size:0.9em;">' + G.O.icons.buttonClose + '</div>';
      pp    +=  '<div class="nGY2PopupTitle">' + title + '</div>';
      pp    +=  content;
      pp    +=  '</div></div>';
      
      G.popup.$elt = jQuery(pp).appendTo('body');
      setElementOnTop( G.VOM.$viewer, G.popup.$elt);
      
      G.popup.isDisplayed = true;
      
      var tweenable = new NGTweenable();
      tweenable.tween({
        from:       { o: 0, y: 100 },
        to:         { o: 1, y: 0 },
        easing:     'easeInOutSine',
        duration:   250,
        step:       function (state, att) {
          G.popup.$elt[0].style.opacity = state.o;
          G.popup.$elt[0].style[G.CSStransformName] = 'translateY(' + (state.y) + 'px)';
        }
      });
      
      G.popup.$elt.find('.nGY2PopupCloseButton').on('click', function(e) {
        e.stopPropagation();
        G.popup.close();
      });
      
    }


    function GalleryMouseEnter(e) {
      if( !G.VOM.viewerDisplayed && G.GOM.albumIdx != -1 ) {
        var r = GalleryEventRetrieveElementl(e, true);
        // if( r.action == 'OPEN' && r.GOMidx != -1 ) {
        if( r.GOMidx != -1 ) {
          // var target = e.target || e.srcElement;
          // if( target.getAttribute('class') != 'nGY2GThumbnail' ) { return; }
          ThumbnailHover(r.GOMidx);
        }
      }
    }
    
    function GalleryMouseLeave(e) {
      if( !G.VOM.viewerDisplayed && G.GOM.albumIdx != -1 ) {
        var r = GalleryEventRetrieveElementl(e, true);
        if( r.GOMidx != -1 ) {
          // var target = e.target || e.srcElement;
          // if( target.getAttribute('class') != 'nGY2GThumbnail' ) { return; }
          ThumbnailHoverOut(r.GOMidx);
        }
      }
    }
    
    function GalleryEventRetrieveElementl( e, ignoreSubItems ) {
      var r = { action: 'NONE', GOMidx: -1 };
      
      if( e == undefined ) {
        return r;
      }
      var target = e.target || e.srcElement;
      while( target != G.$E.conTnParent[0] ) {       // loop element parent up to find the thumbnail element
        if( jQuery(target).hasClass('nGY2GThumbnail') ) {
          if( r.action == 'NONE' ) {
            r.action = 'OPEN';
          }
          r.GOMidx = jQuery(target).data('index');
          return r;
        }
        // if( !ignoreSubItems && jQuery(target).hasClass('nGY2GThumbnailIcon') ) {
        if( !ignoreSubItems ) {
          var a = jQuery(target).data('ngy2action');
          if( a != '' && a != undefined ) {
            r.action = a;
          }
        }
        if( target.parentNode == null ) {
          return r;
        }
        target = target.parentNode;
      }
      return r;
    }
    

    // OPEN ONE THUMBNAIL
    function ThumbnailOpen( idx, ignoreSelected ) {
      var item = G.I[idx];
      
      G.GOM.albumIdxLoading = idx;      // store idx -> may be used to display loader on album thumbnail

      var fu = G.O.fnThumbnailClicked;
      if( fu !== null ) {
        typeof fu == 'function' ? fu(item.$elt, item) : window[fu](item.$elt, item);
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
            DisplayPhotoIdx( idx );
          }
          break;
        case 'album':
          if( ignoreSelected === false && G.GOM.nbSelected > 0 ) {
            ThumbnailSelectionToggle( idx );
          }
          else {
            if( G.O.thumbnailAlbumDisplayImage && idx != 0 ) {
              // display album content in lightbox
              DisplayFirstMediaInAlbum( idx );
              return;
            }
            else {
              // display album content in gallery
              DisplayAlbum('-1', item.GetID());
            }
          }
          break;
        case 'albumUp':
          var parent = NGY2Item.Get(G, item.albumID);
          DisplayAlbum('-1', parent.albumID);
          break;
      }
    }
    
    function DisplayFirstMediaInAlbum( albumIdx ) {
      if( G.O.debugMode ) { console.log('#DisplayFirstPhotoInAlbum : '+  albumIdx); }

      var item = G.I[albumIdx];
      
      var l = G.I.length;
      for( var i = 0; i < l; i++ ) {
        if( G.I[i].albumID == item.GetID() ) {
          DisplayPhotoIdx( i );
          return;
        }
      }
      
      // load album content
      AlbumGetContent( item.GetID(), DisplayFirstMediaInAlbum, albumIdx, null );
      
    }
    

    // Open link to original image (new window)
    function OpenOriginal( item ) {
      switch( G.O.kind ) {
        case 'flickr':
          var sU = 'https://www.flickr.com/photos/' + G.O.userID + '/' + item.GetID();
          if( item.albumID != '0' ) {
            sU += '/in/album-' + item.albumID + '/';
          }
          window.open(sU, '_blank');
          break;
        case 'picasa':
        case 'google':
        case 'google2':
          // no more working since Google changed the access to Google Photos in 2017
          // var sU='https://plus.google.com/photos/'+G.O.userID+'/albums/'+item.albumID+'/'+item.GetID();
          // window.open(sU,'_blank');
          // break;
        default:
          var sU = item.responsiveURL();
          window.open(sU, '_blank');
          break;
      }
    }
    
    // ########################################################
    // DISPLAY ONE MEDIA
    // with internal or external viewer
    // ########################################################
    function DisplayPhotoIdx( ngy2ItemIdx ) {

      if( !G.O.thumbnailOpenInLightox ) { return; }

      if( G.O.thumbnailOpenOriginal ) {
        // Open link to original image
        OpenOriginal( G.I[ngy2ItemIdx] );
        return;
      }
        
      var items = [];
//      G.VOM.currItemIdx = 0;
      G.VOM.content.current.vIdx = 0;
      G.VOM.items = [];
      G.VOM.albumID = G.I[ngy2ItemIdx].albumID;
      
      var vimg = new VImg(ngy2ItemIdx);
      G.VOM.items.push(vimg);
      items.push(G.I[ngy2ItemIdx]);
      //TODO -> danger? -> pourquoi reconstruire la liste si d�j� ouvert (back/forward)     
      var l = G.I.length;
      for( let idx = ngy2ItemIdx+1; idx < l ; idx++) {
        let item = G.I[idx];
        if( item.kind == 'image' && item.isToDisplay(G.VOM.albumID) && item.destinationURL == '' ) {
          let vimg = new VImg(idx);
          G.VOM.items.push(vimg);
          items.push(item);
        }
      }
      var last = G.VOM.items.length;
      var cnt = 1;
      for( let idx = 0; idx < ngy2ItemIdx ; idx++) {
        let item = G.I[idx];
        if( item.kind == 'image' && item.isToDisplay(G.VOM.albumID) && item.destinationURL == '' ) {
          let vimg = new VImg(idx);
          vimg.mediaNumber = cnt;
          G.VOM.items.push(vimg);
          items.push(item);
          cnt++;
        }
      }
      for( let i = 0; i < last; i++ ) {
        G.VOM.items[i].mediaNumber = cnt;
        cnt++;
      }
    
      // opens media with external viewer
      var fu = G.O.fnThumbnailOpen;
      if( fu !== null ) {
        typeof fu == 'function' ? fu(items) : window[fu](items);
        return;
      }
    
      // use internal viewer
      if( !G.VOM.viewerDisplayed ) {
        // build viewer and display
        LightboxOpen();
      }
      else {
        // viewer already displayed -> display new media in current viewer
        G.VOM.content.current.$media.empty();
        let item = G.VOM.content.current.NGY2Item();
        var spreloader = '<div class="nGY2ViewerMediaLoaderDisplayed"></div>';
        if( item.mediaKind == 'img' && item.imageWidth != 0 && item.imageHeight != 0 ) {
          spreloader = '<div class="nGY2ViewerMediaLoaderHidden"></div>';
        }
        G.VOM.content.current.$media.append( spreloader + item.mediaMarkup);
        ViewerSetMediaVisibility(G.VOM.content.next, 0);
        ViewerSetMediaVisibility(G.VOM.content.previous, 0);
        if( item.mediaKind == 'img' ) {
          G.VOM.ImageLoader.loadImage(VieweImgSizeRetrieved, item);
        }
        // G.VOM.$mediaCurrent.css({ opacity:0 }).attr('src','');
        // G.VOM.ImageLoader.loadImage(VieweImgSizeRetrieved, G.VOM.NGY2Item(0));
        // G.VOM.$mediaCurrent.children().eq(0).attr('src',G.emptyGif).attr('src', G.VOM.NGY2Item(0).responsiveURL());
        // LightboxDisplay(0, '');
        LightboxDisplay('');
      }
    }
    
    function ViewerZoomStart() {
      if( G.O.viewerZoom && !G.VOM.viewerMediaIsChanged ) {
        var item = G.VOM.content.current.NGY2Item();
        if( item.mediaKind == 'img' && item.imageHeight > 0 && item.imageWidth > 0 ) {
          if( G.VOM.zoom.isZooming === false ) {
            // default zoom
            G.VOM.zoom.userFactor = 1;
            G.VOM.zoom.isZooming = true;
          }
          return true;
        }
      }
      return false;
    }
          
    function ViewerZoomIn( zoomIn ) {
    if( zoomIn ) {
        // zoom in
        G.VOM.zoom.userFactor += 0.1;
        ViewerZoomMax();
      }
      else {
        // zoom out
        G.VOM.zoom.userFactor -= 0.1;
        ViewerZoomMin();
      }
      ViewerMediaSetPosAndZoom();
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
    
    
    
    // Set position and size of all 3 media containers
    function ViewerMediaSetPosAndZoom() {
    
      if( !G.VOM.zoom.isZooming ) {
        G.VOM.zoom.userFactor = 1;
      }
      // window.ng_draf( function() {
        ViewerMediaSetPosAndZoomOne( G.VOM.content.current, true );
        ViewerMediaSetPosAndZoomOne( G.VOM.content.previous, false );
        ViewerMediaSetPosAndZoomOne( G.VOM.content.next, false );
      // });
    }
    

    
    // Media which is not IMG -> center and set size
    function ViewerMediaCenterNotImg( $mediaContainer ) {
      var $media = $mediaContainer.children().eq(1);
			var h = 90;
			if( G.O.viewerGallery != 'none' ) { h -= 10; }
			if( G.O.viewerToolbar.display != 'none' ) { h -= 10; }
      $media.css( {'height': h+'%' });
      $media.css( {'width':  '90%' });
      $media[0].style[G.CSStransformName] = 'translate(0px, "50%") ';
    }
    
    // Set position and size of ONE media container
    function ViewerMediaSetPosAndZoomOne(content_item, isCurrent ) {

      var item = content_item.NGY2Item();
      var $img = content_item.$media;
      

      if( item.mediaKind != 'img' ) {
        ViewerMediaCenterNotImg( $img );
        return;
      }
      
      if( item.imageHeight == 0 || item.imageWidth == 0 ) { 
        // ViewerSetMediaVisibility( item, $img, 0 );
        ViewerSetMediaVisibility( content_item, 0 );
        return;
      }

      // part 1: set the image size
      var zoomUserFactor = isCurrent == true ? G.VOM.zoom.userFactor : 1;
      
      var dpr = 1;
      if( G.O.viewerImageDisplay == 'bestImageQuality' ) {
        dpr = window.devicePixelRatio;
      }
      
      // retrieve the base zoom factor (image fill screen)
      var zoomBaseFactorW = (G.VOM.window.lastWidth  - G.VOM.padding.V) / (item.imageWidth  / dpr);
      var zoomBaseFactorH = (G.VOM.window.lastHeight - G.VOM.padding.H) / (item.imageHeight / dpr);
      var zoomBaseFactor = Math.min(zoomBaseFactorW, zoomBaseFactorH);
      if( zoomBaseFactor > 1 && G.O.viewerImageDisplay != 'upscale' ) {
        // no upscale
        zoomBaseFactor = 1;
      }

      var imageCurrentHeight = (item.imageHeight / dpr) * zoomUserFactor * zoomBaseFactor;
      var imageCurrentWidth  = (item.imageWidth / dpr)  * zoomUserFactor * zoomBaseFactor;
      $img.children().eq(1).css( {'height': imageCurrentHeight });
      $img.children().eq(1).css( {'width':  imageCurrentWidth  });

      // retrieve posX/Y to center image
      var posX = 0;
      if( imageCurrentWidth > G.VOM.window.lastWidth ) {
        posX = -(imageCurrentWidth - G.VOM.window.lastWidth)/2;
      }
      var posY = 0;
      // if( imageCurrentHeight > G.VOM.window.lastHeight ) {
      //   posY = ( imageCurrentHeight - G.VOM.window.lastHeight ) / 2;
      // }
      // posY = 0;   // actually, it seems that the image is always centered vertically -> so no need to to anything
      
      // Part 2: set the X/Y position (for zoom/pan)
      if( isCurrent ) {
        if( !G.VOM.zoom.isZooming ) {
          G.VOM.panPosX = 0;
          G.VOM.panPosY = 0;
        }
        G.VOM.zoom.posX = posX;
        G.VOM.zoom.posY = posY;
        ViewerImagePanSetPosition(G.VOM.panPosX, G.VOM.panPosY, $img, false);
      }
      // else {
        //$img[0].style[G.CSStransformName]= 'translate3D('+ posX+'px, '+ posY+'px, 0) ';
      // }
      else {
        // set the pan position of each media container
        ViewerMediaPanX( G.VOM.swipePosX );
        $img.children().eq(1)[0].style[G.CSStransformName]= 'translate(0px, 0px) rotate('+ item.rotationAngle +'deg)';
      }
      
    }

    // position the image depending on the zoom factor and the pan X/Y position
    // IMG is the only media kind supporting zoom/pan
    function ViewerImagePanSetPosition(posX, posY, imageContainer, savePosition ) {
      if( savePosition ) {
        G.VOM.panPosX = posX;
        G.VOM.panPosY = posY;
      }

      posX += G.VOM.zoom.posX;
      posY += G.VOM.zoom.posY;
      
      // imageContainer.children().eq(1)[0].style[G.CSStransformName]= 'translate('+ posX + 'px, '+ posY + 'px)';
      imageContainer.children().eq(1)[0].style[G.CSStransformName]= 'translate('+ posX + 'px, '+ posY + 'px) rotate('+ G.VOM.content.current.NGY2Item().rotationAngle +'deg)';


    }
    

    // LIGHTBOX
    // display media with internal viewer
    function LightboxOpen( idx ) {

      // G.VOM.viewerDisplayed = true;
      G.GOM.firstDisplay = false;
      
      // remove scrollbar and add right margin with same width as the scrollbar to avoid page reflow
      jQuery('head').append('<style id="nGY2_body_scrollbar_style" type="text/css">.nGY2_body_scrollbar{margin-right: ' + (window.innerWidth - document.documentElement.clientWidth) + 'px;}</style>');
      jQuery("body").addClass("nGY2_body_scrollbar");
        

      G.VOM.$baseCont = jQuery('<div  class="nGY2 nGY2ViewerContainer" style="opacity:1"></div>').appendTo('body');
      
      SetViewerTheme();

      G.VOM.$viewer = jQuery('<div class="nGY2Viewer" style="opacity:0" itemscope itemtype="http://schema.org/ImageObject"></div>').appendTo( G.VOM.$baseCont );
      G.VOM.$viewer.css({ msTouchAction: 'none', touchAction: 'none' });            // avoid pinch zoom

      if( idx == undefined ) {
        G.VOM.content.current.vIdx = 0;
      }
      else {
        G.VOM.content.current.vIdx = idx;
      }
      G.VOM.content.previous.vIdx = G.VOM.IdxNext();
      G.VOM.content.next.vIdx = G.VOM.IdxPrevious();   

      var sMedia = '<div class="nGY2ViewerMediaPan"><div class="nGY2ViewerMediaLoaderDisplayed"></div>' + G.VOM.content.previous.NGY2Item().mediaMarkup + '</div>';    // previous media
      sMedia    += '<div class="nGY2ViewerMediaPan"><div class="nGY2ViewerMediaLoaderDisplayed"></div>' + G.VOM.content.current.NGY2Item().mediaMarkup  + '</div>';    // current media
      sMedia    += '<div class="nGY2ViewerMediaPan"><div class="nGY2ViewerMediaLoaderDisplayed"></div>' + G.VOM.content.next.NGY2Item().mediaMarkup  + '</div>';    // next media

      var sNav = '';
      var iconP = G.O.icons.viewerImgPrevious;
      if( iconP != undefined && iconP != '') {
        sNav += '<div class="nGY2ViewerAreaPrevious ngy2viewerToolAction" data-ngy2action="previous">' + iconP + '</div>';
      }
      var iconN = G.O.icons.viewerImgNext;
      if( iconN != undefined && iconN != '') {
        sNav += '<div class="nGY2ViewerAreaNext ngy2viewerToolAction" data-ngy2action="next">' + iconN + '</div>';
      }

      G.VOM.$content = jQuery('<div class="nGY2ViewerContent">' + sMedia + sNav + '</div>').appendTo( G.VOM.$viewer );

      G.VOM.$buttonLeft = G.VOM.$content.find('.nGY2ViewerAreaPrevious');
      G.VOM.$buttonRight = G.VOM.$content.find('.nGY2ViewerAreaNext');

      var $mediaPan = G.VOM.$content.find('.nGY2ViewerMediaPan');
      G.VOM.content.previous.$media = $mediaPan.eq(0);    // pointer to previous media container
      G.VOM.content.current.$media = $mediaPan.eq(1);     // pointer to current media container
      G.VOM.content.next.$media = $mediaPan.eq(2);        // pointer to next media container

      // position next/previous media
      var vP = G.GOM.cache.viewport;
      G.VOM.content.previous.$media[0].style[G.CSStransformName] = 'translate(-' + vP.w + 'px, 0px)';
      G.VOM.content.next.$media[0].style[G.CSStransformName] = 'translate(' + vP.w + 'px, 0px)';
      
      
      G.VOM.ImageLoader.loadImage( VieweImgSizeRetrieved, G.VOM.content.current.NGY2Item()  );
      G.VOM.ImageLoader.loadImage( VieweImgSizeRetrieved, G.VOM.content.previous.NGY2Item() );
      G.VOM.ImageLoader.loadImage( VieweImgSizeRetrieved, G.VOM.content.next.NGY2Item()  );
      
      G.VOM.padding.H = parseInt(G.VOM.$content.css("padding-left")) + parseInt(G.VOM.$content.css("padding-right"));
      G.VOM.padding.V = parseInt(G.VOM.$content.css("padding-top")) + parseInt(G.VOM.$content.css("padding-bottom"));
      
      // build media toolbar container
      var vtbBg1 = '';
      var vtbBg2 = ' toolbarBackground';
      if( G.O.viewerToolbar.fullWidth ) {
        vtbBg1 = ' toolbarBackground';
        vtbBg2 = '';
      }
      var vtbAlign = 'text-align:center;';
      switch ( G.O.viewerToolbar.align ) {
        case 'left':
          vtbAlign = 'text-align:left;';
          break;
        case 'right':
          vtbAlign = 'text-align:right;';
          break;
      }
      var sTB = '<div class="toolbarContainer nGEvent' + vtbBg1 + '" style="visibility:' +(G.O.viewerToolbar.display ? "visible" : "hidden")+';'+vtbAlign+'"><div class="toolbar nGEvent' + vtbBg2 + '"></div></div>';
      G.VOM.$toolbar = jQuery(sTB).appendTo(G.VOM.$viewer);

      if( G.VOM.toolbarMode == 'min' || (G.O.viewerToolbar.autoMinimize > 0 && G.O.viewerToolbar.autoMinimize >= G.GOM.cache.viewport.w) ) {
        ViewerToolbarForVisibilityMin();
      }
      else {
        ViewerToolbarForVisibilityStd();
      }
      
      // top-left toolbar
      var sTopLeft = '<div class="nGY2ViewerToolsTopLeft nGEvent"><div class="toolbar nGEvent">';
      var sTL = G.O.viewerTools.topLeft.split(',');
      for( var i = 0, sTLL = sTL.length; i < sTLL; i++) {
        sTopLeft += ToolbarAddElt( sTL[i] );
      }
      sTopLeft += '</div></div>';
      G.VOM.$toolbarTL = jQuery(sTopLeft).appendTo(G.VOM.$viewer);

      // top-right toolbar
      var sTopRight = '<div class="nGY2ViewerToolsTopRight nGEvent"><div class="toolbar nGEvent">';
      var sTR = G.O.viewerTools.topRight.split(',');
      for( var i = 0, sTRL = sTR.length; i < sTRL; i++) {
        sTopRight += ToolbarAddElt( sTR[i] );
      }
      sTopRight += '</div></div>';
      G.VOM.$toolbarTR = jQuery(sTopRight).appendTo(G.VOM.$viewer);

      // set the events handler on the toolbars
      ViewerToolsOn();

      // Go to fullscreen mode
      if( ngscreenfull.enabled && G.O.viewerFullscreen ) { 
        ngscreenfull.request();
        G.VOM.viewerIsFullscreen=true;
      }

      // Gallery
      LightboxGalleryBuild();

      setElementOnTop('', G.VOM.$viewer);
      ResizeLightbox(true);
      G.VOM.gallery.Resize();
      G.VOM.timeImgChanged = new Date().getTime();

      // viewer display transition
      G.VOM.$toolbarTL.css('opacity', 0);
      G.VOM.$toolbarTR.css('opacity', 0);
      G.VOM.$buttonLeft.css('opacity', 0);
      G.VOM.$buttonRight.css('opacity', 0);
      if( G.O.viewerGallery != 'none' ) { G.VOM.gallery.$elt.css('opacity', 0); }
      G.VOM.$content.css('opacity', 0);
      G.VOM.$toolbarTR[0].style[G.CSStransformName] = 'translateY(-40px) ';
      G.VOM.$toolbarTL[0].style[G.CSStransformName] = 'translateY(-40px) ';
      G.VOM.$buttonLeft[0].style[G.CSStransformName] = 'translateX(-40px) ';
      G.VOM.$buttonRight[0].style[G.CSStransformName] = 'translateX(40px) ';

      // STEP 1: display main container, including media
      new NGTweenable().tween({
        from:         { opacity: 0, posY: G.VOM.window.lastHeight*.5 },
        to:           { opacity: 1, posY: 0 },
        delay:        10,
        duration:     450,
        easing:       'easeInOutQuint',
        step:         function (state) {
          // lightbox
          G.VOM.$viewer.css('opacity', state.opacity);
          G.VOM.$viewer[0].style[G.CSStransformName] = 'translateY(' + (state.posY) + 'px) ';
          
          // media in lightbox
          G.VOM.$content.css('opacity', state.opacity);
        }
      });
      
      
      // STEP 2: display tools, left/right navigation buttons, gallery
      new NGTweenable().tween({
        from:         { posY: -40, opacity: 0, scale: 3 },
        to:           { posY: 0, opacity: 1, scale: 1 },
        delay:        300,
        duration:     400,
        easing:       'easeInOutQuint',
        step:         function (state) {
          
          // tools
          G.VOM.$toolbarTR[0].style[G.CSStransformName] = 'translateY(' + (state.posY) + 'px) ';
          G.VOM.$toolbarTL[0].style[G.CSStransformName] = 'translateY(' + (state.posY) + 'px) ';
          G.VOM.$buttonLeft[0].style[G.CSStransformName] = 'translateX(' + (state.posY) + 'px) ';
          G.VOM.$buttonRight[0].style[G.CSStransformName] = 'translateX(' + (-state.posY) + 'px) ';
          
          // gallery
          if( G.O.viewerGallery != 'none' ) {
            G.VOM.gallery.$elt.css({ opacity: state.opacity });
            G.VOM.gallery.$elt[0].style[G.CSStransformName] = 'scale('+state.scale+')';
          }
          
        },
        finish: function() {
          G.VOM.viewerDisplayed = true;
          ViewerMediaPanX(0);
          ViewerSetEvents();

          LightboxDisplay('');
          
          if( G.O.slideshowAutoStart ) {
            G.VOM.playSlideshow = false;
            SlideshowToggle();
          }
          
          ViewerToolsUnHide();
          LightboxDisplayFinalize('');
        }
      });


      

      // stop click propagation on media ==> if the user clicks outside of an media, the viewer is closed
      // --> no more supported since v2.0.0
      // G.VOM.$viewer.find('img').on('click', function (e) { e.stopPropagation(); });
      
      
      // ViewerMediaPanX(0);
      // ViewerSetEvents();

      // LightboxDisplay('');
      
      // if( G.O.slideshowAutoStart ) {
        // G.VOM.playSlideshow = false;
        // SlideshowToggle();
      // }
    }
    
    function ViewerEvents() {
      if( !G.VOM.viewerDisplayed || G.VOM.viewerMediaIsChanged ) {
      // if( !G.VOM.viewerDisplayed || G.VOM.viewerMediaIsChanged || G.VOM.content.current.NGY2Item().mediaKind != 'img') {
        // ignore fired event if viewer not displayed or if currently changed (or if current media not an image)
        return false;
      }
      return true;
    }
    
    // VIEWER - BUILD THE THUMBNAILS GALLERY
    function LightboxGalleryBuild() {

			G.VOM.gallery.firstDisplay = true;
	
			if( G.O.viewerGallery != 'none' ) {
	
				var tw = G.O.viewerGalleryTWidth;
				var th = G.O.viewerGalleryTHeight;
				var gutter = 2;
				
				var t = '';
				for( var i=0; i< G.VOM.items.length; i++) {
					var idx = G.VOM.items[i].ngy2ItemIdx;
					var o = G.I[idx];
					var src = (o.thumbImg().src).replace(/'/g, "%27");   // replace single quote with %27
          src = src.replace(/\\/g, '\\\\');     // single backslashes are replaced by double backslashes
					t += '<div class="nGY2VThumbnail" style="width:'+tw+'px;height:'+th+'px;left:'+i*(tw+gutter*2)+'px;background-image: url(&apos;'+src+'&apos;);" data-ngy2_lightbox_thumbnail="true" data-ngy2_idx="' + idx + '" data-ngy2_vidx="' + i + '" ></div>';
				}
				G.VOM.gallery.gwidth = (tw+2*gutter) * G.VOM.items.length;
				G.VOM.gallery.oneTmbWidth = tw+2*gutter;
				var tc = "<div class='nGY2VThumbnailContainer' style='height:"+(th+gutter*2)+"px;left:0;width:"+G.VOM.gallery.gwidth+"px;' data-ngy2_lightbox_gallery='true'>" + t + "</div>";
				G.VOM.gallery.$elt = jQuery('<div class="nGY2viewerGallery" style="display: inline-block;height:'+(th+gutter*2)+'px;left:0;right:0;">'+ tc +'</div>').appendTo(G.VOM.$viewer);
				G.VOM.gallery.$tmbCont = G.VOM.gallery.$elt.find('.nGY2VThumbnailContainer')
				
				G.VOM.gallery.Resize();
				G.VOM.gallery.SetThumbnailActive();
      
			}
    }
    

    // Lightbox gesture handling
    function ViewerSetEvents() {

      if( G.VOM.hammertime == null ) {
      
        G.VOM.hammertime =  new NGHammer.Manager(G.VOM.$baseCont[0],  {
          // domEvents: true,
          recognizers: [
            [NGHammer.Pinch, { enable: true }],
            [NGHammer.Pan, { direction: NGHammer.DIRECTION_ALL }]
          ]
        });
     
        // PAN
        G.VOM.hammertime.on('pan', function(ev) {
          if( !ViewerEvents() ) { return; }

          
          if( G.VOM.panMode == 'off' ) {
            // PAN START -> determine the element to pan
            if( ev.target.dataset.ngy2_lightbox_thumbnail != undefined || ev.target.dataset.ngy2_lightbox_gallery != undefined ){
              G.VOM.panMode = 'gallery';
            }
            else {
              if( G.VOM.zoom.isZooming ) {
                G.VOM.panMode = 'zoom';
              }
              else {
                G.VOM.panMode = 'media';
              }
            }
          }

          // PAN the determined element
          switch( G.VOM.panMode ) {
            case 'zoom':
              // pan zoomed image
              ViewerImagePanSetPosition(G.VOM.panPosX + ev.deltaX, G.VOM.panPosY + ev.deltaY, G.VOM.content.current.$media, false);
              G.VOM.toolsHide();
              break;
              
            case 'media':
              if( Math.abs(ev.deltaY) > G.VOM.panThreshold && Math.abs(ev.deltaX) < G.VOM.panThreshold && !G.VOM.panXOnly ) {
                // pan viewer down/up to close the lightbox
                ViewerMediaPanX( 0 );
                var dist = 0;
                if( ev.deltaY < 0 ) {
                  // pan up
                  dist = Math.max( ev.deltaY, -200);
                }
                else {
                  // pan down
                  dist = Math.min( ev.deltaY, 200);
                }
                G.VOM.$viewer[0].style[G.CSStransformName] = 'translateY(' + dist + 'px) ';
                G.VOM.$viewer.css('opacity', 1-Math.abs(dist)/200/2);
              }
              else {
                // pan media left/right
                if( Math.abs(ev.deltaX) > G.VOM.panThreshold ) {
                  G.VOM.panXOnly = true;
                }
                ViewerMediaPanX( ev.deltaX );
                G.VOM.$viewer[0].style[G.CSStransformName] = 'translateY(0px)';
                G.VOM.$viewer.css('opacity', 1);
              }
              break;
              
            case 'gallery':
              G.VOM.gallery.PanGallery( ev.deltaX );
              break;
          }
          
        });

        // PAN END
        G.VOM.hammertime.on('panend', function(ev) {
          if( !ViewerEvents() ) { return; }

          switch( G.VOM.panMode ) {
            case 'zoom':
              // PAN END in image zoom mode
              G.VOM.timeImgChanged = new Date().getTime();
              ViewerImagePanSetPosition( G.VOM.panPosX+ev.deltaX, G.VOM.panPosY+ev.deltaY, G.VOM.content.current.$media, true);
              break;
            case 'media':
              var panY = false;
              if( !G.VOM.panXOnly ) {
                if( Math.abs(ev.deltaY) > 50 && Math.abs(ev.deltaX) < 50 ) {
                  // close viewer
                  LightboxClose();
                  panY = true;
                }
              }
              if( !panY ) {
                if( Math.abs( ev.deltaX ) < 50 ) {
                  ViewerMediaPanX(0);
                }
                else {
                  ev.deltaX > 50 ? DisplayPreviousMedia( Math.abs(ev.velocityX) ) : DisplayNextMedia( Math.abs(ev.velocityX) );
                }
              }
              G.VOM.panXOnly = false;
              break;
            case 'gallery':
              // PAN END on thumbnail gallery
              G.VOM.gallery.posX += ev.deltaX;
              G.VOM.gallery.PanGallery( 0 );
              G.VOM.gallery.PanGalleryEnd( ev.velocityX );
              break;
          }

          G.VOM.panMode = 'off';
        });
        
				
				// ZOOM FEATURE ENABLED
        if( G.O.viewerZoom ) {

					G.VOM.hammertime.add( new NGHammer.Tap({ event: 'doubletap', taps: 2, interval: 250 }) );
          G.VOM.hammertime.add( new NGHammer.Tap({ event: 'singletap' }) );
          G.VOM.hammertime.get('doubletap').recognizeWith('singletap');
          G.VOM.hammertime.get('singletap').requireFailure('doubletap');

          // single tap -> next/previous media
          G.VOM.hammertime.on('singletap', function(ev) {

						if( !ViewerEvents() ) { return; }
						
						// Gallery on viewer -> click/touch on one thumbnail -> display corresponding image
						if( ev.target.dataset.ngy2_lightbox_thumbnail != undefined ){

							var idx = parseInt(ev.target.dataset.ngy2_idx);
							var vidx = parseInt(ev.target.dataset.ngy2_vidx);

							if( !isNaN(idx) && vidx != G.VOM.content.current.vIdx ) {
                
                if( vidx > G.VOM.content.current.vIdx ) {
                  TriggerCustomEvent('lightboxNextImage');
        
                  // replace the next media with selected media
                  G.VOM.content.next.$media.empty();
                  var nextItem = G.I[idx];
                  G.VOM.content.next.vIdx = vidx;
                  let spreloader = '<div class="nGY2ViewerMediaLoaderDisplayed"></div>';
                  if( nextItem.mediaKind == 'img' && nextItem.imageWidth != 0 && nextItem.imageHeight != 0 ) {
                    spreloader = '<div class="nGY2ViewerMediaLoaderHidden"></div>';
                  }
                  G.VOM.content.next.$media.append( spreloader + nextItem.mediaMarkup );
                  if( nextItem.mediaKind == 'img' ) {
                    G.VOM.ImageLoader.loadImage(VieweImgSizeRetrieved, nextItem);
                  }
                  else {
                    ViewerMediaCenterNotImg( G.VOM.content.next.$media );
                  }
                  LightboxDisplay('nextImage');

                }
                else {
                  TriggerCustomEvent('lightboxPreviousImage');
        
                  // replace the previous media with selected media
                  G.VOM.content.previous.$media.empty();
                  var previousItem = G.I[idx];
                  G.VOM.content.previous.vIdx = vidx;
                  let spreloader = '<div class="nGY2ViewerMediaLoaderDisplayed"></div>';
                  if( previousItem.mediaKind == 'img' && previousItem.imageWidth != 0 && previousItem.imageHeight != 0 ) {
                    spreloader = '<div class="nGY2ViewerMediaLoaderHidden"></div>';
                  }
                  G.VOM.content.previous.$media.append( spreloader + previousItem.mediaMarkup );
                  if( previousItem.mediaKind == 'img' ) {
                    G.VOM.ImageLoader.loadImage(VieweImgSizeRetrieved, previousItem);
                  }
                  else {
                    ViewerMediaCenterNotImg( G.VOM.content.previous.$media );
                  }
                  LightboxDisplay('previousImage');
                }
								return;
							}
						}
						
						
            StopPropagationPreventDefault(ev.srcEvent);
            if( G.VOM.toolbarsDisplayed == false ) {
              debounce( ViewerToolsUnHide, 100, false)();
							G.VOM.singletapTime = new Date().getTime();
            }
            else {
							// toolbars are displayed -> display next/previous media
							if( (new Date().getTime()) - G.VOM.singletapTime < 400 ) { return; }		// to avoid conflict with MOUSEMOVE event

              if( G.VOM.content.current.NGY2Item().mediaKind == 'img' && ev.target.className.indexOf('nGY2ViewerMedia') !== -1 ) {
                var x =0;
								if( ev.srcEvent instanceof MouseEvent ) {
									x = ev.srcEvent.pageX;
								}
								else {
									x = ev.srcEvent.changedTouches[0].pageX;
								}
								if( x < (G.GOM.cache.viewport.w/2) ) {
                  DisplayPreviousMedia();
                }
                else {
                  DisplayNextMedia();
                }
              }
            }
          });
          
          // double tap -> zoom
          G.VOM.hammertime.on('doubletap', function(ev) {
            if( !ViewerEvents() ) { return; }
            StopPropagationPreventDefault(ev.srcEvent);
            
            if( ev.target.className.indexOf('nGY2ViewerMedia') !== -1 ) {
              // double tap only on image
              if( G.VOM.zoom.isZooming ) {
                G.VOM.zoom.isZooming = false;
                // G.VOM.zoom.userFactor = 1;
                ResizeLightbox(true);
              }
              else {
                if( ViewerZoomStart() ) {
                  G.VOM.zoom.userFactor = 1.5;
                  ViewerMediaSetPosAndZoom();
                }
              }
            }
          });
        
          // pinch end
          G.VOM.hammertime.on('pinchend', function(ev) {
            ev.srcEvent.stopPropagation();
            ev.srcEvent.preventDefault();  // cancel  mouseenter event
            G.VOM.timeImgChanged = new Date().getTime();
          });
          G.VOM.hammertime.on('pinch', function(ev) {
            ev.srcEvent.stopPropagation();
            ev.srcEvent.preventDefault();  // cancel  mouseenter event
            
            if( ViewerZoomStart() ) {
              G.VOM.zoom.userFactor = ev.scale;
              ViewerZoomMax();
              ViewerZoomMin();
              ViewerMediaSetPosAndZoom();   // center media
            }
          });
        }
				
				
        else {
					// ZOOM FEATURE DISABLED

					G.VOM.hammertime.add( new NGHammer.Tap({ event: 'singletap' }) );

          // click/tap on image to go to next/previous one
          // G.VOM.hammertime.on('tap', function(ev) {
          G.VOM.hammertime.on('singletap', function(ev) {
            if( !ViewerEvents() ) { return; }
            StopPropagationPreventDefault( ev.srcEvent );
            if( G.VOM.toolbarsDisplayed == false  ){
              // display tools on tap if hidden
              debounce( ViewerToolsUnHide, 100, false)();
							G.VOM.singletapTime = new Date().getTime();
            }
            else {
							// toolbars are displayed -> display next/previous media
							if( (new Date().getTime()) - G.VOM.singletapTime < 400 ) { return; }		// to avoid conflict with MOUSEMOVE event
              if( ev.target.className.indexOf('nGY2ViewerMedia') !== -1 ) {
								var x = 0;
								if( ev.srcEvent instanceof MouseEvent ) {
									x = ev.srcEvent.pageX;
								}
								else {
									x = ev.srcEvent.changedTouches[0].pageX;
								}
                if( x < (G.GOM.cache.viewport.w/2) ) {
                  DisplayPreviousMedia();
                }
                else {
                  DisplayNextMedia();
                }
              }
            }
            
          });
        }
      }
    }


    function StopPropagationPreventDefault(e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // Hide toolbars on user inactivity
    function ViewerToolsHide() {
      if( G.VOM.viewerDisplayed ) {
        G.VOM.toolbarsDisplayed = false;
        ViewerToolsOpacity(0);
      }
    }
    
    function ViewerToolsUnHide() {
			if( G.VOM.viewerDisplayed ) {
        G.VOM.toolbarsDisplayed = true;
        ViewerToolsOpacity(1);
        G.VOM.toolsHide();        // re-init delay before hide tools+gallery 
      }
    }
    
    function ViewerToolsOpacity( op ) {
      if( G.VOM.$toolbar != null ) {
        G.VOM.$toolbar.css('opacity', op);
      }
      if( G.VOM.$toolbarTL != null ) {
        G.VOM.$toolbarTL.css('opacity', op);
      }
      if( G.VOM.$toolbarTR != null ) { 
        G.VOM.$toolbarTR.css('opacity', op);
      }
      
      // next/previous
      G.VOM.$content.find('.nGY2ViewerAreaNext').css('opacity', op);
      G.VOM.$content.find('.nGY2ViewerAreaPrevious').css('opacity', op);
      
      // gallery
      // G.VOM.gallery.$elt.css('opacity', op);
    }
    
    
    
    function ViewerToolsOn() {
      // removes all events
      G.VOM.$viewer.off('touchstart click', '.ngy2viewerToolAction', ViewerToolsAction); 
      
      // action button
      G.VOM.$viewer.on('touchstart click', '.ngy2viewerToolAction', ViewerToolsAction); 
    }

    
    // Actions of the button/elements
    function ViewerToolsAction(e) {
      // delay to avoid twice handling on smartphone/tablet (both touchstart click events are fired)
      if( (new Date().getTime()) - G.timeLastTouchStart < 300 ) { return; }
      G.timeLastTouchStart = new Date().getTime();
      
      var $this = $(this);
      var ngy2action = $this.data('ngy2action');
      if( ngy2action == undefined ) { return; }
      switch( ngy2action ) {
        case 'next':
          StopPropagationPreventDefault(e);
          DisplayNextMedia();
          break;
        case 'previous':
          StopPropagationPreventDefault(e);
          DisplayPreviousMedia();
          break;
        case 'playPause':
          e.stopPropagation();
          SlideshowToggle();
          break;
        case 'zoomIn':
          StopPropagationPreventDefault(e);
          if( ViewerZoomStart() ) { ViewerZoomIn( true ); }
          break;
        case 'zoomOut':
          StopPropagationPreventDefault(e);
          if( ViewerZoomStart() ) { ViewerZoomIn( false ); }
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
          ItemDisplayInfo( G.VOM.content.current.NGY2Item() );
          break;
        case 'close':
          StopPropagationPreventDefault(e);
          if( (new Date().getTime()) - G.VOM.timeImgChanged < 400 ) { return; }
          LightboxClose();
          break;
        case 'download':
          StopPropagationPreventDefault(e);
          DownloadImage(G.VOM.items[G.VOM.content.current.vIdx].ngy2ItemIdx);
          break;
        case 'share':
          StopPropagationPreventDefault(e);
          PopupShare(G.VOM.items[G.VOM.content.current.vIdx].ngy2ItemIdx);
          break;
        case 'linkOriginal':
          StopPropagationPreventDefault(e);
          OpenOriginal( G.VOM.content.current.NGY2Item() );
          break;
        case 'rotateLeft':
          StopPropagationPreventDefault(e);
          ViewerImageRotate(-90);
          break;
        case 'rotateRight':
          StopPropagationPreventDefault(e);
          ViewerImageRotate(90);
          break;
        case 'shoppingcart':
          StopPropagationPreventDefault(e);
          AddToCart( G.VOM.items[G.VOM.content.current.vIdx].ngy2ItemIdx, 'lightbox');
          break;
      }
      
      // custom button
      var fu = G.O.fnImgToolbarCustClick;
      if( ngy2action.indexOf('custom') == 0  && fu !== null ) {
        typeof fu == 'function' ? fu(ngy2action, $this, G.VOM.content.current.NGY2Item() ) : window[fu](ngy2action, $this, G.VOM.content.current.NGY2Item() );
      }
    }

    // rotate displayed image
    function ViewerImageRotate( angle ) {
      var item = G.VOM.content.current.NGY2Item();
      if( item.mediaKind == 'img' ) {
        item.rotationAngle += angle;
        item.rotationAngle = item.rotationAngle % 360;
        if( item.rotationAngle < 0 ) {
          item.rotationAngle += 360;
        }
        ViewerMediaPanX( 0 );
        ViewerMediaSetPosAndZoomOne( G.VOM.content.current, true );
      }
    }
     

    // Display photo infos in popup/modal
    function ItemDisplayInfo( ng2item ) {

      var content = '<div class="nGY2PopupOneItem">' + ng2item.title + '</div>';
      content    += '<div class="nGY2PopupOneItemText">' + ng2item.description + '</div>';
      if( ng2item.author != '' ) {
        content  += '<div class="nGY2PopupOneItemText">' + G.O.icons.user + ' ' + ng2item.author + '</div>';
      }
      if( ng2item.exif.model != '' ) {
        content  += '<div class="nGY2PopupOneItemText">' + G.O.icons.config + ' ' + ng2item.exif.model + '</div>';
      }
      var sexif = G.O.icons.picture + ':';
      if( ng2item.exif.flash != '' || ng2item.exif.focallength != '' || ng2item.exif.fstop != '' || ng2item.exif.exposure != '' || ng2item.exif.iso != '' || ng2item.exif.time != '' ) {
      sexif += '<br>';
      sexif += ng2item.exif.flash == '' ? '' : ' &nbsp; ' + ng2item.exif.flash;
      sexif += ng2item.exif.focallength == '' ? '' : ' &nbsp; ' + ng2item.exif.focallength+'mm';
      sexif += ng2item.exif.fstop == '' ? '' : ' &nbsp; f' + ng2item.exif.fstop;
      sexif += ng2item.exif.exposure == '' ? '' : ' &nbsp; ' + ng2item.exif.exposure+'s';
      sexif += ng2item.exif.iso == '' ? '' : ' &nbsp; ' + ng2item.exif.iso+' ISO';
      if( ng2item.exif.time != '' ) {
        // var date = new Date(parseInt(ng2item.exif.time));
        // sexif += ' &nbsp; '+date.toLocaleDateString();
        sexif += ' &nbsp; ' + ng2item.exif.time;
      }
      }
      else {
        sexif += ' n/a';
      }
      content += '<div class="nGY2PopupOneItemText">' + sexif + '</div>';

      if( ng2item.exif.location != '' ) {
        content += '<div class="nGY2PopupOneItemText">'+G.O.icons.location+' <a href="http://maps.google.com/maps?z=12&t=m&q='+encodeURIComponent(ng2item.exif.location)+'" target="_blank">'+ng2item.exif.location+'</a></div>';
        // embed google map in iframe (no api key required)
        content += '<iframe width="300" height="150" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://maps.google.com/maps?&amp;t=m&amp;q='+encodeURIComponent( ng2item.exif.location ) +'&amp;output=embed"></iframe>';  
      }
      else {
        content += '<div class="nGY2PopupOneItemText">' + G.O.icons.location + ': n/a</div>';
      }

      var r = { title: G.O.icons.viewerInfo, content: content };

      // callback
      var fu = G.O.fnPopupMediaInfo;
      if( fu !== null ) {
        typeof fu == 'function' ? r=fu(ng2item, r.title, r.content) : r=window[fu](ng2item, r.title, r.content);
      }


      Popup( r.title, r.content, 'Left');
   
    }
    

    
    function ToolbarAddElt( elt ) {
      var r = '<div class="ngbt ngy2viewerToolAction ',
      e=elt.replace(/^\s+|\s+$/g, '');    // remove trailing/leading whitespace
      switch( e ) {
        case 'minimizeButton':
        case 'minimize':
          var ic = G.O.icons.viewerToolbarMin;
          if( G.VOM.toolbarMode == 'min' ) {
            ic = G.O.icons.viewerToolbarStd;
          }
          r += 'minimizeButton nGEvent" data-ngy2action="minimize">'+ic+'</div>';
          break;
        case 'previousButton':
        case 'previous':
          r += 'previousButton nGEvent" data-ngy2action="previous">'+ G.O.icons.viewerPrevious +'</div>';
          break;
        case 'pageCounter':
          r += 'pageCounter nGEvent"></div>';
          break;
        case 'nextButton':
        case 'next':
          r += 'nextButton nGEvent" data-ngy2action="next">'+ G.O.icons.viewerNext +'</div>';
          break;
        case 'playPauseButton':
        case 'playPause':
          r += 'playButton playPauseButton nGEvent" data-ngy2action="playPause">'+ G.O.icons.viewerPlay +'</div>';
          break;
        case 'rotateLeft':
          r += 'rotateLeftButton nGEvent" data-ngy2action="rotateLeft">'+ G.O.icons.viewerRotateLeft +'</div>';
          break;
        case 'rotateRight':
          r += 'rotateRightButton nGEvent" data-ngy2action="rotateRight">'+ G.O.icons.viewerRotateRight +'</div>';
          break;
        case 'downloadButton':
        case 'download':
          r += 'downloadButton nGEvent" data-ngy2action="download">'+ G.O.icons.viewerDownload +'</div>';
          break;
        case 'zoomButton':
        case 'zoom':
          r += 'nGEvent" data-ngy2action="zoomIn">'+ G.O.icons.viewerZoomIn +'</div><div class="ngbt ngy2viewerToolAction nGEvent" data-ngy2action="zoomOut">'+ G.O.icons.viewerZoomOut +'</div>';
          break;
        case 'fullscreenButton':
        case 'fullscreen':
          var s = G.O.icons.viewerFullscreenOn;
          if( ngscreenfull.enabled && G.VOM.viewerIsFullscreen ) {
            s = G.O.icons.viewerFullscreenOff;
          }
          r += 'setFullscreenButton fullscreenButton nGEvent" data-ngy2action="fullScreen">'+s+'</div>';
          break;
        case 'infoButton':
        case 'info':
          r += 'infoButton nGEvent" data-ngy2action="info">'+ G.O.icons.viewerInfo +'</div>';
          break;
        case 'linkOriginalButton':
        case 'linkOriginal':
          r += 'linkOriginalButton nGEvent" data-ngy2action="linkOriginal">' + G.O.icons.viewerLinkOriginal + '</div>';
          break;
        case 'closeButton':
        case 'close':
          r += 'closeButton nGEvent" data-ngy2action="close">'+ G.O.icons.buttonClose +'</div>';
          break;
        case 'shareButton':
        case 'share':
          r += 'nGEvent" data-ngy2action="share">'+ G.O.icons.viewerShare +'</div>';
          break;
        case 'label':
          r += '"><div class="label"><div class="title nGEvent" itemprop="name"></div><div class="description nGEvent" itemprop="description"></div></div></div>';
          break;
        case 'shoppingcart':
          r += 'closeButton nGEvent" data-ngy2action="shoppingcart">'+ G.O.icons.viewerShoppingcart +'</div>';
          break;
        default:
          // custom button
          if( e.indexOf('custom') == 0 ) {
            var t = '';
            // content to display from custom script
            var fu = G.O.fnImgToolbarCustInit;
            if( fu !== null ) {
              typeof fu == 'function' ? fu(e) : window[fu](e);
            }
            if( t == undefined || t == '' ) {
              // content from icons
              var n = e.substring(6);
              t = G.O.icons['viewerCustomTool'+n];
            }
            r += 'ngy2CustomBtn ' + e + ' nGEvent" data-ngy2action="' + e + '">' + t + '</div>';
          }
          else {
            r = '';
          }
          break;
      }
      return r;
    }
    
    
    // toggle slideshow mode on/off
    function SlideshowToggle(){
      if( G.VOM.playSlideshow ) {
        window.clearTimeout(G.VOM.playSlideshowTimerID);
        G.VOM.playSlideshow = false;
        G.VOM.$viewer.find('.playPauseButton').html(G.O.icons.viewerPlay);
      }
      else {
        G.VOM.playSlideshow = true;
        DisplayNextMedia();
        G.VOM.$viewer.find('.playPauseButton').html(G.O.icons.viewerPause);
      }
    }

    function ViewerToolbarForVisibilityStd() {
      G.VOM.toolbarMode = 'std';
      
      var sTB = '';
      var t = G.O.viewerToolbar.standard.split(',');
      for( var i = 0, lt = t.length; i < lt; i++) {
        sTB += ToolbarAddElt( t[i] );
      }
      G.VOM.$toolbar.find('.toolbar').html(sTB);
      ViewerToolbarElementContent();
    }
    
    function ViewerToolbarForVisibilityMin() {
      if( G.O.viewerToolbar.minimized == undefined || G.O.viewerToolbar.minimized == '' ) {
        ViewerToolbarForVisibilityStd();
      }
      else {
        G.VOM.toolbarMode = 'min';
        var sTB = '';
        var t = G.O.viewerToolbar.minimized.split(',');
        for( var i = 0, lt = t.length; i < lt; i++) {
          sTB += ToolbarAddElt( t[i] );
        }
        G.VOM.$toolbar.find('.toolbar').html(sTB);
        ViewerToolbarElementContent();
      }
    }
    
    function ViewerToolbarElementContent() {
    
      var vomIdx = G.VOM.content.current.vIdx;
      if( vomIdx == null ) { return; }
      
      var item = G.VOM.content.current.NGY2Item();
    
      // LABEL
      var setTxt = false;
      // set title
      if( item.title !== undefined && item.title != '' ) {
        G.VOM.$viewer.find('.ngy2viewerToolAction').find('.title').html(item.title);
        setTxt = true;
      }
      else {
        G.VOM.$viewer.find('.ngy2viewerToolAction').find('.title').html('');
      }
      // set description
      if( item.description !== undefined && item.description != '' ) {
        G.VOM.$viewer.find('.ngy2viewerToolAction').find('.description').html(item.description);
        setTxt = true;
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
      var viewerMaxImages = G.VOM.items.length;
      if( viewerMaxImages > 0 ) {
        G.VOM.$viewer.find('.pageCounter').html((G.VOM.items[vomIdx].mediaNumber)+'/'+viewerMaxImages);
      }
      
      // custom elements
      var $cu = G.VOM.$viewer.find('.ngy2CustomBtn');
      var fu = G.O.fnImgToolbarCustDisplay;
      if( $cu.length > 0 && fu !== null ) {
        typeof fu == 'function' ? fu($cu, item) : window[fu]($cu, item);
      }
      
      // set event handlers again
      ViewerToolsOn();
    }
    
    // Pan the media container in the lightbox (left/right)
    function ViewerMediaPanX( posX ) {
      G.VOM.swipePosX = posX;
      if( G.CSStransformName == null ) {
        // no pan if CSS transform not supported
        // G.VOM.$mediaCurrent.css({ left: posX }); 
      }
      else {
      
        // pan left/right the current media
        // window.ng_draf( function() {
          G.VOM.content.current.$media[0].style[G.CSStransformName] = 'translate(' + posX + 'px, 0px)';
        // });

        var itemPrevious = G.VOM.content.previous.NGY2Item();
        var itemNext = G.VOM.content.next.NGY2Item();
        
        // next/previous media
        if(  G.O.imageTransition.startsWith('SWIPE') ) {
          if( itemPrevious.mediaTransition() ) {
            ViewerSetMediaVisibility(G.VOM.content.previous, 1);
          }
          if( itemNext.mediaTransition() ) {
            ViewerSetMediaVisibility(G.VOM.content.next, 1);
          }

          var sc = Math.min( Math.max( Math.abs(posX) / G.VOM.window.lastWidth, .8), 1);
          if( G.O.imageTransition == 'SWIPE' ) { sc = 1; }

          if( posX > 0 ) {
            let dir = G.VOM.window.lastWidth;
            if( itemPrevious.mediaTransition() ) {
              // window.ng_draf( function() {
                G.VOM.content.previous.$media[0].style[G.CSStransformName] = 'translate(' + (-dir + posX) + 'px, 0px) scale(' + sc + ')';
              // });
            }
            if( itemNext.mediaTransition() ) {
              // window.ng_draf( function() {
                G.VOM.content.next.$media[0].style[G.CSStransformName] = 'translate(' + (dir) + 'px, 0px) scale(' + sc + ')';
              // });
            }
          }
          else {
            let dir = -G.VOM.window.lastWidth;
            if( itemNext.mediaTransition() ) {
              // window.ng_draf( function() {
                G.VOM.content.next.$media[0].style[G.CSStransformName] = 'translate(' + (-dir + posX) + 'px, 0px) scale(' + sc + ')';
              // });
            }
            if( itemPrevious.mediaTransition() ) {
              // window.ng_draf( function() {
                G.VOM.content.previous.$media[0].style[G.CSStransformName] = 'translate(' + (dir) + 'px, 0px) scale(' + sc + ')';
              // });
            }
          }
        }
        
        
        if(  G.O.imageTransition == 'SLIDEAPPEAR' ) {
          G.VOM.content.previous.$media[0].style[G.CSStransformName] = '';
          G.VOM.content.next.$media[0].style[G.CSStransformName] = '';
          if( posX < 0 ) {
            let o = (-posX) / G.VOM.window.lastWidth;
            if( itemNext.mediaTransition() ) {
              ViewerSetMediaVisibility(G.VOM.content.next, o);
            }
            if( itemPrevious.mediaTransition() ) {
              ViewerSetMediaVisibility(G.VOM.content.previous, 0);
            }
          }
          else {
            let o = posX / G.VOM.window.lastWidth;
            if( itemPrevious.mediaTransition() ) {
              ViewerSetMediaVisibility(G.VOM.content.previous, o);
            }
            if( itemNext.mediaTransition() ) {
              ViewerSetMediaVisibility(G.VOM.content.next, 0);
            }
          }
        }
      }
    }
    
    // Display next image
    function DisplayNextMedia( velocity ) {
      velocity = velocity || 0;
      
      if( G.VOM.viewerMediaIsChanged || ((new Date().getTime()) - G.VOM.timeImgChanged < 300) ) { return; }
      
      TriggerCustomEvent('lightboxNextImage');
      LightboxDisplay('nextImage', velocity);
    };
    
    // Display previous image
    function DisplayPreviousMedia( velocity ) {
      velocity = velocity || 0;

      if( G.VOM.viewerMediaIsChanged || ((new Date().getTime()) - G.VOM.timeImgChanged < 300) ) { return; }
      if( G.VOM.playSlideshow ) {
        SlideshowToggle();
      }
      
      TriggerCustomEvent('lightboxPreviousImage');
      LightboxDisplay( 'previousImage', velocity);
    };



    // Display image (with animation if possible)
    function LightboxDisplay( displayType, velocity ) {

      velocity = velocity || 0;

      if( G.O.debugMode && console.timeline ) { console.timeline('nanogallery2_viewer'); }

      if( G.VOM.playSlideshow ) { window.clearTimeout( G.VOM.playSlideshowTimerID ); }
      
      var current_content_item = null;
      var new_content_item  = null;

      G.VOM.timeImgChanged = new Date().getTime();
      G.VOM.viewerMediaIsChanged = true;
      G.VOM.zoom.isZooming = false;
      ResizeLightbox(true);

      switch( displayType ) {
        case '':
            current_content_item = G.VOM.content.current;
            new_content_item = G.VOM.content.current;
          break;
        case 'previousImage':
            current_content_item = G.VOM.content.current;
            new_content_item = G.VOM.content.previous;
          break;
        default:
            current_content_item = G.VOM.content.current;
            new_content_item = G.VOM.content.next;
      }

      // SetLocationHash( next_ng2item.albumID, next_ng2item.GetID() );
      SetLocationHash( new_content_item.NGY2Item().albumID, new_content_item.NGY2Item().GetID() );

      if( displayType == '' ) {
        // first media -> no transition -> exit
        return;
      }
      
      // animation duration is proportional of the remaining distance
      var vP = G.GOM.cache.viewport;
      var t_easing = '';
      var t_dur = 500 * (vP.w - Math.abs(G.VOM.swipePosX)) / vP.w;
      if( velocity > 0 ) {
        // velocity = pixels/millisecond
         t_dur = Math.min( (vP.w - Math.abs(G.VOM.swipePosX)) / velocity, t_dur);
         t_easing = 'linear';     // use linear to avoid a slow-down in the transition after user swipe
      }
      
        
      // animate the image transition between 2 medias
        
      if( G.CSStransformName == null  ) {
        // no CSS transform support -> no animation
        ViewerSetMediaVisibility(new_content_item, 1);
        ViewerSetMediaVisibility(current_content_item, 1);
        LightboxDisplayFinalize(displayType);
      }
      else {
        switch( G.O.imageTransition ) {
          case 'SWIPE':
          case 'SWIPE2':
            var dir = ( displayType == 'nextImage' ? - vP.w : vP.w );
            new_content_item.$media[0].style[G.CSStransformName] = 'translate(' + (-dir) + 'px, 0px) '

            if( velocity == 0 ) {
              t_easing = G.O.imageTransition == 'swipe' ? 'easeInOutSine' : 'easeOutCubic';
            }
            
            ViewerSetMediaVisibility(G.VOM.content.current, 1);
            G.VOM.content.current.$media[0].style[G.CSStransformName] = 'translate(0px, 0px)';
            ViewerSetMediaVisibility(new_content_item, 1);

            new NGTweenable().tween({
              from:         { t: G.VOM.swipePosX  },
              to:           { t: (displayType == 'nextImage' ? - vP.w : vP.w) },
              attachment:   { dT: displayType, new_content_item: new_content_item, dir: dir, media_transition: new_content_item.NGY2Item().mediaTransition()},
              // delay:        30,
              duration:     t_dur,
              easing:       ( t_easing ),
              step:         function (state, att) {
                // current displayed media
                G.VOM.content.current.$media[0].style[G.CSStransformName] = 'translate(' + state.t + 'px, 0px)';

                // new media
                if( att.media_transition ) {
                  // new media supports transition
                  var sc = Math.min( Math.max( (Math.abs(state.t)) / G.VOM.window.lastWidth, .8), 1);
                  if( G.O.imageTransition == 'SWIPE' ) { sc = 1; }
                  att.new_content_item.$media[0].style[G.CSStransformName] = 'translate(' + (-att.dir+state.t) + 'px, 0px) scale(' + sc + ')';
                }
              },
              finish:       function (state, att) {
                G.VOM.content.current.$media[0].style[G.CSStransformName] = '';
                ViewerSetMediaVisibility(G.VOM.content.current, 0);
                att.new_content_item.$media[0].style[G.CSStransformName] = '';
                LightboxDisplayFinalize(att.dT);
              }
            });
            break;
            
          case 'SLIDEAPPEAR':
          default:
            // var dir=(displayType == 'nextImage' ? - vP.w : vP.w);
            var op = (Math.abs(G.VOM.swipePosX)) / G.VOM.window.lastWidth;
            new_content_item.$media[0].style[G.CSStransformName] = '';
            if( velocity == 0 ) {
              t_easing ='easeInOutSine';
            }
            new NGTweenable().tween({
              from:         { o: op, t: G.VOM.swipePosX },
              to:           { o: 1,  t: (displayType == 'nextImage' ? - vP.w : vP.w) },
              attachment:   { dT: displayType, new_content_item:new_content_item, media_transition: new_content_item.NGY2Item().mediaTransition()  },
              delay:        30,
              duration:     t_dur,
              easing:       t_easing,
              step:         function (state, att) {
                // current media - translate
                G.VOM.content.current.$media[0].style[G.CSStransformName]= 'translate('+state.t+'px, 0px)';

                // new media - opacity
                if( att.media_transition ) {
                  // new media supports transition
                  ViewerSetMediaVisibility(att.new_content_item, state.o);
                }
              },
              finish:       function (state, att) {
                G.VOM.content.current.$media[0].style[G.CSStransformName]= '';
                LightboxDisplayFinalize(att.dT);
              }
            });
            break;
        }
      }
    
    }
  

    function LightboxDisplayFinalize( displayType ) {

      var newVomIdx = 0;
      switch( displayType ) {
        case '':
					// first media to display in lightbox
					newVomIdx = G.VOM.content.current.vIdx;
          break;
        case 'previousImage':
					// previous media
					newVomIdx = G.VOM.content.previous.vIdx;
          break;
        default:
					// next media
					newVomIdx = G.VOM.content.next.vIdx;
      }

			

      G.VOM.content.current.vIdx = newVomIdx;
      G.VOM.content.next.vIdx = G.VOM.IdxNext();
      G.VOM.content.previous.vIdx = G.VOM.IdxPrevious();
			G.VOM.gallery.Resize();
			G.VOM.gallery.SetThumbnailActive();
      
      var ngy2item = G.VOM.content.current.NGY2Item();

      ViewerToolbarElementContent();
      if( G.O.debugMode && console.timeline ) { console.timelineEnd('nanogallery2_viewer'); }

      var fu=G.O.fnImgDisplayed;
      if( fu !== null ) {
        typeof fu == 'function' ? fu(ngy2item) : window[fu](ngy2item);
      }
      
      G.VOM.swipePosX = 0;
      if( displayType != '' ) {
        // not on first media display
        G.VOM.content.current.$media.removeClass('imgCurrent');

        var $tmp = G.VOM.content.current.$media;
        switch( displayType ) {
          case 'nextImage':
            G.VOM.content.current.$media = G.VOM.content.next.$media;
            G.VOM.content.next.$media = $tmp;
            break;
          case 'previousImage':
            G.VOM.content.current.$media =  G.VOM.content.previous.$media;
             G.VOM.content.previous.$media = $tmp;
            break;
        }
      }
      
      G.VOM.content.current.$media.addClass('imgCurrent');
      
      // re-sort the media containers --> current on top
      var $pans = G.VOM.$content.find('.nGY2ViewerMediaPan');
      G.VOM.content.current.$media.insertAfter($pans.last());
      
      if( ngy2item.mediaKind == 'img' && ngy2item.imageWidth == 0 ) {
        ViewerSetMediaVisibility(G.VOM.content.current, 0);
      }
      else {
        G.VOM.content.current.$media.children().eq(0).attr('class', 'nGY2ViewerMediaLoaderHidden');    // hide preloader
        ViewerSetMediaVisibility(G.VOM.content.current, 1);
      }

      
      // set the new NEXT media
      G.VOM.content.next.$media.empty();
      var nextItem = G.VOM.content.next.NGY2Item();
      var spreloader = '<div class="nGY2ViewerMediaLoaderDisplayed"></div>';
      if( nextItem.mediaKind == 'img' && nextItem.imageWidth != 0 && nextItem.imageHeight != 0 ) {
        spreloader = '<div class="nGY2ViewerMediaLoaderHidden"></div>';
      }
      G.VOM.content.next.$media.append( spreloader + nextItem.mediaMarkup );
      ViewerSetMediaVisibility(G.VOM.content.next, 0);
      ViewerSetMediaVisibility(G.VOM.content.previous, 0);
      if( nextItem.mediaKind == 'img' ) {
        G.VOM.ImageLoader.loadImage(VieweImgSizeRetrieved, nextItem);
      }
      else {
        ViewerMediaCenterNotImg( G.VOM.content.next.$media );
      }

      // set the new PREVIOUS media
      G.VOM.content.previous.$media.empty();
      var previousItem = G.VOM.content.previous.NGY2Item();
      spreloader = '<div class="nGY2ViewerMediaLoaderDisplayed"></div>';
      if( previousItem.mediaKind == 'img' && previousItem.imageWidth != 0 && previousItem.imageHeight != 0 ) {
        spreloader = '<div class="nGY2ViewerMediaLoaderHidden"></div>';
      }
      G.VOM.content.previous.$media.append( spreloader + previousItem.mediaMarkup );
      ViewerSetMediaVisibility(G.VOM.content.previous, 0);
      ViewerSetMediaVisibility(G.VOM.content.next, 0);
      if( previousItem.mediaKind == 'img' ) {
        G.VOM.ImageLoader.loadImage( VieweImgSizeRetrieved, previousItem );
      }
      else {
        ViewerMediaCenterNotImg( G.VOM.content.previous.$media );
      }

        
      // slideshow mode - wait until image is loaded to start the delay for next image
      if( G.VOM.playSlideshow ) {
        G.VOM.content.current.$media.children().eq(1).ngimagesLoaded().always( function( instance ) {
          if( G.VOM.playSlideshow ) {
            // in the meantime the user could have stopped the slideshow
            G.VOM.playSlideshowTimerID = window.setTimeout( function(){ DisplayNextMedia(); }, G.VOM.slideshowDelay );
          }
        });
      }
      
      // close viewer when user clicks outside of the image
      // G.VOM.$mediaCurrent.on("click",function(e){
      //  e.stopPropagation();
      //  if( (new Date().getTime()) - G.VOM.timeImgChanged < 400 ) { return; }
      //  StopPropagationPreventDefault(e);
      //  LightboxClose(G.VOM.currItemIdx);
      //  return false;
      // });

      ResizeLightbox();

      G.VOM.viewerMediaIsChanged = false;
      TriggerCustomEvent('lightboxImageDisplayed');
      
    }

    
    // Is fired as soon as the size of an image has been retrieved (the download may not be finished)
    function VieweImgSizeRetrieved(w, h, item, n) {

      item.imageWidth = w;
      item.imageHeight = h;
  
      // image sized retrieved for currently displayed media
      if( G.VOM.content.current.NGY2Item() == item ) {
        // it is the current displayed media
        G.VOM.content.current.$media.children().eq(0).attr('class', 'nGY2ViewerMediaLoaderHidden');    // hide preloader
        ViewerSetMediaVisibility(G.VOM.content.current, 1);
        G.VOM.zoom.userFactor = 1;
      }
      
      if( G.VOM.content.next.NGY2Item() == item ) {   // next media
        G.VOM.content.next.$media.children().eq(0).attr('class', 'nGY2ViewerMediaLoaderHidden');    // hide preloader
      }
      if( G.VOM.content.previous.NGY2Item() == item ) {   // previous media
        G.VOM.content.previous.$media.children().eq(0).attr('class', 'nGY2ViewerMediaLoaderHidden');    // hide preloader
      }
      
      ViewerMediaSetPosAndZoom();

    }

    // Viewer - Set the visibility of the media and it's container
    // function ViewerSetMediaVisibility(item, $media, opacity ) {
    function ViewerSetMediaVisibility( content_item, opacity ) {

			var item = content_item.NGY2Item();
      var $media = content_item.$media;
      
      if( item.mediaKind == 'img' && item.imageWidth == 0 ) {
        // do not display image if width is unknown (--> callback will set the width when know)
        // setting opacity to 0 is not enough -> it is mandatory to change also the visibility to hidden to avoid responds to events (click/touch)
        // $media.children().css({ opacity: 0, visibility: 'hidden' });
        $media.children().eq(1).css({ opacity: 0, visibility: 'hidden' });    // hide media
        // $media.css({ opacity: 0, visibility: 'hidden' });
        return;
      }
      
      if( opacity == 0 ) {
        // setting opacity to 0 is not enough -> it is mandatory to change also the visibility to hidden to avoid responds to events (click/touch)
        // $media.css({ opacity: 0, visibility: 'hidden' });
        $media.children().css({ opacity: 0, visibility: 'hidden' });    // hide media
      }
      else {
        // $media.css({ opacity: opacity, visibility: 'visible' });
        $media.children().css({ opacity: opacity, visibility: 'visible' });      // display media
      }
    }
    
    
    // Close the internal lightbox
    function LightboxClose( vomIdx ) {


      if( vomIdx == undefined ) {
        vomIdx = G.VOM.content.current.vIdx;
      }

      G.VOM.viewerMediaIsChanged = false;

      if( G.VOM.viewerDisplayed ) {

        // set scrollbar visible again
        jQuery("body").removeClass("nGY2_body_scrollbar");
        jQuery("#nGY2_body_scrollbar_style").remove();
        
        if( G.VOM.playSlideshow ) {
          window.clearTimeout( G.VOM.playSlideshowTimerID );
          G.VOM.playSlideshow = false;
        }

        G.VOM.hammertime.destroy();
        G.VOM.hammertime = null;

        if( ngscreenfull.enabled && G.VOM.viewerIsFullscreen ) {
          G.VOM.viewerIsFullscreen = false;
          ngscreenfull.exit();
        }
        
        // G.VOM.$baseCont.hide(0).off().show(0).html('').remove();
        // G.VOM.$baseCont.remove();         // does not work... (?)
        jQuery('.nGY2ViewerContainer').remove();
        G.VOM.$baseCont = null;
        G.VOM.viewerDisplayed = false;

        if( G.O.lightboxStandalone ) { return; }

        if( G.O.thumbnailAlbumDisplayImage ) {
          // content of album displayed directly in lightbox (no gallery display for album content)
          if( vomIdx == null ) {
            // lightbox closed with browser back-button
            // the gallery is already displayed
          }
          else {
            var item = G.I[G.VOM.items[vomIdx].ngy2ItemIdx];
            var parent = NGY2Item.Get(G, item.albumID);
            if( G.GOM.albumIdx != parent.albumID ) {
              // display album only if not already displayed
              DisplayAlbum('-1', parent.albumID);
            }
            else {
              GalleryResize();        
              SetLocationHash( '', '' );
              ThumbnailHoverReInitAll();
            }
          }
            // DisplayAlbum( '-', G.I[G.VOM.items[vomIdx].ngy2ItemIdx].albumID );
        }
        else {
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
        }
        G.VOM.timeImgChanged = new Date().getTime();
      }
    }

    
    // Lightbox resized -> reposition elements
    function ResizeLightbox( forceUpdate ) {
      forceUpdate = typeof forceUpdate !== 'undefined' ? forceUpdate : false;
      
      if( G.VOM.$toolbar === null ) { return; }   // viewer build not finished
      
      
      // window.requestAnimationFrame( function() {    // synchronize with screen
      var windowsW = G.VOM.$viewer.width();
      var windowsH = G.VOM.$viewer.height();
      var $elt = G.VOM.content.current.$media.children().eq(1);
      if( $elt == null || G.VOM.content.current.vIdx == -1 ) { return; }

      if( !forceUpdate && G.VOM.window.lastWidth == windowsW  && G.VOM.window.lastHeight == windowsH ) { return; }
      
      G.VOM.window.lastWidth = windowsW;
      G.VOM.window.lastHeight = windowsH;

      // var $tb = G.VOM.$toolbar.find('.toolbar');
      // var tb_OHt = $tb.outerHeight(true);


      var galleryHeight = 0;
      var cBottom = 0;
			// Height of the thumbnails gallery
			if( G.O.viewerGallery != 'none' ) {
        galleryHeight = G.O.viewerGalleryTHeight + 10;
			}
			if( G.O.viewerGallery == 'bottom' ) {
       cBottom = galleryHeight;
			}

			
      switch( G.O.viewerToolbar.position ) {
        case 'top':
        case 'topOverImage':
          G.VOM.$content.css({height: windowsH, width: windowsW, top: 0  });
          G.VOM.$toolbar.css({top: 0, bottom: ''});
          break;
        // case 'top':
          // windowsH -= tb_OHt;
          // G.VOM.$content.css({height: windowsH, width: windowsW, top: tb_OHt  });
          // G.VOM.$toolbar.css({top: 0});
          // break;
        case 'bottom':
        case 'bottomOverImage':
        default:
          windowsH -= cBottom;
          G.VOM.$content.css({height: windowsH, width: windowsW, bottom: -cBottom, top: 0  });
          G.VOM.$toolbar.css({bottom: galleryHeight});
          break;
        // case 'bottom':
        // default:
          // windowsH -= tb_OHt;
          // G.VOM.$content.css({ width: windowsW, top: 0, bottom: tb_OHt });
          // G.VOM.$toolbar.css({bottom: galleryHeight});
          // break;
      }
			
			
      if( !G.VOM.viewerMediaIsChanged && G.VOM.zoom.isZooming ) {
        ViewerMediaSetPosAndZoom();
      }
      else {
				if( !G.VOM.zoom.isZooming && ( G.VOM.zoom.userFactor != 0 || G.VOM.panPosX != 0 || G.VOM.panPosY != 0 || G.VOM.zoom.posX != 0 || G.VOM.zoom.posY != 0 )) {
					// animate image zoom factor and position back to initial values
					G.VOM.zoom.isZooming= true;		// activate zooming temporarily
          new NGTweenable().tween({
            from:           { userFactor: G.VOM.zoom.userFactor, panPosX: G.VOM.panPosX, panPosY: G.VOM.panPosY, zoomPosX: G.VOM.zoom.posX, zoomPosY: G.VOM.zoom.posY },
            to:           { userFactor: 1, panPosX: 0, panPosY: 0, zoomPosX: 0, zoomPosY: 0 },
            easing:       'easeInOutSine',
            delay:        0,
            duration:     150,
            step:         function (state) {
							G.VOM.zoom.userFactor = state.userFactor;
							G.VOM.panPosX = state.panPosX;
							G.VOM.panPosY = state.panPosY;
							G.VOM.zoom.posX = state.zoomPosX;
							G.VOM.zoom.posY = state.zoomPosY;
							ViewerMediaSetPosAndZoom();
            },
            finish:       function (state) {
							G.VOM.zoom.isZooming=false;
            }
          });
			
				}
				else {
					G.VOM.zoom.userFactor = 1;
					G.VOM.zoom.isZooming = false;
					G.VOM.panPosX = 0;
					G.VOM.panPosY = 0;
					G.VOM.zoom.posX = 0;
					G.VOM.zoom.posY = 0;
					ViewerMediaSetPosAndZoom();
				}
      }
    }

		// Retrieve the first parent element which is scrollable
		// source: ncubica - https://stackoverflow.com/questions/35939886/find-first-scrollable-parent
		// returns null if nothing found
		function getScrollableParent (node) {
			const regex = /(auto|scroll)/;
			const parents = (_node, ps) => {
				if (_node.parentNode === null) { return ps; }
				return parents(_node.parentNode, ps.concat([_node]));
			};

			const style = (_node, prop) => getComputedStyle(_node, null).getPropertyValue(prop);
			const overflow = _node => style(_node, 'overflow') + style(_node, 'overflow-y') + style(_node, 'overflow-x');
			const scroll = _node => regex.test(overflow(_node));

			const scrollParent = (_node) => {
				if (!(_node instanceof HTMLElement || _node instanceof SVGElement)) {
					return undefined;
				}

				const ps = parents(_node.parentNode, []);

				for (let i = 0; i < ps.length; i += 1) {
					if( ps[i] === document.body ) {
						return null;
					}
					if (scroll(ps[i])) {
						return ps[i];
					}
				}

				return document.scrollingElement || document.documentElement;
			};

			return scrollParent(node);
		};



    /** @function BuildSkeleton */
    /** Build the gallery structure **/
    function BuildSkeleton() {

		
      // store markup if defined
      // var $elements = G.$E.base.children('a');
      var $elements = G.$E.base.children();
      if( $elements.length > 0 ) {
        G.O.$markup = $elements;
      }
    
      if( !G.O.lightboxStandalone ) {
        G.$E.base.text('');
        G.$E.base.addClass('ngy2_container');
      
        // RTL or LTR
        // var sRTL='';
        // if( G.O.RTL ) {
          // sRTL = 'style="text-align:right;direction:rtl;"';
        // }
      
        // theme
        G.$E.base.addClass(G.O.theme)
        // gallery color scheme
        SetGalleryTheme();

        // Hide icons (thumbnails and breadcrumb)
        if( G.O.thumbnailLabel.get('hideIcons') ) {
          G.O.icons.thumbnailAlbum = '';
          G.O.icons.thumbnailImage = '';
        }

        // Navigation bar
        var styleNavigation="";
        if( G.O.navigationFontSize != undefined && G.O.navigationFontSize != '' ) {
          styleNavigation=' style="font-size:'+G.O.navigationFontSize+';"';
        }      
        G.$E.conNavigationBar = jQuery('<div class="nGY2Navigationbar" '+styleNavigation+'></div>').appendTo(G.$E.base);

        // pre-loader
        G.$E.conLoadingB = jQuery('<div class="nanoGalleryLBarOff"><div></div><div></div><div></div><div></div><div></div></div>').appendTo(G.$E.base);

        // gallery
        G.$E.conTnParent = jQuery('<div class="nGY2Gallery"></div>').appendTo( G.$E.base );
        G.$E.conTn = jQuery('<div class="nGY2GallerySub"></div>').appendTo( G.$E.conTnParent );

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
        G.$E.conTnBottom = jQuery('<div class="nGY2GalleryBottom" '+styleNavigation+'></div>').appendTo( G.$E.conTnParent );
        
        // portable edition
        if( G.O.portable ) {
          // http://www.picresize.com/
          // http://base64encode.net/base64-image-encoder
          // var logo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAWCAYAAAA4oUfxAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAAB3RJTUUH4QMPBwY6mxZgsAAABTFJREFUSMe1ll9oVGcaxn/fd86ZSWbSkEBMiWNdTTfRxiVbXFiU1bjKGqNexlURKys0tHqXpQZ64Sq4FxKqFy4qFSm9kA1FHNhFISgJqFCd6lL/YC7M3jhrJv5JmGSSMzPnzDnfuxdpZtP4b1vaF154P3gPD+/zPC/nVSKiAQOsBj7O5XK/nZiYeEtELH6iUEqFNTU1U9XV1d8AnwNfA1qJCMCfHz169NcjR45UXL16VWWzWQnD0PxU4JZl6draWtXW1iYHDx4sLlmy5C/AZwRB0JVOpyWRSHhACMjPmOHChQuL6XRagiDoUiIyumvXrpq+vr6obduqs7OTjRvbsbSFUgqUgKjyFG5+mlKpVH6LCMYYRAQRQSmF1hqtNd+xijGGVCpFMpkkCALZuXOn19fXN6Gmp6dNc3NzMDo66nR2dnL+/Hm+Ov933PwUAPHKagqei4gBFNs7dxGPx38U/du2bSOZTNLQ0FB6+PChbWez2WI+n3dEhI3tf+Det0N8de0Imz9YQWHa48u/3afjgxbqEpUM/es/uF8W+fijffi+TywWQ0S4fv06t2/fJpfLsXjxYtauXUtTUxNBECAihGFIJBJh1apVXLhwgXw+r7LZbNGeYU7MLD1BEPCLxkWs+HUT+SmPJY0TvPerd6l/J05YcLCGHWzbxrZtHjx4wP79+7l27dr3Jqyurqarq4ujR49i2zYAWmvCMJyVygCiZ7dh9kOtNb5XopD3KBQ8fL9EseBRyHsUCz6zS3Dnzh3WrVtXBq6oqGDBggUA5HI5jh07xo4dOzDmf0ujVBlGAWjmhTGC41hEow6RiI3j2DgRh0jUxonYWJaFGGHPnj2Mj49jWRYHDhzg7t27DA0NMTAwwOrVqwFIJpOcOHECx3Fe6oEXwG3bYux5ltHHz3mSGePpk+c8yczUI+knVFVVcePmDe7fvw9AT08Pvb29NDc3U1dXx4YNG7h8+TItLS1orTl58iT5fL68Ga8En55yWb6iifff/iPD/0iQGfglG3/zJ6a+beHf/3yH6Mjv+P269Vy5cgWlFDU1NXR3dxOGYdlcnudRVVXFvn37MMaQTqcZHh5+Kbg99zHjSodPuj997cqMjY0hItTW1hKPx9FalzW1LIswDFm0aBEAQRDguu6bJ581hOd5GBNiTEgYhuXa8z1EhIaGBgAymQzpdBqlFKVSiTCc6bcsi5s3bwJQWVlJfX39fMO9XHMAy7LQeibn1o7toJSio6MDAN/36e7uxvd9IpEIlmURjUZJpVKcOXMGpRStra0sXbr0peDfo30+LS+4U2uMMaxcuZLdu3dz7tw5+vv7aWtrY+/evdTX13Pr1i1OnTrF5OQkAIcPH8ayrNeCvx51njTGGE6fPk0mk2FwcJBUKkUqlXqh9/jx42zatKnMzJzhBEArpZT+zjGWZSEiBEHwypzVtbKykosXL3Lo0CEaGxvLpovFYqxZs4ZLly6VJQnDEBEpM6C11kopheu6JpFI+Fpr2bJli/zYGBkZkeHhYZmcnHxlz9atW0VrLYlEwndd19ixWOzx5s2b3z579qzp7+/X7e3ttLa2Yox5QaP5MfenEY1G0VoTBAHFYhFjTJlJrTX37t1jYGAAY4zp6OiQWCz2mCAItj979kyWL1/uAwE/7zERLFu2zH/69KkEQbB99ozaOz4+fqy3t7d2cHAwdF1XKaXe6P7/16AiQjwel/Xr1+uenp6Jurq6T4Av1JwD8j3gQ2BVsVh8S72J8x8QIiIVFRVTQAo4CwwB+r93qCLI9wKZ8AAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAxNy0wMy0xNVQwNzowNjo1OC0wNDowMBNQsyUAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMTctMDMtMTVUMDc6MDY6NTgtMDQ6MDBiDQuZAAAAAElFTkSuQmCC';
          var logo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAYCAYAAACbU/80AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAAB3RJTUUH4QgDBCAWVVC/hwAABRxJREFUSMetll9oVFcexz/nnDvJRBmSzWTrmD9uNGZsHta0/qFIFQTxRcnCBgTFNlX0YR8W+1AK9lGwCBJYgn0KKr5136S4gpUQTR4caJRslcxYWV3iaphQapJJppO5957z60Mmk4mN1q75wg/OPefc+/v9vt/fueenKEFEqICqsNWAVNiCA7XwaS0iZeejo6OIiCltdIBdJXMLOYp5/PjxsoTVS5nr0mYDJIE/lObeBhaYAn4oJbboAwBvBedHJicnPx8YGGh/8eJF1dvKoJSShoYGf//+/Zl4PP4l8M2yIEoSLErx6c2bN6W1tXVRglWzLVu2SCqVEhE5LiI457SIoEREW2udMaZtcnLy+2QyWZ3L5XRHR4f+4MNdoBUahUJhcWilmZ/NE4ZhOQHn3LIi1lqjtS6vjY6O8uTJE9vc3MyDBw+mYrHYn0Uk63me8gCtlHLA7uHh4bW5XC7oePddPTQ8xHffDjM/PYe3thqMws35iAcHPj5ENBp9Yxmy2Sw7d+40z549C+7du9ewb9++D6y13wDaK+kE0DAzMyNKKbXtvfd5EfzM+Ef/4C+8x23+wzPm+IhtfMf3/Ksuyl+7u9FaY63l+vXrpFIpCoUCmzdvpquri9bWVoIgQClFIpFg48aNPH/+XE9NTQkQLTGmvEXKRERprZWIEIYhQRjQbN6hmUb+tCaPNnM055v40f3If7XBGMPT8af0fNLD0NDQsozPnDlDb28vx44dIwxDRARrLSKCKmUbiUQQkWWnoLJ20UpjFYAjVA6rBJTFV5ZIJIIfBBw4eICxsTHq6uo4dOgQ8XicgYEB7t69y/Hjx4nH43R1dVHB8q+w4hlXSmGd5edwmjCco5DLkZ+aJvTnyIdTrFmzhn9+/TVjY2M0NTVx+/Zt+vv7OXfuHKlUip6eHgBOnz6N7/vlYl0JKzIw78/T+sdGbn6yjf5ZS2HtJgIP+mcC5kySI1uSXPjqAlprTp06RWdnJ8ViEaUUVVVVnD9/nqtXr5LJZHj48CFbt279fQEEYUisZi2fXel9bWU750gmkwRBgNYaz/Ow1lJfX088Hmd2dpZcLvdaBl4pgQChH4B1iHU4a8E6Qj9ARGhpaUFrzeDgIJFIBGMM1lqMMWQyGSYmJohEIqxfv/7314CIoADtGTAaZTTaLI2VUhw+fBjnHBcvXuTy5cs45/A8j3Q6zcmTJ/F9n71799LW1rbgSOs3D+B1lBljcM7R3d3N0aNHKRQKnDhxgs7OTnbt2sX27dsZGRkhHo/T19e3+Kt/fQ1YawFwzolSCs/zUEqVtX1VcJcuXSKRSNDf3086nS6v79mzh76+Pjo6OigWi1RXV2OMWZC29PL8/PxSAL7vE41Gf4rFYkpEePToEb7vU1VVxW+ht7eXs2fPcv/+fQqFAps2baKlpaW8Xl1dTS6XY3x8HBFxtbW1BiiW4hAlInp8fNxt2LChPZvN/ru9vT2Sz+e93bt3qx07diwrzJWYcM5RU1NDNBots5bP53HOlS+kO3fuMDIy4hKJhKTT6ena2tqtxWJxoqamRr98HX9x7do1qaurExYaiXCVzK5bt04GBwdFRP728nVcWZAO+Hsmk/nsxo0bTTMzM5FXHZ83hYhQX1/vHzx48H9tbW1ngSsVvpYCmJ2dJRaLKRbapjpgOxB7K+9LmAbuAnOAnpiYcI2NjUsRLlo2myUMQ1M5t5rmnDO3bt1aNlfmd4W2XL/0/H8pUDF2rNCW/wLRuCkxx8V6wgAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAxNy0wOC0wM1QwNDozMjoyMi0wNDowMO7mdkwAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMTctMDgtMDNUMDQ6MzI6MjItMDQ6MDCfu87wAAAAAElFTkSuQmCC';
          var st = "font-weight:bold !important;color: #FF0075 !important;font-size: 14px !important;text-transform: lowercase !important;cursor:pointer !important;text-align: center !important;Text-Shadow: #000000 1px 0px 0px, #000000 1px 1px 0px, #000000 1px -1px 0px, #000000 -1px 1px 0px, #000000 -1px 0px 0px, #000000 -1px -1px 0px, #000000 0px 1px 0px, #000000 0px -1px 0px !important;";
          G.$E.ngy2i=jQuery('<div class="nGY2PortInfo"><a href="http://nano.gallery" target="_blank" title="nanogallery2 | easy photo gallery for your website" style="' + st + '"><img src="' + logo + '" style="height:32px !important;width:initial !important;box-shadow: none !important;vertical-align: middle !important;"/> &nbsp; nanogallery2</a></div>').appendTo(G.$E.base);
          
          G.$E.ngy2i.find('a').on({
            mouseenter: function () {
              jQuery(this).attr('style', st);
            },
            mouseleave: function () {
              jQuery(this).attr('style', st);
            }
          });
        }
      }
      
      // Error console
      G.$E.conConsole = jQuery('<div class="nGY2ConsoleParent"></div>').appendTo(G.$E.base);

      // i18n translations
      i18n();

      if( !G.O.lightboxStandalone ) {
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

      if( !G.O.lightboxStandalone ) {
        G.$E.conTnParent.on({
          mouseenter: GalleryMouseEnter,
          mouseleave: GalleryMouseLeave
        }, ".nGY2GThumbnail");    //pass the element as an argument to .on
      
        // G.GOM.hammertime = new NGHammer(G.$E.conTn[0], { touchAction: 'none' });
        G.GOM.hammertime = new NGHammer( G.$E.conTn[0] );
        // G.GOM.hammertime.domEvents = true;
      
        
        // PAN on gallery (pagination)
        G.GOM.hammertime.on('pan', function(ev) {
          if( !G.VOM.viewerDisplayed ) {
            if( G.O.paginationSwipe && G.layout.support.rows && G.galleryDisplayMode.Get() == 'PAGINATION' ) {
              if( Math.abs(ev.deltaY) > G.GOM.panThreshold ) {
                G.GOM.panYOnly = true;
              }
              if( !G.GOM.panYOnly ) {
                G.$E.conTn.css( G.CSStransformName , 'translate('+(ev.deltaX)+'px,0px)');
              }
            }
          }
        });
        G.GOM.hammertime.on('panend', function(ev) {
          if( !G.VOM.viewerDisplayed ) {
            if( G.O.paginationSwipe && G.layout.support.rows && G.galleryDisplayMode.Get() == 'PAGINATION' ) {
              if( !G.GOM.panYOnly ) {
                if( ev.deltaX > 50 ) {
                  paginationPreviousPage();
                  return;
                }
                if(  ev.deltaX < -50 ) {
                  paginationNextPage();
                  return;
                }
              }
              G.GOM.panYOnly = false;
              G.$E.conTn.css( G.CSStransformName , 'translate(0px,0px)');
              // pX=0;
            }
          }
        });
        // tap on gallery
        G.GOM.hammertime.on('tap', function(ev) {
          if( !G.VOM.viewerDisplayed ) {
            ev.srcEvent.stopPropagation();
            ev.srcEvent.preventDefault();  // cancel  mouseenter event

            if( ev.pointerType == 'mouse') {
              if( GalleryClicked(ev.srcEvent) == 'exit' ) { return; }
            }
            else {
              var r = GalleryEventRetrieveElementl(ev.srcEvent, false);
              if( r.GOMidx == -1 ) { return; }
              if( r.action != 'NONE' && r.action != 'OPEN' ) {
                // toolbar touched --> execute action
                GalleryClicked(ev.srcEvent);
                return;
              }
              
              if( G.GOM.slider.hostIdx == r.GOMidx ) {
                // touch on thumbnail slider -> open immediately
                ThumbnailHoverOutAll();
                ThumbnailOpen(G.GOM.items[G.GOM.slider.currentIdx].thumbnailIdx, true);
                return;
              }

              if( (G.GOM.curNavLevel == 'l1' && G.O.touchAnimationL1 == false) ||  (G.GOM.curNavLevel == 'lN' && G.O.touchAnimation == false) ) {
                // open on single touch (no hover animation)
                ThumbnailOpen(G.GOM.items[r.GOMidx].thumbnailIdx, true);
                return;
              }
              
              if( G.O.touchAutoOpenDelay > 0 ) {
                // open on single touch after end of hover animation (=defined delay)
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
          }
        });
      
        // browser location hash management
        if( G.O.locationHash ) {
          // jQuery(window).bind( 'hashchange', function() {
            // ProcessLocationHash();
          // });
          jQuery(window).on('hashchange.nanogallery2.' + G.baseEltID, function() {ProcessLocationHash();} );
        }
      }
      
      // Page resize / orientation change
      jQuery(window).on('resize.nanogallery2.' + G.baseEltID + ' orientationChange.nanogallery2.' + G.baseEltID, debounce( ResizeWindowEvent, G.O.eventsDebounceDelay, false) );
      
      // Event page scrolled
      jQuery(window).on('scroll.nanogallery2.' + G.baseEltID, debounce( OnScrollEvent, G.O.eventsDebounceDelay, false) );

      if( !G.O.lightboxStandalone ) {
        // Scroll event on first scrollable parent element
        G.$E.scrollableParent = getScrollableParent( G.$E.base[0] );
        var sp = getScrollableParent( G.$E.base[0] );
        if( sp !== null ) {
          G.$E.scrollableParent = jQuery( sp );
          G.$E.scrollableParent.on('scroll.nanogallery2.' + G.baseEltID, debounce( OnScrollEvent, G.O.eventsDebounceDelay, false) );
        }
      }
			
      // lightbox: hide tools/gallery after defined delay
      G.VOM.toolsHide = debounce( ViewerToolsHide, G.O.viewerHideToolsDelay, false );
      
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
              case 40:    // DOWN
              case 38:    // UP
                LightboxClose();
                break;
              case 32:    // SPACE
              case 13:    // ENTER
                SlideshowToggle();
                break;
              case 39:    // RIGHT
              case 33:    // PAGE UP
                DisplayNextMedia();
                break;
              case 37:    // LEFT
              case 34:    // PAGE DOWN
                DisplayPreviousMedia();
                break;
              case 35:    // END
              case 36:    // BEGIN
            }
          }
        }
      });
      
      // mouse wheel to zoom in/out the image displayed in the internal lightbox
      jQuery(window).bind('mousewheel wheel', function(e){

        if( G.VOM.viewerDisplayed && G.VOM.content.current.NGY2Item().mediaKind == 'img' ) {

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
      
      // mouse move -> unhide lightbox toolbars
      jQuery(window).bind('mousemove', function(e){
        if( G.VOM.viewerDisplayed ) {
					if( G.VOM.toolbarsDisplayed == false ) {
						G.VOM.singletapTime = new Date().getTime();		// to avoid conflict with SINGLETAP event
						debounce( ViewerToolsUnHide, 100, false )();
					}
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

      var curGal = '#nanogallery/' + G.baseEltID + '/',
      newLocationHash = location.hash;
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
          G.locationHashLastUsed = '';
          if( G.O.debugMode ) { console.log('new3 G.locationHashLastUsed: ' + G.locationHashLastUsed); }
          DisplayAlbum('', '0');
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
      if( !G.O.locationHash || G.O.lightboxStandalone ) { return false; }

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
    
    
		// WINDOW RESIZE EVENT
    function ResizeWindowEvent() {
      CacheViewport();

			var l = G.GOM.curNavLevel;
			var w = G.GOM.curWidth;
			
      if( G.VOM.viewerDisplayed ) {
				// lightbox
        ResizeLightbox();
        G.VOM.gallery.Resize();
      }
      else {
				// gallery
        if( G.galleryResizeEventEnabled ) {
          var nw = RetrieveCurWidth();

					if( G.GOM.albumIdx != -1 ) {

						// check if the gallery needs to be rendered again because the width changed
						
            var s = G.tn.settings;
						if( G.layout.engine == "MOSAIC") {
							// Mosaic layout
							if( JSON.stringify(s.mosaic[l][w]) !== JSON.stringify(s.mosaic[l][nw]) ) {
								// mosaic definition changed
								G.GOM.curWidth = nw;
								G.GOM.pagination.currentPage = 0;
								GalleryRender( G.GOM.albumIdx );
                return;
							}
						}
						else {
							// other layouts
							if( s.height[l][w] != s.height[l][nw] || s.width[l][w] != s.width[l][nw] || s.gutterHeight[l][w] != s.gutterHeight[l][nw]  || s.gutterWidth[l][w] != s.gutterWidth[l][nw]  ) {
								// thumbnail size / gutter size changed --> render the gallery with the new values
								G.GOM.curWidth = nw;
								//G.layout.SetEngine();
								G.GOM.pagination.currentPage = 0;
								GalleryRender( G.GOM.albumIdx );
                return;
							}
						}
						// return;
          }
          // else {
            GalleryResize();
          // }
        }
      }
    }
    
     

		// SCROLL EVENT -> on WINDOW or SCROLLABLE PARENT CONTAINER
    function OnScrollEvent() {
			if( !G.VOM.viewerDisplayed ) {
        GalleryResizeOnScrollEvent();
      }
    }
		
    // the gallery may currently be refreshed, so ensure that at the end of the refresh, the gallery is refreshed again because the page may have been scrolled in the meantime
    function GalleryResizeOnScrollEvent() {
      if( G.galleryResizeEventEnabled == false) {
        window.setTimeout(GalleryResizeOnScrollEvent, 10);  // check again in 10ms
      } else {
        GalleryResize();
      }
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
      var vpW = G.GOM.cache.viewport.w;
      
      if( G.O.breakpointSizeSM > 0 && vpW < G.O.breakpointSizeSM) { return 'xs'; }
      if( G.O.breakpointSizeME > 0 && vpW < G.O.breakpointSizeME) { return 'sm'; }
      if( G.O.breakpointSizeLA > 0 && vpW < G.O.breakpointSizeLA) { return 'me'; }
      if( G.O.breakpointSizeXL > 0 && vpW < G.O.breakpointSizeXL) { return 'la'; }
      
      return 'xl';
    }

    
    /** @function browserNotification */
    function browserNotification() {
      var m = 'Your browser version is not supported anymore. The image gallery cannot be displayed. <br><br>Please update to a more recent one. Download:<br>';
      m    += '&nbsp;&nbsp;&nbsp; <a href="http://www.google.com/chrome/?hl=en-US)">Chrome</a><br>';
      m    += '&nbsp;&nbsp;&nbsp; <a href="http://www.mozilla.com/firefox/)">Firefox</a><br>';
      m    += '&nbsp;&nbsp;&nbsp; <a href="http://www.microsoft.com/windows/internet-explorer/default.aspx">Internet Explorer</a><br>';
      m    += '&nbsp;&nbsp;&nbsp; <a href="http://www.apple.com/safari/download/">Safari</a>';
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

    
    
    
  }
  


//##########################################################################################################################
//## imagesLoaded ##########################################################################################################
//##########################################################################################################################

// external module EMBEDED in nanogallery
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
//## screenfull.js #########################################################################################################
//##########################################################################################################################

// screenfull.js
// v4.0.1
// by sindresorhus - https://github.com/sindresorhus
// from: https://github.com/sindresorhus/screenfull.js

// external module embeded in nanogallery
// NGY BUILD:
// replace "screenfull" with "ngscreenfull"
// 

(function () {
	'use strict';

	var document = typeof window !== 'undefined' && typeof window.document !== 'undefined' ? window.document : {};
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

	var eventNameMap = {
		change: fn.fullscreenchange,
		error: fn.fullscreenerror
	};

	var ngscreenfull = {
		request: function (elem) {
			return new Promise(function (resolve) {
				var request = fn.requestFullscreen;

				var onFullScreenEntered = function () {
					this.off('change', onFullScreenEntered);
					resolve();
				}.bind(this);

				elem = elem || document.documentElement;

				// Work around Safari 5.1 bug: reports support for
				// keyboard in fullscreen even though it doesn't.
				// Browser sniffing, since the alternative with
				// setTimeout is even worse.
				if (/ Version\/5\.1(?:\.\d+)? Safari\//.test(navigator.userAgent)) {
					elem[request]();
				} else {
					elem[request](keyboardAllowed ? Element.ALLOW_KEYBOARD_INPUT : {});
				}

				this.on('change', onFullScreenEntered);
			}.bind(this));
		},
		exit: function () {
			return new Promise(function (resolve) {
				if (!this.isFullscreen) {
					resolve();
					return;
				}

				var onFullScreenExit = function () {
					this.off('change', onFullScreenExit);
					resolve();
				}.bind(this);

				document[fn.exitFullscreen]();

				this.on('change', onFullScreenExit);
			}.bind(this));
		},
		toggle: function (elem) {
			return this.isFullscreen ? this.exit() : this.request(elem);
		},
		onchange: function (callback) {
			this.on('change', callback);
		},
		onerror: function (callback) {
			this.on('error', callback);
		},
		on: function (event, callback) {
			var eventName = eventNameMap[event];
			if (eventName) {
				document.addEventListener(eventName, callback, false);
			}
		},
		off: function (event, callback) {
			var eventName = eventNameMap[event];
			if (eventName) {
				document.removeEventListener(eventName, callback, false);
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
//## Shifty ################################################################################################################
//##########################################################################################################################
  
 /*!
 * Shifty
 * By Jeremy Kahn - jeremyckahn@gmail.com
 */

// external module EMBEDED in nanogallery
// NGY BUILD:
// 
// replace "Tweenable" with "NGTweenable"
// replace "define.amd" with "define.amdDISABLED"
// replace "var root = this || Function('return this')();" with "const root = typeof window !== 'undefined' ? window : global"

/* shifty - v1.5.3 - 2016-11-29 - http://jeremyckahn.github.io/shifty */
;(function () {
  const root = typeof window !== 'undefined' ? window : global

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
//## HAMMER.JS #############################################################################################################
//##########################################################################################################################

// HAMMER.JS

// external module EMBEDED in nanogallery
// NGY BUILD:
// replace "Hammer" with "NGHammer" (case sensitive)
// replace "var SUPPORT_POINTER_EVENTS = prefixed(window, 'PointerEvent') !== undefined;" with "var SUPPORT_POINTER_EVENTS = false;"
// replace "define.amd" with "define.amdDISABLED"



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

if (typeof define === 'function' && define.amdDISABLED) {
    define(function() {
        return NGHammer;
    });
} else if (typeof module != 'undefined' && module.exports) {
    module.exports = NGHammer;
} else {
    window[exportName] = NGHammer;
}

})(window, document, 'NGHammer');






// END NANOGALLERY2
// }( jQuery )));
}));


//##########################################################################################################################
//##########################################################################################################################
//##########################################################################################################################
//##########################################################################################################################
//##########################################################################################################################

// nanogallery2 auto start whithout javascript call
(function(){
  'use strict';
	
	function document_ready(callback){
		// in case the document is already rendered
		if (document.readyState!='loading') callback();
		// modern browsers
		else if (document.addEventListener) document.addEventListener('DOMContentLoaded', callback);
		// IE <= 8
		else document.attachEvent('onreadystatechange', function(){
				if (document.readyState=='complete') callback();
		});
	}

	document_ready(function(){
		
		// retrieve GALLERIES
		var t=document.querySelectorAll('[data-nanogallery2]');
		for( var i=0; i < t.length; i++ ) {
			jQuery( t[i] ).nanogallery2( jQuery(t[i]).data('nanogallery2') );
		}
		
		// retrieve SINGLE ELEMENTS -> ONLY LIGHTBOX / NO GALLERY
		var t = document.querySelectorAll('[data-nanogallery2-lightbox]');
		for( var i=0; i < t.length; i++ ) {
			
      // set mouse pointer
      t[i].classList.add('NGY2ThumbnailLightbox');

      // add click event
      t[i].addEventListener('click', function(e) {
        // disable link tag if <A> element
        e.preventDefault();
      
        // default options for standalone lightbox
        var options = { 
          lightboxStandalone: true,
          viewerToolbar: { display: false }
        };

        // group of images
        var g = this.dataset.nanogallery2Lgroup;

        // Retrieve the lightbox configuration
        // it just need to be defined on one of the elements, which will be displayed in the lightbox
        var t = document.querySelectorAll('[data-nanogallery2-lightbox]');
        for( var i=0; i < t.length; i++ ) {
          if( t[i].dataset.nanogallery2Lgroup == g ) {
            if( t[i].dataset.nanogallery2Lightbox !== "" ) {
              options = jQuery.extend(true, {}, options, jQuery(t[i]).data('nanogallery2Lightbox'));
              break;
            }
          }
        }
        jQuery( this ).nanogallery2( options );

      });

		}
	});
	
	
	
  // jQuery(document).ready(function () {
  
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
			
			// GALLERIES
      // var t=document.querySelectorAll('[data-nanogallery2]');
      // for( var i=0; i < t.length; i++ ) {
        // jQuery( t[i] ).nanogallery2( jQuery(t[i]).data('nanogallery2') );
      // }
			
		
    // }
    
  // });
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


(function (factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'nanogallery2'], factory);
    } else if (typeof exports === 'object' && typeof require === 'function') {
        // Browserify
        factory(require(['jquery', 'nanogallery2']));
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {
// ;(function ($) {
  
  jQuery.nanogallery2.data_nano_photos_provider2 = function (instance, fnName){
    var G = instance;      // current nanogallery2 instance
    
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
      url += '&hxs=' + G.tn.settings.getH(G.GOM.curNavLevel, 'xs');
      url += '&wxs=' + G.tn.settings.getW(G.GOM.curNavLevel, 'xs');
      url += '&hsm=' + G.tn.settings.getH(G.GOM.curNavLevel, 'sm');
      url += '&wsm=' + G.tn.settings.getW(G.GOM.curNavLevel, 'sm');
      url += '&hme=' + G.tn.settings.getH(G.GOM.curNavLevel, 'me');
      url += '&wme=' + G.tn.settings.getW(G.GOM.curNavLevel, 'me');
      url += '&hla=' + G.tn.settings.getH(G.GOM.curNavLevel, 'la');
      url += '&wla=' + G.tn.settings.getW(G.GOM.curNavLevel, 'la');
      url += '&hxl=' + G.tn.settings.getH(G.GOM.curNavLevel, 'xl');
      url += '&wxl=' + G.tn.settings.getW(G.GOM.curNavLevel, 'xl');
      // url += '&wxs=' + G.tn.settings.width[G.GOM.curNavLevel].xs;
      // url += '&hxs=' + G.tn.settings.height[G.GOM.curNavLevel].xs;
      // url += '&wsm=' + G.tn.settings.width[G.GOM.curNavLevel].sm;
      // url += '&hsm=' + G.tn.settings.height[G.GOM.curNavLevel].sm;
      // url += '&wme=' + G.tn.settings.width[G.GOM.curNavLevel].me;
      // url += '&hme=' + G.tn.settings.height[G.GOM.curNavLevel].me;
      // url += '&wla=' + G.tn.settings.width[G.GOM.curNavLevel].la;
      // url += '&hla=' + G.tn.settings.height[G.GOM.curNavLevel].la;
      // url += '&wxl=' + G.tn.settings.width[G.GOM.curNavLevel].xl;
      // url += '&hxl=' + G.tn.settings.height[G.GOM.curNavLevel].xl;
      
      PreloaderDisplay( true );

      jQuery.ajaxSetup({ cache: false });
      jQuery.support.cors = true;
      try {
        
        var tId = setTimeout( function() {
          // workaround to handle JSONP (cross-domain) errors
          PreloaderDisplay(false);
          NanoAlert(G, 'Could not retrieve nanoPhotosProvider2 data (timeout).');
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
      // switch( G.O.dataCharset.toUpperCase() ) {
        // case 'UTF-8':     // Apache Windows
          // return decodeURI(str);      // do not use decodeURIComponent (would convert slash also)
          // break;
        // case 'Latin':     // Apache Linux
        // default :
          // return escape(str);
          // break;
      // }
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
          // check if album name is filtered 
          if( !FilterAlbumName(title, ID) ) { filterAlbum = true; }
          // on gallery initialization : if an album is defined, do not display sub-albums (not supported) 
          if( G.O.album != '' || G.O.photoset != '' ) { filterAlbum = true; }
        }

        // if( kind == 'image' || (kind == 'album' && FilterAlbumName(title, ID)) ) {
        if( kind == 'image' || !filterAlbum ) {

          var albumID = 0;
          if( item.albumID !== undefined  ) {
            albumID = item.albumID;
            foundAlbumID = true;
          }

          var tags = (item.tags === undefined) ? '' : item.tags;
          var newItem = NGY2Item.New( G, title.split('_').join(' ') , description, ID, albumID, kind, tags );
          newItem.setMediaURL( src, 'img');
          
          // dominant colorS as a gif
          if( item.dcGIF !== undefined ) {
            newItem.imageDominantColors = 'data:image/gif;base64,' + item.dcGIF;
          }
          // dominant color as hex rgb value
          if( item.dc !== undefined && item.dc !== '' ) {
            newItem.imageDominantColor = item.dc;
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
          
          // retrieve responsive thumbnails urls and sizes
          var cnl = G.GOM.curNavLevel;      // current navigation level ('L1' or 'LN');
          var l=['xs', 'sm', 'me', 'la', 'xl'];
          for( var n = 0; n < l.length; n++ ) {
            newItem.thumbs.url[cnl][l[n]]     = baseURL + JsonConvertCharset(item.t_url[n]);
            newItem.thumbs.width[cnl][l[n]]   = parseInt(item.t_width[n]);
            newItem.thumbs.height[cnl][l[n]]  = parseInt(item.t_height[n]);
          }
         
          // post-process callback
          var fu = G.O.fnProcessData;
          if( fu !== null ) {
            typeof fu == 'function' ? fu(newItem, G.O.dataProvider, data) : window[fu](newItem, G.O.dataProvider, data);
          }
          
        }
      });

      G.I[albumIdx].contentIsLoaded = true;   // album's content is ready
    }    
    

    // -----------
    // Initialize 
    function Init() {

    }
    

    // shortcuts to NGY2Tools functions (with context)
    var PreloaderDisplay = NGY2Tools.PreloaderDisplay.bind(G);
    // var NanoAlert = NGY2Tools.NanoAlert.bind(G);
    var NanoAlert = NGY2Tools.NanoAlert;
    // var GetImageTitleFromURL = NGY2Tools.GetImageTitleFromURL.bind(G);
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
    }

  };
  
// END NANOPHOTOSPROVIDER DATA SOURCE FOR NANOGALLERY2
// }( jQuery ));
}));  
  
  
  
  
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
// ##### requires nanogp2                        #####
// ###################################################


(function (factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'nanogallery2'], factory);
    } else if (typeof exports === 'object' && typeof require === 'function') {
        // Browserify
        factory(require(['jquery', 'nanogallery2']));
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {
// ;(function ($) {
  
  jQuery.nanogallery2.data_google2 = function (instance, fnName){
    var G=instance;      // current nanogallery2 instance

    
    /** @function AlbumGetContent */
    var AlbumGetContent = function(albumID, fnToCall, fnParam1, fnParam2) {

      var url = '';
      var kind = 'image';
      var albumIdx = NGY2Item.GetIdx(G, albumID);

      var maxResults='';
      if( G.galleryMaxItems.Get() > 0 ) {
        maxResults = '&max-results=' + G.galleryMaxItems.Get();
      }
      
      var gat='';   // global authorization (using the BUILDER)
      if( typeof ngy2_pwa_at !== 'undefined' ) {
        gat=ngy2_pwa_at;
      }
      
      if( albumID == 0 ) {
        // RETRIEVE THE LIST OF ALBUMS
        if( gat != '' ) {
          // in builder
          // url += '?alt=json&v=3&kind=album&deprecation-extension=true&thumbsize='+G.picasa.thumbSizes+maxResults+'&rnd=' + (new Date().getTime()) + '&access_token=' + gat;
          url = 'https://photoslibrary.googleapis.com/v1/albums';
        }
        else {
					// NANOGP2
					// url=G.O.google2URL + '?nguserid='+G.O.userID+'&alt=json&v=3&kind=album&thumbsize='+G.picasa.thumbSizes+maxResults+'&rnd=' + (new Date().getTime());
					url = G.O.google2URL + '?nguserid=' + G.O.userID + '&alt=json&v=3&kind=album' + maxResults + '&rnd=' + (new Date().getTime());
        }
        kind='album';

      }
      else {
        // RETRIEVE THE CONTENT OF ONE ALBUM (=MEDIAS)
        if( gat != '' ) {
          // in builder
          // url += '/albumid/'+albumID+'?alt=json&kind=photo&deprecation-extension=true&thumbsize='+G.picasa.thumbSizes+maxResults+'&imgmax=d&access_token=' + gat;
          // url += '/albumid/'+albumID+'?alt=json&kind=photo&deprecation-extension=true&thumbsize='+G.picasa.thumbSizes+maxResults+'&imgmax=d&access_token=' + gat;
          url = 'https://photoslibrary.googleapis.com/v1/mediaItems:search';
        }
        else {
            // nanogp
            // url = G.O.google2URL + '?nguserid='+G.O.userID+'&ngalbumid='+albumID+'&alt=json&v=3&kind=photo&thumbsize='+G.picasa.thumbSizes+maxResults+'&imgmax=d';
            url = G.O.google2URL + '?nguserid=' + G.O.userID + '&ngalbumid=' + albumID + '&alt=json&v=3&kind=photo&' + maxResults;
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

				jQuery.getJSON( url + '&callback=?', function(data) {

					if( data.nano_status == 'error' ) {
						clearTimeout(tId);
						PreloaderDisplay(false);
						NanoAlert(G, "Could not retrieve Google data. Error: " + data.nano_message);
						return;
					}
          clearTimeout(tId);
          PreloaderDisplay(false);
          GoogleParseData( albumIdx, kind, data );
          AlbumPostProcess(albumID);
          if( fnToCall !== null &&  fnToCall !== undefined) {
            fnToCall( fnParam1, fnParam2, null );
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
      }
      catch(e) {
        NanoAlert(G, "Could not retrieve Google data. Error: " + e);
      }
    }

    
    // -----------
    // Retrieve items from a Google Photos data stream
    // items can be images/viedos or albums
    function GoogleParseData(albumIdx, kind, data) {

      if( G.O.debugMode ) { 
        console.log('Google Photos data:');
        console.dir(data);    
      }
      var albumID = G.I[albumIdx].GetID();

      // iterate and parse each item
      jQuery.each(data, function(i,data){
      
				if( typeof data === 'object' && data !== null ) {   // only objects

        var itemDescription = '';
				var itemTitle = '';
        if( kind == 'image') {
          if (data.description !== undefined ){
              itemDescription = data.description
          }
          if( G.O.thumbnailLabel.get('title') != '' ) {
            itemTitle = GetImageTitleFromURL( data.filename );
          }
        }
				else {
					itemTitle = data.title;
				}
				if( itemTitle == undefined ) {
					// may happen...
					itemTitle = '';
				}
        
        var itemID = data.id;
        if( kind == 'album' ) {
					if( !FilterAlbumName(itemTitle, itemID) || data.coverPhotoBaseUrl == undefined ) {
						return true;
					}
				}

				// create ngy2 item
				var newItem = NGY2Item.New( G, itemTitle, itemDescription, itemID, albumID, kind, '' );
				
				var width = 0;
				var height = 0;
				
				// set the image src
				var src = '';
				if( kind == 'image' ) {
					src = data.baseUrl;
					if( !G.O.viewerZoom && G.O.viewerZoom != undefined ) {
						if( window.screen.width >  window.screen.height ) {
							src += '=w' + window.screen.width;
						}
						else {
							src = s + '=h' + window.screen.height;
						}
					}
					else {
            // use full resolution image
            src += '=h' + data.mediaMetadata.height + '-w' + data.mediaMetadata.width;
            
            // use original image
            // src += '=d';
					}
					
					// image's URL
					newItem.setMediaURL( src, 'img');

					// image size
					if( data.mediaMetadata.width !== undefined ) {
						newItem.imageWidth = parseInt(data.mediaMetadata.width);
 						width = newItem.imageWidth;
					}
					if( data.mediaMetadata.height !== undefined ) {
						newItem.imageHeight=parseInt(data.mediaMetadata.height);
 						height = newItem.imageHeight;
					}

					// if( data.media$group != null && data.media$group.media$credit != null && data.media$group.media$credit.length > 0 ) {
						// newItem.author=data.media$group.media$credit[0].$t;
					// }

					// Photo
					if( data.mediaMetadata.photo !== undefined ) {
						// exif data
						if( data.mediaMetadata.photo.exposureTime != undefined ) {
							newItem.exif.exposure = data.mediaMetadata.photo.exposureTime;
						}
						if( data.mediaMetadata.photo.focalLength != undefined ) {
							newItem.exif.focallength = data.mediaMetadata.photo.focalLength;
						}
						if( data.mediaMetadata.photo.apertureFNumber != undefined ) {
							newItem.exif.fstop = data.mediaMetadata.photo.apertureFNumber;
						}
						if( data.mediaMetadata.photo.isoEquivalent != undefined ) {
							newItem.exif.iso = data.mediaMetadata.photo.isoEquivalent;
						}
						if( data.mediaMetadata.photo.cameraModel != undefined ) {
							newItem.exif.model = data.mediaMetadata.photo.cameraModel;
						}
					}
					
					// Video
					if( data.mediaMetadata.video !== undefined ) {
						if( data.mediaMetadata.video.cameraModel != undefined ) {
							newItem.exif.model = data.mediaMetadata.video.cameraModel;
						}
            
            newItem.downloadURL = data.baseUrl + '=dv';   // set the download URL for the video
            
            // newItem.mediaKind = 'selfhosted';
            // newItem.mediaMarkup = '<video controls class="nGY2ViewerMedia"><source src="'+ newItem.src +'" type="video/'+ 'video/mp4' +'" preload="auto">Your browser does not support the video tag (HTML 5).</video>';
					}
						
				}
				else {
					// newItem.author = data.author[0].name.$t;
					newItem.numberItems = data.mediaItemsCount;
				}

				// set the URL of the thumbnails images
				newItem.thumbs=GoogleThumbSetSizes2('l1', newItem.thumbs, data, kind, height, width );
				newItem.thumbs=GoogleThumbSetSizes2('lN', newItem.thumbs, data, kind,height ,width );
				
				// post-process callback
				var fu = G.O.fnProcessData;
				if( fu !== null ) {
					typeof fu == 'function' ? fu(newItem, 'google2', data) : window[fu](newItem, 'google2', data);
				}
          
        }
      });

      G.I[albumIdx].contentIsLoaded = true;   // album's content is ready
    }

    // -----------
    // Set thumbnail sizes (width and height) and URLs (for all resolutions (xs, sm, me, la, xl) and levels (l1, lN)
    function GoogleThumbSetSizes2(level, tn, data, kind, height, width ) {
      var sizes=['xs','sm','me','la','xl'];

      for(var i=0; i<sizes.length; i++ ) {
				
        // media
				if( kind == 'image' ) {
          if( G.tn.settings.width[level][sizes[i]] == 'auto' ) {
						let ratio1 = width / height;
						tn.height[level][sizes[i]] = G.tn.settings.getH(level, sizes[i]);
						tn.width[level][sizes[i]] = G.tn.settings.getH(level, sizes[i]) * ratio1;
						tn.url[level][sizes[i]] = data.baseUrl + '=h' + G.tn.settings.getH(level, sizes[i]);
						continue;
					}
          if( G.tn.settings.height[level][sizes[i]] == 'auto' ) {
						let ratio1 = height / width;
						tn.width[level][sizes[i]] = G.tn.settings.getW(level, sizes[i]);
						tn.height[level][sizes[i]] = G.tn.settings.getW(level, sizes[i]) * ratio1;
						tn.url[level][sizes[i]] = data.baseUrl + '=w' + G.tn.settings.getW(level, sizes[i]);
						continue;
					}

					tn.height[level][sizes[i]] = G.tn.settings.getH(level, sizes[i]);
					tn.width[level][sizes[i]] = G.tn.settings.getW(level, sizes[i]);
					tn.url[level][sizes[i]] = data.baseUrl + '=w' + G.tn.settings.getW(level, sizes[i]);
					
				}

        // album
				if( kind == 'album' ) {
          if( G.tn.settings.width[level][sizes[i]] == 'auto' ) {
						tn.url[level][sizes[i]]= data.coverPhotoBaseUrl + '=h' + G.tn.settings.getH(level, sizes[i]);
						continue;
					}
          if( G.tn.settings.height[level][sizes[i]] == 'auto' ) {
						tn.url[level][sizes[i]]= data.coverPhotoBaseUrl + '=w' + G.tn.settings.getW(level, sizes[i]);
						continue;
					}
					// var w = G.tn.settings.mosaic[level + 'Factor']['w'][sizes[i]];
					tn.url[level][sizes[i]]= data.coverPhotoBaseUrl + '=h' + G.tn.settings.getH(level, sizes[i]) + '-w' + G.tn.settings.getW(level, sizes[i]);

        }
      }
        
      return tn;
		}



    // -----------
    // Initialization
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
      case 'AlbumGetContent':
        var albumID = arguments[2],
        callback2 = arguments[3],
        cbParam1 = arguments[4],
        cbParam2 = arguments[5];
        AlbumGetContent(albumID, callback2, cbParam1, cbParam2);
        break;
      case 'Init':
        Init();
        break;
      case '':
        break;
    }

  };
  
// END GOOGLE DATA SOURCE FOR NANOGALLERY2
// }( jQuery ));
}));
  
  
  
  
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


(function (factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'nanogallery2'], factory);
    } else if (typeof exports === 'object' && typeof require === 'function') {
        // Browserify
        factory(require(['jquery', 'nanogallery2']));
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {
// ;(function ($) {
  
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
      photoAvailableSizesStr :  new Array('sq', 't', 'q', 's', 'm', 'z', 'b', 'l', 'h', 'k', 'o')
    };
    
    
    /** @function AlbumGetContent */
    var AlbumGetContent = function(albumID, fnToCall, fnParam1, fnParam2) {
      if( G.O.flickrAPIKey == '' ) {
        NanoAlert(G, 'Please set your Flickr API Key (option flickrAPIKey)');
      }

      var albumIdx = NGY2Item.GetIdx(G, albumID);
      var url = '';
      var kind = 'image';
        // photos
        if( G.O.photoset.toUpperCase() == 'NONE' || G.O.album.toUpperCase() == 'NONE' ) {
          // get photos from full photostream
          url = Flickr.url() + "?&method=flickr.people.getPublicPhotos&api_key=" + G.O.flickrAPIKey + "&user_id="+G.O.userID+"&extras=description,views,tags,url_o,url_sq,url_t,url_q,url_s,url_m,url_z,url_b,url_h,url_k&per_page=500&format=json";
        }
        else
          if( G.I[albumIdx].GetID() == 0 ) {
          // retrieve the list of albums
          url = Flickr.url() + "?&method=flickr.photosets.getList&api_key=" + G.O.flickrAPIKey + "&user_id="+G.O.userID+"&per_page=500&primary_photo_extras=tags,url_o,url_sq,url_t,url_q,url_s,url_m,url_l,url_z,url_b,url_h,url_k&format=json";
          kind='album';
        }
          else {
            // photos from one specific photoset
            url = Flickr.url() + "?&method=flickr.photosets.getPhotos&api_key=" + G.O.flickrAPIKey + "&photoset_id="+G.I[albumIdx].GetID()+"&extras=description,views,tags,url_o,url_sq,url_t,url_q,url_s,url_m,url_l,url_z,url_b,url_h,url_k&format=json";
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
        
        // go through sourceData, and exclude blacklisted tags
        sourceData = FilterByTags(sourceData, G.O.tagBlockList);

        if( kind == 'album' ) {
          FlickrParsePhotoSets(albumIdx, albumID, sourceData);
        }
        else {
          FlickrParsePhotos(albumIdx, albumID, sourceData);
        }
        
        AlbumPostProcess( albumID );
        
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

        var imgUrl=item.url_sq;  //fallback size

        // get the title
        var itemTitle = item.title;
        if( G.O.thumbnailLabel.get('title') != '' ) {
          itemTitle=GetImageTitleFromURL(imgUrl);
        }

        // get the description
        var itemDescription=item.description._content;
        
        // retrieve the image size with highest available resolution
        var imgW=75, imgH=75;
        var start=Flickr.photoAvailableSizesStr.length-1;
        if( G.O.flickrSkipOriginal ) { start--; }
        for( var i = start; i>=0 ; i-- ) {
          if( item['url_'+Flickr.photoAvailableSizesStr[i]] != undefined ) {
            imgUrl=item['url_'+Flickr.photoAvailableSizesStr[i]];
            imgW=parseInt(item['width_'+Flickr.photoAvailableSizesStr[i]]);
            imgH=parseInt(item['height_'+Flickr.photoAvailableSizesStr[i]]);
            break;
          }
        }

        var sizes = {};
        for( var p in item ) {
          if( p.indexOf('height_') == 0 || p.indexOf('width_') == 0 || p.indexOf('url_') == 0 ) {
            sizes[p]=item[p];
          }
        }
        
        // tags
        var tags = item.tags !== undefined ? item.tags : '';

        // create item
        var newItem = NGY2Item.New( G, itemTitle, itemDescription, itemID, albumID, 'image', tags );

        // add image
        newItem.setMediaURL( imgUrl, 'img');
        newItem.imageWidth = imgW;
        newItem.imageHeight = imgH;

        
        // add thumbnails
        var tn = {
          url:    { l1 : { xs:'', sm:'', me:'', la:'', xl:'' }, lN : { xs:'', sm:'', me:'', la:'', xl:'' } },
          width:  { l1 : { xs:0, sm:0, me:0, la:0, xl:0 }, lN : { xs:0, sm:0, me:0, la:0, xl:0 } },
          height: { l1 : { xs:0, sm:0, me:0, la:0, xl:0 }, lN : { xs:0, sm:0, me:0, la:0, xl:0 } }
        };
        tn = FlickrRetrieveImages(tn, item, 'l1' );
        tn = FlickrRetrieveImages(tn, item, 'lN' );
        newItem.thumbs=tn;
        
        // post-process callback
        var fu = G.O.fnProcessData;
        if( fu !== null ) {
          typeof fu == 'function' ? fu(newItem, 'flickr', item) : window[fu](newItem, 'flickr', item);
        }
        

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
        
        if( item.visibility_can_see_set == 0 ) { return true; }    // skip it
        
        if( FilterAlbumName(itemTitle, item.id) ) {
          var itemID=item.id;
          //Get the description
          var itemDescription = item.description._content != undefined ? item.description._content : '';

          var sizes = {};
          for( var p in item.primary_photo_extras) {
            sizes[p] = item.primary_photo_extras[p];
          }
          var tags='';
          if( item.primary_photo_extras !== undefined ) {
            if( item.primary_photo_extras.tags !== undefined ) {
              tags = item.primary_photo_extras.tags;
            }
          }
        
          var newItem = NGY2Item.New( G, itemTitle, itemDescription, itemID, albumID, 'album', tags );
          newItem.numberItems = item.photos;
          newItem.thumbSizes = sizes;
          
          var tn = {
            url:    { l1 : { xs:'', sm:'', me:'', la:'', xl:'' }, lN : { xs:'', sm:'', me:'', la:'', xl:'' } },
            width:  { l1 : { xs:0, sm:0, me:0, la:0, xl:0 }, lN : { xs:0, sm:0, me:0, la:0, xl:0 } },
            height: { l1 : { xs:0, sm:0, me:0, la:0, xl:0 }, lN : { xs:0, sm:0, me:0, la:0, xl:0 } }
          };
          tn = FlickrRetrieveImages(tn, item.primary_photo_extras, 'l1' );
          tn = FlickrRetrieveImages(tn, item.primary_photo_extras, 'lN' );
          newItem.thumbs = tn;

          // post-process callback
          var fu = G.O.fnProcessData;
          if( fu !== null ) {
            typeof fu == 'function' ? fu(newItem, 'flickr', item) : window[fu](newItem, 'flickr', item);
          }
          
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
      for( var i=0; i<sizes.length; i++ ) {
        if( G.tn.settings.width[level][sizes[i]] == 'auto' || G.tn.settings.width[level][sizes[i]] == '' ) {
          let sdir='height_';
          let tsize=Math.ceil( G.tn.settings.height[level][sizes[i]] * G.tn.scale * sf * G.tn.settings.mosaic[level+'Factor']['h'][sizes[i]] );
          let one=FlickrRetrieveOneImage(sdir, tsize, item );
          tn.url[level][sizes[i]]=one.url;
          tn.width[level][sizes[i]]=one.width;
          tn.height[level][sizes[i]]=one.height;
        }
        else 
          if( G.tn.settings.height[level][sizes[i]] == 'auto' || G.tn.settings.height[level][sizes[i]] == '' ) {
            let sdir='width_';
            let tsize=Math.ceil( G.tn.settings.width[level][sizes[i]] * G.tn.scale * sf * G.tn.settings.mosaic[level+'Factor']['w'][sizes[i]] );
            let one=FlickrRetrieveOneImage(sdir, tsize, item );
            tn.url[level][sizes[i]]=one.url;
            tn.width[level][sizes[i]]=one.width;
            tn.height[level][sizes[i]]=one.height;
          }
          else {
            let sdir='height_';
            let tsize=Math.ceil( G.tn.settings.height[level][sizes[i]] * G.tn.scale * sf * G.tn.settings.mosaic[level+'Factor']['h'][sizes[i]] );
            if( G.tn.settings.width[level][sizes[i]] > G.tn.settings.height[level][sizes[i]] ) {
              sdir='width_';
              tsize=Math.ceil( G.tn.settings.width[level][sizes[i]] * G.tn.scale * sf * G.tn.settings.mosaic[level+'Factor']['w'][sizes[i]] );
            }
            let one=FlickrRetrieveOneImage(sdir, tsize, item );
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
      for( var j=0; j < Flickr.thumbAvailableSizes.length; j++ ) {
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
    
    var FilterByTags = function(data, tagBlockList) {
      if( tagBlockList!= '' && data != undefined) {
        data = data.filter(function (item) {
          var regex = new RegExp( tagBlockList, "i");
          var tagsToTest = [item.tags];
          if ( Array.isArray(item.tags) ) {
            tagsToTest = item.tags;
          }
          return ! tagsToTest.some( function (x) { return regex.test(x); } );
        });
      }
      return data;
    };
    
    /** @function GetHiddenAlbums */
    // var GetHiddenAlbums = function( hiddenAlbums, callback ){
      // not supported -> doesn't exit in Flickr
      // callback();     
    // }

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

    switch( fnName ){
      // case 'GetHiddenAlbums':
        // var hiddenAlbums = arguments[2],
        // callback = arguments[3];
        // GetHiddenAlbums(hiddenAlbums, callback);
        // break;
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
    }

  };
  
// END FLICKR DATA SOURCE FOR NANOGALLERY2
// }( jQuery ));
}));

  
  
