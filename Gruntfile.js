module.exports = function(grunt) {

	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-text-replace');
	grunt.loadNpmTasks("grunt-inline");
	grunt.loadNpmTasks('grunt-contrib-watch');
	
	//Gruntの設定
	grunt.initConfig({
		copy: {
			beforeBuild:{
				files: [{
					src: ["src/ktm.html", "src/js/**", "src/css/**"],
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
			}
		},
		concat: {
			previewer: {
				src: [
					"dist/temp/src/css/previewer-lite.css",
				],
				dest: "dist/temp/src/css/previewer.css"
			},
			previewerAndHljs: {
				src: [
					"dist/temp/src/css/previewer-lite.css",
					"dist/temp/src/css/previewer-hljs.css",
				],
				dest: "dist/temp/src/css/previewer.css"
			}
		},
		inline: {
			kantanCss: {
				options:{
					tag: "__inline_kantan_css",
					cssmin: true
				},
				src: ["dist/temp/src/ktm.html"],
				dest: "dist/temp/src/ktm.html"
			},
			kantanCss_noCompressed: {
				options:{
					tag: "__inline_kantan_css",
					cssmin: false
				},
				src: ["dist/temp/src/ktm.html"],
				dest: "dist/temp/src/ktm.html"
			},
			previewerCss: {
				options:{
					tag: "__inline_previewer_css",
					cssmin: false
				},
				src: ["dist/temp/src/ktm.html"],
				dest: "dist/temp/src/ktm.html"
			},
			markedJs: {
				options:{
					tag: "__inline_marked_min_js",
					uglify: false
				},
				src: ["dist/temp/src/ktm.html"],
				dest: "dist/temp/src/ktm.html"
			},
			highlightJs: {
				options:{
					tag: "__inline_highlight_min_js",
					uglify: false
				},
				src: ["dist/temp/src/ktm.html"],
				dest: "dist/temp/src/ktm.html"
			},
			raphaelJs: {
				options:{
					tag: "__inline_raphael_min_js",
					uglify: false
				},
				src: ["dist/temp/src/ktm.html"],
				dest: "dist/temp/src/ktm.html"
			},
			underscoreJs: {
				options:{
					tag: "__inline_underscore_min_js",
					uglify: false
				},
				src: ["dist/temp/src/ktm.html"],
				dest: "dist/temp/src/ktm.html"
			},
			jsSequenceDiagramsJs: {
				options:{
					tag: "__inline_js_sequence_diagrams_min_js",
					uglify: false
				},
				src: ["dist/temp/src/ktm.html"],
				dest: "dist/temp/src/ktm.html"
			},
			flowchartJs: {
				options:{
					tag: "__inline_flowchart_min_js",
					uglify: false
				},
				src: ["dist/temp/src/ktm.html"],
				dest: "dist/temp/src/ktm.html"
			},
			kantanEditorJs: {
				options:{
					tag: "__inline_kantan_editor_js",
					uglify: true
				},
				src: ["dist/temp/src/ktm.html"],
				dest: "dist/temp/src/ktm.html"
			},
			kantanEditorJs_noCompressed: {
				options:{
					tag: "__inline_kantan_editor_js",
					uglify: false
				},
				src: ["dist/temp/src/ktm.html"],
				dest: "dist/temp/src/ktm.html"
			},
			kantanMarkdownJs: {
				options:{
					tag: "__inline_kantan_markdown_js",
					uglify: true
				},
				src: ["dist/temp/src/ktm.html"],
				dest: "dist/temp/src/ktm.html"
			},
			kantanMarkdownJs_noCompressed: {
				options:{
					tag: "__inline_kantan_markdown_js",
					uglify: false
				},
				src: ["dist/temp/src/ktm.html"],
				dest: "dist/temp/src/ktm.html"
			},
		},
		replace: {
			removeScript: {
				src: ['dist/temp/src/ktm.html'],
				overwrite: true,                 // overwrite matched source files
				replacements: [{
					from: /\n<script src.+/g,
					to: "",
				}]
			}
		},
		watch: {
			doc: {
				files: ["src/**"],
				// 変更されたらどのタスクを実行するか
				tasks: ["build-dev"]
			}
		},
	});
	//defaultタスクの定義
	grunt.registerTask("default", "watch");
	grunt.registerTask("build-dev", [
		"copy:beforeBuild",
		"concat:previewerAndHljs",
		"inline:kantanCss_noCompressed",
		"inline:previewerCss",
		"inline:markedJs",
		"inline:highlightJs",
		"inline:raphaelJs",
		"inline:underscoreJs",
		"inline:jsSequenceDiagramsJs",
		"inline:flowchartJs",
		"inline:kantanEditorJs_noCompressed",
		"inline:kantanMarkdownJs_noCompressed",
		"copy:afterBuild_dev",
	]);
	grunt.registerTask("build-lite", [
		"copy:beforeBuild",
		"concat:previewer",
		"inline:kantanCss",
		"inline:previewerCss",
		"inline:markedJs",
		"inline:kantanEditorJs",
		"inline:kantanMarkdownJs",
		"replace:removeScript",
		"copy:afterBuild_lite",
	]);
	grunt.registerTask("build-std", [
		"copy:beforeBuild",
		"concat:previewerAndHljs",
		"inline:kantanCss",
		"inline:previewerCss",
		"inline:markedJs",
		"inline:highlightJs",
		"inline:kantanEditorJs",
		"inline:kantanMarkdownJs",
		"replace:removeScript",
		"copy:afterBuild_std",
	]);
	grunt.registerTask("build-full", [
		"copy:beforeBuild",
		"concat:previewerAndHljs",
		"inline:kantanCss",
		"inline:previewerCss",
		"inline:markedJs",
		"inline:highlightJs",
		"inline:raphaelJs",
		"inline:underscoreJs",
		"inline:jsSequenceDiagramsJs",
		"inline:flowchartJs",
		"inline:kantanEditorJs",
		"inline:kantanMarkdownJs",
		"copy:afterBuild_full",
	]);
	grunt.registerTask("build", [
		"build-dev",
		"build-lite",
		"build-std",
		"build-full",
	]);
};

