module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      all: [
        'Gruntfile.js',
        'index.js',
        'public/**/*.js',
        '!public/lib/**'
      ],
      options: {
        globals: {
          eqeqeq: true
        }
      }
    }
  });
};
