// google analytics
window._gaq = window._gaq || [];
var pluginUrl = 'https://www.google-analytics.com/plugins/ga/inpage_linkid.js';
window._gaq.push(['_require', 'inpage_linkid', pluginUrl]);
window._gaq.push(['_setAccount', 'UA-39069349-8']);
_gaq.push(['_trackPageview']);
window._gaq.push(['_trackEvent', 'portable', 'URL', window.location.href.replace(window.location.hash,'')]);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://stats.g.doubleclick.net/dc.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
