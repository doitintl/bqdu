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
        copy: {
            html: {
                src: '*.html',
                dest: 'dist/',
            },
            styles: {
                src: '*.css',
                dest: 'dist/',
            },
            images: {
                src: '*.svg',
                dest: 'dist/',
            },
            yaml: {
                src: '*.yaml',
                dest: 'dist/',
            },
            favicon: {
                src: '*.ico',
                dest: 'dist/',
            },
        },
        clean: ["dist/"]
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');

	grunt.registerTask('default', ['clean','copy','uglify']);
};
