/** Freyas Better Maps — dynamic map doodad catalog + hybrid color grouping */
import { FBM } from "../fbm";

/** Longer / compound suffixes first so LightBlue does not become base “PaddedLight”. */
const VARIANT_SUFFIXES = [
	"LightBlue",
	"LightGreen",
	"LightRed",
	"LightPink",
	"LightPurple",
	"LightGray",
	"LightGrey",
	"LightYellow",
	"LightOrange",
	"LightBrown",
	"DarkBlue",
	"DarkGreen",
	"DarkRed",
	"DarkGray",
	"DarkGrey",
	"Dark",
	"Red2",
	/* wood / log species (before plain White/Black color) */
	"Pine",
	"Maple",
	"Acacia",
	"Mahogany",
	"Mangrove",
	"Cherry",
	"Oak",
	/* colors */
	"Red",
	"Blue",
	"Green",
	"Yellow",
	"Orange",
	"Purple",
	"Pink",
	"White",
	"Black",
	"Brown",
	"Grey",
	"Gray",
	"Cyan",
	"Teal",
	"Gold",
	"Silver",
	"Violet",
	"Magenta",
	"Lime",
	"Navy",
	"Beige",
	"Tan",
];

const DOOR_FAMILIES = ["BrownDoor", "RoyalDoor", "SteelDoor", "GrayDoor", "Wood", "Metal"];

const EFFECT_LABELS: Record<number, string> = {
	10: "Blank",
	11: "Shadow Light",
	12: "Shadow Medium",
	13: "Shadow Dark",
	14: "Tint Red",
	15: "Tint Blue",
	16: "Tint Green",
	17: "Glow Yellow",
};

FBM.CATALOG_CACHE_VERSION = 2;

function humanize(style: string): string {
	return String(style || "")
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/_/g, " ")
		.trim();
}

function stripVariantSuffix(style: string): { base: string; variant: string | null } {
	const s = String(style || "");
	/* OakWood / CedarWood → Wood + Oak/Cedar */
	if (s.endsWith("Wood") && s.length > 4) {
		const species = s.slice(0, -4);
		if (species.length >= 3) return { base: "Wood", variant: species };
	}
	for (let i = 0; i < VARIANT_SUFFIXES.length; i++) {
		const c = VARIANT_SUFFIXES[i];
		if (s.length > c.length && s.endsWith(c)) {
			const base = s.slice(0, -c.length);
			if (base.length >= 2) return { base: base, variant: c };
		}
	}
	return { base: s, variant: null };
}

function doorFamilySplit(style: string): { base: string; variant: string | null } {
	const s = String(style || "");
	if (s === "Blank") return { base: "Blank", variant: null };
	for (let i = 0; i < DOOR_FAMILIES.length; i++) {
		const f = DOOR_FAMILIES[i];
		if (s === f) return { base: f === "Metal" ? "Metal" : f === "Wood" ? "Wood" : f, variant: null };
		if (s.startsWith(f) && s.length > f.length) {
			return { base: f, variant: s.slice(f.length) };
		}
	}
	return stripVariantSuffix(s);
}

function typeDisplayName(kind: string, type: string): string {
	const key =
		kind === "tile" ? "TileTypeName" + type : kind === "object" ? "ObjectTypeName" + type : "EffectTypeName" + type;
	if (typeof TextGet === "function") {
		const t = TextGet(key);
		if (t && t !== key) return t;
	}
	return humanize(type);
}

function itemDisplayName(raw: { name?: string; style: string; id: number }): string {
	if (raw.name && String(raw.name).trim()) return String(raw.name).trim();
	return humanize(raw.style) || "Item " + raw.id;
}

function doodadUrl(kind: string, type: string, style: string): string {
	if (typeof MapGetAssetUrl === "function") {
		return MapGetAssetUrl(kind === "Tile" ? "Tile" : "Object", type, style);
	}
	const folder = kind === "Tile" ? "Tiles" : "Objects";
	return "Assets/Map/" + folder + "/" + type + "/" + style + ".png";
}

function tileThumbUrl(id: number, type: string, style: string): string {
	if (typeof MapGetDoodadAssetUrl === "function" && typeof MapDataGetTile === "function") {
		try {
			const u = MapGetDoodadAssetUrl(MapDataGetTile(id));
			if (u) return u;
		} catch (e) {
			/* ignore */
		}
	}
	return doodadUrl("Tile", type, style);
}

function objectThumbUrl(id: number, type: string, style: string): string {
	if (typeof MapGetDoodadAssetUrl === "function" && typeof MapDataGetObject === "function") {
		try {
			const u = MapGetDoodadAssetUrl(MapDataGetObject(id));
			if (u) return u;
		} catch (e) {
			/* ignore */
		}
	}
	return doodadUrl("Object", type, style);
}

function effectThumbCss(color: number[] | null): string {
	if (!color || !color.length) return "#2a3038";
	if (typeof RgbaArrayToHTMLColor === "function") {
		try {
			return RgbaArrayToHTMLColor(color);
		} catch (e) {
			/* fall through */
		}
	}
	const r = color[0] || 0;
	const g = color[1] || 0;
	const b = color[2] || 0;
	const a = color[3] != null ? color[3] : 1;
	return "rgba(" + r + "," + g + "," + b + "," + a + ")";
}

function catalogFingerprint(entries: { id: number; type: string; style: string }[]): string {
	return (
		"v" +
		FBM.CATALOG_CACHE_VERSION +
		"|" +
		entries
			.map(function (e) {
				return e.id + ":" + e.type + ":" + e.style;
			})
			.join("|")
	);
}

function collectRaw() {
	const tiles: { id: number; type: string; style: string; name?: string }[] = [];
	const objects: {
		id: number;
		type: string;
		style: string;
		name?: string;
		canCustomize: boolean;
		layers: { name: string; defaultColor: string }[];
		canTransform: boolean;
	}[] = [];
	const effects: { id: number; type: string; style: string; name?: string; color: number[] | null }[] = [];

	const tileMap = typeof MapDataTiles !== "undefined" ? MapDataTiles : null;
	const objMap = typeof MapDataObjects !== "undefined" ? MapDataObjects : null;
	const fxMap = typeof MapDataEffects !== "undefined" ? MapDataEffects : null;

	if (tileMap && typeof tileMap.forEach === "function") {
		tileMap.forEach(function (t: any) {
			if (!t || t.ID == null || !t.Type || !t.Style) return;
			if (t.DeprecatedID != null) return;
			tiles.push({ id: t.ID, type: t.Type, style: t.Style, name: t.Name });
		});
	}
	if (objMap && typeof objMap.forEach === "function") {
		objMap.forEach(function (o: any) {
			if (!o || o.ID == null || !o.Type || !o.Style) return;
			if (o.DeprecatedID != null) return;
			const canCustomize = o.CanBeCustomized !== false;
			const layers: { name: string; defaultColor: string }[] = [];
			if (Array.isArray(o.Layers)) {
				o.Layers.forEach(function (L: any) {
					if (L && L.IsColorable) {
						layers.push({
							name: L.Name || "",
							defaultColor: typeof L.DefaultColor === "string" ? L.DefaultColor : "#FFFFFF",
						});
					}
				});
			}
			const canTransform =
				typeof MapCanTransformObject === "function" ? !!MapCanTransformObject(o) : !o.JoinsNeighbors && !o.CanPlaceOnWalls;
			objects.push({
				id: o.ID,
				type: o.Type,
				style: o.Style,
				name: o.Name,
				canCustomize: canCustomize,
				layers: layers,
				canTransform: canTransform,
			});
		});
	}
	if (fxMap && typeof fxMap.forEach === "function") {
		fxMap.forEach(function (e: any) {
			if (!e || e.ID == null) return;
			const label = e.Name || EFFECT_LABELS[e.ID] || "Effect " + e.ID;
			effects.push({
				id: e.ID,
				type: e.Type || "StaticLighting",
				style: label.replace(/\s+/g, ""),
				name: label,
				color: Array.isArray(e.Color) ? e.Color : null,
			});
		});
	}

	return { tiles: tiles, objects: objects, effects: effects };
}

function groupTiles(tiles: { id: number; type: string; style: string; name?: string }[]) {
	const byType: Record<string, typeof tiles> = {};
	tiles.forEach(function (t) {
		if (!byType[t.type]) byType[t.type] = [];
		byType[t.type].push(t);
	});
	const categories: any[] = [];
	Object.keys(byType)
		.sort()
		.forEach(function (type) {
			const list = byType[type];
			const groups: Record<string, any> = {};
			list.forEach(function (t) {
				const g = stripVariantSuffix(t.style);
				const key = g.base;
				if (!groups[key]) {
					groups[key] = {
						id: "tile:" + type + ":" + key,
						name: humanize(key),
						kind: "tile",
						type: type,
						groupKey: key,
						canCustomize: false,
						layers: [],
						canTransform: false,
						thumbStyle: t.style,
						thumbId: t.id,
						thumbUrl: "",
						variants: [],
					};
				}
				const vName = g.variant ? humanize(g.variant) : t.name && !g.variant ? "Default" : "Default";
				groups[key].variants.push({
					id: "tile-v:" + t.id,
					name: g.variant ? humanize(g.variant) : "Default",
					displayName: itemDisplayName(t),
					clubId: t.id,
					style: t.style,
					colorHint: g.variant,
					thumbUrl: tileThumbUrl(t.id, type, t.style),
					baked: true,
					custom: false,
				});
				if (!g.variant) {
					groups[key].thumbStyle = t.style;
					groups[key].thumbId = t.id;
					if (t.name) groups[key].name = humanize(key);
					void vName;
				}
			});
			const bases = Object.keys(groups)
				.sort()
				.map(function (k) {
					const b = groups[k];
					b.variants.sort(function (a: any, b2: any) {
						if (a.name === "Default") return -1;
						if (b2.name === "Default") return 1;
						return String(a.name).localeCompare(String(b2.name));
					});
					b.thumbUrl = tileThumbUrl(b.thumbId, type, b.thumbStyle);
					return b;
				});
			categories.push({
				id: "tile-cat:" + type,
				label: typeDisplayName("tile", type),
				typeKey: type,
				kind: "tile",
				bases: bases,
			});
		});
	return categories;
}

function groupObjects(objects: any[]) {
	const byType: Record<string, typeof objects> = {};
	objects.forEach(function (o) {
		if (!byType[o.type]) byType[o.type] = [];
		byType[o.type].push(o);
	});
	const categories: any[] = [];
	Object.keys(byType)
		.sort()
		.forEach(function (type) {
			const list = byType[type];
			const useDoorFamilies = type === "WallPath";
			const groups: Record<string, any> = {};

			list.forEach(function (o) {
				const g = useDoorFamilies ? doorFamilySplit(o.style) : stripVariantSuffix(o.style);
				/* Only hybrid-group when a suffix/family matched, or door type; else one card per style. */
				const canGroup = useDoorFamilies || !!g.variant;
				const key = canGroup ? g.base : "solo:" + o.id;
				const baseName = canGroup
					? useDoorFamilies
						? humanize(g.base === "Blank" ? "Blank" : g.base)
						: humanize(g.base)
					: itemDisplayName(o);

				if (!groups[key]) {
					groups[key] = {
						id: canGroup ? "obj:" + type + ":" + g.base : "obj:" + o.id,
						name: baseName,
						kind: "object",
						type: type,
						clubId: o.id,
						style: o.style,
						canCustomize: o.canCustomize && (o.layers.length > 0 || o.canTransform),
						layers: o.layers,
						canTransform: o.canTransform,
						thumbUrl: objectThumbUrl(o.id, type, o.style),
						variants: [],
					};
				}
				const variantName = g.variant ? humanize(g.variant) : canGroup ? "Default" : "Default";
				groups[key].variants.push({
					id: "obj-v:" + o.id + (canGroup ? ":" + (g.variant || "default") : ":default"),
					name: variantName,
					displayName: itemDisplayName(o),
					clubId: o.id,
					style: o.style,
					colors: o.layers.map(function (L: any) {
						return L.defaultColor || "Default";
					}),
					rotation: 0,
					size: 100,
					thumbUrl: objectThumbUrl(o.id, type, o.style),
					baked: !groups[key].canCustomize,
					custom: false,
				});
				/* Prefer default / closed-looking thumb for the card */
				if (!g.variant || /Closed$|Door$/.test(o.style) || o.style === g.base) {
					groups[key].clubId = o.id;
					groups[key].style = o.style;
					groups[key].thumbUrl = objectThumbUrl(o.id, type, o.style);
					groups[key].canCustomize = o.canCustomize && (o.layers.length > 0 || o.canTransform);
					groups[key].layers = o.layers;
					groups[key].canTransform = o.canTransform;
				}
			});

			const bases = Object.keys(groups)
				.sort(function (a, b) {
					return String(groups[a].name).localeCompare(String(groups[b].name));
				})
				.map(function (k) {
					const b = groups[k];
					b.variants.sort(function (a: any, b2: any) {
						if (a.name === "Default") return -1;
						if (b2.name === "Default") return 1;
						return String(a.name).localeCompare(String(b2.name));
					});
					return b;
				});
			categories.push({
				id: "obj-cat:" + type,
				label: typeDisplayName("object", type),
				typeKey: type,
				kind: "object",
				bases: bases,
			});
		});
	return categories;
}

function groupEffects(effects: { id: number; type: string; style: string; name?: string; color: number[] | null }[]) {
	const byType: Record<string, typeof effects> = {};
	effects.forEach(function (e) {
		if (!byType[e.type]) byType[e.type] = [];
		byType[e.type].push(e);
	});
	const categories: any[] = [];
	Object.keys(byType)
		.sort()
		.forEach(function (type) {
			const bases = byType[type]
				.slice()
				.sort(function (a, b) {
					return a.id - b.id;
				})
				.map(function (e) {
					const label = e.name || EFFECT_LABELS[e.id] || humanize(e.style) || "Effect " + e.id;
					const css = effectThumbCss(e.color);
					return {
						id: "fx:" + e.id,
						name: label,
						kind: "effect",
						type: type,
						clubId: e.id,
						style: e.style,
						canCustomize: false,
						layers: [],
						canTransform: false,
						thumbUrl: "",
						thumbCss: css,
						variants: [
							{
								id: "fx-v:" + e.id,
								name: "Default",
								displayName: label,
								clubId: e.id,
								style: e.style,
								thumbUrl: "",
								thumbCss: css,
								baked: true,
								custom: false,
							},
						],
					};
				});
			categories.push({
				id: "fx-cat:" + type,
				label: typeDisplayName("effect", type),
				typeKey: type,
				kind: "effect",
				bases: bases,
			});
		});
	return categories;
}

FBM.buildMapCatalog = function () {
	const raw = collectRaw();
	const fp = catalogFingerprint(
		raw.tiles
			.map(function (t) {
				return { id: t.id, type: t.type, style: t.style };
			})
			.concat(
				raw.objects.map(function (o) {
					return { id: o.id, type: o.type, style: o.style };
				})
			)
			.concat(
				raw.effects.map(function (e) {
					return { id: e.id, type: e.type, style: e.style };
				})
			)
	);
	const sections = [
		{ id: "tiles", label: "Tiles", categories: groupTiles(raw.tiles) },
		{ id: "objects", label: "Objects", categories: groupObjects(raw.objects) },
		{ id: "effects", label: "Effects", categories: groupEffects(raw.effects) },
	];
	return {
		fingerprint: fp,
		builtAt: Date.now(),
		sections: sections,
		counts: { tiles: raw.tiles.length, objects: raw.objects.length, effects: raw.effects.length },
	};
};

FBM.catalogCacheKey = function () {
	const n = Player && Player.MemberNumber != null ? Player.MemberNumber : "0";
	return FBM.EXTENSION_KEY + "_" + n + "_catalog_v" + FBM.CATALOG_CACHE_VERSION;
};

FBM.loadOrBuildCatalog = function () {
	const live = FBM.buildMapCatalog();
	let cached = null;
	try {
		const raw = localStorage.getItem(FBM.catalogCacheKey());
		cached = raw ? FBM.lzReadLocal(raw) : null;
	} catch (e) {
		cached = null;
	}
	if (cached && cached.fingerprint === live.fingerprint && cached.sections) {
		FBM._catalog = cached;
		return cached;
	}
	try {
		localStorage.setItem(FBM.catalogCacheKey(), FBM.lzPackLocal(live));
	} catch (e) {
		/* ignore quota */
	}
	FBM._catalog = live;
	return live;
};

FBM.getCatalog = function () {
	if (FBM._catalog && FBM._catalog.sections) return FBM._catalog;
	return FBM.loadOrBuildCatalog();
};

FBM.findCatalogBase = function (baseId: string) {
	const cat = FBM.getCatalog();
	if (!cat) return null;
	for (let s = 0; s < cat.sections.length; s++) {
		const sec = cat.sections[s];
		for (let c = 0; c < sec.categories.length; c++) {
			const category = sec.categories[c];
			const base = (category.bases || []).find(function (b: any) {
				return b && b.id === baseId;
			});
			if (base) return { base: base, section: sec, category: category };
		}
	}
	return null;
};
