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
  
  
  
  