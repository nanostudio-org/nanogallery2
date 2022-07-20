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

  
  
