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


      var albumIdx=NGY2Item.GetIdx(G, albumID);

      // title is identical to ID (only for albums)
      if( instance.I[albumIdx].title == '' ) {
        instance.I[albumIdx].title=JsonConvertCharset(albumID);
      }


      // var url = G.O.dataProvider + '?albumID='+encodeURIComponent(albumID);
      var url = G.O.dataProvider + '?albumID='+albumID;
      url += '&wxs='+G.tn.settings.width[G.GOM.curNavLevel].xs;
      url += '&hxs='+G.tn.settings.height[G.GOM.curNavLevel].xs;
      url += '&wsm='+G.tn.settings.width[G.GOM.curNavLevel].sm;
      url += '&hsm='+G.tn.settings.height[G.GOM.curNavLevel].sm;
      url += '&wme='+G.tn.settings.width[G.GOM.curNavLevel].me;
      url += '&hme='+G.tn.settings.height[G.GOM.curNavLevel].me;
      url += '&wla='+G.tn.settings.width[G.GOM.curNavLevel].la;
      url += '&hla='+G.tn.settings.height[G.GOM.curNavLevel].la;
      url += '&wxl='+G.tn.settings.width[G.GOM.curNavLevel].xl;
      url += '&hxl='+G.tn.settings.height[G.GOM.curNavLevel].xl;
      
      // console.dir(url);
      
      PreloaderDisplay(true);

      jQuery.ajaxSetup({ cache: false });
      jQuery.support.cors = true;
      try {
        
        
        
        var tId = setTimeout( function() {
          // workaround to handle JSONP (cross-domain) errors
          PreloaderDisplay(false);
          NanoAlert('Could not retrieve nanoPhotosProvider2 data (timeout).');
        }, 60000 );

        // console.log(url);        
        jQuery.getJSON(url, function(data, status, xhr) {
          clearTimeout(tId);
          PreloaderDisplay(false);
          JsonParseData(albumIdx, data);
          if( data.nano_status == 'ok' ) {
            AlbumPostProcess(albumID);
            if( fnToCall !== null &&  fnToCall !== undefined) {
              fnToCall( fnParam1, fnParam2, null );
            }
          }
          else {
            NanoAlert(G, 'Could not retrieve nanoPhotosProvider2 data. Error: ' + data.nano_status + ' - ' + data.nano_message);
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
      var foundAlbumID=false;
      var nb=0;

      
      jQuery.each(data.album_content, function(i,item){
      
        var title=item.title;
        // title=GetI18nItem(item,'title');
        // if( title === undefined ) { title=''; }

        var baseURL=G.O.dataProvider.substring(0, G.O.dataProvider.indexOf('nano_photos_provider2.php'));
        var src=baseURL+JsonConvertCharset(item.src);

        if( G.O.thumbnailLabel.get('title') != '' ) {
          title=GetImageTitle((item.src));
        }

        var description=item.description;     //'&nbsp;';
        // description=GetI18nItem(item,'description');
        // if( description === undefined ) { description=''; }

        var kind='image';
        if( item.kind !== undefined && item.kind.length > 0 ) {
          kind=item.kind;
        }

        var ID=null;
        if( item.ID !== undefined ) {
          ID=(item.ID);
        }

        var ok=true;
        if( kind == 'album' ) {
          if( !FilterAlbumName(title, ID) ) { ok=false; }
        }

        if( ok ) {
          var albumID=0;
          if( item.albumID !== undefined  ) {
            albumID=item.albumID;
            foundAlbumID=true;
          }

          var tags='';
          if( item.tags !== undefined ) {
            tags=item.tags;
          }
          
          var newItem=NGY2Item.New( G, title.split('_').join(' ') , description.split('_').join(' '), ID, albumID, kind, tags );
          newItem.src=src;

          // dominant colors as a gif
          if( item.dcGIF !== undefined ) {
            newItem.imageDominantColors='data:image/gif;base64,'+item.dcGIF;
          }
          // dominant color as hex rgb value
          if( item.dc !== undefined && item.dc !== '' ) {
            newItem.imageDominantColor=item.dc;
          }
          
          if( kind == 'album' ) {
            // number of items in album
            newItem.numberItems=item.cnt;
          }
          else {
            // image size
            newItem.imageWidth=item.imgWidth;
            newItem.imageHeight=item.imgHeight;
          }
          
          if( item.originalURL != '' ) {
            // newItem.downloadURL=item.download;
            newItem.downloadURL=baseURL+JsonConvertCharset(item.originalURL);
          }
          
          
          // retrieve responsive thumbnails urls and sizes
          var cnl=G.GOM.curNavLevel;
          var l=['xs', 'sm', 'me', 'la', 'xl'];
          for( var n=0; n<l.length; n++ ) {
            newItem.thumbs.url[cnl][l[n]]     = baseURL + JsonConvertCharset(item.t_url[n]);
            newItem.thumbs.width[cnl][l[n]]   = parseInt(item.t_width[n]);
            newItem.thumbs.height[cnl][l[n]]  = parseInt(item.t_height[n]);
          }
         
          if( typeof G.O.fnProcessData == 'function' ) {
            G.O.fnProcessData(newItem, G.O.dataProvider, data);
          }
        }
      });

      G.I[albumIdx].contentIsLoaded=true;   // album's content is ready

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
  
  
  
  
  