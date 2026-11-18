/** Freyas Better Maps — Objects Build persistence (localStorage) */
import { FBM } from "../fbm";

function memberKey(suffix: string) {
	const n = Player && Player.MemberNumber != null ? Player.MemberNumber : "0";
	return FBM.EXTENSION_KEY + "_" + n + "_" + suffix;
}

FBM.DEFAULT_OBJECTS_STATE = {
	categoryOrder: {} as Record<string, string[]>,
	customVariants: {} as Record<string, any[]>,
	recent: [] as { key: string; baseId: string; variantId: string }[],
	singlePlace: false,
	ui: {
		left: null as number | null,
		top: null as number | null,
		width: 900,
		height: 560,
		extWidth: 260,
		collapsedSections: {} as Record<string, boolean>,
	},
};

FBM.loadObjectsState = function () {
	let data = null;
	try {
		data = FBM.lzReadLocal(localStorage.getItem(memberKey("objects")));
	} catch (e) {
		data = null;
	}
	const d = FBM.DEFAULT_OBJECTS_STATE;
	const s = data && typeof data === "object" ? data : {};
	FBM.objectsState = {
		categoryOrder: s.categoryOrder && typeof s.categoryOrder === "object" ? s.categoryOrder : {},
		customVariants: s.customVariants && typeof s.customVariants === "object" ? s.customVariants : {},
		recent: Array.isArray(s.recent) ? s.recent.slice(0, 20) : [],
		singlePlace: !!s.singlePlace,
		ui: Object.assign({}, d.ui, s.ui && typeof s.ui === "object" ? s.ui : {}),
	};
	return FBM.objectsState;
};

FBM.saveObjectsState = function () {
	if (!FBM.objectsState) FBM.loadObjectsState();
	try {
		localStorage.setItem(memberKey("objects"), FBM.lzPackLocal(FBM.objectsState));
	} catch (e) {
		if (FBM.localMsg) FBM.localMsg("FBM: could not save Objects Build state (storage full?).");
	}
};

FBM.applyCategoryOrder = function (catalog: any) {
	if (!FBM.objectsState) FBM.loadObjectsState();
	const order = FBM.objectsState.categoryOrder || {};
	(catalog.sections || []).forEach(function (sec: any) {
		const ids = order[sec.id];
		if (!Array.isArray(ids) || !ids.length) return;
		const map: Record<string, any> = {};
		sec.categories.forEach(function (c: any) {
			map[c.id] = c;
		});
		const next: any[] = [];
		ids.forEach(function (id: string) {
			if (map[id]) {
				next.push(map[id]);
				delete map[id];
			}
		});
		Object.keys(map).forEach(function (id) {
			next.push(map[id]);
		});
		sec.categories = next;
	});
};

FBM.mergeCustomVariants = function (catalog: any) {
	if (!FBM.objectsState) FBM.loadObjectsState();
	const customs = FBM.objectsState.customVariants || {};
	Object.keys(customs).forEach(function (baseId) {
		const hit = FBM.findCatalogBase(baseId);
		if (!hit || !hit.base) return;
		const list = customs[baseId];
		if (!Array.isArray(list)) return;
		list.forEach(function (v: any) {
			if (!v || !v.id) return;
			if (hit.base.variants.some(function (x: any) {
				return x.id === v.id;
			}))
				return;
			hit.base.variants.push(v);
		});
	});
};

FBM.prepareObjectsCatalog = function () {
	const cat = FBM.loadOrBuildCatalog();
	FBM.loadObjectsState();
	FBM.applyCategoryOrder(cat);
	FBM.mergeCustomVariants(cat);
	return cat;
};

FBM.pushObjectsRecent = function (baseId: string, variantId: string) {
	if (!FBM.objectsState) FBM.loadObjectsState();
	const key = baseId + ":" + variantId;
	FBM.objectsState.recent = (FBM.objectsState.recent || []).filter(function (r: any) {
		return r && r.key !== key;
	});
	FBM.objectsState.recent.unshift({ key: key, baseId: baseId, variantId: variantId });
	while (FBM.objectsState.recent.length > 20) FBM.objectsState.recent.pop();
	FBM.saveObjectsState();
};

FBM.saveCustomVariant = function (baseId: string, variant: any) {
	if (!FBM.objectsState) FBM.loadObjectsState();
	const hit = FBM.findCatalogBase(baseId);
	if (!hit) return null;
	variant.custom = true;
	hit.base.variants = (hit.base.variants || []).filter(function (v: any) {
		return v.id !== variant.id;
	});
	hit.base.variants.push(variant);
	if (!FBM.objectsState.customVariants[baseId]) FBM.objectsState.customVariants[baseId] = [];
	FBM.objectsState.customVariants[baseId] = FBM.objectsState.customVariants[baseId].filter(function (v: any) {
		return v.id !== variant.id;
	});
	FBM.objectsState.customVariants[baseId].push(variant);
	FBM.saveObjectsState();
	return variant;
};

FBM.deleteCustomVariant = function (baseId: string, variantId: string) {
	if (!FBM.objectsState) FBM.loadObjectsState();
	const hit = FBM.findCatalogBase(baseId);
	if (hit) {
		hit.base.variants = (hit.base.variants || []).filter(function (v: any) {
			return v.id !== variantId;
		});
	}
	if (FBM.objectsState.customVariants[baseId]) {
		FBM.objectsState.customVariants[baseId] = FBM.objectsState.customVariants[baseId].filter(function (v: any) {
			return v.id !== variantId;
		});
	}
	FBM.saveObjectsState();
};
