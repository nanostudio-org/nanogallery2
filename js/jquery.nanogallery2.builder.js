/**!
 * @preserve nanogallery2 - code builder
 * Javascript image gallery by Christophe Brisbois
 * Demo: http://nanogallery.brisbois.fr
 * Sources: https://github.com/Kris-B/nanoGALLERY
 */

 
// ################################################
// ##### nanogallery2 - configuration builder #####
// ################################################
 

// jQuery plugin - nanoGALLERY DEMO PANEL
(function( $ ) {
    var settingsWithoutDefault= {};
    jQuery.fn.nanogallery2builder = function(options) {
      var g_containerDemo=null,
      g_containerDemoPanel=null,
      g_containerNew=null,
      g_save=null;

      if( options == 'code' ) {
        // alert(JSON.stringify(settingsWithoutDefault, null, 4));
        alert(JSON.stringify(settingsWithoutDefault));
        // console.dir(settingsWithoutDefault);
        // alert(settingsWithoutDefault);
        return;
      }
    

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
      
      var ds=$f.find('select[name=dataSource]').val();
      switch( ds ) {
        case 'google':
        case 'flickr':
          addSetting(settings2, 'userID', $f.find('[name=userID]').val());
          addSetting(settings2, 'kind', ds);
          break;
        default:
          addSetting(settings2, 'kind', '');
          addSetting(settings2, 'itemsBaseURL', $f.find('[name=itemsBaseURL]').val());
          jQuery("#nanoGallery3").html($f.find('[name=htmlMarkup]').val());
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
      // Thumbnail display transition
      addSetting(settings2, 'thumbnailDisplayTransition', $f.find('select[name=thumbnailDisplayTransition]').val());
      addSetting(settings2, 'thumbnailDisplayTransitionDuration', parseInt($f.find('[name=thumbnailDisplayTransitionDuration]').val()));
      addSetting(settings2, 'thumbnailDisplayInterval', parseInt($f.find('[name=thumbnailDisplayInterval]').val()));
      
      // Thumbnail label
      addSettingThumbnailLabel(settings2, 'position', $f.find('select[name=thumbnailLabelPosition]').val());
      addSettingThumbnailLabel(settings2, 'align', $f.find('select[name=thumbnailLabelAlignement]').val());
      if( $f.find('select[name=thumbnailLabelDisplay]').val() == 'true' ) {
        addSettingThumbnailLabel(settings2, 'display', true );
      }
      else {
        settings.thumbnailLabel.display=false;
        addSettingThumbnailLabel(settings2, 'display', false );
      }
      if( $f.find('select[name=thumbnailLabelTitleMultiline]').val() == 'true' ) {
        settings.thumbnailLabel.titleMultiLine=true;
        addSettingThumbnailLabel(settings2, 'titleMultiLine', true );
      }
      else {
        settings.thumbnailLabel.titleMultiLine=false;
        addSettingThumbnailLabel(settings2, 'titleMultiLine', false );
      }
      if( $f.find('select[name=thumbnailLabelDisplayDescription]').val() == 'true' ) {
        settings.thumbnailLabel.displayDescription=true;
        addSettingThumbnailLabel(settings2, 'displayDescription', true );
      }
      else {
        settings.thumbnailLabel.displayDescription=false;
        addSettingThumbnailLabel(settings2, 'displayDescription', false );
      }
      if( $f.find('select[name=thumbnailLabelDescriptionMultiline]').val() == 'true' ) {
        settings.thumbnailLabel.descriptionMultiLine=true;
        addSettingThumbnailLabel(settings2, 'descriptionMultiLine', true );
      }
      else {
        settings.thumbnailLabel.descriptionMultiLine=false;
        addSettingThumbnailLabel(settings2, 'descriptionMultiLine', false );
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
        alert(eltName);
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
      if( $f.find('select[name=galleryLastRowFull]').val() == 'true' ) {
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
      if( $f.find('select[name=displayBreadcrumb]').val() == 'true' ) {
        addSetting(settings2, 'displayBreadcrumb', true);
      }
      else {
        addSetting(settings2, 'displayBreadcrumb', false);
      }
      if( $f.find('select[name=breadcrumbAutoHideTopLevel]').val() == 'true' ) {
        addSetting(settings2, 'breadcrumbAutoHideTopLevel', true);
      }
      else {
        addSetting(settings2, 'breadcrumbAutoHideTopLevel', false);
      }
      if( $f.find('select[name=breadcrumbOnlyCurrentLevel]').val() == 'true' ) {
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
      
      if( $f.find('select[name=thumbnailLevelUp]').val() == 'true' ) {
        settings.thumbnailLevelUp=true;
        addSetting(settings2, 'thumbnailLevelUp', true);
      }
      else {
        addSetting(settings2, 'thumbnailLevelUp', false);
      }

      
      var defSettings=cloneJSObject(jQuery.nanogallery2.defaultOptions);

      settingsWithoutDefault=GetSettingsWithoutDefaultValues(settings,defSettings );
      
      var html_part1='&lt;html&gt;\n';
      html_part1+='  &lt;head&gt;\n';
      html_part1+='    &lt;meta name="viewport" content="user-scalable=no, width=device-width, initial-scale=1, maximum-scale=1"&gt;\n\n';
      html_part1+='    &lt;script type="text/javascript" src="third.party/jquery-1.12.4.min.js"&gt;&lt;/script&gt;\n\n';
      html_part1+='    &lt;link href="css/nanogallery2.css" rel="stylesheet" type="text/css"&gt;\n';
      // html_part1+='    &lt;script type="text/javascript" src="jquery.nanogallery2.core.js"&gt;&lt;/script&gt;\n';
      // html_part1+='    &lt;script type="text/javascript" src="jquery.nanogallery2.data.google.js"&gt;&lt;/script&gt;\n';
      // html_part1+='    &lt;script type="text/javascript" src="jquery.nanogallery2.data.flickr.js"&gt;&lt;/script&gt;\n';
      html_part1+='    &lt;script type="text/javascript" src="jquery.nanogallery2.js"&gt;&lt;/script&gt;\n';
      html_part1+='\n';
      var html_part2='  &lt;/head&gt;\n';
      html_part2+='  &lt;body&gt;\n\n';
      html_part2+='    &lt;h1&gt;Gallery made with nanogallery2&lt;/h1&gt;\n';
      html_part2+='\n';
      html_part2+='    &lt;div data-nanogallery2=';
      var html_part3='&gt;\n    &lt;/div&gt;\n';
      html_part3+='    \n';
      html_part3+='  &lt;/body&gt;\n';
      html_part3+='&lt;/html&gt;\n';
      var html=html_part1;
      
      var leadingSpaces='      ';
      var json=JSON.stringify(settings2,null,2);
      json=json.split('\n').join('\n'+leadingSpaces);
      html+=html_part2;
      html+=json;
      html+=html_part3;
      jQuery('#ngy2_template').html(html);

      addSetting(settings2, 'locationHash', false);
      var nanoGALLERY_obj = jQuery("#nanoGallery3").css({opacity:1, height:''}).nanogallery2(settings2);
    }
  };
  
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
  

  
  
  
