module.exports = function(grunt) {
	
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-text-replace');
	grunt.loadNpmTasks("grunt-inline");
	grunt.loadNpmTasks('grunt-contrib-watch');
	
	//Gruntの設定
	grunt.initConfig({
		clean: {
			temp: ["dist/temp"],
		},
		copy: {
			beforeBuild:{
				files: [{
					src: ["src/**"],
					dest: "dist/temp/"
				}]
			},
			afterBuild_dev:{
				files: [{
					src: ["dist/temp/src/ktm.html"],
					dest: "dist/ktm-dev.html"
				}]
			},
			afterBuild_lite:{
				files: [{
					src: ["dist/temp/src/ktm.html"],
					dest: "dist/ktm-lite.html"
				}]
			},
			afterBuild_std:{
				files: [{
					src: ["dist/temp/src/ktm.html"],
					dest: "dist/ktm-std.html"
				}]
			},
			afterBuild_full:{
				files: [{
					src: ["dist/temp/src/ktm.html"],
					dest: "dist/ktm-full.html"
				}]
			},
			afterBuild_updateJs:{
				files: [{
					src: ["dist/temp/src/kantanUpdate.js"],
					dest: "dist/kantanUpdate.js"
				}]
			}
			
		},
		cssmin: {
			css: {
				files: [
					{src: ["dist/temp/src/css/kantan.css"], dest: "dist/temp/src/css/kantan.css"},
					{src: ["dist/temp/src/css/drawer.css"], dest: "dist/temp/src/css/drawer.css"},
				]
			}
		},
		uglify: {
			js: {
				files: {
					"dist/temp/src/js/kantanEditor.js": ["dist/temp/src/js/kantanEditor.js"],
					"dist/temp/src/js/kantanDrawer.js": ["dist/temp/src/js/kantanDrawer.js"],
					"dist/temp/src/js/kantanMarkdown.js": ["dist/temp/src/js/kantanMarkdown.js"],
				}
			}
		},
		inline: {
			makeKtmHtml: {
				src: ["dist/temp/src/ktm.html"],
				dest: "dist/temp/src/ktm.html",
			},
			makeKantanUpdateJs: {
				options: {
					exts: ["js"],
				},
				src: ["dist/temp/src/kantanUpdate.js"],
				dest: "dist/temp/src/kantanUpdate.js",
			},
		},
		replace: {
			removeHighlightCss: {
				src: ["dist/temp/src/css/hljs.css"],
				overwrite: true,
				replacements: [
					{from: /[\s|\S]*/g, to: ""},
				],
			},
			removeHighlightJs: {
				src: ['dist/temp/src/ktm.html'],
				overwrite: true,
				replacements: [
					{from: /\s<script id="highlightJs"[\s|\S]+?<\/script>/g, to: ""},
				],
			},
			removeRaphaelJs: {
				src: ['dist/temp/src/ktm.html'],
				overwrite: true,
				replacements: [
					{from: /\s<script id="raphaelJs"[\s|\S]+?<\/script>/g, to: ""},
				],
			},
			removeUnderscoreJs: {
				src: ['dist/temp/src/ktm.html'],
				overwrite: true,
				replacements: [
					{from: /\s<script id="underscoreJs"[\s|\S]+?<\/script>/g, to: ""},
				],
			},
			removeJsSequenceDiagramsJs: {
				src: ['dist/temp/src/ktm.html'],
				overwrite: true,
				replacements: [
					{from: /\s<script id="jsSequenceDiagramsJs"[\s|\S]+?<\/script>/g, to: ""},
				],
			},
			removeFlowChartJs: {
				src: ['dist/temp/src/ktm.html'],
				overwrite: true,
				replacements: [
					{from: /\s<script id="flowchartJs"[\s|\S]+?<\/script>/g, to: ""},
				],
			},
			replaceKantanEdition_dev:{
				src: ['dist/temp/src/ktm.html'],
				overwrite: true,
				replacements: [
					{from: /__KANTAN_EDITION__/g, to: "dev"},
				],
			},
			replaceKantanEdition_lite:{
				src: ['dist/temp/src/ktm.html'],
				overwrite: true,
				replacements: [
					{from: /__KANTAN_EDITION__/g, to: "lite"},
				],
			},
			replaceKantanEdition_std:{
				src: ['dist/temp/src/ktm.html'],
				overwrite: true,
				replacements: [
					{from: /__KANTAN_EDITION__/g, to: "std"},
				],
			},
			replaceKantanEdition_full:{
				src: ['dist/temp/src/ktm.html'],
				overwrite: true,
				replacements: [
					{from: /__KANTAN_EDITION__/g, to: "full"},
				],
			},
			makeKtmStringJs: {
				src: ["dist/temp/src/ktm.html"],
				dest: "dist/temp/src/ktmString.js",
				replacements: [
					{from: /\\/g, to: "\\\\"},
					{from: /"/g, to: "\\\""},
					{from: /<!doctype[\s|\S]+?<html>\s/g, to: ""},
					{from: /\s<\/html>/g, to: ""},
					{from: /\n/g, to: "\\n\" + \n\""},
					{from: /^/g, to: "\""},
					{from: /$/g, to: "\""},
				],
			},
		},
		watch: {
			doc: {
				files: ["src/**"],
				// 変更されたらどのタスクを実行するか
				tasks: ["build-dev", "build-updateJs"]
			}
		},
	});
	//defaultタスクの定義
	grunt.registerTask("default", "watch");
	grunt.registerTask("build-dev", [
		"clean:temp",
		"copy:beforeBuild",
		"inline:makeKtmHtml",
		"replace:replaceKantanEdition_dev",
		"copy:afterBuild_dev",
	]);
	grunt.registerTask("build-lite", [
		"clean:temp",
		"copy:beforeBuild",
		"cssmin:css",
		"uglify:js",
		"replace:removeHighlightCss",
		"replace:removeHighlightJs",
		"replace:removeRaphaelJs",
		"replace:removeUnderscoreJs",
		"replace:removeJsSequenceDiagramsJs",
		"replace:removeFlowChartJs",
		"inline:makeKtmHtml",
		"replace:replaceKantanEdition_lite",
		"copy:afterBuild_lite",
	]);
	grunt.registerTask("build-std", [
		"clean:temp",
		"copy:beforeBuild",
		"cssmin:css",
		"uglify:js",
		"replace:removeRaphaelJs",
		"replace:removeUnderscoreJs",
		"replace:removeJsSequenceDiagramsJs",
		"replace:removeFlowChartJs",
		"inline:makeKtmHtml",
		"replace:replaceKantanEdition_std",
		"copy:afterBuild_std",
	]);
	grunt.registerTask("build-full", [
		"clean:temp",
		"copy:beforeBuild",
		"cssmin:css",
		"uglify:js",
		"inline:makeKtmHtml",
		"replace:replaceKantanEdition_full",
		"copy:afterBuild_full",
	]);
	grunt.registerTask("build-updateJs", [
		"clean:temp",
		"copy:beforeBuild",
		"cssmin:css",
		"uglify:js",
		"inline:makeKtmHtml",
		"replace:makeKtmStringJs",
		"inline:makeKantanUpdateJs",
		"copy:afterBuild_updateJs",
	]);
	grunt.registerTask("build", [
		"build-dev",
		"build-lite",
		"build-std",
		"build-full",
		"build-updateJs",
	]);
};

