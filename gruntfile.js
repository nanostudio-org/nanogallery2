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
          banner: banner
        },
        index: {
          src: [
            'header.html',
            'index.html',
            'footer.html'
          ],
          dest: 'build/index.html'
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
      
