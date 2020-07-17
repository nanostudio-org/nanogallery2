module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-terser');
  grunt.loadNpmTasks('grunt-bump');
  /* grunt.loadNpmTasks('grunt-codepainter'); */
  /* grunt.loadNpmTasks('grunt-contrib-yuidoc'); */
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-gh-pages');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-banner');
  grunt.loadNpmTasks('grunt-header');
    
  var banner = [
        '/* <%= pkg.name %> - v<%= pkg.version %> - ',
        '<%= grunt.template.today("yyyy-mm-dd") %> - <%= pkg.homepage %> */\n'
      ].join('');

    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      terser: {
        options: {
          /* banner: banner, */
          /* preserveComments: 'some' */
        },
        standardTarget: {
          files: {
            'build/dist/jquery.nanogallery2.min.js': [
              'build/dist/jquery.nanogallery2.js'
            ]
          }
        },
        standardTargetCore: {
          files: {
            'build/dist/jquery.nanogallery2.core.min.js': [
              'src/jquery.nanogallery2.core.js'
            ]
          }
        },
        standardTargetGoogle3: {
          files: {
            'build/dist/jquery.nanogallery2.data_google3.min.js': [
              'src/jquery.nanogallery2.data_google3.js'
            ]
          }
        },
        standardTargetFlickr: {
          files: {
            'build/dist/jquery.nanogallery2.data_flickr.min.js': [
              'src/jquery.nanogallery2.data_flickr.js'
            ]
          }
        },
        standardTargetNanoPhotosProvider2: {
          files: {
            'build/dist/jquery.nanogallery2.data_nano_photos_provider2.min.js': [
              'src/jquery.nanogallery2.data_nano_photos_provider2.js'
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
            'src/jquery.nanogallery2.data_nano_photos_provider2.js',
            'src/jquery.nanogallery2.data_google3.js',
            'src/jquery.nanogallery2.data_flickr.js'
          ],
          dest: 'build/dist/jquery.nanogallery2.js'
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
      cssmin: {
        'build/dist/css/nanogallery2.min.css': 'src/css/nanogallery2.css',
        'build/dist/css/nanogallery2.woff.min.css': 'src/css/nanogallery2.woff.css'
      },
      info: 'header text',
      header: {
        dist: {
            options: {
                text: '/* <%= pkg.name %> - v<%= pkg.version %> */'
            },
            files: {
                'build/dist/css/nanogallery2.min.css': 'build/dist/css/nanogallery2.min.css'
            }
        }
      },
      'gh-pages': {
        options: {
          base: 'build',
          dotfiles: true,
          add: true,
          silent: true,
          message: '[ci skip]',
          user: {
            name: 'Kris-B',
            email: 'chr@brisbois.fr'
          },
          branch: 'master',
          repo: 'https://' + process.env.GITHUB_API_KEY + '@github.com/nanostudio-org/nanogallery2.git'
        },
        src: '**/*'
      },
      usebanner: {
        taskName: {
          options: {
            position: 'top',
            banner: '/* <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */',
            linebreak: true
          },
          files: {
            src: [ 'build/dist/css/nanogallery2.min.css', 'build/dist/*.min.js' ]
          }
        }
      }
    });
      
    grunt.registerTask('build-nanogallery2', [
      'concat:package',
      'terser:standardTarget',
      'terser:standardTargetCore',
      'terser:standardTargetGoogle3',
      'terser:standardTargetFlickr',
      'terser:standardTargetNanoPhotosProvider2',
      'cssmin',
      'usebanner',
/*      'header', */
      'gh-pages'
      /* 'usebanner' */
      /* 'uglify:standardTarget',
      'concat:minimalDebug',
      'yuidoc',
      'copy:redirects' */
    ]);
}
      
