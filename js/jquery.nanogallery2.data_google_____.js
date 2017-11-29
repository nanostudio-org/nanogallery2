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
// ###################################################


;(function ($) {
  
  jQuery.nanogallery2.data_google = function (instance, fnName){
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
      
      if( G.I[albumIdx].GetID() == 0 ) {
        // retrieve the list of albums
        // url += '?alt=json&kind=album&thumbsize='+G.picasa.thumbSizes+maxResults+'&rnd=' + (new Date().getTime());
        url += '?alt=json&v=3&kind=album&thumbsize='+G.picasa.thumbSizes+maxResults+'&rnd=' + (new Date().getTime());
        kind='album';
      }
      else {
        // retrieve the content of one album (=photos)
        var auth='';
        if( G.I[albumIdx].authkey != '' ) {
          // private album
          auth=G.I[albumIdx].authkey;
        }
        url += '/albumid/'+albumID+'?alt=json&kind=photo&thumbsize='+G.picasa.thumbSizes+maxResults+auth+'&imgmax=d';
      }

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
        // load more than 1000 data -> contributor: Giovanni Chiodi

        var GI_loadJSON = function(url,start_index){
          
          jQuery.getJSON(url+"&start-index="+start_index, 'callback=?', function(data) {
            if (gi_data_loaded===null){
              gi_data_loaded = data;
            }else{
              gi_data_loaded.feed.entry=gi_data_loaded.feed.entry.concat(data.feed.entry);
            }

            if (data.feed.openSearch$startIndex.$t+data.feed.openSearch$itemsPerPage.$t>=data.feed.openSearch$totalResults.$t){
              //ok finito
              GI_getJSONfinished(gi_data_loaded);
            }else{
              //ce ne sono ancora da caricare
              //altra chiamata per il rimanente
              GI_loadJSON(url,data.feed.openSearch$startIndex.$t+data.feed.openSearch$itemsPerPage.$t);
            }
          })
          .fail( function(jqxhr, textStatus, error) {
            clearTimeout(tId);
            PreloaderDisplay(false);

            //alertObject(jqxhr);
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
    // Retrieve items from a Google+ (ex Picasa) data stream
    // items can be images or albums
    function GoogleParseData(albumIdx, kind, data) {
      var albumID=G.I[albumIdx].GetID();

      if( G.I[albumIdx].title == '' ) {
        // set title of the album (=> root level not loaded at this time)
        G.I[albumIdx].title=data.feed.title.$t;
      }
      
      // iterate and parse each item
      jQuery.each(data.feed.entry, function(i,data){
        
        //Get the title 
        var imgUrl=data.media$group.media$content[0].url;
        var itemTitle = data.title.$t;

        //Get the description
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
          if( kind == 'image' ) {
            var src='';
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
            newItem.imageWidth=parseInt(data.gphoto$width.$t);
            newItem.imageHeight=parseInt(data.gphoto$height.$t);

            if( data.media$group != null && data.media$group.media$credit != null && data.media$group.media$credit.length > 0 ) {
              newItem.author=data.media$group.media$credit[0].$t;
            }

            
            // exif data
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
          else {
            newItem.author=data.author[0].name.$t;
            newItem.numberItems=data.gphoto$numphotos.$t;
          }

          // set the URL of the thumbnails images
          newItem.thumbs=GoogleThumbSetSizes('l1', 0, newItem.thumbs, data, kind );
          newItem.thumbs=GoogleThumbSetSizes('lN', 5, newItem.thumbs, data, kind );
          
          if( typeof G.O.fnProcessData == 'function' ) {
            G.O.fnProcessData(newItem, 'google', data);
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
      if( G.thumbnailCrop.l1 === true ) {
        sfL1=G.O.thumbnailCropScaleFactor;
      }
      var sfLN=1;
      if( G.thumbnailCrop.lN === true ) {
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
  
  
  
  
  