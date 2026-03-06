export const registerSettings = function () {
	const modulename = "sheet-export";
	const fixedMappingOption = "RU-latest";

	console.log("----------- SHEET-EXPORT -----------");

	game.settings.register(modulename, "mappingOption", {
		name: game.i18n.localize(`${modulename}.settings.mappingOption.Name`),
		hint: game.i18n.localize(`${modulename}.settings.mappingOption.Hint`),
		scope: "world",
		config: false,
		default: fixedMappingOption,
		choices: { [fixedMappingOption]: "PF2E RU (latest)" },
		type: String,
		requiresReload: true,
		onChange: () => {
			game.settings.set(modulename, "mapping-version", "RU");
			game.settings.set(modulename, "mapping-release", "latest");
		},
	});

	game.settings.register(modulename, "mapping-version", {
		scope: "world",
		config: false,
		default: "RU",
		type: String,
		requiresReload: true,
	});

	game.settings.register(modulename, "mapping-release", {
		scope: "world",
		config: false,
		default: "latest",
		type: String,
		requiresReload: true,
	});

	game.settings.register(modulename, "defaultFontFamily", {
		name: "Default PDF font",
		hint: "Choose which Noto font family to embed when exporting character sheets to PDF.",
		scope: "world",
		config: true,
		requiresReload: true,
		type: String,
		choices: {
			"NotoSans-Regular.ttf": "Latin + extended (Noto Sans)",
			"NotoSansSC-Regular.ttf": "Chinese (Simplified) + Latin (Noto Sans SC)",
			"NotoSansArabic-Regular.ttf": "Arabic + basic Latin (Noto Sans Arabic)",
			"NotoSansHebrew-Regular.ttf": "Hebrew + basic Latin (Noto Sans Hebrew)",
			"NotoSansDevanagari-Regular.ttf": "Hindi / Devanagari",
			"NotoSansThai-Regular.ttf": "Thai",
		},
		default: "NotoSans-Regular.ttf",
	});

	game.settings.register(modulename, "omitChangeable", {
		scope: "world",
		config: true,
		type: Boolean,
		default: false,
		name: game.i18n.localize(`${modulename}.settings.omitChangeable.Name`),
		hint: game.i18n.localize(`${modulename}.settings.omitChangeable.Hint`),
	});
};
