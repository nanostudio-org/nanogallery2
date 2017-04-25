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
          FlickrParsePhotoSets(albumIdx, sourceData);
        }
        else {
          FlickrParsePhotos(albumIdx, sourceData);
        }
        
        AlbumPostProcess(albumID);
        if( fnToCall !== null &&  fnToCall !== undefined) {
          fnToCall( fnParam1, fnParam2, null );
        }
      }
      
      // download one page of data (=500 entries)
      var FlickrGetOnePage = function( url, page ) {
        jQuery.getJSON(url+'&page='+page+'&jsoncallback=?', function(data, status, xhr) {

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


    
    function FlickrParsePhotos( albumIdx, source ) {
      // var source = '';
      // if( G.O.photoset.toUpperCase() == 'NONE' || G.O.album.toUpperCase() == 'NONE' ) {
        // source = data.photos.photo;
      // }
      // else {
        // source = data.photoset.photo;
      // }

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
          newItem.imageWidth=item.width_o;
          newItem.imageHeight=item.height_o;
        }
        else {
          newItem.imageWidth=item.width_z;
          newItem.imageHeight=item.height_z;
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
    function FlickrParsePhotoSets( albumIdx, source ) {
      var albumID=G.I[albumIdx].GetID();
      
      // var source = data.photosets.photoset;
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
    var NanoAlert = NGY2Tools.NanoAlert;
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
  
  
  
  
  