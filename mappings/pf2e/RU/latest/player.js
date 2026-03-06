import StandardPf2eMapping from "../../standard/latest/player.js";

const MODULE_ID = (import.meta.url.match(/\/modules\/([^/]+)\//)?.[1]) ?? "sheet-export-pf2e-ru";

const ABILITY_TO_RU_FIELD = {
    str: "att_str",
    dex: "att_dex",
    con: "att_con",
    int: "att_int",
    wis: "att_wis",
    cha: "att_cha",
};

const SAVE_TO_RU_FIELD = {
    fortitude: "fort",
    reflex: "reflex",
    will: "will",
};

const DEFENSE_TO_RU_FIELD = {
    unarmored: "unarm",
    light: "light",
    medium: "medium",
    heavy: "heavy",
};

const ATTACK_TO_RU_FIELD = {
    unarmed: "unarm",
    simple: "simple",
    martial: "martial",
    advanced: "advanced",
    other: "other",
};

const PROFICIENCY_TO_RU_FIELD = {
    trained: "t",
    expert: "e",
    master: "m",
    legendary: "l",
};

const DAMAGE_TYPE_RU_FALLBACK = {
    acid: "кислотный",
    bludgeoning: "дробящий",
    bleed: "кровотечение",
    cold: "холод",
    electricity: "электрический",
    fire: "огонь",
    force: "силовой",
    mental: "ментальный",
    piercing: "колющий",
    poison: "яд",
    slashing: "рубящий",
    sonic: "звуковой",
    spirit: "духовный",
    vitality: "жизненность",
    void: "пустота",
    untyped: "без типа",
};

const SKILL_SLUGS = new Set([
    "acrobatics",
    "arcana",
    "athletics",
    "crafting",
    "deception",
    "diplomacy",
    "intimidation",
    "lore1",
    "lore2",
    "medicine",
    "nature",
    "occultism",
    "performance",
    "religion",
    "society",
    "stealth",
    "survival",
    "thievery",
]);

const RU_PORTRAIT_BOX = {
    page: 2,
    x: 22.691,
    y: 491.161,
    width: 179.346,
    height: 262.401,
};

const STATIC_FIELD_MAP = {
    character_name: "name_char",
    player_name: "name_player",
    ancestry: "ancestry_name",
    heritage_and_traits: "ancestry_heritage_traits",
    size: "ancestry_size",
    background: "background_name",
    class: "class_name",
    ac: "def_armor_total",
    ac_attribute_modifier: "def_armor_dexorcap",
    ac_proficiency_modifier: "def_armor_prof",
    ac_item_modifier: "def_armor_item",
    ac_shield_bonus: "def_shield_ac",
    shield_hardness: "def_shield_hardness",
    shield_max_hp: "def_shield_maxhp",
    shield_bt: "def_shield_bt",
    resistances_immunities: "hp_resistancesandimmunities",
    perception_proficiency_modifier: "perception_prof_calc",
    perception_item_modifier: "perception_item",
    perception_trained: "perception_prof_t",
    perception_expert: "perception_prof_e",
    perception_master: "perception_prof_m",
    perception_legendary: "perception_prof_l",
    special_movement: "speed_specialmovement",
    class_dc_attribute_modifier: "class_dc_key",
    class_dc_proficiency_modifier: "class_dc_prof",
    class_dc_item_modifier: "class_dc_item",
    lore1_subcategory: "skill_lore1_name",
    lore2_subcategory: "skill_lore2_name",
    "1_ancestry_hertitage_abilities": "level_1_ancestry_heritage_ability",
    "1_background_skill_feat": "level_1_background_skill_feat",
    "1_class_feats_features": "level_1_class_feats_features",
};

for (const [ability, field] of Object.entries(ABILITY_TO_RU_FIELD)) {
    STATIC_FIELD_MAP[ability] = field;
    STATIC_FIELD_MAP[`${ability}_partial`] = `${field}_boost`;
}

class MappingClass extends StandardPf2eMapping {
    authors = [
        {
            name: "bushvin",
            url: "https://blog.elaba.net",
            lemmy: "https://lemmy.world/u/bushvin",
            github: "https://github.com/bushvin",
        },
        {
            name: "Ilyas Abusahev",
            url: "",
            github: "",
        },
    ];

    async createMappings() {
        await super.createMappings();

        this.pdfFiles = [
            {
                pdfUrl: `/modules/${MODULE_ID}/mappings/pf2e/RU/latest/RM_CharacterSheet_Fillable.pdf`,
                nameDownload: `${this.actor.name ?? "character"}.pdf`,
                name: "RM_CharacterSheet_Fillable.pdf",
            },
        ];

        const defaultFields = this.getFields(0) ?? [];
        this.fieldMappings[0] = this.remapFields(defaultFields);
        await this.addRussianSpecificFields();
    }

    remapFields(defaultFields) {
        const remapped = new Map();

        for (const field of defaultFields) {
            const targetField = this.mapFieldName(field.pdf);
            if (!targetField) continue;
            remapped.set(targetField, { ...field, pdf: targetField });
        }

        return Array.from(remapped.values());
    }

    mapFieldName(fieldName) {
        if (STATIC_FIELD_MAP[fieldName]) {
            return STATIC_FIELD_MAP[fieldName];
        }

        let match = fieldName.match(/^defense_(.+)_(trained|expert|master|legendary)$/);
        if (match) {
            const [, defense, proficiency] = match;
            const defenseField = DEFENSE_TO_RU_FIELD[defense];
            const proficiencyField = PROFICIENCY_TO_RU_FIELD[proficiency];
            if (!defenseField || !proficiencyField) return null;
            return `def_armor_prof_${defenseField}_${proficiencyField}`;
        }

        match = fieldName.match(/^attack_(.+)_(trained|expert|master|legendary)$/);
        if (match) {
            const [, attack, proficiency] = match;
            const attackField = ATTACK_TO_RU_FIELD[attack];
            const proficiencyField = PROFICIENCY_TO_RU_FIELD[proficiency];
            if (!attackField || !proficiencyField) return null;
            return `weapon_prof_${attackField}_${proficiencyField}`;
        }

        match = fieldName.match(/^(fortitude|reflex|will)$/);
        if (match) {
            const [, save] = match;
            const saveField = SAVE_TO_RU_FIELD[save];
            if (!saveField) return null;
            return `save_${saveField}`;
        }

        match = fieldName.match(/^(fortitude|reflex|will)_(trained|expert|master|legendary)$/);
        if (match) {
            const [, save, proficiency] = match;
            const saveField = SAVE_TO_RU_FIELD[save];
            const proficiencyField = PROFICIENCY_TO_RU_FIELD[proficiency];
            if (!saveField || !proficiencyField) return null;
            return `save_${saveField}_prof_${proficiencyField}`;
        }

        match = fieldName.match(/^(fortitude|reflex|will)_(attribute|proficiency|item)_modifier$/);
        if (match) {
            const [, save, modifierType] = match;
            const saveField = SAVE_TO_RU_FIELD[save];
            if (!saveField) return null;
            if (modifierType === "attribute") return null;
            if (modifierType === "proficiency") return `save_${saveField}_prof_calc`;
            if (modifierType === "item") return `save_${saveField}_item`;
            return null;
        }

        match = fieldName.match(/^(\d+)_ancestry_feat$/);
        if (match) return `level_${match[1]}_ancestry_feat`;

        match = fieldName.match(/^(\d+)_class_feature$/);
        if (match) return `level_${match[1]}_class_feature`;

        match = fieldName.match(/^(\d+)_class_feat$/);
        if (match) return `level_${match[1]}_class_feat`;

        match = fieldName.match(/^(\d+)_general_feat$/);
        if (match) return `level_${match[1]}_general_feat`;

        match = fieldName.match(/^(\d+)_skill_feat$/);
        if (match) {
            const level = Number(match[1]);
            if (level === 14) return "leel_14_skill_feat";
            return `level_${level}_skill_feat`;
        }

        match = fieldName.match(/^([a-z0-9]+)_(trained|expert|master|legendary)$/);
        if (match) {
            const [, skill, proficiency] = match;
            if (!SKILL_SLUGS.has(skill)) return fieldName;
            const proficiencyField = PROFICIENCY_TO_RU_FIELD[proficiency];
            if (!proficiencyField) return null;
            return `skill_${skill}_prof_${proficiencyField}`;
        }

        match = fieldName.match(/^([a-z0-9]+)_(attribute|proficiency|item|armor)_modifier$/);
        if (match) {
            const [, skill, modifierType] = match;
            if (!SKILL_SLUGS.has(skill)) return fieldName;
            if (modifierType === "proficiency") return `skill_${skill}_prof_calc`;
            if (modifierType === "item") return `skill_${skill}_item`;
            if (modifierType === "armor") return "def_armor_penalty";
            return null;
        }

        if (SKILL_SLUGS.has(fieldName)) {
            return `skill_${fieldName}`;
        }

        return fieldName;
    }

    async addRussianSpecificFields() {
        this.addPortraitImage();

        const heroPoints = Number(this.actor.system?.resources?.heroPoints?.value ?? 0);
        this.setCalculated("hero_1", heroPoints >= 1);
        this.setCalculated("hero_2", heroPoints >= 2);
        this.setCalculated("hero_3", heroPoints >= 3);

        const hpValue = this.actor.hitPoints?.value ?? this.actor.system?.attributes?.hp?.value ?? "";
        const hpTemp = this.actor.system?.attributes?.hp?.temp ?? "";
        this.setCalculated("hp_current", hpValue);
        this.setCalculated("hp_temporary", hpTemp);

        const dyingValue = Number(this.actor.system?.attributes?.dying?.value ?? 0);
        for (let i = 1; i <= 4; i++) {
            this.setCalculated(`hp_dying_${i}`, dyingValue >= i);
        }

        const woundedValue = this.actor.system?.attributes?.wounded?.value ?? "";
        this.setCalculated("hp_wounded", woundedValue);

        const perceptionNotes = (this.actor.perception?.senses ?? [])
            .map((sense) => {
                const label = sense.label ?? sense.type ?? "";
                const range = sense.range ? ` ${sense.range}` : "";
                return `${label}${range}`.trim();
            })
            .filter((sense) => sense.length > 0)
            .join(", ");
        this.setCalculated("perception_sensesandnotes", perceptionNotes);

        const defenseNotes = this.actor.system?.attributes?.ac?.details ?? "";
        this.setCalculated("def_notes", defenseNotes);

        const conditions = (this.actor.itemTypes?.condition ?? [])
            .filter((condition) => !condition.system?.references?.parent)
            .map((condition) => condition.name)
            .join(", ");
        this.setCalculated("hp_conditions", conditions);

        this.setCalculated("hp_resistancesandimmunities", this.formatResistanceBlockForRuSheet());

        const armorPenalty = this.getArmorCheckPenalty();
        if (armorPenalty !== null) {
            this.setCalculated("def_armor_penalty", this.formatModifier(armorPenalty));
        }

        this.addStrikeMappings();
        this.addSpellcastingMappings();
        this.addInventoryMappings();
        await this.addActionMappings();
    }

    addPortraitImage() {
        const imagePath = String(this.actor?.img ?? "").trim();
        if (!imagePath.length) return;

        const normalized = imagePath.toLowerCase();
        if (normalized.includes("mystery-man")) return;

        this.setImage(
            imagePath,
            RU_PORTRAIT_BOX.page,
            RU_PORTRAIT_BOX.x,
            RU_PORTRAIT_BOX.y,
            RU_PORTRAIT_BOX.width,
            RU_PORTRAIT_BOX.height,
        );
    }

    getArmorCheckPenalty() {
        const skillOrder = ["acrobatics", "athletics", "stealth", "thievery"];
        for (const slug of skillOrder) {
            const modifiers = this.actor.skills?.[slug]?.modifiers ?? [];
            const armorModifier = modifiers.find((modifier) => modifier.slug === "armor-check-penalty");
            if (armorModifier) {
                return armorModifier.modifier;
            }
        }
        return null;
    }

    addStrikeMappings() {
        const strikes = (this.actor.system?.actions ?? [])
            .filter((action) => action?.type === "strike" && action?.visible !== false);

        const meleeStrikes = strikes.filter((strike) => !strike.item?.isRanged).slice(0, 3);
        const rangedStrikes = strikes.filter((strike) => strike.item?.isRanged).slice(0, 2);

        meleeStrikes.forEach((strike, index) => {
            this.setStrikeRow(strike, `weapon_melee${index + 1}`, true);
        });
        rangedStrikes.forEach((strike, index) => {
            this.setStrikeRow(strike, `weapon_range${index + 1}`, false);
        });
    }

    setStrikeRow(strike, rowPrefix, isMelee) {
        const name = strike.label ?? strike.item?.name ?? "";
        const attackValue = this.getStrikeAttackBonusValue(strike);
        const attack = Number.isFinite(attackValue) ? this.formatModifier(attackValue) : "";
        const damage = this.getStrikeDamageText(strike);
        const traits = this.extractStrikeTraits(strike);
        const damageType = strike.item?.system?.damage?.damageType ?? "";
        const abilityModifier = this.getStrikeAbilityModifier(strike, isMelee);
        const itemModifier = this.getStrikeItemModifier(strike);
        let proficiencyModifier = this.getStrikeProficiencyModifier(strike);
        if (!Number.isFinite(proficiencyModifier) && Number.isFinite(attackValue)) {
            const safeAbility = Number.isFinite(abilityModifier) ? abilityModifier : 0;
            const safeItem = Number.isFinite(itemModifier) ? itemModifier : 0;
            proficiencyModifier = attackValue - safeAbility - safeItem;
        }

        this.setCalculated(`${rowPrefix}_name`, name);
        this.setCalculated(`${rowPrefix}_attack`, attack);
        this.setCalculated(`${rowPrefix}_damage`, damage);
        this.setCalculated(`${rowPrefix}_traits_notes`, traits);

        if (isMelee) {
            this.setCalculated(
                `${rowPrefix}_strordex`,
                Number.isFinite(abilityModifier) ? this.formatModifier(abilityModifier) : "",
            );
        }

        this.setCalculated(
            `${rowPrefix}_prof`,
            Number.isFinite(proficiencyModifier) ? this.formatModifier(proficiencyModifier) : "",
        );
        this.setCalculated(
            `${rowPrefix}_item`,
            Number.isFinite(itemModifier) ? this.formatModifier(itemModifier) : "",
        );
        this.setStrikeDamageTypeCheckboxes(rowPrefix, damageType);
    }

    getStrikeAttackBonusValue(strike) {
        const variantLabel = strike.variants?.[0]?.label;
        if (typeof variantLabel === "number") {
            return variantLabel;
        }
        if (typeof variantLabel === "string" && variantLabel.trim().length > 0) {
            return this.parseNumericModifier(variantLabel);
        }
        const total = strike.totalModifier ?? strike.mod ?? null;
        return typeof total === "number" ? total : NaN;
    }

    getStrikeAbilityModifier(strike, isMelee) {
        const fromStatistic = this.getStrikeModifierFromStatistic(strike, "ability");
        if (Number.isFinite(fromStatistic)) return fromStatistic;

        const fallbackSlug = isMelee ? "str" : "dex";
        const fallback = this.actor.abilities?.[fallbackSlug]?.mod;
        return Number.isFinite(Number(fallback)) ? Number(fallback) : NaN;
    }

    getStrikeItemModifier(strike) {
        const fromStatistic = this.getStrikeModifierFromStatistic(strike, "item");
        if (Number.isFinite(fromStatistic)) return fromStatistic;

        const itemBonus = Number(strike.item?.system?.bonus?.value ?? 0);
        const potency = Number(strike.item?.system?.runes?.potency ?? 0);
        return itemBonus + potency;
    }

    getStrikeProficiencyModifier(strike) {
        const fromStatistic = this.getStrikeModifierFromStatistic(strike, "proficiency");
        if (Number.isFinite(fromStatistic)) return fromStatistic;

        const category = strike.item?.system?.category;
        const rank = Number(this.actor.system?.proficiencies?.attacks?.[category]?.rank ?? NaN);
        if (!Number.isFinite(rank) || rank <= 0) return NaN;
        const level = Number(this.actor.system?.details?.level?.value ?? 0);
        return level + rank * 2;
    }

    getStrikeModifierFromStatistic(strike, type) {
        const statisticModifiers = strike?.statistic?.modifiers ?? strike?.modifiers ?? [];
        const matching = statisticModifiers
            .filter((modifier) => modifier?.type === type && modifier?.enabled !== false)
            .map((modifier) => Number(modifier?.modifier))
            .filter((modifier) => Number.isFinite(modifier));
        if (!matching.length) return NaN;
        return matching.sort((a, b) => b - a)[0];
    }

    parseNumericModifier(value) {
        if (typeof value === "number") return value;
        if (typeof value !== "string") return NaN;
        const match = value.replace(/\s+/g, "").match(/[+-]?\d+(\.\d+)?/);
        return match ? Number(match[0]) : NaN;
    }

    getStrikeDamageText(strike) {
        let formula = "";
        if (typeof strike.damageFormula === "string" && strike.damageFormula.trim().length > 0) {
            formula = strike.damageFormula.trim();
        } else {
            const damage = strike.item?.system?.damage ?? {};
            const diceCount = Number(damage.dice ?? 0);
            const die = damage.die ?? "";
            const modifier = Number(damage.modifier ?? 0);
            const damageType = this.localizeDamageType(damage.damageType ?? "");

            if (Number.isFinite(diceCount) && diceCount > 0 && die) {
                formula = `${diceCount}${die}`;
            }
            if (Number.isFinite(modifier) && modifier !== 0) {
                formula += modifier > 0 ? `+${modifier}` : `${modifier}`;
            }
            if (damageType) {
                formula = `${formula} ${damageType}`.trim();
            }
        }

        const persistentRawText = this.getStrikePersistentDamageText(strike, false);
        const persistentText = this.getStrikePersistentDamageText(strike, true);
        if (persistentText) {
            const normalizedFormula = formula.toLowerCase();
            const normalizedPersistent = persistentText.toLowerCase();
            const normalizedRawPersistent = persistentRawText.toLowerCase();
            if (
                !normalizedFormula.includes(normalizedPersistent)
                && !normalizedFormula.includes(normalizedRawPersistent)
            ) {
                formula = formula ? `${formula} + ${persistentText}` : persistentText;
            }
        }

        return this.localizeDamageTypesInFormula(formula);
    }

    getStrikePersistentDamageText(strike, localizeType = true) {
        const persistent = strike.item?.system?.damage?.persistent;
        if (!persistent || typeof persistent !== "object") return "";

        const number = Number(persistent.number ?? 0);
        const faces = Number(persistent.faces ?? 0);
        const damageType = localizeType
            ? this.localizeDamageType(persistent.type ?? "")
            : String(persistent.type ?? "").trim();
        if (!Number.isFinite(number) || number <= 0) return "";

        let damage = "";
        if (Number.isFinite(faces) && faces > 0) {
            damage = `${number}d${faces}`;
        } else {
            damage = `${number}`;
        }

        return damageType ? `${damage} ${damageType}` : damage;
    }

    localizeDamageTypesInFormula(formula) {
        if (typeof formula !== "string" || !formula.trim().length) return formula;
        const configuredDamageTypes = Object.keys(CONFIG.PF2E?.damageTypes ?? {});
        const slugs = [...new Set([...configuredDamageTypes, ...Object.keys(DAMAGE_TYPE_RU_FALLBACK)])]
            .sort((a, b) => b.length - a.length);

        let localized = formula;
        for (const slug of slugs) {
            const localizedType = this.localizeDamageType(slug);
            if (!localizedType || localizedType.toLowerCase() === slug.toLowerCase()) continue;
            const escapedSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            localized = localized.replace(new RegExp(`\\b${escapedSlug}\\b`, "gi"), localizedType);
        }
        return localized;
    }

    localizeDamageType(damageType) {
        const slug = String(damageType ?? "").trim().toLowerCase();
        if (!slug) return "";

        const i18nKey = CONFIG.PF2E?.damageTypes?.[slug];
        if (typeof i18nKey === "string" && i18nKey.length > 0) {
            const localized = game.i18n.localize(i18nKey);
            if (localized && localized !== i18nKey) return localized;
        }

        if (DAMAGE_TYPE_RU_FALLBACK[slug]) return DAMAGE_TYPE_RU_FALLBACK[slug];
        return String(damageType ?? "");
    }

    setStrikeDamageTypeCheckboxes(rowPrefix, damageType) {
        const normalized = String(damageType ?? "").toLowerCase();
        this.setCalculated(`${rowPrefix}_type_b`, normalized.includes("bludgeon"));
        this.setCalculated(`${rowPrefix}_type_p`, normalized.includes("pierc"));
        this.setCalculated(`${rowPrefix}_type_s`, normalized.includes("slash"));
    }

    extractStrikeTraits(strike) {
        const traits = [
            ...(strike.traits ?? []),
            ...(strike.weaponTraits ?? []),
        ]
            .map((trait) => (typeof trait === "string" ? trait : trait?.label ?? trait?.name ?? ""))
            .filter((trait) => trait.length > 0);

        return traits.join(", ");
    }

    addSpellcastingMappings() {
        const spellEntries = this.actor.itemTypes?.spellcastingEntry ?? [];
        const spells = this.actor.itemTypes?.spell ?? [];
        if (!spellEntries.length) return;

        const primaryEntry = this.getPrimarySpellcastingEntry(spellEntries);
        if (!primaryEntry) return;

        const traditionValues = new Set(
            spellEntries
                .map((entry) => entry.system?.tradition?.value)
                .filter((tradition) => typeof tradition === "string" && tradition.length > 0),
        );
        this.setCalculated("magic_tradition_arcane", traditionValues.has("arcane"));
        this.setCalculated("magic_tradition_occult", traditionValues.has("occult"));
        this.setCalculated("magic_tradition_primal", traditionValues.has("primal"));
        this.setCalculated("magic_tradition_divine", traditionValues.has("divine"));

        const castingType = primaryEntry.system?.prepared?.value;
        this.setCalculated("magic_tradition_prepared", castingType === "prepared");
        this.setCalculated("magic_tradition_spontaneous", castingType === "spontaneous");

        const rank = Number(primaryEntry.statistic?.rank ?? primaryEntry.system?.proficiency?.value ?? 0);
        const spellAttack = this.roundUpNumber(
            Number(primaryEntry.statistic?.check?.mod ?? primaryEntry.system?.spelldc?.value ?? NaN),
        );
        const spellDC = Number(primaryEntry.statistic?.dc?.value ?? primaryEntry.system?.spelldc?.dc ?? NaN);
        const abilitySlug = primaryEntry.system?.ability?.value ?? this.actor.system?.details?.keyability?.value ?? "";
        const abilityMod = this.roundUpNumber(Number(this.actor.abilities?.[abilitySlug]?.mod ?? 0));

        this.setCalculated("spell_stat_attack", Number.isFinite(spellAttack) ? this.formatModifier(spellAttack) : "");
        this.setCalculated("spell_stat_dc", Number.isFinite(spellDC) ? spellDC : "");
        this.setCalculated("spell_stat_key", Number.isFinite(abilityMod) ? abilityMod : "");
        this.setCalculated(
            "spell_stat_attack_prof_calc",
            Number.isFinite(spellAttack) ? this.roundUpNumber(spellAttack - abilityMod) : "",
        );
        this.setCalculated(
            "spell_stat_dc_prof_calc",
            Number.isFinite(spellDC) ? this.roundUpNumber(spellDC - 10 - abilityMod) : "",
        );

        this.setCalculated("spell_stat_attack_prof_t", rank >= 1);
        this.setCalculated("spell_stat_attack_prof_e", rank >= 2);
        this.setCalculated("spell_stat_attack_prof_m", rank >= 3);
        this.setCalculated("spell_stat_attack_prof_l", rank >= 4);
        this.setCalculated("spell_stat_dc_prof_t", rank >= 1);
        this.setCalculated("spell_stat_dc_prof_e", rank >= 2);
        this.setCalculated("spell_stat_dc_prof_m", rank >= 3);
        this.setCalculated("spell_stat_dc_prof_l", rank >= 4);

        for (let spellRank = 1; spellRank <= 10; spellRank++) {
            const slot = primaryEntry.system?.slots?.[`slot${spellRank}`] ?? {};
            this.setCalculated(`spellslots_rank_${spellRank}_per_day`, slot.max ?? "");
            this.setCalculated(`spellslots_rank_${spellRank}_remaining`, slot.value ?? "");
        }

        const primarySpells = this.getEntrySpells(primaryEntry, spells)
            .sort((a, b) => this.getSpellRank(a) - this.getSpellRank(b) || a.name.localeCompare(b.name));
        const cantrips = primarySpells
            .filter((spell) => this.isCantripSpell(spell) && !this.isFocusSpell(spell))
            .sort((a, b) => a.name.localeCompare(b.name));
        this.setCalculated("spell_cantrips_per_day", cantrips.length ? "∞" : "");
        this.setCalculated("spell_cantrips_names", cantrips.map((spell) => spell.name).join("\n"));
        this.setCalculated("spell_cantrips_actions", cantrips.map((spell) => this.getSpellActionLabel(spell)).join("\n"));
        this.setCalculated("spell_cantrips_prepared", cantrips.map(() => "∞").join("\n"));

        const focusEntries = spellEntries.filter((entry) => entry.system?.prepared?.value === "focus");
        const focusSpells = focusEntries
            .flatMap((entry) => this.getEntrySpells(entry, spells))
            .sort((a, b) => this.getSpellRank(a) - this.getSpellRank(b) || a.name.localeCompare(b.name));
        const focusPoints = Number(this.actor.system?.resources?.focus?.value ?? 0);
        this.setCalculated("focus_spells_points_1", focusPoints >= 1);
        this.setCalculated("focus_spells_points_2", focusPoints >= 2);
        this.setCalculated("focus_spells_points_3", focusPoints >= 3);
        this.setCalculated("spell_rank", focusSpells.length ? Math.max(...focusSpells.map((spell) => this.getSpellRank(spell))) : "");
        this.setCalculated("focus_spells_name", focusSpells.map((spell) => spell.name).join("\n"));
        this.setCalculated("focus_spells_actions", focusSpells.map((spell) => this.getSpellActionLabel(spell)).join("\n"));

        const innateEntries = spellEntries.filter((entry) => entry.system?.prepared?.value === "innate");
        const innateSpells = innateEntries
            .flatMap((entry) => this.getEntrySpells(entry, spells))
            .sort((a, b) => this.getSpellRank(a) - this.getSpellRank(b) || a.name.localeCompare(b.name));
        this.setCalculated("innate_spells_names", innateSpells.map((spell) => spell.name).join("\n"));
        this.setCalculated("innate_spells_actions", innateSpells.map((spell) => this.getSpellActionLabel(spell)).join("\n"));
        this.setCalculated("innate_spells_frequency", innateSpells.map((spell) => this.getSpellFrequencyLabel(spell)).join("\n"));

        const preparedRows = primarySpells
            .filter((spell) => !this.isCantripSpell(spell) && !this.isFocusSpell(spell))
            .map((spell) => ({
                name: spell.name,
                rank: this.getSpellRank(spell),
                prepared: this.getPreparedState(primaryEntry, spell),
            }));
        const [preparedCol1, preparedCol2] = this.splitRows(preparedRows);
        this.setCalculated("spellslots_names_1", this.joinRowValues(preparedCol1, "name"));
        this.setCalculated("spellslots_ranks_1", this.joinRowValues(preparedCol1, "rank"));
        this.setCalculated("spellslots_prepared_1", this.joinRowValues(preparedCol1, "prepared"));
        this.setCalculated("spellslots_names_2", this.joinRowValues(preparedCol2, "name"));
        this.setCalculated("spellslots_ranks_2", this.joinRowValues(preparedCol2, "rank"));
        this.setCalculated("spellslots_prepared_2", this.joinRowValues(preparedCol2, "prepared"));

        const ritualEntries = spellEntries.filter((entry) => entry.system?.prepared?.value === "ritual");
        const ritualRows = ritualEntries
            .flatMap((entry) => this.getEntrySpells(entry, spells))
            .sort((a, b) => this.getSpellRank(a) - this.getSpellRank(b) || a.name.localeCompare(b.name))
            .map((spell) => ({
                name: spell.name,
                rank: this.getSpellRank(spell),
                cost: spell.system?.cost?.value ?? "",
            }));
        const [ritualCol1, ritualCol2] = this.splitRows(ritualRows);
        this.setCalculated("rituals_names_1", this.joinRowValues(ritualCol1, "name"));
        this.setCalculated("rituals_ranks_1", this.joinRowValues(ritualCol1, "rank"));
        this.setCalculated("rituals_costs_1", this.joinRowValues(ritualCol1, "cost"));
        this.setCalculated("rituals_names_2", this.joinRowValues(ritualCol2, "name"));
        this.setCalculated("rituals_ranks_2", this.joinRowValues(ritualCol2, "rank"));
        this.setCalculated("rituals_costs_2", this.joinRowValues(ritualCol2, "cost"));
    }

    addInventoryMappings() {
        const inventoryItems = this.getInventoryItems();
        const visibleTopLevelItems = inventoryItems
            .filter((item) => !this.isItemStowed(item))
            .filter((item) => !this.isItemInContainer(item));

        const consumables = visibleTopLevelItems.filter((item) => this.isConsumableItem(item));
        const nonConsumables = visibleTopLevelItems
            .filter((item) => !this.isConsumableItem(item))
            .filter((item) => !this.isCurrencyTreasureItem(item));

        const wornItems = nonConsumables.filter((item) => this.isWornItem(item));
        const heldItems = nonConsumables.filter((item) =>
            this.isHeldItem(item) || !this.isWornItem(item),
        );

        const heldRows = heldItems.map((item) => this.getInventoryRow(item));
        const consumableRows = consumables.map((item) => this.getInventoryRow(item));
        const wornRows = wornItems.map((item) => this.getInventoryRow(item));

        this.setCalculated("inventory_held_item", heldRows.map((row) => row.name).join("\n"));
        this.setCalculated("inventory_held_bulk", heldRows.map((row) => row.bulk).join("\n"));
        this.setCalculated("inventory_consumables", consumableRows.map((row) => row.name).join("\n"));
        this.setCalculated("inventory_consumables_bulk", consumableRows.map((row) => row.bulk).join("\n"));
        this.setCalculated("inventory_worn_items", wornRows.map((row) => row.name).join("\n"));
        this.setCalculated("inventory_worn_invested", wornRows.map((row) => row.invested).join("\n"));
        this.setCalculated("inventory_worn_bulk", wornRows.map((row) => row.bulk).join("\n"));

        const totalBulk = this.actor.inventory?.bulk?.value ?? this.actor.inventory?.bulk ?? null;
        this.setCalculated("bulk_total", this.getBulkLabel(totalBulk));

        const currency = this.getActorCurrency();
        this.setCalculated("wealth_copper", this.getCurrencyAmount(currency, "cp"));
        this.setCalculated("wealth_silver", this.getCurrencyAmount(currency, "sp"));
        this.setCalculated("wealth_gold", this.getCurrencyAmount(currency, "gp"));
        this.setCalculated("wealth_platinum", this.getCurrencyAmount(currency, "pp"));

        const treasureRows = visibleTopLevelItems
            .filter((item) => this.isTreasureItem(item))
            .map((item) => this.getInventoryRow(item));
        this.setCalculated("wealth_gems_artwork", treasureRows.map((row) => row.name).join("\n"));

        const treasureValueCp = visibleTopLevelItems
            .filter((item) => this.isTreasureItem(item))
            .reduce((total, item) => total + this.getCoinsCopperValue(item.assetValue), 0);
        this.setCalculated("wealth_price", this.formatCopperAsGold(treasureValueCp));

        const treasureBulk = visibleTopLevelItems
            .filter((item) => this.isTreasureItem(item))
            .reduce((total, item) => total + this.getItemBulkValue(item), 0);
        this.setCalculated("wealth_bulk", this.getBulkLabel(treasureBulk));
    }

    async addActionMappings() {
        const actionItems = await this.getSheetActionItems();

        for (let index = 1; index <= 4; index++) {
            this.setCalculated(`action_activity_${index}_name`, "");
            this.setCalculated(`action_activity_${index}_numactions`, "");
            this.setCalculated(`action_activity_${index}_traits`, "");
            this.setCalculated(`action_activity_${index}_sourcepage`, "");
            this.setCalculated(`action_activity_${index}_effects`, "");

            this.setCalculated(`action_free_reaction_${index}_name`, "");
            this.setCalculated(`action_free_reaction_${index}_free`, false);
            this.setCalculated(`action_free_reaction_${index}_reaction`, false);
            this.setCalculated(`action_free_reaction_${index}_traits`, "");
            this.setCalculated(`action_free_reaction_${index}_pagesource`, "");
            this.setCalculated(`action_free_reaction_${index}_trigger`, "");
            this.setCalculated(`action_free_reaction_${index}_effects`, "");
        }

        const activities = actionItems
            .filter((entry) => entry.actionType === "action")
            .slice(0, 4);
        activities.forEach((entry, idx) => {
            const row = idx + 1;
            this.setCalculated(`action_activity_${row}_name`, entry.name);
            this.setCalculated(`action_activity_${row}_numactions`, entry.actions);
            this.setCalculated(`action_activity_${row}_traits`, entry.traits);
            this.setCalculated(`action_activity_${row}_sourcepage`, entry.page);
            this.setCalculated(`action_activity_${row}_effects`, entry.effects);
        });

        const freeReactions = actionItems
            .filter((entry) => ["free", "reaction"].includes(entry.actionType))
            .slice(0, 4);
        freeReactions.forEach((entry, idx) => {
            const row = idx + 1;
            this.setCalculated(`action_free_reaction_${row}_name`, entry.name);
            this.setCalculated(`action_free_reaction_${row}_free`, entry.actionType === "free");
            this.setCalculated(`action_free_reaction_${row}_reaction`, entry.actionType === "reaction");
            this.setCalculated(`action_free_reaction_${row}_traits`, entry.traits);
            this.setCalculated(`action_free_reaction_${row}_pagesource`, entry.page);
            this.setCalculated(`action_free_reaction_${row}_trigger`, entry.trigger);
            this.setCalculated(`action_free_reaction_${row}_effects`, entry.effects);
        });
    }

    async getSheetActionItems() {
        const items = this.actor.items?.contents ?? [];
        const entries = (await Promise.all(items.map((item) => this.toActionEntry(item))))
            .filter((entry) => entry !== null);

        return entries.sort((a, b) =>
            (Number(a.sort ?? 0) - Number(b.sort ?? 0))
            || a.name.localeCompare(b.name),
        );
    }

    async toActionEntry(item) {
        const actionType = this.getActionType(item);
        if (!actionType) return null;

        const name = String(item.name ?? "").trim();
        if (!name) return null;

        const triggerEffects = await this.getActionTriggerAndEffects(item, actionType);

        return {
            sort: Number(item.sort ?? 0),
            actionType,
            name,
            actions: actionType === "action" ? this.getActionCount(item) : "",
            traits: this.getActionTraits(item),
            page: this.getActionSourcePage(item),
            trigger: triggerEffects.trigger,
            effects: triggerEffects.effects,
        };
    }

    getActionType(item) {
        const fromActionCost = String(item?.actionCost?.type ?? "").trim().toLowerCase();
        if (["action", "reaction", "free"].includes(fromActionCost)) return fromActionCost;

        const rawSystemType = item?.system?.actionType?.value ?? item?.system?.actionType ?? "";
        const fromSystem = String(rawSystemType).trim().toLowerCase();
        if (["action", "reaction", "free"].includes(fromSystem)) return fromSystem;

        return null;
    }

    getActionCount(item) {
        const count = Number(
            item?.actionCost?.value
            ?? item?.system?.actions?.value
            ?? item?.system?.actionCost?.value
            ?? NaN,
        );
        if (!Number.isFinite(count) || count <= 0) return "";
        return count;
    }

    getActionTraits(item) {
        const traits = item?.system?.traits?.value;
        if (!Array.isArray(traits) || traits.length === 0) return "";

        const localized = traits
            .map((slug) => this.localizeActionTrait(slug))
            .filter((label) => label.length > 0);
        return localized.join(", ");
    }

    localizeActionTrait(slug) {
        const key = String(slug ?? "").trim();
        if (!key) return "";
        const traitConfigs = [
            CONFIG.PF2E?.actionTraits,
            CONFIG.PF2E?.featTraits,
            CONFIG.PF2E?.weaponTraits,
            CONFIG.PF2E?.spellTraits,
            CONFIG.PF2E?.otherArmorTags,
        ];
        for (const cfg of traitConfigs) {
            const i18nKey = cfg?.[key];
            if (typeof i18nKey === "string" && i18nKey.length > 0) {
                const localized = game.i18n.localize(i18nKey);
                if (localized && localized !== i18nKey) return localized;
            }
        }
        return key;
    }

    getActionSourcePage(item) {
        const page = item?.system?.publication?.pages ?? item?.system?.publication?.page ?? "";
        return page ? String(page) : "";
    }

    async getActionTrigger(item) {
        const actionType = this.getActionType(item) ?? "action";
        return (await this.getActionTriggerAndEffects(item, actionType)).trigger;
    }

    async getActionEffects(item) {
        const actionType = this.getActionType(item) ?? "action";
        return (await this.getActionTriggerAndEffects(item, actionType)).effects;
    }

    async getActionTriggerAndEffects(item, actionType = "action") {
        const explicitTrigger = item?.system?.trigger?.value ?? item?.system?.requirements?.value ?? "";
        const descriptionHtml = item?.system?.description?.value ?? "";
        const descriptionText = await this.normalizeActionDescription(this.htmlToText(descriptionHtml));

        let parsedTrigger = "";
        let effectsText = descriptionText;

        const triggerMatch = descriptionText.match(
            /^\s*(?:\u0442\u0440\u0438\u0433\u0433\u0435\u0440|trigger|\u0443\u0441\u043b\u043e\u0432\u0438\u0435|condition|\u0442\u0440\u0435\u0431\u043e\u0432\u0430\u043d\u0438\u044f|requirements?)\s*[:\-]\s*([\s\S]+)$/i,
        );
        if (triggerMatch) {
            const split = this.splitFirstSentence(triggerMatch[1]);
            parsedTrigger = split.first;
            effectsText = split.rest;
            }

        const triggerSource = explicitTrigger || parsedTrigger;
        // Keep full meaning: do not summarize, only compact whitespace and remove markup noise.
        const triggerText = this.compactActionText(triggerSource, 2000);
        const effectText = this.compactActionText(effectsText, 4000);

        return {
            trigger: triggerText,
            effects: effectText,
        };
    }

    async normalizeActionDescription(text) {
        let normalized = String(text ?? "");
        normalized = await this.replaceInlineTagsWithLabels(normalized);

        // Defensive cleanup in case raw compendium identifiers remain in text.
        normalized = normalized.replace(/\bCompendium\.[A-Za-z0-9_.-]+\b/g, "");

        return normalized
            .replace(/\r/g, "")
            .replace(/\(\s*\)/g, "")
            .replace(/\s+([,.;:!?])/g, "$1")
            .replace(/\s{2,}/g, " ")
            .trim();
    }

    async replaceInlineTagsWithLabels(text) {
        const source = String(text ?? "");
        const tagRegex = /@([A-Za-z][\w-]*)\[([^\]]*)\](?:\{([^}]*)\})?/g;
        const chunks = [];
        let cursor = 0;
        let match = tagRegex.exec(source);

        while (match) {
            const [full, tag, ref, label] = match;
            chunks.push(source.slice(cursor, match.index));
            const cleanLabel = String(label ?? "").trim();
            if (cleanLabel.length) {
                chunks.push(cleanLabel);
            } else {
                chunks.push(await this.getInlineTagFallback(tag, ref));
            }
            cursor = match.index + full.length;
            match = tagRegex.exec(source);
        }

        chunks.push(source.slice(cursor));
        return chunks.join("");
    }

    async getInlineTagFallback(tag, ref) {
        const tagLower = String(tag ?? "").trim().toLowerCase();
        const refValue = String(ref ?? "").trim();
        if (!refValue) return "";

        if (tagLower === "trait") {
            const slug = refValue
                .split("|")[0]
                .split(",")[0]
                .split(".")
                .pop()
                .trim()
                .toLowerCase();
            return this.localizeActionTrait(slug);
        }

        if (tagLower === "localize") {
            const localized = game.i18n.localize(refValue);
            return localized && localized !== refValue ? localized : "";
        }

        if (tagLower === "uuid") {
            return await this.resolveUuidReferenceName(refValue);
        }

        if (tagLower === "compendium") {
            const normalizedRef = refValue.startsWith("Compendium.") ? refValue : `Compendium.${refValue}`;
            return await this.resolveUuidReferenceName(normalizedRef);
        }

        // Link-like tags should not leak raw identifiers into exported text.
        if (["check", "template", "damage", "action"].includes(tagLower)) {
            return "";
        }

        // Some tags can carry a readable value in the second pipe part.
        const pipeParts = refValue.split("|").map((part) => part.trim()).filter((part) => part.length > 0);
        if (pipeParts.length > 1) return pipeParts[1];

        return "";
    }

    async resolveUuidReferenceName(reference) {
        const raw = String(reference ?? "").split("|")[0].trim();
        if (!raw) return "";

        if (!this.inlineTagReferenceCache) this.inlineTagReferenceCache = new Map();
        if (this.inlineTagReferenceCache.has(raw)) {
            return this.inlineTagReferenceCache.get(raw);
        }

        let name = "";

        try {
            const docSync = typeof fromUuidSync === "function" ? fromUuidSync(raw) : null;
            if (docSync?.name) {
                name = String(docSync.name);
            }
        } catch (_error) {
            // no-op
        }

        if (!name) {
            try {
                const doc = typeof fromUuid === "function" ? await fromUuid(raw) : null;
                if (doc?.name) {
                    name = String(doc.name);
                }
            } catch (_error) {
                // no-op
            }
        }

        if (!name) {
            const match = raw.match(/^Compendium\.([^.]+\.[^.]+)\.(?:[A-Za-z]+\.|)([\w-]+)$/);
            if (match) {
                const packKey = match[1];
                const entryId = match[2];
                const pack = game.packs?.get(packKey);
                if (pack) {
                    try {
                        if (!pack.index?.size && typeof pack.getIndex === "function") {
                            await pack.getIndex();
                        }
                        const indexEntry = pack.index?.get(entryId);
                        if (indexEntry?.name) {
                            name = String(indexEntry.name);
                        }
                    } catch (_error) {
                        // no-op
                    }
                }
            }
        }

        this.inlineTagReferenceCache.set(raw, name);
        return name;
    }

    splitFirstSentence(text) {
        const normalized = String(text ?? "")
            .replace(/\r/g, "")
            .replace(/\n+/g, " ")
            .replace(/\s{2,}/g, " ")
            .trim();
        if (!normalized) return { first: "", rest: "" };

        const sentenceMatch = normalized.match(/^(.+?[.!?])(?:\s+|$)([\s\S]*)$/);
        if (sentenceMatch) {
            return {
                first: sentenceMatch[1].trim(),
                rest: (sentenceMatch[2] ?? "").trim(),
            };
        }

        return { first: normalized, rest: "" };
    }


    compactActionText(text, maxLength = 200) {
        const compact = String(text ?? "")
            .replace(/\r/g, "")
            .replace(/\n+/g, " ")
            .replace(/\s{2,}/g, " ")
            .trim();
        if (!compact) return "";
        if (compact.length <= maxLength) return compact;
        if (maxLength <= 3) return compact.slice(0, maxLength);
        return `${compact.slice(0, maxLength - 3).trim()}...`;
    }


    getInventoryItems() {
        const items = Array.isArray(this.actor.inventory?.contents)
            ? this.actor.inventory.contents
            : Array.isArray(this.actor.itemTypes?.physical)
                ? this.actor.itemTypes.physical
                : [];

        return [...items].sort((a, b) =>
            (Number(a?.sort ?? 0) - Number(b?.sort ?? 0))
            || String(a?.name ?? "").localeCompare(String(b?.name ?? ""), game.i18n.lang),
        );
    }

    getInventoryRow(item) {
        return {
            name: this.getInventoryItemName(item),
            bulk: this.getBulkLabel(item?.bulk ?? item?.system?.bulk?.value ?? null),
            invested: this.isItemInvested(item) ? "X" : "",
        };
    }

    getInventoryItemName(item) {
        const name = item?.name ?? "";
        const quantity = Number(item?.quantity ?? item?.system?.quantity ?? 1);
        return Number.isFinite(quantity) && quantity > 1 ? `${name} x${quantity}` : name;
    }

    isConsumableItem(item) {
        return item?.isOfType?.("consumable") || item?.type === "consumable";
    }

    isTreasureItem(item) {
        if (!(item?.isOfType?.("treasure") || item?.type === "treasure")) return false;
        return item?.isCurrency !== true;
    }

    isCurrencyTreasureItem(item) {
        if (!(item?.isOfType?.("treasure") || item?.type === "treasure")) return false;
        return item?.isCurrency === true;
    }

    isItemInContainer(item) {
        return item?.isInContainer || Boolean(item?.system?.containerId);
    }

    isItemStowed(item) {
        if (item?.isStowed) return true;
        const carryType = this.getItemCarryType(item);
        return carryType === "stowed" || carryType === "dropped";
    }

    isWornItem(item) {
        if (item?.isWorn) return true;
        const carryType = this.getItemCarryType(item);
        return ["worn", "implanted", "attached", "installed"].includes(carryType);
    }

    isHeldItem(item) {
        if (item?.isHeld) return true;
        return this.getItemCarryType(item) === "held";
    }

    isItemInvested(item) {
        if (item?.isInvested === true) return true;
        return item?.system?.equipped?.invested === true;
    }

    getItemCarryType(item) {
        return String(item?.carryType ?? item?.system?.equipped?.carryType ?? "");
    }

    getActorCurrency() {
        const inventoryCurrency = this.actor.inventory?.currency ?? this.actor.inventory?.coins;
        if (inventoryCurrency) return inventoryCurrency;

        const sourceCurrency = this.actor.system?.currency ?? this.actor.system?.currencies ?? {};
        return {
            cp: Number(sourceCurrency.cp?.value ?? sourceCurrency.cp ?? 0),
            sp: Number(sourceCurrency.sp?.value ?? sourceCurrency.sp ?? 0),
            gp: Number(sourceCurrency.gp?.value ?? sourceCurrency.gp ?? 0),
            pp: Number(sourceCurrency.pp?.value ?? sourceCurrency.pp ?? 0),
        };
    }

    getCurrencyAmount(currency, denomination) {
        const value = Number(currency?.[denomination] ?? 0);
        return Number.isFinite(value) ? value : 0;
    }

    getCoinsCopperValue(coins) {
        if (coins == null) return 0;
        if (typeof coins === "number") return Number.isFinite(coins) ? coins : 0;

        if (typeof coins.copperValue === "number" && Number.isFinite(coins.copperValue)) {
            return coins.copperValue;
        }

        const cp = Number(coins.cp ?? 0);
        const sp = Number(coins.sp ?? 0);
        const gp = Number(coins.gp ?? 0);
        const pp = Number(coins.pp ?? 0);
        return (Number.isFinite(cp) ? cp : 0)
            + (Number.isFinite(sp) ? sp * 10 : 0)
            + (Number.isFinite(gp) ? gp * 100 : 0)
            + (Number.isFinite(pp) ? pp * 1000 : 0);
    }

    formatCopperAsGold(copperValue) {
        if (!Number.isFinite(copperValue) || copperValue <= 0) return "";
        const valueInGold = copperValue / 100;
        return Number.isInteger(valueInGold)
            ? `${valueInGold} gp`
            : `${valueInGold.toFixed(2).replace(/\.?0+$/, "")} gp`;
    }

    getItemBulkValue(item) {
        return this.parseBulkValue(item?.bulk ?? item?.system?.bulk?.value ?? null);
    }

    parseBulkValue(value) {
        if (value == null) return 0;
        if (typeof value === "number") return Number.isFinite(value) ? Math.max(value, 0) : 0;
        if (typeof value === "string") {
            const trimmed = value.trim().toLowerCase();
            if (trimmed === "l") return 0.1;
            const numeric = Number(trimmed);
            return Number.isFinite(numeric) ? Math.max(numeric, 0) : 0;
        }
        if (typeof value.value === "number" && Number.isFinite(value.value)) {
            return Math.max(value.value, 0);
        }
        if (Number.isFinite(Number(value.normal)) || Number.isFinite(Number(value.light))) {
            const normal = Number(value.normal ?? 0);
            const light = Number(value.light ?? 0);
            return Math.max((Number.isFinite(normal) ? normal : 0) + (Number.isFinite(light) ? light / 10 : 0), 0);
        }
        return 0;
    }

    getBulkLabel(value) {
        if (value == null) return "";

        if (typeof value?.toString === "function") {
            const text = String(value.toString()).trim();
            if (text.length > 0 && text !== "[object Object]" && text !== "0") {
                return text;
            }
        }

        const numeric = this.parseBulkValue(value);
        if (numeric <= 0) return "";
        if (numeric < 1) return "L";
        if (Number.isInteger(numeric)) return String(numeric);
        return numeric.toFixed(1).replace(/\.0$/, "");
    }

    getPrimarySpellcastingEntry(entries) {
        const scoring = (entry) => Number(entry.statistic?.dc?.value ?? entry.system?.spelldc?.dc ?? 0);
        const preparedOrSpontaneous = entries.filter((entry) =>
            ["prepared", "spontaneous"].includes(entry.system?.prepared?.value),
        );
        if (preparedOrSpontaneous.length) {
            return [...preparedOrSpontaneous].sort((a, b) => scoring(b) - scoring(a))[0];
        }

        const nonSpecialized = entries.filter((entry) =>
            !["focus", "innate", "ritual", "items"].includes(entry.system?.prepared?.value),
        );
        if (nonSpecialized.length) {
            return [...nonSpecialized].sort((a, b) => scoring(b) - scoring(a))[0];
        }

        return entries[0] ?? null;
    }

    getEntrySpells(entry, spells) {
        if (!entry) return [];
        return spells.filter((spell) => {
            const location = spell.system?.location?.value;
            return location === entry.id || location === entry.uuid;
        });
    }

    getSpellRank(spell) {
        return Number(spell.system?.level?.value ?? spell.rank ?? 0);
    }

    isCantripSpell(spell) {
        if (!spell) return false;
        if (spell.isCantrip === true) return true;
        const traits = spell.system?.traits?.value;
        if (Array.isArray(traits) && traits.includes("cantrip")) return true;
        const category = spell.system?.category?.value ?? spell.system?.category;
        return category === "cantrip";
    }

    isFocusSpell(spell) {
        if (!spell) return false;
        if (spell.isFocusSpell === true) return true;
        const traits = spell.system?.traits?.value;
        return Array.isArray(traits) && traits.includes("focus");
    }

    getSpellActionLabel(spell) {
        return String(spell.system?.time?.value ?? spell.system?.time?.label ?? "").trim();
    }

    getSpellFrequencyLabel(spell) {
        const uses = spell.system?.location?.uses;
        if (!uses) return "∞";
        const value = uses.value ?? 0;
        const max = uses.max ?? 0;
        return max > 0 ? `${value}/${max}` : "∞";
    }

    getPreparedState(entry, spell) {
        const preparedType = entry.system?.prepared?.value;
        const rank = this.getSpellRank(spell);

        if (preparedType === "prepared") {
            const preparedSlots = entry.system?.slots?.[`slot${rank}`]?.prepared;
            if (!Array.isArray(preparedSlots)) return "";
            const forThisSpell = preparedSlots.filter((slot) => (slot?.id ?? slot?.uuid) === spell.id);
            if (!forThisSpell.length) return "";
            const available = forThisSpell.filter((slot) => !slot.expended).length;
            return `${available}/${forThisSpell.length}`;
        }

        if (preparedType === "spontaneous") {
            const slot = entry.system?.slots?.[`slot${rank}`];
            if (!slot || !Number.isFinite(Number(slot.max)) || Number(slot.max) <= 0) return "";
            return `${slot.value ?? 0}/${slot.max ?? 0}`;
        }

        return "";
    }

    splitRows(rows) {
        const midpoint = Math.ceil(rows.length / 2);
        return [rows.slice(0, midpoint), rows.slice(midpoint)];
    }

    joinRowValues(rows, key) {
        return rows.map((row) => row[key] ?? "").join("\n");
    }

    roundUpNumber(value) {
        return Number.isFinite(value) ? Math.ceil(value) : value;
    }

    formatResistanceBlockForRuSheet() {
        const immunities = Object.values(this.actor.system?.attributes?.immunities ?? {}).map(
            (immunity) => immunity.type,
        );
        const resistances = Object.values(this.actor.system?.attributes?.resistances ?? {}).map(
            (resistance) => `${resistance.type} ${resistance.value}`,
        );
        const weaknesses = Object.values(this.actor.system?.attributes?.weaknesses ?? {}).map(
            (weakness) => `${weakness.type} ${weakness.value}`,
        );

        const labels = game.i18n.lang?.startsWith("ru")
            ? {
                immunity: "Иммунитеты",
                resistance: "Сопротивления",
                weakness: "Слабости",
            }
            : {
                immunity: "Immunities",
                resistance: "Resistances",
                weakness: "Weaknesses",
            };

        return `${labels.immunity}: ${immunities.join(", ")}; ${labels.resistance}: ${resistances.join(", ")}; ${labels.weakness}: ${weaknesses.join(", ")}`;
    }
}

export default MappingClass;
