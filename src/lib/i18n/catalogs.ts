import enCommon from "@/locales/en/common.json";
import enStudent from "@/locales/en/student.json";
import enInstructor from "@/locales/en/instructor.json";
import enAdmin from "@/locales/en/admin.json";
import enDecisions from "@/locales/en/decisions.json";
import enReports from "@/locales/en/reports.json";

import esCommon from "@/locales/es/common.json";
import esStudent from "@/locales/es/student.json";
import esInstructor from "@/locales/es/instructor.json";
import esAdmin from "@/locales/es/admin.json";
import esDecisions from "@/locales/es/decisions.json";
import esReports from "@/locales/es/reports.json";

import type { Locale } from "./config";

/**
 * English is the source of truth for the key set: every namespace's
 * TypeScript type is derived from the `en` catalog, so adding a key to
 * `es` without adding it to `en` (or vice versa) is a type error at the
 * `t()` call site, not a runtime surprise.
 */
export const catalogs = {
  en: {
    common: enCommon,
    student: enStudent,
    instructor: enInstructor,
    admin: enAdmin,
    decisions: enDecisions,
    reports: enReports,
  },
  es: {
    common: esCommon,
    student: esStudent,
    instructor: esInstructor,
    admin: esAdmin,
    decisions: esDecisions,
    reports: esReports,
  },
} satisfies Record<Locale, Record<string, Record<string, string>>>;

export type EnCatalog = (typeof catalogs)["en"];
export type Namespace = keyof EnCatalog;
export type KeyOf<NS extends Namespace> = keyof EnCatalog[NS] & string;
