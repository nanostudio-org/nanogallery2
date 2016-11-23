/* learn-travis-YOURNAME - v0.0.2 - 2016-11-23 - http://nanogallery2.nanostudio.org */
/**!
 * @preserve nanogallery2 - javascript image gallery
 * Homepage: http://nanogallery2.nanostudio.org
 * Sources: https://github.com/nanostudio-org/nanogallery2
 *
 * License: For personal, non-profit organizations, or open source projects (without any kind of fee), you may use nanoGALLERY for jQuery for free. 
 * -------- ALL OTHER USES REQUIRE THE PURCHASE OF A PROFESSIONAL LICENSE.
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
        url += '?alt=json&kind=album&thumbsize='+G.picasa.thumbSizes+maxResults+'&rnd=' + (new Date().getTime());
        kind='album';
      }
      else {
        // retrieve the content of one album (=photos)
        url += '/albumid/'+albumID+'?alt=json&kind=photo&thumbsize='+G.picasa.thumbSizes+maxResults+'&imgmax=d';
      }

      PreloaderDisplay(true);

      jQuery.ajaxSetup({ cache: false });
      jQuery.support.cors = true;
      
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
            GI_data_loaded.feed.entry=gi_data_loaded.feed.entry.concat(data.feed.entry);
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
          NanoAlert("Could not retrieve Google data. Error: " + err);

        });
      };

      GI_loadJSON(url,1);

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
          // if image the title contains the image filename -> replace with content of description
          filename=itemTitle;
          itemTitle=itemDescription;
          itemDescription='';
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
          NanoAlert('Could not retrieve AJAX data...');
        }, 60000 );
        jQuery.getJSON(url, function(data, status, xhr) {
          clearTimeout(tId);
          PreloaderDisplay(false);
          
          var albumTitle=data.feed.title.$t;
          var source = data.feed.entry[0];

          var newItem=NGY2Item.New( G, albumTitle, '', albumID, '0', 'album', '' );

          //Get and set the URLs of the thumbnail
          newItem.thumbs=GoogleThumbSetSizes('l1', 0, newItem.thumbs, source, 'album' );
          newItem.thumbs=GoogleThumbSetSizes('lN', 5, newItem.thumbs, source, 'album' );
   
          if( typeof G.O.fnProcessData == 'function' ) {
            G.O.fnProcessData(newItem, 'google', source);
          }
          G.I[1].contentIsLoaded=true;

  
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
          NanoAlert("Could not retrieve ajax data (google): " + textStatus + ', ' + error);
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
      if( v1 == 'auto' ) {
        v = Math.ceil( v2 * G.tn.scale ) + c2;
      }
      else if( v2 == 'auto' ) {
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
    var NanoAlert = NGY2Tools.NanoAlert.bind(G);
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
 * @preserve nanogallery2 v0.1.0
 * Demo: http://nanogallery2.brisbois.fr
 * Sources: https://github.com/Kris-B/nanogallery1
 *
 * License: For personal, non-profit organizations, or open source projects (without any kind of fee), you may use nanoGALLERY for jQuery for free. 
 * -------- ALL OTHER USES REQUIRE THE PURCHASE OF A PROFESSIONAL LICENSE.
 * 
*/
 
// ###################################################
// ##### nanogallery2 - module for FLICKR PHOTOS #####
// ###################################################


;(function ($) {
  
  jQuery.nanogallery2.data_flickr = function (instance, fnName){
    var G=instance;      // current nanoGALLERY2 instance

    // ### Flickr
    // Details: http://www.flickr.com/services/api/misc.urls.html
    var Flickr = {
      url: function() {
        // Flickr API Going SSL-Only on June 27th, 2014
        return 'https://api.flickr.com/services/rest/';
      },
      thumbSize:'sq',
      thumbAvailableSizes : new Array(75,100,150,240,500,640),
      thumbAvailableSizesStr : new Array('sq','t','q','s','m','z'),
      photoSize : '0',
      photoAvailableSizes : new Array(75,100,150,240,500,640,1024,1024,1600,2048),
      photoAvailableSizesStr : new Array('sq','t','q','s','m','z','b','l','h','k'),
      ApiKey : "2f0e634b471fdb47446abcb9c5afebdc"
    };
    
    
    /** @function AlbumGetContent */
    var AlbumGetContent = function(albumID, fnToCall, fnParam1, fnParam2) {

      var albumIdx=NGY2Item.GetIdx(G, albumID);
      var url = '';
      var kind='image';
        // photos
        if( G.O.photoset.toUpperCase() == 'NONE' || G.O.album.toUpperCase() == 'NONE' ) {
          // get photos from full photostream
          url = Flickr.url() + "?&method=flickr.people.getPublicPhotos&api_key=" + Flickr.ApiKey + "&user_id="+G.O.userID+"&extras=description,views,tags,url_o,url_sq,url_t,url_q,url_s,url_m,url_z,url_b,url_h,url_k&per_page=500&format=json&jsoncallback=?";
        }
        else
          if( G.I[albumIdx].GetID() == 0 ) {
          // retrieve the list of albums
          url = Flickr.url() + "?&method=flickr.photosets.getList&api_key=" + Flickr.ApiKey + "&user_id="+G.O.userID+"&per_page=500&primary_photo_extras=tags,url_o,url_sq,url_t,url_q,url_s,url_m,url_l,url_z,url_b,url_h,url_k&format=json&jsoncallback=?";
          kind='album';
        }
          else {
            // photos from one specific photoset
            url = Flickr.url() + "?&method=flickr.photosets.getPhotos&api_key=" + Flickr.ApiKey + "&photoset_id="+G.I[albumIdx].GetID()+"&extras=description,views,tags,url_o,url_sq,url_t,url_q,url_s,url_m,url_l,url_z,url_b,url_h,url_k&format=json&jsoncallback=?";
          }

      PreloaderDisplay(true);

      jQuery.ajaxSetup({ cache: false });
      jQuery.support.cors = true;
      
      var tId = setTimeout( function() {
        // workaround to handle JSONP (cross-domain) errors
        PreloaderDisplay(false);
        NanoAlert('Could not retrieve AJAX data...');
      }, 60000 );
      jQuery.getJSON(url, function(data, status, xhr) {
       clearTimeout(tId);
       PreloaderDisplay(false);

        if( kind == 'album' ) {
          FlickrParsePhotoSets(albumIdx, data);
        }
        else {
          FlickrParsePhotos(albumIdx, data);
        }

        AlbumPostProcess(albumID);
        if( fnToCall !== null &&  fnToCall !== undefined) {
          fnToCall( fnParam1, fnParam2, null );
        }


      })
      .fail( function(jqxhr, textStatus, error) {
        clearTimeout(tId);
        PreloaderDisplay(false);
        NanoAlert("Could not retrieve ajax data (Flickr): " + textStatus + ', ' + error);
      });
      
    }


    
    function FlickrParsePhotos( albumIdx, data ) {
      var source = '';
      if( G.O.photoset.toUpperCase() == 'NONE' || G.O.album.toUpperCase() == 'NONE' ) {
        source = data.photos.photo;
      }
      else {
        source = data.photoset.photo;
      }

      var albumID=G.I[albumIdx].GetID();
      jQuery.each(source, function(i,item){
        //Get the title
        var itemTitle = item.title,
        itemID=item.id,
        itemDescription=item.description._content;    // Get the description
        
        var imgUrl=item.url_sq;  //fallback size
        for(var i=Flickr.photoSize; i>=0; i-- ) {
          if( item['url_'+Flickr.photoAvailableSizesStr[i]] != undefined ) {
            imgUrl=item['url_'+Flickr.photoAvailableSizesStr[i]];
            break;
          }
        }

        var sizes = {};
        for (var p in item) {
          if( p.indexOf('height_') == 0 || p.indexOf('width_') == 0 || p.indexOf('url_') == 0 ) {
            sizes[p]=item[p];
          }
        }
        
        if( G.O.thumbnailLabel.get('title') != '' ) {
          itemTitle=GetImageTitleFromURL(imgUrl);
        }

        tags='';
        if( item.tags !== undefined ) {
          tags=item.tags;
        }

        // var newItem=NGAddItem(itemTitle, '', imgUrl, itemDescription, '', 'image', '', itemID, albumID );
        var newItem=NGY2Item.New( G, itemTitle, itemDescription, itemID, albumID, 'image', tags );
        newItem.src=imgUrl;
        if( item.url_o !== undefined ) {
          newItem.width=item.width_o;
          newItem.height=item.height_o;
        }
        else {
          newItem.width=item.width_z;
          newItem.height=item.height_z;
        }

        var tn = {
          url: { l1 : { xs:'', sm:'', me:'', la:'', xl:'' }, lN : { xs:'', sm:'', me:'', la:'', xl:'' } },
          width: { l1 : { xs:0, sm:0, me:0, la:0, xl:0 }, lN : { xs:0, sm:0, me:0, la:0, xl:0 } },
          height: { l1 : { xs:0, sm:0, me:0, la:0, xl:0 }, lN : { xs:0, sm:0, me:0, la:0, xl:0 } }
        };
        tn=FlickrRetrieveImages(tn, item, 'l1' );
        tn=FlickrRetrieveImages(tn, item, 'lN' );
        newItem.thumbs=tn;

      });
      G.I[albumIdx].contentIsLoaded=true;

    }    


    
    // -----------
    // Retrieve items from Flickr photosets
    // items can be images or albums
    function FlickrParsePhotoSets( albumIdx, data ) {
      if( data.stat !== undefined ) {
        if( data.stat === 'fail' ) {
          NanoAlert("Could not retrieve Flickr photoset list: " + data.message + " (code: "+data.code+").");
          return false;
        }
      }

      var albumID=G.I[albumIdx].GetID();
      
      var source = data.photosets.photoset;
      jQuery.each(source, function(i,item){
        //Get the title
        itemTitle = item.title._content;

        if( FilterAlbumName(itemTitle, item.id) ) {
          itemID=item.id;
          //Get the description
          itemDescription='';
          if (item.description._content != undefined) {
            itemDescription=item.description._content;
          }

          var sizes = {};
          for (var p in item.primary_photo_extras) {
            sizes[p]=item.primary_photo_extras[p];
          }
          tags='';
          if( item.primary_photo_extras !== undefined ) {
            if( item.primary_photo_extras.tags !== undefined ) {
              tags=item.primary_photo_extras.tags;
            }
          }
        
          var newItem=NGY2Item.New( G, itemTitle, itemDescription, itemID, albumID, 'album', tags );
          newItem.numberItems=item.photos;
          newItem.thumbSizes=sizes;
          
          var tn = {
            url: { l1 : { xs:'', sm:'', me:'', la:'', xl:'' }, lN : { xs:'', sm:'', me:'', la:'', xl:'' } },
            width: { l1 : { xs:0, sm:0, me:0, la:0, xl:0 }, lN : { xs:0, sm:0, me:0, la:0, xl:0 } },
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
      if( G.thumbnailCrop[level] === true ) {
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
      var one={ url:'', width:0, height:0 };
      var tnIndex=0;
      for(var j=0; j<Flickr.thumbAvailableSizes.length; j++ ) {
        var size=item[sdir+Flickr.photoAvailableSizesStr[j]];
        if(  size != undefined ) {
          tnIndex=j;
          if( size >= tsize ) {
            break;
          }
        }
      }
      var fSize=Flickr.photoAvailableSizesStr[tnIndex];
      one.url= item['url_'+fSize];
      one.width= parseInt(item['width_'+fSize]);
      one.height=parseInt(item['height_'+fSize]);
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
    var NanoAlert = NGY2Tools.NanoAlert.bind(G);
    var GetImageTitleFromURL = NGY2Tools.GetImageTitleFromURL.bind(G);
    var FilterAlbumName = NGY2Tools.FilterAlbumName.bind(G);
    var AlbumPostProcess = NGY2Tools.AlbumPostProcess.bind(G);

    // Flickr image sizes
    var sizeImageMax=Math.max(window.screen.width, window.screen.height);
    if( window.devicePixelRatio != undefined ) {
      if( window.devicePixelRatio > 1 ) {
        sizeImageMax=sizeImageMax*window.devicePixelRatio;
      }
    }
    if( !G.O.flickrSkipOriginal ) {
      Flickr.photoAvailableSizes.push(10000);
      Flickr.photoAvailableSizesStr.push('o');
    }
    for( i=0; i<Flickr.photoAvailableSizes.length; i++) {
      Flickr.photoSize=i; //Flickr.photoAvailableSizesStr[i];
      if( sizeImageMax <= Flickr.photoAvailableSizes[i] ) {
        break;
      }
    }

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
  
  
  
  
  