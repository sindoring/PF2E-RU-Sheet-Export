import { PDFDocument } from './lib/pdf-lib.esm.js';
import { systemMapping, systemMappingSheet } from './systemMapping.js';
import { asFoundryRoute } from './pdf-utils.js';

const MODULE_ID = (import.meta.url.match(/\/modules\/([^/]+)\//)?.[1]) ?? "sheet-export-pf2e-ru";


async function getMapping(mappingChoice, mappingRelease, mappingElement) {
	console.log("get mapping");
	/*
	console.log(`/modules/sheet-export/mappings/${game.system.id}/${mappingChoice}/${mappingRelease}/${mappingElement}.json`);
	console.log(getRoute(`/modules/sheet-export/mappings/${game.system.id}/${mappingChoice}/${mappingRelease}/${mappingElement}.json`));
	const mapping = await fetch(getRoute(`/modules/sheet-export/mappings/${game.system.id}/${mappingChoice}/${mappingRelease}/${mappingElement}.json`)).then(response => response.text()
	);
	console.log(mapping);
	try {
		return JSON.parse(mapping);
	} catch (err) {
		console.error('Error parsing JSON:', err);
		return {};
	}
*/
	//let mappingClass;
	const { default: mappingClass } = await import(getRoute(`/modules/${MODULE_ID}/mappings/${game.system.id}/${mappingChoice}/${mappingRelease}/${mappingElement}.js`));
	console.log(mappingClass);
	var mc = new mappingClass(actor, this.sheetType, this.sheet);
	console.log(mc);
	console.log(mc.getMapping("name"));
	console.log(mc.getMapping("test1"));
	return mc;
}

async function getPdf(pdfUrl, buffer = null) {
	console.log(pdfUrl);
	let pdfBytes = null;
	if (buffer == null) {
		const candidates = [];
		if (/^https?:\/\//i.test(pdfUrl)) {
			candidates.push(pdfUrl);
			// External URLs can fail in-browser due to CORS; keep a local fallback for PF2E RU sheet.
			if (pdfUrl.includes("pf2.ru/media/pc_sheets/RM_CharacterSheet_Fillable.pdf")) {
				candidates.push(`/modules/${MODULE_ID}/mappings/pf2e/RU/latest/RM_CharacterSheet_Fillable.pdf`);
			}
		} else {
			candidates.push(pdfUrl);
		}

		let lastError = null;
		for (const candidate of candidates) {
			try {
				const response = await fetch(asFoundryRoute(candidate));
				if (!response.ok) {
					lastError = new Error(`HTTP ${response.status} for ${candidate}`);
					continue;
				}
				pdfBytes = await response.arrayBuffer();
				break;
			} catch (error) {
				lastError = error;
			}
		}

		if (!pdfBytes) {
			const message = `Cannot load PDF template. Download RM_CharacterSheet_Fillable.pdf and place it in modules/${MODULE_ID}/mappings/pf2e/RU/latest/.`;
			console.error(message, lastError);
			throw new Error(message);
		}
	} else {
		pdfBytes = buffer;
	}

	const bytesView = new Uint8Array(pdfBytes);
	const pdfSignature = [0x25, 0x50, 0x44, 0x46, 0x2D]; // %PDF-
	const isPdf = pdfSignature.every((value, index) => bytesView[index] === value);
	if (!isPdf) {
		throw new Error(`Template file is not a valid PDF. Download RM_CharacterSheet_Fillable.pdf manually and place it in modules/${MODULE_ID}/mappings/pf2e/RU/latest/.`);
	}

	const pdfDoc = await PDFDocument.load(pdfBytes);
	return pdfDoc;
}

function getSheetTypeFromActor(actor, mappingChoice = "", mappingRelease = "") {
	let systemMappingsSheet = systemMappingSheet();
	if (systemMappingsSheet[game.system.id] == undefined) {
		console.log("game system not yet supported by sheet-export");
		return;
	}

	const mappedType = systemMappingsSheet[game.system.id][actor.type];
	if (!mappedType) {
		console.log("the sheet for this Document Type is not supported by sheet-export");
		return;
	}

	console.log("there is a mapping for the actor type");
	console.log(`/modules/${MODULE_ID}/mappings/${game.system.id}/${mappingChoice}/${mappingRelease}/${mappedType}.js`);
	return mappedType;
}

function getSheetType(actor, mappingChoice = "", mappingRelease = "") {
	let systemMappings = systemMapping();

	if (systemMappings[game.system.id] == undefined) {
		console.log("game system not yet supported by sheet-export");
		return;
	}

	if (systemMappings[game.system.id].player?.includes(actor.type ?? actor.data.type)) {
		return "player";
	}

	if (systemMappings[game.system.id].npc?.includes(actor.type ?? actor.data.type)) {
		return "npc";
	}

	console.log("the sheet for this Document Type is not supported by sheet-export");
	return;
}

export { getMapping, getPdf, getSheetType, getSheetTypeFromActor };

