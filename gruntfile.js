module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');

  var banner = [
        '/* <%= pkg.name %> - v<%= pkg.version %> - ',
        '<%= grunt.template.today("yyyy-mm-dd") %> - <%= pkg.homepage %> */\n'
      ].join('');

    grunt.initConfig({
      concat: {
        options: {
          banner: banner
        },
        minimal: {
          src: [
            'header.html',
            'test.html',
            'footer.html'
          ],
          dest: 'mypage.html'
        }
      }
    });
      
    grunt.registerTask('build-minimal', [
      'concat:minimal'
      /* 'uglify:standardTarget',
      'concat:minimalDebug',
      'yuidoc',
      'copy:redirects' */
    ]);
}
      
