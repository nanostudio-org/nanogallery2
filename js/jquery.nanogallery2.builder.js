/**!
 * @preserve nanogallery2 - code builder
 * Javascript image gallery by Christophe Brisbois
 * Demo: http://nanogallery.brisbois.fr
 */

 
// ################################################
// ##### nanogallery2 - configuration builder #####
// ################################################
 

// jQuery plugin - nanoGALLERY DEMO PANEL
(function( $ ) {
    var settingsWithoutDefault= {};
    jQuery.fn.nanogallery2builder = function(portable) {
      var g_containerDemo=null,
      g_containerDemoPanel=null,
      g_containerNew=null,
      g_save=null;


      return this.each(function(index) {
        g_save=jQuery(this)[0].outerHTML;
        runBuilder(this);
        return;
      });
    
      String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
      };
    
      function jsonAdd( json, key, value) {
        if( json.length > 0 && !json.endsWith( ',') && !json.endsWith( '{')) {
          json+=',\n';
        }
        json+='      "'+key+'": ';
        if( typeof value === 'string' || value instanceof String ) {
          json+='"'+value+'"';
        }
        else {
          json+=value;
        }
        return(json);
      }
    
    
    function runBuilder( elt ) {

      var $f=jQuery('.ngy2-builder');
      
      var settings=cloneJSObject(jQuery.nanogallery2.defaultOptions);  
      var settings2={};  
      var settings_json='';

      function addSetting( settings, key, value) {
        if( jQuery.nanogallery2.defaultOptions[key] != value ) {
          settings[key]=value;
        }
      }

      function addSettingThumbnailLabel( settings, key, value) {
        if( jQuery.nanogallery2.defaultOptions.thumbnailLabel[key] != value ) {
          if( settings.thumbnailLabel == undefined ) {
            settings.thumbnailLabel={};
          }
          settings.thumbnailLabel[key]=value;
        }
      }

      
      jQuery("#nanoGallery3").nanogallery2('destroy');
      
      var markupSource='';
      var colorScheme = {};
      var colorSchemeChanged=false;
      
      var ds=$f.find('select[name=dataSource]').val();
      switch( ds ) {
        case 'google':
          addSetting(settings2, 'userID', $('#googleUserID').val());
          addSetting(settings2, 'kind', 'google2');
          if( !portable ) {
            addSetting(settings2, 'google2URL', 'http://YOUR_WEB_SERVER/nanogp/nanogp.php');
          }

          var v=$('#googleAlbum').selectpicker('val');
          if( v.length == 1 && v[0] == 'lstAlbums' ) {
            // list of albums
            var wl=$('#googleWhiteLst').val();
            wl=wl.replace(' ', '|');
            if( wl != '' ) {
              addSetting(settings2, 'whiteList', wl);
            }
            var bl=$('#googleBlackLst').val();
            bl=bl.replace(' ', '|');
            if( bl != '' ) {
              addSetting(settings2, 'blackList', bl);
            }
          }
          else {
            if( v.length == 1 ) {
              addSetting(settings2, 'album', v[0]);
            }
            else {
              addSetting(settings2, 'albumList2', v);
            }
          }
          if( $f.find('[name=googleOpenOriginal]').prop('checked') ) {
            addSetting(settings2, 'thumbnailOpenOriginal', true); 
          }
          break;
        case 'flickr':
          addSetting(settings2, 'userID', $('#flickrUserID').val());
          addSetting(settings2, 'kind', 'flickr');
          var v=$('#flickrAlbum').selectpicker('val');
          if( v.length == 1 && v[0] == 'lstAlbums' ) {
            // list of albums
            var wl=$('#flickrWhiteLst').val();
            wl=wl.replace(' ', '|');
            if( wl != '' ) {
              addSetting(settings2, 'whiteList', wl);
            }
            var bl=$('#flickrBlackLst').val();
            bl=bl.replace(' ', '|');
            if( bl != '' ) {
              addSetting(settings2, 'blackList', bl);
            }
          }
          else {
            if( v.length == 1 ) {
              addSetting(settings2, 'photoset', v[0]);
            }
            else {
              addSetting(settings2, 'albumList2', v);
            }
          }
          if( $f.find('[name=flickrOpenOriginal]').prop('checked') ) {
            addSetting(settings2, 'thumbnailOpenOriginal', true); 
          }
          break;
        default:
          addSetting(settings2, 'kind', '');
          addSetting(settings2, 'itemsBaseURL', $f.find('[name=itemsBaseURL]').val());
          jQuery("#nanoGallery3").html($f.find('[name=htmlMarkup]').val());
          markupSource=$f.find('[name=htmlMarkup]').val();
          break;
      }

      // thumbnail size
      var tw=$f.find('[name=thumbnailWidth]').val();
      var th=$f.find('[name=thumbnailHeight]').val();
      var v=$f.find('select[name=layoutEngine]').val();
      switch( v ) {
        case 'justified':
          addSetting(settings2, 'thumbnailWidth', 'auto');
          addSetting(settings2, 'thumbnailHeight', th);
          break;
        case 'cascading':
          addSetting(settings2, 'thumbnailWidth', tw);
          addSetting(settings2, 'thumbnailHeight', 'auto');
          break;
        default:
          addSetting(settings2, 'thumbnailWidth', tw);
          addSetting(settings2, 'thumbnailHeight', th);
          break;
      }

      // Thumbnail border
      addSetting(settings2, 'thumbnailBorderVertical', parseInt($f.find('[name=thumbnailBorderVertical]').val()));
      addSetting(settings2, 'thumbnailBorderHorizontal', parseInt($f.find('[name=thumbnailBorderHorizontal]').val()));

      var thumbnailBorderColor= $('#thumbnailBorderColor').colorpicker('getValue');
      if( thumbnailBorderColor != 'rgba(0,0,0,1)' ) {
        settings2.colorScheme = { thumbnail: { borderColor: thumbnailBorderColor } };
      }
      
      // Thumbnail display transition
      addSetting(settings2, 'thumbnailDisplayTransition', $f.find('select[name=thumbnailDisplayTransition]').val());
      addSetting(settings2, 'thumbnailDisplayTransitionDuration', parseInt($f.find('[name=thumbnailDisplayTransitionDuration]').val()));
      addSetting(settings2, 'thumbnailDisplayInterval', parseInt($f.find('[name=thumbnailDisplayInterval]').val()));
      
      // Thumbnail label
      addSettingThumbnailLabel(settings2, 'position', $f.find('select[name=thumbnailLabelPosition]').val());
      addSettingThumbnailLabel(settings2, 'align', $f.find('select[name=thumbnailLabelAlignement]').val());
      if( $f.find('[name=thumbnailLabelDisplay]').prop('checked') ) {
        settings.thumbnailLabel.display=true;
        addSettingThumbnailLabel(settings2, 'display', true );
      }
      else {
        settings.thumbnailLabel.display=false;
        addSettingThumbnailLabel(settings2, 'display', false );
      }
      if( $f.find('[name=thumbnailLabelTitleMultiline]').prop('checked') ) {
        settings.thumbnailLabel.titleMultiLine=true;
        addSettingThumbnailLabel(settings2, 'titleMultiLine', true );
      }
      else {
        settings.thumbnailLabel.titleMultiLine=false;
        addSettingThumbnailLabel(settings2, 'titleMultiLine', false );
      }
      if( $f.find('[name=thumbnailLabelDisplayDescription]').prop('checked') ) {
        settings.thumbnailLabel.displayDescription=true;
        addSettingThumbnailLabel(settings2, 'displayDescription', true );
      }
      else {
        settings.thumbnailLabel.displayDescription=false;
        addSettingThumbnailLabel(settings2, 'displayDescription', false );
      }
      if( $f.find('[name=thumbnailLabelDescriptionMultiline]').prop('checked') ) {
        settings.thumbnailLabel.descriptionMultiLine=true;
        addSettingThumbnailLabel(settings2, 'descriptionMultiLine', true );
      }
      else {
        settings.thumbnailLabel.descriptionMultiLine=false;
        addSettingThumbnailLabel(settings2, 'descriptionMultiLine', false );
      }
      if( $f.find('[name=allowHTMLinData]').prop('checked') ) {
        addSetting(settings2, 'allowHTMLinData', true); 
      }



      // thumbnail hover effect
      var thumbnailHoverEffect2='';
      if( !$f.find('[name=cbHoverAdv]').prop('checked') ) {
        // #### standard effect defintion
        var nbEff=0;
        var oneEffect= { name: '', duration : 400 };
        var effName=$f.find('select[name=thumbnailHoverEffect1]').val();
        // var effDur=$f.find('[name=thumbnailHoverEffectDuration1]').val();
        if( effName != '' ) {
          thumbnailHoverEffect2+=effName;
          // thumbnailHoverEffect2.push({ name: effName, duration : effDur });
        }
        effName=$f.find('select[name=thumbnailHoverEffect2]').val();
        // effDur=$f.find('[name=thumbnailHoverEffectDuration2]').val();
        if( effName != '' ) {
          thumbnailHoverEffect2+='|'+effName;
          // thumbnailHoverEffect2.push({ name: effName, duration : effDur });
        }
        effName=$f.find('select[name=thumbnailHoverEffect3]').val();
        // effDur=$f.find('[name=thumbnailHoverEffectDuration3]').val();
        if( effName != '' ) {
          // thumbnailHoverEffect2.push({ name: effName, duration : effDur });
          thumbnailHoverEffect2+='|'+effName;
        }
      }
      else {
        // #### advanced effect definition
        var eltName=$f.find('select[name=thumbnailHoverEffectAdv1Element]').val();
        var effName=$f.find('select[name=thumbnailHoverEffectAdv1]').val();
        if( effName == '' ) {
          effName=$f.find('[name=thumbnailHoverEffectAdv1Cust]').val();
        }
        var fromName=$f.find('[name=thumbnailHoverEffectAdv1From]').val();
        var toName=$f.find('[name=thumbnailHoverEffectAdv1To]').val();
        thumbnailHoverEffect2+=eltName+'_'+effName+'_'+fromName+'_'+toName;
        var durName=$f.find('[name=thumbnailHoverEffectAdv1Duration]').val();
        if( durName != '' ) {
          thumbnailHoverEffect2+='_'+durName;
        }

        eltName=$f.find('select[name=thumbnailHoverEffectAdv2Element]').val();
        if( eltName != '' ) {
          effName=$f.find('select[name=thumbnailHoverEffectAdv2]').val();
          if( effName == '' ) {
            effName=$f.find('[name=thumbnailHoverEffectAdv2Cust]').val();
          }
          fromName=$f.find('[name=thumbnailHoverEffectAdv2From]').val();
          toName=$f.find('[name=thumbnailHoverEffectAdv2To]').val();
          thumbnailHoverEffect2+='|'+eltName+'_'+effName+'_'+fromName+'_'+toName;
          durName=$f.find('[name=thumbnailHoverEffectAdv2Duration]').val();
          if( durName != '' ) {
            thumbnailHoverEffect2+='_'+durName;
          }
        }
        
        eltName=$f.find('select[name=thumbnailHoverEffectAdv3Element]').val();
        if( eltName != '' ) {
          effName=$f.find('select[name=thumbnailHoverEffectAdv3]').val();
          if( effName == '' ) {
            effName=$f.find('[name=thumbnailHoverEffectAdv3Cust]').val();
          }
          fromName=$f.find('[name=thumbnailHoverEffectAdv3From]').val();
          toName=$f.find('[name=thumbnailHoverEffectAdv3To]').val();
          thumbnailHoverEffect2+='|'+eltName+'_'+effName+'_'+fromName+'_'+toName;
          durName=$f.find('[name=thumbnailHoverEffectAdv3Duration]').val();
          if( durName != '' ) {
            thumbnailHoverEffect2+='_'+durName;
          }
        }
      }
      addSetting(settings2, 'thumbnailHoverEffect2', thumbnailHoverEffect2);

      
      // Gallery display mode
      addSetting(settings2, 'galleryDisplayMode', $f.find('select[name=galleryDisplayMode]').val());
      addSetting(settings2, 'galleryMaxRows', parseInt($f.find('[name=galleryMaxRows]').val()));
      addSetting(settings2, 'galleryDisplayMoreStep', parseInt($f.find('[name=galleryDisplayMoreStep]').val()));
      if( $f.find('[name=galleryLastRowFull]').prop('checked') ) {
        addSetting(settings2, 'galleryLastRowFull', true);
      }
      else {
        addSetting(settings2, 'galleryLastRowFull', false);
      }

      addSetting(settings2, 'galleryPaginationMode', $f.find('select[name=galleryPaginationMode]').val());
      addSetting(settings2, 'thumbnailAlignment', $f.find('select[name=thumbnailAlignment]').val());
      addSetting(settings2, 'galleryMaxItems', parseInt($f.find('[name=galleryMaxItems]').val()));
      addSetting(settings2, 'thumbnailGutterWidth', parseInt($f.find('[name=thumbnailGutterWidth]').val()));
      addSetting(settings2, 'thumbnailGutterHeight', parseInt($f.find('[name=thumbnailGutterHeight]').val()));
      addSetting(settings2, 'gallerySorting', $f.find('select[name=gallerySorting]').val());

      // Navigation
      if( $f.find('[name=displayBreadcrumb]').prop('checked') ) {
        addSetting(settings2, 'displayBreadcrumb', true);
      }
      else {
        addSetting(settings2, 'displayBreadcrumb', false);
      }
      if( $f.find('[name=breadcrumbAutoHideTopLevel]').prop('checked') ) {
        addSetting(settings2, 'breadcrumbAutoHideTopLevel', true);
      }
      else {
        addSetting(settings2, 'breadcrumbAutoHideTopLevel', false);
      }
      if( $f.find('[name=breadcrumbOnlyCurrentLevel]').prop('checked') ) {
        addSetting(settings2, 'breadcrumbOnlyCurrentLevel', true);
      }
      else {
        addSetting(settings2, 'breadcrumbOnlyCurrentLevel', false);
      }
      
      var gFT= $f.find('select[name=galleryFilterTags]').val();
      switch( gFT) {
        case 'true':
          addSetting(settings2, 'galleryFilterTags', true);
          break;
        case 'false':
          addSetting(settings2, 'galleryFilterTags', false);
          break;
        default:
          addSetting(settings2, 'galleryFilterTags', gFT);
          break;
      }
      
      if( $f.find('[name=thumbnailLevelUp]').prop('checked') ) {
        addSetting(settings2, 'thumbnailLevelUp', true);
      }
      else {
        addSetting(settings2, 'thumbnailLevelUp', false);
      }


      // LIGHTBOX
      if( $f.find('[name=thumbnailOpenImage]').prop('checked') ) {
        addSetting(settings2, 'thumbnailOpenImage', true); 
      }
      else {
        addSetting(settings2, 'thumbnailOpenImage', false); 
      }

      
      var defSettings=cloneJSObject(jQuery.nanogallery2.defaultOptions);

      settingsWithoutDefault=GetSettingsWithoutDefaultValues(settings,defSettings );
      
            
      var html_part1='&lt;html&gt;\n';
      html_part1+='  &lt;head&gt;\n';
      html_part1+='    &lt;meta name="viewport" content="user-scalable=no, width=device-width, initial-scale=1, maximum-scale=1"&gt;\n\n';
      html_part1+='    &lt;script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js"&gt;&lt;/script&gt;\n\n';
      html_part1+='    &lt;link href="https://unpkg.com/nanogallery2/dist/css/nanogallery2.min.css" rel="stylesheet" type="text/css"&gt;\n';
      // html_part1+='    &lt;script type="text/javascript" src="jquery.nanogallery2.core.js"&gt;&lt;/script&gt;\n';
      // html_part1+='    &lt;script type="text/javascript" src="jquery.nanogallery2.data.google.js"&gt;&lt;/script&gt;\n';
      // html_part1+='    &lt;script type="text/javascript" src="jquery.nanogallery2.data.flickr.js"&gt;&lt;/script&gt;\n';
      html_part1+='    &lt;script type="text/javascript" src="https://unpkg.com/nanogallery2/dist/jquery.nanogallery2.min.js"&gt;&lt;/script&gt;\n';
      html_part1+='\n';
      var html_part2='  &lt;/head&gt;\n';
      html_part2+='  &lt;body&gt;\n\n';
      html_part2+='    &lt;h1&gt;Gallery made with nanogallery2&lt;/h1&gt;\n';
      html_part2+='\n';
      html_part2+="    &lt;div data-nanogallery2='";
      var html_part3="'&gt;\n";
      var html_part4='\n    &lt;/div&gt;\n';
      html_part4+='    \n';
      html_part4+='  &lt;/body&gt;\n';
      html_part4+='&lt;/html&gt;\n';
      var html=html_part1;
      
      var leadingSpaces='      ';
      var json=JSON.stringify(settings2,null,2);
      json=json.split('\n').join('\n'+leadingSpaces);
      html+=html_part2;
      html+=json;
      html+=html_part3;
      if( markupSource != '' ) {
        html+=htmlEntities(markupSource);
      }
      html+=html_part4;
      jQuery('#ngy2_template').html(html);
      
      var portable_part1='&lt;!-- nanogallery2 portable - http://nano.gallery -->\n';
      portable_part1+='&lt;div id="ngy2p" data-nanogallery2-portable=\'';
      
      var k='';
      switch ( settings2.kind ) {
        case 'flickr':
          k='?k=f';
          break;
        case 'google':
          k='?k=g';
          break;
      }
      var portable_part2='\'>nanogallery2&lt;/div>\n';
      portable_part2+="&lt;script> var st = document.createElement('script'); st.type = 'text/javascript'; st.src = '//nano.gallery/portable.php"+k+"&u='+encodeURI(window.location.href); document.getElementsByTagName('head')[0].appendChild(st); &lt;/script>\n";
      portable_part2+='&lt;noscript>Please enable javascript to view the &lt;a href="//nano.gallery">gallery powered by nanogallery2.&lt;/a>&lt;/noscript>\n';
      portable_part2+='&lt;!-- end nanogallery2 -->';
      var html2=portable_part1;
      html2+=JSON.stringify(settings2,null,0);
      html2+=portable_part2;
      jQuery('#ngy2_portable').html(html2);
      

      addSetting(settings2, 'locationHash', false);
      var nanoGALLERY_obj = jQuery("#nanoGallery3").css({opacity:1, height:''}).nanogallery2(settings2);
    }
  };
  
    function htmlEntities(str) {
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
  
    function GetSettingsWithoutDefaultValues( settings, defSettings ) {
      var settingsWithoutDefault={};
      for (var attr in settings) {
        if( typeof settings[attr] == 'object' && settings[attr] != null && defSettings[attr] != null)  {
          var n= GetSettingsWithoutDefaultValues( settings[attr], defSettings[attr] );
          if( n != null && !jQuery.isEmptyObject(n) ) {
            settingsWithoutDefault[attr]=n;
          }
        }
        else {
          // value is not the default one
          if( defSettings[attr] != settings[attr] ) {
          // console.dir( typeof defSettings[attr]);
            if( typeof defSettings[attr] == 'array' ) {
            }
            else {
              settingsWithoutDefault[attr] = cloneJSObject(settings[attr]);
            }
            // settingsWithoutDefault[attr] = settings[attr];
          }
        }
      }
      return settingsWithoutDefault;
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


}( jQuery ));
  

  
  
  
