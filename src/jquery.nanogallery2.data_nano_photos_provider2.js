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
  
  
  
  