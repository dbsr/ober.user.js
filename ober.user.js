// ==UserScript==
// @id             ober
// @name           ober
// @version        1.8.6
// @namespace      
// @author         dbsr
// @description    Unrestricts and plays video files hosted on sites supported by real-debrid
// @updateURL      https://raw.github.com/dbsr/ober.user.js/master/ober.user.js
// @downloadURL    https://raw.github.com/dbsr/ober.user.js/master/ober.user.js
// @description
// @include        *
// @require        http://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js
// @run-at         document-end
// @grant          GM_xmlhttpRequest
// @grant          GM_addStyle
// ==/UserScript==

var  REAL_DEBRID_REGEX = '1fichier.com|1st-files.com|2shared.com|4shared.com|aetv.com' +
      '|bayfiles.com|bitshare.com|canalplus.fr|cbs.com|cloudzer.net|crocko.com' +
      '|cwtv.com|dailymotion.com|dengee.net|depfile.com|dizzcloud.com|dl.free.fr' +
      '|extmatrix.com|filebox.com|filecloud.io|filefactory.com|fileflyer.com' +
      '|fileover.net|filepost.com|filerio.com|filesabc.com|filesend.net|filesflash.co' +
      '|filesmonster.com|freakshare.net|gigasize.com|hipfile.com|hotfile.co' +
      '|hugefiles.net|hulkshare.com|hulu.com|jumbofiles.com|justin.tv|keep2share.c' +
      '|letitbit.net|load.to|mediafire.com|mega.co.nz|megashares.com|mixturevideo.co' +
      '|netload.in|nowdownload.eu|nowvideo.eu|purevid.com|putlocker.com|rapidgator.ne' +
      '|rapidshare.com|redtube.com|rutube.ru|scribd.com|sendspace.com|share-online.bi' +
      '|sharefiles.co|shareflare.net|slingfile.com|sockshare.com|soundcloud.co' +
      '|speedyshare.com|turbobit.net|ultramegabit.com|unibytes.co' +
      '|uploaded.to|uploaded.net|ul.to|uploadhero.co|uploading.com|uptobox.co' +
      '|userporn.com|veevr.com|vimeo.com|vip-file.com|wat.tv|youporn.com|youtube.com';
    STYLESHEET  =
      '.ober-icon { display: inline-block; width: 1em; height: 1em;}' +
      '.icon-unresolved { background-color: grey; }' +
      '.icon-resolving { background-color: orange; }' +
      '.icon-failed { background-color: red; }' +
      '.icon-ok { background-color: green; }' +
      '#ober-video-modal { position: absolute; border: 30px solid black; border-right: 25px solid #eee; background-color: white; }' +
      '#ober-modal-close { float: right; position: relative; font-size: 2em; font-style: bold; top: -25px; right: -15px; }' +
      'a { cursor: pointer; }';
    HOSTER_FILTER_IDS = '23,99,15,24,13,22,27,25,8,28,2,40,11,46,47,51,55,59,60,64,65,67,70,71,81,92,97,102';
    VIDEO_PLAYER_WIDTH = 800;
    VIDEO_PLAYER_HEIGHT = 600;


$(function() {
  GM_addStyle(STYLESHEET);
  if(window.location.host === 'www.filestube.com' && window.location.href.match(/query/)) {
    doFilesTube();
  } else {
    addIcons();
  }
});

function addIcons() {
  var rgx = new RegExp(REAL_DEBRID_REGEX);
  $.each($('a'), function(id_idx, a) {
   if(rgx.test(a.href)) {
     addIcon(a, function(icon) {
       a = icon.previousSibling;
       resolve(a.href, icon);
     });
   }
  });
}

function addIcon(a, onclick) {
  icon = document.createElement('a');
  icon.className = 'ober-icon';
  icon.title = 'watch on ober';
  styleIcon(icon, 'unresolved');
  $(icon).click(function(event) {
      event.preventDefault();
      icon = event.target;
      $(icon).unbind('click');
      onclick(icon);
  });
  $(icon).insertAfter(a);
}

function styleIcon(icon, rstatus) {
  icon.setAttribute('class', 'ober-icon icon-' + rstatus);
}

function resolve(link, icon) {
  styleIcon(icon, 'resolving');
  unrestrict(link, function(resp) {
    if(resp.error === 0) {
      $(icon).click(function(event) {
        event.preventDefault();
        ext = resp.main_link.split('.').pop();
        if(ext.match(/avi|flv|wmv|mp4|mkv|mpg|gp3|ogm|webm/i)) {
          launchPlayer(resp.main_link, {x: event.clientX + 'px', y: event.clientY + 'px'});
        } else {
          console.log('ext => ' + ext);
          window.open(resp.main_link);
        }
      });
      styleIcon(icon, 'ok');
    } else {
      styleIcon(icon, 'failed');
    }
  });
}

function unrestrict(host_link, cb) {
  GM_xmlhttpRequest({
    method: 'GET',
    url: 'http://real-debrid.com/ajax/unrestrict.php?link=' + host_link,
    headers: {'Referer': 'http://real-debrid.com/download'},
    onload: function(data) {
      if(data.statusText === 'OK') {
        json_resp = JSON.parse(data.responseText);
        cb(json_resp);
      } else {
        console.error('error xmlrequest %o', data);
      }
    }
  });
}

function launchPlayer(video_link, icon) {
  if(isVLCInstalled()) {
    launchVLC(video_link);
  } else {
    launchHTMLPlayer(video_link, icon);
  }
}

function launchHTMLPlayer(video_link, icon) {
  link = document.createElement('link');
  link.setAttribute('href', 'http://vjs.zencdn.net/c/video-js.css');
  link.setAttribute('rel', 'stylesheet');
  video = document.createElement('video');
  video.setAttribute('id', 'video-player');
  video.setAttribute('class', 'video-js vjs-default-skin');
  video.setAttribute('width', VIDEO_PLAYER_WIDTH);
  video.setAttribute('height', VIDEO_PLAYER_HEIGHT);
  video.setAttribute('controls', 'auto');
  ext = video_link.split('.').pop();
  video.setAttribute('src', video_link);
  create_video_modal(function(video_modal) {
    video_modal.appendChild(link);
    video_modal.appendChild(video);
    video_modal.setAttribute('style', 'top: ' + icon.y + '; left: ' + icon.y + ';');
  });
  $.getScript('http://vjs.zencdn.net/c/video.js', function() {
      _V_('video-player').ready(function() {
        this.play();
      });
  });
}

function create_video_modal(cb) {
  try {
    $('#ober-video-modal').remove();
  } catch(e) {}
  video_modal = document.createElement('div');
  video_modal.setAttribute('id', 'ober-video-modal');
  a = document.createElement('a');
  a.setAttribute('id', 'ober-modal-close');
  $(a).html('x');
  $(a).click(function(event) {
    event.preventDefault();
    $('#ober-video-modal').remove();
  });
  video_modal.appendChild(a);
  cb(video_modal);
  document.body.appendChild(video_modal);
}




function launchVLC(link) {
  video_modal = create_video_modal();
  embed = document.createElement('embed');
  embed.setAttribute('width', VIDEO_PLAYER_WIDTH);
  embed.setAttribute('height', VIDEO_PLAYER_HEIGHT);
  embed.setAttribute('target', link);
  embed.setAttribute('id', 'video');
  embed.setAttribute('type', 'application/x-vlc-plugin');
  document.body.appendChild(video_modal);
  $(embed).appendTo('#ober-video-modal');
}



function doFilesTube() {
  url = location.href;
  if(!url.match(/z=_/)) {
    url = url.replace(/hosting=[0-9,]+/, '', url);
    url += '&hosting=' + HOSTER_FILTER_IDS + '&z=_';
    window.location.href = url;
  }
  modLinks();
}

function modLinks() {
  rgx = /http.*(?!http)/g;
  $.each($('div#newresult'), function(i, result) {
    resultLink = $('a.resultsLink', result);
    addIcon(resultLink, function(icon) {
      a = icon.previousSibling;
      $.get(a.href, function(data) {
        pre = $('pre', data);
        links = pre.text().match(rgx);
        if(links.length > 0) {
          link = links[0];
          resolve(link, icon);
        } else {
          styleIcon(icon, 'failed');
        }
      });
    });
  });
}

function isVLCInstalled() {
  return false;
//  for(i=0;i<navigator.plugins.length;i++) {
//    if(navigator.plugins[i].name.indexOf('VLC') !== -1) {
//      return true;
//    }
//  }
//  return false;
}
