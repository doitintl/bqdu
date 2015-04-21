module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			task: {
				src: ['app.js'],
				dest: 'dist/app.js'
			},
			options: {
				'mangle': {},
				'compress': true,
				'beautify': false,
				'expression': false,
				'report': 'min',
				'sourceMap': false,
				'sourceMapName': undefined,
				'sourceMapIn': undefined,
				'sourceMapIncludeSources': false,
				'enclose': undefined,
				'wrap': undefined,
				'exportAll': false,
				'preserveComments': undefined,
				'banner': '',
				'footer': ''
			}
		},
		clean: {
			task: {
				src: ['app.js'],
				dest: 'dist/app.js'
			},
			options: {
				'force': false,
				'no-write': false
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-clean');

	grunt.registerTask('default', ['uglify', 'clean']);
};
