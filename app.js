
(function () {
	
	process.title = 'pinder';

	var config = require('./config.local');
	GLOBAL["config"] = config;

	var logger = require('./logger').create();
	GLOBAL['logger'] = logger;
	var utils = require('./utils');
	GLOBAL['utils'] = utils;

	var model = require('./api/model');
	var api = require('./api/api');
	var vkApi = require('./vkApi');
	
	vkApi.init()
		.then(function () {
			model.init();
			api.init();
		});
})();