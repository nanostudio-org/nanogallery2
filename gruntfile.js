module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-codepainter');
  grunt.loadNpmTasks('grunt-contrib-yuidoc');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-gh-pages');
    
  var banner = [
        '/* <%= pkg.name %> - v<%= pkg.version %> - ',
        '<%= grunt.template.today("yyyy-mm-dd") %> - <%= pkg.homepage %> */\n'
      ].join('');

    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      uglify: {
        standardTarget: {
          files: {
            'dist/jquery.nanogallery2.min.js': [
              'dist/jquery.nanogallery2.js'
            ]
          }
        }
      },
      concat: {
        options: {
          banner: banner
        },
        package: {
          src: [
            'src/jquery.nanogallery2.core.js',
            'src/jquery.nanogallery2.data_google.js',
            'src/jquery.nanogallery2.data_flickr.js'
          ],
          dest: 'dist/jquery.nanogallery2.js'
        },
        demonstration: {
          src: [
            'header.html',
            'demonstration.html',
            'footer.html'
          ],
          dest: 'build/demonstration.html'
        }
      },
      'gh-pages': {
        options: {
          base: 'dist',
          dotfiles: true,
          add: true,
          silent: true,
          user: {
            name: 'Kris-B',
            email: 'chr@brisbois.fr'
          },
          branch: 'master',
          repo: 'https://' + process.env.GITHUB_API_KEY + '@github.com/nanostudio-org/nanogallery2.git'
        },
        src: ['**']
      }
    });
      
    grunt.registerTask('build-nanogallery2', [
      'concat:package',
      'uglify:standardTarget',
      'gh-pages'
      /* 'uglify:standardTarget',
      'concat:minimalDebug',
      'yuidoc',
      'copy:redirects' */
    ]);
}
      
