module.exports = function(grunt) {

grunt.initConfig({
  chmod: {
    options: {
      mode: '755'
    },
    yourTarget1: {
      // Target-specific file/dir lists and/or options go here.
      src: ['./*.js']
    }
  }
});

grunt.loadNpmTasks('grunt-chmod');

grunt.registerTask('default', ['chmod']);

};
