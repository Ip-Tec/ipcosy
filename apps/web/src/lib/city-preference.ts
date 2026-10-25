export const CITY_PREFERENCE_KEY = "ipcosy-city-sharing";
export type CityPreference = "ask" | "on" | "off";
export function readCityPreference(storage: Pick<Storage, "getItem">): CityPreference {
  try { const value = storage.getItem(CITY_PREFERENCE_KEY); return value === "on" || value === "off" ? value : "ask"; }
  catch { return "ask"; }
}
export function writeCityPreference(storage: Pick<Storage, "setItem">, value: "on" | "off") {
  try { storage.setItem(CITY_PREFERENCE_KEY, value); } catch { /* Sharing still works without persistent storage. */ }
}
