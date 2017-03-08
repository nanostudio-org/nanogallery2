module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-gh-pages');

  var banner = [
        '/* <%= pkg.name %> - v<%= pkg.version %> - ',
        '<%= grunt.template.today("yyyy-mm-dd") %> - <%= pkg.homepage %> */\n'
      ].join('');

    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      concat: {
        options: {
          // banner: banner
        },
        index: {
          src: [
            'template/header-1.html',
            'src/index_meta.html',
            'template/header-2.html',
            'template/header-3.html',
            'template/logo_index.html',
            'src/index.html',
            'template/footer.html'
          ],
          dest: 'build/index.html'
        },
        api: {
          src: [
            'template/header-1.html',
            'src/api_meta.html',
            'template/header-2.html',
            'template/header-3.html',
            'template/logo.html',
            'src/api.html',
            'template/footer.html'
          ],
          dest: 'build/api.html'
        },
        builder: {
          src: [
            'template/header-1.html',
            'src/builder_meta.html',
            'template/header-2.html',
            'template/header-builder.html',
            'template/header-3.html',
            'template/logo.html',
            'src/builder.html',
            'template/footer.html'
          ],
          dest: 'build/builder.html'
        },
        datasource: {
          src: [
            'template/header-1.html',
            'src/datasource_meta.html',
            'template/header-2.html',
            'template/header-3.html',
            'template/logo.html',
            'src/datasource.html',
            'template/footer.html'
          ],
          dest: 'build/datasource.html'
        },
        documentation: {
          src: [
            'template/header-1.html',
            'src/documentation_meta.html',
            'template/header-2.html',
            'template/header-3.html',
            'template/logo.html',
            'src/documentation.html',
            'template/footer.html'
          ],
          dest: 'build/documentation.html'
        },
        quickstart: {
          src: [
            'template/header-1.html',
            'src/quickstart_meta.html',
            'template/header-2.html',
            'template/header-3.html',
            'template/logo.html',
            'src/quickstart.html',
            'template/footer.html'
          ],
          dest: 'build/quickstart.html'
        },
        demonstration: {
          src: [
            'template/header-1.html',
            'src/demonstration_meta.html',
            'template/header-2.html',
            'template/header-3.html',
            'template/logo.html',
            'src/demonstration.html',
            'template/footer.html'
          ],
          dest: 'build/demonstration.html'
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
          branch: 'gh-pages',
          repo: 'https://' + process.env.GITHUB_API_KEY + '@github.com/nanostudio-org/nanogallery2.git'
        },
        src: ['**']
      }
    });
      
    grunt.registerTask('build-minimal', [
      'concat',
      'gh-pages'
      /* 'uglify:standardTarget',
      'concat:minimalDebug',
      'yuidoc',
      'copy:redirects' */
    ]);
}
      
